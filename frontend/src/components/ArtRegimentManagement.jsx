// web/src/pages/ARTRegimenManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Pill,
  Calendar,
  User,
  Clock,
  Activity,
} from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

const ARTRegimenManagement = () => {
  const [regimens, setRegimens] = useState([]);
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedRegimen, setSelectedRegimen] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'view', 'stop'
  const [toast, setToast] = useState(null);
  const [drugItems, setDrugItems] = useState([{}]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from API
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');

    if (!token) {
      setError('Authentication required. Please log in.');
      setLoading(false);
      return;
    }

    try {
      // Fetch regimens
      const regimensResponse = await fetch(`${API_BASE_URL}/art-regimens`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (regimensResponse.ok) {
        const regimensData = await regimensResponse.json();
        if (regimensData.success) {
          setRegimens(regimensData.data || []);
        }
      } else {
        console.warn('Failed to fetch regimens:', regimensResponse.status);
      }

      // Fetch patients
      const patientsResponse = await fetch(`${API_BASE_URL}/patients?status=active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        if (patientsData.success) {
          // Backend returns { success: true, patients: [...] }
          const patientsList = patientsData.patients || patientsData.data || [];
          setPatients(patientsList);
          console.log('Patients fetched:', patientsList.length);
        } else {
          console.warn('Patients API returned success=false:', patientsData.message);
        }
      } else {
        const errorData = await patientsResponse.json().catch(() => ({}));
        console.error('Failed to fetch patients:', patientsResponse.status, errorData);
        setError(`Failed to load patients: ${errorData.message || 'Access denied or server error'}`);
      }

      // Fetch ART medications
      const medicationsResponse = await fetch(`${API_BASE_URL}/medications?is_art=true&active=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (medicationsResponse.ok) {
        const medicationsData = await medicationsResponse.json();
        if (medicationsData.success) {
          setMedications(medicationsData.data || []);
        }
      } else {
        console.warn('Failed to fetch medications:', medicationsResponse.status);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please refresh the page.');
      setToast({
        message: 'Failed to load data. Please refresh the page.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Filter regimens
  const getFilteredRegimens = () => {
    let filtered = regimens;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((regimen) => {
        const patient = patients.find((p) => p.id === regimen.patientId);
        const patientName = patient
          ? `${patient.firstName} ${patient.lastName}`.toLowerCase()
          : '';
        return patientName.includes(searchTerm.toLowerCase());
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((regimen) => regimen.status === filterStatus);
    }

    return filtered;
  };

  // Show add regimen modal
  const handleShowAddRegimenModal = async () => {
    setSelectedRegimen(null);
    setModalMode('add');
    setDrugItems([{}]);
    
    // If patients are not loaded, try to fetch them
    if (patients.length === 0) {
      await fetchPatients();
    }
    
    setShowModal(true);
  };

  // Fetch patients separately
  const fetchPatients = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const patientsResponse = await fetch(`${API_BASE_URL}/patients?status=active`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        if (patientsData.success) {
          // Backend returns { success: true, patients: [...] }
          const patientsList = patientsData.patients || patientsData.data || [];
          setPatients(patientsList);
          console.log('Patients fetched:', patientsList.length);
        } else {
          console.warn('Patients API returned success=false:', patientsData.message);
        }
      } else {
        const errorData = await patientsResponse.json().catch(() => ({}));
        console.error('Failed to fetch patients:', patientsResponse.status, errorData);
        setToast({
          message: `Failed to load patients: ${errorData.message || 'Access denied'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error fetching patients:', err);
    }
  };

  // Show view regimen modal
  const handleShowViewRegimenModal = async (regimenId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_BASE_URL}/art-regimens/${regimenId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSelectedRegimen(data.data);
        setModalMode('view');
        setShowModal(true);
      } else {
        setToast({
          message: 'Failed to load regimen details',
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error fetching regimen:', err);
      setToast({
        message: 'Failed to load regimen details',
        type: 'error',
      });
    }
  };

  // Show stop regimen modal
  const handleShowStopRegimenModal = (regimenId) => {
    const regimen = regimens.find((r) => r.regimen_id === regimenId);
    if (regimen) {
      setSelectedRegimen(regimen);
      setModalMode('stop');
      setShowModal(true);
    }
  };

  // Add drug field
  const handleAddDrugField = () => {
    setDrugItems([...drugItems, {}]);
  };

  // Remove drug field
  const handleRemoveDrugField = (index) => {
    const newDrugItems = [...drugItems];
    newDrugItems.splice(index, 1);
    setDrugItems(newDrugItems);
  };

  // Add regimen
  const handleAddRegimen = async (formData) => {
    const token = localStorage.getItem('token');
    setError(null);

    try {
      // Get current user info for provider_id and facility_id
      const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      const currentUser = userData.user;

      // Prepare drugs array
      const drugs = formData.drugs.map((drug) => ({
        medication_id: drug.medication_id,
        drug_name: drug.drugName,
        dosage: drug.dose,
        pills_per_day: parseInt(drug.pillsPerDay),
        pills_dispensed: parseInt(drug.pillsDispensed) || 0,
      }));

      const response = await fetch(`${API_BASE_URL}/art-regimens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patient_id: formData.patientId,
          provider_id: currentUser?.user_id,
          facility_id: currentUser?.facility_id,
          start_date: formData.startDate,
          notes: formData.notes || null,
          drugs: drugs,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToast({
          message: 'ART regimen started successfully',
          type: 'success',
        });
        setShowModal(false);
        fetchData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to start regimen');
      }
    } catch (err) {
      console.error('Error adding regimen:', err);
      setError(err.message);
      setToast({
        message: err.message || 'Failed to start ART regimen',
        type: 'error',
      });
    }
  };

  // Stop regimen
  const handleStopRegimen = async (formData) => {
    const token = localStorage.getItem('token');
    setError(null);

    try {
      const endpoint = formData.action === 'stopped' 
        ? `${API_BASE_URL}/art-regimens/${selectedRegimen.regimen_id}/stop`
        : `${API_BASE_URL}/art-regimens/${selectedRegimen.regimen_id}/change`;

      const body = formData.action === 'stopped'
        ? {
            stop_date: formData.stopDate,
            stop_reason: formData.stopReason,
          }
        : {
            change_date: formData.stopDate,
            change_reason: formData.stopReason,
          };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToast({
          message: `ART regimen ${formData.action} successfully`,
          type: 'success',
        });
        setShowModal(false);
        fetchData(); // Refresh data
      } else {
        throw new Error(data.message || 'Failed to update regimen');
      }
    } catch (err) {
      console.error('Error updating regimen:', err);
      setError(err.message);
      setToast({
        message: err.message || 'Failed to update ART regimen',
        type: 'error',
      });
    }
  };

  // Calculate days on ART
  const calculateDaysOnART = (startDate, stopDate) => {
    const start = new Date(startDate);
    const end = stopDate ? new Date(stopDate) : new Date();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  };

  // Render regimen list
  const renderRegimenList = () => {
    const filteredRegimens = getFilteredRegimens();

    if (filteredRegimens.length === 0) {
      return (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
          No ART regimens found
        </p>
      );
    }

    return filteredRegimens.map((regimen) => {
      const patient = patients.find((p) => p.patient_id === regimen.patient_id);
      const daysOnART = calculateDaysOnART(regimen.start_date, regimen.stop_date);

      let statusColor = '#28a745';
      if (regimen.status === 'stopped') statusColor = '#dc3545';
      if (regimen.status === 'changed') statusColor = '#ffc107';

      return (
        <div
          key={regimen.id}
          style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderLeft: `4px solid ${statusColor}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 10px 0',
                  color: '#333',
                  fontSize: '18px',
                }}
              >
                {patient ? `${patient.first_name} ${patient.last_name}` : 'N/A'}
              </h3>
              <div
                style={{
                  fontSize: '14px',
                  color: '#6c757d',
                  marginBottom: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '15px',
                }}
              >
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Calendar size={14} />
                  Started: {new Date(regimen.start_date).toLocaleDateString()}
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Clock size={14} />
                  {daysOnART} days on ART
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Pill size={14} />
                  {regimen.drugs ? regimen.drugs.length : 0} medications
                </span>
              </div>
              {regimen.notes && (
                <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                  <strong>Notes:</strong> {regimen.notes}
                </p>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '10px',
                marginLeft: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <span
                  style={{
                    background: statusColor,
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                  }}
                >
                  {regimen.status}
                </span>
                <button
                  onClick={() => handleShowViewRegimenModal(regimen.regimen_id)}
                  style={{
                    padding: '6px 12px',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  View
                </button>
                {regimen.status === 'active' && (
                  <button
                    onClick={() => handleShowStopRegimenModal(regimen.regimen_id)}
                    style={{
                      padding: '6px 12px',
                      background: '#ffc107',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Stop/Change
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      minHeight: '100vh', 
      paddingTop: '100px' 
      }}>
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>ART Regimen Management</h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>Manage antiretroviral therapy regimens and adherence</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleShowAddRegimenModal}
              style={{
                padding: '10px 16px',
                background: '#ECDCBF',
                color: '#A31D1D',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#F8F2DE';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#ECDCBF';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <Plus size={16} />
              Start New Regimen
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filter - Now in 2 rows */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', marginBottom: '10px' }}>
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
            placeholder="Search regimens..."
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px 8px 36px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              appearance: 'none',
              width: '100%',
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="stopped">Stopped</option>
            <option value="changed">Changed</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#6c757d' }}>Loading ART regimens...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div style={{ 
          background: '#f8d7da', 
          color: '#721c24', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Regimen List */}
      {!loading && !error && (
        <div style={{ width: '100%' }}>{renderRegimenList()}</div>
      )}

      {/* Modal */}
      {showModal && (
        <RegimenModal
          mode={modalMode}
          regimen={selectedRegimen}
          patients={patients}
          medications={medications}
          drugItems={drugItems}
          onClose={() => setShowModal(false)}
          onAdd={handleAddRegimen}
          onStop={handleStopRegimen}
          onAddDrug={handleAddDrugField}
          onRemoveDrug={handleRemoveDrugField}
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
            <AlertCircle size={20} />
          )}
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}

      {/* Add keyframes for animation */}
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

const RegimenModal = ({
  mode,
  regimen,
  patients,
  medications,
  drugItems,
  onClose,
  onAdd,
  onStop,
  onAddDrug,
  onRemoveDrug,
}) => {
  const [formData, setFormData] = useState(
    regimen || {
      patientId: '',
      startDate: new Date().toISOString().split('T')[0],
      drugs: [{}],
      notes: '',
    }
  );

  const [stopFormData, setStopFormData] = useState({
    action: 'stopped',
    stopDate: new Date().toISOString().split('T')[0],
    stopReason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'add') {
      // Collect drug data
      const drugElements = document.querySelectorAll('.drug-item');
      const drugs = [];

      drugElements.forEach((item) => {
        const medicationId = item.querySelector('.medicationId')?.value;
        const drugName = item.querySelector('.drugName')?.value;
        const dose = item.querySelector('.dose')?.value;
        const pillsPerDay = item.querySelector('.pillsPerDay')?.value;
        const pillsDispensed = item.querySelector('.pillsDispensed')?.value;

        if (medicationId && drugName && dose && pillsPerDay) {
          drugs.push({
            medication_id: medicationId,
            drugName,
            dose,
            pillsPerDay: parseInt(pillsPerDay),
            pillsDispensed: parseInt(pillsDispensed) || 0,
          });
        }
      });

      onAdd({
        ...formData,
        drugs,
      });
    } else if (mode === 'stop') {
      onStop(stopFormData);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleStopChange = (e) => {
    setStopFormData({
      ...stopFormData,
      [e.target.name]: e.target.value,
    });
  };

  if (mode === 'view') {
    const patient = patients.find((p) => p.patient_id === regimen.patient_id);

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
            <h2 style={{ margin: 0 }}>ART Regimen Details</h2>
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
            <input
              type="text"
              value={
                patient ? `${patient.first_name} ${patient.last_name}` : 'N/A'
              }
              readOnly
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: '#f8f9fa',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Start Date
              </label>
              <input
                type="date"
                value={regimen.start_date}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Status
              </label>
              <input
                type="text"
                value={regimen.status}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                  textTransform: 'capitalize',
                }}
              />
            </div>
          </div>

          {regimen.stopDate && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Stop Date
                </label>
                <input
                  type="date"
                  value={regimen.stop_date}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#6c757d',
                  }}
                >
                  Stop Reason
                </label>
                <input
                  type="text"
                  value={regimen.stop_reason || regimen.change_reason || 'N/A'}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>
            </div>
          )}

          <h4 style={{ margin: '20px 0 10px 0' }}>Medications</h4>
          {regimen.drugs.map((drug, index) => (
            <div
              key={index}
              style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <h5 style={{ margin: '0 0 10px 0' }}>
                {index + 1}. {drug.drug_name || drug.drugName}
              </h5>
              <div
                style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={drug.dosage || drug.dose}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Pills/Day
                  </label>
                  <input
                    type="text"
                    value={drug.pills_per_day || drug.pillsPerDay}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Pills Remaining
                  </label>
                  <input
                    type="text"
                    value={drug.pills_remaining || drug.pillsRemaining || 0}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    Missed Doses
                  </label>
                  <input
                    type="text"
                    value={drug.missed_doses || drug.missedDoses || 0}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      backgroundColor: '#f8f9fa',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {regimen.notes && (
            <div style={{ marginBottom: '20px' }}>
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
              <textarea
                value={regimen.notes}
                readOnly
                rows="3"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa',
                }}
              />
            </div>
          )}

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
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
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'stop') {
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
            maxWidth: '500px',
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
            <h2 style={{ margin: 0 }}>Stop/Change ART Regimen</h2>
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

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Action <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                name="action"
                value={stopFormData.action}
                onChange={handleStopChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="stopped">Stop Regimen</option>
                <option value="changed">Change Regimen</option>
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
                Date <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="stopDate"
                value={stopFormData.stopDate}
                onChange={handleStopChange}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Reason <span style={{ color: 'red' }}>*</span>
              </label>
              <textarea
                name="stopReason"
                value={stopFormData.stopReason}
                onChange={handleStopChange}
                required
                rows="3"
                placeholder="Enter reason for stopping/changing regimen..."
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
          <h2 style={{ margin: 0 }}>Start ART Regimen</h2>
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
              name="patientId"
              value={formData.patientId}
              onChange={handleChange}
              required
              disabled={patients.length === 0}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
                backgroundColor: patients.length === 0 ? '#f8f9fa' : 'white',
              }}
            >
              <option value="">
                {patients.length === 0 
                  ? 'Loading patients...' 
                  : 'Select Patient'}
              </option>
              {patients.length === 0 ? (
                <option value="" disabled>
                  No patients available. Please check your permissions or contact an administrator.
                </option>
              ) : (
                patients.map((patient) => (
                  <option key={patient.patient_id} value={patient.patient_id}>
                    {patient.first_name} {patient.last_name} {patient.uic ? `(${patient.uic})` : ''}
                  </option>
                ))
              )}
            </select>
            {patients.length === 0 && (
              <p style={{ 
                marginTop: '5px', 
                fontSize: '12px', 
                color: '#dc3545',
                fontStyle: 'italic'
              }}>
                Unable to load patients. Make sure you have the required permissions (admin, physician, nurse, or case_manager).
              </p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
              }}
            >
              Start Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
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

          <h4 style={{ margin: '20px 0 10px 0' }}>ART Medications</h4>
          <div id="drugsContainer">
            {drugItems.map((_, index) => (
              <div
                key={index}
                className="drug-item"
                style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  position: 'relative',
                }}
              >
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => onRemoveDrug(index)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '5px',
                      borderRadius: '4px',
                    }}
                  >
                    <X size={16} color="#dc3545" />
                  </button>
                )}
                <div style={{ marginBottom: '15px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '5px',
                      fontWeight: 'bold',
                    }}
                  >
                    Drug Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    className="medicationId"
                    required
                    onChange={(e) => {
                      const selectedMed = medications.find(m => m.medication_id === e.target.value);
                      if (selectedMed) {
                        e.target.closest('.drug-item').querySelector('.drugName').value = selectedMed.medication_name;
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="">Select Medication</option>
                    {medications.map((med) => (
                      <option key={med.medication_id} value={med.medication_id}>
                        {med.medication_name} {med.generic_name ? `(${med.generic_name})` : ''}
                      </option>
                    ))}
                  </select>
                  <input
                    type="hidden"
                    className="drugName"
                  />
                </div>
                <div
                  style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 'bold',
                      }}
                    >
                      Dosage <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="dose"
                      placeholder="e.g., 1 tablet"
                      required
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '5px',
                        fontWeight: 'bold',
                      }}
                    >
                      Pills per Day <span style={{ color: 'red' }}>*</span>
                    </label>
                    <input
                      type="number"
                      className="pillsPerDay"
                      min="1"
                      defaultValue="1"
                      required
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
                    Initial Pills Dispensed
                  </label>
                  <input
                    type="number"
                    className="pillsDispensed"
                    min="0"
                    defaultValue="30"
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onAddDrug}
            style={{
              padding: '8px 16px',
              background: '#f8f9fa',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              marginBottom: '20px',
            }}
          >
            + Add Another Drug
          </button>

          <div style={{ marginBottom: '20px' }}>
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
              placeholder="Enter regimen notes..."
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            />
          </div>

          <div
            style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}
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
              Start Regimen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ARTRegimenManagement;