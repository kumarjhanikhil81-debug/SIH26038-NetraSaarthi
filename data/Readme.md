# NetraSaarthi — Data Repository & Management Guide
### Explainable AI for Diabetic Retinopathy Screening in Rural India
**Smart India Hackathon (SIH) Prototype**

---

## 1. Purpose of the Data Folder

The `data/` folder is the centralized repository for organizing, preprocessing, and managing retinal fundus photography used by the **NetraSaarthi** screening platform. It is structured to support:

- **Local Model Training & Evaluation**: Supplying training, validation, and benchmark images for the PyTorch deep learning pipeline.
- **Explainable AI (XAI) Demonstrations**: Providing curated, representative fundus scans across all clinical severity stages for live jury evaluations, UI visualization, and Grad-CAM attention testing.
- **Frontline Testing**: Facilitating offline Progressive Web App (PWA) verification, batch API testing, and heuristic image quality assessments.

---

## 2. Dataset Information

NetraSaarthi is developed and evaluated primarily using publicly available, clinically graded retinal fundus datasets benchmarked for Diabetic Retinopathy (DR) screening:

- **Primary Benchmark Dataset**: [APTOS 2019 Blindness Detection](https://www.kaggle.com/c/aptos2019-blindness-detection) (Collected by Aravind Eye Hospital, Tamil Nadu, India).
- **Secondary Reference Datasets (Supported)**:
  - **Messidor / Messidor-2**: Clinical referable vs. non-referable DR grading benchmark.
  - **IDRiD (Indian Diabetic Retinopathy Image Dataset)**: Expert-annotated Indian clinical fundus images with lesion segmentations.
  - *[Custom Local Dataset — Insert Institution / Hospital Name if applicable]*

### Dataset Profile *(Summary Table)*

| Metric / Attribute | Value / Specification |
| :--- | :--- |
| **Image Modality** | Digital Color Retinal Fundus Photography |
| **Field of View (FOV)** | $45^\circ$ to $50^\circ$ centered on macula and optic disc |
| **Pupil Dilation** | Mydriatic and non-mydriatic captures |
| **Supported File Formats** | `.png`, `.jpg`, `.jpeg` |
| **Total Images in Full Dataset** | *[Insert total count, e.g., 3,662 for APTOS 2019 / `[Pending dataset selection]`]* |
| **Train / Validation Split** | *[e.g., 80% Train, 20% Stratified Validation / `[Configurable via ml/dataset.py]`]* |
| **Hardware / Source** | Multi-site clinical cameras (Canon, Zeiss, Topcon, and portable fundus devices) |

> *Note: Exact sample counts and demographic distributions depend on the specific dataset subset downloaded for local development.*

---

## 3. Intended Dataset Structure

To train or run evaluations with NetraSaarthi, arrange your local files in the following layout:

```text
data/
├── README.md               # This documentation file
├── sample_images/          # De-identified sample images across all 5 ICDR classes (for demos)
│   ├── sample_grade_0.png  # No DR sample
│   ├── sample_grade_1.png  # Mild NPDR sample
│   ├── sample_grade_2.png  # Moderate NPDR sample
│   ├── sample_grade_3.png  # Severe NPDR sample
│   ├── sample_grade_4.png  # Proliferative DR sample
│   └── .gitkeep
├── test_images/            # Holdout test images for API testing and pipeline verification
│   └── .gitkeep
├── train_images/           # [LOCAL ONLY] Complete training fundus image set
│   ├── [image_id_1].png
│   ├── [image_id_2].png
│   └── ...
├── train.csv               # [LOCAL ONLY] Ground-truth labels for training
└── val.csv                 # [LOCAL ONLY / Optional] Stratified validation labels
```

### Label File Format (`train.csv` / `val.csv`)

Ground-truth metadata must be provided as a comma-separated values (CSV) file containing the following columns:

```csv
id_code,diagnosis
000c1434d8d7,2
002c21358ce6,0
005b95c2bc04,0
00a862413642,1
00f697473420,4
```

- **`id_code`**: Unique image identifier (with or without extension).
- **`diagnosis`**: Integer ICDR severity stage from `0` to `4`.

---

## 4. Supported Diabetic Retinopathy Classes

NetraSaarthi classifies fundus images in accordance with the **International Clinical Diabetic Retinopathy (ICDR)** standard:

| Class ID | Diagnosis | Clinical Retinal Findings | Triage Action / Referral Protocol |
| :---: | :--- | :--- | :--- |
| **0** | **No DR** | Healthy retina; absence of microaneurysms or vascular lesions. | Annual rescreening at Ayushman Arogya Mandir (PHC). |
| **1** | **Mild NPDR** | Microaneurysms only (isolated focal capillary outpouchings). | Lifestyle counseling; follow-up in 6–12 months. |
| **2** | **Moderate NPDR** | Microaneurysms, scattered blot hemorrhages, hard lipid exudates, cotton-wool spots; less than Severe. | Ophthalmologist review within 4–8 weeks at District Hospital. |
| **3** | **Severe NPDR** | **4-2-1 Rule**: >20 intraretinal hemorrhages in all 4 quadrants, venous beading in $\ge 2$ quadrants, or IRMA in $\ge 1$ quadrant. | Urgent referral within 2–4 weeks; diagnostic angiography consideration. |
| **4** | **Proliferative DR (PDR)** | Neovascularization (new fragile blood vessels at optic disc or elsewhere), vitreous/preretinal hemorrhage. | **High Urgency**: Immediate tertiary vitreoretinal referral (24–48 hours) for laser PRP or anti-VEGF therapy. |

*NPDR = Non-Proliferative Diabetic Retinopathy; IRMA = Intraretinal Microvascular Abnormalities; PRP = Panretinal Photocoagulation.*

---

## 5. Image Preprocessing & Quality Heuristics

To ensure consistent model performance across diverse imaging hardware used in rural screening camps, all incoming images pass through a multi-stage preprocessing and quality gating pipeline (`ml/preprocess.py` and `ml/quality.py`):

1. **Automatic Field-of-View (FOV) Cropping**:
   - Detects the circular fundus boundary using an adaptive intensity threshold ($>7$).
   - Crops away surrounding black non-informative borders to maximize pixel density on retinal tissue.
2. **Illumination Standardization (Ben Graham's Technique)**:
   - Computes local color averages via Gaussian blur ($\sigma = 10$).
   - Standardizes brightness variations and enhances microvascular lesion contrast using:
     $$\text{enhanced} = 4 \cdot \text{image} - 4 \cdot \text{GaussianBlur}(\text{image}, \sigma=10) + 128$$
3. **Resizing & Normalization**:
   - Resized to standard input dimensions ($224 \times 224$ or $400 \times 400$).
   - Normalized using ImageNet channel statistics ($\mu = [0.485, 0.456, 0.406], \sigma = [0.229, 0.224, 0.225]$).
4. **Pre-Inference Quality Gate**:
   - Evaluates four physical heuristics prior to AI inference:
     - **Resolution**: Rejects images $< 180 \times 180$; recommends $\ge 400 \times 400$.
     - **Brightness**: Detects underexposed shadows ($\text{mean} < 45$) and flash glare saturation.
     - **Contrast**: Flags low-contrast or washed-out images.
     - **Sharpness**: Intercepts motion blur and defocus using Laplacian variance.
   - Status outputs: `GOOD` (proceed to AI inference) or `RETAKE_REQUIRED` (inference halted, recapture prompt provided).

---

## 6. Organization of Sample and Test Images

To keep the repository lightweight while enabling instant evaluation and prototype demonstrations:

### `data/sample_images/`
- **Purpose**: Contains a minimal set of representative, de-identified fundus photographs representing each ICDR grade ($0$ through $4$).
- **Intended Usage**:
  - Live hackathon demonstration walkthroughs.
  - Interactive testing of the Grad-CAM visualizer and lesion quantification UI.
  - Offline PWA caching and demo mode.
- **Naming Convention**: `sample_grade_0.png`, `sample_grade_1.png`, `sample_grade_2.png`, `sample_grade_3.png`, `sample_grade_4.png`.

### `data/test_images/`
- **Purpose**: Reserved for holdout test images used during automated testing (`backend.test_api`), CLI predictions (`ml.predict`), and model evaluation runs.
- **Intended Usage**:
  - Validating API upload handling (`POST /screenings/analyze`).
  - Verifying edge cases (e.g., poor focus, low light, abnormal aspect ratios).
- **Naming Convention**: `test_[identifier].[ext]` or standard APTOS ID codes.

---

## 7. Data Privacy and Patient Safety Considerations

In compliance with healthcare data governance frameworks (including India's **Digital Personal Data Protection Act (DPDPA 2023)**, **Ayushman Bharat Digital Mission (ABDM)** health data guidelines, and international HIPAA Safe Harbor principles):

1. **Patient De-Identification**:
   - All fundus images stored or used in this system must be thoroughly anonymized.
   - All Protected Health Information (PHI) and Personally Identifiable Information (PII) must be stripped.
2. **EXIF & Metadata Stripping**:
   - All embedded metadata tags (patient names, hospital identifiers, medical record numbers, capture dates, GPS coordinates, and device serial numbers) must be permanently removed prior to placing images in this folder.
3. **Data Minimization in Offline Vaults**:
   - When NetraSaarthi operates in rural offline mode, local browser storage caches only non-PII technical identifiers (`patient_id`, `PAT-2026-XXX`, eye scanned, and image data). Personal demographics are never written to unencrypted offline browser queues.
4. **Clinical Decision Support Boundary**:
   - NetraSaarthi is an assistive clinical decision support tool intended for frontline triage (ASHA/ANM workers). It does **not** provide autonomous clinical diagnoses. All predictions and attention heatmaps require review by a licensed medical practitioner.

---

## 8. Dataset Licensing and Usage Note

- **APTOS 2019 Dataset**: Distributed under competition and dataset-specific terms via Kaggle and the Asia Pacific Tele-Ophthalmology Society (APTOS). Intended for research and educational purposes.
- **Messidor / IDRiD Datasets**: Distributed under their respective institutional licenses (e.g., academic research use agreements).
- **Custom / Institutional Data**: *[Insert Specific Dataset License, e.g., "Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)" or "Institutional Data Use Agreement / Hospital Ethics Committee Clearance No. XYZ"]*.
- **Project Usage Scope**: All dataset assets in this project are utilized solely for academic research, technological demonstration, and social impact development within the Smart India Hackathon (SIH).

---

## 9. Critical Notice: Git & Repository Security

> [!WARNING]
> **DO NOT COMMIT FULL DATASETS TO GIT OR GITHUB**
>
> 1. **Data Volume**: Full training image collections (often several gigabytes in size) must **not** be checked into version control.
> 2. **Licensing & Privacy Compliance**: Distributing raw medical datasets on public repositories may violate dataset terms of service, hospital data sharing agreements, or patient privacy regulations.
> 3. **Version Control Strategy**:
>    - `data/train_images/`, `data/train.csv`, and large archives are excluded by `.gitignore`.
>    - Only `.gitkeep` markers and a minimal set of de-identified demonstration samples in `data/sample_images/` should be tracked in the repository.
