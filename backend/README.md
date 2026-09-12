# NetraSaarthi - FastAPI Backend

AI-assisted Diabetic Retinopathy screening and tele-ophthalmology backend service built with FastAPI, SQLAlchemy, SQLite, and Pydantic.

---

## 🛠️ Tech Stack

- **Python 3.10+** (Tested with Python 3.11)
- **FastAPI**: Modern, high-performance web framework
- **SQLAlchemy 2.0**: Relational ORM mapping
- **SQLite**: Local embedded database (`netrasaarthi.db`)
- **Pydantic v2**: Data validation and response serialization
- **Uvicorn**: Lightning-fast ASGI web server
- **CORS**: Configured for React frontend (`http://localhost:5173`)

---

## 📁 Directory Structure

```text
backend/
├── database.py              # SQLite engine, sessionmaker, Base, get_db
├── main.py                  # FastAPI app, lifespan, CORS, and routers
├── models.py                # SQLAlchemy ORM models (Patient, Screening, Prediction, DoctorReview)
├── schemas.py               # Pydantic schemas for requests & responses
├── seed.py                  # Database seeder with sample clinical cases
├── test_api.py              # Automated test suite for endpoints
├── requirements.txt         # Python dependencies
├── routes/
│   ├── patients.py          # /patients endpoints (POST, GET list, GET by ID)
│   ├── screening.py         # /screenings endpoints (POST screening, GET by ID, POST review)
│   └── doctors.py           # /doctors review queue endpoints
└── services/
    └── ai_service.py        # Mock AI Diabetic Retinopathy prediction engine
```

---

## 🚀 How to Run the Backend

### 1. Prerequisites
Ensure you have Python 3.10+ installed. Alternatively, you can use `uv` package manager (which is pre-installed in this project).

### 2. Create and Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
cd d:\Downloads\NetraSaarthi\backend

# Using standard Python:
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Or using uv (fast):
uv venv --python 3.11
.\.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```powershell
pip install -r requirements.txt
# Or with uv:
uv pip install -r requirements.txt
```

### 4. Start the FastAPI Server

From the project root (`d:\Downloads\NetraSaarthi`):
```powershell
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

Or from the `backend/` directory:
```powershell
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will start at:
- **API Base URL**: `http://localhost:8000`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 🧪 Running Automated Tests

Run the automated test suite verifying all required endpoints:
```powershell
.\backend\.venv\Scripts\python.exe -m backend.test_api
```

---

## 📡 API Reference

### 1. Patients

#### `POST /patients`
Registers a new patient with demographics and medical history.

**Request Body:**
```json
{
  "name": "Kamala Bai",
  "age": 56,
  "gender": "Female",
  "village": "Govindpur Sector 2",
  "phone": "+91 91234 56789",
  "abha_id": "84-1290-7731-9012",
  "diabetes_years": 8,
  "hypertension": true,
  "insulin": false,
  "rbs": 245.0,
  "hba1c": 8.9,
  "symptoms": ["Blurred vision", "Headaches"]
}
```

**Response (`201 Created`):**
```json
{
  "name": "Kamala Bai",
  "age": 56,
  "gender": "Female",
  "village": "Govindpur Sector 2",
  "phone": "+91 91234 56789",
  "abha_id": "84-1290-7731-9012",
  "diabetes_years": 8,
  "hypertension": true,
  "insulin": false,
  "rbs": 245.0,
  "hba1c": 8.9,
  "symptoms": ["Blurred vision", "Headaches"],
  "id": 1,
  "custom_id": "PAT-2026-001",
  "last_screening_date": null,
  "latest_grade": null,
  "status": "Normal - Annual Review",
  "review_status": "Pending Specialist Review",
  "created_at": "2026-09-05T11:30:00"
}
```

#### `GET /patients`
Lists registered patients with optional search query parameter.
- Query params: `search` (e.g. `?search=Rameshwar`), `skip`, `limit`

#### `GET /patients/{patient_id}`
Returns patient details including their entire screening history and predictions.

---

### 2. Screenings

#### `POST /screenings`
Submits an eye fundus scan. The backend automatically invokes the **Mock AI Service** to predict the Diabetic Retinopathy grade, confidence score, lesion counts, and Grad-CAM heatmap hotspots.

**Request Body:**
```json
{
  "patient_id": 1,
  "eye_scanned": "OD (Right Eye)",
  "image_url": "https://storage.googleapis.com/netrasaarthi-fundus/sample.jpg",
  "notes": "Patient has had worsening night vision for 3 weeks.",
  "target_grade": 2
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "patient_id": 1,
  "eye_scanned": "OD (Right Eye)",
  "image_url": "https://storage.googleapis.com/netrasaarthi-fundus/sample.jpg",
  "notes": "Patient has had worsening night vision for 3 weeks.",
  "status": "Pending Specialist Review",
  "created_at": "2026-09-05T11:35:00",
  "prediction": {
    "id": 1,
    "screening_id": 1,
    "predicted_grade": 2,
    "grade_name": "Moderate Non-Proliferative DR (NPDR)",
    "short_name": "Moderate NPDR",
    "confidence": 96.1,
    "quality_score": 92.4,
    "risk_category": "Elevated",
    "urgency": "High",
    "action_text": "Ophthalmologist Referral within 30 Days",
    "action_hindi": "30 दिनों के भीतर नेत्र विशेषज्ञ से मिलें",
    "recommendation": "Multiple microaneurysms, blot hemorrhages and hard exudates detected. Tele-consultation recommended with District Hospital Eye Specialist within 1 month.",
    "lesions": {
      "microaneurysms": 14,
      "hemorrhages": 6,
      "hardExudates": 8,
      "cottonWoolSpots": 1,
      "neovascularization": 0
    },
    "gradcam_hotspots": [
      {
        "x": 44,
        "y": 42,
        "radius": 28,
        "intensity": 0.88,
        "label": "Macular Hard Exudate Ring (Circinate)"
      }
    ],
    "created_at": "2026-09-05T11:35:00"
  },
  "doctor_review": null
}
```

#### `GET /screenings/{screening_id}`
Returns complete screening data with attached patient demographics, AI prediction, and doctor review.

---

### 3. Doctor Review

#### `POST /screenings/{screening_id}/review`
Allows an ophthalmologist or tele-health doctor to validate or adjust the AI diagnosis and record clinical notes.

**Request Body:**
```json
{
  "doctor_name": "Dr. Arvind Joshi, MD (Ophthalmology)",
  "confirmed_grade": 2,
  "agree_with_ai": true,
  "doctor_notes": "Moderate NPDR confirmed with hard exudates. Prescribed glycemic control and repeat screening in 90 days.",
  "follow_up_recommendation": "Follow-up at District Eye Hospital in 3 months."
}
```

**Response (`201 Created`):**
```json
{
  "id": 1,
  "screening_id": 1,
  "doctor_name": "Dr. Arvind Joshi, MD (Ophthalmology)",
  "confirmed_grade": 2,
  "agree_with_ai": true,
  "doctor_notes": "Moderate NPDR confirmed with hard exudates. Prescribed glycemic control and repeat screening in 90 days.",
  "follow_up_recommendation": "Follow-up at District Eye Hospital in 3 months.",
  "review_status": "Specialist Validated",
  "reviewed_at": "2026-09-05T11:40:00"
}
```

---

## 🤖 Mock Prediction Service

Located at [services/ai_service.py](file:///d:/Downloads/NetraSaarthi/backend/services/ai_service.py).
- Implements the 5-stage Diabetic Retinopathy International Clinical Diabetic Retinopathy (ICDR) scale:
  - **Grade 0**: No Diabetic Retinopathy (Normal Retina)
  - **Grade 1**: Mild Non-Proliferative DR (NPDR)
  - **Grade 2**: Moderate Non-Proliferative DR (NPDR)
  - **Grade 3**: Severe Non-Proliferative DR (NPDR)
  - **Grade 4**: Proliferative Diabetic Retinopathy (PDR - Critical)
- Heuristically infers clinical likelihood based on patient risk factors (RBS, HbA1c, duration of diabetes) or accepts explicit `target_grade` for reproducible testing.
- Generates realistic confidence scores (93%–99%), quality scores, lesion segmentations (microaneurysms, hemorrhages, hard exudates, cotton wool spots, neovascularization), and Grad-CAM coordinate overlays.
