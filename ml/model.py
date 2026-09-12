"""
EfficientNet-B0 Transfer Learning Architecture for Diabetic Retinopathy Classification.

Key Features:
1. Pretrained Backbone:
   Loads ImageNet pretrained weights (`EfficientNet_B0_Weights.DEFAULT`) providing robust
   low-level edge, texture, and pattern detection capabilities.
2. Custom Retinopathy Classifier Head:
   Replaces the 1000-class ImageNet head with a specialized 5-class clinical severity head
   equipped with Dropout regularization (p=0.4) and Linear projection (1280 -> 5).
3. Transfer Learning Controls:
   - `freeze_backbone()`: Freezes feature extraction layers for initial classifier warm-up.
   - `unfreeze_backbone()`: Unfreezes all layers for end-to-end fine-tuning.
   - `get_parameter_groups()`: Splits parameters into backbone and head groups for differential
     learning rate optimization (e.g., lower LR for backbone, higher LR for head).
"""

from typing import Dict, List, Optional
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn as nn
# pyrefly: ignore [missing-import]
from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights


class EfficientNetB0ForDR(nn.Module):
    """
    EfficientNet-B0 transfer learning architecture adapted for 5-class
    Diabetic Retinopathy severity grading.
    """

    def __init__(
        self,
        num_classes: int = 5,
        pretrained: bool = True,
        dropout_rate: float = 0.4
    ):
        """
        Args:
            num_classes: Number of DR severity stages (default: 5).
            pretrained: Whether to load official ImageNet pretrained weights.
            dropout_rate: Dropout probability for the classification head.
        """
        super().__init__()
        self.num_classes = num_classes
        self.dropout_rate = dropout_rate

        # 1. Load pretrained EfficientNet-B0 backbone
        if pretrained:
            weights = EfficientNet_B0_Weights.DEFAULT
            self.backbone = efficientnet_b0(weights=weights)
        else:
            self.backbone = efficientnet_b0(weights=None)

        # 2. Extract input feature dimension of classifier (1280 for EfficientNet-B0)
        in_features = self.backbone.classifier[1].in_features

        # 3. Replace classification head with custom DR head
        self.backbone.classifier = nn.Sequential(
            nn.Dropout(p=dropout_rate, inplace=True),
            nn.Linear(in_features=in_features, out_features=num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Computes forward pass through EfficientNet-B0.

        Args:
            x: Batch of normalized image tensors [B, 3, H, W].

        Returns:
            Unnormalized class logits [B, num_classes].
        """
        return self.backbone(x)

    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        """
        Returns class probabilities after Softmax.

        Args:
            x: Input image tensor [B, 3, H, W].

        Returns:
            Probability tensor [B, num_classes] summing to 1.0 along dim 1.
        """
        logits = self.forward(x)
        return torch.softmax(logits, dim=1)

    def freeze_backbone(self) -> None:
        """
        Freezes all parameters in feature extractor layers.
        Only the classification head will receive gradients.
        """
        for param in self.backbone.features.parameters():
            param.requires_grad = False

    def unfreeze_backbone(self) -> None:
        """
        Unfreezes all parameters for full end-to-end fine-tuning.
        """
        for param in self.backbone.features.parameters():
            param.requires_grad = True

    def get_parameter_groups(
        self,
        lr_backbone: float = 1e-4,
        lr_head: float = 1e-3,
        weight_decay: float = 1e-4
    ) -> List[Dict]:
        """
        Generates parameter groups with differential learning rates.
        
        Using a smaller learning rate on the pretrained backbone prevents destructive
        updates to learned visual features, while a higher rate trains the new classifier head.

        Args:
            lr_backbone: Learning rate for feature extraction layers.
            lr_head: Learning rate for the custom classification head.
            weight_decay: L2 regularization coefficient.

        Returns:
            List of parameter group dictionaries compatible with PyTorch optimizers.
        """
        backbone_params = [
            p for p in self.backbone.features.parameters() if p.requires_grad
        ]
        head_params = [
            p for p in self.backbone.classifier.parameters() if p.requires_grad
        ]

        return [
            {"params": backbone_params, "lr": lr_backbone, "weight_decay": weight_decay},
            {"params": head_params, "lr": lr_head, "weight_decay": weight_decay}
        ]


def build_model(
    num_classes: int = 5,
    pretrained: bool = True,
    dropout_rate: float = 0.4,
    device: Optional[torch.device] = None
) -> EfficientNetB0ForDR:
    """
    Factory function to initialize and mount the model to device.

    Args:
        num_classes: Number of output classes.
        pretrained: Whether to load ImageNet weights.
        dropout_rate: Dropout rate for classifier.
        device: Target torch.device ('cuda' or 'cpu').

    Returns:
        Instantiated EfficientNetB0ForDR model.
    """
    model = EfficientNetB0ForDR(
        num_classes=num_classes,
        pretrained=pretrained,
        dropout_rate=dropout_rate
    )
    if device is not None:
        model = model.to(device)
    return model
