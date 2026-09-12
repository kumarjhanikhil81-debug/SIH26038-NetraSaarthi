"""
Dataset Loader and Stratified Sampling for APTOS 2019 Diabetic Retinopathy.

Key Features:
1. `APTOSDataset`:
   PyTorch Dataset for APTOS 2019 tabular schema (`id_code`, `diagnosis`).
   Locates fundus image files by checking common image extensions (.png, .jpg, .jpeg).
2. Stratified Train/Validation Split (`create_stratified_split`):
   Maintains the exact 5-class severity proportion in both training and validation splits.
3. Class Imbalance Handling:
   - `get_weighted_sampler`: Creates a PyTorch `WeightedRandomSampler` using reciprocal
     class frequencies, ensuring rare classes (Severe, Proliferative DR) are sampled uniformly.
   - `compute_class_weights_for_loss`: Computes balanced inverse frequency weights for
     `nn.CrossEntropyLoss(weight=weights)`.
"""

import os
from pathlib import Path
from typing import Callable, Dict, List, Optional, Tuple, Union

# pyrefly: ignore [missing-import]
import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
from torch.utils.data import Dataset, WeightedRandomSampler
from sklearn.model_selection import train_test_split

# 5-class ICDR Severity Grades
DR_CLASSES: Dict[int, str] = {
    0: "No DR",
    1: "Mild",
    2: "Moderate",
    3: "Severe",
    4: "Proliferative DR"
}


class APTOSDataset(Dataset):
    """
    PyTorch Dataset for APTOS 2019 Diabetic Retinopathy dataset.
    
    Expected CSV columns:
        - `id_code`: Unique image identifier (e.g. '000c1434d8d7')
        - `diagnosis`: Integer severity label [0, 1, 2, 3, 4]
    """

    def __init__(
        self,
        df: Union[pd.DataFrame, str, Path],
        img_dir: Union[str, Path],
        transform: Optional[Callable] = None,
        return_id: bool = False
    ):
        """
        Args:
            df: DataFrame or path to CSV file containing `id_code` and `diagnosis`.
            img_dir: Directory where fundus images are stored.
            transform: Optional torchvision transform to apply to images.
            return_id: Whether to return the `id_code` string alongside image and label.
        """
        if isinstance(df, (str, Path)):
            self.df = pd.read_csv(df).reset_index(drop=True)
        else:
            self.df = df.copy().reset_index(drop=True)

        self.img_dir = Path(img_dir)
        self.transform = transform
        self.return_id = return_id

        # Validate required columns
        if "id_code" not in self.df.columns:
            raise ValueError("CSV must contain 'id_code' column.")
        if "diagnosis" in self.df.columns:
            self.labels = self.df["diagnosis"].values.astype(np.int64)
        else:
            self.labels = None

        # Cache valid image extensions
        self.supported_extensions = [".png", ".jpg", ".jpeg", ""]

    def _resolve_image_path(self, id_code: str) -> Path:
        """Finds the actual image file path matching id_code."""
        # First check direct path
        direct_path = self.img_dir / id_code
        if direct_path.is_file():
            return direct_path

        # Check with supported extensions
        for ext in [".png", ".jpg", ".jpeg"]:
            candidate = self.img_dir / f"{id_code}{ext}"
            if candidate.is_file():
                return candidate

        raise FileNotFoundError(
            f"Image '{id_code}' not found in directory '{self.img_dir}' "
            f"with extensions {self.supported_extensions}"
        )

    def __len__(self) -> int:
        return len(self.df)

    def __getitem__(self, idx: int):
        row = self.df.iloc[idx]
        id_code = str(row["id_code"])
        img_path = self._resolve_image_path(id_code)

        # Load RGB image via Pillow
        image = Image.open(img_path).convert("RGB")

        if self.transform is not None:
            image = self.transform(image)

        if self.labels is not None:
            label = torch.tensor(self.labels[idx], dtype=torch.long)
            if self.return_id:
                return image, label, id_code
            return image, label
        
        if self.return_id:
            return image, id_code
        return image


def create_stratified_split(
    df_or_path: Union[pd.DataFrame, str, Path],
    val_size: float = 0.2,
    random_state: int = 42,
    save_dir: Optional[Union[str, Path]] = None
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Performs a stratified train/validation split preserving the 5-class distribution.

    Args:
        df_or_path: Path to CSV or pandas DataFrame.
        val_size: Fraction of samples to allocate to validation set (default: 0.2).
        random_state: Reproducible seed.
        save_dir: Optional directory to save `train_split.csv` and `val_split.csv`.

    Returns:
        Tuple of (train_df, val_df).
    """
    if isinstance(df_or_path, (str, Path)):
        df = pd.read_csv(df_or_path)
    else:
        df = df_or_path.copy()

    train_df, val_df = train_test_split(
        df,
        test_size=val_size,
        random_state=random_state,
        stratify=df["diagnosis"]
    )

    train_df = train_df.reset_index(drop=True)
    val_df = val_df.reset_index(drop=True)

    if save_dir:
        save_path = Path(save_dir)
        save_path.mkdir(parents=True, exist_ok=True)
        train_df.to_csv(save_path / "train_split.csv", index=False)
        val_df.to_csv(save_path / "val_split.csv", index=False)

    return train_df, val_df


def get_weighted_sampler(
    df: pd.DataFrame,
    target_col: str = "diagnosis"
) -> WeightedRandomSampler:
    """
    Creates a PyTorch WeightedRandomSampler to address class imbalance.

    Each class is weighted inversely proportional to its sample frequency.
    Samples from minority classes (e.g. Mild, Severe, Proliferative DR)
    are sampled more frequently so batches contain a balanced distribution.

    Args:
        df: DataFrame containing the dataset records.
        target_col: Column name containing integer class labels.

    Returns:
        torch.utils.data.WeightedRandomSampler.
    """
    labels = df[target_col].values
    class_counts = np.bincount(labels, minlength=5)
    
    # Avoid zero division
    class_counts = np.maximum(class_counts, 1)

    # Reciprocal class weights
    class_weights = 1.0 / class_counts

    # Assign weight to each individual sample
    sample_weights = class_weights[labels]
    sample_weights_tensor = torch.tensor(sample_weights, dtype=torch.double)

    sampler = WeightedRandomSampler(
        weights=sample_weights_tensor,
        num_samples=len(sample_weights_tensor),
        replacement=True
    )
    return sampler


def compute_class_weights_for_loss(
    df: pd.DataFrame,
    target_col: str = "diagnosis",
    num_classes: int = 5,
    device: Optional[torch.device] = None
) -> torch.Tensor:
    """
    Computes balanced class weights for PyTorch CrossEntropyLoss.
    
    Formula: weight[c] = total_samples / (num_classes * count[c])

    Args:
        df: DataFrame with ground truth labels.
        target_col: Name of diagnosis label column.
        num_classes: Number of distinct classes (5 for APTOS).
        device: PyTorch device to place the weight tensor on.

    Returns:
        1D torch.Tensor with per-class loss weights.
    """
    labels = df[target_col].values
    total_samples = len(labels)
    class_counts = np.bincount(labels, minlength=num_classes)
    class_counts = np.maximum(class_counts, 1)

    weights = total_samples / (num_classes * class_counts.astype(np.float32))
    weight_tensor = torch.tensor(weights, dtype=torch.float32)

    if device is not None:
        weight_tensor = weight_tensor.to(device)

    return weight_tensor
