# NetraSaarthi — Demo Script
### Explainable AI for Diabetic Retinopathy Screening in Rural India
**Smart India Hackathon (SIH) Prototype Demonstration**

---

> [!IMPORTANT]
> **Clinical Decision-Support Prototype Notice**  
> NetraSaarthi is an **AI-assisted screening and decision-support prototype** intended for preliminary triage. It is not a certified diagnostic device. AI predictions and Grad-CAM visualizations must be verified by a registered medical doctor or ophthalmologist.

---

## 1. Introduction

### Objective
Introduce the clinical problem and setting where access to ophthalmologists and specialized eye-care equipment is severely constrained.

### Spoken Script
> *"Good morning, respected jury members. Today, over 77 million individuals in India live with diabetes, and nearly 1 in 4 will develop Diabetic Retinopathy—the leading cause of preventable adult blindness.*
> 
> *The tragedy is that early detection can prevent over 90% of severe vision loss. However, in rural India, where over 65% of the population resides, specialized eye care is virtually absent: there is often less than one ophthalmologist per 150,000 citizens. Most patients travel to a District Hospital only after irreversible vision loss has already occurred.*
> 
> *To address this gap, we present **NetraSaarthi (नेत्रसारथी)**: an offline-first, explainable AI screening and decision-support prototype designed for frontline healthcare workers (ASHA/ANM) at Ayushman Arogya Mandirs (PHCs) to triage diabetic retinopathy at the village doorstep."*

### On-Screen Action
- Open the application at the **Login Portal** (`/login`).
- Point out the role selection interface designed for rural health settings: **Rural Health Worker (ASHA / ANM)** and **Consultant Ophthalmologist**.

---

## 2. Patient Registration

### Objective
Demonstrate creating an anonymous, privacy-compliant patient record without collecting unnecessary personally identifiable information.

### Spoken Script
> *"We begin by logging in as Smt. Devi Sharma, an ASHA health worker. Devi registers a patient during a village screening session.*
> 
> *Notice that in strict compliance with healthcare data privacy and India's Digital Personal Data Protection Act (DPDPA 2023), NetraSaarthi generates an anonymous, unique clinical token—`PAT-2026-001`. No unnecessary personal demographic details are required for the screening workflow."*

### On-Screen Action
1. Click **"Login as Rural Health Worker"** $\rightarrow$ Navigates to `/health-worker`.
2. Click **"Register New Patient"** $\rightarrow$ Navigates to `/patient-registration`.
3. Select or enter:
   - **Patient ID**: `PAT-2026-001` (Auto-generated anonymous token)
   - **Age / Gender**: 54 / Male
   - **Diabetes History**: Type-2 Diabetes (8 years duration)
   - **Eye Examined**: Right Eye (OD)
4. Click **"Proceed to Fundus Capture"** $\rightarrow$ Transitions to `/fundus-upload`.

---

## 3. Fundus Image

### Objective
Demonstrate uploading or capturing a digital retinal fundus photograph using portable or camp-grade cameras.

### Spoken Script
> *"Now, Devi captures a digital retinal fundus image using a portable, handheld fundus camera or uploads an existing capture. The interface provides a clear circular reticle to ensure proper macula and optic disc alignment."*

### On-Screen Action
- On `/fundus-upload`, click **"Load Diagnostic-Grade Fundus Scan"** (Grade 2 Moderate NPDR sample) or drag and drop a retinal fundus image (`.png` / `.jpg`).
- The fundus image displays centered in the viewport with the eye scanned (`Right Eye (OD)`).

---

## 4. Image Quality Check

### Objective
Showcase the pre-inference heuristic gate determining whether the image is suitable for AI processing before running the deep learning model.

### Spoken Script
> *"In rural outreach camps, images are frequently compromised by camera shake, ambient light glare, or dark exposure. Feeding poor images into an AI model causes false outputs.*
> 
> *Before any AI inference takes place, NetraSaarthi runs an explainable, heuristic **Image Quality Gate**. It analyzes four physical parameters: resolution, luminance, contrast, and Laplacian blur variance.*
> 
> *If an image is blurred or dark, the gate immediately flags `RETAKE_REQUIRED` with plain-language feedback. Here, our image achieves a quality score of 95/100—**GOOD**—confirming sharp vascular margins and balanced illumination."*

### On-Screen Action
- Point to the **Image Quality Gate Status Card**:
  - **Quality Score**: `95.0 / 100`
  - **Quality Status**: `GOOD`
  - **Heuristic Feedback**:
    - *Resolution: 224×224 meets standard criteria.*
    - *Illumination: Well-balanced mean luminance (122/255).*
    - *Contrast: High contrast (std dev: 68.7).*
    - *Sharpness: Clear focus with distinct vessel margins.*
- Click **"Analyze with AI"** to initiate the screening pipeline.

---

## 5. AI Screening

### Objective
Execute the PyTorch deep learning model and display the predicted severity class, confidence score, and screening status.

### Spoken Script
> *"Our PyTorch EfficientNet-B0 model analyzes the standardized retinal tensor in under 200 milliseconds.*
> 
> *The AI outputs three key findings:*
> 1. *The predicted severity stage: **Grade 2 — Moderate Non-Proliferative Diabetic Retinopathy (NPDR)**,*
> 2. *A confidence score of **82.4%**, and*
> 3. *The screening status: **COMPLETED / REFERABLE**."*

### On-Screen Action
- The application navigates to the **Screening Result Page** (`/screening-result`):
  - **Predicted DR Class**: `Grade 2: Moderate NPDR` (Yellow-Amber badge)
  - **Confidence Score**: `82.4%`
  - **Screening Status**: `Analysis Completed — Referable`

---

## 6. Explainability

### Objective
Display the Grad-CAM visual attention heatmap and explain that the visualization indicates image regions that influenced the model's prediction.

### Spoken Script
> *"In medical triage, black-box predictions are unacceptable. Clinicians must understand **why** the model made this prediction.*
> 
> *Here, NetraSaarthi displays a **Grad-CAM (Gradient-weighted Class Activation Mapping)** attention heatmap. This visualization reveals the specific retinal regions that influenced the model's decision.*
> 
> *Notice that the warm red and yellow attention hotspots concentrate precisely over microvascular lesions—specifically microaneurysms and blot hemorrhages—rather than background tissue or optical flash artifacts.*
> 
> *Using our interactive visualizer, the user can slide the heatmap opacity, toggle the Red-Free green filter to sharpen blood vessels, and inspect automated lesion overlays."*

### On-Screen Action
1. Move the **Grad-CAM Heatmap Opacity Slider** from 0% to 100% to blend the attention map over the fundus photograph.
2. Toggle the **Red-Free Filter (Green Channel)** on to show vascular contrast.
3. Toggle the **Lesion Markers Overlay** on to highlight microaneurysm and hemorrhage locations.
4. Point out the clear disclaimer: *"Grad-CAM indicates assistive visual attention regions; it is not a certified lesion segmentation map."*

---

## 7. Referral Recommendation

### Objective
Show the appropriate prototype referral recommendation and triage pathway based on the predicted stage.

### Spoken Script
> *"Based on the ICDR staging, NetraSaarthi generates an automated, prototype triage referral recommendation:*
> 
> *For Grade 2 Moderate NPDR, the recommendation advises: **'Refer to Ophthalmologist at District Hospital within 4 to 8 weeks. Emphasize glycemic and blood pressure control.'***
> 
> *For non-literate patients, our bilingual voice guide translates this finding into spoken Hindi and English counseling aloud."*

### On-Screen Action
- Highlight the **Referral Recommendation Card**:
  - **Triage Level**: `Referable (Moderate Urgency)`
  - **Recommended Action**: `Specialist ophthalmology evaluation within 4–8 weeks at District Hospital`
  - **Guidance**: `Reinforce glycemic control, blood pressure management, and lifestyle counseling.`
- Click **"Play Audio Counseling (Hindi)"** to demonstrate the Web Speech API speaking the guidance in spoken Hindi.

---

## 8. Doctor Dashboard

### Objective
Open the tele-ophthalmology doctor dashboard to show the patient record, retinal image, AI predictions, confidence, Grad-CAM explainability, and doctor review workflow.

### Spoken Script
> *"Now, we switch to the tele-ophthalmology portal at the District Hospital, where Dr. Rajesh Varma reviews the queue.*
> 
> *In the Doctor Dashboard, Dr. Varma sees:*
> - *The anonymous Patient ID (`PAT-2026-001`),*
> - *The high-resolution retinal fundus photograph,*
> - *The AI predicted class (Grade 2) and confidence score,*
> - *The Grad-CAM attention heatmap overlay, and*
> - *The clinical doctor review panel.*
> 
> *Under our Human-in-the-Loop design, Dr. Varma retains full authority to confirm or override the AI grade, add prescription notes, and digitally sign off. Finally, he generates an official, printable Ayushman Bharat (ABDM) referral slip with an ICD-10 diagnostic code and QR verification."*

### On-Screen Action
1. Click **"Switch Role"** in navbar $\rightarrow$ Select **Consultant Ophthalmologist** (`/doctor-dashboard`).
2. Click on patient **`PAT-2026-001` (Ramesh Kumar)** in the tele-triage queue.
3. Show the comprehensive specialist panel displaying:
   - **Patient ID**: `PAT-2026-001`
   - **Retinal Image & Grad-CAM Heatmap**: Side-by-side comparative inspection
   - **AI Result & Confidence**: `Grade 2 (82.4%)`
   - **Doctor Review Controls**: Radio selection allowing clinical confirmation or override
4. Type in the clinical notes: *"Confirmed Grade 2 NPDR. Advise dilated fundus exam and optical coherence tomography (OCT) at District Hospital."*
5. Click **"Confirm & Sign Off"** $\rightarrow$ Click **"Generate Referral Slip"**.
6. Display the printable referral slip modal with the QR code and ICD-10 code (`E11.319`).

---

## 9. Offline Demonstration

### Objective
Demonstrate the application's offline-first functionality in simulated connectivity-deprived rural field conditions.

### Spoken Script
> *"Now let us test the true rural field reality: complete cellular network outage in a remote village camp.*
> 
> *I will now toggle the network status to **Offline Mode**. Watch how NetraSaarthi responds.*
> 
> *Notice the amber 'Offline Mode Active' banner. Because our application shell is pre-cached with a Service Worker, the interface remains completely responsive.*
> 
> *When we perform a new screening while offline, the record is stored safely in the device's local vault. Look at the sync badge: `1 record pending sync`. In compliance with DPDPA 2023, zero personal identifying information is stored in local browser storage.*
> 
> *Now, when connectivity returns—simulated by toggling Internet back ON—NetraSaarthi immediately detects the connection, verifies the FastAPI backend, and automatically synchronizes the queued screening to the central database without any user intervention."*

### On-Screen Action
1. In the top navbar, click the **"Internet ON / OFF"** toggle switch to turn Internet **OFF**.
2. Point out:
   - Sticky top banner: `🟠 Offline Mode Active — Screenings queued locally on this device`
   - Navbar status badge: `🟠 Offline Mode (0 Pending)`
3. Click **"New Screening"** $\rightarrow$ Conduct an offline screening $\rightarrow$ Click Submit.
4. Show the **Local Device Vault ribbon** and the updated badge: `1 pending sync`.
5. In the top navbar, toggle Internet **ON**.
6. Observe the automatic background sync:
   - Sync spinner activates.
   - Confirmation toast appears: `✅ Central Server Sync Complete! 1 screening uploaded to Central Database.`
   - Pending counter resets to `0 pending`.

---

## 10. Closing

### Objective
Conclude by articulating the project's four core foundational principles.

### Spoken Script
> *"Respected jury members, to summarize, NetraSaarthi is built on four core principles:*
> 
> 1. ***Explainable AI**: We reject black-box models. Grad-CAM visual attention heatmaps ensure every prediction is visually interpretable and verifiable by clinicians.*
> 2. ***Offline-First**: Built as a Progressive Web Application with local vault persistence, ensuring zero data loss even in the most remote cellular dead zones.*
> 3. ***Human-in-the-Loop**: The AI serves as an assistive triage aid. Final clinical decisions, diagnostic overrides, and prescription sign-offs always remain in the hands of qualified healthcare professionals.*
> 4. ***Rural-First**: Tailored specifically for India's public health infrastructure—combining low-cost camera quality gating, touch-friendly ASHA interfaces, bilingual voice counseling, and ABDM referral integration.*
> 
> *NetraSaarthi brings high-precision ophthalmic screening to the millions who need it most. Thank you, and we look forward to your questions."*

### On-Screen Action
- Navigate back to the main dashboard or display the closing summary card.
- Open the floor for jury questions.
