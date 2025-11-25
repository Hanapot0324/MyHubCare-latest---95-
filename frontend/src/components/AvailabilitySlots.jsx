import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle, Loader2, Search, Filter, Plus, Edit, Trash2, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const AvailabilitySlots = ({ socket }) => {
    const [slots, setSlots] = useState([]);
    const [filteredSlots, setFilteredSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [createMode, setCreateMode] = useState('single'); // 'single' or 'bulk'
    const [createFormData, setCreateFormData] = useState({
        provider_id: '',
        facility_id: '',
        slot_date: '',
        start_time: '',
        end_time: '',
        slot_status: 'available'
    });
    const [bulkFormData, setBulkFormData] = useState({
        provider_id: '',
        facility_id: '',
        start_date: '',
        end_date: '',
        days_of_week: [], // ['Monday', 'Tuesday', etc.]
        slot_status: 'available',
        dayTimeSlots: {} // { 'Monday': [{start_time, end_time}, ...], 'Tuesday': [...], ... }
    });
    
    // Temporary state for adding time slots to a specific day
    const [tempTimeSlot, setTempTimeSlot] = useState({
        day: '',
        start_time: '',
        end_time: ''
    });

    // Helper function to format time to "10:00 A.M" format
    const formatTimeToAMPM = (time24) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours, 10);
        const min = minutes || '00';
        const period = hour >= 12 ? 'P.M' : 'A.M';
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        return `${hour12}:${min} ${period}`;
    };

    // Helper function to format time input with automatic colon insertion
    const formatTimeInput = (value) => {
        if (!value) return '';
        
        // Auto-format to "10:00:A.M to 5:00:P.M" format
        // Allow user to type naturally and auto-insert colons
        let formatted = value;
        
        // Auto-format pattern: HH:MM:A.M or HH:MM:P.M
        // Replace patterns like "1000AM" with "10:00:A.M"
        formatted = formatted.replace(/(\d{1,2})(\d{2})(A\.M|P\.M|AM|PM)/gi, (match, hour, min, period) => {
            const periodFormatted = period.toUpperCase().replace('AM', 'A.M').replace('PM', 'P.M');
            return `${hour}:${min}:${periodFormatted}`;
        });
        
        // Also handle "10:00 A.M" format and convert to "10:00:A.M"
        formatted = formatted.replace(/(\d{1,2}):(\d{2})\s+(A\.M|P\.M|AM|PM)/gi, (match, hour, min, period) => {
            const periodFormatted = period.toUpperCase().replace('AM', 'A.M').replace('PM', 'P.M');
            return `${hour}:${min}:${periodFormatted}`;
        });
        
        return formatted;
    };

    // Helper function to parse "10:00:A.M to 5:00:P.M" format to start_time and end_time
    const parseTimeRange = (timeRange) => {
        if (!timeRange) return { start_time: '', end_time: '' };
        
        // Support format: "10:00:A.M to 5:00:P.M" (with colon before A.M/P.M)
        const match = timeRange.match(/(\d{1,2}):(\d{2}):(A\.M|P\.M)\s+to\s+(\d{1,2}):(\d{2}):(A\.M|P\.M)/i);
        if (!match) {
            // Try alternative format without colon before A.M/P.M: "10:00 A.M to 5:00 P.M"
            const altMatch = timeRange.match(/(\d{1,2}):(\d{2})\s+(A\.M|P\.M)\s+to\s+(\d{1,2}):(\d{2})\s+(A\.M|P\.M)/i);
            if (altMatch) {
                const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = altMatch;
                const convertTo24Hour = (hour, min, period) => {
                    let hour24 = parseInt(hour, 10);
                    if (period.toUpperCase() === 'P.M' && hour24 !== 12) {
                        hour24 += 12;
                    } else if (period.toUpperCase() === 'A.M' && hour24 === 12) {
                        hour24 = 0;
                    }
                    return `${String(hour24).padStart(2, '0')}:${min}:00`;
                };
                return {
                    start_time: convertTo24Hour(startHour, startMin, startPeriod),
                    end_time: convertTo24Hour(endHour, endMin, endPeriod)
                };
            }
            return { start_time: '', end_time: '' };
        }
        
        const [, startHour, startMin, startPeriod, endHour, endMin, endPeriod] = match;
        
        const convertTo24Hour = (hour, min, period) => {
            let hour24 = parseInt(hour, 10);
            if (period.toUpperCase() === 'P.M' && hour24 !== 12) {
                hour24 += 12;
            } else if (period.toUpperCase() === 'A.M' && hour24 === 12) {
                hour24 = 0;
            }
            return `${String(hour24).padStart(2, '0')}:${min}:00`;
        };
        
        return {
            start_time: convertTo24Hour(startHour, startMin, startPeriod),
            end_time: convertTo24Hour(endHour, endMin, endPeriod)
        };
    };
    
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
        fetchAppointments();
        fetchSlots();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [slots, filters, searchTerm]);

    // Listen for real-time appointment updates to refresh slots
    useEffect(() => {
        if (socket) {
            // Listen for new appointments being created
            const handleNewNotification = (data) => {
                // Check if it's an appointment-related notification
                if (data.type === 'appointment_created' || data.type === 'appointment_slot_confirmed' || data.appointment_id) {
                    console.log('Appointment change detected, refreshing availability slots...');
                    // Refresh slots to show updated booking status
                    fetchSlots();
                    fetchAppointments();
                }
            };

            // Listen for appointment updates
            const handleAppointmentUpdated = (data) => {
                console.log('Appointment updated, refreshing availability slots...');
                fetchSlots();
                fetchAppointments();
            };

            // Listen for appointment cancellations
            const handleAppointmentCancelled = (data) => {
                console.log('Appointment cancelled, refreshing availability slots...');
                fetchSlots();
                fetchAppointments();
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

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const params = new URLSearchParams();
            if (filters.facility_id) params.append('facility_id', filters.facility_id);
            if (filters.provider_id) params.append('provider_id', filters.provider_id);
            if (filters.date) params.append('date', filters.date);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setSlots(data.data || []);
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

    const fetchAppointments = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Fetch appointments that can be assigned to slots:
            // - scheduled appointments (not yet assigned to a slot)
            // - confirmed appointments that don't have a slot_id yet
            // Exclude cancelled and no_show appointments
            const response = await fetch(`${API_BASE_URL}/appointments`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                // Filter to show only appointments that can be assigned to slots:
                // - status is 'scheduled' or 'confirmed'
                // - not cancelled or no_show
                const availableAppointments = (data.data || []).filter(apt => {
                    const isActive = apt.status === 'scheduled' || apt.status === 'confirmed';
                    const isNotCancelled = apt.status !== 'cancelled' && apt.status !== 'no_show';
                    return isActive && isNotCancelled;
                });
                setAppointments(availableAppointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...slots];

        if (filters.status) {
            filtered = filtered.filter(slot => slot.slot_status === filters.status);
        }

        // Apply search term filter
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

        setFilteredSlots(filtered);
    };

    const handleAcceptAppointment = async (slotId, appointmentId) => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots/${slotId}/accept-appointment`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ appointment_id: appointmentId })
            });

            const data = await response.json();

            if (data.success) {
                showToast('Appointment accepted into slot successfully', 'success');
                setShowAcceptModal(false);
                setSelectedSlot(null);
                setSelectedAppointment(null);
                fetchSlots();
                fetchAppointments();
            } else {
                // Handle different scenarios
                const scenario = data.scenario;
                let message = data.message || 'Failed to accept appointment';

                switch (scenario) {
                    case 'slot_already_booked':
                        message = `Slot is already booked by another appointment (ID: ${data.slot?.appointment_id})`;
                        break;
                    case 'slot_blocked':
                        message = 'Slot is blocked and cannot accept appointments';
                        break;
                    case 'slot_unavailable':
                        message = 'Slot is marked as unavailable';
                        break;
                    case 'slot_expired':
                        message = `Slot expired on ${data.slot?.slot_date} at ${data.slot?.end_time}`;
                        break;
                    case 'appointment_has_slot':
                        message = `Appointment is already assigned to slot ${data.existing_slot?.slot_id}`;
                        break;
                    case 'time_mismatch':
                        message = 'Appointment time does not match slot time range';
                        break;
                    case 'provider_mismatch':
                        message = 'Provider mismatch between slot and appointment';
                        break;
                    case 'facility_mismatch':
                        message = 'Facility mismatch between slot and appointment';
                        break;
                    case 'time_conflict':
                        message = `Time conflict detected. ${data.conflicts?.length || 0} conflicting appointment(s) found`;
                        break;
                    default:
                        message = data.message || 'Failed to accept appointment';
                }

                showToast(message, 'error');
            }
        } catch (error) {
            console.error('Error accepting appointment:', error);
            showToast('Failed to accept appointment: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAcceptModal = (slot) => {
        setSelectedSlot(slot);
        setShowAcceptModal(true);
    };

    const handleCreateSlot = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) return;

            if (createMode === 'single') {
                // Single slot creation
                if (!createFormData.provider_id || !createFormData.facility_id || 
                    !createFormData.slot_date || !createFormData.start_time || !createFormData.end_time) {
                    showToast('Please fill in all required fields', 'error');
                    setLoading(false);
                    return;
                }

                // Convert time input (HH:MM) to database format (HH:MM:SS)
                const start_time = `${createFormData.start_time}:00`;
                const end_time = `${createFormData.end_time}:00`;

                if (start_time >= end_time) {
                    showToast('End time must be after start time', 'error');
                    setLoading(false);
                    return;
                }

                const response = await fetch(`${API_BASE_URL}/appointments/availability/slots`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ...createFormData,
                        start_time,
                        end_time
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showToast('Availability slot created successfully', 'success');
                    setShowCreateModal(false);
                    setCreateFormData({
                        provider_id: '',
                        facility_id: '',
                        slot_date: '',
                        start_time: '',
                        end_time: '',
                        slot_status: 'available'
                    });
                    fetchSlots();
                } else {
                    throw new Error(data.message || 'Failed to create slot');
                }
            } else {
                // Bulk slot creation
                if (!bulkFormData.provider_id || !bulkFormData.facility_id || 
                    !bulkFormData.start_date || !bulkFormData.end_date || 
                    bulkFormData.days_of_week.length === 0) {
                    showToast('Please fill in all required fields for bulk creation', 'error');
                    setLoading(false);
                    return;
                }

                // Check if each selected day has at least one time slot
                const daysWithoutSlots = bulkFormData.days_of_week.filter(day => 
                    !bulkFormData.dayTimeSlots[day] || bulkFormData.dayTimeSlots[day].length === 0
                );
                
                if (daysWithoutSlots.length > 0) {
                    showToast(`Please add at least one time slot for: ${daysWithoutSlots.join(', ')}`, 'error');
                    setLoading(false);
                    return;
                }

                // Generate all slots
                const slotsToCreate = [];
                const startDate = new Date(bulkFormData.start_date);
                const endDate = new Date(bulkFormData.end_date);
                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

                for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
                    const dayName = dayNames[date.getDay()];
                    if (bulkFormData.days_of_week.includes(dayName)) {
                        // Get time slots for this specific day
                        const daySlots = bulkFormData.dayTimeSlots[dayName] || [];
                        // Create slots for each time slot of this day
                        daySlots.forEach(timeSlot => {
                            slotsToCreate.push({
                                provider_id: bulkFormData.provider_id,
                                facility_id: bulkFormData.facility_id,
                                slot_date: date.toISOString().split('T')[0],
                                start_time: timeSlot.start_time,
                                end_time: timeSlot.end_time,
                                slot_status: bulkFormData.slot_status
                            });
                        });
                    }
                }

                if (slotsToCreate.length === 0) {
                    showToast('No slots to create. Check your date range and selected days.', 'error');
                    setLoading(false);
                    return;
                }

                // Show confirmation with preview
                const confirmMessage = `This will create ${slotsToCreate.length} availability slots. Continue?`;
                if (!window.confirm(confirmMessage)) {
                    setLoading(false);
                    return;
                }

                // Create slots in batch with progress updates
                let successCount = 0;
                let errorCount = 0;
                const totalSlots = slotsToCreate.length;

                // Show initial progress
                showToast(`Creating ${totalSlots} slots...`, 'info');

                for (let i = 0; i < slotsToCreate.length; i++) {
                    const slot = slotsToCreate[i];
                    try {
                        const response = await fetch(`${API_BASE_URL}/appointments/availability/slots`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(slot)
                        });

                        const data = await response.json();
                        if (data.success) {
                            successCount++;
                        } else {
                            errorCount++;
                            console.error(`Failed to create slot for ${slot.slot_date} ${slot.start_time}-${slot.end_time}:`, data.message);
                        }
                    } catch (error) {
                        errorCount++;
                        console.error(`Error creating slot for ${slot.slot_date} ${slot.start_time}-${slot.end_time}:`, error);
                    }
                    
                    // Update progress every 10 slots or at the end
                    if ((i + 1) % 10 === 0 || i === slotsToCreate.length - 1) {
                        showToast(`Progress: ${i + 1}/${totalSlots} slots processed...`, 'info');
                    }
                }

                showToast(
                    `Bulk creation complete: ${successCount} slots created${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
                    successCount > 0 ? 'success' : 'error'
                );
                setShowCreateModal(false);
                setBulkFormData({
                    provider_id: '',
                    facility_id: '',
                    start_date: '',
                    end_date: '',
                    days_of_week: [],
                    slot_status: 'available',
                    dayTimeSlots: {}
                });
                setTempTimeSlot({ day: '', start_time: '', end_time: '' });
                fetchSlots();
            }
        } catch (error) {
            console.error('Error creating slot:', error);
            showToast('Failed to create slot: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTimeSlot = (day) => {
        if (!tempTimeSlot.start_time || !tempTimeSlot.end_time || tempTimeSlot.day !== day) {
            showToast('Please enter both start and end times', 'error');
            return;
        }
        
        // Convert time input (HH:MM) to database format (HH:MM:SS)
        const start_time = `${tempTimeSlot.start_time}:00`;
        const end_time = `${tempTimeSlot.end_time}:00`;
        
        if (start_time >= end_time) {
            showToast('End time must be after start time', 'error');
            return;
        }
        
        // Check for overlapping time slots for this specific day
        const daySlots = bulkFormData.dayTimeSlots[day] || [];
        const hasOverlap = daySlots.some(slot => {
            return (start_time < slot.end_time && end_time > slot.start_time);
        });
        
        if (hasOverlap) {
            showToast(`This time slot overlaps with an existing time slot for ${day}`, 'error');
            return;
        }
        
        setBulkFormData({
            ...bulkFormData,
            dayTimeSlots: {
                ...bulkFormData.dayTimeSlots,
                [day]: [...daySlots, {
                    start_time: start_time,
                    end_time: end_time
                }]
            }
        });
        
        // Reset temp time slot for this day
        setTempTimeSlot({ day: '', start_time: '', end_time: '' });
    };

    const handleRemoveTimeSlot = (day, index) => {
        const daySlots = bulkFormData.dayTimeSlots[day] || [];
        setBulkFormData({
            ...bulkFormData,
            dayTimeSlots: {
                ...bulkFormData.dayTimeSlots,
                [day]: daySlots.filter((_, i) => i !== index)
            }
        });
    };

    const handleToggleDay = (day) => {
        const isSelected = bulkFormData.days_of_week.includes(day);
        const newDaysOfWeek = isSelected
            ? bulkFormData.days_of_week.filter(d => d !== day)
            : [...bulkFormData.days_of_week, day];
        
        // If removing day, also remove its time slots
        const newDayTimeSlots = { ...bulkFormData.dayTimeSlots };
        if (isSelected) {
            delete newDayTimeSlots[day];
        } else {
            // Initialize empty array for new day if not exists
            if (!newDayTimeSlots[day]) {
                newDayTimeSlots[day] = [];
            }
        }
        
        setBulkFormData({
            ...bulkFormData,
            days_of_week: newDaysOfWeek,
            dayTimeSlots: newDayTimeSlots
        });
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

    const isSlotExpired = (slot) => {
        if (!slot.slot_date || !slot.end_time) return false;
        const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);
        return slotEnd < new Date();
    };

    const canAcceptAppointment = (slot) => {
        if (slot.slot_status !== 'available') return false;
        if (isSlotExpired(slot)) return false;
        return true;
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
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            style={{
                                padding: '10px 16px',
                                background: '#ECDCBF',
                                color: '#A31D1D',
                                border: 'none',
                                borderRadius: '6px',
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
                            Create Slot
                        </button>
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
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                                setTimeout(fetchSlots, 100);
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
                                setTimeout(fetchSlots, 100);
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
                                setTimeout(fetchSlots, 100);
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
                        const expired = isSlotExpired(slot);
                        const canAccept = canAcceptAppointment(slot);

                        return (
                            <div
                                key={slot.slot_id}
                                style={{
                                    background: 'white',
                                    padding: '20px',
                                    borderRadius: '8px',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    border: `2px solid ${getStatusColor(slot.slot_status)}`,
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
                                    background: getStatusColor(slot.slot_status) + '20',
                                    color: getStatusColor(slot.slot_status),
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {getStatusIcon(slot.slot_status)}
                                    {slot.slot_status.toUpperCase()}
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
                                    {canAccept && (
                                        <button
                                            onClick={() => handleOpenAcceptModal(slot)}
                                            style={{
                                                flex: 1,
                                                padding: '8px 16px',
                                                background: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: 'bold',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#218838'}
                                            onMouseLeave={(e) => e.target.style.background = '#28a745'}
                                        >
                                            Accept Appointment
                                        </button>
                                    )}
                                    {!canAccept && slot.slot_status === 'available' && expired && (
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
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Slot Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#A31D1D' }}>
                                {createMode === 'single' ? 'Create Availability Slot' : 'Create Multiple Slots (Bulk)'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setCreateMode('single');
                                    setCreateFormData({
                                        provider_id: '',
                                        facility_id: '',
                                        slot_date: '',
                                        start_time: '',
                                        end_time: '',
                                        slot_status: 'available'
                                    });
                                    setBulkFormData({
                                        provider_id: '',
                                        facility_id: '',
                                        start_date: '',
                                        end_date: '',
                                        days_of_week: [],
                                        slot_status: 'available',
                                        dayTimeSlots: {}
                                    });
                                    setTempTimeSlot({ day: '', timeRange: '' });
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                            >
                                <X size={24} color="#6c757d" />
                            </button>
                        </div>

                        {/* Mode Toggle */}
                        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '2px solid #e9ecef', paddingBottom: '15px' }}>
                            <button
                                type="button"
                                onClick={() => setCreateMode('single')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: createMode === 'single' ? '#A31D1D' : '#e9ecef',
                                    color: createMode === 'single' ? 'white' : '#6c757d',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Single Slot
                            </button>
                            <button
                                type="button"
                                onClick={() => setCreateMode('bulk')}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: createMode === 'bulk' ? '#A31D1D' : '#e9ecef',
                                    color: createMode === 'bulk' ? 'white' : '#6c757d',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Bulk Creation
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateSlot();
                        }}>
                            {createMode === 'single' ? (
                                <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Facility <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    value={createFormData.facility_id}
                                    onChange={(e) => setCreateFormData({ ...createFormData, facility_id: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="">Select Facility</option>
                                    {facilities.map(f => (
                                        <option key={f.facility_id} value={f.facility_id}>
                                            {f.facility_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Provider <span style={{ color: 'red' }}>*</span>
                                </label>
                                <select
                                    value={createFormData.provider_id}
                                    onChange={(e) => setCreateFormData({ ...createFormData, provider_id: e.target.value })}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="">Select Provider</option>
                                    {providers.map(p => (
                                        <option key={p.user_id} value={p.user_id}>
                                            {p.full_name || p.username}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Date <span style={{ color: 'red' }}>*</span>
                                </label>
                                <input
                                    type="date"
                                    value={createFormData.slot_date}
                                    onChange={(e) => setCreateFormData({ ...createFormData, slot_date: e.target.value })}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        Start Time <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={createFormData.start_time}
                                        onChange={(e) => setCreateFormData({ ...createFormData, start_time: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                        End Time <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={createFormData.end_time}
                                        onChange={(e) => setCreateFormData({ ...createFormData, end_time: e.target.value })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ced4da',
                                            borderRadius: '4px',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                    Status
                                </label>
                                <select
                                    value={createFormData.slot_status}
                                    onChange={(e) => setCreateFormData({ ...createFormData, slot_status: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <option value="available">Available</option>
                                    <option value="blocked">Blocked</option>
                                    <option value="unavailable">Unavailable</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setCreateMode('single');
                                        setCreateFormData({
                                            provider_id: '',
                                            facility_id: '',
                                            slot_date: '',
                                            start_time: '',
                                            end_time: '',
                                            slot_status: 'available'
                                        });
                                        setBulkFormData({
                                            provider_id: '',
                                            facility_id: '',
                                            start_date: '',
                                            end_date: '',
                                            days_of_week: [],
                                            slot_status: 'available',
                                            dayTimeSlots: {}
                                        });
                                        setTempTimeSlot({ day: '', timeRange: '' });
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        background: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        padding: '8px 16px',
                                        background: loading ? '#6c757d' : '#A31D1D',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        opacity: loading ? 0.6 : 1
                                    }}
                                >
                                    {loading ? 'Creating...' : createMode === 'single' ? 'Create Slot' : 'Create All Slots'}
                                </button>
                            </div>
                                </>
                            ) : (
                                <>
                                    {/* Bulk Creation Form */}
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Facility <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={bulkFormData.facility_id}
                                            onChange={(e) => setBulkFormData({ ...bulkFormData, facility_id: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="">Select Facility</option>
                                            {facilities.map(f => (
                                                <option key={f.facility_id} value={f.facility_id}>
                                                    {f.facility_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Provider <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <select
                                            value={bulkFormData.provider_id}
                                            onChange={(e) => setBulkFormData({ ...bulkFormData, provider_id: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="">Select Provider</option>
                                            {providers.map(p => (
                                                <option key={p.user_id} value={p.user_id}>
                                                    {p.full_name || p.username}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                Start Date <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={bulkFormData.start_date}
                                                onChange={(e) => setBulkFormData({ ...bulkFormData, start_date: e.target.value })}
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                                End Date <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={bulkFormData.end_date}
                                                onChange={(e) => setBulkFormData({ ...bulkFormData, end_date: e.target.value })}
                                                required
                                                min={bulkFormData.start_date || new Date().toISOString().split('T')[0]}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px',
                                                    border: '1px solid #ced4da',
                                                    borderRadius: '4px'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Days of Week <span style={{ color: 'red' }}>*</span>
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <button
                                                    key={day}
                                                    type="button"
                                                    onClick={() => handleToggleDay(day)}
                                                    style={{
                                                        padding: '8px 12px',
                                                        background: bulkFormData.days_of_week.includes(day) ? '#A31D1D' : '#e9ecef',
                                                        color: bulkFormData.days_of_week.includes(day) ? 'white' : '#6c757d',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    {day.substring(0, 3)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Time Slots per Day */}
                                    {bulkFormData.days_of_week.length > 0 && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                                Time Slots per Day <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <p style={{ fontSize: '12px', color: '#6c757d', marginBottom: '15px' }}>
                                                Configure time slots for each selected day. Each day can have different schedules.
                                            </p>
                                            
                                            {/* Preview */}
                                            {bulkFormData.start_date && bulkFormData.end_date && bulkFormData.days_of_week.length > 0 && (
                                                <div style={{ 
                                                    marginBottom: '15px', 
                                                    padding: '10px', 
                                                    background: '#e7f3ff', 
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    color: '#0066cc'
                                                }}>
                                                    <strong>Preview:</strong> This will create slots for{' '}
                                                    <strong>{bulkFormData.days_of_week.length}</strong> day{bulkFormData.days_of_week.length !== 1 ? 's' : ''} ({bulkFormData.days_of_week.join(', ')})
                                                    <br />
                                                    <span style={{ fontSize: '12px', color: '#666', marginTop: '5px', display: 'block' }}>
                                                        Total: approximately{' '}
                                                        <strong>
                                                            {(() => {
                                                                const start = new Date(bulkFormData.start_date);
                                                                const end = new Date(bulkFormData.end_date);
                                                                const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                                let count = 0;
                                                                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                                                    const dayName = dayNames[d.getDay()];
                                                                    if (bulkFormData.days_of_week.includes(dayName)) {
                                                                        const daySlots = bulkFormData.dayTimeSlots[dayName] || [];
                                                                        count += daySlots.length;
                                                                    }
                                                                }
                                                                return count;
                                                            })()}
                                                        </strong> slots across the date range
                                                    </span>
                                                </div>
                                            )}

                                            {/* Time slot configuration for each selected day */}
                                            {bulkFormData.days_of_week.map(day => {
                                                const daySlots = bulkFormData.dayTimeSlots[day] || [];
                                                return (
                                                    <div key={day} style={{ 
                                                        marginBottom: '20px', 
                                                        padding: '15px', 
                                                        background: '#f8f9fa', 
                                                        borderRadius: '4px',
                                                        border: '1px solid #e9ecef'
                                                    }}>
                                                        <div style={{ 
                                                            display: 'flex', 
                                                            justifyContent: 'space-between', 
                                                            alignItems: 'center',
                                                            marginBottom: '10px'
                                                        }}>
                                                            <h4 style={{ margin: 0, color: '#A31D1D', fontSize: '14px', fontWeight: 'bold' }}>
                                                                {day} {daySlots.length > 0 && `(${daySlots.length} slot${daySlots.length !== 1 ? 's' : ''})`}
                                                            </h4>
                                                        </div>
                                                        
                                                        {/* Time input for this day - Two time inputs */}
                                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-end' }}>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                                                                    Start Time
                                                                </label>
                                                                <input
                                                                    type="time"
                                                                    value={tempTimeSlot.day === day ? tempTimeSlot.start_time : ''}
                                                                    onChange={(e) => setTempTimeSlot({ day, start_time: e.target.value, end_time: tempTimeSlot.day === day ? tempTimeSlot.end_time : '' })}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        border: '1px solid #ced4da',
                                                                        borderRadius: '4px',
                                                                        fontSize: '14px'
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (tempTimeSlot.day !== day) {
                                                                            setTempTimeSlot({ day, start_time: '', end_time: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '12px' }}>
                                                                    End Time
                                                                </label>
                                                                <input
                                                                    type="time"
                                                                    value={tempTimeSlot.day === day ? tempTimeSlot.end_time : ''}
                                                                    onChange={(e) => setTempTimeSlot({ day, start_time: tempTimeSlot.day === day ? tempTimeSlot.start_time : '', end_time: e.target.value })}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px',
                                                                        border: '1px solid #ced4da',
                                                                        borderRadius: '4px',
                                                                        fontSize: '14px'
                                                                    }}
                                                                    onFocus={() => {
                                                                        if (tempTimeSlot.day !== day) {
                                                                            setTempTimeSlot({ day, start_time: '', end_time: '' });
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleAddTimeSlot(day)}
                                                                style={{
                                                                    padding: '8px 16px',
                                                                    background: '#28a745',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap',
                                                                    height: 'fit-content',
                                                                    marginTop: '20px'
                                                                }}
                                                            >
                                                                Add
                                                            </button>
                                                        </div>
                                                        
                                                        {/* Display time slots for this day */}
                                                        {daySlots.length > 0 && (
                                                            <div style={{ marginTop: '10px' }}>
                                                                {daySlots.map((slot, index) => (
                                                                    <div key={index} style={{
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        padding: '8px',
                                                                        background: 'white',
                                                                        borderRadius: '4px',
                                                                        marginBottom: '5px'
                                                                    }}>
                                                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                                                            {formatTimeToAMPM(slot.start_time)} to {formatTimeToAMPM(slot.end_time)}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveTimeSlot(day, index)}
                                                                            style={{
                                                                                padding: '4px 8px',
                                                                                background: '#dc3545',
                                                                                color: 'white',
                                                                                border: 'none',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                fontSize: '12px'
                                                                            }}
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        
                                                        {daySlots.length === 0 && (
                                                            <p style={{ fontSize: '12px', color: '#dc3545', margin: '5px 0 0 0' }}>
                                                                ⚠️ Please add at least one time slot for {day}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                            Status
                                        </label>
                                        <select
                                            value={bulkFormData.slot_status}
                                            onChange={(e) => setBulkFormData({ ...bulkFormData, slot_status: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                border: '1px solid #ced4da',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            <option value="available">Available</option>
                                            <option value="blocked">Blocked</option>
                                            <option value="unavailable">Unavailable</option>
                                        </select>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateModal(false);
                                                setCreateMode('single');
                                                setCreateFormData({
                                                    provider_id: '',
                                                    facility_id: '',
                                                    slot_date: '',
                                                    start_time: '',
                                                    end_time: '',
                                                    slot_status: 'available'
                                                });
                                                setBulkFormData({
                                                    provider_id: '',
                                                    facility_id: '',
                                                    start_date: '',
                                                    end_date: '',
                                                    days_of_week: [],
                                                    slot_status: 'available',
                                                    dayTimeSlots: {}
                                                });
                                                setTempTimeSlot({ day: '', start_time: '', end_time: '' });
                                            }}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            style={{
                                                padding: '8px 16px',
                                                background: loading ? '#6c757d' : '#A31D1D',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                opacity: loading ? 0.6 : 1
                                            }}
                                        >
                                            {loading ? 'Creating...' : 'Create All Slots'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Accept Appointment Modal */}
            {showAcceptModal && selectedSlot && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '80vh',
                        overflow: 'auto',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, color: '#A31D1D' }}>Accept Appointment into Slot</h2>
                            <button
                                onClick={() => {
                                    setShowAcceptModal(false);
                                    setSelectedSlot(null);
                                    setSelectedAppointment(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                            >
                                <X size={24} color="#6c757d" />
                            </button>
                        </div>

                        {/* Slot Info */}
                        <div style={{
                            padding: '15px',
                            background: '#f8f9fa',
                            borderRadius: '4px',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Selected Slot</h3>
                            <div style={{ fontSize: '14px', color: '#6c757d' }}>
                                <p><strong>Date:</strong> {formatDate(selectedSlot.slot_date)}</p>
                                <p><strong>Time:</strong> {formatTime(selectedSlot.start_time)} - {formatTime(selectedSlot.end_time)}</p>
                                <p><strong>Facility:</strong> {selectedSlot.facility_name || 'N/A'}</p>
                                <p><strong>Provider:</strong> {selectedSlot.provider_name || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Available Appointments */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                                Select Appointment to Accept
                            </label>
                            {appointments.length === 0 ? (
                                <p style={{ color: '#6c757d', textAlign: 'center', padding: '20px' }}>
                                    No appointments available to assign to this slot
                                </p>
                            ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {appointments
                                        .filter(apt => {
                                            // Filter appointments that match slot criteria
                                            if (selectedSlot.facility_id && apt.facility_id !== selectedSlot.facility_id) return false;
                                            if (selectedSlot.provider_id && apt.provider_id !== selectedSlot.provider_id) return false;
                                            
                                            // Check if appointment time is within slot time boundaries
                                            const aptStart = new Date(apt.scheduled_start);
                                            const aptEnd = new Date(apt.scheduled_end);
                                            const slotDateStr = selectedSlot.slot_date;
                                            const slotStart = new Date(`${slotDateStr}T${selectedSlot.start_time}`);
                                            const slotEnd = new Date(`${slotDateStr}T${selectedSlot.end_time}`);
                                            
                                            // Appointment must fit within slot boundaries
                                            return aptStart >= slotStart && aptEnd <= slotEnd;
                                        })
                                        .map(apt => {
                                            const aptStart = new Date(apt.scheduled_start);
                                            const aptEnd = new Date(apt.scheduled_end);
                                            
                                            return (
                                                <div
                                                    key={apt.appointment_id}
                                                    onClick={() => setSelectedAppointment(apt)}
                                                    style={{
                                                        padding: '15px',
                                                        border: `2px solid ${selectedAppointment?.appointment_id === apt.appointment_id ? '#28a745' : '#e9ecef'}`,
                                                        borderRadius: '4px',
                                                        marginBottom: '10px',
                                                        cursor: 'pointer',
                                                        background: selectedAppointment?.appointment_id === apt.appointment_id ? '#f0f9ff' : 'white',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (selectedAppointment?.appointment_id !== apt.appointment_id) {
                                                            e.currentTarget.style.borderColor = '#007bff';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (selectedAppointment?.appointment_id !== apt.appointment_id) {
                                                            e.currentTarget.style.borderColor = '#e9ecef';
                                                        }
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                        <div>
                                                            <strong style={{ color: '#333' }}>{apt.patient_name || 'Unknown Patient'}</strong>
                                                            <p style={{ margin: '5px 0', fontSize: '13px', color: '#6c757d' }}>
                                                                {aptStart.toLocaleDateString()} {aptStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {aptEnd.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                            <p style={{ margin: '5px 0', fontSize: '12px', color: '#6c757d' }}>
                                                                Type: {apt.appointment_type?.replace('_', ' ').toUpperCase()}
                                                            </p>
                                                        </div>
                                                        {selectedAppointment?.appointment_id === apt.appointment_id && (
                                                            <CheckCircle size={20} color="#28a745" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button
                                onClick={() => {
                                    setShowAcceptModal(false);
                                    setSelectedSlot(null);
                                    setSelectedAppointment(null);
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (selectedAppointment) {
                                        handleAcceptAppointment(selectedSlot.slot_id, selectedAppointment.appointment_id);
                                    }
                                }}
                                disabled={!selectedAppointment || loading}
                                style={{
                                    padding: '8px 16px',
                                    background: selectedAppointment && !loading ? '#28a745' : '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: selectedAppointment && !loading ? 'pointer' : 'not-allowed',
                                    opacity: selectedAppointment && !loading ? 1 : 0.6
                                }}
                            >
                                {loading ? 'Processing...' : 'Accept Appointment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

