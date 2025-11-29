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
  const [approvedQuantity, setApprovedQuantity] = useState('');
  const [readyForPickupDate, setReadyForPickupDate] = useState('');

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
          review_notes: approveNotes,
          approved_quantity: approvedQuantity ? parseInt(approvedQuantity) : selectedRequest.quantity,
          ready_for_pickup_date: readyForPickupDate || selectedRequest.pickup_date
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
        setApprovedQuantity('');
        setReadyForPickupDate('');
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
          decline_reason: declineReason,
          review_notes: approveNotes // Optional review notes
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
    <div style={{ padding: '20px', paddingTop: '100px', backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(to right, #D84040, #A31D1D)',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
            💊 Medication Refill Requests
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#F8F2DE', fontSize: '14px' }}>
            Review and manage patient medication refill requests
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span 
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

      {/* Search and Filter */}
      <div style={{ marginBottom: '20px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
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
              placeholder="Search by patient name, medication, or facility..."
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
              minWidth: '200px',
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
            <Package size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
            <p>No refill requests found</p>
          </div>
        ) : (
          filteredRequests.map((request) => (
            <div
              key={request.refill_id}
              style={{
                padding: '20px',
                borderBottom: '1px solid #e9ecef',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                background: 'white',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {/* Workflow Visualization */}
                  <div style={{ 
                    marginBottom: '15px', 
                    padding: '12px', 
                    background: '#F8F2DE', 
                    borderRadius: '8px',
                    border: '1px solid #ECDCBF'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      {['pending', 'approved', 'ready', 'dispensed'].map((status, index) => {
                        const isActive = ['pending', 'approved', 'ready', 'dispensed'].indexOf(request.status) >= index;
                        const isCurrent = request.status === status;
                        return (
                          <React.Fragment key={status}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px',
                              flex: 1,
                              minWidth: '120px'
                            }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isActive ? (isCurrent ? '#D84040' : '#28a745') : '#dee2e6',
                                color: isActive ? 'white' : '#6c757d',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                border: isCurrent ? '3px solid #A31D1D' : 'none',
                                boxShadow: isCurrent ? '0 0 0 3px rgba(216, 64, 64, 0.2)' : 'none',
                              }}>
                                {isActive ? (isCurrent ? '✓' : '✓') : index + 1}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ 
                                  fontSize: '12px', 
                                  fontWeight: isCurrent ? 'bold' : 'normal',
                                  color: isActive ? (isCurrent ? '#D84040' : '#28a745') : '#6c757d'
                                }}>
                                  {status === 'pending' ? 'Submitted' : 
                                   status === 'approved' ? 'Approved' :
                                   status === 'ready' ? 'Ready' : 'Dispensed'}
                                </div>
                                {isCurrent && request.status === 'pending' && (
                                  <div style={{ fontSize: '10px', color: '#6c757d' }}>
                                    {new Date(request.submitted_at).toLocaleDateString()}
                                  </div>
                                )}
                                {isCurrent && request.status === 'approved' && request.processed_at && (
                                  <div style={{ fontSize: '10px', color: '#6c757d' }}>
                                    {new Date(request.processed_at).toLocaleDateString()}
                                  </div>
                                )}
                                {isCurrent && request.status === 'ready' && request.ready_for_pickup_date && (
                                  <div style={{ fontSize: '10px', color: '#6c757d' }}>
                                    {new Date(request.ready_for_pickup_date).toLocaleDateString()}
                                  </div>
                                )}
                                {isCurrent && request.status === 'dispensed' && request.dispensed_at && (
                                  <div style={{ fontSize: '10px', color: '#6c757d' }}>
                                    {new Date(request.dispensed_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            {index < 3 && (
                              <div style={{
                                width: '20px',
                                height: '2px',
                                background: isActive && request.status !== status ? '#28a745' : '#dee2e6',
                                margin: '0 5px',
                                flex: '0 0 20px'
                              }} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#A31D1D' }}>
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
                  
                  {request.patient_notes && (
                    <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#6c757d' }}>
                      "{request.patient_notes}"
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    style={{
                      padding: '8px 12px',
                      background: '#ECDCBF',
                      color: '#A31D1D',
                      border: '1px solid #ECDCBF',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 500,
                    }}
                    onClick={() => toggleRequestExpansion(request.refill_id)}
                    onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                    onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
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
                          fontWeight: 500,
                        }}
                        onClick={() => openApproveModal(request)}
                        onMouseEnter={(e) => (e.target.style.background = '#218838')}
                        onMouseLeave={(e) => (e.target.style.background = '#28a745')}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        style={{
                          padding: '8px 12px',
                          background: '#D84040',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                        }}
                        onClick={() => openDeclineModal(request)}
                        onMouseEnter={(e) => (e.target.style.background = '#A31D1D')}
                        onMouseLeave={(e) => (e.target.style.background = '#D84040')}
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
                  backgroundColor: '#F8F2DE', 
                  borderRadius: '8px',
                  marginTop: '10px',
                  border: '1px solid #ECDCBF'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#A31D1D', fontWeight: '600' }}>
                    📊 Pill Count & Eligibility:
                  </h4>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <span>🔢 Remaining Pills:</span>
                      <strong>{request.remaining_pill_count !== null && request.remaining_pill_count !== undefined ? request.remaining_pill_count : 'Not reported'}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <span>📊 Pill Status:</span>
                      <strong style={{
                        color: request.pill_status === 'kulang' ? '#dc3545' : 
                               request.pill_status === 'sobra' ? '#ffc107' : '#28a745'
                      }}>
                        {request.pill_status ? request.pill_status.toUpperCase() : 'N/A'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                      <span>✅ Eligible:</span>
                      <strong style={{ color: request.is_eligible_for_refill ? '#28a745' : '#dc3545' }}>
                        {request.is_eligible_for_refill ? 'Yes' : 'No'}
                      </strong>
                    </div>
                  </div>
                  
                  {request.kulang_explanation && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#fff3cd', 
                      borderRadius: '4px',
                      marginBottom: '10px',
                      border: '1px solid #ffc107'
                    }}>
                      <strong style={{ color: '#A31D1D' }}>Explanation:</strong> {request.kulang_explanation}
                    </div>
                  )}
                  
                  {request.approved_quantity && request.approved_quantity !== request.quantity && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#d1ecf1', 
                      borderRadius: '4px',
                      marginBottom: '10px',
                      border: '1px solid #17a2b8'
                    }}>
                      <strong style={{ color: '#A31D1D' }}>Approved Quantity:</strong> {request.approved_quantity} {request.unit || 'units'} 
                      (Requested: {request.quantity} {request.unit || 'units'})
                    </div>
                  )}
                  
                  {request.ready_for_pickup_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057', marginBottom: '10px' }}>
                      <Calendar size={16} />
                      <span><strong>Ready for Pickup:</strong> {new Date(request.ready_for_pickup_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {request.review_notes && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#e7f3ff', 
                      borderRadius: '4px',
                      marginBottom: '10px',
                      border: '1px solid #17a2b8'
                    }}>
                      <strong style={{ color: '#A31D1D' }}>Review Notes:</strong> {request.review_notes}
                    </div>
                  )}
                  
                  {request.decline_reason && (
                    <div style={{ 
                      padding: '10px', 
                      backgroundColor: '#f8d7da', 
                      borderRadius: '4px',
                      marginBottom: '10px',
                      border: '1px solid #D84040'
                    }}>
                      <strong style={{ color: '#A31D1D' }}>Decline Reason:</strong> {request.decline_reason}
                    </div>
                  )}
                  
                  {request.dispensed_by && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057', marginBottom: '10px' }}>
                      <span>💊 Dispensed by:</span>
                      <strong>{request.dispensed_by_name || 'N/A'}</strong>
                      {request.dispensed_at && (
                        <span style={{ marginLeft: '10px' }}>
                          on {new Date(request.dispensed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                  
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
              <h3 style={{ margin: 0, fontSize: '20px', color: '#A31D1D', fontWeight: 'bold' }}>Approve Refill Request</h3>
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedRequest(null);
                  setApproveNotes('');
                  setApprovedQuantity('');
                  setReadyForPickupDate('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} color="#A31D1D" />
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
                  <strong>Quantity Requested:</strong> {selectedRequest.quantity} {selectedRequest.unit || selectedRequest.form || 'units'}
                </div>
                {selectedRequest.remaining_pill_count !== null && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Remaining Pills:</strong> {selectedRequest.remaining_pill_count}
                    {selectedRequest.is_eligible_for_refill && (
                      <span style={{ color: '#28a745', marginLeft: '10px' }}>✅ Eligible</span>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: '10px' }}>
                  <strong>Preferred Pickup Date:</strong> {new Date(selectedRequest.pickup_date).toLocaleDateString()}
                  {selectedRequest.preferred_pickup_time && (
                    <span> at {selectedRequest.preferred_pickup_time}</span>
                  )}
                </div>
                <div>
                  <strong>Facility:</strong> {selectedRequest.facility_name}
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#A31D1D' }}>
                  Approved Quantity (optional)
                </label>
                <input
                  type="number"
                  value={approvedQuantity}
                  onChange={(e) => setApprovedQuantity(e.target.value)}
                  placeholder={`Default: ${selectedRequest.quantity}`}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Leave empty to approve requested quantity
                </small>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#A31D1D' }}>
                  Ready for Pickup Date (optional)
                </label>
                <input
                  type="date"
                  value={readyForPickupDate}
                  onChange={(e) => setReadyForPickupDate(e.target.value)}
                  min={selectedRequest.pickup_date}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
                <small style={{ color: '#6c757d', fontSize: '12px' }}>
                  Leave empty to use preferred pickup date
                </small>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#A31D1D' }}>
                  Review Notes (optional)
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
                  setApprovedQuantity('');
                  setReadyForPickupDate('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
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
                onMouseEnter={(e) => (e.target.style.background = '#218838')}
                onMouseLeave={(e) => (e.target.style.background = '#28a745')}
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
              <h3 style={{ margin: 0, fontSize: '20px', color: '#A31D1D', fontWeight: 'bold' }}>Decline Refill Request</h3>
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
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ margin: '0 0 15px 0', color: '#495057' }}>
                Are you sure you want to decline this refill request?
              </p>
              
              <div style={{ 
                padding: '15px', 
                backgroundColor: '#F8F2DE', 
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #ECDCBF'
              }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#A31D1D' }}>Patient:</strong> {selectedRequest.first_name} {selectedRequest.last_name}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#A31D1D' }}>Medication:</strong> {selectedRequest.medication_name} {selectedRequest.strength && `(${selectedRequest.strength})`}
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#A31D1D' }}>Quantity Requested:</strong> {selectedRequest.quantity} {selectedRequest.unit || selectedRequest.form || 'units'}
                </div>
                {selectedRequest.remaining_pill_count !== null && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong style={{ color: '#A31D1D' }}>Remaining Pills:</strong> {selectedRequest.remaining_pill_count}
                    {selectedRequest.pill_status && (
                      <span style={{ 
                        color: selectedRequest.pill_status === 'kulang' ? '#dc3545' : 
                               selectedRequest.pill_status === 'sobra' ? '#ffc107' : '#28a745',
                        marginLeft: '10px'
                      }}>
                        ({selectedRequest.pill_status.toUpperCase()})
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginBottom: '10px' }}>
                  <strong style={{ color: '#A31D1D' }}>Preferred Pickup Date:</strong> {new Date(selectedRequest.pickup_date).toLocaleDateString()}
                  {selectedRequest.preferred_pickup_time && (
                    <span> at {selectedRequest.preferred_pickup_time}</span>
                  )}
                </div>
                <div>
                  <strong style={{ color: '#A31D1D' }}>Facility:</strong> {selectedRequest.facility_name}
                </div>
              </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 'bold', color: '#A31D1D' }}>
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
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
                onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
              >
                Cancel
              </button>
              <button
                onClick={handleDeclineRequest}
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
                onMouseEnter={(e) => (e.target.style.background = '#A31D1D')}
                onMouseLeave={(e) => (e.target.style.background = '#D84040')}
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
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#A31D1D'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
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