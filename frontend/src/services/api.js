/**
 * NetraSaarthi Centralized API Client
 * Connects React Frontend to FastAPI Backend (SQLite)
 */

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

/**
 * Generic HTTP request wrapper with standardized error handling and response parsing
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = {
    'Accept': 'application/json',
    ...options.headers,
  };

  // Only set Content-Type: application/json if body is NOT FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON or text response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      if (data && typeof data === 'object' && data.detail) {
        if (Array.isArray(data.detail)) {
          // Pydantic validation errors
          errorMessage = data.detail.map(e => `${e.loc?.slice(1)?.join('.') || 'field'}: ${e.msg}`).join(', ');
        } else {
          errorMessage = data.detail;
        }
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      // Network unreachable / CORS / Server offline
      const networkError = new Error(
        `Unable to reach NetraSaarthi backend at ${API_BASE_URL}. Ensure the FastAPI server is running (uvicorn backend.main:app --reload).`
      );
      networkError.isNetworkError = true;
      throw networkError;
    }
    throw error;
  }
}

// ---------------------------------------------------------
// Patient API Endpoints (POST /patients, GET /patients)
// ---------------------------------------------------------
export const patientsApi = {
  /**
   * Register a new patient in the database
   * POST /patients
   */
  async create(patientData) {
    const payload = {
      name: patientData.name || `Patient ${patientData.custom_id || patientData.patientId || 'ANON'}`,
      custom_id: patientData.custom_id || patientData.patientId || undefined,
      abha_id: patientData.abha_id || patientData.abhaId || undefined,
      age: Number(patientData.age) || 50,
      gender: patientData.gender || 'Not Disclosed',
      village: patientData.village || 'Primary Health Centre',
      phone: patientData.phone || undefined,
      diabetes_years: Number(patientData.diabetes_years ?? patientData.diabetesYears ?? patientData.diabetesDuration) || 0,
      hypertension: Boolean(patientData.hypertension),
      insulin: Boolean(patientData.insulin),
      rbs: patientData.rbs ? Number(patientData.rbs) : undefined,
      hba1c: patientData.hba1c ? Number(patientData.hba1c) : undefined,
      symptoms: Array.isArray(patientData.symptoms) ? patientData.symptoms : (patientData.notes ? [patientData.notes] : []),
    };

    return await apiRequest('/patients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieve all patients with optional search
   * GET /patients
   */
  async getAll(search = '', skip = 0, limit = 100) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (skip) params.append('skip', skip.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    return await apiRequest(`/patients${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get single patient by ID with complete screening history
   * GET /patients/{id}
   */
  async getById(patientId) {
    return await apiRequest(`/patients/${patientId}`);
  },
};

// ---------------------------------------------------------
// Screening API Endpoints (POST /screenings, GET /screenings)
// ---------------------------------------------------------
export const screeningApi = {
  /**
   * Submit an eye screening for AI analysis & storage
   * POST /screenings
   */
  async create(screeningData) {
    let pId = screeningData.patient_id || screeningData.patientId || 1;
    let customId = screeningData.patient_custom_id || screeningData.custom_id;

    if (typeof pId === 'string') {
      if (!customId && pId.startsWith('PAT-')) {
        customId = pId;
      }
      const patMatch = pId.match(/(\d+)$/);
      if (patMatch) {
        const parsed = parseInt(patMatch[1], 10);
        pId = !isNaN(parsed) && parsed > 0 ? parsed : 1;
      } else {
        const parsed = parseInt(pId.replace(/\D/g, ''), 10);
        pId = !isNaN(parsed) && parsed > 0 ? parsed : 1;
      }
    } else if (typeof pId === 'number') {
      if (pId > 1000) {
        pId = (pId % 1000) || 1;
      }
    } else {
      pId = 1;
    }

    const payload = {
      patient_id: pId,
      patient_custom_id: customId || undefined,
      eye_scanned: screeningData.eye_scanned || (screeningData.eye === 'OD' ? 'OD (Right Eye)' : screeningData.eye === 'OS' ? 'OS (Left Eye)' : 'Both Eyes'),
      image_url: screeningData.image_url || screeningData.uploadedImageUrl || undefined,
      notes: screeningData.notes || undefined,
      target_grade: Number.isInteger(screeningData.target_grade) && screeningData.target_grade >= 0 && screeningData.target_grade <= 4
        ? screeningData.target_grade
        : undefined,
    };

    return await apiRequest('/screenings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * List recent screenings
   * GET /screenings
   */
  async getAll(patientId = null, skip = 0, limit = 50) {
    const params = new URLSearchParams();
    if (patientId) params.append('patient_id', patientId.toString());
    if (skip) params.append('skip', skip.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    return await apiRequest(`/screenings${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get full screening details by ID
   * GET /screenings/{id}
   */
  async getById(screeningId) {
    return await apiRequest(`/screenings/${screeningId}`);
  },

  /**
   * Submit ophthalmologist review & grade override
   * POST /screenings/{id}/review
   */
  async submitReview(screeningId, reviewData) {
    const payload = {
      doctor_name: reviewData.doctor_name || reviewData.doctorName || 'Dr. Arvind Joshi, MD',
      confirmed_grade: Number(reviewData.confirmed_grade ?? reviewData.overrideGrade ?? 0),
      agree_with_ai: Boolean(reviewData.agree_with_ai ?? true),
      doctor_notes: reviewData.doctor_notes || reviewData.notes || 'Validated by Specialist.',
      follow_up_recommendation: reviewData.follow_up_recommendation || reviewData.advisory || 'Follow routine clinical protocol.',
    };

    return await apiRequest(`/screenings/${screeningId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Analyze retinal fundus image using PyTorch EfficientNet-B0 and Grad-CAM
   * POST /screenings/analyze
   * @param {number} screeningId
   * @param {File|Blob} imageFile
   */
  async analyze(screeningId, imageFile) {
    const formData = new FormData();
    formData.append('screening_id', screeningId.toString());
    formData.append('image', imageFile);

    return await apiRequest('/screenings/analyze', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Evaluate fundus image quality before screening
   * POST /screenings/quality-check
   * @param {File|Blob} imageFile
   */
  async checkQuality(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    return await apiRequest('/screenings/quality-check', {
      method: 'POST',
      body: formData,
    });
  },
};

// ---------------------------------------------------------
// Doctor Triage Endpoints (GET /doctors/review-queue)
// ---------------------------------------------------------
export const doctorsApi = {
  /**
   * Fetch high-risk patients needing tele-ophthalmology review
   * GET /doctors/review-queue
   */
  async getReviewQueue() {
    return await apiRequest('/doctors/review-queue');
  },
};

// ---------------------------------------------------------
// System & Health Endpoints (GET /health)
// ---------------------------------------------------------
export const systemApi = {
  /**
   * Check backend server status
   * GET /health
   */
  async checkHealth() {
    return await apiRequest('/health');
  },
};

export default {
  patients: patientsApi,
  screening: screeningApi,
  doctors: doctorsApi,
  system: systemApi,
  BASE_URL: API_BASE_URL,
};
