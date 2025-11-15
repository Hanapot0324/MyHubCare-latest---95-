// web/src/pages/VaccinationProgram.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Calendar,
  User,
  Clock,
  Eye,
  Edit,
} from 'lucide-react';

const VaccinationProgram = () => {
  const [vaccinations, setVaccinations] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedVaccination, setSelectedVaccination] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'view', 'edit'
  const [toast, setToast] = useState(null);
  const [clickedVaccinationIds, setClickedVaccinationIds] = useState([]);

  // Dummy data
  useEffect(() => {
    // Dummy patients with UIC
    const dummyPatients = [
      { id: 1, firstName: 'John', lastName: 'Doe', uic: 'AB051519950101' },
      { id: 2, firstName: 'Maria', lastName: 'Santos', uic: 'CD062319850215' },
      {
        id: 3,
        firstName: 'Carlos',
        lastName: 'Rodriguez',
        uic: 'EF071219900325',
      },
      { id: 4, firstName: 'Ana', lastName: 'Lopez', uic: 'GH081519850418' },
      {
        id: 5,
        firstName: 'Roberto',
        lastName: 'Garcia',
        uic: 'IJ091019800530',
      },
    ];

    // Dummy vaccinations with additional fields
    const dummyVaccinations = [
      {
        id: 1,
        patientId: 1,
        vaccineName: 'Influenza',
        manufacturer: 'Sanofi',
        doseNumber: 1,
        totalDoses: 1,
        dateGiven: '2024-11-01',
        nextDoseDate: null,
        administeredBy: 'Nurse Juan dela Cruz',
        recordedDate: '2024-10-20',
        status: 'COMPLETE',
        lotNumber: 'FLU2024-67890',
        administrationSite: 'Right arm',
        notes: 'Annual flu shot. Patient tolerated well.',
      },
      {
        id: 2,
        patientId: 1,
        vaccineName: 'Hepatitis B',
        manufacturer: 'GlaxoSmithKline',
        doseNumber: 2,
        totalDoses: 3,
        dateGiven: '2024-10-15',
        nextDoseDate: '2025-01-15',
        administeredBy: 'Dr. Johnson',
        recordedDate: '2024-10-15',
        status: 'IN PROGRESS',
        lotNumber: 'HEPB2024-12345',
        administrationSite: 'Left arm',
        notes: 'Second dose administered without complications.',
      },
      {
        id: 3,
        patientId: 2,
        vaccineName: 'Hepatitis A',
        manufacturer: 'Merck',
        doseNumber: 1,
        totalDoses: 2,
        dateGiven: '2024-09-20',
        nextDoseDate: '2025-03-20',
        administeredBy: 'Dr. Williams',
        recordedDate: '2024-09-20',
        status: 'IN PROGRESS',
        lotNumber: 'HEPA2024-54321',
        administrationSite: 'Left arm',
        notes: 'First dose of Hepatitis A series.',
      },
      {
        id: 4,
        patientId: 3,
        vaccineName: 'HPV',
        manufacturer: 'Merck',
        doseNumber: 1,
        totalDoses: 3,
        dateGiven: '2024-08-10',
        nextDoseDate: '2024-11-10',
        administeredBy: 'Dr. Brown',
        recordedDate: '2024-08-10',
        status: 'OVERDUE',
        lotNumber: 'HPV2024-98765',
        administrationSite: 'Right arm',
        notes: 'Patient informed about importance of completing series.',
      },
      {
        id: 5,
        patientId: 2,
        vaccineName: 'MMR',
        manufacturer: 'Merck',
        doseNumber: 1,
        totalDoses: 2,
        dateGiven: '2024-07-05',
        nextDoseDate: '2025-01-05',
        administeredBy: 'Dr. Davis',
        recordedDate: '2024-07-05',
        status: 'IN PROGRESS',
        lotNumber: 'MMR2024-24680',
        administrationSite: 'Right arm',
        notes: 'No adverse reactions reported.',
      },
    ];

    setPatients(dummyPatients);
    setVaccinations(dummyVaccinations);
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

  // Filter vaccinations
  const getFilteredVaccinations = () => {
    let filtered = vaccinations;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((vaccination) => {
        const patient = patients.find((p) => p.id === vaccination.patientId);
        const patientName = patient
          ? `${patient.firstName} ${patient.lastName}`.toLowerCase()
          : '';
        const vaccineName = vaccination.vaccineName.toLowerCase();
        const manufacturer = vaccination.manufacturer
          ? vaccination.manufacturer.toLowerCase()
          : '';

        return (
          patientName.includes(searchTerm.toLowerCase()) ||
          vaccineName.includes(searchTerm.toLowerCase()) ||
          manufacturer.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        (vaccination) => vaccination.status === filterStatus
      );
    }

    return filtered;
  };

  // Show add vaccination modal
  const handleShowAddVaccinationModal = () => {
    setSelectedVaccination(null);
    setModalMode('add');
    setShowModal(true);
  };

  // Show view vaccination modal
  const handleShowViewVaccinationModal = (vaccinationId) => {
    const vaccination = vaccinations.find((v) => v.id === vaccinationId);
    if (vaccination) {
      setSelectedVaccination(vaccination);
      setModalMode('view');
      setShowModal(true);
      // Add to clicked vaccination IDs
      if (!clickedVaccinationIds.includes(vaccinationId)) {
        setClickedVaccinationIds([...clickedVaccinationIds, vaccinationId]);
      }
    }
  };

  // Show edit vaccination modal
  const handleShowEditVaccinationModal = (vaccinationId) => {
    const vaccination = vaccinations.find((v) => v.id === vaccinationId);
    if (vaccination) {
      setSelectedVaccination(vaccination);
      setModalMode('edit');
      setShowModal(true);
      // Add to clicked vaccination IDs
      if (!clickedVaccinationIds.includes(vaccinationId)) {
        setClickedVaccinationIds([...clickedVaccinationIds, vaccinationId]);
      }
    }
  };

  // Add vaccination
  const handleAddVaccination = (formData) => {
    const newVaccination = {
      id:
        vaccinations.length > 0
          ? Math.max(...vaccinations.map((v) => v.id)) + 1
          : 1,
      patientId: parseInt(formData.patientId),
      vaccineName: formData.vaccineName,
      manufacturer: formData.manufacturer,
      doseNumber: parseInt(formData.doseNumber),
      totalDoses: parseInt(formData.totalDoses),
      dateGiven: formData.dateGiven,
      nextDoseDate: formData.nextDoseDate,
      administeredBy: formData.administeredBy,
      recordedDate: new Date().toISOString().split('T')[0],
      status: formData.status,
      lotNumber: formData.lotNumber,
      administrationSite: formData.administrationSite,
      notes: formData.notes,
    };

    setVaccinations([...vaccinations, newVaccination]);
    setToast({
      message: 'Vaccination recorded successfully',
      type: 'success',
    });
    setShowModal(false);
  };

  // Update vaccination
  const handleUpdateVaccination = (formData) => {
    const updatedVaccinations = vaccinations.map((vaccination) =>
      vaccination.id === selectedVaccination.id
        ? {
            ...vaccination,
            nextDoseDate: formData.nextDoseDate,
            notes: formData.notes,
          }
        : vaccination
    );

    setVaccinations(updatedVaccinations);
    setToast({
      message: 'Vaccination record updated successfully',
      type: 'success',
    });
    setShowModal(false);
  };

  // Delete vaccination
  const handleDeleteVaccination = (vaccinationId) => {
    if (
      window.confirm('Are you sure you want to delete this vaccination record?')
    ) {
      const updatedVaccinations = vaccinations.filter(
        (v) => v.id !== vaccinationId
      );
      setVaccinations(updatedVaccinations);
      setToast({
        message: 'Vaccination record deleted successfully',
        type: 'success',
      });
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETE':
        return '#28a745';
      case 'OVERDUE':
        return '#dc3545';
      case 'IN PROGRESS':
        return '#007bff';
      default:
        return '#6c757d';
    }
  };

  // Render vaccination table
  const renderVaccinationTable = () => {
    const filteredVaccinations = getFilteredVaccinations();

    if (filteredVaccinations.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>
          <AlertCircle size={48} style={{ marginBottom: '15px' }} />
          <p>No vaccination records found</p>
        </div>
      );
    }

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr
            style={{
              backgroundColor: '#f8f9fa',
              borderBottom: '1px solid #dee2e6',
            }}
          >
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              PATIENT
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              VACCINE
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              DOSE
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              DATE GIVEN
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              NEXT DOSE DUE
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              ADMINISTERED BY
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              STATUS
            </th>
            <th
              style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}
            >
              ACTIONS
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredVaccinations.map((vaccination) => {
            const patient = patients.find(
              (p) => p.id === vaccination.patientId
            );
            const isClicked = clickedVaccinationIds.includes(vaccination.id);

            return (
              <tr
                key={vaccination.id}
                style={{
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: isClicked ? '#f0f8ff' : 'white',
                  borderLeft: isClicked ? `4px solid #007bff` : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <td style={{ padding: '12px' }}>
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
                </td>
                <td style={{ padding: '12px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {vaccination.vaccineName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6c757d' }}>
                      {vaccination.manufacturer || 'N/A'}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      backgroundColor: '#e9ecef',
                      color: '#495057',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {vaccination.doseNumber}/{vaccination.totalDoses}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  {new Date(vaccination.dateGiven).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px' }}>
                  {vaccination.nextDoseDate ? (
                    <span
                      style={{
                        color:
                          vaccination.status === 'OVERDUE'
                            ? '#dc3545'
                            : '#495057',
                      }}
                    >
                      {new Date(vaccination.nextDoseDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span style={{ color: '#6c757d' }}>N/A</span>
                  )}
                </td>
                <td style={{ padding: '12px' }}>
                  {vaccination.administeredBy}
                </td>
                <td style={{ padding: '12px' }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(vaccination.status),
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}
                  >
                    {vaccination.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() =>
                        handleShowViewVaccinationModal(vaccination.id)
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isClicked
                          ? '0 2px 4px rgba(0,0,0,0.2)'
                          : 'none',
                        transition: 'all 0.3s ease',
                      }}
                      title="View Details"
                    >
                      <Eye size={16} color="#007bff" />
                    </button>
                    <button
                      onClick={() =>
                        handleShowEditVaccinationModal(vaccination.id)
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isClicked
                          ? '0 2px 4px rgba(0,0,0,0.2)'
                          : 'none',
                        transition: 'all 0.3s ease',
                      }}
                      title="Edit"
                    >
                      <Edit size={16} color="#007bff" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '20px', paddingTop: '80px' }}>
      {/* Header with Title */}
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
            Vaccination Program
          </h2>
          <p
            style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}
          >
            Manage patient vaccination records and schedules
          </p>
        </div>
        <button
          onClick={handleShowAddVaccinationModal}
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
          Record Vaccination
        </button>
      </div>

      {/* Search and Filter */}
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
            placeholder="Search patients or vaccines..."
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
            <option value="COMPLETE">Complete</option>
            <option value="IN PROGRESS">In Progress</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Vaccination Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '18px' }}>
            Patient Vaccinations
          </h3>
          {renderVaccinationTable()}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <VaccinationModal
          mode={modalMode}
          vaccination={selectedVaccination}
          patients={patients}
          onClose={() => setShowModal(false)}
          onAdd={handleAddVaccination}
          onUpdate={handleUpdateVaccination}
          onDelete={handleDeleteVaccination}
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

const VaccinationModal = ({
  mode,
  vaccination,
  patients,
  onClose,
  onAdd,
  onUpdate,
}) => {
  const [formData, setFormData] = useState(
    vaccination || {
      patientId: '',
      vaccineName: '',
      manufacturer: '',
      doseNumber: 1,
      totalDoses: 1,
      dateGiven: new Date().toISOString().split('T')[0],
      nextDoseDate: '',
      administeredBy: '',
      recordedDate: new Date().toISOString().split('T')[0],
      status: 'IN PROGRESS',
      lotNumber: '',
      administrationSite: '',
      notes: '',
    }
  );

  const vaccineOptions = [
    'Hepatitis B',
    'Hepatitis A',
    'HPV (Human Papillomavirus)',
    'Influenza',
    'Pneumococcal',
    'Meningococcal',
    'MMR (Measles, Mumps, Rubella)',
    'Tetanus/Diphtheria',
    'COVID-19',
    'Other',
  ];

  const manufacturerOptions = [
    'Pfizer',
    'Moderna',
    'Johnson & Johnson',
    'Sanofi',
    'GlaxoSmithKline',
    'Merck',
    'AstraZeneca',
    'Other',
  ];

  const administrationSiteOptions = [
    'Left arm',
    'Right arm',
    'Left thigh',
    'Right thigh',
    'Other',
  ];

  const vaccineDefaults = {
    'Hepatitis B': { totalDoses: 3, manufacturer: 'GlaxoSmithKline' },
    'Hepatitis A': { totalDoses: 2, manufacturer: 'Merck' },
    'HPV (Human Papillomavirus)': { totalDoses: 3, manufacturer: 'Merck' },
    Influenza: { totalDoses: 1, manufacturer: 'Sanofi' },
    Pneumococcal: { totalDoses: 1, manufacturer: 'Pfizer' },
    Meningococcal: { totalDoses: 1, manufacturer: 'Pfizer' },
    'MMR (Measles, Mumps, Rubella)': { totalDoses: 2, manufacturer: 'Merck' },
    'Tetanus/Diphtheria': { totalDoses: 1, manufacturer: 'Sanofi' },
    'COVID-19': { totalDoses: 2, manufacturer: 'Pfizer' },
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (mode === 'add') {
      onAdd(formData);
    } else if (mode === 'edit') {
      onUpdate(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Auto-fill default values when vaccine is selected
    if (name === 'vaccineName' && vaccineDefaults[value]) {
      setFormData({
        ...formData,
        vaccineName: value,
        totalDoses: vaccineDefaults[value].totalDoses,
        manufacturer: vaccineDefaults[value].manufacturer,
      });
    }
  };

  if (mode === 'view') {
    const patient = patients.find((p) => p.id === vaccination.patientId);

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
            <h2 style={{ margin: 0 }}>Vaccination Details</h2>
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
                patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'
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

          <div style={{ marginBottom: '15px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                color: '#6c757d',
              }}
            >
              UIC
            </label>
            <input
              type="text"
              value={patient ? patient.uic : 'N/A'}
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

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              Vaccine Details
            </h4>
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
                  Vaccine
                </label>
                <input
                  type="text"
                  value={vaccination.vaccineName}
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
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={vaccination.manufacturer || 'N/A'}
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
                  Dose
                </label>
                <input
                  type="text"
                  value={`${vaccination.doseNumber}/${vaccination.totalDoses}`}
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
                  Lot Number
                </label>
                <input
                  type="text"
                  value={vaccination.lotNumber || 'N/A'}
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
            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Administration Site
              </label>
              <input
                type="text"
                value={vaccination.administrationSite || 'N/A'}
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

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Dates</h4>
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
                  Date Given
                </label>
                <input
                  type="text"
                  value={new Date(vaccination.dateGiven).toLocaleDateString()}
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
                  Next Dose Due
                </label>
                <input
                  type="text"
                  value={
                    vaccination.nextDoseDate
                      ? new Date(vaccination.nextDoseDate).toLocaleDateString()
                      : 'N/A'
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
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>
              Provider Information
            </h4>
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
                  Administered By
                </label>
                <input
                  type="text"
                  value={vaccination.administeredBy}
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
                  Recorded Date
                </label>
                <input
                  type="text"
                  value={new Date(
                    vaccination.recordedDate
                  ).toLocaleDateString()}
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

          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Status</h4>
            <div style={{ marginBottom: '15px' }}>
              <span
                style={{
                  backgroundColor:
                    vaccination.status === 'COMPLETE'
                      ? '#28a745'
                      : vaccination.status === 'OVERDUE'
                      ? '#dc3545'
                      : vaccination.status === 'IN PROGRESS'
                      ? '#007bff'
                      : '#6c757d',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
              >
                {vaccination.status}
              </span>
            </div>
          </div>

          {vaccination.notes && (
            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#6c757d',
                }}
              >
                Notes
              </label>
              <textarea
                value={vaccination.notes}
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

  if (mode === 'edit') {
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
            <h2 style={{ margin: 0 }}>Edit Vaccination Record</h2>
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
                Patient
              </label>
              <input
                type="text"
                value={
                  patients.find((p) => p.id === vaccination.patientId)
                    ? `${
                        patients.find((p) => p.id === vaccination.patientId)
                          .firstName
                      } ${
                        patients.find((p) => p.id === vaccination.patientId)
                          .lastName
                      }`
                    : 'N/A'
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

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Next Dose Due Date
              </label>
              <input
                type="date"
                name="nextDoseDate"
                value={formData.nextDoseDate}
                onChange={handleChange}
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
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add any additional notes..."
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
                Update Vaccination
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
          <h2 style={{ margin: 0 }}>Record Vaccination</h2>
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
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Patient</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName}
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
              Vaccine Type <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              name="vaccineName"
              value={formData.vaccineName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Vaccine</option>
              {vaccineOptions.map((vaccine) => (
                <option key={vaccine} value={vaccine}>
                  {vaccine}
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
              Manufacturer
            </label>
            <select
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Manufacturer</option>
              {manufacturerOptions.map((manufacturer) => (
                <option key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Dose Number <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="doseNumber"
                value={formData.doseNumber}
                onChange={handleChange}
                min="1"
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
                Total Doses <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="totalDoses"
                value={formData.totalDoses}
                onChange={handleChange}
                min="1"
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
              Lot Number
            </label>
            <input
              type="text"
              name="lotNumber"
              value={formData.lotNumber}
              onChange={handleChange}
              placeholder="e.g., FLU2024-67890"
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
              Administration Site
            </label>
            <select
              name="administrationSite"
              value={formData.administrationSite}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ced4da',
                borderRadius: '4px',
              }}
            >
              <option value="">Select Site</option>
              {administrationSiteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Date Given <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="dateGiven"
                value={formData.dateGiven}
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
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                }}
              >
                Next Dose Due
              </label>
              <input
                type="date"
                name="nextDoseDate"
                value={formData.nextDoseDate}
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
              Administered By <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              name="administeredBy"
              value={formData.administeredBy}
              onChange={handleChange}
              required
              placeholder="Healthcare provider name"
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
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any reactions, side effects, or special notes..."
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
              Record Vaccination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccinationProgram;
