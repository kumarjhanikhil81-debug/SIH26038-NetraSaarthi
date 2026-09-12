"""
Modular Training and Validation Pipeline with Checkpointing for Diabetic Retinopathy.

Key Modules:
1. `CheckpointManager`:
   Persists model checkpoints (`best_model.pt` and `last_checkpoint.pt`), retaining
   weights, optimizer states, scheduler states, evaluated metrics, and training metadata.
2. `Trainer`:
   Coordinates epoch execution, automatic mixed precision, gradient clipping,
   learning rate scheduling, validation, and real-time metric evaluation.
3. Imbalance Handling Integration:
   Supports `WeightedRandomSampler` and class-weighted `CrossEntropyLoss`.
4. Transfer Learning Staging:
   Allows initial warm-up with frozen backbone before end-to-end fine-tuning.
"""

import argparse
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn as nn
# pyrefly: ignore [missing-import]
from torch.utils.data import DataLoader
from tqdm import tqdm

# pyrefly: ignore [missing-import]
from ml.dataset import (
    APTOSDataset,
    DR_CLASSES,
    create_stratified_split,
    get_weighted_sampler,
    compute_class_weights_for_loss
)
# pyrefly: ignore [missing-import]
from ml.model import build_model, EfficientNetB0ForDR
# pyrefly: ignore [missing-import]
from ml.preprocess import get_transforms
# pyrefly: ignore [missing-import]
from ml.metrics import (
    compute_all_metrics,
    format_metrics_summary,
    plot_and_save_confusion_matrix,
    DEFAULT_CLASS_NAMES
)


class CheckpointManager:
    """
    Manages saving and restoring model weights and optimizer checkpoints.
    """

    def __init__(
        self,
        checkpoint_dir: Union[str, Path] = "backend/ml/weights",
        metric_name: str = "f1_macro",
        mode: str = "max"
    ):
        """
        Args:
            checkpoint_dir: Directory where checkpoint `.pt` files are stored.
            metric_name: Validation metric to monitor ('f1_macro', 'quadratic_weighted_kappa', 'val_loss').
            mode: 'max' for metrics where higher is better, 'min' for loss.
        """
        self.checkpoint_dir = Path(checkpoint_dir)
        self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
        self.metric_name = metric_name
        self.mode = mode

        self.best_score = float("-inf") if mode == "max" else float("inf")
        self.best_checkpoint_path = self.checkpoint_dir / "best_model.pt"
        self.last_checkpoint_path = self.checkpoint_dir / "last_checkpoint.pt"

    def is_better(self, current_score: float) -> bool:
        """Determines if the current score outperforms previous best."""
        if self.mode == "max":
            return current_score > self.best_score
        return current_score < self.best_score

    def save(
        self,
        epoch: int,
        model: nn.Module,
        optimizer: torch.optim.Optimizer,
        scheduler: Optional[torch.optim.lr_scheduler._LRScheduler],
        metrics: Dict,
        model_config: Optional[Dict] = None
    ) -> bool:
        """
        Saves current state as `last_checkpoint.pt`, and if best score improves,
        saves to `best_model.pt`.

        Returns:
            True if this checkpoint set a new best score, False otherwise.
        """
        current_score = metrics.get(self.metric_name, 0.0)

        payload = {
            "epoch": epoch,
            "model_state_dict": model.state_dict(),
            "optimizer_state_dict": optimizer.state_dict(),
            "scheduler_state_dict": scheduler.state_dict() if scheduler else None,
            "best_score": self.best_score,
            "current_score": current_score,
            "metric_name": self.metric_name,
            "metrics": metrics,
            "class_names": list(DR_CLASSES.values()),
            "model_config": model_config or {}
        }

        # Always save last checkpoint for resumption
        torch.save(payload, self.last_checkpoint_path)

        # Check for improvement
        improved = self.is_better(current_score)
        if improved:
            self.best_score = current_score
            payload["best_score"] = self.best_score
            torch.save(payload, self.best_checkpoint_path)

        return improved

    def load_best(self, model: nn.Module, device: torch.device) -> Dict:
        """Loads the best model weights into the provided model instance."""
        if not self.best_checkpoint_path.is_file():
            raise FileNotFoundError(f"No best checkpoint found at {self.best_checkpoint_path}")
        checkpoint = torch.load(self.best_checkpoint_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        return checkpoint


class Trainer:
    """
    Modular training and validation harness.
    """

    def __init__(
        self,
        model: EfficientNetB0ForDR,
        train_loader: DataLoader,
        val_loader: DataLoader,
        criterion: nn.Module,
        optimizer: torch.optim.Optimizer,
        scheduler: Optional[torch.optim.lr_scheduler._LRScheduler] = None,
        device: Optional[torch.device] = None,
        checkpoint_manager: Optional[CheckpointManager] = None,
        clip_grad_norm: float = 1.0
    ):
        self.model = model
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.checkpoint_manager = checkpoint_manager
        self.clip_grad_norm = clip_grad_norm

        self.model.to(self.device)
        self.use_amp = (self.device.type == "cuda")
        self.scaler = torch.amp.GradScaler("cuda") if self.use_amp else None

    def train_epoch(self, epoch: int) -> float:
        """Executes one training epoch across all training batches."""
        self.model.train()
        total_loss = 0.0
        num_batches = len(self.train_loader)

        pbar = tqdm(self.train_loader, desc=f"Epoch {epoch:02d} [Train]", leave=False)
        for images, labels in pbar:
            images = images.to(self.device, non_blocking=True)
            labels = labels.to(self.device, non_blocking=True)

            self.optimizer.zero_grad(set_to_none=True)

            # Mixed precision training
            if self.use_amp:
                with torch.amp.autocast("cuda"):
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)
                self.scaler.scale(loss).backward()
                if self.clip_grad_norm > 0:
                    self.scaler.unscale_(self.optimizer)
                    nn.utils.clip_grad_norm_(self.model.parameters(), self.clip_grad_norm)
                self.scaler.step(self.optimizer)
                self.scaler.update()
            else:
                outputs = self.model(images)
                loss = self.criterion(outputs, labels)
                loss.backward()
                if self.clip_grad_norm > 0:
                    nn.utils.clip_grad_norm_(self.model.parameters(), self.clip_grad_norm)
                self.optimizer.step()

            batch_loss = loss.item()
            total_loss += batch_loss
            pbar.set_postfix({"loss": f"{batch_loss:.4f}"})

        return total_loss / max(num_batches, 1)

    def validate_epoch(self, epoch: int) -> Tuple[float, Dict]:
        """
        Executes validation epoch, collecting all predictions to compute
        empirical clinical metrics (accuracy, precision, recall, F1, QWK, confusion matrix).
        """
        self.model.eval()
        total_loss = 0.0
        all_preds = []
        all_targets = []
        num_batches = len(self.val_loader)

        pbar = tqdm(self.val_loader, desc=f"Epoch {epoch:02d} [Valid]", leave=False)
        with torch.no_grad():
            for images, labels in pbar:
                images = images.to(self.device, non_blocking=True)
                labels = labels.to(self.device, non_blocking=True)

                if self.use_amp:
                    with torch.amp.autocast("cuda"):
                        outputs = self.model(images)
                        loss = self.criterion(outputs, labels)
                else:
                    outputs = self.model(images)
                    loss = self.criterion(outputs, labels)

                total_loss += loss.item()
                preds = torch.argmax(outputs, dim=1)

                all_preds.extend(preds.cpu().numpy().tolist())
                all_targets.extend(labels.cpu().numpy().tolist())

        avg_loss = total_loss / max(num_batches, 1)

        # Compute empirical metrics from actual outputs
        metrics = compute_all_metrics(all_targets, all_preds, num_classes=self.model.num_classes)
        metrics["val_loss"] = avg_loss

        return avg_loss, metrics

    def fit(self, epochs: int, freeze_backbone_epochs: int = 0) -> Dict:
        """
        Runs the full training loop with optional backbone freeze warm-up.

        Args:
            epochs: Total epochs to train.
            freeze_backbone_epochs: Number of initial epochs to keep backbone frozen.

        Returns:
            Dictionary with training history and final evaluation results.
        """
        history = {
            "train_loss": [],
            "val_loss": [],
            "val_accuracy": [],
            "val_f1_macro": [],
            "val_qwk": []
        }

        # Stage 1: Freeze backbone if requested
        if freeze_backbone_epochs > 0:
            print(f"[*] Freezing EfficientNet-B0 backbone for first {freeze_backbone_epochs} epoch(s)...")
            self.model.freeze_backbone()

        for epoch in range(1, epochs + 1):
            # Unfreeze when warm-up completes
            if freeze_backbone_epochs > 0 and epoch == freeze_backbone_epochs + 1:
                print("[*] Unfreezing EfficientNet-B0 backbone for end-to-end fine-tuning...")
                self.model.unfreeze_backbone()

            train_loss = self.train_epoch(epoch)
            val_loss, val_metrics = self.validate_epoch(epoch)

            # Adjust learning rate scheduler
            if self.scheduler is not None:
                if isinstance(self.scheduler, torch.optim.lr_scheduler.ReduceLROnPlateau):
                    self.scheduler.step(val_loss)
                else:
                    self.scheduler.step()

            # Record history
            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            history["val_accuracy"].append(val_metrics["accuracy"])
            history["val_f1_macro"].append(val_metrics["f1_macro"])
            history["val_qwk"].append(val_metrics["quadratic_weighted_kappa"])

            # Checkpoint management
            saved_as_best = False
            if self.checkpoint_manager is not None:
                saved_as_best = self.checkpoint_manager.save(
                    epoch=epoch,
                    model=self.model,
                    optimizer=self.optimizer,
                    scheduler=self.scheduler,
                    metrics=val_metrics,
                    model_config={"num_classes": self.model.num_classes}
                )

            best_tag = " [NEW BEST SAVED]" if saved_as_best else ""
            print(
                f"Epoch {epoch:02d}/{epochs:02d} | "
                f"Train Loss: {train_loss:.4f} | "
                f"Val Loss: {val_loss:.4f} | "
                f"Val Acc: {val_metrics['accuracy']:.4f} | "
                f"Val F1 (Macro): {val_metrics['f1_macro']:.4f} | "
                f"Val QWK: {val_metrics['quadratic_weighted_kappa']:.4f}{best_tag}"
            )

        return history


def build_pipeline(
    csv_path: str,
    img_dir: str,
    val_size: float = 0.2,
    batch_size: int = 16,
    img_size: int = 224,
    imbalance_method: str = "sampler",
    num_workers: int = 0,
    random_state: int = 42
) -> Tuple[DataLoader, DataLoader, Optional[torch.Tensor]]:
    """
    Constructs DataLoaders and handles class imbalance.

    Args:
        csv_path: Path to CSV with `id_code` and `diagnosis`.
        img_dir: Path to directory of images.
        val_size: Fraction for validation split.
        batch_size: DataLoader batch size.
        img_size: Preprocessed image resolution (224 for EfficientNet-B0).
        imbalance_method: 'sampler', 'loss_weights', 'both', or 'none'.
        num_workers: DataLoader background workers.
        random_state: Seed for stratified split.

    Returns:
        Tuple of (train_loader, val_loader, loss_class_weights_tensor).
    """
    train_df, val_df = create_stratified_split(csv_path, val_size=val_size, random_state=random_state)
    print(f"[*] Split complete: {len(train_df)} training samples, {len(val_df)} validation samples.")

    # Build transforms
    train_transform = get_transforms(img_size=img_size, is_train=True, use_ben_graham=True)
    val_transform = get_transforms(img_size=img_size, is_train=False, use_ben_graham=True)

    train_dataset = APTOSDataset(train_df, img_dir, transform=train_transform)
    val_dataset = APTOSDataset(val_df, img_dir, transform=val_transform)

    # Imbalance handling
    sampler = None
    loss_weights = None

    if imbalance_method in ["sampler", "both"]:
        sampler = get_weighted_sampler(train_df)
        print("[*] WeightedRandomSampler enabled for training DataLoader.")

    if imbalance_method in ["loss_weights", "both"]:
        loss_weights = compute_class_weights_for_loss(train_df, num_classes=5)
        print(f"[*] Class weights computed for CrossEntropyLoss: {loss_weights.numpy().round(3)}")

    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        sampler=sampler,
        shuffle=(sampler is None),
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )

    val_loader = DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )

    return train_loader, val_loader, loss_weights


def main():
    parser = argparse.ArgumentParser(description="Train EfficientNet-B0 on APTOS 2019 Diabetic Retinopathy")
    parser.add_argument("--csv_path", type=str, required=True, help="Path to train.csv")
    parser.add_argument("--img_dir", type=str, required=True, help="Directory containing fundus images")
    parser.add_argument("--epochs", type=int, default=10, help="Total training epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=1e-4, help="Base learning rate")
    parser.add_argument("--img_size", type=int, default=224, help="Target image size (224 for B0)")
    parser.add_argument("--val_split", type=float, default=0.2, help="Validation split ratio")
    parser.add_argument("--imbalance_method", type=str, default="sampler",
                        choices=["sampler", "loss_weights", "both", "none"],
                        help="Class imbalance mitigation technique")
    parser.add_argument("--checkpoint_dir", type=str, default="backend/ml/weights",
                        help="Directory to save model weights")
    parser.add_argument("--freeze_epochs", type=int, default=1,
                        help="Number of epochs to freeze backbone")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    # Reproducibility
    torch.manual_seed(args.seed)
    np.random.seed(args.seed)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[*] Using computation device: {device}")

    # Build DataLoaders
    train_loader, val_loader, loss_weights = build_pipeline(
        csv_path=args.csv_path,
        img_dir=args.img_dir,
        val_size=args.val_split,
        batch_size=args.batch_size,
        img_size=args.img_size,
        imbalance_method=args.imbalance_method,
        random_state=args.seed
    )

    # Initialize EfficientNet-B0
    model = build_model(num_classes=5, pretrained=True, dropout_rate=0.4, device=device)

    # Loss criterion
    if loss_weights is not None:
        loss_weights = loss_weights.to(device)
        criterion = nn.CrossEntropyLoss(weight=loss_weights)
    else:
        criterion = nn.CrossEntropyLoss()

    # Optimizer with differential learning rates
    param_groups = model.get_parameter_groups(
        lr_backbone=args.lr * 0.1,
        lr_head=args.lr,
        weight_decay=1e-4
    )
    optimizer = torch.optim.AdamW(param_groups)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs, eta_min=1e-6)

    checkpoint_manager = CheckpointManager(
        checkpoint_dir=args.checkpoint_dir,
        metric_name="f1_macro",
        mode="max"
    )

    trainer = Trainer(
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        criterion=criterion,
        optimizer=optimizer,
        scheduler=scheduler,
        device=device,
        checkpoint_manager=checkpoint_manager
    )

    print(f"[*] Starting training for {args.epochs} epochs...")
    history = trainer.fit(epochs=args.epochs, freeze_backbone_epochs=args.freeze_epochs)

    # Load best checkpoint and print final empirical evaluation
    best_chk = checkpoint_manager.load_best(model, device)
    print("\n" + format_metrics_summary(best_chk["metrics"]))

    # Save confusion matrix heatmap
    cm_path = Path(args.checkpoint_dir) / "val_confusion_matrix.png"
    plot_and_save_confusion_matrix(best_chk["metrics"]["confusion_matrix"], save_path=cm_path)
    print(f"[*] Confusion matrix plot saved to: {cm_path}")


if __name__ == "__main__":
    main()
