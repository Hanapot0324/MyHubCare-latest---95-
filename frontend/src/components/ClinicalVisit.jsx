import React, { useState, useEffect } from 'react';
import { X, Check, Download, Plus, Search, Filter } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

// Constants for valid options
const validVisitTypes = [
  'initial',
  'follow_up',
  'emergency',
  'routine',
  'art_pickup',
];
const validWhoStages = [
  'Stage 1',
  'Stage 2',
  'Stage 3',
  'Stage 4',
  'Not Applicable',
];
const validDiagnosisTypes = [
  'primary',
  'secondary',
  'differential',
  'rule_out',
];

const ClinicalVisits = () => {
  const [clinicalVisits, setClinicalVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [modalMode, setModalMode] = useState('add');
  const [toast, setToast] = useState(null);
  const [patients, setPatients] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all required data on component mount
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchPatients(), fetchFacilities()]);
      await fetchClinicalVisits();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to view patient data',
          type: 'error',
        });
        return;
      }

      console.log('Fetching patients from:', `${API_URL}/patients`);

      const response = await fetch(`${API_URL}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Patients response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Patients raw data:', data);

      // Handle different response formats
      let patientsArray = [];
      if (Array.isArray(data)) {
        patientsArray = data;
      } else if (data && typeof data === 'object') {
        // Try common property names
        patientsArray = data.patients || data.data || data.results || [];
      }

      console.log('Patients array:', patientsArray);

      if (patientsArray.length > 0) {
        setPatients(patientsArray);
      } else {
        console.warn('No patients found in response');
        setToast({ message: 'No patients found', type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setToast({
        message: `Failed to load patients: ${error.message}`,
        type: 'error',
      });
    }
  };

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to view facility data',
          type: 'error',
        });
        return;
      }

      // Try multiple possible endpoints
      const endpoints = ['/facilities', '/branches', '/facilities/list'];
      let data = null;
      let successEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying facilities endpoint: ${API_URL}${endpoint}`);
          const response = await fetch(`${API_URL}${endpoint}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            data = await response.json();
            successEndpoint = endpoint;
            console.log(`Success with endpoint: ${endpoint}`);
            break;
          }
        } catch (e) {
          console.log(`Failed endpoint ${endpoint}:`, e.message);
        }
      }

      if (!data) {
        throw new Error('All facility endpoints failed');
      }

      console.log('Facilities raw data from', successEndpoint, ':', data);

      // Handle different response formats
      let facilitiesArray = [];
      if (Array.isArray(data)) {
        facilitiesArray = data;
      } else if (data && typeof data === 'object') {
        // Try common property names
        facilitiesArray =
          data.facilities || data.data || data.results || data.branches || [];
      }

      console.log('Facilities array:', facilitiesArray);

      if (facilitiesArray.length > 0) {
        setFacilities(facilitiesArray);
      } else {
        console.warn('No facilities found in response');
        setToast({ message: 'No facilities found', type: 'warning' });
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
      setToast({
        message: `Failed to load facilities: ${error.message}`,
        type: 'error',
      });
    }
  };

  const fetchClinicalVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to view clinical visits',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/clinical-visits`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (Array.isArray(data)) {
        // Backend returns array directly, not wrapped in success object
        setClinicalVisits(data);
      } else {
        setToast({
          message: 'Failed to load clinical visits',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching clinical visits:', error);
      setToast({ message: 'Failed to load clinical visits', type: 'error' });
    }
  };

  const getPatientName = (patientId) => {
    const patient = patients.find((p) => p.patient_id === patientId);
    if (!patient) return 'Unknown Patient';
    return `${patient.first_name} ${
      patient.middle_name ? patient.middle_name + ' ' : ''
    }${patient.last_name}${patient.suffix ? ' ' + patient.suffix : ''}`;
  };

  const getFacilityName = (facilityId) => {
    const facility = facilities.find((f) => f.facility_id === facilityId);
    return facility ? facility.name : 'Unknown Facility';
  };

  const handleSaveVisit = async (visitData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to save clinical visits',
          type: 'error',
        });
        return;
      }

      const transformedData = {
        patient_id: visitData.patient_id,
        provider_id: visitData.provider_id || 'default-provider', // Add a default or get from user context
        facility_id: visitData.facility_id,
        visit_date: visitData.visitDate,
        visit_type: visitData.visitType,
        who_stage: visitData.whoStage,
        chief_complaint: visitData.chiefComplaint,
        clinical_notes: visitData.notes,
        assessment: visitData.assessment || '',
        plan: visitData.plan || '',
        follow_up_date: visitData.followUpDate || null,
        follow_up_reason: visitData.followUpReason || '',
        vital_signs: {
          systolic_bp: parseInt(
            visitData.vitalSigns.bloodPressure.split('/')[0]
          ),
          diastolic_bp: parseInt(
            visitData.vitalSigns.bloodPressure.split('/')[1]
          ),
          pulse_rate: parseInt(visitData.vitalSigns.heartRate),
          respiratory_rate: parseInt(visitData.vitalSigns.respiratoryRate),
          temperature_c: parseFloat(visitData.vitalSigns.temperature),
          weight_kg: parseFloat(visitData.vitalSigns.weight),
          height_cm: parseFloat(visitData.vitalSigns.height),
        },
        diagnoses: visitData.diagnoses || [],
        procedures: visitData.procedures || [],
      };

      const response = await fetch(`${API_URL}/clinical-visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(transformedData),
      });

      const data = await response.json();
      if (response.ok) {
        // Backend returns the created visit directly, not wrapped in success object
        setToast({
          message: 'Clinical visit recorded successfully',
          type: 'success',
        });
        setShowModal(false);
        setSelectedVisit(null);
        fetchClinicalVisits();
      } else {
        setToast({
          message: data.error || 'Failed to save clinical visit',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving clinical visit:', error);
      setToast({ message: 'Failed to save clinical visit', type: 'error' });
    }
  };

  const handleViewDetails = async (visit) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to view visit details',
          type: 'error',
        });
        return;
      }

      const response = await fetch(
        `${API_URL}/clinical-visits/${visit.visit_id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setSelectedVisit(data);
        setModalMode('view');
        setShowModal(true);
      } else {
        setToast({
          message: data.error || 'Failed to fetch visit details',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching visit details:', error);
      setToast({ message: 'Failed to fetch visit details', type: 'error' });
    }
  };

  const handleUpdateVisit = async (visitData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to update clinical visits',
          type: 'error',
        });
        return;
      }

      const transformedData = {
        provider_id: visitData.provider_id || 'default-provider',
        facility_id: visitData.facility_id,
        visit_date: visitData.visitDate,
        visit_type: visitData.visitType,
        who_stage: visitData.whoStage,
        chief_complaint: visitData.chiefComplaint,
        clinical_notes: visitData.notes,
        assessment: visitData.assessment || '',
        plan: visitData.plan || '',
        follow_up_date: visitData.followUpDate || null,
        follow_up_reason: visitData.followUpReason || '',
      };

      const response = await fetch(
        `${API_URL}/clinical-visits/${visitData.visit_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transformedData),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setToast({
          message: 'Clinical visit updated successfully',
          type: 'success',
        });
        setShowModal(false);
        setSelectedVisit(null);
        fetchClinicalVisits();
      } else {
        setToast({
          message: data.error || 'Failed to update clinical visit',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating clinical visit:', error);
      setToast({ message: 'Failed to update clinical visit', type: 'error' });
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to delete this visit?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setToast({
          message: 'Please login to delete clinical visits',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/clinical-visits/${visitId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setToast({
          message: 'Clinical visit deleted successfully',
          type: 'success',
        });
        fetchClinicalVisits();
      } else {
        const data = await response.json();
        setToast({
          message: data.error || 'Failed to delete clinical visit',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting clinical visit:', error);
      setToast({ message: 'Failed to delete clinical visit', type: 'error' });
    }
  };

  const handleRecordNewVisit = () => {
    setSelectedVisit(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleEditVisit = (visit) => {
    setSelectedVisit(visit);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleExportPDF = () => {
    setToast({ message: 'Exporting...', type: 'info' });
    setTimeout(() => {
      const pdfContent = generatePDFContent();
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'clinical_visits.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: 'Exported successfully', type: 'success' });
    }, 1500);
  };

  const handleExportSinglePDF = (visit) => {
    setToast({ message: 'Exporting...', type: 'info' });
    setTimeout(() => {
      const pdfContent = generateSinglePDFContent(visit);
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinical_visit_${visit.patientName.replace(
        /\s+/g,
        '_'
      )}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setToast({ message: 'Exported successfully', type: 'success' });
    }, 1500);
  };

  const generatePDFContent = () => {
    let content = 'CLINICAL VISITS REPORT\n\n';
    clinicalVisits.forEach((visit, index) => {
      content += `Visit ${index + 1}\n`;
      content += `Patient: ${getPatientName(visit.patient_id)}\n`;
      content += `Facility: ${getFacilityName(visit.facility_id)}\n`;
      content += `Date: ${formatDate(visit.visit_date)}\n`;
      content += `Visit Type: ${visit.visit_type}\n`;
      content += `WHO Stage: ${visit.who_stage}\n`;
      content += `Chief Complaint: ${visit.chief_complaint}\n`;
      content += `Notes: ${visit.clinical_notes}\n\n`;
    });
    content += `Generated on: ${formatDate(
      new Date().toISOString().split('T')[0]
    )}`;
    return content;
  };

  const generateSinglePDFContent = (visit) => {
    let content = 'CLINICAL VISIT REPORT\n\n';
    content += `Patient: ${getPatientName(visit.patient_id)}\n`;
    content += `Facility: ${getFacilityName(visit.facility_id)}\n`;
    content += `Date: ${formatDate(visit.visit_date)}\n`;
    content += `Visit Type: ${visit.visit_type}\n`;
    content += `WHO Stage: ${visit.who_stage}\n`;
    content += `Chief Complaint: ${visit.chief_complaint}\n`;
    content += `Assessment: ${visit.assessment}\n`;
    content += `Plan: ${visit.plan}\n`;
    content += `Notes: ${visit.clinical_notes}\n\n`;

    if (visit.vital_signs && visit.vital_signs.length > 0) {
      content += `Vital Signs:\n`;
      const vital = visit.vital_signs[0];
      content += `  Blood Pressure: ${vital.systolic_bp}/${vital.diastolic_bp}\n`;
      content += `  Heart Rate: ${vital.pulse_rate}\n`;
      content += `  Respiratory Rate: ${vital.respiratory_rate}\n`;
      content += `  Temperature: ${vital.temperature_c}\n`;
      content += `  Weight: ${vital.weight_kg}\n`;
      content += `  Height: ${vital.height_cm}\n`;
    }

    if (visit.diagnoses && visit.diagnoses.length > 0) {
      content += `Diagnoses:\n`;
      visit.diagnoses.forEach((d, i) => {
        content += `  ${i + 1}. ${d.diagnosis_description}\n`;
      });
    }

    if (visit.procedures && visit.procedures.length > 0) {
      content += `Procedures:\n`;
      visit.procedures.forEach((p, i) => {
        content += `  ${i + 1}. ${p.procedure_name}\n`;
      });
    }

    content += `\nGenerated on: ${formatDate(
      new Date().toISOString().split('T')[0]
    )}`;
    return content;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const getFilteredVisits = () => {
    let filtered = clinicalVisits;

    if (searchTerm) {
      filtered = filtered.filter(
        (visit) =>
          getPatientName(visit.patient_id)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          getFacilityName(visit.facility_id)
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          visit.chief_complaint
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(
        (visit) => visit.visit_type === typeFilter.toLowerCase()
      );
    }

    return filtered;
  };

  const renderRecentActivity = () => {
    const filteredVisits = getFilteredVisits();

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          Loading clinical visits...
        </p>
      );
    }

    if (filteredVisits.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No clinical visits found
        </p>
      );
    }

    return filteredVisits.map((visit) => (
      <div
        key={visit.visit_id}
        style={{
          background: 'white',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '18px' }}>
            {getPatientName(visit.patient_id)}
          </h3>
          <div
            style={{ marginBottom: '5px', color: '#007bff', fontSize: '14px' }}
          >
            📅 {formatDate(visit.visit_date)} • {visit.visit_type} •{' '}
            {getFacilityName(visit.facility_id)}
          </div>
          <div
            style={{ marginBottom: '5px', color: '#6c757d', fontSize: '14px' }}
          >
            WHO Stage: {visit.who_stage}
          </div>
          <div style={{ color: '#333', fontStyle: 'italic', fontSize: '14px' }}>
            "
            {visit.clinical_notes && visit.clinical_notes.length > 50
              ? visit.clinical_notes.substring(0, 50) + '...'
              : visit.clinical_notes || 'No notes'}
            "
          </div>
          {visit.diagnoses && visit.diagnoses.length > 0 && (
            <div
              style={{ marginTop: '5px', fontSize: '13px', color: '#6c757d' }}
            >
              🏥 Diagnoses:{' '}
              {visit.diagnoses.map((d) => d.diagnosis_description).join(', ')}
            </div>
          )}
          {visit.procedures && visit.procedures.length > 0 && (
            <div
              style={{ marginTop: '5px', fontSize: '13px', color: '#6c757d' }}
            >
              🔧 Procedures:{' '}
              {visit.procedures.map((p) => p.procedure_name).join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => handleViewDetails(visit)}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            View Details
          </button>
          <button
            onClick={() => handleEditVisit(visit)}
            style={{
              padding: '8px 16px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteVisit(visit.visit_id)}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Delete
          </button>
          <button
            onClick={() => handleExportSinglePDF(visit)}
            style={{
              padding: '8px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Export PDF
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div style={{ padding: '20px', paddingTop: '80px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: '#333', fontSize: '24px' }}>
            Clinical Visits
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}
          >
            Record and manage patient consultations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleExportPDF}
            style={{
              padding: '10px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Export All
          </button>
          <button
            onClick={handleRecordNewVisit}
            style={{
              padding: '10px 16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={16} />
            Record New Visit
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <input
            type="text"
            placeholder="Search clinical visits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              width: '100%',
            }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <Filter
            size={18}
            color="#6c757d"
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
            }}
          >
            <option value="all">All Types</option>
            {validVisitTypes.map((type) => (
              <option key={type} value={type}>
                {type.replace('_', ' ').charAt(0).toUpperCase() +
                  type.replace('_', ' ').slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <div>{renderRecentActivity()}</div>

      {/* Clinical Visit Modal */}
      {showModal && (
        <ClinicalVisitModal
          mode={modalMode}
          visit={selectedVisit}
          onClose={() => {
            setShowModal(false);
            setSelectedVisit(null);
          }}
          onSave={modalMode === 'add' ? handleSaveVisit : handleUpdateVisit}
          patients={patients}
          facilities={facilities}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#dc3545'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minWidth: '300px',
            animation: 'slideIn 0.3s ease',
            zIndex: 9999,
          }}
        >
          {toast.type === 'success' ? (
            <Check size={20} />
          ) : (
            <Download size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Clinical Visit Modal Component
const ClinicalVisitModal = ({
  mode,
  visit,
  onClose,
  onSave,
  patients,
  facilities,
}) => {
  const [formData, setFormData] = useState(
    visit || {
      patient_id: '',
      provider_id: 'default-provider',
      facility_id: '',
      visitDate: new Date().toISOString().split('T')[0],
      visitType: 'initial',
      whoStage: 'Stage 1',
      chiefComplaint: '',
      assessment: '',
      plan: '',
      followUpDate: '',
      followUpReason: '',
      vitalSigns: {
        bloodPressure: '120/80',
        heartRate: '72',
        respiratoryRate: '16',
        temperature: '36.5',
        weight: '65',
        height: '165',
      },
      diagnoses: [],
      procedures: [],
      notes: '',
    }
  );

  useEffect(() => {
    if (visit) {
      setFormData({
        ...visit,
        patient_id: visit.patient_id || '',
        provider_id: visit.provider_id || 'default-provider',
        facility_id: visit.facility_id || '',
        visitDate: visit.visit_date
          ? new Date(visit.visit_date).toISOString().split('T')[0]
          : '',
        visitType: visit.visit_type || 'initial',
        whoStage: visit.who_stage || 'Stage 1',
        chiefComplaint: visit.chief_complaint || '',
        assessment: visit.assessment || '',
        plan: visit.plan || '',
        followUpDate: visit.follow_up_date || '',
        followUpReason: visit.follow_up_reason || '',
        notes: visit.clinical_notes || '',
        vitalSigns:
          visit.vital_signs && visit.vital_signs.length > 0
            ? {
                bloodPressure: `${visit.vital_signs[0].systolic_bp}/${visit.vital_signs[0].diastolic_bp}`,
                heartRate: visit.vital_signs[0].pulse_rate?.toString() || '72',
                respiratoryRate:
                  visit.vital_signs[0].respiratory_rate?.toString() || '16',
                temperature:
                  visit.vital_signs[0].temperature_c?.toString() || '36.5',
                weight: visit.vital_signs[0].weight_kg?.toString() || '65',
                height: visit.vital_signs[0].height_cm?.toString() || '165',
              }
            : {
                bloodPressure: '120/80',
                heartRate: '72',
                respiratoryRate: '16',
                temperature: '36.5',
                weight: '65',
                height: '165',
              },
        diagnoses: visit.diagnoses || [],
        procedures: visit.procedures || [],
      });
    }
  }, [visit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('vitalSigns.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        vitalSigns: {
          ...formData.vitalSigns,
          [field]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddDiagnosis = () => {
    setFormData({
      ...formData,
      diagnoses: [
        ...formData.diagnoses,
        {
          diagnosis_id: '',
          icd10_code: '',
          diagnosis_description: '',
          diagnosis_type: 'primary',
          is_chronic: false,
          onset_date: '',
          resolved_date: '',
        },
      ],
    });
  };

  const handleDiagnosisChange = (index, field, value) => {
    const updatedDiagnoses = [...formData.diagnoses];
    updatedDiagnoses[index][field] = value;
    setFormData({ ...formData, diagnoses: updatedDiagnoses });
  };

  const handleRemoveDiagnosis = (index) => {
    const updatedDiagnoses = [...formData.diagnoses];
    updatedDiagnoses.splice(index, 1);
    setFormData({ ...formData, diagnoses: updatedDiagnoses });
  };

  const handleAddProcedure = () => {
    setFormData({
      ...formData,
      procedures: [
        ...formData.procedures,
        {
          procedure_id: '',
          cpt_code: '',
          procedure_name: '',
          procedure_description: '',
          outcome: '',
          performed_at: new Date().toISOString().slice(0, 16),
        },
      ],
    });
  };

  const handleProcedureChange = (index, field, value) => {
    const updatedProcedures = [...formData.procedures];
    updatedProcedures[index][field] = value;
    setFormData({ ...formData, procedures: updatedProcedures });
  };

  const handleRemoveProcedure = (index) => {
    const updatedProcedures = [...formData.procedures];
    updatedProcedures.splice(index, 1);
    setFormData({ ...formData, procedures: updatedProcedures });
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        paddingTop: '64px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: 'calc(100vh - 104px)',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0 }}>
            {mode === 'add'
              ? 'Record Clinical Visit'
              : mode === 'edit'
              ? 'Edit Clinical Visit'
              : 'Visit Details'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              borderRadius: '4px',
            }}
          >
            <X size={24} color="#6c757d" />
          </button>
        </div>

        {mode === 'view' ? (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Patient Name
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.patientName}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Facility
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.facilityName}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Provider
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.providerName}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Visit Date
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {formatDate(visit.visit_date)}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Visit Type
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.visit_type}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                WHO Stage
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.who_stage}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Chief Complaint
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.chief_complaint}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Assessment
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.assessment || 'None recorded'}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Plan
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.plan || 'None recorded'}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Follow-up
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.follow_up_date
                  ? `Date: ${formatDate(visit.follow_up_date)}${
                      visit.follow_up_reason
                        ? `, Reason: ${visit.follow_up_reason}`
                        : ''
                    }`
                  : 'No follow-up scheduled'}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Vital Signs
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.vital_signs && visit.vital_signs.length > 0 ? (
                  <>
                    <div>
                      BP: {visit.vital_signs[0].systolic_bp}/
                      {visit.vital_signs[0].diastolic_bp}
                    </div>
                    <div>HR: {visit.vital_signs[0].pulse_rate}</div>
                    <div>RR: {visit.vital_signs[0].respiratory_rate}</div>
                    <div>Temp: {visit.vital_signs[0].temperature_c}°C</div>
                    <div>Weight: {visit.vital_signs[0].weight_kg} kg</div>
                    <div>Height: {visit.vital_signs[0].height_cm} cm</div>
                  </>
                ) : (
                  <div>No vital signs recorded</div>
                )}
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Clinical Notes
              </label>
              <div
                style={{
                  padding: '8px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              >
                {visit.clinical_notes || 'No notes'}
              </div>
            </div>
            {visit.diagnoses && visit.diagnoses.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Diagnoses
                </label>
                <div
                  style={{
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {visit.diagnoses.map((d, i) => (
                    <div key={i} style={{ marginBottom: '5px' }}>
                      {d.diagnosis_description}
                      {d.icd10_code && <span> (ICD-10: {d.icd10_code})</span>}
                      {d.diagnosis_type && (
                        <span> - Type: {d.diagnosis_type}</span>
                      )}
                      {d.is_chronic && <span> - Chronic</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {visit.procedures && visit.procedures.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Procedures
                </label>
                <div
                  style={{
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {visit.procedures.map((p, i) => (
                    <div key={i} style={{ marginBottom: '5px' }}>
                      {p.procedure_name}
                      {p.cpt_code && <span> (CPT: {p.cpt_code})</span>}
                      {p.performed_at && (
                        <span> - Performed: {formatDate(p.performed_at)}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Patient <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="patient_id"
                value={formData.patient_id}
                onChange={handleChange}
                required
                disabled={mode === 'edit'}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.first_name}{' '}
                    {patient.middle_name ? patient.middle_name + ' ' : ''}
                    {patient.last_name}
                    {patient.suffix ? ' ' + patient.suffix : ''} ({patient.uic})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Facility <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="facility_id"
                value={formData.facility_id}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="">Select a facility</option>
                {facilities.map((facility) => (
                  <option
                    key={facility.facility_id}
                    value={facility.facility_id}
                  >
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Visit Date <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Visit Type <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  name="visitType"
                  value={formData.visitType}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                >
                  {validVisitTypes.map((type) => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').charAt(0).toUpperCase() +
                        type.replace('_', ' ').slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                WHO Stage <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="whoStage"
                value={formData.whoStage}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                {validWhoStages.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Chief Complaint <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleChange}
                rows="3"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Assessment
              </label>
              <textarea
                name="assessment"
                value={formData.assessment}
                onChange={handleChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Plan
              </label>
              <textarea
                name="plan"
                value={formData.plan}
                onChange={handleChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Follow-up Date
                </label>
                <input
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                  }}
                >
                  Follow-up Reason
                </label>
                <input
                  type="text"
                  name="followUpReason"
                  value={formData.followUpReason}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Vital Signs
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '10px',
                }}
              >
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Blood Pressure
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.bloodPressure"
                    value={formData.vitalSigns.bloodPressure}
                    onChange={handleChange}
                    placeholder="120/80"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Heart Rate
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.heartRate"
                    value={formData.vitalSigns.heartRate}
                    onChange={handleChange}
                    placeholder="72"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Respiratory Rate
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.respiratoryRate"
                    value={formData.vitalSigns.respiratoryRate}
                    onChange={handleChange}
                    placeholder="16"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Temperature (°C)
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.temperature"
                    value={formData.vitalSigns.temperature}
                    onChange={handleChange}
                    placeholder="36.5"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Weight (kg)
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.weight"
                    value={formData.vitalSigns.weight}
                    onChange={handleChange}
                    placeholder="65"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#6c757d' }}>
                    Height (cm)
                  </label>
                  <input
                    type="text"
                    name="vitalSigns.height"
                    value={formData.vitalSigns.height}
                    onChange={handleChange}
                    placeholder="165"
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Clinical Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                  }}
                >
                  Diagnoses
                </label>
                <button
                  type="button"
                  onClick={handleAddDiagnosis}
                  style={{
                    padding: '5px 10px',
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Add Diagnosis
                </button>
              </div>
              {formData.diagnoses.map((diagnosis, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <h4 style={{ margin: 0 }}>Diagnosis {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiagnosis(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        ICD-10 Code
                      </label>
                      <input
                        type="text"
                        value={diagnosis.icd10_code}
                        onChange={(e) =>
                          handleDiagnosisChange(
                            index,
                            'icd10_code',
                            e.target.value
                          )
                        }
                        placeholder="e.g., B20"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Type
                      </label>
                      <select
                        value={diagnosis.diagnosis_type}
                        onChange={(e) =>
                          handleDiagnosisChange(
                            index,
                            'diagnosis_type',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      >
                        {validDiagnosisTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() +
                              type.slice(1).replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Description
                      </label>
                      <textarea
                        value={diagnosis.diagnosis_description}
                        onChange={(e) =>
                          handleDiagnosisChange(
                            index,
                            'diagnosis_description',
                            e.target.value
                          )
                        }
                        rows="2"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Onset Date
                      </label>
                      <input
                        type="date"
                        value={diagnosis.onset_date}
                        onChange={(e) =>
                          handleDiagnosisChange(
                            index,
                            'onset_date',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Resolved Date
                      </label>
                      <input
                        type="date"
                        value={diagnosis.resolved_date}
                        onChange={(e) =>
                          handleDiagnosisChange(
                            index,
                            'resolved_date',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={diagnosis.is_chronic}
                          onChange={(e) =>
                            handleDiagnosisChange(
                              index,
                              'is_chronic',
                              e.target.checked
                            )
                          }
                          style={{ width: '16px', height: '16px' }}
                        />
                        Chronic Condition
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 'bold',
                  }}
                >
                  Procedures
                </label>
                <button
                  type="button"
                  onClick={handleAddProcedure}
                  style={{
                    padding: '5px 10px',
                    background: '#6f42c1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Add Procedure
                </button>
              </div>
              {formData.procedures.map((procedure, index) => (
                <div
                  key={index}
                  style={{
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    padding: '10px',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '10px',
                    }}
                  >
                    <h4 style={{ margin: 0 }}>Procedure {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveProcedure(index)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        padding: '2px 8px',
                        fontSize: '12px',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        CPT Code
                      </label>
                      <input
                        type="text"
                        value={procedure.cpt_code}
                        onChange={(e) =>
                          handleProcedureChange(
                            index,
                            'cpt_code',
                            e.target.value
                          )
                        }
                        placeholder="e.g., 99213"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Performed At
                      </label>
                      <input
                        type="datetime-local"
                        value={procedure.performed_at}
                        onChange={(e) =>
                          handleProcedureChange(
                            index,
                            'performed_at',
                            e.target.value
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Procedure Name
                      </label>
                      <input
                        type="text"
                        value={procedure.procedure_name}
                        onChange={(e) =>
                          handleProcedureChange(
                            index,
                            'procedure_name',
                            e.target.value
                          )
                        }
                        placeholder="e.g., Physical Examination"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Description
                      </label>
                      <textarea
                        value={procedure.procedure_description}
                        onChange={(e) =>
                          handleProcedureChange(
                            index,
                            'procedure_description',
                            e.target.value
                          )
                        }
                        rows="2"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={{ fontSize: '12px', color: '#6c757d' }}>
                        Outcome
                      </label>
                      <textarea
                        value={procedure.outcome}
                        onChange={(e) =>
                          handleProcedureChange(
                            index,
                            'outcome',
                            e.target.value
                          )
                        }
                        rows="2"
                        style={{
                          width: '100%',
                          padding: '6px',
                          border: '1px solid #ced4da',
                          borderRadius: '4px',
                          fontSize: '14px',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {mode === 'add' ? 'Save Visit' : 'Update Visit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Helper function for date formatting
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

export default ClinicalVisits;
