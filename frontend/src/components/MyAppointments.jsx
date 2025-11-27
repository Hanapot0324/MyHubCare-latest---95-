import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check, Trash2, Bell } from 'lucide-react';
import { AccessTime, LocationOn, LocalHospital } from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

const MyAppointments = ({ socket }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [appointmentRequests, setAppointmentRequests] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'requested'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // For form dropdowns (facilities and providers)
    const [facilities, setFacilities] = useState([]);
    const [providers, setProviders] = useState([]);
    
    // Current user info
    const [currentUser, setCurrentUser] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [currentPatientId, setCurrentPatientId] = useState(null);
    const [currentProviderId, setCurrentProviderId] = useState(null);
    
    // Day availability cache
    const [dayAvailability, setDayAvailability] = useState({});
    
    // Time slots for selected date
    const [selectedDateSlots, setSelectedDateSlots] = useState([]);
    const [selectedDateAppointments, setSelectedDateAppointments] = useState([]);


    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        getCurrentUser();
        fetchFacilities();
        fetchProviders();
        fetchNotifications();
        
        // Read filter from URL query params
        const params = new URLSearchParams(location.search);
        const urlFilter = params.get('filter');
        if (urlFilter && ['all', 'upcoming', 'past', 'requested'].includes(urlFilter)) {
            setFilter(urlFilter);
        }
    }, []);

    // Fetch appointments after current user is loaded (to filter by patient_id)
    useEffect(() => {
        if (currentUserRole && (currentPatientId || currentUserRole !== 'patient')) {
            fetchAppointments();
            fetchAllAppointmentsForCalendar();
        }
    }, [currentUserRole, currentPatientId]);

    // Apply filter when appointments, requests, or filter changes
    useEffect(() => {
        applyFilter();
    }, [appointments, appointmentRequests, filter]);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/notifications?type=in_app`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data?.in_app_messages) {
                    // Map the notifications to match the display format
                    const messages = data.data.in_app_messages.map(msg => ({
                        id: msg.message_id,
                        message_id: msg.message_id,
                        type: msg.payload?.type || 'appointment',
                        title: msg.subject,
                        message: msg.body,
                        appointment: msg.payload?.appointment_id ? {
                            appointment_id: msg.payload.appointment_id,
                            appointment_type: msg.payload.appointment_type,
                            scheduled_start: msg.payload.scheduled_start
                        } : null,
                        appointment_id: msg.payload?.appointment_id,
                        requires_confirmation: msg.payload?.requires_confirmation || false,
                        decline_reason: msg.payload?.decline_reason || null,
                        timestamp: msg.sent_at || msg.created_at,
                        created_at: msg.sent_at || msg.created_at,
                        read: msg.is_read,
                        is_read: msg.is_read
                    }));
                    setNotifications(messages);
                    setUnreadCount(messages.filter(n => !n.read && !n.is_read).length);
                } else if (data.success && Array.isArray(data.data)) {
                    // Fallback for direct array response
                    setNotifications(data.data);
                    setUnreadCount(data.data.filter(n => !n.read && !n.is_read).length);
                }
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Join user room for real-time notifications
    useEffect(() => {
        if (socket && currentUser?.user_id) {
            socket.emit('joinRoom', currentUser.user_id);
            console.log('Joined user room:', currentUser.user_id);
        }
    }, [socket, currentUser]);

    // Listen for real-time notifications
    useEffect(() => {
        if (socket) {
            socket.on('newNotification', (data) => {
                console.log('New notification received:', data);
                fetchNotifications();
            });

            return () => {
                socket.off('newNotification');
            };
        }
    }, [socket]);


    // Auto-hide toast after 3 seconds
    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => {
                setToast(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Get current user info
    const getCurrentUser = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user) {
                    const user = data.user;
                    setCurrentUser(user);
                    setCurrentUserRole(user.role);
                    
                    // If user is a patient, get their patient_id
                    if (user.role === 'patient') {
                        const patientId = user.patient?.patient_id || user.patient_id || null;
                        if (!patientId) {
                            try {
                                const profileResponse = await fetch(`${API_BASE_URL}/profile/me`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                if (profileResponse.ok) {
                                    const profileData = await profileResponse.json();
                                    if (profileData.success && profileData.patient) {
                                        setCurrentPatientId(profileData.patient.patient_id);
                                    }
                                }
                            } catch (err) {
                                console.error('Error fetching patient profile:', err);
                            }
                        } else {
                            setCurrentPatientId(patientId);
                        }
                    } else if (user.role === 'physician') {
                        // If user is a physician, set their user_id as provider_id
                        setCurrentProviderId(user.user_id);
                    }
                }
            }
        } catch (error) {
            console.error('Error getting current user:', error);
        }
    };

    const [allFilteredAppointments, setAllFilteredAppointments] = useState([]);

    const applyFilter = () => {
        const now = new Date();
        let filtered = [];

        if (filter === 'requested') {
            // Show appointment requests for patients
            if (currentUserRole === 'patient') {
                filtered = appointmentRequests.map(req => ({
                    ...req,
                    isRequest: true,
                    scheduled_start: req.preferred_start,
                    scheduled_end: req.preferred_end,
                    patient_name: 'You',
                    status: req.status,
                    appointment_type: 'request'
                }));
            }
        } else {
            // Filter appointments
            filtered = appointments.filter(apt => {
                const aptDate = new Date(apt.scheduled_start);
                
                if (filter === 'upcoming') {
                    return aptDate >= now && (apt.status === 'scheduled' || apt.status === 'confirmed');
                } else if (filter === 'past') {
                    return aptDate < now || apt.status === 'completed';
                } else {
                    // 'all' - show all appointments
                    return true;
                }
            });
        }

        setAllFilteredAppointments(filtered);
        
        // If a day is selected, filter by day as well
        if (selectedDay) {
            filterAppointmentsByDay(selectedDay, filtered);
        } else {
            setFilteredAppointments(filtered);
        }
    };

    useEffect(() => {
        if (selectedDay) {
            filterAppointmentsByDay(selectedDay, allFilteredAppointments);
        } else {
            setFilteredAppointments(allFilteredAppointments);
        }
    }, [selectedDay, allFilteredAppointments]);

    const fetchAppointmentRequests = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Only fetch requests for patients
            if (currentUserRole !== 'patient') return;

            const response = await fetch(`${API_BASE_URL}/appointment-requests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                setAppointmentRequests(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching appointment requests:', error);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token) {
                setToast({
                    message: 'Please login to view appointments',
                    type: 'error'
                });
                return;
            }

            // Build URL with patient_id filter if user is a patient
            let url = `${API_BASE_URL}/appointments`;
            if (currentUserRole === 'patient' && currentPatientId) {
                url += `?patient_id=${currentPatientId}`;
            }

            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // For patients, only show their own appointments in the list
                const allAppointments = data.data || [];
                if (currentUserRole === 'patient' && currentPatientId) {
                    // Double-check filter (backend should already filter, but ensure client-side too)
                    const patientAppointments = allAppointments.filter(apt => 
                        apt.patient_id === currentPatientId
                    );
                    setAppointments(patientAppointments);
                } else {
                    setAppointments(allAppointments);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch appointments');
            }

            // Also fetch appointment requests for patients
            if (currentUserRole === 'patient') {
                await fetchAppointmentRequests();
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
            setToast({
                message: 'Failed to fetch appointments: ' + error.message,
                type: 'error'
            });
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
            let facilitiesArray = [];
            
            if (data.success && data.data) {
                facilitiesArray = data.data;
            } else if (Array.isArray(data)) {
                facilitiesArray = data;
            } else if (data && typeof data === 'object') {
                facilitiesArray = data.facilities || data.data || [];
            }

            setFacilities(facilitiesArray);
        } catch (error) {
            console.error('Error fetching facilities:', error);
        }
    };

    const fetchProviders = async (facilityId = null) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Fetch providers from doctor_assignments (only those with active assignments)
            let url = `${API_BASE_URL}/doctor-assignments/providers`;
            if (facilityId) {
                url += `?facility_id=${facilityId}`;
            }

            let response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If doctor-assignments endpoint doesn't work, fallback to users/providers
            if (!response.ok && (response.status === 404 || response.status === 403)) {
                response = await fetch(`${API_BASE_URL}/users/providers`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            // If still fails, try old endpoint
            if (!response.ok && (response.status === 404 || response.status === 403)) {
                response = await fetch(`${API_BASE_URL}/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (!response.ok) {
                console.error('Failed to fetch providers:', response.status);
                setProviders([]);
                return;
            }

            const data = await response.json();
            let providersArray = [];
            
            // Doctor-assignments endpoint returns { success: true, providers: [...] }
            if (data.success && data.providers) {
                providersArray = data.providers;
            } 
            // Users/providers endpoint returns { success: true, providers: [...] }
            else if (data.success && data.providers) {
                providersArray = data.providers;
            }
            // Old endpoint returns { success: true, users: [...] }
            else if (data.success && data.users) {
                providersArray = data.users.filter(u => 
                    u.role?.toLowerCase() === 'physician'
                );
            } else if (Array.isArray(data)) {
                providersArray = data.filter(u => 
                    u.role?.toLowerCase() === 'physician'
                );
            } else if (data.users && Array.isArray(data.users)) {
                providersArray = data.users.filter(u => 
                    u.role?.toLowerCase() === 'physician'
                );
            }

            setProviders(providersArray);
        } catch (error) {
            console.error('Error fetching providers:', error);
            setProviders([]);
        }
    };


    const filterAppointmentsByDay = (day, appointmentsToFilter = allFilteredAppointments) => {
        if (!day) {
            setFilteredAppointments([]);
            return;
        }
        
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Filter appointments for the selected day
        const filtered = appointmentsToFilter.filter(apt => {
            const aptDate = new Date(apt.scheduled_start || apt.preferred_start);
            const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
            return aptDateStr === dateStr;
        });
        
        setFilteredAppointments(filtered);
    };

    // Calendar functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction) => {
        setCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
        setSelectedDay(null);
    };

    const handleDayClick = (day) => {
        setSelectedDay(day);
        // Fetch availability slots and appointments for the selected date
        if (day) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            fetchAvailabilitySlotsForDate(dateStr);
            fetchAppointmentsForDate(dateStr);
        } else {
            setSelectedDateSlots([]);
            setSelectedDateAppointments([]);
        }
    };

    // Fetch availability slots for a specific date (automatically fetch all slots for the date)
    const fetchAvailabilitySlotsForDate = async (dateStr) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Fetch all available slots for the date (no filters - show all)
            const params = new URLSearchParams({ 
                date: dateStr,
                status: 'available' // Only show available slots
            });

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Filter to only show available slots (status = 'available')
                    const availableSlots = (data.data || []).filter(slot => slot.slot_status === 'available');
                    setSelectedDateSlots(availableSlots);
                }
            }
        } catch (error) {
            console.error('Error fetching availability slots:', error);
        }
    };

    // Fetch appointments for a specific date (automatically fetch all appointments for the date)
    const fetchAppointmentsForDate = async (dateStr) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            // Fetch all appointments for the date (no filters - show all)
            const params = new URLSearchParams({ 
                date_from: dateStr,
                date_to: dateStr
            });

            const response = await fetch(`${API_BASE_URL}/appointments?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Filter to only show confirmed/scheduled appointments (not cancelled/no_show)
                    const activeAppointments = (data.data || []).filter(apt => 
                        apt.status !== 'cancelled' && apt.status !== 'no_show'
                    );
                    setSelectedDateAppointments(activeAppointments);
                }
            }
        } catch (error) {
            console.error('Error fetching appointments for date:', error);
        }
    };

    // Store all appointments for calendar time indicators (without patient details)
    const [allAppointmentsForCalendar, setAllAppointmentsForCalendar] = useState([]);

    // Fetch all appointments for calendar (without patient details for privacy)
    const fetchAllAppointmentsForCalendar = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/appointments`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success) {
                // For calendar, we only need time slots, not patient details
                // Filter out cancelled/no_show appointments
                const activeAppointments = (data.data || []).filter(apt => 
                    apt.status !== 'cancelled' && apt.status !== 'no_show'
                );
                setAllAppointmentsForCalendar(activeAppointments);
            }
        } catch (error) {
            console.error('Error fetching appointments for calendar:', error);
        }
    };

    useEffect(() => {
        fetchAllAppointmentsForCalendar();
        // Refresh every 30 seconds
        const interval = setInterval(fetchAllAppointmentsForCalendar, 30000);
        return () => clearInterval(interval);
    }, []);

    const getAppointmentsForDay = (day) => {
        if (!day) return [];
        
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Only return current patient's appointments for the list view
        return appointments.filter(apt => {
            const aptDate = new Date(apt.scheduled_start);
            const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
            return aptDateStr === dateStr;
        });
    };

    // Get all appointments for a day (for calendar time indicators only - no patient details)
    const getAllAppointmentsForDay = (day) => {
        if (!day) return [];
        
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Return all active appointments for time indicators (patients see times, not names)
        return allAppointmentsForCalendar.filter(apt => {
            const aptDate = new Date(apt.scheduled_start);
            const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
            return aptDateStr === dateStr;
        });
    };

    const handleEditAppointment = (appointment) => {
        setSelectedAppointment(appointment);
        setShowEditModal(true);
    };

    const handleDeleteAppointment = async (appointmentId) => {
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cancellation_reason: 'Cancelled by user'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    await fetchAppointments();
                    setToast({
                        message: 'Appointment cancelled successfully',
                        type: 'success'
                    });
                } else {
                    throw new Error(data.message || 'Failed to cancel appointment');
                }
            } catch (error) {
                console.error('Error cancelling appointment:', error);
                setToast({
                    message: 'Failed to cancel appointment: ' + error.message,
                    type: 'error'
                });
            }
        }
    };

    const checkAvailability = async (facility_id, provider_id, scheduled_start, scheduled_end) => {
        try {
            const token = getAuthToken();
            const params = new URLSearchParams({
                facility_id,
                scheduled_start,
                scheduled_end
            });
            if (provider_id) {
                params.append('provider_id', provider_id);
            }

            const response = await fetch(`${API_BASE_URL}/appointments/availability/check?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            
            // If the API returns success, check the available flag
            // If slots are not defined, allow booking (backend logic handles this)
            if (data.success) {
                // Check if slots are defined - if not, allow booking
                const hasSlotsDefined = data.data?.available_slots !== undefined;
                const hasConflicts = data.data?.conflicts && data.data.conflicts.length > 0;
                
                // If there are conflicts, definitely not available
                if (hasConflicts) {
                    return false;
                }
                
                // If slots are defined and none available, not available
                // If slots not defined, allow booking (backend will validate)
                if (hasSlotsDefined && (!data.data?.available_slots || data.data.available_slots.length === 0)) {
                    return false;
                }
                
                // Otherwise, available
                return data.data?.available === true;
            }
            
            // If API fails, log but allow booking (fail open for better UX)
            console.warn('Availability check returned false:', data);
            return true; // Allow booking attempt - backend will validate
        } catch (error) {
            console.error('Error checking availability:', error);
            // On error, allow booking attempt (backend will validate)
            return true;
        }
    };

    // Check availability for a specific day
    const checkDayAvailability = async (facility_id, provider_id, date) => {
        try {
            const token = getAuthToken();
            if (!token) return null;

            // Check for any available slots on this day
            const params = new URLSearchParams({
                facility_id,
                date: date
            });
            if (provider_id) {
                params.append('provider_id', provider_id);
            }

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.data && data.data.length > 0) {
                    return 'available'; // Has available slots
                }
            }
            
            // Check if there are any appointments on this day
            const dateStr = date;
            const dayAppointments = appointments.filter(apt => {
                const aptDate = new Date(apt.scheduled_start);
                const aptDateStr = `${aptDate.getFullYear()}-${String(aptDate.getMonth() + 1).padStart(2, '0')}-${String(aptDate.getDate()).padStart(2, '0')}`;
                return aptDateStr === dateStr && apt.status !== 'cancelled' && apt.status !== 'no_show';
            });

            // If no slots defined and no appointments, assume available
            // If appointments exist, check if there's room for more
            if (dayAppointments.length === 0) {
                return 'available';
            }
            
            // For now, allow multiple appointments per day (can be limited later)
            return 'available';
        } catch (error) {
            console.error('Error checking day availability:', error);
            return null; // Unknown
        }
    };

    const handleAddAppointment = async (newAppointment) => {
        try {
            const token = getAuthToken();
            
            // Convert form data to API format
            // Use end time if provided, otherwise calculate from duration
            let scheduledStart = `${newAppointment.appointmentDate} ${newAppointment.appointmentTime}:00`;
            let scheduledEnd;
            
            if (newAppointment.appointmentEndTime) {
                scheduledEnd = `${newAppointment.appointmentDate} ${newAppointment.appointmentEndTime}:00`;
            } else {
                scheduledEnd = calculateEndTime(newAppointment.appointmentDate, newAppointment.appointmentTime, newAppointment.duration_minutes || 60);
            }

            // Validate date is not in the past
            const startDate = new Date(scheduledStart);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (startDate < today) {
                setToast({
                    message: 'Appointments cannot be scheduled in the past',
                    type: 'error'
                });
                return;
            }

            // Validate hourly intervals (minutes must be 0)
            if (startDate.getMinutes() !== 0) {
                setToast({
                    message: 'Appointments must start on the hour (e.g., 10:00, 11:00)',
                    type: 'error'
                });
                return;
            }

            // If user is a patient, create an appointment request instead of direct appointment
            if (currentUserRole === 'patient') {
                const requestData = {
                    preferred_start: scheduledStart,
                    preferred_end: scheduledEnd,
                    preferred_facility_id: newAppointment.facility_id,
                    notes: newAppointment.notes || null
                };

                const response = await fetch(`${API_BASE_URL}/appointment-requests`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestData)
                });

                const data = await response.json();

                if (data.success) {
                    await fetchAppointments(); // Refresh to show the new request
                    setShowAddModal(false);
                    setToast({
                        message: 'Appointment request submitted successfully. Awaiting case manager approval.',
                        type: 'success'
                    });
                } else {
                    throw new Error(data.message || 'Failed to create appointment request');
                }
                return;
            }

            // For staff users (physician, case_manager, admin), create appointment directly
            const finalProviderId = currentUserRole === 'physician' ? currentProviderId : newAppointment.provider_id || null;

            // Check availability before creating (informational only - backend will validate)
            const isAvailable = await checkAvailability(
                newAppointment.facility_id,
                finalProviderId,
                scheduledStart,
                scheduledEnd
            );

            // Show warning if unavailable, but don't block - let backend handle validation
            if (isAvailable === false) {
                setToast({
                    message: 'Warning: This time slot may not be available. Proceeding with booking attempt...',
                    type: 'error'
                });
            }

            const appointmentData = {
                patient_id: newAppointment.patient_id,
                provider_id: finalProviderId,
                facility_id: newAppointment.facility_id,
                appointment_type: newAppointment.appointment_type,
                scheduled_start: scheduledStart,
                scheduled_end: scheduledEnd,
                duration_minutes: newAppointment.duration_minutes || 60,
                reason: newAppointment.reason || null,
                notes: newAppointment.notes || null
            };

            const response = await fetch(`${API_BASE_URL}/appointments`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();

            if (data.success) {
                await fetchAppointments();
                setShowAddModal(false);
                setToast({
                    message: 'Appointment booked successfully',
                    type: 'success'
                });
            } else {
                throw new Error(data.message || 'Failed to create appointment');
            }
        } catch (error) {
            console.error('Error creating appointment:', error);
            setToast({
                message: 'Failed to book appointment: ' + error.message,
                type: 'error'
            });
        }
    };

    const handleUpdateAppointment = async (updatedAppointment) => {
        try {
            const token = getAuthToken();
            
            const scheduledStart = `${updatedAppointment.appointmentDate} ${updatedAppointment.appointmentTime}:00`;
            const appointmentData = {
                provider_id: currentUserRole === 'physician' ? currentProviderId : updatedAppointment.provider_id || null,
                facility_id: updatedAppointment.facility_id,
                appointment_type: updatedAppointment.appointment_type,
                scheduled_start: scheduledStart,
                scheduled_end: calculateEndTime(updatedAppointment.appointmentDate, updatedAppointment.appointmentTime, updatedAppointment.duration_minutes || 30),
                duration_minutes: updatedAppointment.duration_minutes || 30,
                reason: updatedAppointment.reason || null,
                notes: updatedAppointment.notes || null
            };

            const response = await fetch(`${API_BASE_URL}/appointments/${selectedAppointment.appointment_id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(appointmentData)
            });

            const data = await response.json();

            if (data.success) {
                await fetchAppointments();
                setShowEditModal(false);
                setSelectedAppointment(null);
                setToast({
                    message: 'Appointment updated successfully',
                    type: 'success'
                });
            } else {
                throw new Error(data.message || 'Failed to update appointment');
            }
        } catch (error) {
            console.error('Error updating appointment:', error);
            setToast({
                message: 'Failed to update appointment: ' + error.message,
                type: 'error'
            });
        }
    };

    const calculateEndTime = (date, startTime, durationMinutes) => {
        const [year, month, day] = date.split('-').map(Number);
        const [hours, minutes] = startTime.split(':').map(Number);
        
        const start = new Date(year, month - 1, day, hours, minutes, 0);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        
        const endYear = end.getFullYear();
        const endMonth = String(end.getMonth() + 1).padStart(2, '0');
        const endDay = String(end.getDate()).padStart(2, '0');
        const endHours = String(end.getHours()).padStart(2, '0');
        const endMins = String(end.getMinutes()).padStart(2, '0');
        const endSecs = String(end.getSeconds()).padStart(2, '0');
        
        return `${endYear}-${endMonth}-${endDay} ${endHours}:${endMins}:${endSecs}`;
    };

    const formatAppointmentType = (type) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

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

    // Helper function to check if a time slot is booked
    const isTimeSlotBooked = (slotStart, slotEnd) => {
        const slotStartTime = new Date(`2000-01-01 ${slotStart}`);
        const slotEndTime = new Date(`2000-01-01 ${slotEnd}`);
        
        return selectedDateAppointments.some(apt => {
            const aptStart = new Date(apt.scheduled_start);
            const aptEnd = new Date(apt.scheduled_end);
            const aptStartTime = new Date(`2000-01-01 ${aptStart.toTimeString().slice(0, 8)}`);
            const aptEndTime = new Date(`2000-01-01 ${aptEnd.toTimeString().slice(0, 8)}`);
            
            // Check if appointment overlaps with slot
            return (aptStartTime < slotEndTime && aptEndTime > slotStartTime);
        });
    };

    // Helper function to get time slot availability breakdown for a day
    const getTimeSlotAvailability = (dateStr) => {
        if (!selectedDateSlots.length || !dateStr) return [];

        const availability = [];
        
        // Group slots by provider and facility
        const groupedSlots = {};
        selectedDateSlots.forEach(slot => {
            const key = `${slot.provider_id || 'no-provider'}_${slot.facility_id}`;
            if (!groupedSlots[key]) {
                groupedSlots[key] = {
                    provider_name: slot.provider_name || 'No Provider',
                    facility_name: slot.facility_name || 'No Facility',
                    provider_id: slot.provider_id,
                    facility_id: slot.facility_id,
                    slots: []
                };
            }
            groupedSlots[key].slots.push(slot);
        });

        // Process each group
        Object.values(groupedSlots).forEach(group => {
            group.slots.forEach(slot => {
                const slotStart = slot.start_time;
                const slotEnd = slot.end_time;
                
                // Generate 30-minute intervals for this slot
                const intervals = generateTimeIntervals(slotStart, slotEnd);
                
                intervals.forEach(interval => {
                    const isBooked = isTimeSlotBooked(interval.start, interval.end);
                    availability.push({
                        start: interval.start,
                        end: interval.end,
                        isBooked: isBooked,
                        provider_name: group.provider_name,
                        facility_name: group.facility_name,
                        provider_id: group.provider_id,
                        facility_id: group.facility_id
                    });
                });
            });
        });

        // Sort by start time
        availability.sort((a, b) => a.start.localeCompare(b.start));
        
        return availability;
    };

    // Helper function to generate 30-minute time intervals from a slot
    const generateTimeIntervals = (slotStart, slotEnd) => {
        const intervals = [];
        const start = new Date(`2000-01-01 ${slotStart}`);
        const end = new Date(`2000-01-01 ${slotEnd}`);
        
        let current = new Date(start);
        while (current < end) {
            const intervalStart = new Date(current);
            const intervalEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes
            
            // Don't create interval if it goes beyond slot end
            if (intervalEnd > end) {
                break;
            }
            
            intervals.push({
                start: intervalStart.toTimeString().slice(0, 8),
                end: intervalEnd.toTimeString().slice(0, 8)
            });
            
            current = intervalEnd;
        }
        
        return intervals;
    };

    // Render time slots view
    const renderTimeSlotsView = () => {
        if (!selectedDay || selectedDateSlots.length === 0) {
            return (
                <div style={{ 
                    padding: '20px', 
                    textAlign: 'center', 
                    color: '#6c757d',
                    background: '#f8f9fa',
                    borderRadius: '4px'
                }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                        {selectedDay ? 'No availability slots found for this date. Please select a facility and provider.' : 'Select a date to view time slots'}
                    </p>
                </div>
            );
        }

        // Group slots by provider and facility
        const groupedSlots = {};
        selectedDateSlots.forEach(slot => {
            const key = `${slot.provider_id || 'no-provider'}_${slot.facility_id}`;
            if (!groupedSlots[key]) {
                groupedSlots[key] = {
                    provider_name: slot.provider_name || 'No Provider',
                    facility_name: slot.facility_name || 'No Facility',
                    provider_id: slot.provider_id,
                    facility_id: slot.facility_id,
                    slots: []
                };
            }
            groupedSlots[key].slots.push(slot);
        });

        // Sort slots by start time
        Object.keys(groupedSlots).forEach(key => {
            groupedSlots[key].slots.sort((a, b) => {
                return a.start_time.localeCompare(b.start_time);
            });
        });

        return (
            <div style={{ marginBottom: '20px' }}>
                {Object.values(groupedSlots).map((group, groupIndex) => {
                    // Generate all time intervals from all slots in this group
                    const allIntervals = [];
                    group.slots.forEach(slot => {
                        const intervals = generateTimeIntervals(slot.start_time, slot.end_time);
                        intervals.forEach(interval => {
                            allIntervals.push({
                                ...interval,
                                provider_id: group.provider_id,
                                facility_id: group.facility_id,
                                provider_name: group.provider_name,
                                facility_name: group.facility_name
                            });
                        });
                    });

                    // Remove duplicate intervals (same time, same provider/facility)
                    const uniqueIntervals = [];
                    const seen = new Set();
                    allIntervals.forEach(interval => {
                        const key = `${interval.start}_${interval.end}_${interval.provider_id}_${interval.facility_id}`;
                        if (!seen.has(key)) {
                            seen.add(key);
                            uniqueIntervals.push(interval);
                        }
                    });

                    // Sort intervals by start time
                    uniqueIntervals.sort((a, b) => a.start.localeCompare(b.start));

                    return (
                        <div key={groupIndex} style={{ marginBottom: '25px' }}>
                            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                {group.provider_name} - {group.facility_name}
                            </div>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                                gap: '8px' 
                            }}>
                                {uniqueIntervals.map((interval, index) => {
                                    const isBooked = isTimeSlotBooked(interval.start, interval.end);
                                    
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                if (!isBooked) {
                                                    // Open booking modal with pre-filled time
                                                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                                                    setShowAddModal(true);
                                                    // Store selected slot info for modal
                                                    // The modal will need to be updated to use this
                                                }
                                            }}
                                            style={{
                                                padding: '10px',
                                                border: `2px solid ${isBooked ? '#dc3545' : '#28a745'}`,
                                                borderRadius: '6px',
                                                background: isBooked ? '#fff5f5' : '#f0fdf4',
                                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                                opacity: isBooked ? 0.7 : 1
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isBooked) {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.borderColor = '#22c55e';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isBooked) {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.borderColor = '#28a745';
                                                }
                                            }}
                                            title={isBooked ? 'This time slot is already booked' : 'Click to book this time slot'}
                                        >
                                            <div style={{ 
                                                fontSize: '12px', 
                                                fontWeight: 'bold',
                                                color: isBooked ? '#dc3545' : '#28a745',
                                                marginBottom: '4px'
                                            }}>
                                                {formatTimeToAMPM(interval.start)}
                                            </div>
                                            <div style={{ 
                                                fontSize: '11px', 
                                                color: '#6c757d'
                                            }}>
                                                to {formatTimeToAMPM(interval.end)}
                                            </div>
                                            {isBooked && (
                                                <div style={{ 
                                                    fontSize: '10px', 
                                                    color: '#dc3545',
                                                    marginTop: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    BOOKED
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
        const today = new Date();
        const isCurrentMonth = today.getMonth() === currentMonth.getMonth() && 
                             today.getFullYear() === currentMonth.getFullYear();
        const todayDate = today.getDate();
        
        const days = [];
        const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        
        const weekDayElements = weekDays.map(day => (
            <div key={day} style={{
                textAlign: 'center',
                fontWeight: 'bold',
                padding: '10px 0',
                color: '#6c757d',
                fontSize: '14px',
                borderBottom: '1px solid #e9ecef'
            }}>
                {day}
            </div>
        ));
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} style={{ padding: '15px 0' }}></div>);
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayAppointments = getAppointmentsForDay(day); // Patient's own appointments for list
            const allDayAppointments = getAllAppointmentsForDay(day); // All appointments for time indicators
            const isToday = isCurrentMonth && day === todayDate;
            const isSelected = selectedDay === day;
            
            // Get availability status for this day
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const availability = dayAvailability[dateStr];
            
            // Get active appointments for time indicators (only show times, not patient names)
            const activeAppointments = allDayAppointments.filter(a => 
                a.status === 'scheduled' || 
                a.status === 'confirmed' || 
                a.status === 'pending_provider_confirmation' || 
                a.status === 'pending_patient_confirmation'
            );
            
            // Determine background color based on availability (not border)
            let backgroundColor = isSelected ? '#F8F2DE' : 'white';
            let borderColor = '#e9ecef';
            
            if (isToday) {
                borderColor = '#D84040';
            } else if (availability === 'unavailable') {
                backgroundColor = '#F8F2DE'; // Light beige background for unavailable
                borderColor = '#dc3545'; // Red border
            } else if (availability === 'available') {
                backgroundColor = '#F8F2DE'; // Light beige background for available
                borderColor = '#28a745'; // Green border
            }
            
            const hasAppointments = dayAppointments.length > 0;
            const hasAnyAppointments = allDayAppointments.length > 0;
            
            days.push(
                <div 
                    key={day} 
                    onClick={async () => {
                        handleDayClick(day);
                        // Check availability when day is clicked (not on hover)
                        if (currentUserRole === 'patient' && !availability) {
                            const defaultFacility = facilities.length > 0 ? facilities[0].facility_id : null;
                            if (defaultFacility) {
                                const avail = await checkDayAvailability(defaultFacility, null, dateStr);
                                if (avail !== null) {
                                    setDayAvailability(prev => ({
                                        ...prev,
                                        [dateStr]: avail
                                    }));
                                }
                            }
                        }
                    }}
                    className="calendar-day"
                    style={{
                        padding: '10px',
                        height: '80px',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '4px',
                        backgroundColor: backgroundColor,
                        cursor: hasAppointments || hasAnyAppointments ? 'pointer' : 'default', // Only show pointer if there are appointments
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        // Only show hover effect if there are appointments
                        if ((hasAppointments || hasAnyAppointments) && !isSelected) {
                            e.currentTarget.style.backgroundColor = '#F8F2DE';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = backgroundColor;
                    }}
                    title={availability === 'available' ? 'Available slots' : availability === 'unavailable' ? 'No available slots' : hasAppointments ? `${dayAppointments.length} of your appointment(s)` : hasAnyAppointments ? 'Time slots booked (see times below)' : 'Click to check availability'}
                >
                    <div style={{
                        fontWeight: isToday ? 'bold' : 'normal',
                        color: isToday ? '#D84040' : '#A31D1D',
                        marginBottom: '5px',
                        fontSize: '16px'
                    }}>
                        {day}
                    </div>
                    {/* Show patient's own appointments count */}
                    {hasAppointments && (
                        <div style={{
                            fontSize: '11px',
                            color: '#A31D1D',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: '500',
                            marginBottom: '3px'
                        }}>
                            {dayAppointments.length > 1 ? 
                                `${dayAppointments.length} of your appointments` : 
                                formatAppointmentType(dayAppointments[0].appointment_type)
                            }
                        </div>
                    )}
                    {/* Show time slot availability on selected day */}
                    {isSelected && currentUserRole === 'patient' && selectedDateSlots.length > 0 && (() => {
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const timeSlots = getTimeSlotAvailability(dateStr);
                        
                        if (timeSlots.length === 0) return null;
                        
                        // Group consecutive intervals of the same status
                        const groupedSlots = [];
                        let currentGroup = null;
                        
                        timeSlots.forEach(slot => {
                            if (!currentGroup || currentGroup.isBooked !== slot.isBooked || 
                                currentGroup.provider_id !== slot.provider_id || 
                                currentGroup.facility_id !== slot.facility_id) {
                                // Start new group
                                if (currentGroup) {
                                    groupedSlots.push(currentGroup);
                                }
                                currentGroup = {
                                    start: slot.start,
                                    end: slot.end,
                                    isBooked: slot.isBooked,
                                    provider_id: slot.provider_id,
                                    facility_id: slot.facility_id
                                };
                            } else {
                                // Extend current group
                                currentGroup.end = slot.end;
                            }
                        });
                        if (currentGroup) {
                            groupedSlots.push(currentGroup);
                        }
                        
                        return (
                            <div style={{
                                marginTop: '5px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '3px',
                                maxHeight: '50px',
                                overflowY: 'auto'
                            }}>
                                {groupedSlots.slice(0, 3).map((slot, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent day selection when clicking button
                                            if (!slot.isBooked) {
                                                setShowAddModal(true);
                                            }
                                        }}
                                        disabled={slot.isBooked}
                                        style={{
                                            border: `2px solid ${slot.isBooked ? '#dc3545' : '#28a745'}`,
                                            borderRadius: '4px',
                                            padding: '4px 6px',
                                            fontSize: '8px',
                                            background: slot.isBooked ? '#fff5f5' : '#28a745',
                                            color: slot.isBooked ? '#dc3545' : 'white',
                                            fontWeight: '600',
                                            lineHeight: '1.2',
                                            cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.2s ease',
                                            opacity: slot.isBooked ? 0.7 : 1,
                                            boxShadow: slot.isBooked ? 'none' : '0 1px 2px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!slot.isBooked) {
                                                e.currentTarget.style.background = '#22c55e';
                                                e.currentTarget.style.borderColor = '#22c55e';
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!slot.isBooked) {
                                                e.currentTarget.style.background = '#28a745';
                                                e.currentTarget.style.borderColor = '#28a745';
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                        title={slot.isBooked ? 
                                            `Booked: ${formatTimeToAMPM(slot.start)} to ${formatTimeToAMPM(slot.end)}` :
                                            `Click to book: ${formatTimeToAMPM(slot.start)} to ${formatTimeToAMPM(slot.end)}`
                                        }
                                    >
                                        {formatTimeToAMPM(slot.start)}-{formatTimeToAMPM(slot.end)}
                                        {slot.isBooked ? ' 🔴' : ' 🟢'}
                                    </button>
                                ))}
                                {groupedSlots.length > 3 && (
                                    <div style={{
                                        fontSize: '8px',
                                        color: '#6c757d',
                                        fontWeight: '600'
                                    }}>
                                        +{groupedSlots.length - 3} more
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    
                    {/* Show green time indicators for all scheduled appointments (without patient names) - only if not showing slot availability */}
                    {!(isSelected && currentUserRole === 'patient' && selectedDateSlots.length > 0) && activeAppointments.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '2px',
                            marginTop: '2px'
                        }}>
                            {activeAppointments.slice(0, 3).map((apt, idx) => {
                                const startDate = new Date(apt.scheduled_start);
                                const timeStr = startDate.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false 
                                });
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            backgroundColor: '#28a745',
                                            color: 'white',
                                            fontSize: '9px',
                                            padding: '2px 4px',
                                            borderRadius: '3px',
                                            fontWeight: '600',
                                            lineHeight: '1.2'
                                        }}
                                        title={`Time slot booked at ${timeStr}`}
                                    >
                                        {timeStr}
                                    </div>
                                );
                            })}
                            {activeAppointments.length > 3 && (
                                <div style={{
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    fontSize: '9px',
                                    padding: '2px 4px',
                                    borderRadius: '3px',
                                    fontWeight: '600'
                                }}>
                                    +{activeAppointments.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                    {/* Status indicator dot - only for patient's own appointments */}
                    {hasAppointments && (
                        <div style={{
                            position: 'absolute',
                            bottom: '5px',
                            right: '5px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: dayAppointments.some(a => a.status === 'scheduled' || a.status === 'confirmed') ? '#28a745' : '#dc3545'
                        }}></div>
                    )}
                </div>
            );
        }
        
        return [...weekDayElements, ...days];
    };

    const renderAppointmentList = (appointmentsList) => {
        if (appointmentsList.length === 0) {
            const emptyMessage = filter === 'requested' 
                ? 'No appointment requests found' 
                : filter === 'upcoming'
                ? 'No upcoming appointments'
                : filter === 'past'
                ? 'No past appointments'
                : 'No appointments scheduled';
            
            return (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '40px 20px',
                    color: '#6c757d'
                }}>
                    <p>{emptyMessage}</p>
                </div>
            );
        }

        return appointmentsList.map(apt => {
            const isRequest = apt.isRequest || filter === 'requested';
            const startDate = new Date(apt.scheduled_start || apt.preferred_start);
            const endDate = new Date(apt.scheduled_end || apt.preferred_end);
            const itemId = isRequest ? apt.request_id : apt.appointment_id;

            return (
                <div key={itemId} style={{
                    background: 'white',
                    padding: '20px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                }}>
                    {/* Status badge - top right */}
                    <span style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        background: isRequest 
                            ? (apt.status === 'pending' ? '#ffc107' : 
                               apt.status === 'approved' ? '#28a745' : 
                               apt.status === 'declined' ? '#dc3545' : '#6c757d')
                            : (apt.status === 'scheduled' || apt.status === 'confirmed' ? '#28a745' : 
                               apt.status === 'completed' ? '#28a745' : 
                               apt.status === 'cancelled' ? '#dc3545' : '#6c757d'),
                        color: 'white',
                        zIndex: 10
                    }}>
                        {isRequest ? apt.status.toUpperCase() : apt.status.toUpperCase()}
                    </span>

                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333', paddingRight: '100px' }}>
                            {isRequest ? 'Appointment Request' : (apt.patient_name || 'N/A')}
                        </h3>
                        <strong style={{ color: '#D84040' }}>
                            {startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </strong>
                        <div style={{ marginTop: '8px', color: '#A31D1D' }}>
                            <span style={{ marginRight: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AccessTime fontSize="small" /> {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span style={{ marginRight: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}><LocationOn fontSize="small" /> {apt.facility_name || 'N/A'}</span>
                            {!isRequest && apt.provider_name && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><LocalHospital fontSize="small" /> {apt.provider_name}</span>
                            )}
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            {!isRequest && (
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#D84040',
                                    color: 'white',
                                    fontSize: '12px',
                                    marginRight: '8px'
                                }}>
                                    {formatAppointmentType(apt.appointment_type || 'general')}
                                </span>
                            )}
                            {isRequest && apt.appointment_id && (
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: '#28a745',
                                    color: 'white',
                                    fontSize: '12px',
                                    marginLeft: '8px'
                                }}>
                                    APPOINTMENT CREATED
                                </span>
                            )}
                        </div>
                        {apt.notes && (
                            <div style={{ marginTop: '10px', color: '#A31D1D', fontSize: '14px' }}>
                                <strong>Notes:</strong> {apt.notes}
                            </div>
                        )}
                        {isRequest && apt.decline_reason && (
                            <div style={{ marginTop: '10px', padding: '10px', background: '#fef2f2', borderRadius: '4px', color: '#991b1b', fontSize: '14px' }}>
                                <strong>Decline Reason:</strong> {apt.decline_reason}
                            </div>
                        )}
                    </div>
                    <div style={{ marginTop: '15px' }}>
                        {/* For requests, don't show action buttons - they're pending approval */}
                        {isRequest ? (
                            <div style={{ 
                                padding: '10px', 
                                background: '#fff3cd', 
                                borderRadius: '4px', 
                                color: '#856404',
                                fontSize: '14px'
                            }}>
                                {apt.status === 'pending' && '⏳ Awaiting case manager approval'}
                                {apt.status === 'approved' && '✅ Request approved - appointment created'}
                                {apt.status === 'declined' && '❌ Request declined'}
                            </div>
                        ) : (
                        /* Check if this appointment belongs to the current user */
                        (() => {
                            // For patients: only show buttons for their own appointments
                            // For physicians: show buttons for all appointments
                            const isPatientOwnAppointment = currentUserRole === 'patient' 
                                ? (apt.patient_id === currentPatientId) 
                                : true; // Physicians can manage all appointments
                            
                            if (!isPatientOwnAppointment) {
                                return null; // Don't show buttons if patient doesn't own this appointment
                            }

                            // Determine which buttons to show based on role and status
                            const isConfirmed = apt.status === 'confirmed';
                            const isActiveStatus = apt.status === 'scheduled' || 
                                                   apt.status === 'confirmed' || 
                                                   apt.status === 'pending_provider_confirmation' || 
                                                   apt.status === 'pending_patient_confirmation';
                            const isCompletedOrCancelled = apt.status === 'completed' || apt.status === 'cancelled';

                            // Patients can only edit/cancel if NOT confirmed
                            // Physicians can edit/cancel any active appointment
                            const canEdit = isActiveStatus && !isCompletedOrCancelled && 
                                          (currentUserRole !== 'patient' || !isConfirmed);
                            const canCancel = isActiveStatus && !isCompletedOrCancelled && 
                                            (currentUserRole !== 'patient' || !isConfirmed);

                            if (!canEdit && !canCancel) {
                                return null;
                            }

                            return (
                                <>
                                    {canEdit && (
                                        <button 
                                            onClick={() => handleEditAppointment(apt)}
                                            style={{
                                                padding: '8px 16px',
                                                marginRight: '8px',
                                                background: '#D84040',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#b83232'}
                                            onMouseLeave={(e) => e.target.style.background = '#D84040'}
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button 
                                            onClick={() => handleDeleteAppointment(apt.appointment_id)}
                                            style={{
                                                padding: '8px 16px',
                                                background: '#dc3545',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                transition: 'background 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => e.target.style.background = '#c82333'}
                                            onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </>
                            );
                        })()
                        )}
                    </div>
                </div>
            );
        });
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showNotificationDropdown && !event.target.closest('.notification-container')) {
                setShowNotificationDropdown(false);
            }
        };

        if (showNotificationDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotificationDropdown]);

    return (
        <div className="appointments-main" style={{ padding: '20px' }}>
            {/* Header with Title and Notification Icon */}
            <div className="appointments-header" style={{ 
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '10px'
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#A31D1D', fontSize: 'clamp(20px, 4vw, 28px)', fontWeight: 'bold' }}>My Appointments</h2>
                    <p style={{ margin: '5px 0 0 0', color: '#A31D1D', fontSize: 'clamp(12px, 2vw, 14px)' }}>View and manage your appointments</p>
                </div>
                <div className="notification-container" style={{ position: 'relative' }}>
                    <button
                        onClick={() => {
                            setShowNotificationDropdown(!showNotificationDropdown);
                            if (!showNotificationDropdown) {
                                fetchNotifications();
                            }
                        }}
                        style={{
                            position: 'relative',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#F8F2DE'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        <Bell size={24} color="#D84040" />
                        {unreadCount > 0 && (
                            <span
                                style={{
                                    position: 'absolute',
                                    top: '4px',
                                    right: '4px',
                                    background: '#D84040',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                }}
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    {showNotificationDropdown && (
                        <div className="notification-dropdown" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '8px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            minWidth: '300px',
                            maxWidth: '400px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            zIndex: 1000,
                            border: '1px solid #e9ecef'
                        }}>
                            <div style={{
                                padding: '16px',
                                borderBottom: '1px solid #e9ecef',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#A31D1D', fontWeight: 'bold' }}>Notifications</h3>
                                <button
                                    onClick={() => setShowNotificationDropdown(false)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <X size={18} color="#A31D1D" />
                                </button>
                            </div>
                            <div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#A31D1D' }}>
                                        <p>No notifications</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 10).map((notification) => {
                                        const isRead = notification.read || notification.is_read;
                                        return (
                                            <div
                                                key={notification.id || notification.message_id}
                                                style={{
                                                    padding: '16px',
                                                    borderBottom: '1px solid #f3f4f6',
                                                    background: isRead ? 'white' : '#F8F2DE',
                                                    cursor: 'pointer',
                                                    transition: 'background 0.2s',
                                                }}
                                                onClick={async () => {
                                                    // Mark as read when clicked
                                                    if (!isRead && notification.message_id) {
                                                        try {
                                                            const token = getAuthToken();
                                                            if (token) {
                                                                await fetch(`${API_BASE_URL}/notifications/${notification.message_id}/read`, {
                                                                    method: 'PUT',
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                                fetchNotifications(); // Refresh notifications
                                                            }
                                                        } catch (error) {
                                                            console.error('Error marking notification as read:', error);
                                                        }
                                                    }
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = '#F8F2DE';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = isRead ? 'white' : '#F8F2DE';
                                                }}
                                            >
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '12px'
                                                }}>
                                                    <div style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        borderRadius: '50%',
                                                        background: isRead ? 'transparent' : '#D84040',
                                                        marginTop: '6px',
                                                        flexShrink: 0
                                                    }} />
                                                    <div style={{ flex: 1 }}>
                                                        <strong style={{
                                                            fontSize: '14px',
                                                            color: '#A31D1D',
                                                            display: 'block',
                                                            marginBottom: '4px'
                                                        }}>
                                                            {notification.title || notification.subject || notification.message?.substring(0, 50)}
                                                        </strong>
                                                        <p style={{
                                                            fontSize: '13px',
                                                            color: '#A31D1D',
                                                            margin: '4px 0',
                                                            lineHeight: '1.5',
                                                        }}>
                                                            {notification.message || notification.body}
                                                        </p>
                                                        {notification.type === 'appointment_declined' && notification.decline_reason && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                padding: '8px',
                                                                background: '#fef2f2',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#991b1b',
                                                                border: '1px solid #fecaca',
                                                            }}>
                                                                <strong>Decline Reason:</strong> {notification.decline_reason}
                                                            </div>
                                                        )}
                                                        {notification.appointment && (
                                                            <div style={{
                                                                marginTop: '8px',
                                                                padding: '8px',
                                                                background: '#f9fafb',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#A31D1D',
                                                            }}>
                                                                <div>Type: {notification.appointment.appointment_type?.replace('_', ' ').toUpperCase()}</div>
                                                                <div>Date: {new Date(notification.appointment.scheduled_start).toLocaleDateString()}</div>
                                                            </div>
                                                        )}
                                                        <p style={{
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            margin: '8px 0 0 0'
                                                        }}>
                                                            {new Date(notification.timestamp || notification.created_at || notification.sent_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Filter Buttons */}
            <div style={{
                marginBottom: '20px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                <button
                    onClick={() => {
                        setFilter('all');
                        navigate('/my-appointments');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'all' ? '#A31D1D' : 'white',
                        color: filter === 'all' ? 'white' : '#A31D1D',
                        border: '2px solid #A31D1D',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'all') {
                            e.target.style.background = '#F8F2DE';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'all') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    All
                </button>
                <button
                    onClick={() => {
                        setFilter('upcoming');
                        navigate('/my-appointments?filter=upcoming');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'upcoming' ? '#A31D1D' : 'white',
                        color: filter === 'upcoming' ? 'white' : '#A31D1D',
                        border: '2px solid #A31D1D',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'upcoming') {
                            e.target.style.background = '#F8F2DE';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'upcoming') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    Upcoming
                </button>
                <button
                    onClick={() => {
                        setFilter('past');
                        navigate('/my-appointments?filter=past');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'past' ? '#A31D1D' : 'white',
                        color: filter === 'past' ? 'white' : '#A31D1D',
                        border: '2px solid #A31D1D',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'past') {
                            e.target.style.background = '#F8F2DE';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'past') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    Past
                </button>
                {currentUserRole === 'patient' && (
                    <button
                        onClick={() => {
                            setFilter('requested');
                            navigate('/my-appointments?filter=requested');
                        }}
                        style={{
                            padding: '8px 16px',
                            background: filter === 'requested' ? '#A31D1D' : 'white',
                            color: filter === 'requested' ? 'white' : '#A31D1D',
                            border: '2px solid #A31D1D',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                            if (filter !== 'requested') {
                                e.target.style.background = '#F8F2DE';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (filter !== 'requested') {
                                e.target.style.background = 'white';
                            }
                        }}
                    >
                        Requested
                        {appointmentRequests.filter(r => r.status === 'pending').length > 0 && (
                            <span style={{
                                marginLeft: '8px',
                                background: '#28a745',
                                color: 'white',
                                borderRadius: '10px',
                                padding: '2px 6px',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}>
                                {appointmentRequests.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </button>
                )}
            </div>

            {/* 2-Column Layout */}
            <div className="appointments-container" style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                alignItems: 'start'
            }}>
                {/* Left Column - Calendar */}
                <div style={{ 
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    minWidth: '280px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '20px' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button 
                                onClick={() => navigateMonth('prev')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginRight: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                                <ChevronLeft size={20} color="#007bff" />
                            </button>
                            <h3 style={{ margin: 0, color: '#333' }}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button 
                                onClick={() => navigateMonth('next')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    marginLeft: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '5px',
                                    borderRadius: '4px',
                                    transition: 'background 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                                onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                                <ChevronRight size={20} color="#007bff" />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            style={{
                                padding: '8px 16px',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                            onMouseLeave={(e) => e.target.style.background = '#007bff'}
                        >
                            Book Appointment
                        </button>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '5px',
                        overflowX: 'auto'
                    }}>
                        {renderCalendar()}
                    </div>
                </div>

                {/* Right Column - Time Slots and Appointments List */}
                <div style={{ 
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    maxHeight: 'calc(100vh - 200px)',
                    overflowY: 'auto',
                    minWidth: '280px'
                }}>
                    {/* Time Slots View - Show at the top automatically */}
                    {selectedDay && currentUserRole === 'patient' && (() => {
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                        const timeSlots = getTimeSlotAvailability(dateStr);
                        
                        if (timeSlots.length === 0 && selectedDateSlots.length === 0) {
                            return null; // Don't show if no slots available
                        }
                        
                        // Group by provider and facility
                        const groupedByProvider = {};
                        timeSlots.forEach(slot => {
                            const key = `${slot.provider_id || 'no-provider'}_${slot.facility_id}`;
                            if (!groupedByProvider[key]) {
                                groupedByProvider[key] = {
                                    provider_name: slot.provider_name,
                                    facility_name: slot.facility_name,
                                    slots: []
                                };
                            }
                            groupedByProvider[key].slots.push(slot);
                        });
                        
                        return (
                            <div style={{ marginBottom: '30px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold' }}>
                                    Time Slot Availability
                                </h4>

                                {/* Show grouped time slots */}
                                {Object.keys(groupedByProvider).length > 0 ? (
                                    Object.values(groupedByProvider).map((group, groupIndex) => {
                                        // Group consecutive intervals of the same status
                                        const groupedSlots = [];
                                        let currentGroup = null;
                                        
                                        group.slots.forEach(slot => {
                                            if (!currentGroup || currentGroup.isBooked !== slot.isBooked) {
                                                if (currentGroup) {
                                                    groupedSlots.push(currentGroup);
                                                }
                                                currentGroup = {
                                                    start: slot.start,
                                                    end: slot.end,
                                                    isBooked: slot.isBooked
                                                };
                                            } else {
                                                currentGroup.end = slot.end;
                                            }
                                        });
                                        if (currentGroup) {
                                            groupedSlots.push(currentGroup);
                                        }
                                        
                                        return (
                                            <div key={groupIndex} style={{ marginBottom: '20px' }}>
                                                <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                                    {group.provider_name} - {group.facility_name}
                                                </div>
                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                                                    gap: '8px' 
                                                }}>
                                                {groupedSlots.map((slot, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!slot.isBooked) {
                                                                setShowAddModal(true);
                                                            }
                                                        }}
                                                        disabled={slot.isBooked}
                                                        style={{
                                                            padding: '12px',
                                                            border: `2px solid ${slot.isBooked ? '#dc3545' : '#28a745'}`,
                                                            borderRadius: '6px',
                                                            background: slot.isBooked ? '#fff5f5' : '#28a745',
                                                            color: slot.isBooked ? '#dc3545' : 'white',
                                                            cursor: slot.isBooked ? 'not-allowed' : 'pointer',
                                                            textAlign: 'center',
                                                            transition: 'all 0.2s ease',
                                                            opacity: slot.isBooked ? 0.7 : 1,
                                                            fontWeight: '600',
                                                            fontSize: '13px',
                                                            boxShadow: slot.isBooked ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
                                                            width: '100%'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!slot.isBooked) {
                                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                                e.currentTarget.style.background = '#22c55e';
                                                                e.currentTarget.style.borderColor = '#22c55e';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!slot.isBooked) {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                e.currentTarget.style.background = '#28a745';
                                                                e.currentTarget.style.borderColor = '#28a745';
                                                            }
                                                        }}
                                                        title={slot.isBooked ? 'This time slot is already booked' : 'Click to book this time slot'}
                                                    >
                                                        <div style={{ 
                                                            fontSize: '14px', 
                                                            fontWeight: 'bold',
                                                            marginBottom: '4px'
                                                        }}>
                                                            {formatTimeToAMPM(slot.start)}
                                                        </div>
                                                        <div style={{ 
                                                            fontSize: '12px',
                                                            opacity: 0.9
                                                        }}>
                                                            to {formatTimeToAMPM(slot.end)}
                                                        </div>
                                                        {slot.isBooked && (
                                                            <div style={{ 
                                                                fontSize: '10px',
                                                                marginTop: '4px',
                                                                fontWeight: 'bold',
                                                                opacity: 0.8
                                                            }}>
                                                                BOOKED
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ 
                                        padding: '20px', 
                                        textAlign: 'center', 
                                        color: '#6c757d',
                                        fontSize: '14px'
                                    }}>
                                        No availability slots found for this date
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                            Loading appointments...
                        </div>
                    ) : (
                        renderAppointmentList(filteredAppointments)
                    )}
                </div>
            </div>

            {/* Add Appointment Modal */}
            {showAddModal && (
                <MyAppointmentModal
                    mode="add"
                    facilities={facilities}
                    providers={providers}
                    currentUserRole={currentUserRole}
                    currentPatientId={currentPatientId}
                    currentProviderId={currentProviderId}
                    onClose={() => setShowAddModal(false)}
                    onSave={handleAddAppointment}
                />
            )}

            {/* Edit Appointment Modal */}
            {showEditModal && selectedAppointment && (
                <MyAppointmentModal
                    mode="edit"
                    appointment={selectedAppointment}
                    facilities={facilities}
                    providers={providers}
                    currentUserRole={currentUserRole}
                    currentPatientId={currentPatientId}
                    currentProviderId={currentProviderId}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedAppointment(null);
                    }}
                    onSave={handleUpdateAppointment}
                />
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
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
                    animation: 'slideIn 0.3s ease',
                    zIndex: 9999
                }}>
                    {toast.type === 'success' ? (
                        <Check size={20} />
                    ) : (
                        <Trash2 size={20} />
                    )}
                    <span style={{ fontSize: '14px' }}>{toast.message}</span>
                </div>
            )}

            {/* Add keyframes for animation and responsive styles */}
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
                
                @media (max-width: 768px) {
                    /* Reduce padding on mobile */
                    .appointments-main {
                        padding: 10px !important;
                    }
                    
                    /* Stack layout on mobile */
                    .appointments-container {
                        grid-template-columns: 1fr !important;
                        gap: 15px !important;
                    }
                    
                    /* Smaller calendar cells on mobile */
                    .calendar-day {
                        height: 60px !important;
                        padding: 8px !important;
                        font-size: 12px !important;
                    }
                    
                    /* Full width modals on mobile */
                    .appointment-modal {
                        width: 95% !important;
                        max-width: 95% !important;
                        padding: 20px !important;
                    }
                    
                    /* Stack form fields on mobile */
                    .form-grid {
                        grid-template-columns: 1fr !important;
                    }
                    
                    /* Notification dropdown full width on mobile */
                    .notification-dropdown {
                        min-width: calc(100vw - 40px) !important;
                        max-width: calc(100vw - 40px) !important;
                        right: -10px !important;
                    }
                    
                    /* Responsive header */
                    .appointments-header {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                    }
                    
                    .notification-container {
                        align-self: flex-end !important;
                        margin-top: 10px;
                    }
                }
                
                @media (max-width: 480px) {
                    .calendar-day {
                        height: 50px !important;
                        padding: 5px !important;
                        font-size: 11px !important;
                    }
                    
                    .notification-dropdown {
                        min-width: calc(100vw - 20px) !important;
                        max-width: calc(100vw - 20px) !important;
                        right: -5px !important;
                    }
                }
            `}</style>
        </div>
    );
};

const MyAppointmentModal = ({ mode, appointment, facilities, providers: initialProviders, currentUserRole, currentPatientId, currentProviderId, onClose, onSave }) => {
    const parseDateTime = (dateTimeString) => {
        if (!dateTimeString) return { date: '', startTime: '', endTime: '' };
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) {
            const parts = dateTimeString.split(' ');
            if (parts.length === 2) {
                return {
                    date: parts[0],
                    startTime: parts[1].slice(0, 5),
                    endTime: ''
                };
            }
            return { date: '', startTime: '', endTime: '' };
        }
        return {
            date: date.toISOString().split('T')[0],
            startTime: date.toTimeString().slice(0, 5),
            endTime: ''
        };
    };

    const parsedDateTime = appointment ? parseDateTime(appointment.scheduled_start) : { date: '', startTime: '', endTime: '' };
    
    // Calculate end time from appointment if available
    let endTime = '';
    if (appointment && appointment.scheduled_end) {
        const endDate = new Date(appointment.scheduled_end);
        endTime = endDate.toTimeString().slice(0, 5);
    }

    const [formData, setFormData] = useState(
        appointment ? {
            facility_id: appointment.facility_id,
            provider_id: appointment.provider_id || '',
            appointment_type: appointment.appointment_type,
            appointmentDate: parsedDateTime.date,
            appointmentTime: parsedDateTime.startTime,
            appointmentEndTime: endTime || '',
            duration_minutes: appointment.duration_minutes || 30,
            reason: appointment.reason || '',
            notes: appointment.notes || ''
        } : {
            facility_id: '',
            provider_id: '',
            appointment_type: '',
            appointmentDate: '',
            appointmentTime: '',
            appointmentEndTime: '',
            duration_minutes: 30,
            reason: '',
            notes: ''
        }
    );

    const [providers, setProviders] = useState(initialProviders || []);
    const getAuthToken = () => localStorage.getItem('token');

    // Fetch providers when facility changes
    useEffect(() => {
        if (formData.facility_id) {
            console.log('Fetching providers for facility:', formData.facility_id);
            fetch(`${API_BASE_URL}/doctor-assignments/providers?facility_id=${formData.facility_id}`, {
                headers: { Authorization: `Bearer ${getAuthToken()}` }
            })
            .then(res => {
                console.log('Provider fetch response status:', res.status);
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                console.log('Provider fetch data:', data);
                if (data.success && data.providers) {
                    console.log('Setting providers:', data.providers.length);
                    setProviders(data.providers);
                } else {
                    console.warn('No providers found or invalid response:', data);
                    setProviders([]);
                }
            })
            .catch(err => {
                console.error('Error fetching providers:', err);
                setProviders([]);
            });
        } else {
            setProviders(initialProviders || []);
        }
    }, [formData.facility_id, initialProviders]);

    // Calculate minimum date (today - allow same-day appointments)
    const getMinDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Calculate duration from time range if end time is provided
        if (formData.appointmentEndTime) {
            const start = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
            const end = new Date(`${formData.appointmentDate}T${formData.appointmentEndTime}`);
            const durationMinutes = Math.round((end - start) / 60000);
            if (durationMinutes > 0) {
                formData.duration_minutes = durationMinutes;
            }
        }
        onSave(formData);
    };

    const handleChange = (e) => {
        const newFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        
        // Auto-calculate end time when start time or duration changes
        if (e.target.name === 'appointmentTime' || e.target.name === 'duration_minutes') {
            if (newFormData.appointmentDate && newFormData.appointmentTime && newFormData.duration_minutes) {
                const start = new Date(`${newFormData.appointmentDate}T${newFormData.appointmentTime}`);
                const end = new Date(start.getTime() + (newFormData.duration_minutes * 60000));
                newFormData.appointmentEndTime = end.toTimeString().slice(0, 5);
            }
        }
        
        // Auto-calculate duration when end time changes
        if (e.target.name === 'appointmentEndTime' && newFormData.appointmentDate && newFormData.appointmentTime) {
            const start = new Date(`${newFormData.appointmentDate}T${newFormData.appointmentTime}`);
            const end = new Date(`${newFormData.appointmentDate}T${newFormData.appointmentEndTime}`);
            const durationMinutes = Math.round((end - start) / 60000);
            if (durationMinutes > 0) {
                newFormData.duration_minutes = durationMinutes;
            }
        }
        
        setFormData(newFormData);
    };

    return (
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
            zIndex: 1000,
            paddingTop: '64px'
        }}>
            <div className="appointment-modal" style={{
                background: 'white',
                padding: '30px',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '600px',
                maxHeight: 'calc(100vh - 104px)',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0 }}>
                        {mode === 'add' ? 'Book Appointment' : 'Edit Appointment'}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '4px',
                            transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                        <X size={24} color="#6c757d" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Date <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input 
                            type="date"
                            name="appointmentDate"
                            value={formData.appointmentDate}
                            onChange={handleChange}
                            required
                            min={getMinDate()}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Start Time <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="time"
                                name="appointmentTime"
                                value={formData.appointmentTime}
                                onChange={handleChange}
                                required
                                step="3600"
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
                                End Time <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input 
                                type="time"
                                name="appointmentEndTime"
                                value={formData.appointmentEndTime}
                                onChange={handleChange}
                                required
                                step="3600"
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
                            Facility <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select 
                            name="facility_id"
                            value={formData.facility_id}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">Select Facility</option>
                            {facilities.map(facility => (
                                <option key={facility.facility_id} value={facility.facility_id}>
                                    {facility.facility_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentUserRole === 'patient' && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Provider (Doctor) - From Doctor Assignments
                            </label>
                            <select 
                                name="provider_id"
                                value={formData.provider_id}
                                onChange={handleChange}
                                disabled={!formData.facility_id}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    backgroundColor: !formData.facility_id ? '#f8f9fa' : 'white'
                                }}
                            >
                                <option value="">
                                    {!formData.facility_id 
                                        ? 'Select Facility First' 
                                        : providers.length === 0 
                                            ? 'No providers available for this facility' 
                                            : 'Select Provider (Optional)'}
                                </option>
                                {providers.map(provider => (
                                    <option key={provider.provider_id || provider.user_id} value={provider.provider_id || provider.user_id}>
                                        {provider.provider_name || provider.full_name || provider.username} {provider.facility_name ? `(${provider.facility_name})` : ''}
                                    </option>
                                ))}
                            </select>
                            {formData.facility_id && providers.length === 0 && (
                                <p style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                                    No providers with active doctor assignments found for this facility. You can still book without selecting a provider.
                                </p>
                            )}
                        </div>
                    )}

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Appointment Type <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select 
                            name="appointment_type"
                            value={formData.appointment_type}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="">Select Type</option>
                            <option value="initial">Initial Consultation</option>
                            <option value="follow_up">Follow-up Consultation</option>
                            <option value="art_pickup">ART Pickup</option>
                            <option value="lab_test">Lab Test</option>
                            <option value="counseling">Counseling</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Duration (minutes) - Auto-calculated from time range
                        </label>
                        <input 
                            type="number"
                            name="duration_minutes"
                            value={formData.duration_minutes}
                            onChange={handleChange}
                            min="15"
                            max="240"
                            step="15"
                            readOnly
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                backgroundColor: '#f8f9fa',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Reason
                        </label>
                        <input 
                            type="text"
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                            Notes
                        </label>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ced4da',
                                borderRadius: '4px',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#5a6268'}
                            onMouseLeave={(e) => e.target.style.background = '#6c757d'}
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
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#0056b3'}
                            onMouseLeave={(e) => e.target.style.background = '#007bff'}
                        >
                            {mode === 'add' ? 'Book Appointment' : 'Update Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyAppointments;

