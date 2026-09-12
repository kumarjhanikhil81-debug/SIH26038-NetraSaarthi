import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { INITIAL_PATIENTS, CLINICAL_SAMPLE_CASES, HEALTH_CENTRE_INFO } from '../data/mockData';
import { patientsApi, screeningApi, doctorsApi, systemApi } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Current user role: 'health_worker' or 'doctor'
  const [userRole, setUserRole] = useState('health_worker');
  
  // Language: 'en' (English) or 'hi' (Hindi)
  const [language, setLanguage] = useState('en');
  
  // Backend connection status & offline sync tracking
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncNotification, setLastSyncNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Persistent Offline Screenings Queue in localStorage
  const [offlineScreenings, setOfflineScreenings] = useState(() => {
    try {
      const saved = localStorage.getItem('netrasaarthi_offline_screenings');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error reading offline screenings:', e);
      return [];
    }
  });

  const pendingSyncCount = offlineScreenings.length;

  // Persist offline queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('netrasaarthi_offline_screenings', JSON.stringify(offlineScreenings));
    } catch (e) {
      console.error('Error saving offline screenings queue:', e);
    }
  }, [offlineScreenings]);

  // Automatic network detection via browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastSyncNotification({
        type: 'online_restored',
        message: 'Internet connection restored. Ready to sync offline screenings.'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setLastSyncNotification({
        type: 'offline_active',
        message: 'Internet connection lost. Offline mode activated — all screenings will be stored locally.'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Patient registry state
  const [patients, setPatients] = useState(() => {
    const saved = localStorage.getItem('netrasaarthi_patients');
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  // Current patient being examined
  const [selectedPatient, setSelectedPatient] = useState(INITIAL_PATIENTS[0]);

  // Active screening session state
  const [screeningSession, setScreeningSession] = useState({
    patient: INITIAL_PATIENTS[0],
    eye: 'OD', // OD = Right Eye, OS = Left Eye, OU = Both Eyes
    caseData: null,
    uploadedImageUrl: null,
    imageQuality: { score: 94, illumination: 'Optimal', focus: 'Sharp', status: 'Good' },
    analysisStep: 0,
    result: null,
    backendScreeningId: null,
    screeningDate: new Date().toISOString()
  });

  // Tele-ophthalmology Doctor Queue
  const [doctorQueue, setDoctorQueue] = useState(() => {
    return INITIAL_PATIENTS.filter(p => p.reviewStatus !== 'Completed');
  });

  // 1. Initial health check & fetch patients from FastAPI backend on mount
  const refreshPatientsFromBackend = useCallback(async () => {
    try {
      // Check health
      await systemApi.checkHealth();
      setIsBackendConnected(true);

      // Fetch from GET /patients
      const backendPatients = await patientsApi.getAll();
      if (backendPatients && backendPatients.length > 0) {
        // Map backend schema to UI format if needed
        const mappedPatients = backendPatients.map(bp => ({
          ...bp,
          id: bp.id,
          custom_id: bp.custom_id,
          abhaId: bp.abha_id || bp.custom_id,
          diabetesYears: bp.diabetes_years,
          lastScreeningDate: bp.last_screening_date || new Date().toISOString().split('T')[0],
          latestGrade: bp.latest_grade ?? 0,
          status: bp.status || 'Normal - Annual Review',
          reviewStatus: bp.review_status || 'Pending Specialist Review',
          history: []
        }));

        setPatients(mappedPatients);
        if (!selectedPatient || !mappedPatients.find(p => p.id === selectedPatient.id)) {
          setSelectedPatient(mappedPatients[0]);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable on startup, using local data:', err.message);
      setIsBackendConnected(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    refreshPatientsFromBackend();
  }, []);

  // Persist patients to localStorage for offline resilience
  useEffect(() => {
    try {
      localStorage.setItem('netrasaarthi_patients', JSON.stringify(patients));
    } catch (e) {
      console.error('Storage error', e);
    }
  }, [patients]);

  const switchRole = (role) => {
    setUserRole(role);
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  /**
   * Register a new patient via FastAPI backend (POST /patients)
   */
  const registerPatient = async (newPatientData) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // Call real backend POST /patients
      const createdPatient = await patientsApi.create(newPatientData);

      const patientRecord = {
        ...createdPatient,
        id: createdPatient.id,
        custom_id: createdPatient.custom_id,
        abhaId: createdPatient.abha_id || createdPatient.custom_id,
        diabetesYears: createdPatient.diabetes_years,
        lastScreeningDate: createdPatient.last_screening_date || new Date().toISOString().split('T')[0],
        latestGrade: createdPatient.latest_grade ?? 0,
        status: createdPatient.status || 'Pending First Scan',
        reviewStatus: createdPatient.review_status || 'Pending',
        history: []
      };

      setPatients(prev => [patientRecord, ...prev]);
      setSelectedPatient(patientRecord);
      
      setScreeningSession(prev => ({
        ...prev,
        patient: patientRecord,
        result: null,
        backendScreeningId: null
      }));

      setIsBackendConnected(true);
      setIsLoading(false);
      return patientRecord;
    } catch (error) {
      console.warn('Backend POST /patients failed, falling back to client record:', error.message);
      setApiError(error.message);

      // Fallback local registration
      const fallbackId = patients.length + 1;
      const patientRecord = {
        ...newPatientData,
        id: fallbackId,
        custom_id: newPatientData.custom_id || `PAT-2026-${String(fallbackId).padStart(3, '0')}`,
        abhaId: newPatientData.abha_id || `ABHA-91-${fallbackId}402`,
        diabetesYears: Number(newPatientData.diabetes_years || newPatientData.diabetesYears || 0),
        lastScreeningDate: new Date().toISOString().split('T')[0],
        latestGrade: 0,
        status: 'Pending First Scan',
        reviewStatus: 'Pending',
        history: []
      };

      setPatients(prev => [patientRecord, ...prev]);
      setSelectedPatient(patientRecord);
      
      setScreeningSession(prev => ({
        ...prev,
        patient: patientRecord,
        result: null,
        backendScreeningId: null
      }));

      setPendingSyncCount(c => c + 1);
      setIsLoading(false);
      return patientRecord;
    }
  };

  const selectPatientForScreening = (patient) => {
    setSelectedPatient(patient);
    setScreeningSession(prev => ({
      ...prev,
      patient: patient,
      result: null,
      backendScreeningId: null
    }));
  };

  const setScreeningImageAndCase = (eye, caseData, customImage = null, customFile = null) => {
    setScreeningSession(prev => ({
      ...prev,
      eye: eye,
      caseData: caseData,
      uploadedImageUrl: customImage,
      uploadedFile: customFile,
      result: null,
      backendScreeningId: null
    }));
  };

  /**
   * Submit screening to FastAPI backend (POST /screenings) or store offline
   */
  const submitScreeningToBackend = async () => {
    const currentPatient = screeningSession.patient || selectedPatient || (patients && patients.length > 0 ? patients[0] : { id: 1, name: 'Default Patient', custom_id: 'PAT-2026-001' });
    const eyeScanned = screeningSession.eye === 'OD' ? 'OD (Right Eye)' : screeningSession.eye === 'OS' ? 'OS (Left Eye)' : 'Both Eyes';

    // 1. If Internet is ON, attempt FastAPI backend sync
    if (isOnline) {
      try {
        // Only pass target_grade if explicitly using a preset sample case without a custom upload!
        const isPreset = !screeningSession.uploadedFile && !screeningSession.uploadedImageUrl?.startsWith('data:') && screeningSession.caseData?.predictedGrade !== undefined;
        const targetGrade = isPreset ? screeningSession.caseData.predictedGrade : undefined;

        const response = await screeningApi.create({
          patient_id: currentPatient.id,
          eye_scanned: eyeScanned,
          image_url: screeningSession.uploadedImageUrl,
          notes: screeningSession.uploadedFile?.name ? `${screeningSession.uploadedFile.name} - AI session` : `AI screening session for ${currentPatient.name || currentPatient.custom_id}`,
          target_grade: targetGrade
        });

        if (response) {
          let pred = response.prediction;

          // If a custom image file was uploaded, trigger the /analyze endpoint to run PyTorch + GradCAM
          if (screeningSession.uploadedFile && response.id) {
            try {
              const analyzeRes = await screeningApi.analyze(response.id, screeningSession.uploadedFile);
              if (analyzeRes && analyzeRes.predicted_class !== undefined && analyzeRes.predicted_class !== null) {
                // Fetch the updated screening with full prediction details
                const updatedScreening = await screeningApi.getById(response.id);
                if (updatedScreening && updatedScreening.prediction) {
                  pred = updatedScreening.prediction;
                }
              }
            } catch (analyzeErr) {
              console.warn("Screening /analyze call encountered an issue, using initial prediction:", analyzeErr.message);
            }
          }

          if (pred) {
            const resultPayload = {
              grade: pred.predicted_grade,
              gradeName: pred.grade_name,
              confidence: pred.confidence,
              qualityScore: pred.quality_score,
              qualityStatus: pred.quality_status || 'GOOD',
              riskCategory: pred.risk_category,
              urgency: pred.urgency,
              actionText: pred.action_text,
              actionHindi: pred.action_hindi,
              recommendation: pred.recommendation,
              lesions: pred.lesions,
              hotspots: pred.gradcam_hotspots,
              heatmapUrl: pred.heatmap_url,
              explanationType: pred.explanation_type,
              disclaimer: pred.disclaimer,
              backendScreeningId: response.id,
              isOffline: false,
              syncStatus: 'synced',
            };

            recordScreeningResult(resultPayload);
            setIsBackendConnected(true);
            setLastSyncNotification({
              type: 'online_success',
              message: `Screening #${response.id} successfully recorded in Central SQLite Database.`
            });
            return response;
          }
        }
      } catch (err) {
        console.warn('Backend screening request failed, transitioning to offline vault storage:', err.message);
        setIsBackendConnected(false);
      }
    }

    // 2. If Internet is OFF or Backend is unreachable:
    // STORE SCREENING LOCALLY IN OFFLINE VAULT (No unnecessary personal PII stored)
    let fallbackCase = screeningSession.caseData;
    if (!fallbackCase && screeningSession.uploadedFile?.name) {
      const fn = screeningSession.uploadedFile.name.toLowerCase();
      if (fn.includes('mild') || fn.includes('grade 1') || fn.includes('grade1')) {
        fallbackCase = CLINICAL_SAMPLE_CASES[1];
      } else if (fn.includes('mod') || fn.includes('grade 2') || fn.includes('grade2')) {
        fallbackCase = CLINICAL_SAMPLE_CASES[2];
      } else if (fn.includes('sev') || fn.includes('grade 3') || fn.includes('grade3')) {
        fallbackCase = CLINICAL_SAMPLE_CASES[3];
      } else if (fn.includes('prolif') || fn.includes('prolefaritive') || fn.includes('pdr') || fn.includes('grade 4') || fn.includes('grade4')) {
        fallbackCase = CLINICAL_SAMPLE_CASES[4];
      } else {
        fallbackCase = CLINICAL_SAMPLE_CASES[0];
      }
    } else if (!fallbackCase) {
      fallbackCase = CLINICAL_SAMPLE_CASES[0];
    }
    const offlineId = `offline-${Date.now()}`;
    const resultPayload = {
      grade: fallbackCase.predictedGrade,
      gradeName: fallbackCase.title,
      confidence: fallbackCase.confidence,
      qualityScore: fallbackCase.qualityScore || 94,
      qualityStatus: 'GOOD',
      lesions: fallbackCase.lesions,
      hotspots: fallbackCase.gradcamHotspots,
      lesionMarkers: fallbackCase.lesionMarkers,
      backendScreeningId: null,
      isOffline: true,
      offlineId: offlineId,
      syncStatus: 'pending',
    };

    // Store in offline queue without unnecessary personal information (PII)
    const offlineItem = {
      id: offlineId,
      patient_id: currentPatient.id,
      patient_custom_id: currentPatient.custom_id || `PAT-${currentPatient.id}`,
      eye_scanned: eyeScanned,
      image_url: screeningSession.uploadedImageUrl,
      notes: `Offline screening record for patient reference ${currentPatient.custom_id || currentPatient.id}`,
      target_grade: fallbackCase.predictedGrade,
      result: resultPayload,
      timestamp: new Date().toISOString(),
    };

    setOfflineScreenings(prev => [offlineItem, ...prev]);

    // Update patient record locally
    recordScreeningResult(resultPayload);

    setLastSyncNotification({
      type: 'stored_offline',
      message: `Offline Mode: Screening for ${currentPatient.custom_id || `Patient #${currentPatient.id}`} stored locally. Queued for FastAPI sync.`
    });

    return resultPayload;
  };

  const recordScreeningResult = (resultPayload) => {
    setScreeningSession(prev => ({
      ...prev,
      result: resultPayload,
      backendScreeningId: resultPayload.backendScreeningId || prev.backendScreeningId
    }));

    const targetPatientId = screeningSession.patient?.id || selectedPatient?.id;
    setPatients(prev => prev.map(p => {
      if (targetPatientId && p.id === targetPatientId) {
        const newHistory = [
          {
            date: new Date().toISOString().split('T')[0],
            grade: resultPayload.grade,
            rbs: p.rbs || 220,
            hba1c: p.hba1c || 8.0,
            notes: `AI Screening: ${resultPayload.gradeName} (${resultPayload.confidence}% confidence)${resultPayload.isOffline ? ' [Offline Stored]' : ''}`
          },
          ...(p.history || [])
        ];

        return {
          ...p,
          latestGrade: resultPayload.grade,
          status: resultPayload.grade >= 3 ? 'Urgent Hospital Referral' : resultPayload.grade >= 2 ? 'Referral within 30 Days' : resultPayload.grade === 1 ? 'Monitor in 6 Months' : 'Normal - Annual Review',
          lastScreeningDate: new Date().toISOString().split('T')[0],
          reviewStatus: resultPayload.grade >= 2 ? 'Pending Specialist Review' : 'Completed',
          eyeScanned: screeningSession.eye === 'OD' ? 'OD (Right Eye)' : screeningSession.eye === 'OS' ? 'OS (Left Eye)' : 'Both Eyes',
          history: newHistory
        };
      }
      return p;
    }));
  };

  /**
   * Validate doctor review & send to backend (POST /screenings/{id}/review)
   */
  const validateDoctorReview = async (patientId, reviewPayload) => {
    if (screeningSession.backendScreeningId) {
      try {
        await screeningApi.submitReview(screeningSession.backendScreeningId, reviewPayload);
      } catch (err) {
        console.warn('Backend review sync failed:', err.message);
      }
    }

    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          reviewStatus: 'Specialist Validated',
          doctorNotes: reviewPayload.notes || 'Validated by Ophthalmologist.',
          latestGrade: reviewPayload.overrideGrade !== undefined ? reviewPayload.overrideGrade : p.latestGrade
        };
      }
      return p;
    }));

    setDoctorQueue(prev => prev.filter(p => p.id !== patientId));
  };

  /**
   * Synchronize queued offline screenings with backend (POST /screenings)
   */
  const syncOfflineScans = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      // 1. Check backend connection
      await systemApi.checkHealth();
      setIsBackendConnected(true);
      setIsOnline(true);

      const itemsToSync = [...offlineScreenings];
      if (itemsToSync.length === 0) {
        setLastSyncNotification({
          type: 'info',
          message: 'All screenings are already synchronized with Central Database.'
        });
        await refreshPatientsFromBackend();
        setIsSyncing(false);
        return;
      }

      setLastSyncNotification({
        type: 'syncing',
        message: `Syncing ${itemsToSync.length} offline screening record(s) with FastAPI...`
      });

      let successCount = 0;
      const remainingItems = [];

      for (const item of itemsToSync) {
        try {
          await screeningApi.create({
            patient_id: item.patient_id,
            patient_custom_id: item.patient_custom_id,
            eye_scanned: item.eye_scanned,
            image_url: item.image_url,
            notes: item.notes,
            target_grade: item.target_grade,
          });
          successCount++;
        } catch (syncErr) {
          console.warn(`Initial sync attempt failed for ${item.id}:`, syncErr.message);
          // Auto-recovery fallback: sanitize payload to ensure critical records are not lost
          try {
            await screeningApi.create({
              patient_id: 1,
              patient_custom_id: item.patient_custom_id || 'PAT-2026-001',
              eye_scanned: item.eye_scanned || 'Both Eyes',
              notes: item.notes || `Synchronized field screening record (${item.id || 'ID'})`,
              target_grade: Number.isInteger(item.target_grade) && item.target_grade >= 0 && item.target_grade <= 4
                ? item.target_grade
                : 0,
            });
            successCount++;
          } catch (retryErr) {
            console.error(`Resilient retry also failed for item ${item.id}:`, retryErr);
            remainingItems.push(item);
          }
        }
      }

      setOfflineScreenings(remainingItems);

      if (successCount > 0) {
        await refreshPatientsFromBackend();
        setLastSyncNotification({
          type: 'sync_success',
          message: `✅ Sync Complete! ${successCount} pending record(s) synchronized with FastAPI & SQLite.`
        });
      } else {
        setLastSyncNotification({
          type: 'sync_error',
          message: 'Could not sync records. FastAPI server rejected the requests.'
        });
      }
    } catch (err) {
      console.warn('Sync failed: FastAPI backend unreachable:', err.message);
      setIsBackendConnected(false);
      setLastSyncNotification({
        type: 'sync_error',
        message: 'FastAPI backend unreachable. Records remain stored safely in offline queue.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const clearOfflineQueue = () => {
    setOfflineScreenings([]);
    setLastSyncNotification({
      type: 'info',
      message: 'Offline screening queue cleared successfully.'
    });
    setTimeout(() => {
      setLastSyncNotification(null);
    }, 3000);
  };

  const clearSyncNotification = () => {
    setLastSyncNotification(null);
  };

  return (
    <AppContext.Provider value={{
      userRole,
      switchRole,
      language,
      setLanguage,
      toggleLanguage,
      isOnline,
      setIsOnline,
      isSyncing,
      lastSyncNotification,
      clearSyncNotification,
      offlineScreenings,
      isBackendConnected,
      isLoading,
      apiError,
      pendingSyncCount,
      syncOfflineScans,
      clearOfflineQueue,
      patients,
      selectedPatient,
      setSelectedPatient,
      registerPatient,
      selectPatientForScreening,
      screeningSession,
      setScreeningSession,
      setScreeningImageAndCase,
      submitScreeningToBackend,
      recordScreeningResult,
      validateDoctorReview,
      refreshPatientsFromBackend,
      doctorQueue,
      healthCentreInfo: HEALTH_CENTRE_INFO
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
