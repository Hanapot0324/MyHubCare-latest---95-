import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Filter,
  AlertCircle,
  Edit,
  Trash2,
  Pill,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Clock,
  MapPin,
  Package,
  ChevronDown,
  ChevronUp,
  FileText,
  History,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const Medications = ({ socket }) => {
  const [activeTab, setActiveTab] = useState('medications');
  const [myMedications, setMyMedications] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);
  const [myRefillRequests, setMyRefillRequests] = useState([]);
  const [filteredMedications, setFilteredMedications] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filteredMyRequests, setFilteredMyRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [pendingCount, setPendingCount] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [userRole, setUserRole] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [patientId, setPatientId] = useState(null);

  const [refillForm, setRefillForm] = useState({
    medication_id: '',
    quantity: '',
    pickup_date: '',
    facility_id: '',
    notes: ''
  });

  const [declineReason, setDeclineReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  useEffect(() => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    console.log('User from localStorage:', user); // Debug log
    setCurrentUser(user);
    setUserRole(user.role || 'patient');
    
    // If user is a patient, fetch their patient_id
    if (user.role === 'patient' && user.user_id) {
      console.log('Fetching patient ID for user:', user.user_id); // Debug log
      fetchPatientId(user.user_id);
    }
  }, []);

  // Add this function to fetch patient_id
  const fetchPatientId = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching patient for user ID:', userId); // Debug log
      
      // Find patient by the user who created them
      const response = await fetch(`${API_BASE_URL}/patients/by-creator/${userId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      console.log('Patient fetch response:', data); // Debug log
      
      if (data.success && data.patient) {
        console.log('Found patient:', data.patient); // Debug log
        setPatientId(data.patient.patient_id);
        // Update the currentUser object to include patient_id
        setCurrentUser(prev => ({
          ...prev,
          patient_id: data.patient.patient_id
        }));
      } else {
        console.error('No patient record found for this user');
        setToast({
          message: 'No patient record found. Please contact support.',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching patient ID:', error);
      setToast({
        message: 'Failed to fetch patient information. Please try again.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    console.log('useEffect triggered - activeTab:', activeTab, 'patientId:', patientId); // Debug log
    if (activeTab === 'medications') {
      fetchMyMedications();
    } else if (activeTab === 'refills') {
      fetchRefillRequests();
    }
  }, [activeTab, patientId]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch patient's medications
  const fetchMyMedications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('fetchMyMedications called - patientId:', patientId); // Debug log
      
      // Check if we have a valid patient_id
      if (!patientId) {
        console.error('No valid patient_id found');
        setToast({
          message: 'Patient information is missing. Please log in again.',
          type: 'error',
        });
        
        // Use mock data for now
        const mockMedications = [
          {
            medication_id: '1',
            medication_name: 'TLD',
            generic_name: 'Tenofovir/Lamivudine/Dolutegravir',
            form: 'tablet',
            strength: '300/300/50mg',
            is_art: true,
            is_controlled: false,
            active: true,
            prescription: {
              dosage: '1 tablet daily',
              frequency: 'Once daily',
              start_date: '2024-01-15',
              next_refill: '2024-12-15'
            }
          }
        ];
        
        setMyMedications(mockMedications);
        setFilteredMedications(mockMedications);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/patients/${patientId}/medications`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      console.log('Medications API response:', data); // Debug log
      
      if (data.success) {
        setMyMedications(data.data);
        setFilteredMedications(data.data);
      } else {
        // Use mock data if API fails
        const mockMedications = [
          {
            medication_id: '1',
            medication_name: 'TLD',
            generic_name: 'Tenofovir/Lamivudine/Dolutegravir',
            form: 'tablet',
            strength: '300/300/50mg',
            is_art: true,
            is_controlled: false,
            active: true,
            prescription: {
              dosage: '1 tablet daily',
              frequency: 'Once daily',
              start_date: '2024-01-15',
              next_refill: '2024-12-15'
            }
          }
        ];
        
        setMyMedications(mockMedications);
        setFilteredMedications(mockMedications);
      }
    } catch (error) {
      console.error('Error fetching my medications:', error);
      setToast({
        message: 'Failed to fetch your medications: ' + error.message,
        type: 'error',
      });
      
      // Use mock data as fallback
      const mockMedications = [
        {
          medication_id: '1',
          medication_name: 'TLD',
          generic_name: 'Tenofovir/Lamivudine/Dolutegravir',
          form: 'tablet',
          strength: '300/300/50mg',
          is_art: true,
          is_controlled: false,
          active: true,
          prescription: {
            dosage: '1 tablet daily',
            frequency: 'Once daily',
            start_date: '2024-01-15',
            next_refill: '2024-12-15'
          }
        }
      ];
      
      setMyMedications(mockMedications);
      setFilteredMedications(mockMedications);
    } finally {
      setLoading(false);
    }
  };

  // Submit new refill request
  const handleSubmitRefillRequest = async () => {
    try {
      console.log('handleSubmitRefillRequest called - patientId:', patientId); // Debug log
      
      // Check if we have a valid patient_id
      if (!patientId) {
        setToast({
          message: 'Patient information is missing. Please log in again.',
          type: 'error',
        });
        return;
      }
      
      if (!refillForm.medication_id || !refillForm.quantity || !refillForm.pickup_date || !refillForm.facility_id) {
        setToast({
          message: 'All fields are required',
          type: 'error',
        });
        return;
      }

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/refill-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          ...refillForm,
          patient_id: patientId
        }),
      });

      const data = await response.json();
      console.log('Refill request response:', data); // Debug log

      if (data.success) {
        setToast({
          message: 'Refill request submitted successfully',
          type: 'success',
        });
        setShowRefillModal(false);
        setRefillForm({
          medication_id: '',
          quantity: '',
          pickup_date: '',
          facility_id: '',
          notes: ''
        });
        fetchRefillRequests();
      } else {
        throw new Error(data.message || 'Failed to submit refill request');
      }
    } catch (error) {
      console.error('Error submitting refill request:', error);
      setToast({
        message: 'Failed to submit refill request: ' + error.message,
        type: 'error',
      });
    }
  };

  // Fetch refill requests
  const fetchRefillRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = `${API_BASE_URL}/refill-requests`;
      
      console.log('fetchRefillRequests called - patientId:', patientId); // Debug log
      
      // If case manager, get all pending requests
      if (currentUser && currentUser.role === 'case manager') {
        url += `?status=${statusFilter}`;
        
        // Count pending and ready requests
        const pendingResponse = await fetch(`${API_BASE_URL}/refill-requests?status=pending`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const pendingData = await pendingResponse.json();
        if (pendingData.success) {
          setPendingCount(pendingData.data.length);
        }
        
        const readyResponse = await fetch(`${API_BASE_URL}/refill-requests?status=ready`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        const readyData = await readyResponse.json();
        if (readyData.success) {
          setReadyCount(readyData.data.length);
        }
      } else if (patientId) {
        // If patient, get only their requests
        url += `?patient_id=${patientId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();
      console.log('Refill requests response:', data); // Debug log

      if (data.success) {
        if (currentUser && currentUser.role === 'case manager') {
          setRefillRequests(data.data);
          setFilteredRequests(data.data);
        } else {
          setMyRefillRequests(data.data);
          setFilteredMyRequests(data.data);
        }
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      setToast({
        message: 'Failed to fetch refill requests: ' + error.message,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/refill-requests/${selectedRequest.refill_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          notes: approveNotes
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Refill request approved successfully',
          type: 'success',
        });
        setShowApproveModal(false);
        setSelectedRequest(null);
        setApproveNotes('');
        fetchRefillRequests();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error approving refill request:', error);
      setToast({
        message: 'Failed to approve refill request: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDeclineRequest = async () => {
    try {
      if (!declineReason.trim()) {
        setToast({
          message: 'Please provide a reason for declining request',
          type: 'error',
        });
        return;
      }

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/refill-requests/${selectedRequest.refill_id}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: currentUser.user_id,
          reason: declineReason
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Refill request declined successfully',
          type: 'success',
        });
        setShowDeclineModal(false);
        setSelectedRequest(null);
        setDeclineReason('');
        fetchRefillRequests();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error declining refill request:', error);
      setToast({
        message: 'Failed to decline refill request: ' + error.message,
        type: 'error',
      });
    }
  };

  // Fixed function names to avoid conflicts with state variables
  const openRefillModal = (medication) => {
    setSelectedMedication(medication);
    setRefillForm({
      ...refillForm,
      medication_id: medication.medication_id
    });
    setShowRefillModal(true);
  };

  const openApproveModal = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const openDeclineModal = (request) => {
    setSelectedRequest(request);
    setShowDeclineModal(true);
  };

  const toggleRequestExpansion = (requestId) => {
    setExpandedRequests(prev => ({
      ...prev,
      [requestId]: !prev[requestId]
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', icon: '⏳', text: 'Pending' },
      approved: { color: '#17a2b8', icon: '✓', text: 'Approved' },
      ready: { color: '#28a745', icon: '📦', text: 'Ready for Pickup' },
      dispensed: { color: '#6f42c1', icon: '💊', text: 'Dispensed' },
      declined: { color: '#dc3545', icon: '❌', text: 'Declined' },
      cancelled: { color: '#6c757d', icon: '🚫', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span 
        className="badge" 
        style={{
          backgroundColor: config.color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  const getAdherenceBadge = (adherence) => {
    if (adherence >= 95) {
      return <span style={{ color: '#28a745', fontWeight: '600' }}>{adherence}% ✓</span>;
    } else if (adherence >= 80) {
      return <span style={{ color: '#ffc107', fontWeight: '600' }}>{adherence}% ⚠️</span>;
    } else {
      return <span style={{ color: '#dc3545', fontWeight: '600' }}>{adherence}% ⚠️</span>;
    }
  };

  // Filter functions
  useEffect(() => {
    const filtered = myMedications.filter((med) => {
      const matchesSearch =
        med.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.strength?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
    
    setFilteredMedications(filtered);
  }, [myMedications, searchTerm]);

  useEffect(() => {
    const requests = currentUser && currentUser.role === 'case manager' ? refillRequests : myRefillRequests;
    const filtered = requests.filter(request => {
      if (currentUser && currentUser.role === 'case manager') {
        const patientName = `${request.first_name} ${request.last_name}`.toLowerCase();
        const medicationName = request.medication_name.toLowerCase();
        const facilityName = request.facility_name.toLowerCase();
        
        const matchesSearch = 
          patientName.includes(searchTerm.toLowerCase()) ||
          medicationName.includes(searchTerm.toLowerCase()) ||
          facilityName.includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      } else {
        const medicationName = request.medication_name.toLowerCase();
        const facilityName = request.facility_name.toLowerCase();
        
        const matchesSearch = 
          medicationName.includes(searchTerm.toLowerCase()) ||
          facilityName.includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      }
    });
    
    if (currentUser && currentUser.role === 'case manager') {
      setFilteredRequests(filtered);
    } else {
      setFilteredMyRequests(filtered);
    }
  }, [refillRequests, myRefillRequests, searchTerm, currentUser]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '30px',
          background: 'linear-gradient(to right, #D84040, #A31D1D)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
              💊 My Medications
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              {activeTab === 'medications' 
                ? 'View your current medications and refill requests' 
                : currentUser && currentUser.role === 'case manager'
                ? 'Review and manage patient medication refill requests'
                : 'Submit and track your medication refill requests'}
            </p>
          </div>
          {activeTab === 'refills' && currentUser && currentUser.role === 'case manager' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {pendingCount > 0 && (
                <span 
                  className="badge" 
                  style={{
                    backgroundColor: '#ffc107',
                    color: '#212529',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {pendingCount} Pending
                </span>
              )}
              {readyCount > 0 && (
                <span 
                  className="badge" 
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                  }}
                >
                  {readyCount} Ready
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6' }}>
          <button
            onClick={() => setActiveTab('medications')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'medications' ? '3px solid #D84040' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'medications' ? '600' : '400',
              color: activeTab === 'medications' ? '#D84040' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Pill size={18} />
            My Medications
          </button>
          <button
            onClick={() => setActiveTab('refills')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'refills' ? '3px solid #D84040' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'refills' ? '600' : '400',
              color: activeTab === 'refills' ? '#D84040' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative',
            }}
          >
            <Package size={18} />
            Refill Requests
            {currentUser && currentUser.role === 'case manager' && pendingCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'medications' ? (
        <>
          {/* Search */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                }}
              />
              <input
                type="text"
                placeholder="Search your medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>

          {/* Patient's Medications List */}
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {filteredMedications.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                No medications found
              </div>
            ) : (
              filteredMedications.map((med) => (
                <div
                  key={med.medication_id}
                  className="patient-card"
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '18px' }}>
                        {med.medication_name}
                      </h3>
                      {med.is_art && (
                        <span style={{ 
                          padding: '4px 8px', 
                          backgroundColor: '#e3f2fd', 
                          color: '#1565c0', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          ART
                        </span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <span>💊 {med.generic_name || med.medication_name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <span>💊 {med.strength}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <span>💊 {med.form}</span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <Calendar size={16} />
                        <span>Next Refill: {med.prescription?.next_refill || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <FileText size={16} />
                        <span>{med.prescription?.dosage || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => openRefillModal(med)}
                    style={{
                      padding: '8px 16px',
                      background: '#D84040',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Package size={16} />
                    Request Refill
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Refill Requests Tab - Different views for patients and case managers */
        <>
          {/* Search and Filter */}
          <div
            style={{
              display: 'flex',
              gap: '15px',
              marginBottom: '20px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
              <Search
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                }}
              />
              <input
                type="text"
                placeholder={currentUser && currentUser.role === 'case manager' ? "Search by patient name..." : "Search your refill requests..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            {currentUser && currentUser.role === 'case manager' && (
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  fetchRefillRequests();
                }}
                style={{
                  padding: '12px 16px',
                  border: '1px solid #ced4da',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="ready">Ready for Pickup</option>
                <option value="dispensed">Dispensed</option>
                <option value="declined">Declined</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}
          </div>

          {/* Refill Requests List */}
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden',
            }}
          >
            {(currentUser && currentUser.role === 'case manager' ? filteredRequests : filteredMyRequests).length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                {currentUser && currentUser.role === 'case manager' 
                  ? 'No refill requests found' 
                  : 'No refill requests found. Click "Request Refill" on your medications to submit a new request.'}
              </div>
            ) : (
              (currentUser && currentUser.role === 'case manager' ? filteredRequests : filteredMyRequests).map((request) => (
                <div
                  key={request.refill_id}
                  className="patient-card request-card"
                  style={{
                    padding: '20px',
                    borderBottom: '1px solid #e9ecef',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      {currentUser && currentUser.role === 'case manager' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '18px' }}>
                            {request.first_name} {request.last_name}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <Pill size={16} />
                          <span>{request.medication_name} {request.strength && `(${request.strength})`}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <Package size={16} />
                          <span>{request.quantity} {request.form}s</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <Calendar size={16} />
                          <span>Pickup: {new Date(request.pickup_date).toLocaleDateString()}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <MapPin size={16} />
                          <span>{request.facility_name}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6c757d', fontSize: '14px' }}>
                        <Clock size={16} />
                        <span>Submitted: {new Date(request.submitted_at).toLocaleString()}</span>
                      </div>
                      
                      {request.notes && (
                        <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#6c757d' }}>
                          "{request.notes}"
                        </div>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {currentUser && currentUser.role === 'case manager' && (
                        <>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: '#f8f9fa',
                              color: '#495057',
                              border: '1px solid #dee2e6',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                            }}
                            onClick={() => toggleRequestExpansion(request.refill_id)}
                          >
                            {expandedRequests[request.refill_id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            Details
                          </button>
                          
                          {request.status === 'pending' && (
                            <>
                              <button
                                style={{
                                  padding: '8px 12px',
                                  background: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                onClick={() => openApproveModal(request)}
                              >
                                <CheckCircle size={16} />
                                Approve
                              </button>
                              <button
                                style={{
                                  padding: '8px 12px',
                                  background: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                                onClick={() => openDeclineModal(request)}
                              >
                                <XCircle size={16} />
                                Decline
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {currentUser && currentUser.role === 'case manager' && expandedRequests[request.refill_id] && (
                    <div style={{ 
                      padding: '15px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px',
                      marginTop: '10px'
                    }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#495057' }}>
                        📊 Pill Count & Eligibility:
                      </h4>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <span>🔢 Remaining:</span>
                          <strong>Not reported</strong>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <span>Last Pickup:</span>
                          <strong>{request.lastPickup ? new Date(request.lastPickup).toLocaleDateString() : 'N/A'}</strong>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <span>Adherence:</span>
                          {getAdherenceBadge(request.adherence || 0)}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                        <span>Rx Valid:</span>
                        <strong>⚠️ Check</strong>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Refill Request Modal for Patients */}
      {showRefillModal && (
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
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Request Medication Refill</h3>
              <button
                onClick={() => {
                  setShowRefillModal(false);
                  setSelectedMedication(null);
                  setRefillForm({
                    medication_id: '',
                    quantity: '',
                    pickup_date: '',
                    facility_id: '',
                    notes: ''
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Medication *
                </label>
                <input
                  type="text"
                  value={selectedMedication?.medication_name || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={refillForm.quantity}
                    onChange={(e) => setRefillForm({ ...refillForm, quantity: e.target.value })}
                    placeholder="e.g., 30"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Pickup Date *
                  </label>
                  <input
                    type="date"
                    value={refillForm.pickup_date}
                    onChange={(e) => setRefillForm({ ...refillForm, pickup_date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Pickup Facility *
                </label>
                <select
                  value={refillForm.facility_id}
                  onChange={(e) => setRefillForm({ ...refillForm, facility_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select a facility</option>
                  <option value="1">My Hub Cares Ortigas Main</option>
                  <option value="2">My Hub Cares Pasay</option>
                  <option value="3">My Hub Cares Alabang</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Notes
                </label>
                <textarea
                  value={refillForm.notes}
                  onChange={(e) => setRefillForm({ ...refillForm, notes: e.target.value })}
                  placeholder="Any additional notes or special instructions..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowRefillModal(false);
                  setSelectedMedication(null);
                  setRefillForm({
                    medication_id: '',
                    quantity: '',
                    pickup_date: '',
                    facility_id: '',
                    notes: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRefillRequest}
                style={{
                  padding: '10px 20px',
                  background: '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal - Only for Case Managers */}
      {showApproveModal && selectedRequest && (
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
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Approve Refill Request</h3>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setApproveNotes('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 15px 0', color: '#495057' }}>
                Are you sure you want to approve this refill request?
              </p>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Patient:</strong> {selectedRequest.first_name} {selectedRequest.last_name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Medication:</strong> {selectedRequest.medication_name} {selectedRequest.strength && `(${selectedRequest.strength})`}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Quantity:</strong> {selectedRequest.quantity} {selectedRequest.form}s
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Pickup Date:</strong> {new Date(selectedRequest.pickup_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Facility:</strong> {selectedRequest.facility_name}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Notes (optional)
                </label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  placeholder="Add any notes for this approval..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setApproveNotes('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleApproveRequest}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Approve Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal - Only for Case Managers */}
      {showDeclineModal && selectedRequest && (
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
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Decline Refill Request</h3>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedRequest(null);
                  setDeclineReason('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 15px 0', color: '#495057' }}>
                Are you sure you want to decline this refill request?
              </p>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Patient:</strong> {selectedRequest.first_name} {selectedRequest.last_name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Medication:</strong> {selectedRequest.medication_name} {selectedRequest.strength && `(${selectedRequest.strength})`}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Quantity:</strong> {selectedRequest.quantity} {selectedRequest.form}s
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Pickup Date:</strong> {new Date(selectedRequest.pickup_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Facility:</strong> {selectedRequest.facility_name}
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Reason for Decline <span style={{ color: '#dc3545' }}>*</span>
                </label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Please provide a reason for declining this request..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setSelectedRequest(null);
                  setDeclineReason('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineRequest}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Decline Request
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
            backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545',
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

export default Medications;