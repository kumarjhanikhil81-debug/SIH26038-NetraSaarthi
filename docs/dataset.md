# NetraSaarthi (नेत्रसारथी) — Dataset Specification Document
### Explainable AI for Diabetic Retinopathy Screening in Rural India
**Smart India Hackathon (SIH) Technical Documentation**

---

> [!IMPORTANT]
> **Clinical & Regulatory Disclaimer**  
> NetraSaarthi is an **AI-assisted screening and decision-support prototype** developed for research, workflow triage innovation, and demonstration purposes. It is **not a clinically validated or certified autonomous diagnostic system**. All dataset mappings and automated outputs are designed to assist healthcare workers and tele-ophthalmologists in prioritizing care and do not replace formal clinical examinations.

---

## 1. Dataset Purpose

The purpose of the dataset within **NetraSaarthi** is to train, validate, and evaluate an explainable deep learning pipeline for automated Diabetic Retinopathy (DR) risk screening and triage. 

Specifically, the dataset is utilized to:
- Train deep convolutional backbones (EfficientNet-B0) to classify fundus images according to International Clinical Diabetic Retinopathy (ICDR) severity stages.
- Generate visual attention heatmaps via Gradient-weighted Class Activation Mapping (Grad-CAM) to explain model hypotheses to frontline health workers and clinicians.
- Evaluate automated pre-inference image quality heuristics to ensure degraded photographs (defocused, underexposed, or glare-affected) are caught before model inference.
- Benchmark sensitivity, specificity, and Quadratic Weighted Kappa (QWK) for referable vs. non-referable triage thresholds in rural screening camps.

---

## 2. Dataset Name / Source

NetraSaarthi is calibrated and evaluated using established, publicly accessible ophthalmic benchmark datasets alongside local clinical reference imagery:

- **Primary Benchmark**: **APTOS 2019 Blindness Detection**
  - **Clinical Provider**: Aravind Eye Hospital, Tamil Nadu, India.
  - **Hosting Platform**: Asia Pacific Tele-Ophthalmology Society (APTOS) via Kaggle.
  - **Relevance**: Captures clinical fundus photography representative of Indian patient demographics, varied camera hardware, and field imaging conditions.
- **Secondary Reference Datasets (Supported)**:
  - **Messidor / Messidor-2**: Independent benchmark for referable vs. non-referable DR classification.
  - **IDRiD (Indian Diabetic Retinopathy Image Dataset)**: Expert-annotated Indian clinical fundus images providing pixel-level segmentations of microaneurysms, hemorrhages, and exudates.
- **Custom / Institutional Dataset**:
  - **Partner Hospital / Clinic**: [TO BE FILLED]
  - **Institutional Review Board (IRB) Clearance**: [TO BE FILLED]
  - **Collection Period**: [TO BE FILLED]
  - **Geographic Location**: [TO BE FILLED]

---

## 3. Dataset Access Information

- **APTOS 2019 Dataset**:
  - **Access URL**: `https://www.kaggle.com/c/aptos2019-blindness-detection/data`
  - **Access Requirements**: Kaggle account registration and acceptance of official competition rules and non-commercial research use terms.
  - **CLI Download Command**:
    ```bash
    kaggle competitions download -c aptos2019-blindness-detection -p data/
    ```
- **Messidor / IDRiD Datasets**:
  - Available through respective institutional research repositories upon academic request.
- **Custom / Clinical Partner Dataset**:
  - **Data Access Agreement**: [TO BE FILLED]
  - **Repository / Data Custodian**: [TO BE FILLED]
  - **Access Protocol**: [TO BE FILLED]

---

## 4. Image Format

The dataset ingestion pipeline (`ml/dataset.py`) supports standardized color fundus photography formats:

| Property | Specification |
| :--- | :--- |
| **Supported File Formats** | `.png`, `.jpg`, `.jpeg` |
| **Color Space** | 3-Channel RGB (24-bit depth) |
| **Resolution Range** | From $400 \times 400$ up to $3000 \times 3000+$ pixels (Standardized to $224 \times 224 \times 3$ for model input) |
| **Optical Modality** | Digital Color Fundus Photography (CFP) |
| **Field of View (FOV)** | $45^\circ$ to $50^\circ$ optical angle |
| **Anatomical Centering** | Macula-centered (Posterior Pole) and Optic Disc-centered |
| **Pupil Dilation** | Both pharmacologically dilated (mydriatic) and non-mydriatic captures |
| **Compression** | Lossless (PNG) or high-quality standard JPEG |

---

## 5. Diabetic Retinopathy Classes

NetraSaarthi stages fundus images in accordance with the **International Clinical Diabetic Retinopathy (ICDR)** 5-class severity scale:

| Class ID | Diagnosis | Clinical Retinal Pathologies | Referral Category & Urgency |
| :---: | :--- | :--- | :---: |
| **0** | **No DR** | Normal retina; absence of microaneurysms, hemorrhages, or exudates. Sharp optic disc margins. | **Non-Referable**<br>Routine annual rescreening. |
| **1** | **Mild NPDR** | Microaneurysms (MAs) only; tiny focal saccular capillary outpouchings. | **Non-Referable**<br>Glycemic control counseling; follow-up in 6–12 months. |
| **2** | **Moderate NPDR** | Microaneurysms, scattered blot/dot hemorrhages, hard lipid exudates, cotton-wool spots; criteria less than Severe. | **Referable**<br>Specialist review within 4–8 weeks at District Hospital. |
| **3** | **Severe NPDR** | **The 4-2-1 Rule**: Meeting any one of the following:<br>• $>20$ intraretinal hemorrhages in each of 4 quadrants<br>• Definite venous beading in $\ge 2$ quadrants<br>• Prominent IRMA in $\ge 1$ quadrant | **Referable (Urgent)**<br>Comprehensive specialist evaluation within 2–4 weeks. |
| **4** | **Proliferative DR (PDR)** | Neovascularization (NVD at disc or NVE elsewhere on retina), preretinal/vitreous hemorrhage, fibrovascular proliferation. | **Referable (Emergency)**<br>Immediate tertiary vitreoretinal referral within 24–48 hours for PRP or anti-VEGF therapy. |

*NPDR = Non-Proliferative Diabetic Retinopathy; IRMA = Intraretinal Microvascular Abnormalities; PRP = Panretinal Photocoagulation.*

---

## 6. Data Preprocessing

To normalize variations across multi-vendor fundus cameras used in rural screening camps, images undergo standardized preprocessing prior to inference (`ml/preprocess.py`):

1. **Automatic Field-of-View (FOV) Cropping (`crop_retina_image`)**:
   - Detects the circular fundus boundary using an adaptive brightness threshold ($>7$).
   - Crops away the surrounding non-informative black border, isolating the retinal tissue and maximizing spatial resolution.
2. **Ben Graham's Illumination Standardization (`apply_ben_graham_enhancement`)**:
   - Corrects for camera flash variations and uneven retinal illumination:
     $$\text{enhanced} = 4 \cdot \text{image} - 4 \cdot \text{GaussianBlur}(\text{image}, \sigma=10) + 128$$
   - Subtracts the local color average to emphasize microvascular lesions (microaneurysms, hemorrhages, exudates) regardless of skin pigmentation or camera sensor exposure.
3. **Resizing and Normalization**:
   - Resized to standard input dimensions: $224 \times 224 \times 3$.
   - Scaled to $[0.0, 1.0]$ float tensors and normalized using ImageNet channel statistics ($\mu = [0.485, 0.456, 0.406], \sigma = [0.229, 0.224, 0.225]$).

---

## 7. Train / Validation / Test Split

Dataset splitting is managed programmatically via `ml/dataset.py` using stratified sampling to preserve 5-class proportions:

| Dataset Partition | Proportion | Number of Images | Sampling Methodology |
| :--- | :---: | :---: | :--- |
| **Training Set** | 80% | [TO BE FILLED] | Stratified split maintaining class ratios (`train_test_split`, `stratify=diagnosis`) |
| **Validation Set** | 20% | [TO BE FILLED] | Stratified holdout for hyperparameter tuning and model checkpointing (`best_model.pt`) |
| **Test Set** | Holdout / Independent | [TO BE FILLED] | Independent benchmark images reserved for final evaluation and automated API tests |
| **Total Ingested** | 100% | [TO BE FILLED] | Verified fundus photographs across all 5 ICDR severity grades |

*Note: For the APTOS 2019 benchmark, the public training set comprises 3,662 labeled images. When configuring a custom clinical dataset, exact partition sizes must be filled based on local cohort numbers.*

---

## 8. Class Imbalance

Clinical diabetic retinopathy screening datasets exhibit severe class imbalance, with healthy and mild stages dominating the sample distribution:

- **Class 0 (No DR)**: Typically accounts for ~45% to ~50% of screening cohorts.
- **Class 1 (Mild NPDR)**: ~10% of samples.
- **Class 2 (Moderate NPDR)**: ~25% to ~28% of samples.
- **Class 3 (Severe NPDR)**: ~5% of samples (minority class).
- **Class 4 (Proliferative DR)**: ~8% of samples (minority class).

### Mitigation Strategies Implemented (`ml/dataset.py`)

1. **Weighted Random Sampling (`WeightedRandomSampler`)**:
   - Assigns sample weights inversely proportional to class frequency:
     $$w_i = \frac{1}{N_{c(i)}}$$
   - Ensures that every training mini-batch samples rare classes (Severe NPDR, Proliferative DR) with equal probability.
2. **Class-Weighted Cross-Entropy Loss (`compute_class_weights_for_loss`)**:
   - Loss gradients are scaled inversely to class frequencies during backpropagation:
     $$W_c = \frac{N_{\text{total}}}{K \cdot N_c}$$
   - Heavily penalizes false negatives on vision-threatening advanced disease stages.

---

## 9. Data Augmentation

To prevent overfitting and simulate clinical variations encountered during rural field operations, training images are augmented dynamically (`ml/preprocess.py`):

| Augmentation Technique | Parameter / Range | Clinical Rationale |
| :--- | :--- | :--- |
| **Random Horizontal Flip** | Probability = 0.5 | Simulates bilateral symmetry and fundus camera orientation. |
| **Random Vertical Flip** | Probability = 0.5 | Simulates field inversion and optical rotations. |
| **Random Rotation** | Range: $\pm 30^\circ$ | Accounts for patient head tilt and handheld camera roll in field settings. |
| **Color Jitter** | Brightness: $\pm 0.1$, Contrast: $\pm 0.1$, Saturation: $\pm 0.1$ | Mimics illumination differences caused by ambient camp light and varied flash energies. |
| **Random Affine Transform** | Translation: $\pm 5\%$, Scale: $0.95 \times$ to $1.05 \times$ | Simulates variable camera working distances and slight decentering. |

*Validation and inference pipelines do not apply stochastic augmentations; they use deterministic resizing and ImageNet normalization.*

---

## 10. Ethical and Privacy Considerations

Because medical photography constitutes sensitive personal data, NetraSaarthi enforces strict data protection aligned with India's **Digital Personal Data Protection Act (DPDPA 2023)**, **ABDM** guidelines, and international HIPAA Safe Harbor principles:

1. **Patient De-Identification**:
   - All dataset images are completely stripped of Protected Health Information (PHI) and Personally Identifiable Information (PII).
   - Images are referenced strictly through randomized, non-traceable alphanumeric identifiers (`id_code` or `PAT-2026-XXX`).
2. **Metadata & EXIF Purging**:
   - All embedded EXIF tags (camera serial numbers, capture dates, patient demographics, and GPS coordinates) are permanently scrubbed before ingestion.
3. **Data Minimization in Offline Vaults**:
   - In rural offline mode, local browser storage caches only non-PII technical tokens, eye orientation, and fundus image data. Personal names, phone numbers, and addresses are never stored in unencrypted client-side browser queues.
4. **Informed Consent & Ethics Clearance**:
   - **Institutional Ethics Committee (IEC) Clearance**: [TO BE FILLED]
   - **Patient Informed Consent Protocol**: [TO BE FILLED]
5. **Decision-Support Boundary**:
   - NetraSaarthi is an assistive triage tool. All model predictions and Grad-CAM visualizations must be verified by a registered medical doctor or tele-ophthalmologist before clinical action.

---

## 11. Dataset Limitations

1. **Class Representation Disparity**: High-grade pathologies (Severe NPDR and Proliferative DR) comprise a small fraction of real-world cohorts, necessitating artificial rebalancing.
2. **Inter-Observer Grading Variability**: Publicly available datasets often reflect subtle grading variations among ophthalmologists, especially on the borderline between Mild (Grade 1) and Moderate (Grade 2) NPDR.
3. **Demographic & Geographic Focus**: Benchmarks such as APTOS and IDRiD originate predominantly from specific hospital networks in India; regional genetic and phenotypic variations may require broader sampling.
4. **Single-Timepoint Cross-Sectional Data**: Most public datasets offer single-session fundus photographs rather than longitudinal, multi-year screening tracking for individual patients.

---

## 12. Generalization Limitations

1. **Hardware Generalization**: Models trained on high-end desktop fundus cameras (Zeiss, Topcon, Canon) may experience distribution shifts when inferring on ultra-low-cost portable smartphone attachments or low-cost optical lenses.
2. **Non-DR Retinal Comorbidities**: The dataset and model are trained specifically on Diabetic Retinopathy. The model does not autonomously identify or differentiate co-existing pathologies such as glaucoma (optic cup enlargement), age-related macular degeneration (drusen), or retinal vein occlusions.
3. **Pupil Dilation Sensitivity**: Performance on non-mydriatic captures in elderly patients with small pupils or significant media opacities (senile cataracts) may show higher uncertainty compared to pharmacologically dilated scans.
4. **Pre-Clinical Status**: The dataset and pipeline have not been evaluated in prospective multi-center clinical trials; real-world clinical validation is required prior to deployment.

---

## 13. Device and Image-Quality Considerations

In rural community screening camps, image degradation is common due to uncooperative patients, non-mydriatic pupils, eye movement, or optical dust. NetraSaarthi addresses this through an explainable pre-inference quality gate (`ml/quality.py`):

| Quality Heuristic | Measurement Method | Rejection Threshold | Clinical Action |
| :--- | :--- | :--- | :--- |
| **Spatial Resolution** | Pixel dimensions ($W \times H$) | $< 180 \times 180$ (Reject)<br>$\ge 400 \times 400$ (Optimal) | Rejects heavily downscaled or compressed images where microvascular detail is lost. |
| **Brightness & Glare** | Mean luminance ($\bar{Y}$) & clipping | $\bar{Y} < 45.0$ (Underexposed)<br>$\bar{Y} > 200.0$ or $>15\%$ clipped (Glare) | Halts inference; prompts health worker to adjust flash or darken ambient room. |
| **Contrast** | Standard deviation ($\sigma_Y$) in retinal FOV | $\sigma_Y < 10.0$ (Flat / Washed-out) | Catches washed-out photography where lesions cannot be differentiated from background retina. |
| **Sharpness / Blur** | Variance of Laplacian $\text{Var}(\nabla^2 I)$ | $\text{Var} < 25.0$ (Severe Blur / Defocus) | Halts inference; instructs worker to adjust focus ring and ensure patient fixates on target. |

- **Quality Decision Logic**:
  - **`GOOD`**: Image satisfies all critical quality thresholds; inference proceeds automatically.
  - **`RETAKE_REQUIRED`**: AI inference is halted immediately; plain-language feedback (in Hindi and English) guides the ASHA/ANM worker on corrective actions, preventing false diagnoses.
