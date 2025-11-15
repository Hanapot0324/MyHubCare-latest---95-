import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Filter,
  AlertCircle,
  User,
  Edit,
  Trash2,
  Eye,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showArpaModal, setShowArpaModal] = useState(false);
  const [modalType, setModalType] = useState('view');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Get token from localStorage
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      if (!token) {
        setToast({
          message: 'Please login to view patients',
          type: 'error',
        });
        return;
      }

      const response = await fetch(`${API_URL}/patients`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Map API data to frontend format
        const mappedPatients = data.patients.map((patient) => ({
          id: patient.patient_id,
          firstName: patient.first_name,
          middleName: patient.middle_name || '',
          lastName: patient.last_name,
          suffix: patient.suffix || '',
          dateOfBirth: formatDate(patient.birth_date),
          age: calculateAge(patient.birth_date),
          gender: patient.sex,
          phone: patient.contact_phone,
          email: patient.email,
          address: patient.current_address
            ? JSON.parse(patient.current_address)
            : {
                city: patient.current_city,
                province: patient.current_province,
              },
          city: patient.current_city,
          uic: patient.uic,
          philhealthNo: patient.philhealth_no,
          civilStatus: patient.civil_status,
          nationality: patient.nationality,
          facilityName: patient.facility_name,
          riskLevel: 'LOW', // TODO: Calculate from actual data
          lastVisit: patient.updated_at
            ? formatDate(patient.updated_at)
            : 'N/A',
          nextAppointment: 'N/A', // TODO: Get from appointments table
          // Mock ARPA data for now
          arpaData: {
            riskLevel: 'LOW',
            compliancePercentage: 94,
            riskComponents: {
              missedMedications: 0,
              missedAppointments: 0,
              labCompliance: 10,
              timeSinceLastVisit: 20,
            },
            recommendations: 'Continue current treatment plan',
            riskTrend: [
              { month: 'May', value: 20 },
              { month: 'Jun', value: 25 },
              { month: 'Jul', value: 30 },
              { month: 'Aug', value: 25 },
              { month: 'Sep', value: 15 },
              { month: 'Oct', value: 10 },
            ],
          },
        }));

        setPatients(mappedPatients);
      } else {
        setToast({
          message: data.message || 'Failed to load patients',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setToast({
        message: 'Failed to load patients',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setModalType('view');
    setShowModal(true);
  };

  const handleAddPatient = () => {
    // Show alert
    alert('Please use the registration page to add new patients');

    // Navigate to registration page
    window.location.href = '/register'; // or use react-router's navigate('/register')
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient({ ...patient });
    setModalType('edit');
    setShowModal(true);
  };

  const handleDeletePatient = async (patient) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${patient.firstName} ${patient.lastName}?`
      )
    ) {
      try {
        const token = getAuthToken();
        const response = await fetch(`${API_URL}/patients/${patient.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success) {
          setToast({
            message: 'Patient deleted successfully.',
            type: 'success',
          });
          fetchPatients(); // Refresh list
        } else {
          setToast({
            message: data.message || 'Failed to delete patient',
            type: 'error',
          });
        }
      } catch (error) {
        console.error('Error deleting patient:', error);
        setToast({
          message: 'Failed to delete patient',
          type: 'error',
        });
      }
    }
  };

  const handleArpaAssessment = (patient) => {
    setSelectedPatient(patient);
    setShowArpaModal(true);
  };

  const handleSavePatient = async () => {
    // Validate required fields
    if (!selectedPatient.phone || !selectedPatient.email) {
      setToast({
        message: 'Please fill in all required fields',
        type: 'error',
      });
      return;
    }

    try {
      const token = getAuthToken();

      const payload = {
        // Personal information
        first_name: selectedPatient.firstName,
        middle_name: selectedPatient.middleName,
        last_name: selectedPatient.lastName,
        suffix: selectedPatient.suffix,
        birth_date: selectedPatient.dateOfBirth,
        sex: selectedPatient.gender,
        civil_status: selectedPatient.civilStatus,
        nationality: selectedPatient.nationality,

        // Contact information
        contact_phone: selectedPatient.phone,
        email: selectedPatient.email,
        current_city: selectedPatient.city,
        current_province: selectedPatient.address?.province || '',
        philhealth_no: selectedPatient.philhealthNo,
        guardian_name: selectedPatient.guardianName || null,
        guardian_relationship: selectedPatient.guardianRelationship || null,
      };

      const response = await fetch(
        `${API_URL}/patients/${selectedPatient.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Patient updated successfully.',
          type: 'success',
        });
        setShowModal(false);
        fetchPatients(); // Refresh list
      } else {
        setToast({
          message: data.message || 'Failed to update patient',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error updating patient:', error);
      setToast({
        message: 'Failed to update patient',
        type: 'error',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedPatient({
      ...selectedPatient,
      [name]: value,
    });
  };

  const getFilteredPatients = () => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          `${patient.firstName} ${patient.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone?.includes(searchTerm) ||
          patient.uic?.includes(searchTerm)
      );
    }

    if (genderFilter !== 'all') {
      filtered = filtered.filter((patient) => {
        // Handle different gender formats
        const patientGender = patient.gender
          ? patient.gender.toLowerCase()
          : '';
        const filterGender = genderFilter.toLowerCase();

        // Check for exact match
        if (patientGender === filterGender) return true;

        // Check for abbreviated format (F/M vs Female/Male)
        if (filterGender === 'female' && patientGender === 'f') return true;
        if (filterGender === 'male' && patientGender === 'm') return true;

        return false;
      });
    }

    return filtered;
  };

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'LOW':
        return '#28a745';
      case 'MEDIUM':
        return '#ffc107';
      case 'HIGH':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const renderPatientList = () => {
    const filteredPatients = getFilteredPatients();

    if (loading) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '40px' }}>
          Loading patients...
        </p>
      );
    }

    if (filteredPatients.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '40px' }}>
          No patients found
        </p>
      );
    }

    return filteredPatients.map((patient) => {
      return (
        <div
          key={patient.id}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: '15px',
                }}
              >
                <User size={24} color="#6c757d" />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#333', fontSize: '16px' }}>
                  {patient.firstName} {patient.middleName} {patient.lastName}
                  {patient.suffix && ` ${patient.suffix}`}
                </h3>
                <p
                  style={{
                    margin: '5px 0',
                    color: '#6c757d',
                    fontSize: '14px',
                  }}
                >
                  {patient.gender}, {patient.age} years old • UIC: {patient.uic}
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '5px',
                  }}
                >
                  <Phone
                    size={14}
                    color="#6c757d"
                    style={{ marginRight: '5px' }}
                  />
                  <span style={{ fontSize: '14px', marginRight: '15px' }}>
                    {patient.phone}
                  </span>
                  <Mail
                    size={14}
                    color="#6c757d"
                    style={{ marginRight: '5px' }}
                  />
                  <span style={{ fontSize: '14px' }}>{patient.email}</span>
                </div>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <div
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: getRiskLevelColor(patient.riskLevel),
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                }}
              >
                {patient.riskLevel} RISK
              </div>
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleViewPatient(patient)}
                  style={{
                    padding: '6px 12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="View"
                >
                  <Eye size={16} />
                  View
                </button>
                <button
                  onClick={() => handleArpaAssessment(patient)}
                  style={{
                    padding: '6px 12px',
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="ARPA Assessment"
                >
                  <Activity size={16} />
                  ARPA
                </button>
                <button
                  onClick={() => handleEditPatient(patient)}
                  style={{
                    padding: '6px 12px',
                    background: '#ffc107',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Edit"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePatient(patient)}
                  style={{
                    padding: '6px 12px',
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Delete"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  const renderPatientModal = () => {
    if (!selectedPatient) return null;

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
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
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
              {modalType === 'view' ? 'Patient Details' : 'Edit Patient'}
            </h2>
            <button
              onClick={() => setShowModal(false)}
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
                  fontSize: '14px',
                }}
              >
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={selectedPatient.firstName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={selectedPatient.middleName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={selectedPatient.lastName}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Suffix
              </label>
              <input
                type="text"
                name="suffix"
                value={selectedPatient.suffix}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={selectedPatient.dateOfBirth}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Sex
              </label>
              <select
                name="gender"
                value={selectedPatient.gender}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Civil Status
              </label>
              <select
                name="civilStatus"
                value={selectedPatient.civilStatus}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={selectedPatient.nationality}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Phone Number{' '}
                {modalType === 'edit' && (
                  <span style={{ color: 'red' }}>*</span>
                )}
              </label>
              <input
                type="tel"
                name="phone"
                value={selectedPatient.phone}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Email{' '}
                {modalType === 'edit' && (
                  <span style={{ color: 'red' }}>*</span>
                )}
              </label>
              <input
                type="email"
                name="email"
                value={selectedPatient.email}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Current City
              </label>
              <input
                type="text"
                name="city"
                value={selectedPatient.city}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                Province
              </label>
              <input
                type="text"
                name="province"
                value={selectedPatient.address?.province || ''}
                onChange={(e) => {
                  setSelectedPatient({
                    ...selectedPatient,
                    address: {
                      ...selectedPatient.address,
                      province: e.target.value,
                    },
                  });
                }}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                UIC
              </label>
              <input
                type="text"
                value={selectedPatient.uic}
                disabled={true}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: '#f8f9fa',
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontSize: '14px',
                }}
              >
                PhilHealth No.
              </label>
              <input
                type="text"
                name="philhealthNo"
                value={selectedPatient.philhealthNo || ''}
                onChange={handleInputChange}
                disabled={modalType === 'view'}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '14px',
                  background: modalType === 'view' ? '#f8f9fa' : 'white',
                }}
              />
            </div>
          </div>

          {modalType === 'view' && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
                Medical Information
              </h3>
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
                      fontSize: '14px',
                    }}
                  >
                    Risk Level
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#f8f9fa',
                      fontSize: '14px',
                    }}
                  >
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: getRiskLevelColor(
                          selectedPatient.riskLevel
                        ),
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      {selectedPatient.riskLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Last Visit
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#f8f9fa',
                      fontSize: '14px',
                    }}
                  >
                    {selectedPatient.lastVisit}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontSize: '14px',
                    }}
                  >
                    Facility
                  </label>
                  <div
                    style={{
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      background: '#f8f9fa',
                      fontSize: '14px',
                    }}
                  >
                    {selectedPatient.facilityName || 'N/A'}
                  </div>
                </div>
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
            {modalType === 'view' ? (
              <>
                <button
                  onClick={() => {
                    setModalType('edit');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#ffc107',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => setShowModal(false)}
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
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowModal(false)}
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
                  onClick={handleSavePatient}
                  style={{
                    padding: '8px 16px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Update Patient
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderArpaModal = () => {
    if (!selectedPatient) return null;

    const { arpaData } = selectedPatient;

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
        }}
      >
        <div
          style={{
            background: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '700px',
            maxHeight: '80vh',
            overflow: 'auto',
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
              ARPA Risk Assessment - {selectedPatient.firstName}{' '}
              {selectedPatient.lastName}
            </h2>
            <button
              onClick={() => setShowArpaModal(false)}
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

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '30px',
            }}
          >
            <div>
              <h3
                style={{
                  margin: '0 0 10px 0',
                  fontSize: '18px',
                  color: getRiskLevelColor(arpaData.riskLevel),
                }}
              >
                Risk Level: {arpaData.riskLevel}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {arpaData.compliancePercentage}%
                </span>
                <span style={{ marginLeft: '10px', color: '#6c757d' }}>
                  Compliance Rate
                </span>
              </div>
            </div>
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(
                  ${getRiskLevelColor(arpaData.riskLevel)} 0% ${
                  arpaData.compliancePercentage
                }%,
                  #e9ecef ${arpaData.compliancePercentage}% 100%
                )`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                {arpaData.compliancePercentage}%
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Risk Components</h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '15px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span>Missed Medications</span>
                  <span>{arpaData.riskComponents.missedMedications}/100</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.missedMedications}%`,
                      background: '#dc3545',
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span>Missed Appointments</span>
                  <span>{arpaData.riskComponents.missedAppointments}/100</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.missedAppointments}%`,
                      background: '#ffc107',
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span>Lab Compliance</span>
                  <span>{arpaData.riskComponents.labCompliance}/100</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.labCompliance}%`,
                      background: '#17a2b8',
                    }}
                  />
                </div>
              </div>
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '5px',
                  }}
                >
                  <span>Time Since Last Visit</span>
                  <span>{arpaData.riskComponents.timeSinceLastVisit}/100</span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#e9ecef',
                    borderRadius: '5px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${arpaData.riskComponents.timeSinceLastVisit}%`,
                      background: '#6c757d',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Recommendations</h3>
            <div
              style={{
                padding: '15px',
                background: '#f8f9fa',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {arpaData.recommendations}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 15px 0' }}>Risk Trend (Last 6 Months)</h3>
            <div style={{ height: '200px', position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '-30px',
                  top: '0',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#6c757d',
                }}
              >
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div
                style={{
                  height: '100%',
                  borderLeft: '1px solid #e9ecef',
                  borderBottom: '1px solid #e9ecef',
                  position: 'relative',
                  paddingLeft: '10px',
                }}
              >
                {arpaData.riskTrend.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: `${index * 16.66}%`,
                      width: '10%',
                      height: `${item.value}%`,
                      background: getRiskLevelColor(arpaData.riskLevel),
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                ))}

                <div
                  style={{
                    position: 'absolute',
                    bottom: '-25px',
                    left: '0',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#6c757d',
                  }}
                >
                  {arpaData.riskTrend.map((item, index) => (
                    <span
                      key={index}
                      style={{ width: '16.66%', textAlign: 'center' }}
                    >
                      {item.month}
                    </span>
                  ))}
                </div>
              </div>
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
              onClick={() => setShowArpaModal(false)}
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
            <button
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <TrendingUp size={16} />
              Update Assessment
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', paddingTop: '80px' }}>
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
            Patient Management
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}
          >
            Manage patient records and information
          </p>
        </div>
        <button
          onClick={handleAddPatient}
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
          Add New Patient
        </button>
      </div>

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
            placeholder="Search patients..."
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
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              background: 'white',
              paddingRight: '30px',
            }}
          >
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {renderPatientList()}

      {showModal && renderPatientModal()}

      {showArpaModal && renderArpaModal()}

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
          <AlertCircle size={20} />
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

export default Patients;
