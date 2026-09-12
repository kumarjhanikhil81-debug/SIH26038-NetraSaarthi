"""
End-to-End Verification Test for Diabetic Retinopathy Classification Pipeline.

Generates a verified synthetic fundus dataset covering all 5 APTOS classes,
validates every modular component (loader, preprocessing, sampling, training,
validation, metrics, checkpointing, evaluation, prediction, and Grad-CAM),
and outputs ONLY the empirical evaluation metrics actually obtained.
"""

import os
import shutil
import tempfile
from pathlib import Path

# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw
# pyrefly: ignore [missing-import]
import torch

# pyrefly: ignore [missing-import]
from ml.preprocess import crop_retina_image, apply_ben_graham_enhancement, get_transforms
# pyrefly: ignore [missing-import]
from ml.dataset import (
    APTOSDataset,
    create_stratified_split,
    get_weighted_sampler,
    compute_class_weights_for_loss,
    DR_CLASSES
)
# pyrefly: ignore [missing-import]
from ml.model import build_model
# pyrefly: ignore [missing-import]
from ml.metrics import compute_all_metrics, format_metrics_summary, plot_and_save_confusion_matrix
# pyrefly: ignore [missing-import]
from ml.train import CheckpointManager, Trainer, build_pipeline
# pyrefly: ignore [missing-import]
from ml.evaluate import evaluate_checkpoint
# pyrefly: ignore [missing-import]
from ml.predict import DRPredictor
# pyrefly: ignore [missing-import]
from ml.explain import GradCAM


def create_mock_fundus_image(class_id: int, size: int = 256) -> Image.Image:
    """
    Creates a synthetic fundus-like image with a circular retina and class-specific lesions.
    """
    img = Image.new("RGB", (size, size), (5, 5, 5))
    draw = ImageDraw.Draw(img)

    # Fundus orange/red base disc
    center = size // 2
    radius = int(size * 0.42)
    draw.ellipse(
        [center - radius, center - radius, center + radius, center + radius],
        fill=(180, 70, 30)
    )

    # Optic disc (yellowish)
    od_x, od_y = int(center - radius * 0.4), center
    draw.ellipse([od_x - 18, od_y - 18, od_x + 18, od_y + 18], fill=(240, 220, 120))

    # Add class-specific simulated lesions
    np.random.seed(class_id * 100 + 42)
    if class_id >= 1:
        # Microaneurysms (red dots)
        for _ in range(4 * class_id):
            rx = int(center + np.random.uniform(-radius * 0.6, radius * 0.6))
            ry = int(center + np.random.uniform(-radius * 0.6, radius * 0.6))
            draw.ellipse([rx - 2, ry - 2, rx + 2, ry + 2], fill=(120, 10, 10))

    if class_id >= 2:
        # Hard exudates (yellow flecks)
        for _ in range(3 * class_id):
            ex = int(center + np.random.uniform(-radius * 0.5, radius * 0.5))
            ey = int(center + np.random.uniform(-radius * 0.5, radius * 0.5))
            draw.ellipse([ex - 4, ey - 4, ex + 4, ey + 4], fill=(250, 240, 150))

    if class_id >= 3:
        # Blot hemorrhages
        for _ in range(4):
            bx = int(center + np.random.uniform(-radius * 0.6, radius * 0.6))
            by = int(center + np.random.uniform(-radius * 0.6, radius * 0.6))
            draw.ellipse([bx - 8, by - 6, bx + 8, by + 6], fill=(100, 5, 5))

    if class_id == 4:
        # Neovascularization (branching lines)
        for _ in range(3):
            nx = int(center + np.random.uniform(-radius * 0.4, radius * 0.4))
            ny = int(center + np.random.uniform(-radius * 0.4, radius * 0.4))
            draw.line([(nx, ny), (nx + 15, ny + 10), (nx + 25, ny - 5)], fill=(150, 15, 15), width=2)

    return img


def run_full_verification():
    print("=" * 60)
    print("STARTING PYTORCH DR PIPELINE END-TO-END VERIFICATION")
    print("=" * 60)

    temp_dir = Path(tempfile.mkdtemp(prefix="aptos_test_"))
    try:
        img_dir = temp_dir / "images"
        img_dir.mkdir(parents=True)
        checkpoint_dir = temp_dir / "weights"
        checkpoint_dir.mkdir(parents=True)

        # 1. Generate Synthetic Dataset (20 samples per class = 100 total samples)
        records = []
        sample_idx = 0
        for class_id in range(5):
            for _ in range(12):  # 12 samples per class = 60 total
                id_code = f"sample_{sample_idx:04d}"
                img_path = img_dir / f"{id_code}.png"
                img = create_mock_fundus_image(class_id)
                img.save(img_path)
                records.append({"id_code": id_code, "diagnosis": class_id})
                sample_idx += 1

        csv_path = temp_dir / "train.csv"
        df = pd.DataFrame(records)
        df.to_csv(csv_path, index=False)
        print(f"[+] Step 1: Created test dataset with {len(df)} images across 5 classes.")

        # 2. Test Preprocessing
        sample_img = Image.open(img_dir / "sample_0000.png")
        cropped = crop_retina_image(sample_img)
        enhanced = apply_ben_graham_enhancement(cropped)
        train_transforms = get_transforms(img_size=224, is_train=True, use_ben_graham=True)
        transformed_tensor = train_transforms(sample_img)
        assert transformed_tensor.shape == (3, 224, 224), f"Unexpected shape: {transformed_tensor.shape}"
        print(f"[+] Step 2: Preprocessing verified (Auto-crop, Ben Graham, Transforms -> {transformed_tensor.shape}).")

        # 3. Test Stratified Split and Class Imbalance Handling
        train_df, val_df = create_stratified_split(csv_path, val_size=0.25, random_state=42)
        assert len(train_df) == 45 and len(val_df) == 15
        sampler = get_weighted_sampler(train_df)
        loss_weights = compute_class_weights_for_loss(train_df, num_classes=5)
        print(f"[+] Step 3: Stratified split verified (Train: {len(train_df)}, Val: {len(val_df)}).")
        print(f"    WeightedRandomSampler and loss weights {loss_weights.numpy().round(3)} computed.")

        # 4. Test Model Architecture
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[+] Step 4: Initializing EfficientNet-B0 on {device}...")
        model = build_model(num_classes=5, pretrained=False, device=device)
        dummy_input = torch.randn(2, 3, 224, 224, device=device)
        dummy_out = model(dummy_input)
        assert dummy_out.shape == (2, 5), f"Model output shape mismatch: {dummy_out.shape}"
        print(f"    Forward pass verified -> Logits shape: {dummy_out.shape}.")

        # 5. Test Training Loop & Checkpointing
        train_loader, val_loader, _ = build_pipeline(
            csv_path=str(csv_path),
            img_dir=str(img_dir),
            val_size=0.25,
            batch_size=8,
            img_size=224,
            imbalance_method="sampler"
        )

        criterion = torch.nn.CrossEntropyLoss()
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=2)
        chk_manager = CheckpointManager(checkpoint_dir=checkpoint_dir, metric_name="f1_macro", mode="max")

        trainer = Trainer(
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            criterion=criterion,
            optimizer=optimizer,
            scheduler=scheduler,
            device=device,
            checkpoint_manager=chk_manager
        )

        print("[+] Step 5: Executing 2 training epochs with validation...")
        history = trainer.fit(epochs=2, freeze_backbone_epochs=1)
        assert (checkpoint_dir / "best_model.pt").is_file(), "best_model.pt not created!"
        assert (checkpoint_dir / "last_checkpoint.pt").is_file(), "last_checkpoint.pt not created!"
        print("    Model checkpoints successfully created and verified.")

        # 6. Test Standalone Evaluation Script
        print("[+] Step 6: Running standalone evaluation on saved checkpoint...")
        val_csv_path = temp_dir / "val_subset.csv"
        val_df.to_csv(val_csv_path, index=False)
        metrics = evaluate_checkpoint(
            checkpoint_path=str(checkpoint_dir / "best_model.pt"),
            csv_path=str(val_csv_path),
            img_dir=str(img_dir),
            batch_size=8,
            device=device,
            output_dir=str(checkpoint_dir)
        )

        # 7. Test Single Image Inference
        print("[+] Step 7: Testing DRPredictor inference...")
        predictor = DRPredictor(checkpoint_path=str(checkpoint_dir / "best_model.pt"), device=device)
        test_img_path = img_dir / "sample_0005.png"
        pred_res = predictor.predict(test_img_path)
        print(f"    Inference result: Class {pred_res['prediction']} ({pred_res['grade_name']}), Confidence: {pred_res['confidence']*100:.2f}%")

        # 8. Test Explainability (Grad-CAM)
        print("[+] Step 8: Testing Grad-CAM visual explanation...")
        grad_cam = GradCAM(model)
        prep_transforms = get_transforms(img_size=224, is_train=False, use_ben_graham=True)
        img_tensor = prep_transforms(sample_img).unsqueeze(0).to(device)
        heatmap = grad_cam.generate_heatmap(img_tensor, target_class=pred_res["prediction"])
        assert heatmap.shape == (7, 7) or heatmap.ndim == 2
        overlay = grad_cam.overlay_heatmap(sample_img, heatmap)
        assert isinstance(overlay, Image.Image)
        print(f"    Grad-CAM heatmap generated successfully (Shape: {heatmap.shape}).")

        # 9. Copy best model and sample artifacts to workspace backend/ml/weights
        workspace_weights_dir = Path("backend/ml/weights")
        workspace_weights_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy(checkpoint_dir / "best_model.pt", workspace_weights_dir / "best_model.pt")
        shutil.copy(checkpoint_dir / "evaluation_metrics.json", workspace_weights_dir / "evaluation_metrics.json")
        shutil.copy(checkpoint_dir / "evaluation_confusion_matrix.png", workspace_weights_dir / "evaluation_confusion_matrix.png")
        print(f"[+] Saved checkpoint and artifacts to: {workspace_weights_dir.resolve()}")

        print("\n" + "=" * 60)
        print("EMPIRICAL EVALUATION METRICS OBTAINED FROM RUN:")
        print("=" * 60)
        print(format_metrics_summary(metrics))

    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    run_full_verification()
