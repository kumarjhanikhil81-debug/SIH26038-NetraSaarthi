"""
Model Evaluation and Clinical Validation Script for Diabetic Retinopathy.

Evaluates an existing checkpoint (`best_model.pt`) on a validation or test set
and computes empirical metrics:
- Overall Accuracy
- Macro & Weighted Precision
- Macro & Weighted Recall (Clinical Sensitivity)
- Macro & Weighted F1-Score
- Quadratic Weighted Kappa (QWK)
- 5x5 Confusion Matrix

Outputs a formatted clinical report and confusion matrix heatmap.
"""

import argparse
import json
from pathlib import Path
from typing import Dict, Optional

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
from ml.dataset import APTOSDataset, DR_CLASSES
# pyrefly: ignore [missing-import]
from ml.model import build_model
# pyrefly: ignore [missing-import]
from ml.preprocess import get_transforms
# pyrefly: ignore [missing-import]
from ml.metrics import (
    compute_all_metrics,
    format_metrics_summary,
    plot_and_save_confusion_matrix
)


def evaluate_checkpoint(
    checkpoint_path: str,
    csv_path: str,
    img_dir: str,
    batch_size: int = 16,
    img_size: int = 224,
    device: Optional[torch.device] = None,
    output_dir: Optional[str] = None
) -> Dict:
    """
    Evaluates a saved PyTorch model checkpoint on the specified dataset.

    Args:
        checkpoint_path: Path to `.pt` checkpoint file.
        csv_path: Path to CSV with `id_code` and `diagnosis`.
        img_dir: Path to image directory.
        batch_size: Batch size for evaluation DataLoader.
        img_size: Image resolution (224 for EfficientNet-B0).
        device: Device to run evaluation on.
        output_dir: Optional directory to save metrics JSON and confusion matrix PNG.

    Returns:
        Dictionary containing empirical metrics obtained strictly from evaluation.
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    chk_path = Path(checkpoint_path)
    if not chk_path.is_file():
        raise FileNotFoundError(f"Checkpoint not found at: {checkpoint_path}")

    print(f"[*] Loading checkpoint from: {chk_path}")
    checkpoint = torch.load(chk_path, map_location=device, weights_only=False)

    num_classes = checkpoint.get("model_config", {}).get("num_classes", 5)

    # Initialize model architecture and restore weights
    model = build_model(num_classes=num_classes, pretrained=False, device=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Preprocessing transform for evaluation
    val_transform = get_transforms(img_size=img_size, is_train=False, use_ben_graham=True)
    dataset = APTOSDataset(csv_path, img_dir, transform=val_transform)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    criterion = nn.CrossEntropyLoss()
    total_loss = 0.0
    all_preds = []
    all_targets = []

    print(f"[*] Evaluating {len(dataset)} samples on {device}...")
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Evaluating"):
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()

            preds = torch.argmax(outputs, dim=1)
            all_preds.extend(preds.cpu().numpy().tolist())
            all_targets.extend(labels.cpu().numpy().tolist())

    avg_loss = total_loss / max(len(loader), 1)

    # Compute actual empirical metrics
    metrics = compute_all_metrics(all_targets, all_preds, num_classes=num_classes)
    metrics["loss"] = avg_loss

    # Output formatted report
    print("\n" + format_metrics_summary(metrics))

    # Save artifacts if output directory is provided
    if output_dir:
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        json_file = out_path / "evaluation_metrics.json"
        with open(json_file, "w") as f:
            json.dump(metrics, f, indent=2)
        print(f"[*] Evaluation metrics saved to: {json_file}")

        cm_file = out_path / "evaluation_confusion_matrix.png"
        plot_and_save_confusion_matrix(metrics["confusion_matrix"], save_path=cm_file)
        print(f"[*] Confusion matrix plot saved to: {cm_file}")

    return metrics


def main():
    parser = argparse.ArgumentParser(description="Evaluate Diabetic Retinopathy Model Checkpoint")
    parser.add_argument("--checkpoint", type=str, default="backend/ml/weights/best_model.pt",
                        help="Path to trained .pt checkpoint")
    parser.add_argument("--csv_path", type=str, required=True, help="Path to evaluation CSV")
    parser.add_argument("--img_dir", type=str, required=True, help="Directory containing evaluation images")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--img_size", type=int, default=224, help="Image resolution")
    parser.add_argument("--output_dir", type=str, default="backend/ml/weights",
                        help="Directory to save evaluation artifacts")
    args = parser.parse_args()

    evaluate_checkpoint(
        checkpoint_path=args.checkpoint,
        csv_path=args.csv_path,
        img_dir=args.img_dir,
        batch_size=args.batch_size,
        img_size=args.img_size,
        output_dir=args.output_dir
    )


if __name__ == "__main__":
    main()
