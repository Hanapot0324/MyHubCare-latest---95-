import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'package:intl/intl.dart';
import 'dart:convert';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _processingAction;
  Map<String, dynamic>? _selectedAppointment;
  Map<String, dynamic>? _selectedNotification;
  bool _showAppointmentModal = false;
  bool _showNotificationModal = false;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getNotifications();
      if (result['success'] == true) {
        final data = result['data'];
        List<dynamic> allNotifications = [];
        
        if (data is List) {
          allNotifications = data;
        } else if (data is Map) {
          allNotifications = data['in_app_messages'] ?? data['messages'] ?? [];
        }

        // Validate appointments exist before showing notifications
        final validatedNotifications = await _validateNotifications(allNotifications);
        
        // Deduplicate: prefer in_app_messages over notifications table
        final deduplicated = _deduplicateNotifications(validatedNotifications);
        
        setState(() {
          _notifications = deduplicated;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result['message'] ?? 'Failed to load notifications')),
          );
        }
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading notifications: ${e.toString()}')),
        );
      }
    }
  }

  Future<List<dynamic>> _validateNotifications(List<dynamic> notifications) async {
    final validated = <dynamic>[];
    
    for (final notif in notifications) {
      final appointmentId = notif['appointment_id'];
      
      if (appointmentId != null) {
        try {
          final result = await ApiService.getAppointmentById(appointmentId);
          if (result['success'] == true && result['data'] != null) {
            validated.add({
              ...notif,
              'appointmentDetails': result['data'],
            });
          }
          // If appointment doesn't exist (404), silently filter out
        } catch (e) {
          // On error, filter out to be safe
        }
      } else {
        // No appointment_id, include notification as-is
        validated.add(notif);
      }
    }
    
    return validated;
  }

  List<dynamic> _deduplicateNotifications(List<dynamic> notifications) {
    final seenAppointments = <String, dynamic>{};
    final deduplicated = <dynamic>[];
    
    // Separate by source
    final inAppMessages = notifications.where((n) => n['message_id'] != null).toList();
    final tableNotifications = notifications.where((n) => n['message_id'] == null).toList();
    
    // First, add all in_app_messages (preferred source)
    for (final notif in inAppMessages) {
      if (notif['appointment_id'] != null) {
        final key = notif['appointment_id'].toString();
        if (!seenAppointments.containsKey(key)) {
          seenAppointments[key] = notif;
          deduplicated.add(notif);
        }
      } else {
        final key = '${notif['title'] ?? ''}_${(notif['message'] ?? '').substring(0, (notif['message'] ?? '').length > 50 ? 50 : (notif['message'] ?? '').length)}';
        if (!seenAppointments.containsKey(key)) {
          seenAppointments[key] = notif;
          deduplicated.add(notif);
        }
      }
    }
    
    // Only add table notifications if they don't have appointment_id (system notifications)
    for (final notif in tableNotifications) {
      if (notif['appointment_id'] != null) {
        continue; // Skip - we already have the in_app_message version
      } else {
        final key = '${notif['title'] ?? ''}_${(notif['message'] ?? '').substring(0, (notif['message'] ?? '').length > 50 ? 50 : (notif['message'] ?? '').length)}';
        if (!seenAppointments.containsKey(key)) {
          seenAppointments[key] = notif;
          deduplicated.add(notif);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    deduplicated.sort((a, b) {
      final dateA = DateTime.tryParse(a['timestamp'] ?? a['created_at'] ?? a['sent_at'] ?? '') ?? DateTime(1970);
      final dateB = DateTime.tryParse(b['timestamp'] ?? b['created_at'] ?? b['sent_at'] ?? '') ?? DateTime(1970);
      return dateB.compareTo(dateA);
    });
    
    return deduplicated;
  }

  Future<void> _refreshNotifications() async {
    setState(() => _isRefreshing = true);
    await _loadNotifications();
    setState(() => _isRefreshing = false);
  }

  Future<void> _markAsRead(String id, bool isRead) async {
    final notification = _notifications.firstWhere(
      (n) => n['id'] == id || n['message_id'] == id || n['notification_id'] == id,
      orElse: () => {},
    );
    
    final notificationId = notification['message_id'] ?? notification['notification_id'] ?? id;
    
    if (notificationId.isNotEmpty) {
      final result = await ApiService.markNotificationAsRead(notificationId);
      if (result['success'] == true) {
        setState(() {
          final index = _notifications.indexWhere(
            (n) => n['id'] == id || n['message_id'] == id || n['notification_id'] == id,
          );
          if (index != -1) {
            _notifications[index]['read'] = isRead;
            _notifications[index]['is_read'] = isRead;
          }
        });
      }
    }
  }

  Future<void> _markAllAsRead() async {
    final result = await ApiService.markAllNotificationsAsRead();
    if (result['success'] == true) {
      setState(() {
        for (var notification in _notifications) {
          notification['read'] = true;
          notification['is_read'] = true;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('All notifications marked as read')),
        );
      }
    }
  }

  void _removeNotification(String id) {
    setState(() {
      _notifications.removeWhere(
        (n) => n['id'] == id || n['message_id'] == id || n['notification_id'] == id,
      );
    });
  }

  Future<void> _handleAppointmentConfirm(String appointmentId) async {
    setState(() => _processingAction = appointmentId);
    try {
      final result = await ApiService.confirmAppointment(appointmentId);
      if (result['success'] == true) {
        await _loadNotifications();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Appointment confirmed successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to confirm appointment'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error confirming appointment: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _processingAction = null);
    }
  }

  Future<void> _handleNotificationClick(dynamic notification) async {
    final isRead = notification['read'] == true || notification['is_read'] == true;
    if (!isRead) {
      final id = notification['id'] ?? notification['message_id'] ?? notification['notification_id'];
      if (id != null) {
        await _markAsRead(id, true);
      }
    }
    
    if (notification['appointment_id'] != null) {
      try {
        final result = await ApiService.getAppointmentById(notification['appointment_id']);
        if (result['success'] == true && result['data'] != null) {
          setState(() {
            _selectedAppointment = {
              ...result['data'],
              'notificationId': notification['id'] ?? notification['message_id'],
              'messageId': notification['message_id'],
            };
            _showAppointmentModal = true;
          });
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text('Failed to load appointment details')),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error loading appointment: ${e.toString()}')),
          );
        }
      }
    } else {
      setState(() {
        _selectedNotification = notification;
        _showNotificationModal = true;
      });
    }
  }

  Map<String, dynamic>? _formatNotificationMessage(dynamic notification) {
    final details = notification['appointmentDetails'];
    
    final isApproved = notification['type']?.toString().contains('approved') == true ||
        notification['title']?.toString().toLowerCase().contains('approved') == true ||
        notification['message']?.toString().toLowerCase().contains('approved') == true ||
        notification['message']?.toString().toLowerCase().contains('has been approved') == true;
    
    final isDeclined = notification['type']?.toString().contains('declined') == true ||
        notification['title']?.toString().toLowerCase().contains('declined') == true ||
        notification['message']?.toString().toLowerCase().contains('declined') == true;
    
    if (isApproved) {
      String? scheduledStart = details?['scheduled_start'] ?? 
          _parsePayload(notification['payload'])?['scheduled_start'];
      
      if (scheduledStart == null && notification['message'] != null) {
        final match = RegExp(r'(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}).*?(\d{1,2}:\d{2}(?::\d{2})?)')
            .firstMatch(notification['message']);
        if (match != null) {
          try {
            String dateStr = match.group(1)!;
            String timeStr = match.group(2)!;
            if (dateStr.contains('/')) {
              final parts = dateStr.split('/');
              dateStr = '${parts[2]}-${parts[0].padLeft(2, '0')}-${parts[1].padLeft(2, '0')}';
            }
            scheduledStart = '$dateStr ${timeStr.padRight(8, ':00')}';
          } catch (e) {}
        }
      }
      
      final appointmentDate = scheduledStart != null ? DateTime.tryParse(scheduledStart) : null;
      final patientName = details?['patient_name'] ?? 'Patient';
      final facilityName = details?['facility_name'] ?? 'Facility';
      final providerName = details?['provider_name'] ?? 'Provider';
      final appointmentType = details?['appointment_type'] ?? 
          _parsePayload(notification['payload'])?['appointment_type'] ?? 'Appointment';
      
      final detailsArray = <Map<String, String>>[];
      
      if (appointmentDate != null) {
        detailsArray.add({
          'icon': '📅',
          'label': 'Date',
          'value': DateFormat('EEEE, MMMM d, yyyy').format(appointmentDate),
        });
        detailsArray.add({
          'icon': '⏰',
          'label': 'Time',
          'value': DateFormat('h:mm a').format(appointmentDate),
        });
      }
      
      detailsArray.add({'icon': '🏥', 'label': 'Branch', 'value': facilityName});
      detailsArray.add({'icon': '👨‍⚕️', 'label': 'Provider', 'value': providerName});
      detailsArray.add({
        'icon': '📝',
        'label': 'Type',
        'value': appointmentType.toString().replaceAll('_', ' ').toUpperCase(),
      });
      
      return {
        'formatted': true,
        'subject': '✅ Appointment Confirmed - MyHubCares',
        'greeting': 'Dear $patientName,',
        'mainMessage': 'Your appointment request has been APPROVED!',
        'details': detailsArray,
        'notes': details?['case_manager_notes'] ?? details?['notes'],
        'footer': 'Please arrive 15 minutes before your scheduled time.',
        'closing': 'Thank you for choosing MyHubCares!',
      };
    }
    
    if (isDeclined) {
      final scheduledStart = details?['scheduled_start'] ?? 
          _parsePayload(notification['payload'])?['scheduled_start'] ?? 
          notification['timestamp'];
      final appointmentDate = DateTime.tryParse(scheduledStart?.toString() ?? '') ?? DateTime.now();
      final patientName = details?['patient_name'] ?? 'Patient';
      final facilityName = details?['facility_name'] ?? 'Facility';
      final providerName = details?['provider_name'] ?? 'Provider';
      final appointmentType = details?['appointment_type'] ?? 
          _parsePayload(notification['payload'])?['appointment_type'] ?? 'Appointment';
      final declineReason = notification['decline_reason'] ?? 
          (notification['message']?.toString().contains('Reason:') == true
              ? notification['message'].toString().split('Reason:')[1].trim()
              : null) ??
          'No reason provided';
      
      return {
        'formatted': true,
        'subject': '❌ Appointment Request Update - MyHubCares',
        'greeting': 'Dear $patientName,',
        'mainMessage': 'We regret to inform you that your appointment request could not be approved.',
        'details': [
          {'icon': '📅', 'label': 'Date', 'value': DateFormat('EEEE, MMMM d, yyyy').format(appointmentDate)},
          {'icon': '⏰', 'label': 'Time', 'value': DateFormat('h:mm a').format(appointmentDate)},
          {'icon': '🏥', 'label': 'Branch', 'value': facilityName},
          {'icon': '👨‍⚕️', 'label': 'Provider', 'value': providerName},
          {'icon': '📝', 'label': 'Type', 'value': appointmentType.toString().replaceAll('_', ' ').toUpperCase()},
        ],
        'declineReason': declineReason,
        'footer': 'Please submit a new request with a different date/time or contact us for assistance.',
        'closing': 'Thank you for your understanding.',
      };
    }
    
    return {'formatted': false};
  }

  Map<String, dynamic>? _parsePayload(dynamic payload) {
    if (payload == null) return null;
    try {
      if (payload is String) {
        return jsonDecode(payload) as Map<String, dynamic>;
      } else if (payload is Map) {
        return payload as Map<String, dynamic>;
      }
    } catch (e) {}
    return null;
  }

  String _formatDate(String? dateString) {
    if (dateString == null || dateString.isEmpty) return 'Just now';
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          if (difference.inMinutes == 0) return 'Just now';
          return '${difference.inMinutes} minute${difference.inMinutes == 1 ? '' : 's'} ago';
        }
        return '${difference.inHours} hour${difference.inHours == 1 ? '' : 's'} ago';
      } else if (difference.inDays == 1) {
        return 'Yesterday';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} days ago';
      } else {
        return DateFormat('MMM d, yyyy').format(date);
      }
    } catch (e) {
      return 'Recently';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => 
      n['read'] != true && n['is_read'] != true
    ).length;

    return Stack(
      children: [
        Scaffold(
      appBar: AppBar(
        title: Text('Notifications'),
        backgroundColor: Color(0xFFB82132),
        foregroundColor: Colors.white,
        actions: [
          if (unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Mark all read',
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _refreshNotifications,
              child: _notifications.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
                          SizedBox(height: 16),
                          Text(
                            'No notifications',
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'You\'re all caught up!',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[500],
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _notifications.length,
                      itemBuilder: (context, index) {
                        final notification = _notifications[index];
                        final isRead = notification['read'] == true || notification['is_read'] == true;
                        final id = notification['id'] ?? notification['message_id'] ?? notification['notification_id'];
                        final formatted = _formatNotificationMessage(notification);
                        final requiresConfirmation = notification['requires_confirmation'] == true &&
                            notification['appointment_id'] != null &&
                            notification['type']?.toString().contains('created') != true;
                        
                        return InkWell(
                          onTap: () => _handleNotificationClick(notification),
                          child: Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : Color(0xFFEFF6FF),
                              border: Border(
                                bottom: BorderSide(
                                  color: Colors.grey[200]!,
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.calendar_today,
                                      size: 20,
                                      color: Color(0xFFB82132),
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  formatted != null && formatted['formatted'] == true
                                                      ? (formatted['subject'] ?? '')
                                                      : notification['subject'] ?? notification['title'] ?? 'Notification',
                                                  style: TextStyle(
                                                    fontSize: 14,
                                                    fontWeight: FontWeight.bold,
                                                    color: Colors.black87,
                                                  ),
                                                ),
                                              ),
                                              if (!isRead)
                                                Container(
                                                  width: 8,
                                                  height: 8,
                                                  decoration: BoxDecoration(
                                                    color: Color(0xFF2563EB),
                                                    shape: BoxShape.circle,
                                                  ),
                                                ),
                                            ],
                                          ),
                                          SizedBox(height: 8),
                                          if (formatted != null && formatted['formatted'] == true) ...[
                                            Text(
                                              formatted['greeting'] ?? '',
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.black87,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                            SizedBox(height: 4),
                                            Text(
                                              formatted['mainMessage'] ?? '',
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.black87,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            if (formatted['details'] != null) ...[
                                              SizedBox(height: 12),
                                              Container(
                                                padding: EdgeInsets.all(12),
                                                decoration: BoxDecoration(
                                                  color: Colors.grey[50],
                                                  borderRadius: BorderRadius.circular(8),
                                                  border: Border.all(color: Colors.grey[200]!),
                                                ),
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: (formatted['details'] as List).map<Widget>((detail) {
                                                    return Padding(
                                                      padding: EdgeInsets.only(bottom: 6),
                                                      child: Row(
                                                        children: [
                                                          Text(
                                                            detail['icon'] ?? '',
                                                            style: TextStyle(fontSize: 16),
                                                          ),
                                                          SizedBox(width: 6),
                                                          Text(
                                                            '${detail['label']}: ',
                                                            style: TextStyle(
                                                              fontSize: 13,
                                                              fontWeight: FontWeight.bold,
                                                            ),
                                                          ),
                                                          Expanded(
                                                            child: Text(
                                                              detail['value'] ?? '',
                                                              style: TextStyle(fontSize: 13),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    );
                                                  }).toList(),
                                                ),
                                              ),
                                            ],
                                            if (formatted['notes'] != null) ...[
                                              SizedBox(height: 8),
                                              Text(
                                                'Notes: ${formatted['notes']}',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Colors.black87,
                                                ),
                                              ),
                                            ],
                                            if (formatted['declineReason'] != null) ...[
                                              SizedBox(height: 8),
                                              Text(
                                                'Reason: ${formatted['declineReason']}',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Colors.red[800],
                                                ),
                                              ),
                                            ],
                                            if (formatted['footer'] != null) ...[
                                              SizedBox(height: 8),
                                              Text(
                                                formatted['footer'] ?? '',
                                                style: TextStyle(
                                                  fontSize: 13,
                                                  color: Colors.grey[600],
                                                ),
                                              ),
                                            ],
                                            SizedBox(height: 4),
                                            Text(
                                              formatted['closing'] ?? '',
                                              style: TextStyle(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w500,
                                                color: Colors.black87,
                                              ),
                                            ),
                                          ] else ...[
                                            Text(
                                              notification['body'] ?? notification['message'] ?? '',
                                              style: TextStyle(
                                                fontSize: 13,
                                                color: Colors.grey[700],
                                                height: 1.4,
                                              ),
                                              maxLines: 3,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: Icon(Icons.close, size: 18, color: Colors.grey[400]),
                                      onPressed: () => _removeNotification(id),
                                      padding: EdgeInsets.zero,
                                      constraints: BoxConstraints(),
                                    ),
                                  ],
                                ),
                                SizedBox(height: 12),
                                Row(
                                  children: [
                                    if (requiresConfirmation)
                                      ElevatedButton.icon(
                                        onPressed: _processingAction == notification['appointment_id']
                                            ? null
                                            : () => _handleAppointmentConfirm(notification['appointment_id']),
                                        icon: Icon(Icons.check, size: 14),
                                        label: Text('Confirm Appointment'),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: Colors.green,
                                          foregroundColor: Colors.white,
                                          padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          textStyle: TextStyle(fontSize: 12),
                                        ),
                                      ),
                                    if (requiresConfirmation) SizedBox(width: 8),
                                    TextButton(
                                      onPressed: () {
                                        final isCurrentlyRead = notification['read'] == true || notification['is_read'] == true;
                                        _markAsRead(id, !isCurrentlyRead);
                                      },
                                      child: Text(
                                        (notification['read'] == true || notification['is_read'] == true)
                                            ? 'Mark as Unread'
                                            : 'Mark as Read',
                                        style: TextStyle(fontSize: 11),
                                      ),
                                      style: TextButton.styleFrom(
                                        backgroundColor: (notification['read'] == true || notification['is_read'] == true)
                                            ? Colors.grey[600]
                                            : Color(0xFF2563EB),
                                        foregroundColor: Colors.white,
                                        padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      ),
                                    ),
                                    if (notification['appointment_id'] != null) ...[
                                      SizedBox(width: 8),
                                      TextButton(
                                        onPressed: () => _handleNotificationClick(notification),
                                        child: Text('View Details', style: TextStyle(fontSize: 11)),
                                        style: TextButton.styleFrom(
                                          backgroundColor: Color(0xFF2563EB),
                                          foregroundColor: Colors.white,
                                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                SizedBox(height: 8),
                                Text(
                                  _formatDate(notification['timestamp'] ?? 
                                             notification['created_at'] ?? 
                                             notification['sent_at']),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[500],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
        ),
        // Appointment Details Modal
        if (_showAppointmentModal && _selectedAppointment != null)
          _AppointmentDetailsModal(
            appointment: _selectedAppointment!,
            onClose: () {
              setState(() {
                _showAppointmentModal = false;
                _selectedAppointment = null;
              });
            },
          ),
        // Notification Details Modal
        if (_showNotificationModal && _selectedNotification != null)
          _NotificationDetailsModal(
            notification: _selectedNotification!,
            onClose: () {
              setState(() {
                _showNotificationModal = false;
                _selectedNotification = null;
              });
            },
          ),
      ],
    );
  }
}

// Appointment Details Modal
class _AppointmentDetailsModal extends StatelessWidget {
  final Map<String, dynamic> appointment;
  final VoidCallback onClose;

  const _AppointmentDetailsModal({
    required this.appointment,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    final startDate = DateTime.tryParse(appointment['scheduled_start'] ?? '') ?? DateTime.now();
    final endDate = DateTime.tryParse(appointment['scheduled_end'] ?? '') ?? startDate.add(Duration(hours: 1));

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: BoxConstraints(maxWidth: 600, maxHeight: MediaQuery.of(context).size.height * 0.9),
        padding: EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Appointment Details',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: onClose,
                  color: Colors.grey[600],
                ),
              ],
            ),
            SizedBox(height: 20),
            _buildDetailRow('Date & Time', 
              '${DateFormat('EEEE, MMMM d, yyyy').format(startDate)}\n${DateFormat('h:mm a').format(startDate)} - ${DateFormat('h:mm a').format(endDate)}'),
            SizedBox(height: 15),
            _buildDetailRow('Facility', appointment['facility_name'] ?? 'N/A'),
            SizedBox(height: 15),
            _buildDetailRow('Appointment Type', 
              (appointment['appointment_type'] ?? 'N/A').toString().replaceAll('_', ' ').toUpperCase()),
            if (appointment['reason'] != null) ...[
              SizedBox(height: 15),
              _buildDetailRow('Reason', appointment['reason']),
            ],
            if (appointment['notes'] != null) ...[
              SizedBox(height: 15),
              _buildDetailRow('Notes', appointment['notes']),
            ],
            SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onClose,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[600],
                  padding: EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 5),
        Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Text(
            value,
            style: TextStyle(fontSize: 14),
          ),
        ),
      ],
    );
  }
}

// Notification Details Modal
class _NotificationDetailsModal extends StatelessWidget {
  final Map<String, dynamic> notification;
  final VoidCallback onClose;

  const _NotificationDetailsModal({
    required this.notification,
    required this.onClose,
  });

  Map<String, dynamic>? _formatNotificationMessage(dynamic notification) {
    final details = notification['appointmentDetails'];
    final payload = _parsePayload(notification['payload']);
    
    final isApproved = notification['type']?.toString().contains('approved') == true ||
        notification['title']?.toString().toLowerCase().contains('approved') == true ||
        notification['message']?.toString().toLowerCase().contains('approved') == true;
    
    final isDeclined = notification['type']?.toString().contains('declined') == true ||
        notification['title']?.toString().toLowerCase().contains('declined') == true ||
        notification['message']?.toString().toLowerCase().contains('declined') == true;
    
    if (isApproved) {
      String? scheduledStart = details?['scheduled_start'] ?? payload?['scheduled_start'];
      
      if (scheduledStart == null && notification['message'] != null) {
        final match = RegExp(r'(\d{1,2}/\d{1,2}/\d{4}|\d{4}-\d{2}-\d{2}).*?(\d{1,2}:\d{2}(?::\d{2})?)')
            .firstMatch(notification['message']);
        if (match != null) {
          try {
            String dateStr = match.group(1)!;
            String timeStr = match.group(2)!;
            if (dateStr.contains('/')) {
              final parts = dateStr.split('/');
              dateStr = '${parts[2]}-${parts[0].padLeft(2, '0')}-${parts[1].padLeft(2, '0')}';
            }
            scheduledStart = '$dateStr ${timeStr.padRight(8, ':00')}';
          } catch (e) {}
        }
      }
      
      final appointmentDate = scheduledStart != null ? DateTime.tryParse(scheduledStart) : null;
      final patientName = details?['patient_name'] ?? 'Patient';
      final facilityName = details?['facility_name'] ?? 'Facility';
      final providerName = details?['provider_name'] ?? 'Provider';
      final appointmentType = details?['appointment_type'] ?? payload?['appointment_type'] ?? 'Appointment';
      
      final detailsArray = <Map<String, String>>[];
      
      if (appointmentDate != null) {
        detailsArray.add({
          'icon': '📅',
          'label': 'Date',
          'value': DateFormat('EEEE, MMMM d, yyyy').format(appointmentDate),
        });
        detailsArray.add({
          'icon': '⏰',
          'label': 'Time',
          'value': DateFormat('h:mm a').format(appointmentDate),
        });
      }
      
      detailsArray.add({'icon': '🏥', 'label': 'Branch', 'value': facilityName});
      detailsArray.add({'icon': '👨‍⚕️', 'label': 'Provider', 'value': providerName});
      detailsArray.add({
        'icon': '📝',
        'label': 'Type',
        'value': appointmentType.toString().replaceAll('_', ' ').toUpperCase(),
      });
      
      return {
        'formatted': true,
        'subject': '✅ Appointment Confirmed - MyHubCares',
        'greeting': 'Dear $patientName,',
        'mainMessage': 'Your appointment request has been APPROVED!',
        'details': detailsArray,
        'notes': details?['case_manager_notes'] ?? details?['notes'],
        'footer': 'Please arrive 15 minutes before your scheduled time.',
        'closing': 'Thank you for choosing MyHubCares!',
      };
    }
    
    if (isDeclined) {
      final scheduledStart = details?['scheduled_start'] ?? payload?['scheduled_start'] ?? notification['timestamp'];
      final appointmentDate = DateTime.tryParse(scheduledStart?.toString() ?? '') ?? DateTime.now();
      final patientName = details?['patient_name'] ?? 'Patient';
      final facilityName = details?['facility_name'] ?? 'Facility';
      final providerName = details?['provider_name'] ?? 'Provider';
      final appointmentType = details?['appointment_type'] ?? payload?['appointment_type'] ?? 'Appointment';
      final declineReason = notification['decline_reason'] ?? 
          (notification['message']?.toString().contains('Reason:') == true
              ? notification['message'].toString().split('Reason:')[1].trim()
              : null) ??
          'No reason provided';
      
      return {
        'formatted': true,
        'subject': '❌ Appointment Request Update - MyHubCares',
        'greeting': 'Dear $patientName,',
        'mainMessage': 'We regret to inform you that your appointment request could not be approved.',
        'details': [
          {'icon': '📅', 'label': 'Date', 'value': DateFormat('EEEE, MMMM d, yyyy').format(appointmentDate)},
          {'icon': '⏰', 'label': 'Time', 'value': DateFormat('h:mm a').format(appointmentDate)},
          {'icon': '🏥', 'label': 'Branch', 'value': facilityName},
          {'icon': '👨‍⚕️', 'label': 'Provider', 'value': providerName},
          {'icon': '📝', 'label': 'Type', 'value': appointmentType.toString().replaceAll('_', ' ').toUpperCase()},
        ],
        'declineReason': declineReason,
        'footer': 'Please submit a new request with a different date/time or contact us for assistance.',
        'closing': 'Thank you for your understanding.',
      };
    }
    
    return {'formatted': false};
  }

  Map<String, dynamic>? _parsePayload(dynamic payload) {
    if (payload == null) return null;
    try {
      if (payload is String) {
        return jsonDecode(payload) as Map<String, dynamic>;
      } else if (payload is Map) {
        return payload as Map<String, dynamic>;
      }
    } catch (e) {}
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final formatted = _formatNotificationMessage(notification);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        constraints: BoxConstraints(maxWidth: 600, maxHeight: MediaQuery.of(context).size.height * 0.9),
        padding: EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 20, color: Color(0xFFB82132)),
                    SizedBox(width: 8),
                    Text(
                      formatted != null && formatted['formatted'] == true
                          ? (formatted['subject'] ?? '')
                          : notification['title'] ?? 'Notification',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                    ),
                  ],
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: onClose,
                  color: Colors.grey[600],
                ),
              ],
            ),
            SizedBox(height: 20),
            Expanded(
              child: SingleChildScrollView(
                child: formatted != null && formatted['formatted'] == true
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            formatted['greeting'] ?? '',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                          SizedBox(height: 12),
                          Text(
                            formatted['mainMessage'] ?? '',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.black87),
                          ),
                          if (formatted['details'] != null) ...[
                            SizedBox(height: 16),
                            Container(
                              padding: EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.grey[50],
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.grey[200]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: (formatted['details'] as List).map<Widget>((detail) {
                                  return Padding(
                                    padding: EdgeInsets.only(bottom: 8),
                                    child: Row(
                                      children: [
                                        Text(detail['icon'] ?? '', style: TextStyle(fontSize: 16)),
                                        SizedBox(width: 8),
                                        Text(
                                          '${detail['label']}: ',
                                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                        ),
                                        Expanded(
                                          child: Text(
                                            detail['value'] ?? '',
                                            style: TextStyle(fontSize: 14),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                          if (formatted['notes'] != null) ...[
                            SizedBox(height: 16),
                            Text(
                              'Notes: ${formatted['notes']}',
                              style: TextStyle(fontSize: 14, color: Colors.black87),
                            ),
                          ],
                          if (formatted['declineReason'] != null) ...[
                            SizedBox(height: 16),
                            Text(
                              'Reason: ${formatted['declineReason']}',
                              style: TextStyle(fontSize: 14, color: Colors.red[800]),
                            ),
                          ],
                          if (formatted['footer'] != null) ...[
                            SizedBox(height: 16),
                            Text(
                              formatted['footer'] ?? '',
                              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                            ),
                          ],
                          SizedBox(height: 12),
                          Text(
                            formatted['closing'] ?? '',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black87),
                          ),
                        ],
                      )
                    : Container(
                        padding: EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          notification['message'] ?? notification['body'] ?? '',
                          style: TextStyle(fontSize: 16, color: Colors.black87, height: 1.5),
                        ),
                      ),
              ),
            ),
            SizedBox(height: 20),
            Text(
              'Received: ${DateFormat('MMM d, yyyy h:mm a').format(DateTime.tryParse(notification['timestamp'] ?? notification['created_at'] ?? notification['sent_at'] ?? '') ?? DateTime.now())}',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              textAlign: TextAlign.right,
            ),
            SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: onClose,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[600],
                  padding: EdgeInsets.symmetric(vertical: 12),
                ),
                child: Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
