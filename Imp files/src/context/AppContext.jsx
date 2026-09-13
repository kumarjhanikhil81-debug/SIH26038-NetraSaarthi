import React, { createContext, useContext, useState, useEffect } from 'react';
import { INITIAL_PATIENTS, CLINICAL_SAMPLE_CASES, HEALTH_CENTRE_INFO } from '../data/mockData';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Current user role: 'health_worker' or 'doctor'
  const [userRole, setUserRole] = useState('health_worker');
  
  // Language: 'en' (English) or 'hi' (Hindi)
  const [language, setLanguage] = useState('en');
  
  // Simulated rural connectivity & offline synchronization
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Doctor registry
  const [doctors, setDoctors] = useState(() => {
    const saved = localStorage.getItem('netrasaarthi_doctors');
    return saved ? JSON.parse(saved) : [];
  });

  // Currently logged-in / selected doctor
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Patient registry
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
    caseData: CLINICAL_SAMPLE_CASES[3], // Default sample: Severe NPDR
    uploadedImageUrl: null,
    imageQuality: { score: 94, illumination: 'Optimal', focus: 'Sharp', status: 'Good' },
    analysisStep: 0,
    result: null,
    screeningDate: new Date().toISOString()
  });

  // Tele-ophthalmology Doctor Queue
  const [doctorQueue, setDoctorQueue] = useState(() => {
    return INITIAL_PATIENTS.filter(p => p.reviewStatus !== 'Completed');
  });

  // Persist doctors to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('netrasaarthi_doctors', JSON.stringify(doctors));
    } catch (e) {
      console.error('Doctor storage error', e);
    }
  }, [doctors]);

  // Persist patients to localStorage
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

  const registerDoctor = (newDoctor) => {
    const doctorRecord = {
      ...newDoctor,
      id: newDoctor.doctorId,
      registeredAt: new Date().toISOString(),
      status: 'Active'
    };

    setDoctors(prev => {
      const withoutDuplicate = prev.filter(d => d.doctorId !== doctorRecord.doctorId);
      return [doctorRecord, ...withoutDuplicate];
    });
    return doctorRecord;
  };

  const registerPatient = (newPatient) => {
    const patientRecord = {
      ...newPatient,
      id: `PAT-2026-${String(patients.length + 1).padStart(3, '0')}`,
      lastScreeningDate: new Date().toISOString().split('T')[0],
      latestGrade: 0,
      status: 'Pending First Scan',
      reviewStatus: 'Pending',
      history: []
    };
    
    setPatients(prev => [patientRecord, ...prev]);
    setSelectedPatient(patientRecord);
    
    // Set for current screening session
    setScreeningSession(prev => ({
      ...prev,
      patient: patientRecord,
      result: null
    }));

    if (!isOnline) {
      setPendingSyncCount(c => c + 1);
    }

    return patientRecord;
  };

  const selectPatientForScreening = (patient) => {
    setSelectedPatient(patient);
    setScreeningSession(prev => ({
      ...prev,
      patient: patient,
      result: null
    }));
  };

  const setScreeningImageAndCase = (eye, caseData, customImage = null) => {
    setScreeningSession(prev => ({
      ...prev,
      eye: eye,
      caseData: caseData,
      uploadedImageUrl: customImage,
      result: null
    }));
  };

  const recordScreeningResult = (resultPayload) => {
    setScreeningSession(prev => ({
      ...prev,
      result: resultPayload
    }));

    // Update patient record
    setPatients(prev => prev.map(p => {
      if (p.id === screeningSession.patient.id) {
        const newHistory = [
          {
            date: new Date().toISOString().split('T')[0],
            grade: resultPayload.grade,
            rbs: p.rbs || 200,
            hba1c: p.hba1c || 8.0,
            notes: `AI Screening: ${resultPayload.gradeName} (${resultPayload.confidence}% confidence)`
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

  const validateDoctorReview = (patientId, reviewPayload) => {
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

  const syncOfflineScans = () => {
    setPendingSyncCount(0);
    setIsOnline(true);
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
      pendingSyncCount,
      syncOfflineScans,
      doctors,
      selectedDoctor,
      setSelectedDoctor,
      registerDoctor,
      patients,
      selectedPatient,
      setSelectedPatient,
      registerPatient,
      selectPatientForScreening,
      screeningSession,
      setScreeningSession,
      setScreeningImageAndCase,
      recordScreeningResult,
      validateDoctorReview,
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
