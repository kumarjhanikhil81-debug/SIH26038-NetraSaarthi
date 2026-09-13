# NetraSaarthi (नेत्रसारथी)
### Explainable AI Diabetic Retinopathy Screening for Rural Healthcare & Frontline Workers

> **Clinical Decision Support System**: Designed for frontline ASHA & ANM healthcare workers at Ayushman Arogya Mandirs (PHCs) and tele-ophthalmology triage at District Hospitals.

---

## 🌟 Key Features

1. **Role-Based Portals**:
   - **🏥 Rural Health Worker (ASHA / ANM)**: Large touch buttons, high contrast, minimal text, Web Speech API bilingual audio guidance in Hindi and English.
   - **👨‍⚕️ Specialist Ophthalmologist**: Tele-consultation queue, Grad-CAM attention inspection, clinical override, and digital sign-off.
2. **Explainable AI (XAI) Grad-CAM Visualizer**:
   - Live interactive opacity slider demonstrating exactly which retinal microvascular zones contributed to the AI classification.
   - Layer toggles: Original Fundus, Grad-CAM Attention Heatmap, Red-Free (Green Filter), and interactive Lesion Markers.
3. **Automated Lesion Quantification**:
   - Microaneurysms (MAs), Intraretinal Hemorrhages (Dot/Blot), Hard Lipid Exudates, Cotton Wool Spots (CWS), and Neovascularization (NVD/NVE).
4. **Official Clinical Referral Slip (PDF / Print)**:
   - Ayushman Bharat & ABDM compatible referral slip with QR verification code, ICD-10 diagnostic codes, and doctor signoff block.
5. **Longitudinal DR Progression Tracking**:
   - Recharts-powered progression charts over 6-24 months and side-by-side fundus image comparisons.

---

## 🚀 How to Run the Project

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Steps to Run Frontend:

```bash
# 1. Navigate to the frontend folder
cd netrasaarthi/frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start local development server
npm run dev
```

The application will launch at: **`http://localhost:5173/`**

---

## 📂 Project Structure & Created Files

```
netrasaarthi/frontend/
├── index.html                   # HTML template with Google Fonts (Inter, Outfit)
├── package.json                 # Dependencies (React 18, Vite, Tailwind CSS, Lucide, Recharts)
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Custom healthcare theme tokens (Emerald, Teal, Amber, Rose)
├── postcss.config.js            # PostCSS configuration
└── src/
    ├── index.css                # Global styles, glassmorphism utilities & print stylesheet
    ├── main.jsx                 # React root render
    ├── App.jsx                  # React Router configuration with all 8 pages
    ├── context/
    │   └── AppContext.jsx       # Global state (user role, language, patients, active scan)
    ├── data/
    │   └── mockData.js          # Clinical DR cases (Grades 0-4), mock patient registry
    ├── utils/
    │   └── retinaCanvas.js      # Dynamic canvas retinal generator with Grad-CAM heatmaps
    ├── components/
    │   ├── Navbar.jsx           # Top navigation with role switch, language & sync status
    │   ├── RetinalVisualizer.jsx# Interactive retinal fundus & Grad-CAM layer visualizer
    │   ├── VoiceGuide.jsx       # Bilingual Web Speech API audio counselor (Hindi/English)
    │   ├── ReferralSlipModal.jsx# Official printable Ayushman Bharat referral slip
    │   └── MedicalDisclaimer.jsx# Standardized clinical decision support disclaimer
    └── pages/
        ├── LoginPage.jsx               # Page 1: Role selector & demo login
        ├── HealthWorkerDashboard.jsx   # Page 2: ASHA worker simplified dashboard
        ├── PatientRegistrationPage.jsx # Page 3: Accessible patient & ABHA registration
        ├── FundusUploadPage.jsx        # Page 4: Camera reticle capture & clinical gallery
        ├── AiAnalysisPage.jsx          # Page 5: 5-Stage animated diagnostic pipeline
        ├── ScreeningResultPage.jsx     # Page 6: Explainable DR grade & lesion findings
        ├── DoctorDashboard.jsx         # Page 7: Specialist tele-triage review queue
        └── PatientHistoryPage.jsx      # Page 8: Recharts DR progression & side-by-side scans
```

---

## ⚠️ Medical Decision Support Disclaimer
NetraSaarthi is an AI-assisted screening and decision support to
ol designed for frontline triage. All automated classifications and Grad-CAM attention maps are intended solely to assist clinical judgment and require formal validation by a registered Ophthalmologist.
