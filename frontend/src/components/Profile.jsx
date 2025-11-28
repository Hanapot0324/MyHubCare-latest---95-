import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  Edit,
  X,
  Plus,
  Trash2,
  FileText,
  CreditCard,
  Activity,
  AlertCircle,
  Upload,
  Calendar,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [patient, setPatient] = useState(null);
  const [identifiers, setIdentifiers] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [medications, setMedications] = useState([]);
  const [medicationAdherence, setMedicationAdherence] = useState(null);
  const [clinicalVisits, setClinicalVisits] = useState([]);
  const [showIdentifierModal, setShowIdentifierModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingIdentifier, setEditingIdentifier] = useState(null);
  const [newIdentifier, setNewIdentifier] = useState({
    id_type: '',
    id_value: '',
    issued_at: '',
    expires_at: '',
    verified: false,
  });

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch current user's patient profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        setToast({
          message: 'Please login to view your profile',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      // Try to get current user info
      let userData = null;
      let patientData = null;

      try {
        const userResponse = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        userData = await userResponse.json();
        console.log('User data response:', userData);

        if (userData.success && userData.user && userData.user.patient) {
          patientData = userData.user.patient;
        }
      } catch (err) {
        console.error('Error fetching from /auth/me:', err);
      }

      // If patient data not found via /auth/me, try /profile/me endpoint
      if (!patientData) {
        try {
          const profileResponse = await fetch(`${API_URL}/profile/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('Profile data response:', profileData);
            if (profileData.success && profileData.patient) {
              patientData = profileData.patient;
            }
          }
        } catch (err) {
          console.error('Error fetching from /profile/me:', err);
        }
      }

      // Check if we have patient data
      if (!patientData) {
        setToast({
          message: 'Patient profile not found. Please ensure your user account is linked to a patient record (matching email or created_by field).',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      const patientId = patientData.patient_id;
      console.log('Setting patient data:', patientData);
      setPatient(patientData);

      // Fetch identifiers
      try {
        const identifiersResponse = await fetch(
          `${API_URL}/profile/${patientId}/identifiers`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const identifiersData = await identifiersResponse.json();
        if (identifiersData.success) {
          setIdentifiers(identifiersData.data || []);
        }
      } catch (err) {
        console.error('Error fetching identifiers:', err);
        setIdentifiers([]);
      }

      // Fetch ARPA risk scores
      try {
        // Fetch current ARPA score
        const currentARPAResponse = await fetch(
          `${API_URL}/arpa/patient/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const currentARPAData = await currentARPAResponse.json();
        
        // Fetch ARPA history
        const historyResponse = await fetch(
          `${API_URL}/arpa/patient/${patientId}/history?limit=10`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const historyData = await historyResponse.json();
        
        // Combine current score with history
        const allScores = [];
        if (currentARPAData.success && currentARPAData.data) {
          allScores.push(currentARPAData.data);
        }
        if (historyData.success && historyData.data) {
          // Add history scores that aren't already included
          historyData.data.forEach(score => {
            if (!allScores.find(s => s.risk_score_id === score.risk_score_id)) {
              allScores.push(score);
            }
          });
        }
        
        // Sort by calculated_on date (most recent first)
        allScores.sort((a, b) => {
          const dateA = new Date(a.calculated_on || a.arpa_last_calculated || 0);
          const dateB = new Date(b.calculated_on || b.arpa_last_calculated || 0);
          return dateB - dateA;
        });
        
        setRiskScores(allScores);
      } catch (err) {
        console.error('Error fetching ARPA risk scores:', err);
        setRiskScores([]);
      }

      // Fetch lab results
      try {
        const labResultsResponse = await fetch(
          `${API_URL}/lab-results/patient/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const labResultsData = await labResultsResponse.json();
        if (labResultsData.success) {
          setLabResults(labResultsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching lab results:', err);
        setLabResults([]);
      }

      // Fetch medications/prescriptions
      try {
        const prescriptionsResponse = await fetch(
          `${API_URL}/prescriptions?patient_id=${patientId}&status=active`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const prescriptionsData = await prescriptionsResponse.json();
        if (prescriptionsData.success) {
          // Extract medications from prescriptions
          const meds = [];
          (prescriptionsData.data || prescriptionsData.prescriptions || []).forEach(prescription => {
            if (prescription.items && prescription.items.length > 0) {
              prescription.items.forEach(item => {
                meds.push({
                  medication_name: item.medication_name,
                  dosage: item.dosage,
                  frequency: item.frequency,
                  prescription_id: prescription.prescription_id,
                  prescription_item_id: item.prescription_item_id,
                  start_date: prescription.start_date,
                  end_date: prescription.end_date,
                  status: prescription.status,
                });
              });
            }
          });
          setMedications(meds);
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        setMedications([]);
      }

      // Fetch medication adherence summary
      try {
        const adherenceResponse = await fetch(
          `${API_URL}/medication-adherence?patient_id=${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (adherenceResponse.ok) {
          const adherenceData = await adherenceResponse.json();
          if (adherenceData.success) {
            // Use summary if available, otherwise calculate from data
            if (adherenceData.summary) {
              setMedicationAdherence({
                avg_adherence: adherenceData.summary.overall_adherence_percentage || adherenceData.summary.average_adherence,
                total_records: adherenceData.summary.total_records,
                missed_doses: adherenceData.summary.missed_records || adherenceData.summary.missed_doses || 0,
                last_record_date: adherenceData.data && adherenceData.data.length > 0 ? adherenceData.data[0].adherence_date : null,
              });
            } else if (adherenceData.data && adherenceData.data.length > 0) {
              // Calculate from data
              const records = adherenceData.data || [];
              const totalAdherence = records.reduce((sum, r) => sum + (r.adherence_percentage || 0), 0);
              const avgAdherence = records.length > 0 ? totalAdherence / records.length : 0;
              const missedDoses = records.filter(r => r.taken === 0 || r.taken === false || !r.taken).length;
              
              setMedicationAdherence({
                avg_adherence: avgAdherence,
                total_records: records.length,
                missed_doses: missedDoses,
                last_record_date: records[0]?.adherence_date || null,
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching medication adherence:', err);
      }

      // Fetch documents
      try {
        const documentsResponse = await fetch(
          `${API_URL}/profile/${patientId}/documents`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const documentsData = await documentsResponse.json();
        if (documentsData.success) {
          setDocuments(documentsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
        setDocuments([]);
      }

      // Fetch clinical visits history
      try {
        const visitsResponse = await fetch(
          `${API_URL}/clinical-visits/patient/${patientId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const visitsData = await visitsResponse.json();
        if (visitsData.success) {
          setClinicalVisits(visitsData.data || []);
        }
      } catch (err) {
        console.error('Error fetching clinical visits:', err);
        setClinicalVisits([]);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setToast({
        message: `Failed to load profile: ${error.message}`,
        type: 'error',
      });
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatient({
      ...patient,
      [name]: value,
    });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    const currentAddress = patient.current_address
      ? typeof patient.current_address === 'string'
        ? JSON.parse(patient.current_address)
        : patient.current_address
      : {};
    setPatient({
      ...patient,
      current_address: JSON.stringify({
        ...currentAddress,
        [name]: value,
      }),
    });
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const token = getAuthToken();

      const payload = {
        first_name: patient.first_name,
        middle_name: patient.middle_name || null,
        last_name: patient.last_name,
        suffix: patient.suffix || null,
        birth_date: patient.birth_date,
        sex: patient.sex,
        civil_status: patient.civil_status || null,
        nationality: patient.nationality || null,
        contact_phone: patient.contact_phone,
        email: patient.email,
        current_city: patient.current_city || null,
        current_province: patient.current_province || null,
        philhealth_no: patient.philhealth_no || null,
        mother_name: patient.mother_name || null,
        father_name: patient.father_name || null,
        birth_order: patient.birth_order || null,
        guardian_name: patient.guardian_name || null,
        guardian_relationship: patient.guardian_relationship || null,
      };

      const response = await fetch(`${API_URL}/patients/${patient.patient_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Profile updated successfully',
          type: 'success',
        });
        setIsEditing(false);
        fetchProfile();
      } else {
        setToast({
          message: data.message || 'Failed to update profile',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setToast({
        message: 'Failed to save profile',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddIdentifier = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/profile/${patient.patient_id}/identifiers`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newIdentifier),
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Identifier added successfully',
          type: 'success',
        });
        setShowIdentifierModal(false);
        setNewIdentifier({
          id_type: '',
          id_value: '',
          issued_at: '',
          expires_at: '',
          verified: false,
        });
        fetchProfile();
      } else {
        setToast({
          message: data.message || 'Failed to add identifier',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error adding identifier:', error);
      setToast({
        message: 'Failed to add identifier',
        type: 'error',
      });
    }
  };

  const handleDeleteIdentifier = async (identifierId) => {
    if (!window.confirm('Are you sure you want to delete this identifier?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/profile/identifiers/${identifierId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Identifier deleted successfully',
          type: 'success',
        });
        fetchProfile();
      } else {
        setToast({
          message: data.message || 'Failed to delete identifier',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting identifier:', error);
      setToast({
        message: 'Failed to delete identifier',
        type: 'error',
      });
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_URL}/profile/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Document deleted successfully',
          type: 'success',
        });
        fetchProfile();
      } else {
        setToast({
          message: data.message || 'Failed to delete document',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      setToast({
        message: 'Failed to delete document',
        type: 'error',
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div style={{ padding: '20px', paddingTop: '80px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '24px' }}>My Profile</h2>
        <p style={{ color: '#6c757d', fontSize: '16px', marginBottom: '20px' }}>
          Profile not found
        </p>
        <p style={{ color: '#6c757d', fontSize: '14px' }}>
          If you are a patient, please contact support to set up your profile.
        </p>
        <button
          onClick={fetchProfile}
          style={{
            marginTop: '20px',
            padding: '10px 16px',
            background: '#D84040',
            color: '#F8F2DE',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const currentAddress = patient.current_address
    ? typeof patient.current_address === 'string'
      ? JSON.parse(patient.current_address)
      : patient.current_address
    : {};

  return (
    <div style={{ padding: '20px', paddingTop: '80px', maxWidth: '1200px', margin: '0 auto' }}>
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
            My Profile
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
            View and manage your personal information
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              padding: '10px 16px',
              background: '#D84040',
              color: '#F8F2DE',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
            }}
          >
            <Edit size={16} />
            Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => {
                setIsEditing(false);
                fetchProfile();
              }}
              style={{
                padding: '10px 16px',
                background: '#6c757d',
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
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: '10px 16px',
                background: '#D84040',
                color: '#F8F2DE',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Personal Information Section */}
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            color: '#A31D1D',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <User size={20} />
          Personal Information
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Patient ID
            </label>
            <input
              type="text"
              value={patient.patient_id}
              disabled
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: '#f8f9fa',
                color: '#6c757d',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              UIC
            </label>
            <input
              type="text"
              value={patient.uic || ''}
              disabled
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: '#f8f9fa',
                color: '#6c757d',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              First Name *
            </label>
            <input
              type="text"
              name="first_name"
              value={patient.first_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Middle Name
            </label>
            <input
              type="text"
              name="middle_name"
              value={patient.middle_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Last Name *
            </label>
            <input
              type="text"
              name="last_name"
              value={patient.last_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Suffix
            </label>
            <input
              type="text"
              name="suffix"
              value={patient.suffix || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Date of Birth *
            </label>
            <input
              type="date"
              name="birth_date"
              value={formatDate(patient.birth_date)}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Sex *
            </label>
            <select
              name="sex"
              value={patient.sex || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Civil Status
            </label>
            <select
              name="civil_status"
              value={patient.civil_status || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            >
              <option value="">Select...</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
              <option value="Separated">Separated</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Nationality
            </label>
            <input
              type="text"
              name="nationality"
              value={patient.nationality || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Phone Number *
            </label>
            <input
              type="tel"
              name="contact_phone"
              value={patient.contact_phone || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={patient.email || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Current City
            </label>
            <input
              type="text"
              name="current_city"
              value={patient.current_city || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Current Province
            </label>
            <input
              type="text"
              name="current_province"
              value={patient.current_province || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              PhilHealth Number
            </label>
            <input
              type="text"
              name="philhealth_no"
              value={patient.philhealth_no || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Mother's Name
            </label>
            <input
              type="text"
              name="mother_name"
              value={patient.mother_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Father's Name
            </label>
            <input
              type="text"
              name="father_name"
              value={patient.father_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Birth Order
            </label>
            <input
              type="number"
              name="birth_order"
              value={patient.birth_order || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Guardian Name
            </label>
            <input
              type="text"
              name="guardian_name"
              value={patient.guardian_name || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
              Guardian Relationship
            </label>
            <input
              type="text"
              name="guardian_relationship"
              value={patient.guardian_relationship || ''}
              onChange={handleInputChange}
              disabled={!isEditing}
              style={{
                padding: '8px 12px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                width: '100%',
                fontSize: '14px',
                background: isEditing ? 'white' : '#f8f9fa',
              }}
            />
          </div>
        </div>
      </div>

      {/* Identifiers Section */}
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
          <h3
            style={{
              margin: 0,
              color: '#A31D1D',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CreditCard size={20} />
            Identifiers
          </h3>
          <button
            onClick={() => setShowIdentifierModal(true)}
            style={{
              padding: '8px 12px',
              background: '#D84040',
              color: '#F8F2DE',
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
            Add Identifier
          </button>
        </div>

        {identifiers.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
            No identifiers added yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {identifiers.map((identifier) => (
              <div
                key={identifier.identifier_id}
                style={{
                  padding: '15px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                    {identifier.id_type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>
                    {identifier.id_value}
                  </div>
                  {identifier.issued_at && (
                    <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                      Issued: {formatDate(identifier.issued_at)}
                    </div>
                  )}
                  {identifier.expires_at && (
                    <div style={{ color: '#6c757d', fontSize: '12px' }}>
                      Expires: {formatDate(identifier.expires_at)}
                    </div>
                  )}
                  {identifier.verified && (
                    <span
                      style={{
                        display: 'inline-block',
                        marginTop: '5px',
                        padding: '2px 8px',
                        background: '#28a745',
                        color: 'white',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      Verified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteIdentifier(identifier.identifier_id)}
                  style={{
                    padding: '6px 10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ARPA Risk Scores Section */}
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
          <h3
            style={{
              margin: 0,
              color: '#A31D1D',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={20} />
            ARPA Risk Assessment
          </h3>
          {patient?.arpa_risk_score !== null && patient?.arpa_risk_score !== undefined && (
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                backgroundColor:
                  patient.arpa_risk_score >= 75
                    ? '#dc3545' // Critical (🔴 Red)
                    : patient.arpa_risk_score >= 50
                    ? '#fd7e14' // High (🟠 Orange)
                    : patient.arpa_risk_score >= 25
                    ? '#ffc107' // Medium (🟡 Yellow)
                    : '#28a745', // Low (🟢 Green)
                color: 'white',
              }}
            >
              Current Score: {patient.arpa_risk_score}
            </div>
          )}
        </div>

        {riskScores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: '#6c757d', marginBottom: '15px' }}>
              No ARPA risk scores calculated yet
            </p>
            <p style={{ color: '#6c757d', fontSize: '14px' }}>
              Risk scores are automatically calculated when clinical data is updated.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {riskScores.map((score, index) => {
              // Align with ARPA_DOCUMENTATION.md risk levels: 0-24 Low, 25-49 Medium, 50-74 High, 75-100 Critical
              const scoreValue = score.score || score.arpa_risk_score || 0;
              const riskLevel = score.risk_level || 
                (scoreValue >= 75 ? 'CRITICAL' :
                 scoreValue >= 50 ? 'HIGH' :
                 scoreValue >= 25 ? 'MEDIUM' :
                 'LOW');
              
              const riskColor =
                riskLevel === 'CRITICAL'
                  ? '#dc3545' // Red
                  : riskLevel === 'HIGH'
                  ? '#fd7e14' // Orange (🟠)
                  : riskLevel === 'MEDIUM'
                  ? '#ffc107' // Yellow (🟡)
                  : '#28a745'; // Green (🟢)

              const isCurrent = index === 0 && score.score === patient?.arpa_risk_score;

              return (
                <div
                  key={score.risk_score_id || `score-${index}`}
                  style={{
                    padding: '20px',
                    border: isCurrent ? '2px solid #D84040' : '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: isCurrent ? '#fff5f5' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 700, fontSize: '24px', color: riskColor }}>
                          {score.score || score.arpa_risk_score || 'N/A'}
                        </div>
                        <div
                          style={{
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            backgroundColor: riskColor,
                            color: 'white',
                            textTransform: 'uppercase',
                          }}
                        >
                          {riskLevel}
                        </div>
                        {isCurrent && (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              backgroundColor: '#D84040',
                              color: 'white',
                            }}
                          >
                            CURRENT
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#6c757d', fontSize: '13px' }}>
                        Calculated: {formatDate(score.calculated_on || score.arpa_last_calculated)}
                      </div>
                    </div>
                  </div>
                  
                  {score.recommendations && (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        marginTop: '12px',
                        fontSize: '14px',
                        color: '#495057',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong style={{ color: '#A31D1D' }}>Recommendations:</strong>
                      <div style={{ marginTop: '6px' }}>{score.recommendations}</div>
                    </div>
                  )}
                  
                  {/* Component Breakdown with Progress Bars - as per ARPA_DOCUMENTATION.md */}
                  {score.risk_factors && typeof score.risk_factors === 'object' && (
                    <div style={{ marginTop: '15px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#495057', marginBottom: '12px' }}>
                        Component Breakdown
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Medication Adherence Component (35% weight) */}
                        {score.risk_factors.medicationAdherence !== undefined && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#6c757d' }}>Medication Adherence (35%)</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>
                                {score.risk_factors.medicationAdherence?.toFixed(1) || 0}%
                              </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, (score.risk_factors.medicationAdherence || 0))}%`,
                                  height: '100%',
                                  backgroundColor: 
                                    (score.risk_factors.medicationAdherence || 0) >= 95 ? '#28a745' :
                                    (score.risk_factors.medicationAdherence || 0) >= 80 ? '#ffc107' :
                                    (score.risk_factors.medicationAdherence || 0) >= 70 ? '#fd7e14' : '#dc3545',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Appointment Attendance Component (25% weight) */}
                        {score.risk_factors.appointmentMissedRate !== undefined && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#6c757d' }}>Appointment Attendance (25%)</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>
                                {score.risk_factors.appointmentAttendanceRate?.toFixed(1) || 0}% attendance
                              </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, (score.risk_factors.appointmentAttendanceRate || 0))}%`,
                                  height: '100%',
                                  backgroundColor: 
                                    (score.risk_factors.appointmentAttendanceRate || 0) >= 80 ? '#28a745' :
                                    (score.risk_factors.appointmentAttendanceRate || 0) >= 60 ? '#ffc107' :
                                    (score.risk_factors.appointmentAttendanceRate || 0) >= 40 ? '#fd7e14' : '#dc3545',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Lab Compliance Component (20% weight) */}
                        {score.risk_factors.daysSinceLastLab !== undefined && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#6c757d' }}>Lab Compliance (20%)</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>
                                {score.risk_factors.daysSinceLastLab || 0} days since last lab
                              </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, 100 - ((score.risk_factors.daysSinceLastLab || 0) / 180) * 100))}%`,
                                  height: '100%',
                                  backgroundColor: 
                                    (score.risk_factors.daysSinceLastLab || 0) <= 90 ? '#28a745' :
                                    (score.risk_factors.daysSinceLastLab || 0) <= 180 ? '#ffc107' : '#dc3545',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        {/* Visit Frequency Component (20% weight) */}
                        {score.risk_factors.daysSinceLastVisit !== undefined && (
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '12px', color: '#6c757d' }}>Visit Frequency (20%)</span>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#495057' }}>
                                {score.risk_factors.daysSinceLastVisit || 0} days since last visit
                              </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(0, 100 - ((score.risk_factors.daysSinceLastVisit || 0) / 180) * 100))}%`,
                                  height: '100%',
                                  backgroundColor: 
                                    (score.risk_factors.daysSinceLastVisit || 0) <= 30 ? '#28a745' :
                                    (score.risk_factors.daysSinceLastVisit || 0) <= 90 ? '#ffc107' :
                                    (score.risk_factors.daysSinceLastVisit || 0) <= 180 ? '#fd7e14' : '#dc3545',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Detailed Risk Factors (collapsible) */}
                      <details style={{ marginTop: '15px' }}>
                        <summary
                          style={{
                            cursor: 'pointer',
                            color: '#6c757d',
                            fontSize: '13px',
                            fontWeight: 500,
                            userSelect: 'none',
                          }}
                        >
                          View Detailed Risk Factors
                        </summary>
                        <div
                          style={{
                            marginTop: '10px',
                            padding: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '13px',
                          }}
                        >
                          {Object.entries(score.risk_factors).map(([key, value]) => {
                            // Skip already displayed components
                            if (['medicationAdherence', 'appointmentMissedRate', 'appointmentAttendanceRate', 
                                 'daysSinceLastLab', 'daysSinceLastVisit'].includes(key)) {
                              return null;
                            }
                            
                            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            let displayValue = value;
                            if (typeof value === 'object' && value !== null) {
                              if (Array.isArray(value)) {
                                displayValue = value.join(', ');
                              } else {
                                displayValue = JSON.stringify(value);
                              }
                            } else if (typeof value === 'number') {
                              displayValue = value.toFixed(2);
                            }
                            
                            return (
                              <div key={key} style={{ marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6c757d' }}>
                                  {formattedKey}:
                                </span>
                                <span style={{ fontWeight: 500, color: '#495057' }}>
                                  {String(displayValue)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  )}
                  
                  {score.calculated_by_name && (
                    <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '10px', fontStyle: 'italic' }}>
                      Calculated by: {score.calculated_by_name || score.calculated_by_full_name || 'System'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Lab Results Summary */}
        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px solid #e9ecef' }}>
          <h4
            style={{
              margin: '0 0 20px 0',
              color: '#A31D1D',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileText size={18} />
            Lab Results Summary
          </h4>

          {labResults.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
              No lab results available
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* CD4 Count */}
              {(() => {
                const cd4Results = labResults.filter(r => 
                  r.test_code?.toLowerCase().includes('cd4') || 
                  r.test_name?.toLowerCase().includes('cd4')
                ).sort((a, b) => new Date(b.reported_at || b.collected_at || 0) - new Date(a.reported_at || a.collected_at || 0));
                const latestCD4 = cd4Results[0];
                
                if (!latestCD4) return null;
                
                const cd4Value = parseFloat(latestCD4.result_value) || 0;
                // Align with ARPA_DOCUMENTATION.md CD4 reference ranges
                let cd4Label, cd4RiskLevel, cd4Color, cd4SystemAction;
                if (cd4Value >= 500) {
                  cd4Label = 'Normal';
                  cd4RiskLevel = 'Normal';
                  cd4Color = '#28a745';
                  cd4SystemAction = null;
                } else if (cd4Value >= 350) {
                  cd4Label = 'Mild Immunosuppression';
                  cd4RiskLevel = 'Mild';
                  cd4Color = '#ffc107';
                  cd4SystemAction = null;
                } else if (cd4Value >= 200) {
                  cd4Label = 'Moderate Immunosuppression';
                  cd4RiskLevel = 'Moderate';
                  cd4Color = '#fd7e14';
                  cd4SystemAction = null;
                } else {
                  cd4Label = 'Severe Immunosuppression';
                  cd4RiskLevel = 'Severe';
                  cd4Color = '#dc3545';
                  cd4SystemAction = 'Intensive follow-up, OI prophylaxis alert, patient prioritization';
                }
                
                const trend = cd4Results.length >= 2 ? 
                  (parseFloat(cd4Results[0].result_value) - parseFloat(cd4Results[1].result_value)) : null;
                
                return (
                  <div
                    style={{
                      padding: '15px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>CD4 Count</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: cd4Color }}>
                        {cd4Value.toLocaleString()}
                      </div>
                      {latestCD4.unit && (
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>{latestCD4.unit}</div>
                      )}
                      {trend !== null && (
                        <div style={{ fontSize: '12px', color: trend >= 0 ? '#28a745' : '#dc3545' }}>
                          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(0)}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600,
                      color: cd4Color, 
                      marginTop: '5px',
                      padding: '2px 6px',
                      backgroundColor: cd4Color === '#dc3545' ? '#fee' : cd4Color === '#fd7e14' ? '#fff4e6' : cd4Color === '#ffc107' ? '#fffbf0' : '#f0f9f0',
                      borderRadius: '3px',
                      display: 'inline-block'
                    }}>
                      {cd4Label}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '5px' }}>
                      {latestCD4.reported_at ? formatDate(latestCD4.reported_at) : 'Date unknown'}
                    </div>
                    {cd4SystemAction && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '5px', fontWeight: 600 }}>
                        ⚠ {cd4SystemAction}
                      </div>
                    )}
                    {latestCD4.is_critical && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '5px', fontWeight: 600 }}>
                        ⚠ Critical Value
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Viral Load */}
              {(() => {
                const vlResults = labResults.filter(r => 
                  r.test_code?.toLowerCase().includes('vl') || 
                  r.test_code?.toLowerCase().includes('viral') ||
                  r.test_name?.toLowerCase().includes('viral load')
                ).sort((a, b) => new Date(b.reported_at || b.collected_at || 0) - new Date(a.reported_at || a.collected_at || 0));
                const latestVL = vlResults[0];
                
                if (!latestVL) return null;
                
                const vlText = latestVL.result_value?.toString().toLowerCase() || '';
                const isUndetectable = vlText.includes('undetectable') || vlText.includes('<');
                const vlNumeric = isUndetectable ? 0 : parseFloat(latestVL.result_value) || 0;
                
                // Align with ARPA_DOCUMENTATION.md Viral Load reference ranges
                let vlLabel, vlRiskLevel, vlColor, vlSystemAction;
                if (isUndetectable || vlNumeric < 50) {
                  vlLabel = 'Undetectable';
                  vlRiskLevel = 'Optimal';
                  vlColor = '#28a745';
                  vlSystemAction = null;
                } else if (vlNumeric <= 200) {
                  vlLabel = 'Controlled';
                  vlRiskLevel = 'Low';
                  vlColor = '#ffc107';
                  vlSystemAction = null;
                } else if (vlNumeric <= 10000) {
                  vlLabel = 'Moderate';
                  vlRiskLevel = 'Moderate';
                  vlColor = '#fd7e14';
                  vlSystemAction = null;
                } else {
                  vlLabel = 'High Risk';
                  vlRiskLevel = 'High';
                  vlColor = '#dc3545';
                  vlSystemAction = 'Adherence counseling flag and treatment review';
                }
                
                return (
                  <div
                    style={{
                      padding: '15px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Viral Load (HIV RNA)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: vlColor }}>
                        {isUndetectable ? 'Undetectable' : vlNumeric.toLocaleString()}
                      </div>
                      {!isUndetectable && latestVL.unit && (
                        <div style={{ fontSize: '14px', color: '#6c757d' }}>{latestVL.unit}</div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600,
                      color: vlColor, 
                      marginTop: '5px',
                      padding: '2px 6px',
                      backgroundColor: vlColor === '#dc3545' ? '#fee' : vlColor === '#fd7e14' ? '#fff4e6' : vlColor === '#ffc107' ? '#fffbf0' : '#f0f9f0',
                      borderRadius: '3px',
                      display: 'inline-block'
                    }}>
                      {vlLabel}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '5px' }}>
                      {latestVL.reported_at ? formatDate(latestVL.reported_at) : 'Date unknown'}
                    </div>
                    {vlSystemAction && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '5px', fontWeight: 600 }}>
                        ⚠ {vlSystemAction}
                      </div>
                    )}
                    {latestVL.is_critical && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '5px', fontWeight: 600 }}>
                        ⚠ Critical Value
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Days Since Last Lab */}
              {(() => {
                const latestLab = labResults.sort((a, b) => 
                  new Date(b.reported_at || b.collected_at || 0) - new Date(a.reported_at || a.collected_at || 0)
                )[0];
                
                if (!latestLab) return null;
                
                const labDate = latestLab.reported_at || latestLab.collected_at;
                const daysSince = labDate ? Math.floor((new Date() - new Date(labDate)) / (1000 * 60 * 60 * 24)) : null;
                const daysColor = daysSince === null ? '#6c757d' : daysSince > 180 ? '#dc3545' : daysSince > 90 ? '#fd7e14' : '#28a745';
                
                return (
                  <div
                    style={{
                      padding: '15px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: '#f8f9fa',
                    }}
                  >
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Last Lab Test</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: daysColor }}>
                      {daysSince === null ? 'N/A' : daysSince === 0 ? 'Today' : `${daysSince} days ago`}
                    </div>
                    {labDate && (
                      <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '5px' }}>
                        {formatDate(labDate)}
                      </div>
                    )}
                    {daysSince !== null && daysSince > 90 && (
                      <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '5px', fontWeight: 600 }}>
                        ⚠ Lab test overdue
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Medications Summary */}
        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '2px solid #e9ecef' }}>
          <h4
            style={{
              margin: '0 0 20px 0',
              color: '#A31D1D',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <CreditCard size={18} />
            Medications & Adherence
          </h4>

          {/* Medication Adherence Summary */}
          {medicationAdherence && (
            <div
              style={{
                padding: '15px',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                backgroundColor: '#f8f9fa',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Adherence Rate</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 
                      medicationAdherence.avg_adherence >= 95 ? '#28a745' :
                      medicationAdherence.avg_adherence >= 80 ? '#ffc107' :
                      medicationAdherence.avg_adherence >= 70 ? '#fd7e14' : '#dc3545'
                    }}>
                      {medicationAdherence.avg_adherence ? medicationAdherence.avg_adherence.toFixed(1) : 'N/A'}%
                    </div>
                    <div style={{ flex: 1, height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${medicationAdherence.avg_adherence || 0}%`,
                          height: '100%',
                          backgroundColor: 
                            medicationAdherence.avg_adherence >= 95 ? '#28a745' :
                            medicationAdherence.avg_adherence >= 80 ? '#ffc107' :
                            medicationAdherence.avg_adherence >= 70 ? '#fd7e14' : '#dc3545',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Total Records</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#495057' }}>
                    {medicationAdherence.total_records || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Missed Doses</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: medicationAdherence.missed_doses > 0 ? '#dc3545' : '#28a745' }}>
                    {medicationAdherence.missed_doses || 0}
                  </div>
                </div>
                {medicationAdherence.last_record_date && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '5px' }}>Last Record</div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: '#495057' }}>
                      {formatDate(medicationAdherence.last_record_date)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Medications List */}
          {medications.length === 0 ? (
            <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
              No active medications
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medications.map((med, index) => (
                <div
                  key={med.prescription_item_id || `med-${index}`}
                  style={{
                    padding: '15px',
                    border: '1px solid #e9ecef',
                    borderRadius: '6px',
                    backgroundColor: 'white',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, marginBottom: '5px', fontSize: '15px' }}>
                        {med.medication_name || 'Unknown Medication'}
                      </div>
                      {med.dosage && (
                        <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '3px' }}>
                          Dosage: {med.dosage}
                        </div>
                      )}
                      {med.frequency && (
                        <div style={{ color: '#6c757d', fontSize: '14px' }}>
                          Frequency: {med.frequency}
                        </div>
                      )}
                      {med.start_date && (
                        <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                          Started: {formatDate(med.start_date)}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      backgroundColor: med.status === 'active' ? '#d4edda' : '#f8d7da',
                      color: med.status === 'active' ? '#155724' : '#721c24',
                    }}>
                      {med.status?.toUpperCase() || 'ACTIVE'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div
        style={{
          background: 'white',
          padding: '30px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <h3
          style={{
            margin: '0 0 20px 0',
            color: '#A31D1D',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <FileText size={20} />
          Documents
        </h3>

        {documents.length === 0 ? (
          <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
            No documents uploaded yet
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                style={{
                  padding: '15px',
                  border: '1px solid #e9ecef',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '5px' }}>
                    {doc.file_name}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '14px' }}>
                    {doc.document_type.replace('_', ' ').toUpperCase()}
                  </div>
                  <div style={{ color: '#6c757d', fontSize: '12px', marginTop: '5px' }}>
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.document_id)}
                  style={{
                    padding: '6px 10px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Identifier Modal */}
      {showIdentifierModal && (
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
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
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
              <h3 style={{ margin: 0 }}>Add Identifier</h3>
              <button
                onClick={() => setShowIdentifierModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  ID Type *
                </label>
                <select
                  value={newIdentifier.id_type}
                  onChange={(e) =>
                    setNewIdentifier({ ...newIdentifier, id_type: e.target.value })
                  }
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select...</option>
                  <option value="passport">Passport</option>
                  <option value="driver_license">Driver's License</option>
                  <option value="sss">SSS</option>
                  <option value="tin">TIN</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  ID Value *
                </label>
                <input
                  type="text"
                  value={newIdentifier.id_value}
                  onChange={(e) =>
                    setNewIdentifier({ ...newIdentifier, id_value: e.target.value })
                  }
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Issued At
                </label>
                <input
                  type="date"
                  value={newIdentifier.issued_at}
                  onChange={(e) =>
                    setNewIdentifier({ ...newIdentifier, issued_at: e.target.value })
                  }
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                  Expires At
                </label>
                <input
                  type="date"
                  value={newIdentifier.expires_at}
                  onChange={(e) =>
                    setNewIdentifier({ ...newIdentifier, expires_at: e.target.value })
                  }
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={newIdentifier.verified}
                    onChange={(e) =>
                      setNewIdentifier({ ...newIdentifier, verified: e.target.checked })
                    }
                  />
                  Verified
                </label>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => setShowIdentifierModal(false)}
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
                onClick={handleAddIdentifier}
                style={{
                  padding: '8px 16px',
                  background: '#D84040',
                  color: '#F8F2DE',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Add Identifier
              </button>
            </div>
          </div>
        </div>
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
            zIndex: 9999,
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default Profile;

