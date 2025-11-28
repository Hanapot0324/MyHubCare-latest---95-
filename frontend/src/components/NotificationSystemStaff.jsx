import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Check, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const NotificationSystemStaff = ({ socket }) => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [currentUserRole, setCurrentUserRole] = useState(null);
    const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [loadingAppointment, setLoadingAppointment] = useState(false);
    const [processingAction, setProcessingAction] = useState(null);

    // Get auth token
    const getAuthToken = () => {
        return localStorage.getItem('token');
    };

    // Get current user role
    useEffect(() => {
        const getUserRole = async () => {
            try {
                const token = getAuthToken();
                if (!token) return;

                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    setCurrentUserRole(user.role);
                } else {
                    const response = await fetch(`${API_BASE_URL}/auth/me`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        if (data.success && data.user) {
                            setCurrentUserRole(data.user.role);
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting user role:', error);
            }
        };
        getUserRole();
    }, []);

    // Fetch notifications from API
    const fetchNotifications = async () => {
        try {
            const token = getAuthToken();
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/notifications?type=all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                let allNotifications = [];
                
                // Process notifications from notifications table (staff see notifications with patient_id)
                // Note: notifications table doesn't have payload column, so no appointment data here
                if (data.success && data.data?.notifications && Array.isArray(data.data.notifications)) {
                    const notifs = data.data.notifications.map(notif => {
                        return {
                            id: notif.notification_id,
                            notification_id: notif.notification_id,
                            type: notif.type || 'system',
                            title: notif.title,
                            message: notif.message,
                            appointment: null, // notifications table doesn't store appointment data
                            appointment_id: null,
                            requires_confirmation: false,
                            decline_reason: null,
                            timestamp: notif.created_at,
                            read: notif.is_read || false,
                            is_read: notif.is_read || false,
                            message_id: notif.notification_id,
                            patient_id: null
                        };
                    });
                    allNotifications = [...allNotifications, ...notifs];
                }
                
                // Process in-app messages
                if (data.success && data.data?.in_app_messages && Array.isArray(data.data.in_app_messages)) {
                    const messages = data.data.in_app_messages.map(msg => {
                        let payload = null;
                        try {
                            payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
                        } catch (e) {
                            payload = null;
                        }
                        
                        return {
                            id: msg.message_id,
                            message_id: msg.message_id,
                            type: payload?.type || 'appointment',
                            title: msg.subject,
                            message: msg.body,
                            appointment: payload?.appointment_id ? {
                                appointment_id: payload.appointment_id,
                                appointment_type: payload.appointment_type,
                                scheduled_start: payload.scheduled_start
                            } : null,
                            appointment_id: payload?.appointment_id,
                            requires_confirmation: payload?.requires_confirmation || false,
                            decline_reason: payload?.decline_reason || null,
                            timestamp: msg.sent_at || msg.created_at,
                            read: msg.is_read || false,
                            is_read: msg.is_read || false
                        };
                    });
                    allNotifications = [...allNotifications, ...messages];
                }
                
                // Validate appointments exist before showing notifications
                // Batch fetch all appointments at once instead of individual requests to avoid 404 spam
                const token = getAuthToken();
                const appointmentIds = allNotifications
                    .filter(notif => notif.appointment_id)
                    .map(notif => notif.appointment_id)
                    .filter((id, index, self) => self.indexOf(id) === index); // Remove duplicates
                
                let validAppointments = {};
                
                // Batch fetch all appointments if there are any appointment IDs
                if (appointmentIds.length > 0) {
                    try {
                        // Fetch all appointments at once using the list endpoint
                        const appointmentsResponse = await fetch(`${API_BASE_URL}/appointments`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        
                        if (appointmentsResponse.ok) {
                            const appointmentsData = await appointmentsResponse.json();
                            if (appointmentsData.success && Array.isArray(appointmentsData.data)) {
                                // Create a map of appointment_id -> appointment data for quick lookup
                                appointmentsData.data.forEach(apt => {
                                    validAppointments[apt.appointment_id] = apt;
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('Error batch fetching appointments for validation:', error.message);
                        // Continue without validation if batch fetch fails
                    }
                }
                
                // Filter and enrich notifications with appointment data using the batch-fetched map
                const validatedNotifications = allNotifications
                    .map((notif) => {
                        // If notification has an appointment_id, check if it exists in our batch fetch
                        if (notif.appointment_id) {
                            const appointment = validAppointments[notif.appointment_id];
                            if (appointment) {
                                // Appointment exists - include notification with updated status and full details
                                return {
                                    ...notif,
                                    appointment: notif.appointment ? {
                                        ...notif.appointment,
                                        status: appointment.status
                                    } : {
                                        appointment_id: appointment.appointment_id,
                                        appointment_type: appointment.appointment_type,
                                        scheduled_start: appointment.scheduled_start,
                                        status: appointment.status
                                    },
                                    appointment_status: appointment.status,
                                    appointmentDetails: appointment // Attach full appointment details for formatting
                                };
                            } else {
                                // Appointment not found in batch fetch - it was likely deleted/cancelled
                                // Silently filter out (don't show notification for non-existent appointments)
                                return null;
                            }
                        }
                        // No appointment_id, include notification as-is
                        return notif;
                    })
                    .filter(notif => notif !== null);
                
                // Aggressive deduplication: keep only ONE notification per appointment_id
                // Prefer in_app_messages (has message_id) over notifications table
                const seenAppointments = new Map();
                const deduplicatedNotifications = [];
                
                // Separate notifications by source: in_app_messages vs notifications table
                const inAppMessages = validatedNotifications.filter(n => n.message_id);
                const tableNotifications = validatedNotifications.filter(n => !n.message_id);
                
                // First, add all in_app_messages (preferred source)
                for (const notif of inAppMessages) {
                    if (notif.appointment_id) {
                        const key = notif.appointment_id;
                        if (!seenAppointments.has(key)) {
                            seenAppointments.set(key, notif);
                            deduplicatedNotifications.push(notif);
                        }
                    } else {
                        // For notifications without appointment_id, deduplicate by title + message
                        const key = `${notif.title || ''}_${notif.message?.substring(0, 50) || ''}`;
                        if (!seenAppointments.has(key)) {
                            seenAppointments.set(key, notif);
                            deduplicatedNotifications.push(notif);
                        }
                    }
                }
                
                // Then, only add notifications table entries if we don't already have that appointment_id
                for (const notif of tableNotifications) {
                    if (notif.appointment_id) {
                        const key = notif.appointment_id;
                        if (!seenAppointments.has(key)) {
                            seenAppointments.set(key, notif);
                            deduplicatedNotifications.push(notif);
                        }
                    } else {
                        // For notifications without appointment_id, deduplicate by title + message
                        const key = `${notif.title || ''}_${notif.message?.substring(0, 50) || ''}`;
                        if (!seenAppointments.has(key)) {
                            seenAppointments.set(key, notif);
                            deduplicatedNotifications.push(notif);
                        }
                    }
                }
                
                // Sort by timestamp (newest first)
                deduplicatedNotifications.sort((a, b) => {
                    const dateA = new Date(a.timestamp || a.created_at || 0);
                    const dateB = new Date(b.timestamp || b.created_at || 0);
                    return dateB - dateA;
                });
                
                // Set notifications - only validated and deduplicated ones
                setNotifications(deduplicatedNotifications);
                setUnreadCount(deduplicatedNotifications.filter(n => !n.read && !n.is_read).length);
            } else {
                // If API call fails, clear notifications
                setNotifications([]);
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // On error, clear notifications
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    useEffect(() => {
        // Fetch notifications on mount
        fetchNotifications();

        // Set up interval to refresh notifications every 10 seconds
        const interval = setInterval(() => {
            fetchNotifications();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!socket) {
            console.warn('⚠️ Socket not available in NotificationSystemStaff');
            return;
        }

        const setupSocket = () => {
            if (socket.connected) {
                joinUserRoom();
                setupListeners();
            } else {
                socket.on('connect', () => {
                    console.log('✅ Socket connected in NotificationSystemStaff');
                    joinUserRoom();
                    setupListeners();
                });
            }
        };

        const joinUserRoom = () => {
            const token = getAuthToken();
            if (token) {
                fetch(`${API_BASE_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.user?.user_id) {
                            socket.emit('joinRoom', data.user.user_id);
                            console.log('✅ Joined user room:', data.user.user_id);
                        }
                    })
                    .catch(err => console.error('Error joining user room:', err));
            }
        };

        const setupListeners = () => {
            socket.on('newNotification', (data) => {
                console.log('🔔 New notification received via WebSocket:', data);
                fetchNotifications();

                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(data.title || 'New Notification', {
                        body: data.message || 'You have a new notification',
                        icon: '/favicon.ico',
                        tag: `notification-${data.appointment_id || Date.now()}`,
                    });
                }
            });

            socket.on('newAppointment', (data) => {
                console.log('📅 New appointment notification:', data);
                fetchNotifications();
            });

            socket.on('appointmentUpdated', (data) => {
                console.log('🔄 Appointment updated via socket:', data);
                // Refresh notifications to get the latest data
                fetchNotifications();
            });
        };

        setupSocket();

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            socket.off('newNotification');
            socket.off('newAppointment');
            socket.off('appointmentUpdated');
            socket.off('connect');
        };
    }, [socket]);

    const markAsRead = async (id, isRead = true) => {
        const notification = notifications.find(n => n.id === id);
        const notificationId = notification?.message_id || notification?.notification_id || id;
        
        if (notificationId) {
            try {
                const token = getAuthToken();
                if (token) {
                    await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
                        method: 'PUT',
                        headers: { 
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_read: isRead })
                    });
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        
        setNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: isRead, is_read: isRead } : n)
        );
        setUnreadCount(prev => isRead ? Math.max(0, prev - 1) : prev + 1);
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.read && n.message_id);
        for (const notif of unreadNotifications) {
            try {
                const token = getAuthToken();
                if (token) {
                    await fetch(`${API_BASE_URL}/notifications/${notif.message_id}/read`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const removeNotification = (id) => {
        const notification = notifications.find(n => n.id === id);
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    // Handle appointment confirmation (accept/decline)
    const handleAppointmentAction = async (appointmentId, action) => {
        setProcessingAction(appointmentId);
        try {
            const token = getAuthToken();
            const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/${action}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            
            if (data.success) {
                await fetchNotifications();
                alert(action === 'accept' ? 'Appointment accepted successfully' : 'Appointment declined');
            } else {
                alert(data.message || `Failed to ${action} appointment`);
            }
        } catch (error) {
            console.error(`Error ${action}ing appointment:`, error);
            alert(`Error ${action}ing appointment: ${error.message}`);
        } finally {
            setProcessingAction(null);
        }
    };

    const handleNotificationClick = async (notification) => {
        // Only mark as read if currently unread (don't toggle)
        const isCurrentlyRead = notification.read || notification.is_read;
        if (!isCurrentlyRead) {
            markAsRead(notification.id, true);
        }
        
        if (notification.appointment_id) {
            setLoadingAppointment(true);
            try {
                const token = getAuthToken();
                const response = await fetch(`${API_BASE_URL}/appointments/${notification.appointment_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setSelectedAppointment({ ...data.data, notificationId: notification.id, messageId: notification.message_id });
                        setShowAppointmentModal(true);
                    } else {
                        alert('Failed to load appointment details');
                    }
                } else if (response.status === 404) {
                    // Appointment was deleted - show user-friendly message
                    alert('This appointment no longer exists. It may have been cancelled or deleted.');
                } else {
                    alert('Failed to load appointment details. Please try again.');
                }
            } catch (error) {
                console.error('Error fetching appointment:', error);
                alert('Error loading appointment: ' + error.message);
            } finally {
                setLoadingAppointment(false);
            }
        } else {
            setSelectedNotification(notification);
            setShowNotificationModal(true);
        }
    };

    // Helper function to format notification message based on type
    const formatNotificationMessage = (notification) => {
        const details = notification.appointmentDetails;
        
        const isApproved = notification.type === 'appointment_approved' || 
                          notification.type === 'appointment_request_approved' ||
                          notification.title?.toLowerCase().includes('approved') ||
                          notification.message?.toLowerCase().includes('approved');
        
        const isDeclined = notification.type === 'appointment_declined' || 
                          notification.type === 'appointment_request_declined' ||
                          notification.title?.toLowerCase().includes('declined') ||
                          notification.message?.toLowerCase().includes('declined');

        if (isApproved && details) {
            const appointmentDate = new Date(details.scheduled_start || notification.appointment?.scheduled_start);
            const appointmentTime = new Date(details.scheduled_start || notification.appointment?.scheduled_start);
            const patientName = details.patient_name || 'Patient';
            const facilityName = details.facility_name || 'Facility';
            const providerName = details.provider_name || 'Provider';
            const appointmentType = details.appointment_type || notification.appointment?.appointment_type || 'Appointment';
            
            return {
                formatted: true,
                subject: '✅ Appointment Confirmed - MyHubCares',
                greeting: `Dear ${patientName},`,
                mainMessage: 'Your appointment request has been APPROVED!',
                details: [
                    { icon: '📅', label: 'Date', value: appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: '⏰', label: 'Time', value: appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                    { icon: '🏥', label: 'Branch', value: facilityName },
                    { icon: '👨‍⚕️', label: 'Provider', value: providerName },
                    { icon: '📝', label: 'Type', value: appointmentType.replace(/_/g, ' ').toUpperCase() }
                ],
                notes: details.case_manager_notes || details.notes || null,
                footer: 'Please arrive 15 minutes before your scheduled time.',
                closing: 'Thank you for choosing MyHubCares!'
            };
        }

        if (isDeclined) {
            const appointmentDate = details?.scheduled_start || notification.appointment?.scheduled_start || notification.timestamp;
            const appointmentTime = details?.scheduled_start || notification.appointment?.scheduled_start || notification.timestamp;
            const patientName = details?.patient_name || 'Patient';
            const declineReason = notification.decline_reason || 
                                 (notification.message?.includes('Reason:') ? notification.message.split('Reason:')[1]?.trim() : null) ||
                                 'No reason provided';
            
            return {
                formatted: true,
                subject: '❌ Appointment Request Update - MyHubCares',
                greeting: `Dear ${patientName},`,
                mainMessage: 'We regret to inform you that your appointment request could not be approved.',
                details: [
                    { icon: '📅', label: 'Requested Date', value: new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: '⏰', label: 'Requested Time', value: new Date(appointmentTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
                ],
                declineReason: declineReason,
                footer: 'Please submit a new request with a different date/time or contact us for assistance.',
                closing: 'Thank you for your understanding.'
            };
        }

        return { formatted: false };
    };

    const unreadNotifications = notifications.filter(n => !n.read);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => {
                    setShowDropdown(!showDropdown);
                    if (!showDropdown) {
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
                }}
            >
                <Bell size={24} color="#B82132" />
                {unreadCount > 0 && (
                    <span
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: '#EF4444',
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

            {showDropdown && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 1000,
                        }}
                        onClick={() => setShowDropdown(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '50px',
                            right: 0,
                            width: '400px',
                            maxHeight: '500px',
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                            zIndex: 1001,
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #e5e7eb',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                                Notifications
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#B82132',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                    }}
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div
                                    style={{
                                        padding: '40px 20px',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                    }}
                                >
                                    <Bell size={48} color="#d1d5db" style={{ marginBottom: '12px' }} />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const isClickable = true;
                                    // Only physicians and nurses should see Accept/Decline buttons
                                    // Show Accept/Decline only for appointment notifications that require confirmation
                                    // But disable if appointment is already accepted/confirmed (not 'scheduled' - that's the initial state)
                                    const appointmentStatus = notification.appointment_status || notification.appointment?.status;
                                    const isAppointmentFinalized = appointmentStatus === 'accepted' || 
                                                                   appointmentStatus === 'confirmed';
                                    const requiresAction = (currentUserRole === 'physician' || currentUserRole === 'nurse') &&
                                                          notification.requires_confirmation && 
                                                          notification.appointment_id &&
                                                          (notification.type === 'appointment' || notification.type === 'appointment_created') &&
                                                          !isAppointmentFinalized;
                                    
                                    // Get formatted notification if it's an approval/decline
                                    const formatted = formatNotificationMessage(notification);
                                    
                                    return (
                                        <div
                                            key={notification.id}
                                            onClick={(e) => {
                                                if (e.target.closest('button')) {
                                                    return;
                                                }
                                                if (isClickable) {
                                                    handleNotificationClick(notification);
                                                }
                                            }}
                                            style={{
                                                padding: '16px 20px',
                                                borderBottom: '1px solid #f3f4f6',
                                                background: notification.read ? 'white' : '#eff6ff',
                                                cursor: isClickable ? 'pointer' : 'default',
                                                transition: 'background 0.2s',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (isClickable) {
                                                    e.currentTarget.style.background = '#f9fafb';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = notification.read ? 'white' : '#eff6ff';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'start',
                                                }}
                                            >
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            marginBottom: '6px',
                                                        }}
                                                    >
                                                        <Calendar size={16} color="#B82132" />
                                                        <strong
                                                            style={{
                                                                fontSize: '14px',
                                                                color: '#1f2937',
                                                            }}
                                                        >
                                                            {formatted.formatted ? formatted.subject : notification.title}
                                                        </strong>
                                                        {!notification.read && !notification.is_read && (
                                                            <span
                                                                style={{
                                                                    width: '8px',
                                                                    height: '8px',
                                                                    borderRadius: '50%',
                                                                    background: '#2563EB',
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    
                                                    {formatted.formatted ? (
                                                        <div style={{ fontSize: '13px', color: '#374151', lineHeight: '1.8' }}>
                                                            <p style={{ margin: '4px 0', fontWeight: '500' }}>{formatted.greeting}</p>
                                                            <p style={{ margin: '8px 0', fontWeight: '600', color: '#1f2937' }}>{formatted.mainMessage}</p>
                                                            
                                                            {formatted.details && formatted.details.length > 0 && (
                                                                <div style={{ 
                                                                    marginTop: '12px', 
                                                                    padding: '12px', 
                                                                    background: '#f9fafb', 
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #e5e7eb'
                                                                }}>
                                                                    {formatted.details.map((detail, idx) => (
                                                                        <div key={idx} style={{ marginBottom: '6px', fontSize: '13px', lineHeight: '1.6' }}>
                                                                            <span style={{ marginRight: '6px' }}>{detail.icon}</span>
                                                                            <strong>{detail.label}:</strong> {detail.value}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            {formatted.notes && (
                                                                <div style={{
                                                                    marginTop: '12px',
                                                                    padding: '12px',
                                                                    background: '#eff6ff',
                                                                    borderRadius: '8px',
                                                                    fontSize: '13px',
                                                                    color: '#1e40af',
                                                                    fontStyle: 'italic',
                                                                    whiteSpace: 'pre-wrap'
                                                                }}>
                                                                    {formatted.notes}
                                                                </div>
                                                            )}
                                                            
                                                            {formatted.declineReason && (
                                                                <div style={{
                                                                    marginTop: '12px',
                                                                    padding: '12px',
                                                                    background: '#fef2f2',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #fecaca',
                                                                    fontSize: '13px',
                                                                    color: '#991b1b'
                                                                }}>
                                                                    <strong>Reason:</strong> {formatted.declineReason}
                                                                </div>
                                                            )}
                                                            
                                                            {formatted.footer && (
                                                                <p style={{ margin: '12px 0 8px 0', fontSize: '13px', color: '#6b7280' }}>
                                                                    {formatted.footer}
                                                                </p>
                                                            )}
                                                            
                                                            <p style={{ margin: '8px 0 0 0', fontSize: '13px', fontWeight: '500', color: '#1f2937' }}>
                                                                {formatted.closing}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p
                                                            style={{
                                                                fontSize: '13px',
                                                                color: '#6b7280',
                                                                margin: '4px 0',
                                                                lineHeight: '1.5',
                                                            }}
                                                        >
                                                            {notification.message.includes('has been accepted.') ? (
                                                                <>
                                                                    {notification.message.split('has been accepted.')[0]}
                                                                    <strong>has been accepted.</strong>
                                                                </>
                                                            ) : (
                                                                notification.message
                                                            )}
                                                        </p>
                                                    )}
                                                    
                                                    {!formatted.formatted && notification.appointment && (
                                                        <div
                                                            style={{
                                                                marginTop: '8px',
                                                                padding: '8px',
                                                                background: '#f9fafb',
                                                                borderRadius: '6px',
                                                                fontSize: '12px',
                                                                color: '#6b7280',
                                                            }}
                                                        >
                                                            <div>
                                                                Type: {notification.appointment.appointment_type?.replace('_', ' ').toUpperCase()}
                                                            </div>
                                                            <div>
                                                                Date: {new Date(notification.appointment.scheduled_start).toLocaleDateString()}
                                                            </div>
                                                            <div>
                                                                Time: {new Date(notification.appointment.scheduled_start).toLocaleTimeString()}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {requiresAction && (
                                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAppointmentAction(notification.appointment_id, 'accept');
                                                                }}
                                                                disabled={processingAction === notification.appointment_id || isAppointmentFinalized}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: (processingAction === notification.appointment_id || isAppointmentFinalized) ? '#9ca3af' : '#10b981',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: (processingAction === notification.appointment_id || isAppointmentFinalized) ? 'not-allowed' : 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                }}
                                                            >
                                                                <Check size={14} />
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const reason = prompt('Please provide a reason for declining:');
                                                                    if (reason !== null) {
                                                                        handleAppointmentAction(notification.appointment_id, 'decline');
                                                                    }
                                                                }}
                                                                disabled={processingAction === notification.appointment_id || isAppointmentFinalized}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: (processingAction === notification.appointment_id || isAppointmentFinalized) ? '#9ca3af' : '#ef4444',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: (processingAction === notification.appointment_id || isAppointmentFinalized) ? 'not-allowed' : 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '4px',
                                                                }}
                                                            >
                                                                <XCircle size={14} />
                                                                Decline
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const isCurrentlyRead = notification.read || notification.is_read;
                                                                markAsRead(notification.id, !isCurrentlyRead);
                                                            }}
                                                            style={{
                                                                padding: '4px 8px',
                                                                background: (notification.read || notification.is_read) ? '#6b7280' : '#2563eb',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: '500',
                                                            }}
                                                        >
                                                            {(notification.read || notification.is_read) ? 'Mark as Unread' : 'Mark as Read'}
                                                        </button>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '11px',
                                                            color: '#9ca3af',
                                                            marginTop: '8px',
                                                        }}
                                                    >
                                                        {new Date(notification.timestamp).toLocaleString()}
                                                    </div>
                                                    {notification.appointment_id && (
                                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    handleNotificationClick(notification);
                                                                }}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    background: '#2563eb',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600',
                                                                }}
                                                            >
                                                                View Details
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeNotification(notification.id);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        color: '#9ca3af',
                                                    }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </>
            )}

            {showAppointmentModal && selectedAppointment && (
                <AppointmentDetailsModal
                    appointment={selectedAppointment}
                    onClose={() => {
                        setShowAppointmentModal(false);
                        setSelectedAppointment(null);
                    }}
                />
            )}

            {showNotificationModal && selectedNotification && (
                <NotificationDetailsModal
                    notification={selectedNotification}
                    onClose={() => {
                        setShowNotificationModal(false);
                        setSelectedNotification(null);
                    }}
                />
            )}
        </div>
    );
};

// Appointment Details Modal Component
const AppointmentDetailsModal = ({ appointment, onClose }) => {
    const startDate = new Date(appointment.scheduled_start);
    const endDate = new Date(appointment.scheduled_end);

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
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1f2937' }}>Appointment Details</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '4px'
                        }}
                    >
                        <X size={24} color="#6c757d" />
                    </button>
                </div>

                <div style={{ marginBottom: '20px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                        <strong>Patient:</strong> {appointment.patient_name || 'N/A'}
                    </p>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Date & Time
                    </label>
                    <div style={{
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px',
                        background: '#f9fafb'
                    }}>
                        {startDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        <br />
                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Facility
                    </label>
                    <div style={{
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px',
                        background: '#f9fafb'
                    }}>
                        {appointment.facility_name || 'N/A'}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                        Appointment Type
                    </label>
                    <div style={{
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        fontSize: '14px',
                        background: '#f9fafb'
                    }}>
                        {appointment.appointment_type?.replace('_', ' ').toUpperCase() || 'N/A'}
                    </div>
                </div>

                {appointment.provider_name && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Provider
                        </label>
                        <div style={{
                            padding: '8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: '#f9fafb'
                        }}>
                            {appointment.provider_name}
                        </div>
                    </div>
                )}

                {appointment.reason && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Reason
                        </label>
                        <div style={{
                            padding: '8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: '#f9fafb'
                        }}>
                            {appointment.reason}
                        </div>
                    </div>
                )}

                {appointment.notes && (
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                            Notes
                        </label>
                        <div style={{
                            padding: '8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '14px',
                            background: '#f9fafb',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {appointment.notes}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// Notification Details Modal Component
const NotificationDetailsModal = ({ notification, onClose }) => {
    // Use the formatNotificationMessage function to get formatted layout
    const formatNotificationMessage = (notification) => {
        const details = notification.appointmentDetails;
        
        const isApproved = notification.type === 'appointment_approved' || 
                          notification.type === 'appointment_request_approved' ||
                          notification.title?.toLowerCase().includes('approved') ||
                          notification.message?.toLowerCase().includes('approved');
        
        const isDeclined = notification.type === 'appointment_declined' || 
                          notification.type === 'appointment_request_declined' ||
                          notification.title?.toLowerCase().includes('declined') ||
                          notification.message?.toLowerCase().includes('declined');

        if (isApproved && details) {
            const appointmentDate = new Date(details.scheduled_start || notification.appointment?.scheduled_start);
            const appointmentTime = new Date(details.scheduled_start || notification.appointment?.scheduled_start);
            const patientName = details.patient_name || 'Patient';
            const facilityName = details.facility_name || 'Facility';
            const providerName = details.provider_name || 'Provider';
            const appointmentType = details.appointment_type || notification.appointment?.appointment_type || 'Appointment';
            
            return {
                formatted: true,
                subject: '✅ Appointment Confirmed - MyHubCares',
                greeting: `Dear ${patientName},`,
                mainMessage: 'Your appointment request has been APPROVED!',
                details: [
                    { icon: '📅', label: 'Date', value: appointmentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: '⏰', label: 'Time', value: appointmentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) },
                    { icon: '🏥', label: 'Branch', value: facilityName },
                    { icon: '👨‍⚕️', label: 'Provider', value: providerName },
                    { icon: '📝', label: 'Type', value: appointmentType.replace(/_/g, ' ').toUpperCase() }
                ],
                notes: details.case_manager_notes || details.notes || null,
                footer: 'Please arrive 15 minutes before your scheduled time.',
                closing: 'Thank you for choosing MyHubCares!'
            };
        }

        if (isDeclined) {
            const appointmentDate = details?.scheduled_start || notification.appointment?.scheduled_start || notification.timestamp;
            const appointmentTime = details?.scheduled_start || notification.appointment?.scheduled_start || notification.timestamp;
            const patientName = details?.patient_name || 'Patient';
            const declineReason = notification.decline_reason || 
                                 (notification.message?.includes('Reason:') ? notification.message.split('Reason:')[1]?.trim() : null) ||
                                 'No reason provided';
            
            return {
                formatted: true,
                subject: '❌ Appointment Request Update - MyHubCares',
                greeting: `Dear ${patientName},`,
                mainMessage: 'We regret to inform you that your appointment request could not be approved.',
                details: [
                    { icon: '📅', label: 'Requested Date', value: new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { icon: '⏰', label: 'Requested Time', value: new Date(appointmentTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
                ],
                declineReason: declineReason,
                footer: 'Please submit a new request with a different date/time or contact us for assistance.',
                closing: 'Thank you for your understanding.'
            };
        }

        return { formatted: false };
    };

    const formatted = formatNotificationMessage(notification);

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
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: '#1f2937' }}>Notification Details</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '5px',
                            borderRadius: '4px'
                        }}
                    >
                        <X size={24} color="#6c757d" />
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Calendar size={20} color="#B82132" />
                        <h3 style={{ margin: 0, fontSize: '18px', color: '#1f2937' }}>
                            {formatted.formatted ? formatted.subject : notification.title}
                        </h3>
                    </div>
                    
                    {formatted.formatted ? (
                        <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.8' }}>
                            <p style={{ margin: '8px 0', fontWeight: '500' }}>{formatted.greeting}</p>
                            <p style={{ margin: '12px 0', fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>{formatted.mainMessage}</p>
                            
                            {formatted.details && formatted.details.length > 0 && (
                                <div style={{ 
                                    marginTop: '16px', 
                                    padding: '16px', 
                                    background: '#f9fafb', 
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {formatted.details.map((detail, idx) => (
                                        <div key={idx} style={{ marginBottom: '8px', fontSize: '14px', lineHeight: '1.6' }}>
                                            <span style={{ marginRight: '8px' }}>{detail.icon}</span>
                                            <strong>{detail.label}:</strong> {detail.value}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {formatted.notes && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    background: '#eff6ff',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    color: '#1e40af',
                                    fontStyle: 'italic',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {formatted.notes}
                                </div>
                            )}
                            
                            {formatted.declineReason && (
                                <div style={{
                                    marginTop: '16px',
                                    padding: '16px',
                                    background: '#fef2f2',
                                    borderRadius: '8px',
                                    border: '1px solid #fecaca',
                                    fontSize: '14px',
                                    color: '#991b1b'
                                }}>
                                    <strong>Reason:</strong> {formatted.declineReason}
                                </div>
                            )}
                            
                            {formatted.footer && (
                                <p style={{ margin: '16px 0 12px 0', fontSize: '14px', color: '#6b7280' }}>
                                    {formatted.footer}
                                </p>
                            )}
                            
                            <p style={{ margin: '12px 0 0 0', fontSize: '14px', fontWeight: '500', color: '#1f2937' }}>
                                {formatted.closing}
                            </p>
                        </div>
                    ) : (
                        <div style={{ marginBottom: '16px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                            <p style={{ margin: 0, fontSize: '16px', color: '#374151', lineHeight: '1.5' }}>
                                {notification.message}
                            </p>
                        </div>
                    )}

                    <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'right', marginTop: '20px' }}>
                        Received: {new Date(notification.timestamp).toLocaleString()}
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button 
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600'
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationSystemStaff;

