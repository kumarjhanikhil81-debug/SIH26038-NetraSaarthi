# NetraSaarthi (नेत्रसारथी) — Technology Stack Specification
### Complete Technical Inventory: Frontend, Backend, Machine Learning & Vision
**Smart India Hackathon (SIH) Technical Documentation**

---

## Executive Summary

**NetraSaarthi** is built using a modern, decoupled, and field-resilient technology stack engineered to operate seamlessly across both high-throughput server environments and bandwidth-constrained rural health camps.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT PRESENTATION LAYER                               │
│        React 18.3 • Vite 5.4 • Tailwind CSS 3.4 • Service Worker (PWA) • Web Speech   │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTP REST / Offline Local Vault Queue
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                APPLICATION SERVER LAYER                                │
│        FastAPI 0.109 • Uvicorn 0.27 • Pydantic v2.6 • SQLite / SQLAlchemy 2.0          │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Ingested Image Tensor (224x224x3)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              AI INFERENCE & VISION LAYER                               │
│        PyTorch 2.0 • Torchvision 0.15 (EfficientNet-B0) • Grad-CAM • OpenCV 4.7        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. 🎨 Frontend Technology Stack

The frontend is a Progressive Web Application (PWA) designed for high usability on low-cost touch tablets and mobile smartphones used by frontline health workers (ASHA/ANM).

| Technology / Library | Version | File Reference | Technical Role & Clinical Justification |
| :--- | :---: | :--- | :--- |
| **React** | `^18.3.1` | [`package.json`](file:///d:/Downloads/NetraSaarthi/frontend/package.json) | **UI Component Engine**: Concurrent rendering, component-driven Single Page Application (SPA) architecture, declarative state management. |
| **Vite** | `^5.4.14` | [`vite.config.js`](file:///d:/Downloads/NetraSaarthi/frontend/vite.config.js) | **Build Tool & Bundler**: Lightning-fast Hot Module Replacement (HMR) during development; optimized Rollup production asset bundling. |
| **React Router DOM** | `^6.28.0` | [`App.jsx`](file:///d:/Downloads/NetraSaarthi/frontend/src/App.jsx) | **Client-Side Routing**: Manages 8 distinct routes (ASHA portal, Doctor tele-triage, Patient registration, Fundus upload, History). |
| **Tailwind CSS** | `^3.4.17` | [`tailwind.config.js`](file:///d:/Downloads/NetraSaarthi/frontend/tailwind.config.js) | **Utility-First Styling**: Tailored healthcare design system using accessible, high-contrast color tokens (Teal, Emerald, Amber, Rose). |
| **Lucide React** | `^0.475.0` | Components | **SVG Icon Library**: Accessible, lightweight medical and navigation vector icons. |
| **Recharts** | `^2.15.0` | [`PatientHistoryPage.jsx`](file:///d:/Downloads/NetraSaarthi/frontend/src/pages/PatientHistoryPage.jsx) | **Data Charting**: Visualizes longitudinal Diabetic Retinopathy disease progression over 6 to 24-month patient screening visits. |
| **React Hook Form** | `^7.87.0` | [`PatientRegistrationPage.jsx`](file:///d:/Downloads/NetraSaarthi/frontend/src/pages/PatientRegistrationPage.jsx) | **Form Validation**: High-performance, re-render-minimized patient registration form management. |
| **clsx & tailwind-merge**| `^2.1.1` / `^2.6.0` | Utilities | **Class Composition**: Clean conditional merging of Tailwind utility classes without specificity conflicts. |

### Browser & Native Web APIs Utilized

1. **Service Worker API (`sw.js`)**:
   - Implements **stale-while-revalidate** caching for static JS, CSS, and SVG assets.
   - Pre-caches core application shell (`/`, `/index.html`, `/manifest.webmanifest`, `/icon.svg`).
   - Guarantees instant page loads in remote villages with zero network reception.
   - Explicitly bypasses backend API routes (`:8000`) to let the offline sync manager handle network states.
2. **Web Storage API (`localStorage`)**:
   - Manages the **Encrypted Local Vault** (`netrasaarthi_offline_screenings`).
   - Implements strict **data minimization** under India's **DPDPA 2023**: personal identifying information (names, phone numbers, addresses) is omitted; records are referenced purely by anonymous tokens (`PAT-2026-001`).
3. **Web Speech API (`SpeechSynthesisUtterance`)**:
   - Integrated into [`VoiceGuide.jsx`](file:///d:/Downloads/NetraSaarthi/frontend/src/components/VoiceGuide.jsx).
   - Speaks clinical findings, diet advice, and referral instructions aloud in **Hindi** and **English** for non-literate rural patients.
4. **HTML5 Canvas 2D API**:
   - Integrated into [`retinaCanvas.js`](file:///d:/Downloads/NetraSaarthi/frontend/src/utils/retinaCanvas.js).
   - Dynamic real-time blending of fundus photography, Grad-CAM heatmaps (opacity slider: 0% to 100%), Red-Free green filter, and interactive lesion markers.

---

## 2. ⚙️ Backend Technology Stack

The backend is built as an asynchronous, lightweight Python microservice providing high throughput, rigorous input validation, and zero-configuration database persistence.

| Technology / Library | Version | File Reference | Technical Role & Architectural Justification |
| :--- | :---: | :--- | :--- |
| **FastAPI** | `^0.109.0` | [`main.py`](file:///d:/Downloads/NetraSaarthi/backend/main.py) | **Web Framework**: Asynchronous Python REST API supporting high-concurrency requests with automatic OpenAPI / Swagger documentation. |
| **Uvicorn** | `^0.27.0` | CLI Server | **ASGI Server**: Production-ready Asynchronous Server Gateway Interface running the FastAPI application. |
| **Pydantic v2** | `^2.6.0` | Schemas | **Data Validation**: Strict type enforcement, schema validation, and JSON serialization for patient and screening payloads. |
| **SQLAlchemy** | `^2.0.25` | [`database.py`](file:///d:/Downloads/NetraSaarthi/backend/database.py) | **Object-Relational Mapping (ORM)**: Declarative database mapping for relational models (`Patient`, `Screening`, `Prediction`, `DoctorReview`). |
| **SQLite** | Embedded | `netrasaarthi.db` | **Embedded Database**: Zero-configuration, serverless relational database engine; optimized with `check_same_thread=False` for multi-threaded FastAPI. |
| **python-multipart**| `^0.0.7` | Ingestion | **Form Data Parser**: Handles streaming `multipart/form-data` uploads for retinal fundus images. |
| **HTTPX** | `^0.27.0` | [`test_api.py`](file:///d:/Downloads/NetraSaarthi/backend/test_api.py) | **Asynchronous HTTP Client**: Powers the automated backend test suite and integration validation. |
| **Pillow (PIL)** | `^9.5.0` | Ingestion | **Image Processing**: Validates byte streams (`Image.verify()`), checks minimum resolutions, converts color spaces, and saves uploads. |

---

## 3. 🧠 Machine Learning & Vision Stack

The machine learning subsystem implements transfer learning, heuristic image quality gating, and explainability backpropagation for 5-class ICDR Diabetic Retinopathy triage.

| Technology / Library | Version | File Reference | Technical Role & Algorithmic Justification |
| :--- | :---: | :--- | :--- |
| **PyTorch (`torch`)** | `^2.0.0` | [`model.py`](file:///d:/Downloads/NetraSaarthi/ml/model.py) | **Deep Learning Framework**: Tensor computation, autograd backpropagation, module management, and GPU/CPU inference execution. |
| **Torchvision** | `^0.15.0` | [`preprocess.py`](file:///d:/Downloads/NetraSaarthi/ml/preprocess.py) | **Computer Vision Utilities**: Supplies pretrained **EfficientNet-B0** weights (`EfficientNet_B0_Weights.DEFAULT`) and transform pipelines. |
| **EfficientNet-B0** | Pretrained | [`model.py`](file:///d:/Downloads/NetraSaarthi/ml/model.py) | **Model Backbone**: Compound coefficient scaled CNN (1280 feature channels); optimal trade-off between microvascular accuracy and edge inference speed. |
| **Custom Grad-CAM** | PyTorch Hooks | [`explain.py`](file:///d:/Downloads/NetraSaarthi/ml/explain.py) | **Explainability Engine**: Backward gradient hooks attached to convolutional stage `features.8`; generates class-discriminative spatial heatmaps. |
| **OpenCV (`opencv-python-headless`)** | `^4.7.0` | [`quality.py`](file:///d:/Downloads/NetraSaarthi/ml/quality.py) | **Heuristic Vision Processing**: Calculates Laplacian blur variance ($\text{Var}(\nabla^2 I)$) and color space conversions without GUI overhead. |
| **Pillow (PIL)** | `^9.5.0` | [`preprocess.py`](file:///d:/Downloads/NetraSaarthi/ml/preprocess.py) | **Ophthalmic Standardization**: Retinal circular FOV auto-cropping (threshold $>7$) and Ben Graham's illumination standardization ($4I - 4\text{Gauss}(I) + 128$). |
| **Scikit-Learn** | `^1.2.0` | [`dataset.py`](file:///d:/Downloads/NetraSaarthi/ml/dataset.py) | **Sampling & Evaluation**: Stratified train/val splits (`train_test_split`), Quadratic Weighted Kappa (QWK), Precision, Recall, and Confusion Matrices. |
| **NumPy** | `^1.24.0` | Matrix Engine | **Numerical Computing**: Fast N-dimensional array manipulations, luminance clipping, and mask calculations. |
| **Pandas** | `^2.0.0` | Data Loading | **Tabular Data Processing**: Loads and validates APTOS ground-truth labels (`train.csv` / `val.csv`). |
| **Matplotlib** | `^3.7.0` | Visualizations | **Color Mapping & Reporting**: Projects jet/turbo colormaps on Grad-CAM heatmaps and renders 300 DPI architecture diagrams. |

---

## 4. 🔄 End-to-End Inter-Layer Communications

```text
[Frontend PWA]
     │
     ├── 1. POST /screenings/quality-check (Multipart image)
     │       └── Quality Gate evaluates Resolution, Luminance, Contrast, Blur
     │
     ├── 2. POST /screenings/analyze (Multipart image + screening_id)
     │       ├── Preprocessing (Auto-crop + Ben Graham standardization)
     │       ├── EfficientNet-B0 forward pass (Softmax 5-class ICDR probabilities)
     │       ├── Grad-CAM backward hook (Heatmap synthesis at features.8)
     │       └── Database commit (SQLite updates image_url, heatmap_url, prediction)
     │
     ├── 3. POST /screenings/{id}/review (JSON body)
     │       └── Specialist doctor confirms/overrides grade and records sign-off
     │
     └── 4. GET /health (Heartbeat probe)
             └── Triggers automated background sync when network connectivity is restored
```

---

## 5. 🛡️ Data Privacy & Public Health Compliance

1. **Digital Personal Data Protection Act (DPDPA 2023)**:
   - Zero unnecessary PII stored in offline browser queues.
   - All patient identifiers stripped; records referenced strictly via anonymous tokens (`PAT-2026-001`).
2. **Ayushman Bharat Digital Mission (ABDM) Alignment**:
   - Ready for Ayushman Bharat Health Account (ABHA) linking.
   - Official printable referral slips with standardized ICD-10 diagnostic codes (`E11.319`) and QR verification.
3. **EXIF Sanitization**:
   - Camera serial numbers, capture timestamps, and GPS coordinates are purged during ingestion.
