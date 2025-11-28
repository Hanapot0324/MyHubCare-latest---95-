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

    // Periodically check and update ALL expired slots (not just visible ones)
    useEffect(() => {
        const checkAndUpdateExpiredSlots = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                // Fetch all available slots (no date filter) to check for expired ones
                const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?status=available`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await response.json();
                if (data.success) {
                    await updateExpiredSlots(data.data || []);
                }
            } catch (error) {
                console.error('Error checking expired slots:', error);
            }
        };

        // Check immediately on mount
        checkAndUpdateExpiredSlots();

        // Then check every 5 minutes
        const interval = setInterval(checkAndUpdateExpiredSlots, 5 * 60 * 1000);

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Function to update expired slots to 'unavailable' status
    const updateExpiredSlots = async (slotsData) => {
        try {
            const token = getAuthToken();
            if (!token) return false;

            const now = new Date();
            const expiredSlots = slotsData.filter(slot => {
                if (!slot.slot_date || slot.slot_status !== 'available' || slot.appointment_id) {
                    return false;
                }
                
                // Check if slot date has passed
                const slotDate = new Date(slot.slot_date);
                slotDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                // If slot date is before today, it's expired
                if (slotDate < today) {
                    return true;
                }
                
                // If slot date is today, check if end time has passed
                if (slotDate.getTime() === today.getTime() && slot.end_time) {
                    const slotEnd = new Date(`${slot.slot_date} ${slot.end_time}`);
                    return slotEnd < now;
                }
                
                return false;
            });

            // Update expired slots in batch
            if (expiredSlots.length > 0) {
                console.log(`Updating ${expiredSlots.length} expired slot(s) to unavailable status...`);
                
                const updatePromises = expiredSlots.map(slot =>
                    fetch(`${API_BASE_URL}/appointments/availability/slots/${slot.slot_id}`, {
                        method: 'PUT',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            slot_status: 'unavailable'
                        })
                    }).catch(error => {
                        console.error(`Failed to update expired slot ${slot.slot_id}:`, error);
                        return null;
                    })
                );

                await Promise.all(updatePromises);
                console.log(`Successfully updated ${expiredSlots.length} expired slot(s)`);
                return true; // Indicate that updates were made
            }
            return false; // No updates needed
        } catch (error) {
            console.error('Error updating expired slots:', error);
            // Don't show toast for this - it's a background operation
            return false;
        }
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

            const url = `${API_BASE_URL}/appointments/availability/slots?${params}`;
            console.log('Fetching availability slots from:', url);

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            console.log('Availability slots response:', { success: data.success, count: data.data?.length || 0 });
            
            if (data.success) {
                const slotsData = data.data || [];
                console.log('Fetched slots:', slotsData.length, 'slots');
                
                // Update expired slots and refresh if any were updated
                const updatesMade = await updateExpiredSlots(slotsData);
                if (updatesMade) {
                    // Refresh slots after updating expired ones to get the updated status
                    // Use a small delay to ensure backend has processed the updates
                    setTimeout(() => {
                        // Re-fetch without triggering loading state
                        fetch(url, {
                            headers: { Authorization: `Bearer ${token}` }
                        })
                        .then(res => res.json())
                        .then(refreshData => {
                            if (refreshData.success) {
                                console.log('Refreshed slots after update:', refreshData.data?.length || 0);
                                setSlots(refreshData.data || []);
                            }
                        })
                        .catch(err => console.error('Error refreshing slots after update:', err));
                    }, 500);
                } else {
                    setSlots(slotsData);
                }
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
                        const expired = isSlotExpired(slot);

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
                                    {/* Show "Booked" for booked slots */}
                                    {(slot.slot_status === 'booked' || slot.appointment_id) && (
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
                                    
                                    {/* Show "Available" for available slots without appointments */}
                                    {slot.slot_status === 'available' && !slot.appointment_id && !expired && (
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
                                    
                                    {/* Show "Expired" for expired available slots */}
                                    {slot.slot_status === 'available' && expired && (
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
                                    
                                    {/* Show status for blocked/unavailable slots */}
                                    {(slot.slot_status === 'blocked' || slot.slot_status === 'unavailable') && (
                                        <div style={{
                                            flex: 1,
                                            padding: '8px 16px',
                                            background: slot.slot_status === 'blocked' ? '#dc3545' : '#6c757d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            textAlign: 'center',
                                            textTransform: 'capitalize'
                                        }}>
                                            {slot.slot_status}
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

