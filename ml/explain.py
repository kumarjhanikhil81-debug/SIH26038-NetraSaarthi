"""
Grad-CAM Explainability Module for Diabetic Retinopathy Classification.

Generates Gradient-weighted Class Activation Maps (Grad-CAM) for EfficientNet-B0 to explain
model decisions by highlighting regions that influenced the network's classification.

Clinical Disclaimer:
AI attention visualizations highlight convolutional feature saliency. They are intended
strictly for explainability and assistive review, and do NOT constitute clinically definitive
lesion maps or standalone diagnostic determinations.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import uuid

# pyrefly: ignore [missing-import]
import numpy as np
# pyrefly: ignore [missing-import]
from PIL import Image, ImageDraw, ImageFont
# pyrefly: ignore [missing-import]
import cv2
# pyrefly: ignore [missing-import]
import torch
# pyrefly: ignore [missing-import]
import torch.nn.functional as F

# pyrefly: ignore [missing-import]
from ml.model import EfficientNetB0ForDR
# pyrefly: ignore [missing-import]
from ml.preprocess import get_transforms
# pyrefly: ignore [missing-import]
from ml.dataset import DR_CLASSES

EXPLANATION_DISCLAIMER = (
    "AI attention visualization (Grad-CAM) highlights fundus regions that influenced "
    "the model's prediction. It is intended for explainability and assistive review only, "
    "and does NOT constitute a clinically definitive lesion map or standalone diagnostic confirmation."
)

EXPLANATION_TYPE_LABEL = "AI Attention Visualization (Grad-CAM)"


class GradCAM:
    """
    Computes and visualizes Grad-CAM saliency heatmaps for EfficientNet-B0.
    """

    def __init__(
        self,
        model: EfficientNetB0ForDR,
        target_layer: Optional[torch.nn.Module] = None,
        device: Optional[torch.device] = None
    ):
        self.model = model
        self.device = device or next(model.parameters()).device
        self.model.eval()

        # Target the final convolutional feature extractor block of EfficientNet-B0
        if target_layer is None:
            self.target_layer = self.model.backbone.features[-1]
        else:
            self.target_layer = target_layer

        self.gradients = None
        self.activations = None

        # Register forward and backward hooks
        self.target_layer.register_forward_hook(self._save_activations)
        self.target_layer.register_full_backward_hook(self._save_gradients)

        self.transform = get_transforms(img_size=224, is_train=False, use_ben_graham=True)

    def _save_activations(self, module, input, output):
        self.activations = output.detach()

    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_heatmap(
        self,
        input_tensor: torch.Tensor,
        target_class: Optional[int] = None
    ) -> Tuple[np.ndarray, int, float]:
        """
        Generates a 2D Grad-CAM heatmap normalized to [0, 1] for the specified or predicted class.

        Args:
            input_tensor: Preprocessed image tensor [1, 3, H, W].
            target_class: Target class index to explain. If None, uses model's predicted class.

        Returns:
            Tuple of (heatmap_2d, predicted_class, confidence_percentage).
        """
        self.model.zero_grad()
        input_tensor = input_tensor.to(self.device)
        
        # Ensure tensor requires grad for backward tracking
        outputs = self.model(input_tensor)
        probs = torch.softmax(outputs, dim=1).squeeze(0)

        pred_class = int(torch.argmax(outputs, dim=1).item())
        confidence = float(probs[pred_class].item()) * 100.0

        if target_class is None:
            target_class = pred_class

        # Target score for backpropagation
        score = outputs[0, target_class]
        score.backward(retain_graph=True)

        if self.gradients is None or self.activations is None:
            # Fallback if hooks were somehow missed
            cam = np.zeros((7, 7), dtype=np.float32)
            return cam, pred_class, confidence

        # Global average pool gradients across spatial dimensions [1, C, H, W] -> [1, C, 1, 1]
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)

        # Linear combination of activation maps weighted by gradient importance
        cam = torch.sum(weights * self.activations, dim=1).squeeze(0)

        # Apply ReLU: only features that positively correlate with the predicted class
        cam = F.relu(cam).cpu().numpy()

        # Normalize to [0, 1]
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        return cam, pred_class, confidence

    def overlay_heatmap(
        self,
        original_image: Union[np.ndarray, Image.Image],
        heatmap: np.ndarray,
        alpha: float = 0.45,
        colormap: int = cv2.COLORMAP_JET,
        add_clinical_label: bool = True,
        grade_id: Optional[int] = None,
        confidence: Optional[float] = None
    ) -> Image.Image:
        """
        Superimposes the Grad-CAM heatmap onto the original fundus photograph and stamps
        an explicit AI attention explanation banner with safety disclaimers.

        Args:
            original_image: Base fundus image as PIL Image or RGB numpy array.
            heatmap: 2D float array in range [0, 1].
            alpha: Heatmap transparency factor (0.0 = original image, 1.0 = heatmap only).
            colormap: OpenCV colormap constant (default: COLORMAP_JET).
            add_clinical_label: Whether to stamp AI attention header & disclaimer banner.
            grade_id: Predicted severity grade (0 to 4).
            confidence: Predicted confidence percentage.

        Returns:
            Blended PIL Image with explanation labels.
        """
        if isinstance(original_image, Image.Image):
            base_np = np.array(original_image.convert("RGB"))
        else:
            base_np = original_image.copy()

        h, w = base_np.shape[:2]

        # Resize heatmap to match base image dimensions
        resized_cam = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_LINEAR)
        heatmap_uint8 = np.uint8(255 * resized_cam)
        
        # Colorize
        colored_cam = cv2.applyColorMap(heatmap_uint8, colormap)
        colored_cam = cv2.cvtColor(colored_cam, cv2.COLOR_BGR2RGB)

        # Alpha blend over original fundus image
        blended = np.clip(alpha * colored_cam + (1.0 - alpha) * base_np, 0, 255).astype(np.uint8)
        result_img = Image.fromarray(blended)

        if not add_clinical_label:
            return result_img

        # Add Header and Footer Clinical Explanation Banners
        banner_height_top = max(40, int(h * 0.08))
        banner_height_bottom = max(36, int(h * 0.07))

        canvas_width = w
        canvas_height = h + banner_height_top + banner_height_bottom

        canvas = Image.new("RGB", (canvas_width, canvas_height), (15, 23, 42))  # Slate-900 background
        canvas.paste(result_img, (0, banner_height_top))

        draw = ImageDraw.Draw(canvas)

        # Top Header Banner
        grade_str = DR_CLASSES.get(grade_id, f"Grade {grade_id}") if grade_id is not None else "Predicted Severity"
        conf_str = f" ({confidence:.1f}%)" if confidence is not None else ""
        header_text = f"AI ATTENTION MAP (Grad-CAM) | Focus: {grade_str}{conf_str}"
        draw.text((12, int(banner_height_top * 0.3)), header_text, fill=(241, 245, 249))

        # Bottom Disclaimer Banner
        disclaimer_text = "AI ATTENTION VISUALIZATION ONLY — NOT A CLINICALLY DEFINITIVE LESION MAP"
        draw.text((12, h + banner_height_top + int(banner_height_bottom * 0.28)), disclaimer_text, fill=(251, 191, 36))

        return canvas

    def extract_hotspots(
        self,
        heatmap: np.ndarray,
        threshold: float = 0.65,
        max_hotspots: int = 4
    ) -> List[Dict]:
        """
        Extracts peak attention coordinates from heatmap for interactive UI overlays.

        Returns:
            List of hotspot dictionaries containing {x, y, radius, intensity, label}.
        """
        binary_mask = (heatmap > threshold).astype(np.uint8) * 255
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        hotspots = []
        h, w = heatmap.shape[:2]

        for cnt in contours:
            if cv2.contourArea(cnt) < 2:
                continue
            (cx, cy), radius = cv2.minEnclosingCircle(cnt)
            # Normalize to 0-100 percentage scale for responsive canvas rendering
            norm_x = round(float(cx / w) * 100, 1)
            norm_y = round(float(cy / h) * 100, 1)
            norm_r = max(10, min(35, round(float(radius / max(w, h)) * 100, 1)))

            # Sample average intensity in this region
            mask_roi = np.zeros_like(heatmap, dtype=np.uint8)
            cv2.drawContours(mask_roi, [cnt], -1, 1, -1)
            intensity = round(float(np.mean(heatmap[mask_roi == 1])), 2)

            hotspots.append({
                "x": norm_x,
                "y": norm_y,
                "radius": norm_r,
                "intensity": intensity,
                "label": "Salient Neural Activation Focus"
            })

            if len(hotspots) >= max_hotspots:
                break

        if not hotspots:
            # Default center hotspot if no distinct peak
            hotspots.append({
                "x": 50.0,
                "y": 50.0,
                "radius": 22.0,
                "intensity": 0.5,
                "label": "Diffuse Retinal Attention"
            })

        return hotspots

    def explain_and_save(
        self,
        image_input: Union[str, Path, Image.Image, np.ndarray],
        output_dir: Union[str, Path] = "backend/static/heatmaps",
        url_prefix: str = "/static/heatmaps",
        filename_prefix: str = "gradcam",
        target_class: Optional[int] = None
    ) -> Dict:
        """
        End-to-end explainability method:
        1. Loads input fundus image.
        2. Computes Grad-CAM for the predicted class.
        3. Overlays heatmap on original image with explicit AI attention labels.
        4. Saves the visualization image file.
        5. Returns heatmap URL, clinical disclaimers, and coordinate hotspots.

        Args:
            image_input: Path, PIL Image, or numpy array.
            output_dir: Directory to save the PNG visualization.
            url_prefix: Web URL path prefix for API responses.
            filename_prefix: Prefix for saved file name.
            target_class: Target class to explain (None = model predicted class).

        Returns:
            Dictionary with heatmap URL, file path, grade, and disclaimers.
        """
        # 1. Resolve image to PIL RGB
        if isinstance(image_input, (str, Path)):
            raw_image = Image.open(image_input).convert("RGB")
        elif isinstance(image_input, np.ndarray):
            raw_image = Image.fromarray(image_input).convert("RGB")
        elif isinstance(image_input, Image.Image):
            raw_image = image_input.convert("RGB")
        else:
            raise TypeError(f"Unsupported image input type: {type(image_input)}")

        # 2. Preprocess into tensor
        tensor = self.transform(raw_image).unsqueeze(0).to(self.device)

        # 3. Generate Grad-CAM for predicted class
        heatmap, pred_class, confidence = self.generate_heatmap(tensor, target_class=target_class)

        # 4. Overlay heatmap and stamp explanation labels
        labeled_overlay = self.overlay_heatmap(
            original_image=raw_image,
            heatmap=heatmap,
            alpha=0.45,
            add_clinical_label=True,
            grade_id=pred_class,
            confidence=confidence
        )

        # 5. Extract coordinate hotspots for interactive canvas
        hotspots = self.extract_hotspots(heatmap)

        # 6. Save visualization file
        out_dir = Path(output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)

        file_id = f"{filename_prefix}_{uuid.uuid4().hex[:10]}.png"
        save_path = out_dir / file_id
        labeled_overlay.save(save_path, format="PNG")

        heatmap_url = f"{url_prefix.rstrip('/')}/{file_id}"

        return {
            "heatmap_url": heatmap_url,
            "heatmap_path": str(save_path.resolve()),
            "predicted_grade": pred_class,
            "grade_name": DR_CLASSES.get(pred_class, "Unknown"),
            "confidence": confidence,
            "explanation_type": EXPLANATION_TYPE_LABEL,
            "disclaimer": EXPLANATION_DISCLAIMER,
            "hotspots": hotspots
        }
