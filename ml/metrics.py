"""
Clinical Evaluation Metrics for Diabetic Retinopathy Classification.

Key Metrics Evaluated:
1. Overall Multi-class Accuracy: Total correct predictions over total samples.
2. Precision (Macro & Weighted): Positive predictive value across severity grades.
3. Recall (Macro & Weighted): Sensitivity / detection rate across severity grades.
4. F1-Score (Macro & Weighted): Harmonic mean of precision and recall.
5. Quadratic Weighted Kappa (QWK):
   The clinical standard for Diabetic Retinopathy grading competitions (APTOS / Kaggle).
   Penalizes distance between ordinal severity grades quadratically:
   e.g., misclassifying Grade 0 as Grade 4 incurs a much heavier penalty than Grade 0 as Grade 1.
6. 5x5 Confusion Matrix:
   Full cross-tabulation of true clinical diagnoses against model predictions.

Rule: All metrics are computed strictly from empirical model evaluation without synthetic data.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend for headless execution
# pyrefly: ignore [missing-import]
import matplotlib.pyplot as plt
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    cohen_kappa_score,
    confusion_matrix,
    classification_report
)

DEFAULT_CLASS_NAMES = ["No DR", "Mild", "Moderate", "Severe", "Proliferative DR"]


def compute_all_metrics(
    y_true: Union[np.ndarray, List[int]],
    y_pred: Union[np.ndarray, List[int]],
    class_names: Optional[List[str]] = None,
    num_classes: int = 5
) -> Dict:
    """
    Computes comprehensive evaluation metrics from true and predicted labels.

    Args:
        y_true: Ground truth integer class labels (0 to num_classes - 1).
        y_pred: Model predicted integer class labels (0 to num_classes - 1).
        class_names: Optional list of human-readable class names.
        num_classes: Total number of classes (default: 5).

    Returns:
        Dictionary containing all empirical evaluation metrics.
    """
    y_true = np.asarray(y_true, dtype=np.int64)
    y_pred = np.asarray(y_pred, dtype=np.int64)

    if class_names is None:
        class_names = DEFAULT_CLASS_NAMES[:num_classes]

    labels_list = list(range(num_classes))

    # 1. Primary Metrics
    acc = float(accuracy_score(y_true, y_pred))
    prec_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    prec_weighted = float(precision_score(y_true, y_pred, average="weighted", zero_division=0))
    rec_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    rec_weighted = float(recall_score(y_true, y_pred, average="weighted", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    f1_weighted = float(f1_score(y_true, y_pred, average="weighted", zero_division=0))

    # 2. Quadratic Weighted Kappa (standard for ordinal retinopathy classification)
    try:
        qwk = float(cohen_kappa_score(y_true, y_pred, weights="quadratic", labels=labels_list))
    except Exception:
        qwk = 0.0

    # 3. 5x5 Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=labels_list)

    # 4. Detailed Per-Class Breakdown
    clf_report = classification_report(
        y_true,
        y_pred,
        labels=labels_list,
        target_names=class_names,
        output_dict=True,
        zero_division=0
    )

    per_class = {}
    for idx, cname in enumerate(class_names):
        if cname in clf_report:
            per_class[cname] = {
                "precision": float(clf_report[cname]["precision"]),
                "recall": float(clf_report[cname]["recall"]),
                "f1_score": float(clf_report[cname]["f1-score"]),
                "support": int(clf_report[cname]["support"])
            }

    return {
        "accuracy": acc,
        "precision_macro": prec_macro,
        "precision_weighted": prec_weighted,
        "recall_macro": rec_macro,
        "recall_weighted": rec_weighted,
        "f1_macro": f1_macro,
        "f1_weighted": f1_weighted,
        "quadratic_weighted_kappa": qwk,
        "confusion_matrix": cm.tolist(),
        "per_class": per_class,
        "total_samples": len(y_true)
    }


def format_metrics_summary(metrics: Dict) -> str:
    """
    Renders a human-readable text summary of evaluation metrics.

    Args:
        metrics: Dictionary returned by `compute_all_metrics`.

    Returns:
        Formatted string table.
    """
    lines = [
        "=" * 64,
        "           DIABETIC RETINOPATHY EVALUATION REPORT",
        "=" * 64,
        f"Total Samples Evaluated: {metrics.get('total_samples', 'N/A')}",
        f"Overall Accuracy:        {metrics.get('accuracy', 0.0):.4f} ({metrics.get('accuracy', 0.0)*100:.2f}%)",
        f"Quadratic Weighted Kappa:{metrics.get('quadratic_weighted_kappa', 0.0):.4f}",
        f"Macro F1-Score:          {metrics.get('f1_macro', 0.0):.4f}",
        f"Weighted F1-Score:       {metrics.get('f1_weighted', 0.0):.4f}",
        f"Macro Precision:         {metrics.get('precision_macro', 0.0):.4f}",
        f"Macro Recall (Sens.):    {metrics.get('recall_macro', 0.0):.4f}",
        "-" * 64,
        f"{'Class':<22} | {'Precision':<10} | {'Recall':<10} | {'F1':<10} | {'Support':<8}",
        "-" * 64
    ]

    per_class = metrics.get("per_class", {})
    for cname, stats in per_class.items():
        lines.append(
            f"{cname:<22} | {stats['precision']:<10.4f} | {stats['recall']:<10.4f} | "
            f"{stats['f1_score']:<10.4f} | {stats['support']:<8d}"
        )

    lines.append("=" * 64)
    lines.append("Confusion Matrix (Rows: True, Cols: Predicted):")
    cm = np.array(metrics.get("confusion_matrix", []))
    if cm.size > 0:
        lines.append(np.array2string(cm, separator=", "))
    lines.append("=" * 64)

    return "\n".join(lines)


def plot_and_save_confusion_matrix(
    cm: Union[np.ndarray, List[List[int]]],
    class_names: Optional[List[str]] = None,
    save_path: Optional[Union[str, Path]] = None,
    title: str = "Diabetic Retinopathy Confusion Matrix"
) -> plt.Figure:
    """
    Visualizes and saves the 5x5 confusion matrix heatmap.

    Args:
        cm: Confusion matrix array or list of lists.
        class_names: Labels for the 5 DR severity stages.
        save_path: Destination path to save PNG figure.
        title: Title for the heatmap plot.

    Returns:
        matplotlib.figure.Figure object.
    """
    cm = np.asarray(cm)
    if class_names is None:
        class_names = DEFAULT_CLASS_NAMES[:cm.shape[0]]

    fig, ax = plt.subplots(figsize=(7, 6))
    im = ax.imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)

    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=class_names,
        yticklabels=class_names,
        title=title,
        ylabel="True Clinical Diagnosis",
        xlabel="Model Predicted Severity"
    )

    plt.setp(ax.get_xticklabels(), rotation=30, ha="right", rotation_mode="anchor")

    # Annotate counts inside matrix cells
    thresh = cm.max() / 2.0 if cm.max() > 0 else 1
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            val = cm[i, j]
            ax.text(
                j, i, f"{val}",
                ha="center", va="center",
                color="white" if val > thresh else "black",
                fontweight="bold"
            )

    fig.tight_layout()

    if save_path:
        save_path = Path(save_path)
        save_path.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(save_path, dpi=300, bbox_inches="tight")

    return fig
