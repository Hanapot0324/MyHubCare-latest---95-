// RefillRequests.jsx
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
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const RefillRequests = ({ socket }) => {
  const [refillRequests, setRefillRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedRequests, setExpandedRequests] = useState({});
  const [pendingCount, setPendingCount] = useState(0);

  const [declineReason, setDeclineReason] = useState('');
  const [approveNotes, setApproveNotes] = useState('');

  useEffect(() => {
    fetchRefillRequests();
  }, [statusFilter]);

  useEffect(() => {
    // Filter requests based on search term
    const filtered = refillRequests.filter(request => {
      const patientName = `${request.first_name} ${request.last_name}`.toLowerCase();
      const medicationName = request.medication_name.toLowerCase();
      const facilityName = request.facility_name.toLowerCase();
      
      const matchesSearch = 
        patientName.includes(searchTerm.toLowerCase()) ||
        medicationName.includes(searchTerm.toLowerCase()) ||
        facilityName.includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredRequests(filtered);
  }, [refillRequests, searchTerm]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchRefillRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/refill-requests?status=${statusFilter}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setRefillRequests(data.data);
        
        // Count pending requests
        if (statusFilter === 'pending') {
          setPendingCount(data.data.length);
        } else {
          // If not filtering by pending, get the count separately
          const pendingResponse = await fetch(`${API_BASE_URL}/refill-requests?status=pending`, {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });
          const pendingData = await pendingResponse.json();
          if (pendingData.success) {
            setPendingCount(pendingData.data.length);
          }
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
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${API_BASE_URL}/refill-requests/${selectedRequest.refill_id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user.user_id,
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
          message: 'Please provide a reason for declining the request',
          type: 'error',
        });
        return;
      }

      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const response = await fetch(`${API_BASE_URL}/refill-requests/${selectedRequest.refill_id}/decline`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          user_id: user.user_id,
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

  // Renamed function to avoid conflict with state variable
  const openApproveModal = (request) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  // Renamed function to avoid conflict with state variable
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

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}>
        <p>Loading refill requests...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
      {/* Header */}
      <div
        style={{
          marginBottom: '30px',
          background: 'linear-gradient(to right, #2563eb, #1e40af)',
          padding: '30px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2)',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', fontWeight: 'bold' }}>
              💊 Medication Refill Requests
            </h2>
            <p style={{ margin: 0, fontSize: '16px' }}>
              Review and manage patient medication refill requests
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          </div>
        </div>
      </div>

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
            placeholder="Search by patient name..."
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
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
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
        {filteredRequests.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            No refill requests found
          </div>
        ) : (
          filteredRequests.map((request) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>
                      {request.first_name} {request.last_name}
                    </h3>
                    {getStatusBadge(request.status)}
                  </div>
                  
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
                        // Updated function call
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
                        // Updated function call
                        onClick={() => openDeclineModal(request)}
                      >
                        <XCircle size={16} />
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {expandedRequests[request.refill_id] && (
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

      {/* Approve Modal */}
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

      {/* Decline Modal */}
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

export default RefillRequests;