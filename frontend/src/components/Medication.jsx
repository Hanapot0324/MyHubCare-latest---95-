import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';

const Medications = () => {
  const [medications, setMedications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    medication_name: '',
    generic_name: '',
    form: 'tablet',
    strength: '',
    atc_code: '',
  });

  const API_BASE = 'http://localhost:5000/api';

  useEffect(() => {
    fetchMedications();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/medications`);
      if (!res.ok) throw new Error('Failed to fetch medications');
      const data = await res.json();
      setMedications(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      generic_name: '',
      form: 'tablet',
      strength: '',
      atc_code: '',
    });
    setIsEditing(false);
    setSelectedMedication(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (medication) => {
    setSelectedMedication(medication);
    setFormData({
      medication_name: medication.medication_name,
      generic_name: medication.generic_name || '',
      form: medication.form,
      strength: medication.strength || '',
      atc_code: medication.atc_code || '',
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medication?'))
      return;
    try {
      const res = await fetch(`${API_BASE}/medications/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete medication');
      setMedications(medications.filter((m) => m.medication_id !== id));
      setToast({ message: 'Medication deleted successfully', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = isEditing
        ? `${API_BASE}/medications/${selectedMedication.medication_id}`
        : `${API_BASE}/medications`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok)
        throw new Error(
          `Failed to ${isEditing ? 'update' : 'create'} medication`
        );
      const saved = await res.json();
      if (!saved.data) throw new Error('No data returned from backend');

      if (isEditing) {
        setMedications(
          medications.map((m) =>
            m.medication_id === saved.data.medication_id ? saved.data : m
          )
        );
        setToast({
          message: 'Medication updated successfully',
          type: 'success',
        });
      } else {
        setMedications([...medications, saved.data]);
        setToast({
          message: 'Medication created successfully',
          type: 'success',
        });
      }

      setShowModal(false);
      resetForm();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const filteredMedications = medications.filter(
    (m) =>
      m.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.atc_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '20px', paddingTop: '80px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '30px',
        }}
      >
        <div>
          <h2>Medications</h2>
          <p style={{ color: '#6c757d' }}>Manage medication inventory</p>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '10px 16px',
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
          <Plus size={16} /> Add Medication
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
            color="#6c757d"
          />
          <input
            type="text"
            placeholder="Search medications..."
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
      </div>

      {loading && <p>Loading medications...</p>}
      {!loading && filteredMedications.length === 0 && (
        <p>No medications found</p>
      )}

      {filteredMedications.map((med) => (
        <div
          key={med.medication_id}
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
              alignItems: 'flex-start',
              marginBottom: '10px',
            }}
          >
            <div style={{ flex: 1 }}>
              <h3>{med.medication_name}</h3>
              {med.generic_name && <p>Generic: {med.generic_name}</p>}
              <p>
                Form: {med.form} | Strength: {med.strength || 'N/A'}
              </p>
              {med.atc_code && <p>ATC Code: {med.atc_code}</p>}
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button
                onClick={() => handleEdit(med)}
                style={{
                  padding: '6px 12px',
                  background: '#ffc107',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Edit size={14} />
                Edit
              </button>
              <button
                onClick={() => handleDelete(med.medication_id)}
                style={{
                  padding: '6px 12px',
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
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}

      {showModal && (
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
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: 'calc(100vh - 40px)',
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
              <h2>{isEditing ? 'Edit Medication' : 'Add New Medication'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label>Medication Name *</label>
                <input
                  type="text"
                  name="medication_name"
                  value={formData.medication_name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>Generic Name</label>
                <input
                  type="text"
                  name="generic_name"
                  value={formData.generic_name}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div
                style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}
              >
                <div style={{ flex: 1 }}>
                  <label>Form *</label>
                  <select
                    name="form"
                    value={formData.form}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  >
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label>Strength</label>
                  <input
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., 500mg"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>ATC Code</label>
                <input
                  type="text"
                  name="atc_code"
                  value={formData.atc_code}
                  onChange={handleInputChange}
                  placeholder="e.g., J05AE01"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
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
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  style={{
                    padding: '10px 16px',
                    border: '1px solid #6c757d',
                    borderRadius: '4px',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 16px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: toast.type === 'error' ? '#dc3545' : '#28a745',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Medications;
