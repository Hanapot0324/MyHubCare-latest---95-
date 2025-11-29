import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check, Trash2, Bell, Calendar, ArrowUpDown, ChevronDown } from 'lucide-react';
import { AccessTime, LocationOn, LocalHospital } from '@mui/icons-material';
import { API_BASE_URL } from '../config/api';

const MyAppointments = ({ socket }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [appointmentRequests, setAppointmentRequests] = useState([]);
    const [filteredAppointments, setFilteredAppointments] = useState([]);
    const [filter, setFilter] = useState('all'); // 'all', 'upcoming', 'past', 'requested', 'pending', 'confirmed', 'declined'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState(null);
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
    const [showTodayModal, setShowTodayModal] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [sortOrder, setSortOrder] = useState('latest'); // 'latest' (newest first) or 'oldest' (oldest first)
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    
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
    
    // Store dates that have availability slots (for green dot indicators)
    const [datesWithAvailability, setDatesWithAvailability] = useState(new Set());


    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    useEffect(() => {
        // Parallelize independent API calls for faster initial load
        const initializeData = async () => {
            // Read filter from URL query params first (synchronous)
            const params = new URLSearchParams(location.search);
            const urlFilter = params.get('filter');
            if (urlFilter && ['all', 'upcoming', 'past', 'requested', 'pending', 'confirmed', 'declined'].includes(urlFilter)) {
                setFilter(urlFilter);
            }
            
            // Fetch user info first (needed for other calls)
            await getCurrentUser();
            
            // Parallelize independent calls
            await Promise.all([
                fetchFacilities(),
                fetchProviders(),
                fetchNotifications()
            ]);
        };
        
        initializeData();
    }, []);

    // Fetch appointments after current user is loaded (to filter by patient_id)
    useEffect(() => {
        if (currentUserRole && (currentPatientId || currentUserRole !== 'patient')) {
            // Parallelize appointment fetches for faster loading
            Promise.all([
                fetchAppointments(),
                fetchAllAppointmentsForCalendar()
            ]).catch(error => {
                console.error('Error fetching appointments:', error);
            });
        }
        // Also fetch appointment requests for patients (call this independently in parallel)
        if (currentUserRole === 'patient') {
            console.log('Current user is patient, fetching appointment requests...');
            fetchAppointmentRequests().catch(error => {
                console.error('Error fetching appointment requests:', error);
            });
        } else {
            console.log('Current user is not patient, role:', currentUserRole);
        }
    }, [currentUserRole, currentPatientId]);

    // Apply filter when appointments, requests, filter, or sortOrder changes
    useEffect(() => {
        applyFilter();
    }, [appointments, appointmentRequests, filter, sortOrder]);

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
            const handleNotification = (data) => {
                console.log('New notification received:', data);
                fetchNotifications();
                
                // If notification is about appointment requests, refresh the requests list
                if (data.type === 'appointment_request_approved' || 
                    data.type === 'appointment_request_declined' ||
                    data.type === 'appointment_request' ||
                    data.type === 'appointment_created') {
                    console.log('🔄 Notification related to appointment request, refreshing...');
                    
                    // Immediately update local state if we have the data
                    if (data.type === 'appointment_request_approved' && data.payload) {
                        // Update request status immediately
                        setAppointmentRequests(prev => prev.map(req => {
                            if (req.request_id === data.payload.request_id) {
                                return { ...req, status: 'approved', appointment_id: data.payload.appointment_id };
                            }
                            return req;
                        }));
                        
                        // Add new appointment if provided
                        if (data.payload.appointment) {
                            setAppointments(prev => {
                                // Check if appointment already exists
                                const exists = prev.some(apt => apt.appointment_id === data.payload.appointment.appointment_id);
                                if (!exists) {
                                    return [...prev, data.payload.appointment];
                                }
                                return prev;
                            });
                        }
                    } else if (data.type === 'appointment_request_declined' && data.payload) {
                        // Update request status immediately
                        setAppointmentRequests(prev => prev.map(req => {
                            if (req.request_id === data.payload.request_id) {
                                return { ...req, status: 'declined', decline_reason: data.payload.decline_reason };
                            }
                            return req;
                        }));
                    }
                    
                    // Then refresh from API to ensure consistency
                    if (currentUserRole === 'patient') {
                        fetchAppointmentRequests();
                    }
                    fetchAppointments();
                    fetchAllAppointmentsForCalendar();
                }
            };

            socket.on('newNotification', handleNotification);

            return () => {
                socket.off('newNotification', handleNotification);
            };
        }
    }, [socket, currentUserRole]);

    // Listen for real-time appointment request updates
    useEffect(() => {
        if (socket && currentUserRole === 'patient' && currentUser?.user_id) {
            const handleRequestUpdate = (data) => {
                console.log('🔄 Appointment request updated via socket:', data);
                
                // Immediately update local state
                if (data.request_id) {
                    if (data.action === 'approved') {
                        // Update request status immediately
                        setAppointmentRequests(prev => prev.map(req => {
                            if (req.request_id === data.request_id) {
                                return { 
                                    ...req, 
                                    status: 'approved', 
                                    appointment_id: data.appointment_id || req.appointment_id 
                                };
                            }
                            return req;
                        }));
                        
                        // Add new appointment if provided
                        if (data.appointment) {
                            setAppointments(prev => {
                                const exists = prev.some(apt => apt.appointment_id === data.appointment.appointment_id);
                                if (!exists) {
                                    return [...prev, data.appointment];
                                }
                                return prev.map(apt => 
                                    apt.appointment_id === data.appointment.appointment_id 
                                        ? data.appointment 
                                        : apt
                                );
                            });
                        }
                    } else if (data.action === 'declined') {
                        // Update request status immediately
                        setAppointmentRequests(prev => prev.map(req => {
                            if (req.request_id === data.request_id) {
                                return { 
                                    ...req, 
                                    status: 'declined', 
                                    decline_reason: data.decline_reason 
                                };
                            }
                            return req;
                        }));
                    } else if (data.action === 'cancelled') {
                        // Remove cancelled request from list
                        setAppointmentRequests(prev => prev.filter(req => req.request_id !== data.request_id));
                    }
                }
                
                // Then refresh from API to ensure consistency
                fetchAppointmentRequests();
                // Also refresh appointments in case a request was approved and created an appointment
                if (data.action === 'approved' || data.action === 'created') {
                    fetchAppointments();
                    fetchAllAppointmentsForCalendar();
                } else {
                    // For declined/cancelled, still refresh to update the list
                    fetchAppointments();
                }
            };

            socket.on('appointmentRequestUpdated', handleRequestUpdate);
            console.log('✅ Listening for appointmentRequestUpdated events for patient:', currentUser.user_id);

            return () => {
                socket.off('appointmentRequestUpdated', handleRequestUpdate);
                console.log('❌ Stopped listening for appointmentRequestUpdated events');
            };
        }
    }, [socket, currentUserRole, currentUser]);


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
                    
                    // If user is a patient, get their patient_id and fetch requests
                    if (user.role === 'patient') {
                        console.log('👤 User is patient, fetching appointment requests immediately...');
                        // Fetch requests immediately after role is set (pass role to avoid state timing issues)
                        fetchAppointmentRequests(user.role);
                        
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

        console.log('applyFilter called - currentUserRole:', currentUserRole, 'appointmentRequests:', appointmentRequests.length, 'appointments:', appointments.length, 'filter:', filter);

        // Convert appointment requests to display format
        // Exclude requests that have been converted to appointments (have appointment_id)
        const formattedRequests = currentUserRole === 'patient' ? appointmentRequests
            .filter(req => !req.appointment_id) // Exclude requests that have been converted to appointments
            .map(req => {
                // Construct datetime from requested_date and requested_time
                const scheduledStart = req.requested_date && req.requested_time 
                    ? `${req.requested_date} ${req.requested_time}` 
                    : (req.requested_date ? `${req.requested_date} 09:00:00` : null);
                const scheduledEnd = scheduledStart ? (() => {
                    // Calculate end time (default 1 hour later)
                    const start = new Date(scheduledStart);
                    // Check if date is valid before using it
                    if (isNaN(start.getTime())) {
                        console.warn('Invalid date in appointment request:', req.request_id, 'requested_date:', req.requested_date, 'requested_time:', req.requested_time);
                        return null;
                    }
                    const end = new Date(start.getTime() + 60 * 60 * 1000);
                    // Check if end date is valid
                    if (isNaN(end.getTime())) {
                        console.warn('Invalid end date calculated for request:', req.request_id);
                        return null;
                    }
                    return end.toISOString().slice(0, 19).replace('T', ' ');
                })() : null;
                
                return {
                    ...req,
                    isRequest: true,
                    scheduled_start: scheduledStart || req.requested_date,
                    scheduled_end: scheduledEnd || req.requested_date,
                    patient_name: 'You',
                    status: req.status || 'pending', // Ensure status is set to 'pending' if not provided
                    appointment_type: req.appointment_type || 'request',
                    request_id: req.request_id
                };
            }) : [];

        console.log('formattedRequests:', formattedRequests.length);

        // Combine appointments and requests for status-based filtering
        const allItems = [
            ...appointments.map(apt => ({ ...apt, isRequest: false })),
            ...formattedRequests
        ];

        if (filter === 'requested') {
            // Show all appointment requests for patients
            if (currentUserRole === 'patient') {
                filtered = formattedRequests;
            }
        } else if (filter === 'pending') {
            // Show only pending items (requests and appointments)
            filtered = allItems.filter(item => {
                if (item.isRequest) {
                    return item.status === 'pending' || !item.status;
                } else {
                    return item.status === 'pending' || item.status === 'pending_provider_confirmation' || item.status === 'pending_patient_confirmation';
                }
            });
        } else if (filter === 'confirmed') {
            // Show only confirmed/scheduled appointments
            // Exclude approved requests that have been converted to appointments (they're already in appointments list)
            filtered = allItems.filter(item => {
                if (item.isRequest) {
                    // Only show approved requests that haven't been converted to appointments yet
                    return item.status === 'approved' && !item.appointment_id;
                } else {
                    return item.status === 'confirmed' || item.status === 'scheduled';
                }
            });
        } else if (filter === 'declined') {
            // Show only declined requests and cancelled appointments
            filtered = allItems.filter(item => {
                if (item.isRequest) {
                    return item.status === 'declined';
                } else {
                    return item.status === 'cancelled';
                }
            });
        } else {
            // Filter appointments by time-based criteria
            filtered = appointments.filter(apt => {
                if (!apt.scheduled_start) {
                    console.warn('Appointment missing scheduled_start:', apt.appointment_id);
                    return false; // Exclude appointments without scheduled_start
                }
                const aptDate = new Date(apt.scheduled_start);
                
                // Validate date
                if (isNaN(aptDate.getTime())) {
                    console.warn('Invalid scheduled_start date in appointment:', apt.appointment_id, 'scheduled_start:', apt.scheduled_start);
                    return false; // Exclude invalid dates
                }
                
                if (filter === 'upcoming') {
                    return aptDate >= now && (apt.status === 'scheduled' || apt.status === 'confirmed');
                } else if (filter === 'past') {
                    return aptDate < now || apt.status === 'completed';
                } else {
                    // 'all' - show all appointments
                    return true;
                }
            });

            // Include appointment requests in 'all' and 'upcoming' filters
            // Exclude requests that have been converted to appointments (already in appointments list)
            if (currentUserRole === 'patient' && (filter === 'all' || filter === 'upcoming')) {
                // Add requests to the filtered list (all statuses for 'all', only pending for 'upcoming')
                // Note: formattedRequests already excludes requests with appointment_id
                const requestsToAdd = formattedRequests.filter(req => {
                    const dateStr = req.scheduled_start || (req.requested_date ? `${req.requested_date} ${req.requested_time || '09:00:00'}` : null);
                    const reqDate = dateStr ? new Date(dateStr) : null;
                    // Validate date before using it
                    if (reqDate && isNaN(reqDate.getTime())) {
                        console.warn('Invalid date in request filter:', req.request_id, 'dateStr:', dateStr);
                        return false; // Exclude invalid dates
                    }
                    if (filter === 'upcoming') {
                        // Only show pending requests with future dates
                        return reqDate && (req.status === 'pending' || !req.status) && reqDate >= now;
                    } else {
                        // Show all requests in 'all' filter (pending, approved, declined, etc.)
                        // But exclude approved requests that have appointment_id (they're already appointments)
                        return !(req.status === 'approved' && req.appointment_id);
                    }
                });
                console.log('Adding requests to filter:', requestsToAdd.length);
                filtered = [...filtered, ...requestsToAdd];
            }
        }

        // Sort by scheduled_start/requested_date date based on sortOrder
        filtered.sort((a, b) => {
            const dateStrA = a.scheduled_start || (a.requested_date ? `${a.requested_date} ${a.requested_time || '09:00:00'}` : null);
            const dateStrB = b.scheduled_start || (b.requested_date ? `${b.requested_date} ${b.requested_time || '09:00:00'}` : null);
            const dateA = dateStrA ? new Date(dateStrA) : null;
            const dateB = dateStrB ? new Date(dateStrB) : null;
            
            // Handle invalid dates - put them at the end
            if (!dateA || isNaN(dateA.getTime())) {
                return 1; // Put invalid dates at the end
            }
            if (!dateB || isNaN(dateB.getTime())) {
                return -1; // Put invalid dates at the end
            }
            
            return sortOrder === 'latest' ? dateB - dateA : dateA - dateB;
        });

        console.log('Final filtered appointments/requests:', filtered.length, filtered.map(f => ({ 
            id: f.request_id || f.appointment_id, 
            isRequest: f.isRequest, 
            status: f.status,
            patient: f.patient_name 
        })));

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

    const fetchAppointmentRequests = async (roleOverride = null) => {
        try {
            const roleToCheck = roleOverride || currentUserRole;
            console.log('🔍 fetchAppointmentRequests called - currentUserRole:', currentUserRole, 'roleOverride:', roleOverride, 'roleToCheck:', roleToCheck);
            const token = getAuthToken();
            if (!token) {
                console.log('❌ No auth token available for fetching appointment requests');
                return;
            }

            // Only fetch requests for patients
            if (roleToCheck !== 'patient') {
                console.log('❌ Not a patient, skipping appointment requests fetch. Role:', roleToCheck);
                return;
            }

            console.log('✅ Fetching appointment requests for patient...');
            console.log('🔗 API URL:', `${API_BASE_URL}/appointment-requests`);
            
            const response = await fetch(`${API_BASE_URL}/appointment-requests`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('📡 Response status:', response.status, response.statusText);
            console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

            if (!response.ok) {
                let errorText;
                try {
                    errorText = await response.text();
                    console.error('❌ API Error Response:', response.status, errorText);
                    // Try to parse as JSON for better error message
                    try {
                        const errorJson = JSON.parse(errorText);
                        console.error('❌ Parsed Error:', errorJson);
                    } catch (e) {
                        // Not JSON, use as text
                    }
                } catch (e) {
                    errorText = 'Unable to read error response';
                    console.error('❌ Error reading response:', e);
                }
                throw new Error(`Failed to fetch appointment requests: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log('📦 Appointment requests response:', data);
            console.log('📦 Response data length:', data.data?.length || 0);

            if (data.success) {
                // Ensure all requests have a status (default to 'pending' if missing)
                const requests = (data.data || []).map(req => ({
                    ...req,
                    status: req.status || 'pending'
                }));
                console.log('✅ Setting appointment requests:', requests.length, 'requests', requests);
                setAppointmentRequests(requests);
            } else {
                console.error('❌ Failed to fetch appointment requests:', data.message);
                setAppointmentRequests([]);
            }
        } catch (error) {
            console.error('❌ Error fetching appointment requests:', error);
            setAppointmentRequests([]);
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

            console.log('Fetching providers from /users/providers endpoint...', facilityId ? `for facility: ${facilityId}` : '');
            
            // Try /users/providers first (matching DoctorAssignments.jsx)
            let url = `${API_BASE_URL}/users/providers`;
            if (facilityId) {
                url += `?facility_id=${facilityId}`;
            }
            
            let response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If users/providers doesn't work, try doctor-assignments/providers
            if (!response.ok && (response.status === 404 || response.status === 403)) {
                console.log('Trying fallback endpoint /doctor-assignments/providers...');
                url = `${API_BASE_URL}/doctor-assignments/providers`;
                if (facilityId) {
                    url += `?facility_id=${facilityId}`;
                }
                response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Provider fetch response:', data);

            if (data.success) {
                // Handle both response formats (matching DoctorAssignments.jsx)
                if (data.providers) {
                    // Map to consistent format
                    const providersList = data.providers.map(p => ({
                        user_id: p.user_id || p.provider_id,
                        provider_id: p.provider_id || p.user_id,
                        full_name: p.full_name || p.provider_name,
                        provider_name: p.provider_name || p.full_name,
                        username: p.username,
                        email: p.email,
                        role: p.role || 'physician',
                        status: p.status || 'active',
                        facility_id: p.facility_id,
                        facility_name: p.facility_name
                    }));
                    console.log('Setting providers:', providersList.length);
                    setProviders(providersList);
                } else if (data.users) {
                    // Fallback if response has 'users' instead of 'providers'
                    const providersList = data.users
                        .filter(u => u.role?.toLowerCase() === 'physician')
                        .map(p => ({
                            user_id: p.user_id,
                            provider_id: p.user_id,
                            full_name: p.full_name,
                            provider_name: p.full_name,
                            username: p.username,
                            email: p.email,
                            role: p.role,
                            status: p.status,
                            facility_id: p.facility_id,
                            facility_name: p.facility_name
                        }));
                    console.log('Setting providers from users:', providersList.length);
                    setProviders(providersList);
                } else {
                    console.warn('No providers found in response:', data);
                    setProviders([]);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch providers');
            }
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
            const aptDate = new Date(apt.scheduled_start);
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
        // Fetch availability slots and appointments for the selected date in parallel
        if (day) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            // Parallelize these calls for faster response
            Promise.all([
                fetchAvailabilitySlotsForDate(dateStr),
                fetchAppointmentsForDate(dateStr)
            ]).catch(error => {
                console.error('Error fetching day data:', error);
            });
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

            // Fetch all slots for the date (available and unavailable) - no status filter
            const params = new URLSearchParams({ 
                date: dateStr
                // Removed status filter to show both available and unavailable slots
            });

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Show all slots (available, unavailable, and booked) so users can see all slots
                    // Booked slots should be shown but marked as unavailable for booking
                    const allSlots = (data.data || []).filter(slot => 
                        slot.slot_status === 'available' || 
                        slot.slot_status === 'unavailable' || 
                        slot.slot_status === 'booked' ||
                        (slot.appointment_id && slot.appointment_id !== 'available' && slot.appointment_id !== null)
                    );
                    setSelectedDateSlots(allSlots);
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

    // Fetch availability slots for the current month and next 2 months to show green dots
    const fetchAvailabilitySlotsForMonth = async () => {
        try {
            const token = getAuthToken();
            if (!token) {
                console.warn('No auth token available for fetching availability slots');
                return;
            }

            // Calculate date range: current month and next 2 months (3 months total)
            const year = currentMonth.getFullYear();
            const month = currentMonth.getMonth();
            const firstDay = new Date(year, month, 1);
            // Get last day of 2 months ahead
            const lastDay = new Date(year, month + 3, 0);
            
            // Ensure we start from today (don't fetch past dates)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateFrom = firstDay < today ? today.toISOString().split('T')[0] : firstDay.toISOString().split('T')[0];
            const dateTo = lastDay.toISOString().split('T')[0];

            const params = new URLSearchParams({ 
                date_from: dateFrom,
                date_to: dateTo,
                status: 'available'
            });

            const url = `${API_BASE_URL}/appointments/availability/slots?${params}`;
            console.log('Fetching availability slots from:', url);
            console.log('Date range:', { dateFrom, dateTo });

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Availability slots response:', data);
                if (data.success) {
                    // Filter to only show available slots (status = 'available')
                    const availableSlots = (data.data || []).filter(slot => 
                        slot.slot_status === 'available' && 
                        slot.slot_date // Ensure slot_date exists
                    );
                    
                    console.log('Available slots found:', availableSlots.length);
                    console.log('Sample slots:', availableSlots.slice(0, 3));
                    
                    // Extract unique dates that have availability slots
                    const datesSet = new Set();
                    availableSlots.forEach(slot => {
                        if (slot.slot_date) {
                            // Normalize date format - handle both Date objects and strings
                            let dateStr = slot.slot_date;
                            if (dateStr instanceof Date) {
                                // For Date objects, use local date to avoid timezone shifts
                                const year = dateStr.getFullYear();
                                const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                                const day = String(dateStr.getDate()).padStart(2, '0');
                                dateStr = `${year}-${month}-${day}`;
                            } else if (typeof dateStr === 'string') {
                                // If it's already in YYYY-MM-DD format, use it directly
                                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                    // Already in correct format, use as-is
                                    dateStr = dateStr;
                                } else if (dateStr.includes('T')) {
                                    // Extract date part before 'T' to avoid timezone conversion
                                    dateStr = dateStr.split('T')[0];
                                } else {
                                    // Try to parse if not in YYYY-MM-DD format
                                    const parsed = new Date(dateStr);
                                    if (!isNaN(parsed.getTime())) {
                                        // Use local date components to avoid timezone shifts
                                        const year = parsed.getFullYear();
                                        const month = String(parsed.getMonth() + 1).padStart(2, '0');
                                        const day = String(parsed.getDate()).padStart(2, '0');
                                        dateStr = `${year}-${month}-${day}`;
                                    }
                                }
                            }
                            // Store date in YYYY-MM-DD format
                            datesSet.add(dateStr);
                        }
                    });
                    
                    console.log('Dates with availability:', Array.from(datesSet).sort());
                    // Merge with existing dates (don't replace)
                    setDatesWithAvailability(prev => {
                        const merged = new Set([...prev, ...datesSet]);
                        return merged;
                    });
                } else {
                    console.warn('API returned success:false', data.message);
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch availability slots:', response.status, response.statusText, errorText);
            }
        } catch (error) {
            console.error('Error fetching availability slots for month:', error);
        }
    };

    // Fetch all future availability slots on initial mount (non-blocking, limited range)
    useEffect(() => {
        const fetchAllFutureAvailabilitySlots = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                // Limit to 3 months ahead for faster loading (instead of all future dates)
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dateFrom = today.toISOString().split('T')[0];
                const dateTo = new Date();
                dateTo.setMonth(dateTo.getMonth() + 3);
                dateTo.setHours(23, 59, 59, 999);
                const dateToStr = dateTo.toISOString().split('T')[0];

                const params = new URLSearchParams({ 
                    date_from: dateFrom,
                    date_to: dateToStr,
                    status: 'available'
                });

                const url = `${API_BASE_URL}/appointments/availability/slots?${params}`;
                console.log('Fetching availability slots (3 months) from:', url);

                const response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const availableSlots = (data.data || []).filter(slot => 
                            slot.slot_status === 'available' && slot.slot_date
                        );
                        
                        const datesSet = new Set();
                        availableSlots.forEach(slot => {
                            if (slot.slot_date) {
                                let dateStr = slot.slot_date;
                                if (dateStr instanceof Date) {
                                    // For Date objects, use local date to avoid timezone shifts
                                    const year = dateStr.getFullYear();
                                    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                                    const day = String(dateStr.getDate()).padStart(2, '0');
                                    dateStr = `${year}-${month}-${day}`;
                                } else if (typeof dateStr === 'string') {
                                    // If it's already in YYYY-MM-DD format, use it directly
                                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                        // Already in correct format, use as-is
                                        dateStr = dateStr;
                                    } else if (dateStr.includes('T')) {
                                        // Extract date part before 'T' to avoid timezone conversion
                                        dateStr = dateStr.split('T')[0];
                                    } else {
                                        // Try to parse if not in YYYY-MM-DD format
                                        const parsed = new Date(dateStr);
                                        if (!isNaN(parsed.getTime())) {
                                            // Use local date components to avoid timezone shifts
                                            const year = parsed.getFullYear();
                                            const month = String(parsed.getMonth() + 1).padStart(2, '0');
                                            const day = String(parsed.getDate()).padStart(2, '0');
                                            dateStr = `${year}-${month}-${day}`;
                                        }
                                    }
                                }
                                datesSet.add(dateStr);
                            }
                        });
                        
                        console.log('All future dates with availability:', Array.from(datesSet).sort());
                        // Merge with existing dates (don't replace)
                        setDatesWithAvailability(prev => {
                            const merged = new Set([...prev, ...datesSet]);
                            return merged;
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching all future availability slots:', error);
            }
        };

        // Fetch availability slots after a small delay to not block initial render
        // This allows the UI to render first, then load availability data
        const timeoutId = setTimeout(() => {
            fetchAllFutureAvailabilitySlots();
        }, 100);
        
        return () => clearTimeout(timeoutId);
    }, []);

    // Fetch availability slots when month changes (for current view)
    useEffect(() => {
        fetchAvailabilitySlotsForMonth();
    }, [currentMonth]);

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

    const handleCancelRequest = async (requestId) => {
        if (window.confirm('Are you sure you want to cancel this appointment request?')) {
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/appointment-requests/${requestId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    await fetchAppointmentRequests();
                    await fetchAppointments();
                    setToast({
                        message: 'Appointment request cancelled successfully',
                        type: 'success'
                    });
                } else {
                    throw new Error(data.message || 'Failed to cancel appointment request');
                }
            } catch (error) {
                console.error('Error cancelling appointment request:', error);
                setToast({
                    message: 'Failed to cancel appointment request: ' + error.message,
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
                // Module 6: Fixed 60-minute duration
                scheduledEnd = calculateEndTime(newAppointment.appointmentDate, newAppointment.appointmentTime, 60);
            }

            // Validate date is not in the past or today (appointments must be scheduled in advance)
            const startDate = new Date(scheduledStart);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDateOnly = new Date(startDate);
            startDateOnly.setHours(0, 0, 0, 0);

            if (startDateOnly <= today) {
                setToast({
                    message: 'Appointments must be scheduled in advance (not available for today or past dates)',
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

            // For patients, check if the selected date has availability slots
            if (currentUserRole === 'patient') {
                const appointmentDateStr = newAppointment.appointmentDate;
                if (!datesWithAvailability.has(appointmentDateStr)) {
                    setToast({
                        message: 'No availability slots for this date. Please select a date with a green dot indicator on the calendar.',
                        type: 'error'
                    });
                    return;
                }
            }

            // If user is a patient, create an appointment request instead of direct appointment
            if (currentUserRole === 'patient') {
                // Extract date and time from scheduledStart (format: YYYY-MM-DD HH:MM:SS)
                const [datePart, timePart] = scheduledStart.split(' ');
                const requestedDate = datePart;
                const requestedTime = timePart ? timePart.slice(0, 8) : '09:00:00'; // Ensure HH:MM:SS format
                
                const requestData = {
                    facility_id: newAppointment.facility_id,
                    provider_id: newAppointment.provider_id || null,
                    requested_date: requestedDate,
                    requested_time: requestedTime,
                    appointment_type: newAppointment.appointment_type || 'general',
                    patient_notes: newAppointment.notes || null
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
                    // Explicitly fetch appointment requests to ensure pending request is visible
                    await fetchAppointmentRequests();
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
                duration_minutes: 60, // Module 6: Fixed 60-minute duration
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
                scheduled_end: calculateEndTime(updatedAppointment.appointmentDate, updatedAppointment.appointmentTime, 60),
                duration_minutes: 60, // Module 6: Fixed 60-minute duration
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
                
                // Generate 60-minute (hourly) intervals for this slot
                const intervals = generateTimeIntervals(slotStart, slotEnd);
                
                intervals.forEach(interval => {
                    // Check if slot is booked: either has appointment_id, status is 'booked', or overlaps with existing appointment
                    const appointmentId = slot.appointment_id;
                    const hasAppointmentId = appointmentId && 
                        appointmentId !== 'available' && 
                        appointmentId !== null && 
                        appointmentId !== '' &&
                        String(appointmentId).trim().length > 0;
                    const isBookedByStatus = slot.slot_status === 'booked';
                    const isBookedBySlot = hasAppointmentId || isBookedByStatus;
                    const isBookedByAppointment = isTimeSlotBooked(interval.start, interval.end);
                    const isBooked = isBookedBySlot || isBookedByAppointment;
                    availability.push({
                        start: interval.start,
                        end: interval.end,
                        isBooked: isBooked,
                        slot_status: slot.slot_status, // Include slot status
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

    // Helper function to generate hourly (60-minute) time intervals from a slot
    const generateTimeIntervals = (slotStart, slotEnd) => {
        const intervals = [];
        const start = new Date(`2000-01-01 ${slotStart}`);
        const end = new Date(`2000-01-01 ${slotEnd}`);
        
        let current = new Date(start);
        while (current < end) {
            const intervalStart = new Date(current);
            const intervalEnd = new Date(current.getTime() + 60 * 60000); // 60 minutes (1 hour)
            
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
                                facility_name: group.facility_name,
                                slot_status: slot.slot_status, // Include slot status
                                appointment_id: slot.appointment_id // Include appointment_id to check if slot is booked
                            });
                        });
                    });

                    // Remove duplicate intervals (same time, same provider/facility)
                    // If multiple slots have the same interval, mark as booked if ANY has appointment_id
                    const uniqueIntervals = [];
                    const seen = new Map();
                    allIntervals.forEach(interval => {
                        const key = `${interval.start}_${interval.end}_${interval.provider_id}_${interval.facility_id}`;
                        if (!seen.has(key)) {
                            seen.set(key, interval);
                            uniqueIntervals.push(interval);
                        } else {
                            // If duplicate found, check if this one has appointment_id and update the existing one
                            const existingIndex = uniqueIntervals.findIndex(i => 
                                i.start === interval.start && 
                                i.end === interval.end && 
                                i.provider_id === interval.provider_id && 
                                i.facility_id === interval.facility_id
                            );
                            if (existingIndex !== -1) {
                                const existing = uniqueIntervals[existingIndex];
                                // If this interval has appointment_id, mark the existing one as booked too
                                if (interval.appointment_id && interval.appointment_id !== 'available' && interval.appointment_id !== null) {
                                    existing.appointment_id = interval.appointment_id;
                                }
                            }
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
                                    // Check if slot is booked: either has appointment_id, status is 'booked', or overlaps with existing appointment
                                    const appointmentId = interval.appointment_id;
                                    const hasAppointmentId = appointmentId && 
                                        appointmentId !== 'available' && 
                                        appointmentId !== null && 
                                        appointmentId !== '' &&
                                        String(appointmentId).trim().length > 0;
                                    const isBookedByStatus = interval.slot_status === 'booked';
                                    const isBookedBySlot = hasAppointmentId || isBookedByStatus;
                                    const isBookedByAppointment = isTimeSlotBooked(interval.start, interval.end);
                                    const isBooked = isBookedBySlot || isBookedByAppointment;
                                    const isUnavailable = interval.slot_status === 'unavailable' && !isBooked;
                                    const isAvailable = (interval.slot_status === 'available' || interval.slot_status === 'unavailable') && !isBooked;
                                    
                                    // Determine colors and styles based on status
                                    let borderColor = '#28a745';
                                    let backgroundColor = '#f0fdf4';
                                    let textColor = '#28a745';
                                    let cursorStyle = 'pointer';
                                    let opacity = 1;
                                    
                                    if (isUnavailable) {
                                        borderColor = '#6c757d';
                                        backgroundColor = '#f8f9fa';
                                        textColor = '#6c757d';
                                        cursorStyle = 'not-allowed';
                                        opacity = 0.6;
                                    } else if (isBooked) {
                                        borderColor = '#dc3545';
                                        backgroundColor = '#fff5f5';
                                        textColor = '#dc3545';
                                        cursorStyle = 'not-allowed';
                                        opacity = 0.7;
                                    }
                                    
                                    return (
                                        <div
                                            key={index}
                                            onClick={() => {
                                                if (isAvailable && !isBooked && !isUnavailable) {
                                                    // Open booking modal with pre-filled time
                                                    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;
                                                    setShowAddModal(true);
                                                }
                                            }}
                                            style={{
                                                padding: '10px',
                                                border: `2px solid ${borderColor}`,
                                                borderRadius: '6px',
                                                background: backgroundColor,
                                                cursor: cursorStyle,
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease',
                                                opacity: opacity
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isAvailable && !isBooked && !isUnavailable) {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.borderColor = '#22c55e';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (isAvailable && !isBooked && !isUnavailable) {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.borderColor = '#28a745';
                                                }
                                            }}
                                            title={
                                                isUnavailable 
                                                    ? 'This time slot is unavailable (expired)' 
                                                    : isBooked 
                                                        ? 'This time slot is already booked' 
                                                        : 'Click to book this time slot'
                                            }
                                        >
                                            <div style={{ 
                                                fontSize: '12px', 
                                                fontWeight: 'bold',
                                                color: textColor,
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
                                            {isUnavailable && (
                                                <div style={{ 
                                                    fontSize: '10px', 
                                                    color: '#6c757d',
                                                    marginTop: '4px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    UNAVAILABLE
                                                </div>
                                            )}
                                            {isBooked && !isUnavailable && (
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
                fontWeight: '600',
                padding: '12px 4px',
                color: '#A31D1D',
                fontSize: '13px',
                backgroundColor: '#F8F2DE',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
            }}>
                {day}
            </div>
        ));
        
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} style={{ 
                minHeight: '100px',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #e9ecef'
            }}></div>);
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
            
            // Check if this date has availability slots
            const hasAvailabilitySlots = datesWithAvailability.has(dateStr);
            
            // For patients, only allow clicking on dates with availability slots (or dates with existing appointments)
            const canClick = !isToday && (
                currentUserRole !== 'patient' || 
                hasAvailabilitySlots || 
                hasAppointments || 
                hasAnyAppointments
            );
            
            days.push(
                <div 
                    key={day} 
                    onClick={async () => {
                        // Prevent clicking on today - appointments must be scheduled in advance
                        if (isToday) {
                            setShowTodayModal(true);
                            return;
                        }
                        
                        // For patients, prevent clicking on dates without availability slots
                        if (currentUserRole === 'patient' && !hasAvailabilitySlots && !hasAppointments && !hasAnyAppointments) {
                            setToast({
                                message: 'No availability slots for this date. Please select a date with a green dot indicator.',
                                type: 'error'
                            });
                            return;
                        }
                        
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
                        padding: '12px 8px',
                        minHeight: '100px',
                        border: isToday ? `3px solid #D84040` : `1.5px solid ${borderColor}`,
                        borderRadius: '8px',
                        backgroundColor: backgroundColor,
                        cursor: isToday ? 'not-allowed' : (canClick ? 'pointer' : 'default'),
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        opacity: isToday ? 0.6 : (canClick ? 1 : 0.5),
                        boxShadow: isSelected 
                            ? '0 4px 12px rgba(163, 29, 29, 0.2)' 
                            : isToday 
                                ? '0 2px 8px rgba(216, 64, 64, 0.15)' 
                                : '0 1px 3px rgba(0,0,0,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-start'
                    }}
                    onMouseEnter={(e) => {
                        // Don't show hover effect for today or non-clickable dates
                        if (isToday || !canClick) {
                            return;
                        }
                        // Show hover effect for clickable dates
                        if (!isSelected) {
                            e.currentTarget.style.backgroundColor = '#F8F2DE';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 16px rgba(163, 29, 29, 0.25)';
                            e.currentTarget.style.borderColor = '#A31D1D';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = backgroundColor;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = isSelected 
                            ? '0 4px 12px rgba(163, 29, 29, 0.2)' 
                            : isToday 
                                ? '0 2px 8px rgba(216, 64, 64, 0.15)' 
                                : '0 1px 3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = isToday ? '#D84040' : borderColor;
                    }}
                    title={
                        isToday 
                            ? 'Appointments must be scheduled in advance (not available for today)' 
                            : currentUserRole === 'patient' && !hasAvailabilitySlots && !hasAppointments && !hasAnyAppointments
                                ? 'No availability slots for this date'
                                : hasAvailabilitySlots
                                    ? 'Availability slots available (green dot) - Click to view/book'
                                    : availability === 'available' 
                                        ? 'Available slots' 
                                        : availability === 'unavailable' 
                                            ? 'No available slots' 
                                            : hasAppointments 
                                                ? `${dayAppointments.length} of your appointment(s)` 
                                                : hasAnyAppointments 
                                                    ? 'Time slots booked (see times below)' 
                                                    : 'Click to check availability'
                    }
                >
                    <div style={{
                        fontWeight: isToday ? '700' : '600',
                        color: isToday ? '#D84040' : '#A31D1D',
                        marginBottom: '8px',
                        fontSize: isToday ? '18px' : '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: isToday ? '28px' : '24px',
                            height: isToday ? '28px' : '24px',
                            borderRadius: '50%',
                            backgroundColor: isToday ? '#D84040' : 'transparent',
                            color: isToday ? 'white' : '#A31D1D',
                            lineHeight: '1'
                        }}>
                            {day}
                        </span>
                        {/* Green dot indicator for dates with availability slots */}
                        {!isToday && datesWithAvailability.has(dateStr) && (
                            <div
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: '#28a745',
                                    boxShadow: '0 0 6px rgba(40, 167, 69, 0.6)',
                                    flexShrink: 0
                                }}
                                title="Availability slots available for this date"
                            />
                        )}
                    </div>
                    {/* Show patient's own appointments count */}
                    {hasAppointments && (
                        <div style={{
                            fontSize: '10px',
                            color: '#A31D1D',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: '600',
                            marginBottom: '4px',
                            padding: '2px 6px',
                            backgroundColor: '#F8F2DE',
                            borderRadius: '4px',
                            display: 'inline-block',
                            width: '100%',
                            textAlign: 'center'
                        }}>
                            {dayAppointments.length > 1 ? 
                                `${dayAppointments.length} appointments` : 
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
                            gap: '4px',
                            marginTop: '6px',
                            justifyContent: 'center'
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
                                            padding: '3px 6px',
                                            borderRadius: '4px',
                                            fontWeight: '600',
                                            lineHeight: '1.2',
                                            boxShadow: '0 1px 3px rgba(40, 167, 69, 0.3)'
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
                                    padding: '3px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 3px rgba(40, 167, 69, 0.3)'
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
                            bottom: '8px',
                            right: '8px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: dayAppointments.some(a => a.status === 'scheduled' || a.status === 'confirmed') ? '#28a745' : '#dc3545',
                            boxShadow: dayAppointments.some(a => a.status === 'scheduled' || a.status === 'confirmed') 
                                ? '0 0 6px rgba(40, 167, 69, 0.6)' 
                                : '0 0 6px rgba(220, 53, 69, 0.6)',
                            border: '2px solid white'
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
                : filter === 'pending'
                ? 'No pending appointments or requests'
                : filter === 'confirmed'
                ? 'No confirmed appointments'
                : filter === 'declined'
                ? 'No declined requests or cancelled appointments'
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
            const isRequest = apt.isRequest === true; // Explicitly check for true
            const startDate = new Date(apt.scheduled_start);
            const endDate = new Date(apt.scheduled_end);
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
                        {/* For requests, show cancel button if pending, status message if approved/declined */}
                        {isRequest ? (
                            <div>
                                <div style={{ 
                                    padding: '10px', 
                                    background: '#fff3cd', 
                                    borderRadius: '4px', 
                                    color: '#856404',
                                    fontSize: '14px',
                                    marginBottom: apt.status === 'pending' ? '10px' : '0'
                                }}>
                                    {apt.status === 'pending' && '⏳ Awaiting case manager approval'}
                                    {apt.status === 'approved' && '✅ Request approved - appointment created'}
                                    {apt.status === 'declined' && '❌ Request declined'}
                                </div>
                                {/* Show cancel button only for pending requests */}
                                {apt.status === 'pending' && (
                                    <button 
                                        onClick={() => handleCancelRequest(apt.request_id)}
                                        style={{
                                            padding: '8px 16px',
                                            background: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s ease',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#c82333'}
                                        onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                                    >
                                        Cancel Request
                                    </button>
                                )}
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

    // Close sort dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showSortDropdown && !event.target.closest('.sort-dropdown-container')) {
                setShowSortDropdown(false);
            }
        };

        if (showSortDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSortDropdown]);

    return (
        <div className="appointments-main" style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh', paddingTop: '100px' }}>
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
                        <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>My Appointments</h2>
                        <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>View and manage your appointments</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {/* Sort Dropdown */}
                        <div className="sort-dropdown-container" style={{ position: 'relative' }}>
                            <button 
                                onClick={() => setShowSortDropdown(!showSortDropdown)}
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
                                <ArrowUpDown size={16} />
                                Sort: {sortOrder === 'latest' ? 'Latest First' : 'Oldest First'}
                                <ChevronDown size={14} />
                            </button>
                            {showSortDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    background: 'white',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    minWidth: '180px',
                                    zIndex: 1000,
                                    border: '1px solid #F8F2DE',
                                    overflow: 'hidden'
                                }}>
                                    <button
                                        onClick={() => {
                                            setSortOrder('latest');
                                            setShowSortDropdown(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: sortOrder === 'latest' ? '#F8F2DE' : 'white',
                                            color: '#A31D1D',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: sortOrder === 'latest' ? '600' : '400',
                                            transition: 'all 0.2s ease',
                                            borderBottom: '1px solid #F8F2DE'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (sortOrder !== 'latest') {
                                                e.target.style.background = '#F8F2DE';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (sortOrder !== 'latest') {
                                                e.target.style.background = 'white';
                                            }
                                        }}
                                    >
                                        Latest First
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSortOrder('oldest');
                                            setShowSortDropdown(false);
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: sortOrder === 'oldest' ? '#F8F2DE' : 'white',
                                            color: '#A31D1D',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontSize: '14px',
                                            fontWeight: sortOrder === 'oldest' ? '600' : '400',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (sortOrder !== 'oldest') {
                                                e.target.style.background = '#F8F2DE';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (sortOrder !== 'oldest') {
                                                e.target.style.background = 'white';
                                            }
                                        }}
                                    >
                                        Oldest First
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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
                {/* Status-based filters */}
                <button
                    onClick={() => {
                        setFilter('pending');
                        navigate('/my-appointments?filter=pending');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'pending' ? '#ffc107' : 'white',
                        color: filter === 'pending' ? 'white' : '#ffc107',
                        border: '2px solid #ffc107',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'pending') {
                            e.target.style.background = '#fff3cd';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'pending') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    Pending
                </button>
                <button
                    onClick={() => {
                        setFilter('confirmed');
                        navigate('/my-appointments?filter=confirmed');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'confirmed' ? '#28a745' : 'white',
                        color: filter === 'confirmed' ? 'white' : '#28a745',
                        border: '2px solid #28a745',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'confirmed') {
                            e.target.style.background = '#d4edda';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'confirmed') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    Confirmed
                </button>
                <button
                    onClick={() => {
                        setFilter('declined');
                        navigate('/my-appointments?filter=declined');
                    }}
                    style={{
                        padding: '8px 16px',
                        background: filter === 'declined' ? '#dc3545' : 'white',
                        color: filter === 'declined' ? 'white' : '#dc3545',
                        border: '2px solid #dc3545',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        if (filter !== 'declined') {
                            e.target.style.background = '#f8d7da';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (filter !== 'declined') {
                            e.target.style.background = 'white';
                        }
                    }}
                >
                    Declined
                </button>
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
                    padding: '25px', 
                    borderRadius: '12px', 
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    minWidth: '320px',
                    border: '1px solid #e9ecef'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '25px',
                        paddingBottom: '20px',
                        borderBottom: '2px solid #F8F2DE'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <button 
                                onClick={() => navigateMonth('prev')}
                                style={{
                                    background: '#F8F2DE',
                                    border: '1px solid #A31D1D',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#A31D1D';
                                    e.target.style.borderColor = '#A31D1D';
                                    const icon = e.target.querySelector('svg');
                                    if (icon) icon.setAttribute('color', 'white');
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#F8F2DE';
                                    e.target.style.borderColor = '#A31D1D';
                                    const icon = e.target.querySelector('svg');
                                    if (icon) icon.setAttribute('color', '#A31D1D');
                                }}
                            >
                                <ChevronLeft size={20} color="#A31D1D" />
                            </button>
                            <h3 style={{ 
                                margin: 0, 
                                color: '#A31D1D',
                                fontSize: '20px',
                                fontWeight: '700',
                                minWidth: '200px',
                                textAlign: 'center'
                            }}>
                                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button 
                                onClick={() => navigateMonth('next')}
                                style={{
                                    background: '#F8F2DE',
                                    border: '1px solid #A31D1D',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s ease',
                                    width: '36px',
                                    height: '36px'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#A31D1D';
                                    e.target.style.borderColor = '#A31D1D';
                                    const icon = e.target.querySelector('svg');
                                    if (icon) icon.setAttribute('color', 'white');
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = '#F8F2DE';
                                    e.target.style.borderColor = '#A31D1D';
                                    const icon = e.target.querySelector('svg');
                                    if (icon) icon.setAttribute('color', '#A31D1D');
                                }}
                            >
                                <ChevronRight size={20} color="#A31D1D" />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            style={{
                                padding: '10px 20px',
                                background: '#A31D1D',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                fontWeight: '600',
                                fontSize: '14px',
                                boxShadow: '0 2px 4px rgba(163, 29, 29, 0.2)'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#D84040';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(163, 29, 29, 0.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = '#A31D1D';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(163, 29, 29, 0.2)';
                            }}
                        >
                            Book Appointment
                        </button>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '10px',
                        overflowX: 'auto',
                        padding: '10px 0'
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
                                            const isUnavailable = slot.slot_status === 'unavailable';
                                            const slotKey = `${slot.isBooked}_${isUnavailable}`;
                                            
                                            if (!currentGroup || currentGroup.key !== slotKey) {
                                                if (currentGroup) {
                                                    groupedSlots.push(currentGroup);
                                                }
                                                currentGroup = {
                                                    start: slot.start,
                                                    end: slot.end,
                                                    isBooked: slot.isBooked,
                                                    isUnavailable: isUnavailable,
                                                    key: slotKey
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
                                                {groupedSlots.map((slot, idx) => {
                                                    const isUnavailable = slot.isUnavailable;
                                                    const isAvailable = !slot.isBooked && !isUnavailable;
                                                    
                                                    // Determine colors and styles
                                                    let borderColor = '#28a745';
                                                    let backgroundColor = '#28a745';
                                                    let textColor = 'white';
                                                    let cursorStyle = 'pointer';
                                                    let opacity = 1;
                                                    
                                                    if (isUnavailable) {
                                                        borderColor = '#6c757d';
                                                        backgroundColor = '#f8f9fa';
                                                        textColor = '#6c757d';
                                                        cursorStyle = 'not-allowed';
                                                        opacity = 0.6;
                                                    } else if (slot.isBooked) {
                                                        borderColor = '#dc3545';
                                                        backgroundColor = '#fff5f5';
                                                        textColor = '#dc3545';
                                                        cursorStyle = 'not-allowed';
                                                        opacity = 0.7;
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={idx}
                                                            type="button"
                                                            onClick={() => {
                                                                if (isAvailable) {
                                                                    setShowAddModal(true);
                                                                }
                                                            }}
                                                            disabled={slot.isBooked || isUnavailable}
                                                            style={{
                                                                padding: '12px',
                                                                border: `2px solid ${borderColor}`,
                                                                borderRadius: '6px',
                                                                background: backgroundColor,
                                                                color: textColor,
                                                                cursor: cursorStyle,
                                                                textAlign: 'center',
                                                                transition: 'all 0.2s ease',
                                                                opacity: opacity,
                                                                fontWeight: '600',
                                                                fontSize: '13px',
                                                                boxShadow: isAvailable ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                                                                width: '100%'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (isAvailable) {
                                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                                    e.currentTarget.style.background = '#22c55e';
                                                                    e.currentTarget.style.borderColor = '#22c55e';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (isAvailable) {
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                    e.currentTarget.style.background = '#28a745';
                                                                    e.currentTarget.style.borderColor = '#28a745';
                                                                }
                                                            }}
                                                            title={
                                                                isUnavailable 
                                                                    ? 'This time slot is unavailable (expired)' 
                                                                    : slot.isBooked 
                                                                        ? 'This time slot is already booked' 
                                                                        : 'Click to book this time slot'
                                                            }
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
                                                            {isUnavailable && (
                                                                <div style={{ 
                                                                    fontSize: '10px',
                                                                    marginTop: '4px',
                                                                    fontWeight: 'bold',
                                                                    opacity: 0.8
                                                                }}>
                                                                    UNAVAILABLE
                                                                </div>
                                                            )}
                                                            {slot.isBooked && !isUnavailable && (
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
                                                    );
                                                })}
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
                    datesWithAvailability={datesWithAvailability}
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

            {/* Today Not Available Modal */}
            {showTodayModal && (
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
                    <div style={{
                        background: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            marginBottom: '20px',
                            fontSize: '48px'
                        }}>
                            ⚠️
                        </div>
                        <h2 style={{
                            margin: '0 0 15px 0',
                            color: '#A31D1D',
                            fontSize: '24px',
                            fontWeight: 'bold'
                        }}>
                            Appointments Must Be Scheduled in Advance
                        </h2>
                        <p style={{
                            margin: '0 0 25px 0',
                            color: '#6c757d',
                            fontSize: '16px',
                            lineHeight: '1.6'
                        }}>
                            Same-day appointments are not available. Please select a date starting from tomorrow or later to schedule your appointment.
                        </p>
                        <button
                            onClick={() => setShowTodayModal(false)}
                            style={{
                                padding: '12px 32px',
                                background: '#A31D1D',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#8a1a1a'}
                            onMouseLeave={(e) => e.target.style.background = '#A31D1D'}
                        >
                            Understood
                        </button>
                    </div>
                </div>
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

const MyAppointmentModal = ({ mode, appointment, facilities, providers: initialProviders, currentUserRole, currentPatientId, currentProviderId, datesWithAvailability = new Set(), onClose, onSave }) => {
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
            duration_minutes: 60, // Module 6: Fixed 60-minute duration
            reason: appointment.reason || '',
            notes: appointment.notes || ''
        } : {
            facility_id: '',
            provider_id: '',
            appointment_type: '',
            appointmentDate: '',
            appointmentTime: '',
            appointmentEndTime: '',
            duration_minutes: 60, // Module 6: Fixed 60-minute duration
            reason: '',
            notes: ''
        }
    );

    const [providers, setProviders] = useState(initialProviders || []);
    const [showCalendar, setShowCalendar] = useState(false);
    const [modalCurrentMonth, setModalCurrentMonth] = useState(new Date());
    const [modalDatesWithAvailability, setModalDatesWithAvailability] = useState(datesWithAvailability);
    const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
    const [bookedTimeSlots, setBookedTimeSlots] = useState([]);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    const getAuthToken = () => localStorage.getItem('token');

    // Fetch availability slots for modal calendar
    const fetchModalAvailabilitySlots = async (month) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const year = month.getFullYear();
            const monthIndex = month.getMonth();
            const firstDay = new Date(year, monthIndex, 1);
            // Get last day of 2 months ahead (3 months total)
            const lastDay = new Date(year, monthIndex + 3, 0);
            
            // Ensure we start from today (don't fetch past dates)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateFrom = firstDay < today ? today.toISOString().split('T')[0] : firstDay.toISOString().split('T')[0];
            const dateTo = lastDay.toISOString().split('T')[0];

            const params = new URLSearchParams({ 
                date_from: dateFrom,
                date_to: dateTo,
                status: 'available'
            });

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    const availableSlots = (data.data || []).filter(slot => 
                        slot.slot_status === 'available' && slot.slot_date
                    );
                    
                    const datesSet = new Set();
                    availableSlots.forEach(slot => {
                        if (slot.slot_date) {
                            // Normalize date format - handle both Date objects and strings
                            let dateStr = slot.slot_date;
                            if (dateStr instanceof Date) {
                                // For Date objects, use local date to avoid timezone shifts
                                const year = dateStr.getFullYear();
                                const month = String(dateStr.getMonth() + 1).padStart(2, '0');
                                const day = String(dateStr.getDate()).padStart(2, '0');
                                dateStr = `${year}-${month}-${day}`;
                            } else if (typeof dateStr === 'string') {
                                // If it's already in YYYY-MM-DD format, use it directly
                                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                                    // Already in correct format, use as-is
                                    dateStr = dateStr;
                                } else if (dateStr.includes('T')) {
                                    // Extract date part before 'T' to avoid timezone conversion
                                    dateStr = dateStr.split('T')[0];
                                } else {
                                    // Try to parse if not in YYYY-MM-DD format
                                    const parsed = new Date(dateStr);
                                    if (!isNaN(parsed.getTime())) {
                                        // Use local date components to avoid timezone shifts
                                        const year = parsed.getFullYear();
                                        const month = String(parsed.getMonth() + 1).padStart(2, '0');
                                        const day = String(parsed.getDate()).padStart(2, '0');
                                        dateStr = `${year}-${month}-${day}`;
                                    }
                                }
                            }
                            datesSet.add(dateStr);
                        }
                    });
                    
                    // Merge with existing dates from parent component
                    const mergedSet = new Set([...datesWithAvailability, ...datesSet]);
                    setModalDatesWithAvailability(mergedSet);
                }
            }
        } catch (error) {
            console.error('Error fetching availability slots for modal:', error);
        }
    };

    // Initialize modal dates with availability when component mounts or datesWithAvailability changes
    useEffect(() => {
        setModalDatesWithAvailability(datesWithAvailability);
    }, [datesWithAvailability]);

    // Fetch availability slots when modal opens or month changes
    useEffect(() => {
        if (showCalendar) {
            fetchModalAvailabilitySlots(modalCurrentMonth);
        }
    }, [showCalendar, modalCurrentMonth]);

    // Fetch time slots for selected date (for patients)
    const fetchTimeSlotsForDate = async (dateStr, facilityId = null, providerId = null) => {
        if (!dateStr || currentUserRole !== 'patient') return;
        
        try {
            setLoadingTimeSlots(true);
            const token = getAuthToken();
            if (!token) return;

            const params = new URLSearchParams({ 
                date: dateStr
                // Removed status filter to show both available and unavailable slots
            });
            
            if (facilityId) {
                params.append('facility_id', facilityId);
            }
            if (providerId) {
                params.append('provider_id', providerId);
            }

            const response = await fetch(`${API_BASE_URL}/appointments/availability/slots?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Show available, unavailable, and booked slots so users can see all slots
                    // Booked slots should be shown but marked as unavailable for booking
                    const allSlots = (data.data || []).filter(slot => 
                        slot.slot_status === 'available' || 
                        slot.slot_status === 'unavailable' || 
                        slot.slot_status === 'booked' ||
                        (slot.appointment_id && slot.appointment_id !== 'available' && slot.appointment_id !== null)
                    );
                    console.log('Fetched slots for date:', dateStr, allSlots);
                    setAvailableTimeSlots(allSlots);
                    
                    // Fetch existing appointments in parallel for faster loading
                    const appointmentParams = new URLSearchParams({
                        date_from: dateStr,
                        date_to: dateStr
                    });
                    
                    fetch(`${API_BASE_URL}/appointments?${appointmentParams}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                    .then(appointmentResponse => appointmentResponse.json())
                    .then(appointmentData => {
                        if (appointmentData.success) {
                            const activeAppointments = (appointmentData.data || []).filter(apt => 
                                apt.status !== 'cancelled' && apt.status !== 'no_show'
                            );
                            setBookedTimeSlots(activeAppointments);
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching appointments for date:', error);
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching time slots:', error);
            setAvailableTimeSlots([]);
            setBookedTimeSlots([]);
        } finally {
            setLoadingTimeSlots(false);
        }
    };

    // Fetch time slots when date or facility/provider changes
    useEffect(() => {
        if (formData.appointmentDate && currentUserRole === 'patient') {
            fetchTimeSlotsForDate(formData.appointmentDate, formData.facility_id || null, formData.provider_id || null);
        } else {
            setAvailableTimeSlots([]);
            setBookedTimeSlots([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.appointmentDate, formData.facility_id, formData.provider_id, currentUserRole]);

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCalendar && !event.target.closest('.calendar-picker-container')) {
                setShowCalendar(false);
            }
        };

        if (showCalendar) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar]);

    // Helper function to fetch providers (matching DoctorAssignments.jsx approach)
    const fetchProvidersForModal = async (facilityId = null) => {
        try {
            const token = getAuthToken();
            if (!token) return;

            console.log('Fetching providers from /users/providers endpoint...', facilityId ? `for facility: ${facilityId}` : '');
            
            let url = `${API_BASE_URL}/users/providers`;
            if (facilityId) {
                url += `?facility_id=${facilityId}`;
            }
            
            let response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // If users/providers doesn't work, try doctor-assignments/providers
            if (!response.ok && (response.status === 404 || response.status === 403)) {
                console.log('Trying fallback endpoint /doctor-assignments/providers...');
                url = `${API_BASE_URL}/doctor-assignments/providers`;
                if (facilityId) {
                    url += `?facility_id=${facilityId}`;
                }
                response = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Provider fetch response:', data);

            if (data.success) {
                // Handle both response formats (matching DoctorAssignments.jsx)
                if (data.providers) {
                    // Map to consistent format
                    const providersList = data.providers.map(p => ({
                        user_id: p.user_id || p.provider_id,
                        provider_id: p.provider_id || p.user_id,
                        full_name: p.full_name || p.provider_name,
                        provider_name: p.provider_name || p.full_name,
                        username: p.username,
                        email: p.email,
                        role: p.role || 'physician',
                        status: p.status || 'active',
                        facility_id: p.facility_id,
                        facility_name: p.facility_name
                    }));
                    console.log('Setting providers:', providersList.length);
                    setProviders(providersList);
                } else if (data.users) {
                    // Fallback if response has 'users' instead of 'providers'
                    const providersList = data.users
                        .filter(u => u.role?.toLowerCase() === 'physician')
                        .map(p => ({
                            user_id: p.user_id,
                            provider_id: p.user_id,
                            full_name: p.full_name,
                            provider_name: p.full_name,
                            username: p.username,
                            email: p.email,
                            role: p.role,
                            status: p.status,
                            facility_id: p.facility_id,
                            facility_name: p.facility_name
                        }));
                    console.log('Setting providers from users:', providersList.length);
                    setProviders(providersList);
                } else {
                    console.warn('No providers found in response:', data);
                    setProviders([]);
                }
            } else {
                throw new Error(data.message || 'Failed to fetch providers');
            }
        } catch (error) {
            console.error('Error fetching providers:', error);
            setProviders([]);
        }
    };

    // Initialize providers when modal opens
    useEffect(() => {
        // If initialProviders are provided, use them
        if (initialProviders && initialProviders.length > 0) {
            setProviders(initialProviders);
        } else if (currentUserRole !== 'patient') {
            // For staff users, fetch all providers if no facility is selected
            if (!formData.facility_id) {
                fetchProvidersForModal();
            }
        }
    }, []); // Run once on mount

    // Fetch providers when facility changes
    useEffect(() => {
        if (formData.facility_id) {
            console.log('Fetching providers for facility:', formData.facility_id);
            fetchProvidersForModal(formData.facility_id);
        } else if (currentUserRole === 'patient') {
            // For patients, clear providers when facility is cleared
            setProviders([]);
        } else {
            // For staff users, fetch all providers when facility is cleared
            fetchProvidersForModal();
        }
    }, [formData.facility_id, currentUserRole]);

    // Calculate minimum date (tomorrow - appointments must be scheduled in advance)
    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateModalMonth = (direction) => {
        setModalCurrentMonth(prev => {
            const newMonth = new Date(prev);
            if (direction === 'prev') {
                newMonth.setMonth(prev.getMonth() - 1);
            } else {
                newMonth.setMonth(prev.getMonth() + 1);
            }
            return newMonth;
        });
    };

    const handleModalDateSelect = (day) => {
        const year = modalCurrentMonth.getFullYear();
        const month = modalCurrentMonth.getMonth() + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if date has availability slots (for patients)
        if (currentUserRole === 'patient' && !modalDatesWithAvailability.has(dateStr)) {
            alert('No availability slots for this date. Please select a date with a green dot indicator.');
            return;
        }
        
        setFormData({ ...formData, appointmentDate: dateStr });
        setShowCalendar(false);
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
        
        return bookedTimeSlots.some(apt => {
            const aptStart = new Date(apt.scheduled_start);
            const aptEnd = new Date(apt.scheduled_end);
            const aptStartTime = new Date(`2000-01-01 ${aptStart.toTimeString().slice(0, 8)}`);
            const aptEndTime = new Date(`2000-01-01 ${aptEnd.toTimeString().slice(0, 8)}`);
            
            // Check if appointment overlaps with slot
            return (aptStartTime < slotEndTime && aptEndTime > slotStartTime);
        });
    };

    // Generate hourly (60-minute) time intervals from a slot
    const generateTimeIntervals = (slotStart, slotEnd) => {
        const intervals = [];
        const start = new Date(`2000-01-01 ${slotStart}`);
        const end = new Date(`2000-01-01 ${slotEnd}`);
        
        let current = new Date(start);
        while (current < end) {
            const intervalStart = new Date(current);
            const intervalEnd = new Date(current.getTime() + 60 * 60000); // 60 minutes (1 hour)
            
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

    // Handle time slot selection
    const handleTimeSlotSelect = (startTime, endTime) => {
        setFormData({
            ...formData,
            appointmentTime: startTime.slice(0, 5), // HH:MM format
            appointmentEndTime: endTime.slice(0, 5),
            duration_minutes: 60 // Module 6: Fixed 60-minute duration
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Module 6: Fixed 60-minute duration
        const formDataWithDuration = {
            ...formData,
            duration_minutes: 60
        };
        onSave(formDataWithDuration);
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
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {mode === 'add' && currentUserRole === 'patient' ? (
                            <>
                                <Calendar size={24} color="#B82132" />
                                Request Appointment
                            </>
                        ) : mode === 'add' ? 'Book Appointment' : 'Edit Appointment'}
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
                    {/* MyHubCares Branch */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                            {currentUserRole === 'patient' ? 'MyHubCares Branch' : 'Facility'} <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select 
                            name="facility_id"
                            value={formData.facility_id}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Select {currentUserRole === 'patient' ? 'Branch' : 'Facility'}</option>
                            {facilities.map(facility => (
                                <option key={facility.facility_id} value={facility.facility_id}>
                                    {facility.facility_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Provider */}
                    {(currentUserRole === 'patient' || currentUserRole === 'case_manager' || currentUserRole === 'admin') && (
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                Provider <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select 
                                name="provider_id"
                                value={formData.provider_id}
                                onChange={handleChange}
                                disabled={!formData.facility_id}
                                required={currentUserRole !== 'patient'}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '14px',
                                    backgroundColor: !formData.facility_id ? '#f8f9fa' : 'white',
                                    cursor: !formData.facility_id ? 'not-allowed' : 'pointer'
                                }}
                            >
                                <option value="">
                                    {!formData.facility_id 
                                        ? 'Select Facility First' 
                                        : providers.length === 0 
                                            ? 'No providers available for this facility' 
                                            : currentUserRole === 'patient'
                                                ? 'Select Provider (Optional)'
                                                : 'Select Provider'}
                                </option>
                                {providers.map(provider => (
                                    <option key={provider.provider_id || provider.user_id} value={provider.provider_id || provider.user_id}>
                                        {provider.provider_name || provider.full_name || provider.username} {provider.role ? `(${provider.role === 'physician' ? 'Physician' : provider.role === 'nurse' ? 'Nurse' : provider.role})` : ''}
                                    </option>
                                ))}
                            </select>
                            {formData.facility_id && providers.length === 0 && (
                                <p style={{ marginTop: '5px', fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                                    No providers with active doctor assignments found for this facility. {currentUserRole === 'patient' ? 'You can still book without selecting a provider.' : 'Please select a different facility.'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Date and Time - Side by Side */}
                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                        <div className="calendar-picker-container" style={{ position: 'relative' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                Date <span style={{ color: 'red' }}>*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text"
                                    name="appointmentDate"
                                    value={formData.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString('en-US', { 
                                        weekday: 'short', 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric' 
                                    }) : ''}
                                    onClick={() => setShowCalendar(!showCalendar)}
                                    readOnly
                                    required
                                    placeholder="Click to select date"
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        backgroundColor: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                                <Calendar 
                                    size={20} 
                                    color="#A31D1D"
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        pointerEvents: 'none'
                                    }}
                                />
                            </div>
                            {/* Calendar Picker */}
                            {showCalendar && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                marginTop: '8px',
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                                border: '1px solid #e9ecef',
                                zIndex: 1000,
                                padding: '20px',
                                minWidth: '320px'
                            }}>
                                {/* Calendar Header */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    marginBottom: '20px',
                                    paddingBottom: '15px',
                                    borderBottom: '2px solid #F8F2DE'
                                }}>
                                    <button 
                                        type="button"
                                        onClick={() => navigateModalMonth('prev')}
                                        style={{
                                            background: '#F8F2DE',
                                            border: '1px solid #A31D1D',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s ease',
                                            width: '32px',
                                            height: '32px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#A31D1D';
                                            const icon = e.target.querySelector('svg');
                                            if (icon) icon.setAttribute('color', 'white');
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#F8F2DE';
                                            const icon = e.target.querySelector('svg');
                                            if (icon) icon.setAttribute('color', '#A31D1D');
                                        }}
                                    >
                                        <ChevronLeft size={18} color="#A31D1D" />
                                    </button>
                                    <h3 style={{ 
                                        margin: 0, 
                                        color: '#A31D1D',
                                        fontSize: '18px',
                                        fontWeight: '700'
                                    }}>
                                        {modalCurrentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={() => navigateModalMonth('next')}
                                        style={{
                                            background: '#F8F2DE',
                                            border: '1px solid #A31D1D',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            transition: 'all 0.2s ease',
                                            width: '32px',
                                            height: '32px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#A31D1D';
                                            const icon = e.target.querySelector('svg');
                                            if (icon) icon.setAttribute('color', 'white');
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#F8F2DE';
                                            const icon = e.target.querySelector('svg');
                                            if (icon) icon.setAttribute('color', '#A31D1D');
                                        }}
                                    >
                                        <ChevronRight size={18} color="#A31D1D" />
                                    </button>
                                </div>

                                {/* Calendar Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: '8px'
                                }}>
                                    {/* Weekday Headers */}
                                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
                                        <div key={day} style={{
                                            textAlign: 'center',
                                            fontWeight: '600',
                                            padding: '8px 4px',
                                            color: '#A31D1D',
                                            fontSize: '12px',
                                            backgroundColor: '#F8F2DE',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {day}
                                        </div>
                                    ))}
                                    
                                    {/* Empty cells for days before month starts */}
                                    {Array.from({ length: getFirstDayOfMonth(modalCurrentMonth) }).map((_, i) => (
                                        <div key={`empty-${i}`} style={{ 
                                            minHeight: '40px',
                                            borderRadius: '6px',
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #e9ecef'
                                        }}></div>
                                    ))}
                                    
                                    {/* Calendar Days */}
                                    {Array.from({ length: getDaysInMonth(modalCurrentMonth) }, (_, i) => {
                                        const day = i + 1;
                                        const year = modalCurrentMonth.getFullYear();
                                        const month = modalCurrentMonth.getMonth() + 1;
                                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        const isSelected = formData.appointmentDate === dateStr;
                                        const hasAvailability = modalDatesWithAvailability.has(dateStr);
                                        const today = new Date();
                                        const isToday = today.toISOString().split('T')[0] === dateStr;
                                        const isPast = new Date(dateStr) < new Date(today.toISOString().split('T')[0]);
                                        const isTomorrow = new Date(dateStr).toISOString().split('T')[0] === getMinDate();
                                        const canSelect = !isPast && !isToday && (currentUserRole !== 'patient' || hasAvailability || !currentUserRole);
                                        
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => handleModalDateSelect(day)}
                                                disabled={!canSelect}
                                                style={{
                                                    minHeight: '40px',
                                                    padding: '8px',
                                                    border: isSelected 
                                                        ? '2px solid #A31D1D' 
                                                        : hasAvailability 
                                                            ? '1.5px solid #28a745' 
                                                            : '1px solid #e9ecef',
                                                    borderRadius: '6px',
                                                    backgroundColor: isSelected 
                                                        ? '#F8F2DE' 
                                                        : hasAvailability 
                                                            ? '#f0fdf4' 
                                                            : 'white',
                                                    cursor: canSelect ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.2s ease',
                                                    opacity: canSelect ? 1 : 0.5,
                                                    position: 'relative',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '4px'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (canSelect) {
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (canSelect) {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }
                                                }}
                                            >
                                                <span style={{
                                                    fontWeight: isSelected ? '700' : '600',
                                                    color: isSelected ? '#A31D1D' : '#333',
                                                    fontSize: '14px'
                                                }}>
                                                    {day}
                                                </span>
                                                {hasAvailability && (
                                                    <div style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        backgroundColor: '#28a745',
                                                        boxShadow: '0 0 4px rgba(40, 167, 69, 0.6)'
                                                    }}></div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                {/* Legend */}
                                {currentUserRole === 'patient' && (
                                    <div style={{
                                        marginTop: '15px',
                                        paddingTop: '15px',
                                        borderTop: '1px solid #e9ecef',
                                        display: 'flex',
                                        gap: '15px',
                                        fontSize: '12px',
                                        justifyContent: 'center'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                backgroundColor: '#28a745',
                                                boxShadow: '0 0 4px rgba(40, 167, 69, 0.6)'
                                            }}></div>
                                            <span>Available</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                Time <span style={{ color: 'red' }}>*</span>
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
                                    padding: '10px 12px',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '6px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Available Slots for Patients */}
                    {currentUserRole === 'patient' && formData.appointmentDate && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                                Available Slots:
                            </label>
                            {loadingTimeSlots ? (
                                <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
                                    Loading available time slots...
                                </div>
                            ) : availableTimeSlots.length === 0 ? (
                                <div style={{ 
                                    padding: '15px', 
                                    textAlign: 'center', 
                                    color: '#6c757d',
                                    fontSize: '14px',
                                    background: '#fff3cd',
                                    borderRadius: '6px',
                                    border: '1px solid #ffc107'
                                }}>
                                    {formData.facility_id 
                                        ? 'No available time slots found for this date. Please select a different date or facility.'
                                        : 'Please select a facility first to see available time slots.'}
                                </div>
                            ) : (
                                <div>
                                    {/* Group slots by provider and facility */}
                                    {(() => {
                                        const groupedSlots = {};
                                        availableTimeSlots.forEach(slot => {
                                            const key = `${slot.provider_id || 'no-provider'}_${slot.facility_id}`;
                                            if (!groupedSlots[key]) {
                                                groupedSlots[key] = {
                                                    provider_name: slot.provider_name || 'No Provider',
                                                    facility_name: slot.facility_name || 'No Facility',
                                                    slots: []
                                                };
                                            }
                                            groupedSlots[key].slots.push(slot);
                                        });

                                        return Object.values(groupedSlots).map((group, groupIndex) => {
                                            // Generate all time intervals from all slots in this group
                                            const allIntervals = [];
                                            group.slots.forEach(slot => {
                                                // Debug: log slot data for first slot in first group
                                                if (groupIndex === 0 && group.slots.indexOf(slot) === 0) {
                                                    console.log('Processing slot for intervals:', {
                                                        slot_id: slot.slot_id,
                                                        start_time: slot.start_time,
                                                        end_time: slot.end_time,
                                                        appointment_id: slot.appointment_id,
                                                        slot_status: slot.slot_status
                                                    });
                                                }
                                                const intervals = generateTimeIntervals(slot.start_time, slot.end_time);
                                                intervals.forEach(interval => {
                                                    allIntervals.push({
                                                        ...interval,
                                                        provider_id: group.slots[0].provider_id,
                                                        facility_id: group.slots[0].facility_id,
                                                        provider_name: group.provider_name,
                                                        facility_name: group.facility_name,
                                                        slot_status: slot.slot_status, // Include slot status
                                                        appointment_id: slot.appointment_id // Include appointment_id to check if slot is booked
                                                    });
                                                });
                                            });

                                            // Remove duplicate intervals
                                            // If multiple slots have the same interval, mark as booked if ANY has appointment_id
                                            const uniqueIntervals = [];
                                            const seen = new Map();
                                            allIntervals.forEach(interval => {
                                                const key = `${interval.start}_${interval.end}_${interval.provider_id}_${interval.facility_id}`;
                                                if (!seen.has(key)) {
                                                    seen.set(key, interval);
                                                    uniqueIntervals.push(interval);
                                                } else {
                                                    // If duplicate found, check if this one has appointment_id and update the existing one
                                                    const existingIndex = uniqueIntervals.findIndex(i => 
                                                        i.start === interval.start && 
                                                        i.end === interval.end && 
                                                        i.provider_id === interval.provider_id && 
                                                        i.facility_id === interval.facility_id
                                                    );
                                                    if (existingIndex !== -1) {
                                                        const existing = uniqueIntervals[existingIndex];
                                                        // If this interval has appointment_id or is booked, mark the existing one as booked too
                                                        const appointmentId = interval.appointment_id;
                                                        const hasAppointmentId = appointmentId && 
                                                            appointmentId !== 'available' && 
                                                            appointmentId !== null && 
                                                            appointmentId !== '' &&
                                                            String(appointmentId).trim().length > 0;
                                                        if (hasAppointmentId || interval.slot_status === 'booked') {
                                                            existing.appointment_id = interval.appointment_id || existing.appointment_id;
                                                            if (interval.slot_status === 'booked') {
                                                                existing.slot_status = 'booked';
                                                            }
                                                        }
                                                    }
                                                }
                                            });

                                            // Sort intervals by start time
                                            uniqueIntervals.sort((a, b) => a.start.localeCompare(b.start));

                                            return (
                                                <div key={groupIndex} style={{ marginBottom: '20px' }}>
                                                    <div style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                                        {group.provider_name} - {group.facility_name}
                                                    </div>
                                                    <div style={{ 
                                                        display: 'grid', 
                                                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
                                                        gap: '8px' 
                                                    }}>
                                                        {uniqueIntervals.map((interval, idx) => {
                                                            // Check if slot is booked: either has appointment_id, status is 'booked', or overlaps with existing appointment
                                                            // appointment_id should be a valid UUID (string), not 'available', null, or empty
                                                            const appointmentId = interval.appointment_id;
                                                            const hasAppointmentId = appointmentId && 
                                                                appointmentId !== 'available' && 
                                                                appointmentId !== null && 
                                                                appointmentId !== '' &&
                                                                String(appointmentId).trim().length > 0;
                                                            const isBookedByStatus = interval.slot_status === 'booked';
                                                            const isBookedBySlot = hasAppointmentId || isBookedByStatus;
                                                            const isBookedByAppointment = isTimeSlotBooked(interval.start, interval.end);
                                                            const isBooked = isBookedBySlot || isBookedByAppointment;
                                                            
                                                            // Debug logging for first interval
                                                            if (idx === 0) {
                                                                console.log('Interval booking check:', {
                                                                    start: interval.start,
                                                                    end: interval.end,
                                                                    appointment_id: interval.appointment_id,
                                                                    slot_status: interval.slot_status,
                                                                    hasAppointmentId,
                                                                    isBookedByStatus,
                                                                    isBookedBySlot,
                                                                    isBookedByAppointment,
                                                                    isBooked
                                                                });
                                                            }
                                                            
                                                            const isUnavailable = interval.slot_status === 'unavailable' && !isBooked;
                                                            const isAvailable = (interval.slot_status === 'available' || interval.slot_status === 'unavailable') && !isBooked;
                                                            const isSelected = formData.appointmentTime === interval.start.slice(0, 5) && 
                                                                               formData.appointmentEndTime === interval.end.slice(0, 5);
                                                            
                                                            // Determine colors and styles
                                                            let borderColor = '#28a745';
                                                            let backgroundColor = '#28a745';
                                                            let textColor = 'white';
                                                            let cursorStyle = 'pointer';
                                                            let opacity = 1;
                                                            
                                                            if (isUnavailable) {
                                                                borderColor = '#6c757d';
                                                                backgroundColor = '#f8f9fa';
                                                                textColor = '#6c757d';
                                                                cursorStyle = 'not-allowed';
                                                                opacity = 0.6;
                                                            } else if (isSelected) {
                                                                borderColor = '#A31D1D';
                                                                backgroundColor = '#F8F2DE';
                                                                textColor = '#A31D1D';
                                                            } else if (isBooked) {
                                                                borderColor = '#dc3545';
                                                                backgroundColor = '#fff5f5';
                                                                textColor = '#dc3545';
                                                                cursorStyle = 'not-allowed';
                                                                opacity = 0.7;
                                                            }
                                                            
                                                            return (
                                                                <button
                                                                    key={idx}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isAvailable && !isBooked && !isUnavailable) {
                                                                            handleTimeSlotSelect(interval.start, interval.end);
                                                                        }
                                                                    }}
                                                                    disabled={isBooked || isUnavailable}
                                                                    style={{
                                                                        padding: '12px',
                                                                        border: `2px solid ${borderColor}`,
                                                                        borderRadius: '6px',
                                                                        background: backgroundColor,
                                                                        color: textColor,
                                                                        cursor: cursorStyle,
                                                                        textAlign: 'center',
                                                                        transition: 'all 0.2s ease',
                                                                        opacity: opacity,
                                                                        fontWeight: '600',
                                                                        fontSize: '13px',
                                                                        boxShadow: isSelected 
                                                                            ? '0 4px 8px rgba(163, 29, 29, 0.3)' 
                                                                            : (isAvailable ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'),
                                                                        width: '100%'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        if (isAvailable && !isBooked && !isUnavailable && !isSelected) {
                                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                                                                            e.currentTarget.style.background = '#22c55e';
                                                                            e.currentTarget.style.borderColor = '#22c55e';
                                                                        }
                                                                    }}
                                                                    onMouseLeave={(e) => {
                                                                        if (isAvailable && !isBooked && !isUnavailable && !isSelected) {
                                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                                                                            e.currentTarget.style.background = '#28a745';
                                                                            e.currentTarget.style.borderColor = '#28a745';
                                                                        }
                                                                    }}
                                                                    title={
                                                                        isUnavailable 
                                                                            ? 'This time slot is unavailable (expired)' 
                                                                            : isBooked 
                                                                                ? 'This time slot is already booked' 
                                                                                : isSelected
                                                                                    ? 'Selected time slot'
                                                                                    : 'Click to select this time slot'
                                                                    }
                                                                >
                                                                    <div style={{ 
                                                                        fontSize: '14px', 
                                                                        fontWeight: 'bold',
                                                                        marginBottom: '4px'
                                                                    }}>
                                                                        {formatTimeToAMPM(interval.start)}
                                                                    </div>
                                                                    <div style={{ 
                                                                        fontSize: '12px',
                                                                        opacity: 0.9
                                                                    }}>
                                                                        to {formatTimeToAMPM(interval.end)}
                                                                    </div>
                                                                    {isUnavailable && (
                                                                        <div style={{ 
                                                                            fontSize: '10px',
                                                                            marginTop: '4px',
                                                                            fontWeight: 'bold',
                                                                            opacity: 0.8
                                                                        }}>
                                                                            UNAVAILABLE
                                                                        </div>
                                                                    )}
                                                                    {isBooked && !isUnavailable && (
                                                                        <div style={{ 
                                                                            fontSize: '10px',
                                                                            marginTop: '4px',
                                                                            fontWeight: 'bold',
                                                                            opacity: 0.8
                                                                        }}>
                                                                            BOOKED
                                                                        </div>
                                                                    )}
                                                                    {isSelected && !isBooked && !isUnavailable && (
                                                                        <div style={{ 
                                                                            fontSize: '10px',
                                                                            marginTop: '4px',
                                                                            fontWeight: 'bold',
                                                                            opacity: 0.8
                                                                        }}>
                                                                            ✓ SELECTED
                                                                        </div>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                    <div style={{ 
                                        marginTop: '10px', 
                                        padding: '10px', 
                                        background: '#e7f3ff', 
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: '#0066cc'
                                    }}>
                                        💡 <strong>Tip:</strong> Click on a time slot above to automatically fill in the start and end times. You can also manually enter times below.
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appointment Type */}
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                            Appointment Type <span style={{ color: 'red' }}>*</span>
                        </label>
                        <select 
                            name="appointment_type"
                            value={formData.appointment_type}
                            onChange={handleChange}
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                backgroundColor: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="">Select Type</option>
                            <option value="initial">Initial Visit</option>
                            <option value="follow_up">Follow-up Consultation</option>
                            <option value="art_pickup">ART Pickup</option>
                            <option value="lab_test">Lab Test</option>
                            <option value="counseling">Counseling</option>
                            <option value="general">General</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>
                            Notes (Optional)
                        </label>
                        <textarea 
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                            placeholder={currentUserRole === 'patient' ? 'Regular check-up and medication review' : ''}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                        <button 
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
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
                                padding: '10px 20px',
                                background: currentUserRole === 'patient' ? '#B82132' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.background = currentUserRole === 'patient' ? '#A31D1D' : '#0056b3'}
                            onMouseLeave={(e) => e.target.style.background = currentUserRole === 'patient' ? '#B82132' : '#007bff'}
                        >
                            {mode === 'add' && currentUserRole === 'patient' ? (
                                <>
                                    <span>Submit Request</span>
                                    <span style={{ fontSize: '16px' }}>📤</span>
                                </>
                            ) : mode === 'add' ? 'Book Appointment' : 'Update Appointment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MyAppointments;

