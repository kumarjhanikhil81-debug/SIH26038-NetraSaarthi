"""
Image Preprocessing and Augmentation Pipeline for Diabetic Retinopathy Classification.

Key Components:
1. Auto-Cropping (`crop_retina_image`):
   Detects the retinal fundus boundary and eliminates black border artifacts,
   maximizing the resolution of diagnostic lesions.
2. Ben Graham's Color Normalization (`apply_ben_graham_enhancement`):
   Subtracts the local color average (via Gaussian Blur) to standardize illumination
   differences across clinical camera types and enhance lesion contrast (microaneurysms,
   hemorrhages, exudates).
3. PyTorch Transforms (`get_transforms`):
   Data augmentation for training (rotations, flips, color jitter) and deterministic
   resizing + ImageNet normalization for evaluation and inference.
"""

from typing import Tuple, Union
# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from PIL import Image
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
try:
    # pyrefly: ignore [missing-import]
    import torch
    # pyrefly: ignore [missing-import]
    from torchvision import transforms
except ImportError:
    torch = None
    transforms = None

# ImageNet normalization statistics expected by pretrained EfficientNet
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def crop_retina_image(image: Union[np.ndarray, Image.Image], tol: int = 7) -> Image.Image:
    """
    Crops out uninformative black borders around the circular fundus region.

    Args:
        image: Input image as PIL Image or RGB numpy array.
        tol: Tolerance threshold for background darkness (0-255).

    Returns:
        Cropped PIL Image containing the fundus field of view.
    """
    if isinstance(image, Image.Image):
        img_np = np.array(image)
    else:
        img_np = image.copy()

    if img_np.ndim == 2:
        gray = img_np
    else:
        gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    # Threshold to locate fundus mask
    mask = gray > tol
    if not np.any(mask):
        # Fallback if image is completely dark
        return image if isinstance(image, Image.Image) else Image.fromarray(image)

    # Find row and column bounding coordinates
    check_rows = mask.any(axis=1)
    check_cols = mask.any(axis=0)
    ymin, ymax = np.where(check_rows)[0][[0, -1]]
    xmin, xmax = np.where(check_cols)[0][[0, -1]]

    # Ensure valid bounding box
    if ymax > ymin and xmax > xmin:
        cropped_np = img_np[ymin:ymax + 1, xmin:xmax + 1]
        return Image.fromarray(cropped_np)
    
    return image if isinstance(image, Image.Image) else Image.fromarray(image)


def apply_ben_graham_enhancement(
    image: Union[np.ndarray, Image.Image],
    sigma_x: int = 10,
    blend_weight: float = 4.0,
    bias: int = 128
) -> Image.Image:
    """
    Applies Ben Graham's method (Gaussian subtraction) to standardize fundus illumination.
    
    Formula:
        enhanced = blend_weight * img - blend_weight * GaussianBlur(img, sigma_x) + bias

    This removes lighting variability across different ophthalmic camera brands and
    enhances subtle micro-aneurysms, hemorrhages, and exudates.

    Args:
        image: Input image as PIL Image or RGB numpy array.
        sigma_x: Gaussian blur kernel standard deviation.
        blend_weight: Blending multiplier.
        bias: Additive intensity offset (typically 128 for mid-gray centering).

    Returns:
        Enhanced PIL Image.
    """
    if isinstance(image, Image.Image):
        img_np = np.array(image)
    else:
        img_np = image.copy()

    # Apply Gaussian blur
    blurred = cv2.GaussianBlur(img_np, (0, 0), sigma_x)

    # Ben Graham weighted subtraction
    enhanced = cv2.addWeighted(img_np, blend_weight, blurred, -blend_weight, bias)

    # Clip values to valid 0-255 uint8 range
    enhanced = np.clip(enhanced, 0, 255).astype(np.uint8)

    return Image.fromarray(enhanced)


class BenGrahamTransform:
    """Torchvision-compatible transform for Ben Graham enhancement."""
    def __init__(self, sigma_x: int = 10):
        self.sigma_x = sigma_x

    def __call__(self, img: Image.Image) -> Image.Image:
        return apply_ben_graham_enhancement(img, sigma_x=self.sigma_x)


class AutoCropTransform:
    """Torchvision-compatible transform for auto-cropping retinal borders."""
    def __init__(self, tol: int = 7):
        self.tol = tol

    def __call__(self, img: Image.Image) -> Image.Image:
        return crop_retina_image(img, tol=self.tol)


def get_transforms(
    img_size: int = 224,
    is_train: bool = True,
    use_crop: bool = True,
    use_ben_graham: bool = True
) -> transforms.Compose:
    """
    Builds the PyTorch transformation pipeline for APTOS 2019 images.

    Args:
        img_size: Target image height and width (default 224 for EfficientNet-B0).
        is_train: Whether to include data augmentation for training.
        use_crop: Whether to crop black background borders.
        use_ben_graham: Whether to apply Ben Graham contrast enhancement.

    Returns:
        torchvision.transforms.Compose pipeline.
    """
    transform_list = []

    # 1. Structural cleanup
    if use_crop:
        transform_list.append(AutoCropTransform(tol=7))

    # 2. Lighting & contrast normalization
    if use_ben_graham:
        transform_list.append(BenGrahamTransform(sigma_x=10))

    # 3. Spatial resizing
    transform_list.append(transforms.Resize((img_size, img_size)))

    # 4. Augmentation (Training only)
    if is_train:
        transform_list.extend([
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomVerticalFlip(p=0.5),
            transforms.RandomRotation(degrees=30),
            transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
            transforms.RandomAffine(degrees=0, translate=(0.05, 0.05), scale=(0.95, 1.05)),
        ])

    # 5. Tensor conversion and standard ImageNet normalization
    transform_list.extend([
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
    ])

    return transforms.Compose(transform_list)
