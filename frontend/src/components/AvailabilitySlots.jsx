import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const AvailabilitySlots = ({ socket }) => {
    const [slots, setSlots] = useState([]);
    const [filteredSlots, setFilteredSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    
    // Filters
    const [facilities, setFacilities] = useState([]);
    const [providers, setProviders] = useState([]);
    const [filters, setFilters] = useState({
        facility_id: '',
        provider_id: '',
        date: '',
        status: '',
        date_from: '',
        date_to: ''
    });

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        fetchFacilities();
        fetchProviders();
    }, []);

    // Fetch slots when component mounts or when backend filters change
    useEffect(() => {
        fetchSlots();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.facility_id, filters.provider_id, filters.date, filters.date_from, filters.date_to, filters.status]);

    // Apply client-side filters (search term only, status is handled by backend)
    useEffect(() => {
        applyFilters();
    }, [slots, searchTerm]);

    // Listen for real-time appointment updates to refresh slots
    useEffect(() => {
        if (socket) {
            // Listen for new appointments being created
            const handleNewNotification = (data) => {
                // Check if it's an appointment-related notification
                if (data.type === 'appointment_created' || 
                    data.type === 'appointment_slot_confirmed' || 
                    data.type === 'appointment_request_approved' ||
                    data.appointment_id) {
                    console.log('Appointment change detected, refreshing availability slots...');
                    // Refresh slots to show updated booking status
                    fetchSlots();
                }
            };

            // Listen for appointment updates
            const handleAppointmentUpdated = (data) => {
                console.log('Appointment updated, refreshing availability slots...');
                fetchSlots();
            };

            // Listen for appointment cancellations
            const handleAppointmentCancelled = (data) => {
                console.log('Appointment cancelled, refreshing availability slots...');
                fetchSlots();
            };

            socket.on('newNotification', handleNewNotification);
            socket.on('appointmentUpdated', handleAppointmentUpdated);
            socket.on('appointmentCancelled', handleAppointmentCancelled);

            return () => {
                socket.off('newNotification', handleNewNotification);
                socket.off('appointmentUpdated', handleAppointmentUpdated);
                socket.off('appointmentCancelled', handleAppointmentCancelled);
            };
        }
    }, [socket]);

    // Periodic refresh every 30 seconds as fallback
    useEffect(() => {
        const interval = setInterval(() => {
            fetchSlots();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Helper function to check if slot is expired
    const isSlotExpired = (slot) => {
        if (!slot.slot_date || !slot.end_time) return false;
        const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);
        return slotEnd < new Date();
    };

    // Helper function to determine actual status of a slot
    const getActualStatus = (slot) => {
        // Determine actual status based on slot data
        // Priority: booked > locked > blocked > unavailable > expired > available
        if (slot.appointment_id || slot.slot_status === 'booked') {
            return 'booked';
        }
        if (slot.slot_status === 'locked' || slot.lock_status) {
            return 'locked';
        }
        if (slot.slot_status === 'blocked') {
            return 'blocked';
        }
        if (slot.slot_status === 'unavailable') {
            return 'unavailable';
        }
        if (isSlotExpired(slot) && slot.slot_status === 'available') {
            return 'expired';
        }
        return slot.slot_status || 'available';
    };

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (filters.facility_id) params.append('facility_id', filters.facility_id);
            if (filters.provider_id) params.append('provider_id', filters.provider_id);
            
            // Only apply date filters if explicitly set by user
            if (filters.date) {
                params.append('date', filters.date);
            } else if (filters.date_from || filters.date_to) {
                // Only use date range if explicitly set
                if (filters.date_from) params.append('date_from', filters.date_from);
                if (filters.date_to) params.append('date_to', filters.date_to);
            }
            // If no date filters are set, fetch all slots (no date restriction)
            
            if (filters.status) params.append('status', filters.status);
            
            // Only fetch slots that have assignment_id (generated from doctor assignments)
            // This ensures we only show slots created from DoctorAssignments component
            params.append('has_assignment', 'true');

            const url = `${API_BASE_URL}/appointments/availability/slots?${params}`;
            console.log('Fetching availability slots from doctor assignments:', url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            console.log('Availability slots response:', { success: data.success, count: data.data?.length || 0 });
            
            if (data.success) {
                const slotsData = data.data || [];
                // Backend now filters by assignment_id, but keep client-side filter as safety
                const assignmentSlots = slotsData.filter(slot => slot.assignment_id);
                console.log('Fetched slots from doctor assignments:', assignmentSlots.length, 'slots');
                setSlots(assignmentSlots);
            } else {
                throw new Error(data.message || 'Failed to fetch slots');
            }
        } catch (error) {
            console.error('Error fetching slots:', error);
            showToast('Failed to fetch availability slots: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchFacilities = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/facilities`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setFacilities(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching facilities:', error);
        }
    };

    const fetchProviders = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/users/providers`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.providers) {
                    setProviders(data.providers);
                }
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...slots];
        console.log('Applying filters to', filtered.length, 'slots');

        // Only filter by date if a specific date filter is set
        // Otherwise, show all slots (including past dates for management purposes)
        if (filters.date) {
            filtered = filtered.filter(slot => {
                if (!slot.slot_date) return false;
                return slot.slot_date === filters.date;
            });
        } else if (filters.date_from || filters.date_to) {
            // If date range is set, filter by range
            filtered = filtered.filter(slot => {
                if (!slot.slot_date) return false;
                const slotDate = new Date(slot.slot_date);
                slotDate.setHours(0, 0, 0, 0);
                
                if (filters.date_from) {
                    const fromDate = new Date(filters.date_from);
                    fromDate.setHours(0, 0, 0, 0);
                    if (slotDate < fromDate) return false;
                }
                
                if (filters.date_to) {
                    const toDate = new Date(filters.date_to);
                    toDate.setHours(0, 0, 0, 0);
                    if (slotDate > toDate) return false;
                }
                
                return true;
            });
        }
        // If no date filters are set, show all slots

        // Status filter is now handled by backend, but keep client-side as fallback
        // (in case backend doesn't support it or for additional filtering)
        if (filters.status) {
            filtered = filtered.filter(slot => slot.slot_status === filters.status);
        }

        // Apply search term filter (client-side only)
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = filtered.filter(slot => {
                const facilityMatch = slot.facility_name?.toLowerCase().includes(searchLower);
                const providerMatch = slot.provider_name?.toLowerCase().includes(searchLower);
                const dateMatch = slot.slot_date?.toLowerCase().includes(searchLower);
                const timeMatch = `${slot.start_time} ${slot.end_time}`.toLowerCase().includes(searchLower);
                return facilityMatch || providerMatch || dateMatch || timeMatch;
            });
        }

        console.log('Filtered slots:', filtered.length);
        setFilteredSlots(filtered);
    };



    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return '#28a745';
            case 'booked':
                return '#007bff';
            case 'blocked':
                return '#dc3545';
            case 'unavailable':
                return '#6c757d';
            case 'locked':
                return '#ffc107';
            case 'expired':
                return '#6c757d';
            default:
                return '#6c757d';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'available':
                return <CheckCircle size={16} color="#28a745" />;
            case 'booked':
                return <Clock size={16} color="#007bff" />;
            case 'blocked':
                return <XCircle size={16} color="#dc3545" />;
            case 'unavailable':
                return <AlertCircle size={16} color="#6c757d" />;
            case 'locked':
                return <AlertCircle size={16} color="#ffc107" />;
            case 'expired':
                return <AlertCircle size={16} color="#6c757d" />;
            default:
                return <AlertCircle size={16} color="#6c757d" />;
        }
    };

    const formatTime = (time) => {
        if (!time) return 'N/A';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    return (
        <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
            {/* Header with Title */}
            <div style={{ 
                marginBottom: '30px', 
                background: 'linear-gradient(to right, #D84040, #A31D1D)', 
                padding: '30px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                            Availability Slots Management
                        </h2>
                        <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
                            Manage provider availability slots and accept appointments
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <p style={{ margin: 0, color: '#F8F2DE', fontSize: '14px', fontStyle: 'italic' }}>
                            Slots are automatically generated from Doctor Assignments
                        </p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                        size={18}
                        color="#A31D1D"
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search availability slots..."
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
                        color="#A31D1D"
                        style={{
                            position: 'absolute',
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                        }}
                    />
                    <select
                        value={filters.status}
                        onChange={(e) => {
                            setFilters({ ...filters, status: e.target.value });
                        }}
                        style={{
                            padding: '8px 12px 8px 36px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            appearance: 'none',
                        }}
                    >
                        <option value="">All Statuses</option>
                        <option value="available">Available</option>
                        <option value="booked">Booked</option>
                        <option value="blocked">Blocked</option>
                        <option value="unavailable">Unavailable</option>
                        <option value="locked">Locked</option>
                    </select>
                </div>
            </div>

            {/* Additional Filters */}
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Facility
                        </label>
                        <select
                            value={filters.facility_id}
                            onChange={(e) => {
                                setFilters({ ...filters, facility_id: e.target.value });
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">All Facilities</option>
                            {facilities.map(f => (
                                <option key={f.facility_id} value={f.facility_id}>
                                    {f.facility_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Provider
                        </label>
                        <select
                            value={filters.provider_id}
                            onChange={(e) => {
                                setFilters({ ...filters, provider_id: e.target.value });
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">All Providers</option>
                            {providers.map(p => (
                                <option key={p.user_id} value={p.user_id}>
                                    {p.full_name || p.username}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Date
                        </label>
                        <input
                            type="date"
                            value={filters.date}
                            onChange={(e) => {
                                setFilters({ ...filters, date: e.target.value });
                            }}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Slots List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <Loader2 size={32} className="animate-spin" style={{ color: '#A31D1D' }} />
                    <p style={{ marginTop: '10px', color: '#6c757d' }}>Loading availability slots...</p>
                </div>
            ) : filteredSlots.length === 0 ? (
                <div style={{
                    background: 'white',
                    padding: '40px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    color: '#6c757d'
                }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 20px', opacity: 0.5 }} />
                    <p>No availability slots found</p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                    gap: '20px'
                }}>
                    {filteredSlots.map(slot => {
                        const actualStatus = getActualStatus(slot);
                        const expired = isSlotExpired(slot);

                        return (
                            <div
                                key={slot.slot_id}
                                style={{
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    border: `2px solid ${getStatusColor(actualStatus)}`,
                                    transition: 'transform 0.2s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                }}
                            >
                                {/* Status Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: getStatusColor(actualStatus) + '20',
                                    color: getStatusColor(actualStatus),
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {getStatusIcon(actualStatus)}
                                    {actualStatus.toUpperCase()}
                                </div>

                                {/* Slot Info */}
                                <div style={{ marginBottom: '15px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '18px' }}>
                                        {formatDate(slot.slot_date)}
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#6c757d' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={16} />
                                            <span>{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                                        </div>
                                        {slot.facility_name && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <MapPin size={16} />
                                                <span>{slot.facility_name}</span>
                                            </div>
                                        )}
                                        {slot.provider_name && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <User size={16} />
                                                <span>{slot.provider_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Appointment Info (if booked) */}
                                {slot.appointment_id && (
                                    <div style={{
                                        padding: '10px',
                                        background: '#f8f9fa',
                                        borderRadius: '4px',
                                        marginBottom: '15px',
                                        fontSize: '13px'
                                    }}>
                                        <strong>Appointment ID:</strong> {slot.appointment_id.substring(0, 8)}...
                                    </div>
                                )}

                                {/* Expired Warning */}
                                {expired && (
                                    <div style={{
                                        padding: '8px',
                                        background: '#fff3cd',
                                        borderRadius: '4px',
                                        marginBottom: '15px',
                                        fontSize: '12px',
                                        color: '#856404'
                                    }}>
                                        <AlertCircle size={14} style={{ display: 'inline', marginRight: '5px' }} />
                                        This slot has expired
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {/* Show status badge based on actual status */}
                                    {actualStatus === 'booked' && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: '#007bff',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px'
                                        }}>
                                            <CheckCircle size={16} />
                                            Booked
                                        </div>
                                    )}
                                    
                                    {actualStatus === 'available' && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: '#28a745',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '5px'
                                        }}>
                                            <CheckCircle size={16} />
                                            Available
                                        </div>
                                    )}
                                    
                                    {actualStatus === 'expired' && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            textAlign: 'center'
                                        }}>
                                            Expired
                                        </div>
                                    )}
                                    
                                    {actualStatus === 'locked' && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: '#ffc107',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            textTransform: 'capitalize'
                                        }}>
                                            Locked
                                        </div>
                                    )}
                                    
                                    {(actualStatus === 'blocked' || actualStatus === 'unavailable') && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: actualStatus === 'blocked' ? '#dc3545' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            textTransform: 'capitalize'
                                        }}>
                                            {actualStatus}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Slots are read-only - created from Doctor Assignments */}
            {/* All CRUD operations removed - slots are generated automatically from DoctorAssignments */}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: toast.type === 'success' ? '#28a745' : '#dc3545',
                    color: 'white',
                    padding: '16px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minWidth: '300px',
                    zIndex: 9999,
                    animation: 'slideIn 0.3s ease'
                }}>
                    {toast.type === 'success' ? (
                        <CheckCircle size={20} />
                    ) : (
                        <XCircle size={20} />
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
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default AvailabilitySlots;

