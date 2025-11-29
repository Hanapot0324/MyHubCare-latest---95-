import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/socket_service.dart';
import '../widgets/appointment_reminder_card.dart';

// Optional: Uncomment to enable sound notifications (requires audioplayers package)
// import 'package:audioplayers/audioplayers.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({Key? key}) : super(key: key);

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  List<dynamic> _appointments = [];
  bool _isLoading = true;
  List<dynamic> _patients = [];
  List<dynamic> _facilities = [];
  List<dynamic> _providers = [];
  String? _currentUserId;
  String? _currentPatientId;
  String? _currentUserRole;

  @override
  void initState() {
    super.initState();
    _initializeSocket();
    _loadCurrentUser();
    _loadAppointments();
    _loadFormData();
    _startPeriodicRefresh();
  }

  @override
  void dispose() {
    // Audio player cleanup handled by static variable
    super.dispose();
  }

  // Start periodic refresh every 30 seconds (like web version)
  void _startPeriodicRefresh() {
    Future.delayed(Duration(seconds: 30), () {
      if (mounted) {
        _loadAppointments();
        _startPeriodicRefresh(); // Schedule next refresh
      }
    });
  }

  Future<void> _initializeSocket() async {
    try {
      await SocketService.initialize();
      
      // Wait a bit for connection
      await Future.delayed(Duration(milliseconds: 500));
      
      // Set up listeners
      SocketService.onNotification((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'New notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });

      SocketService.onNewAppointment((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'New appointment notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });

      SocketService.onAppointmentNotification((data) {
        _playNotificationSound();
        _loadAppointments(); // Refresh appointments
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(data['message'] ?? 'Appointment notification'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 3),
            ),
          );
        }
      });
    } catch (e) {
      // Error initializing socket
    }
  }

  void _playNotificationSound() {
    // Sound notifications are optional
    // To enable: 
    // 1. Uncomment the audioplayers import at the top
    // 2. Add: final AudioPlayer _audioPlayer = AudioPlayer(); to state variables
    // 3. Uncomment the code below
    // 4. Run: flutter pub get
    
    // Uncomment when audioplayers is installed:
    /*
    try {
      _audioPlayer.play(AssetSource('notification.mp3')).catchError((e) {
        // Could not play notification sound
      });
    } catch (e) {
      // Audio player error
    }
    */
  }

  Future<void> _loadCurrentUser() async {
    try {
      final result = await ApiService.getCurrentUser();
      if (result['success'] == true && result['user'] != null) {
        final user = result['user'];
        setState(() {
          _currentUserId = user['user_id']?.toString();
          _currentUserRole = user['role']?.toLowerCase();
        });

        // If user is a patient, get their patient_id
        if (_currentUserRole == 'patient') {
          String? patientId = user['patient']?['patient_id']?.toString() ?? 
                              user['patient_id']?.toString();
          
          if (patientId == null) {
            // Try to fetch from profile
            final profileResult = await ApiService.getPatientProfile();
            if (profileResult['success'] == true && profileResult['patient'] != null) {
              patientId = profileResult['patient']['patient_id']?.toString();
            }
          }

          if (patientId != null) {
            setState(() => _currentPatientId = patientId);
            // Join patient room for real-time notifications
            SocketService.joinPatientRoom(patientId);
          }
        }

        // Join user room for real-time notifications
        if (_currentUserId != null) {
          SocketService.joinUserRoom(_currentUserId!);
        }
      }
    } catch (e) {
      // Error loading current user
    }
  }

  Future<void> _loadFormData() async {
    try {
      // Load patients
      final patientsResult = await ApiService.getPatients();
      if (patientsResult['success'] == true) {
        setState(() => _patients = patientsResult['data'] ?? []);
      }

      // Load facilities with better error handling
      final facilitiesResult = await ApiService.getFacilities();
      if (facilitiesResult['success'] == true) {
        final facilitiesData = facilitiesResult['data'];
        if (facilitiesData is List) {
          setState(() => _facilities = facilitiesData);
        } else {
          setState(() => _facilities = []);
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Failed to load facilities: ${facilitiesResult['message'] ?? 'Unknown error'}'),
              backgroundColor: Colors.orange,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }

      // Load providers
      final providersResult = await ApiService.getProviders();
      if (providersResult['success'] == true) {
        setState(() => _providers = providersResult['data'] ?? []);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading form data: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  Future<void> _loadAppointments() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getAppointments();
      if (result['success'] == true) {
        setState(() {
          _appointments = result['data'] as List;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
        // Show error message with more details
        final errorMessage = result['message'] ?? 'Failed to load appointments';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMessage),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error loading appointments: ${e.toString()}'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 4),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'Appointments',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1A1A),
            letterSpacing: -0.5,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        bottom: PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Container(
            height: 1,
            color: Colors.grey[200],
          ),
        ),
        iconTheme: IconThemeData(color: Color(0xFF1A1A1A)),
      ),
      body: _isLoading
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFA31D1D)),
              ),
            )
          : _appointments.isEmpty
              ? _buildEmptyState()
              : RefreshIndicator(
                  onRefresh: _loadAppointments,
                  color: Color(0xFFA31D1D),
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: _appointments.length,
                    itemBuilder: (context, index) {
                      final appointment = _appointments[index];
                      final appointmentId = appointment['appointment_id']?.toString() ?? 'appt_$index';
                      return _buildAppointmentCard(appointment);
                    },
                  ),
                ),
      floatingActionButton: FloatingActionButton(
        heroTag: "appointments_fab",
        onPressed: () => _showBookAppointmentModal(),
        backgroundColor: Color(0xFFA31D1D),
        elevation: 2,
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Color(0xFFF5F5F5),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.calendar_today_outlined,
                size: 56,
                color: Colors.grey[400],
              ),
            ),
            SizedBox(height: 32),
            Text(
              'No Appointments',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1A1A),
                letterSpacing: -0.5,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Schedule your first appointment to get started',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[600],
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: () => _showBookAppointmentModal(),
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                backgroundColor: Color(0xFFA31D1D),
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.add, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Book Appointment',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppointmentCard(Map<String, dynamic> apt) {
    final date = DateTime.parse(apt['scheduled_start']);
    final endDate = DateTime.parse(apt['scheduled_end']);
    final status = (apt['status'] ?? 'scheduled').toLowerCase();
    final appointmentId = apt['appointment_id']?.toString() ?? '';

    return Container(
      key: appointmentId.isNotEmpty ? ValueKey(appointmentId) : null,
      margin: EdgeInsets.only(bottom: 12),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        elevation: 0,
        child: InkWell(
          onTap: () => _showAppointmentDetails(apt),
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.grey[200]!,
                width: 1,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Date indicator
                Container(
                  width: 56,
                  child: Column(
                    children: [
                      Text(
                        DateFormat('MMM').format(date).toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFA31D1D),
                          letterSpacing: 0.5,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '${date.day}',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1A1A1A),
                          height: 1,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        DateFormat('EEE').format(date),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[600],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(width: 20),
                // Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Title and status
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              _formatAppointmentType(apt['appointment_type'] ?? ''),
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1A1A1A),
                                letterSpacing: -0.3,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          SizedBox(width: 12),
                          _buildStatusChip(status),
                        ],
                      ),
                      SizedBox(height: 16),
                      // Time
                      _buildInfoRow(
                        Icons.access_time,
                        '${DateFormat('h:mm a').format(date)} - ${DateFormat('h:mm a').format(endDate)}',
                      ),
                      SizedBox(height: 10),
                      // Facility
                      _buildInfoRow(
                        Icons.local_hospital_outlined,
                        apt['facility_name'] ?? 'N/A',
                      ),
                      if (apt['provider_name'] != null) ...[
                        SizedBox(height: 10),
                        _buildInfoRow(
                          Icons.person_outline,
                          apt['provider_name'],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Colors.grey[600],
        ),
        SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.4,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusChip(String status) {
    Color bgColor;
    Color textColor;
    
    switch (status) {
      case 'scheduled':
      case 'confirmed':
        bgColor = Color(0xFFFEF3F2);
        textColor = Color(0xFFD84040);
        break;
      case 'completed':
        bgColor = Color(0xFFF0FDF4);
        textColor = Color(0xFF10B981);
        break;
      case 'cancelled':
        bgColor = Color(0xFFF5F5F5);
        textColor = Color(0xFF6B7280);
        break;
      default:
        bgColor = Color(0xFFF5F5F5);
        textColor = Color(0xFF6B7280);
    }

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          color: textColor,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'confirmed':
        return Color(0xFFD84040);
      case 'completed':
        return Color(0xFF10B981);
      case 'cancelled':
        return Color(0xFFA31D1D);
      default:
        return Colors.grey;
    }
  }

  String _formatAppointmentType(String type) {
    return type.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  void _showBookAppointmentModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _BookAppointmentModal(
        patients: _patients,
        facilities: _facilities,
        providers: _providers,
        onAppointmentBooked: () {
          _loadAppointments();
        },
      ),
    );
  }

  void _showAppointmentDetails(Map<String, dynamic> appointment) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: SingleChildScrollView(
          child: AppointmentReminderCard(appointment: appointment),
        ),
      ),
    );
  }
}

class _BookAppointmentModal extends StatefulWidget {
  final List<dynamic> patients;
  final List<dynamic> facilities;
  final List<dynamic> providers;
  final VoidCallback onAppointmentBooked;

  const _BookAppointmentModal({
    Key? key,
    required this.patients,
    required this.facilities,
    required this.providers,
    required this.onAppointmentBooked,
  }) : super(key: key);

  @override
  State<_BookAppointmentModal> createState() => __BookAppointmentModalState();
}

class __BookAppointmentModalState extends State<_BookAppointmentModal> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedPatientId;
  String? _selectedFacilityId;
  String? _selectedProviderId;
  String? _selectedType;
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  int _durationMinutes = 60; // Fixed 60-minute duration (Module 6)
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSubmitting = false;
  bool _isLoadingUser = true;
  String? _currentUserRole;
  String? _patientName;
  List<dynamic> _availabilitySlots = [];
  bool _isLoadingSlots = false;
  Set<String> _datesWithAvailability = {}; // Store dates that have availability slots

  @override
  void initState() {
    super.initState();
    _loadCurrentUser();
    // Update patient name when patients list is available
    if (widget.patients.isNotEmpty && _selectedPatientId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _updatePatientName(_selectedPatientId);
      });
    }
    // Load availability dates for the next 3 months
    _loadAvailabilityDates();
  }

  // Fetch availability dates for calendar indicators (like web frontend)
  Future<void> _loadAvailabilityDates() async {
    try {
      final today = DateTime.now();
      final dateFrom = today.toIso8601String().split('T')[0];
      final dateTo = DateTime(today.year, today.month + 3, 0).toIso8601String().split('T')[0];
      
      print('Loading availability dates from $dateFrom to $dateTo');
      
      final result = await ApiService.getAvailabilitySlots(
        dateFrom: dateFrom,
        dateTo: dateTo,
        status: 'available',
      );

      if (result['success'] == true) {
        final allSlots = result['data'] ?? [];
        final datesSet = <String>{};
        
        allSlots.forEach((slot) {
          final slotDate = slot['slot_date']?.toString() ?? '';
          if (slotDate.isNotEmpty) {
            // Normalize date format
            String dateStr = slotDate;
            if (dateStr.contains('T')) {
              dateStr = dateStr.split('T')[0];
            }
            if (dateStr.length >= 10) {
              dateStr = dateStr.substring(0, 10); // YYYY-MM-DD
            }
            
            // Only add if slot is available and not booked
            final status = slot['slot_status']?.toString().toLowerCase() ?? '';
            final appointmentId = slot['appointment_id'];
            final hasAppointment = appointmentId != null && 
                                 appointmentId != 'available' &&
                                 appointmentId.toString().trim().isNotEmpty &&
                                 appointmentId.toString().toLowerCase() != 'null';
            
            if (status == 'available' && !hasAppointment) {
              datesSet.add(dateStr);
            }
          }
        });
        
        print('Dates with availability: ${datesSet.length}');
        setState(() {
          _datesWithAvailability = datesSet;
        });
      }
    } catch (e) {
      print('Error loading availability dates: $e');
    }
  }

  // Fetch availability slots when date/facility/provider changes
  Future<void> _loadAvailabilitySlots() async {
    if (_selectedDate == null) {
      setState(() => _availabilitySlots = []);
      return;
    }

    setState(() => _isLoadingSlots = true);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      print('Loading availability slots for date: $dateStr, facility: $_selectedFacilityId, provider: $_selectedProviderId');
      
      // Fetch all slots for the date (like web frontend) - don't filter by facility initially
      // This allows users to see all available slots, then filter by facility if needed
      final result = await ApiService.getAvailabilitySlots(
        facilityId: _selectedFacilityId, // Optional - filter by facility if selected
        providerId: _selectedProviderId, // Optional - filter by provider if selected
        date: dateStr,
        // Don't filter by status - get all slots and filter client-side
      );

      print('Availability slots result: ${result['success']}, count: ${(result['data'] ?? []).length}');

      if (result['success'] == true) {
        final allSlots = result['data'] ?? [];
        print('All slots received: ${allSlots.length}');
        
        // Filter to show available slots (not booked, not unavailable)
        // Match web frontend logic: show slots with status 'available' and no appointment_id
        final availableSlots = allSlots.where((slot) {
          final status = slot['slot_status']?.toString().toLowerCase() ?? '';
          final appointmentId = slot['appointment_id'];
          final hasAppointment = appointmentId != null && 
                                 appointmentId != 'available' &&
                                 appointmentId.toString().trim().isNotEmpty &&
                                 appointmentId.toString().toLowerCase() != 'null';
          
          // Show slots that are available and not booked
          final isAvailable = status == 'available' && !hasAppointment;
          
          // Also check slot_date matches selected date
          final slotDate = slot['slot_date']?.toString() ?? '';
          final slotDateMatches = slotDate.startsWith(dateStr) || 
                                  slotDate.contains(dateStr);
          
          return isAvailable && slotDateMatches;
        }).toList();
        
        print('Filtered available slots: ${availableSlots.length}');
        if (availableSlots.isNotEmpty) {
          print('Sample slot: ${availableSlots[0]}');
        }
        
        setState(() {
          _availabilitySlots = availableSlots;
          _isLoadingSlots = false;
        });
      } else {
        print('Failed to load slots: ${result['message']}');
        setState(() {
          _availabilitySlots = [];
          _isLoadingSlots = false;
        });
      }
    } catch (e) {
      print('Error loading availability slots: $e');
      setState(() {
        _availabilitySlots = [];
        _isLoadingSlots = false;
      });
    }
  }

  @override
  void didUpdateWidget(_BookAppointmentModal oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Update patient name when patients list changes
    if (widget.patients.isNotEmpty && _selectedPatientId != null && _patientName == null) {
      _updatePatientName(_selectedPatientId);
    }
  }

  Future<void> _loadCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      String? patientId;
      String? userRole;
      
      if (userStr != null) {
        final user = jsonDecode(userStr);
        userRole = user['role']?.toLowerCase();
        setState(() => _currentUserRole = userRole);
        
        // If user is a patient, get their patient_id
        if (userRole == 'patient') {
          patientId = user['patient_id']?.toString() ?? 
                     user['patient']?['patient_id']?.toString();
        }
      }
      
      // If not found in local storage, try API
      if (patientId == null || userRole == null) {
        final result = await ApiService.getCurrentUser();
        if (result['success'] == true && result['user'] != null) {
          final user = result['user'];
          userRole = user['role']?.toLowerCase();
          setState(() => _currentUserRole = userRole);
          
          if (userRole == 'patient') {
            patientId = user['patient']?['patient_id']?.toString() ?? 
                        user['patient_id']?.toString();
          }
        }
      }
      
      // If still not found and user is a patient, try profile endpoint
      if (userRole == 'patient' && patientId == null) {
        final profileResult = await ApiService.getPatientProfile();
        if (profileResult['success'] == true && profileResult['patient'] != null) {
          patientId = profileResult['patient']['patient_id']?.toString();
        }
      }
      
      // Set patient_id and fetch patient name
      if (userRole == 'patient' && patientId != null) {
        setState(() {
          _selectedPatientId = patientId;
          _isLoadingUser = false;
        });
        // Fetch patient name directly from profile API
        await _fetchPatientNameFromAPI(patientId);
      } else {
        setState(() => _isLoadingUser = false);
      }
    } catch (e) {
      setState(() => _isLoadingUser = false);
    }
  }

  Future<void> _fetchPatientNameFromAPI(String? patientId) async {
    if (patientId == null) return;
    
    try {
      // First try to get from patients list if available
      if (widget.patients.isNotEmpty) {
        try {
          final patient = widget.patients.firstWhere(
            (p) => p['patient_id']?.toString() == patientId,
          );
          setState(() {
            _patientName = '${patient['first_name']} ${patient['last_name']}${patient['uic'] != null ? ' (${patient['uic']})' : ''}';
          });
          return;
        } catch (e) {
          // Patient not in list, continue to API call
        }
      }
      
      // Fetch directly from patient profile API
      final profileResult = await ApiService.getPatientProfile();
      if (profileResult['success'] == true && profileResult['patient'] != null) {
        final patient = profileResult['patient'];
        setState(() {
          _patientName = '${patient['first_name']} ${patient['last_name']}${patient['uic'] != null ? ' (${patient['uic']})' : ''}';
        });
      } else {
        setState(() {
          _patientName = 'Patient ID: $patientId';
        });
      }
    } catch (e) {
      setState(() {
        _patientName = 'Patient ID: $patientId';
      });
    }
  }

  void _updatePatientName(String? patientId) {
    // This method is kept for backward compatibility but now uses API
    _fetchPatientNameFromAPI(patientId);
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitAppointment() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please select date and time')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final scheduledStart = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        _selectedTime!.hour,
        _selectedTime!.minute,
      );
      // Module 6: Fixed 60-minute duration
      final scheduledEnd = scheduledStart.add(Duration(minutes: 60));

      final scheduledStartStr = scheduledStart.toIso8601String().replaceAll('T', ' ').substring(0, 19);
      final scheduledEndStr = scheduledEnd.toIso8601String().replaceAll('T', ' ').substring(0, 19);
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      final timeStr = '${_selectedTime!.hour.toString().padLeft(2, '0')}:${_selectedTime!.minute.toString().padLeft(2, '0')}:00';

      // If user is a patient, create appointment request instead of direct appointment
      if (_currentUserRole?.toLowerCase() == 'patient') {
        // Check if the selected date has availability slots (like web frontend)
        final dateKey = dateStr;
        if (!_datesWithAvailability.contains(dateKey)) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('No availability slots for this date. Please select a date with a green dot indicator on the calendar.'),
              backgroundColor: Colors.orange,
            ),
          );
          setState(() => _isSubmitting = false);
          return;
        }

        // Create appointment request (not direct appointment)
        final requestData = {
          'facility_id': _selectedFacilityId,
          'provider_id': _selectedProviderId,
          'requested_date': dateStr,
          'requested_time': timeStr,
          'appointment_type': _selectedType,
          'patient_notes': _notesController.text.isEmpty ? null : _notesController.text,
        };

        final result = await ApiService.createAppointmentRequest(requestData);

        if (!mounted) return;

        if (result['success'] == true) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Appointment request submitted successfully. Awaiting case manager approval.'),
                  ),
                ],
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 5),
            ),
          );
          Navigator.pop(context);
          widget.onAppointmentBooked();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to submit appointment request'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }

      // For staff users (physician, case_manager, admin), create appointment directly
      // Check availability before creating
      final availabilityResult = await ApiService.checkAvailability(
        facilityId: _selectedFacilityId!,
        providerId: _selectedProviderId,
        scheduledStart: scheduledStartStr,
        scheduledEnd: scheduledEndStr,
      );

      if (!mounted) return;

      if (availabilityResult['success'] != true || 
          availabilityResult['data']?['available'] != true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('The selected time slot is not available. Please choose another time.'),
            backgroundColor: Colors.orange,
          ),
        );
        setState(() => _isSubmitting = false);
        return;
      }

      final appointmentData = {
        'patient_id': _selectedPatientId,
        'facility_id': _selectedFacilityId,
        'provider_id': _selectedProviderId,
        'appointment_type': _selectedType,
        'scheduled_start': scheduledStartStr,
        'scheduled_end': scheduledEndStr,
        'duration_minutes': 60, // Module 6: Fixed 60-minute duration
        'reason': _reasonController.text.isEmpty ? null : _reasonController.text,
        'notes': _notesController.text.isEmpty ? null : _notesController.text,
      };

      final result = await ApiService.createAppointment(appointmentData);

      if (!mounted) return;

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Appointment booked successfully!'),
              ],
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
        widget.onAppointmentBooked();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to book appointment'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.9,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Handle bar
          Container(
            margin: EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  _currentUserRole?.toLowerCase() == 'patient'
                      ? 'Request Appointment'
                      : 'Book Appointment',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1A1A),
                    letterSpacing: -0.5,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Divider(height: 1, color: Colors.grey[200]),
          // Form
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: EdgeInsets.all(20),
                children: [
                  // Patient - Hide dropdown if current user is a patient
                  _isLoadingUser
                      ? Padding(
                          padding: EdgeInsets.symmetric(vertical: 16),
                          child: Row(
                            children: [
                              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                              SizedBox(width: 8),
                              Text('Loading patient information...'),
                            ],
                          ),
                        )
                      : _currentUserRole?.toLowerCase() == 'patient'
                          ? Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Patient *',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey[700],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                SizedBox(height: 8),
                                Container(
                                  padding: EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: BorderRadius.circular(4),
                                    border: Border.all(color: Colors.grey[300]!),
                                  ),
                                  child: Text(
                                    _patientName ?? (_selectedPatientId != null ? 'Patient ID: $_selectedPatientId' : 'Loading...'),
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: Colors.grey[700],
                                    ),
                                  ),
                                ),
                              ],
                            )
                          : DropdownButtonFormField<String>(
                              decoration: InputDecoration(labelText: 'Patient *'),
                              value: _selectedPatientId,
                              items: widget.patients.map<DropdownMenuItem<String>>((p) {
                                return DropdownMenuItem<String>(
                                  value: p['patient_id']?.toString(),
                                  child: Text('${p['first_name']} ${p['last_name']}${p['uic'] != null ? ' (${p['uic']})' : ''}'),
                                );
                              }).toList(),
                              onChanged: (value) => setState(() => _selectedPatientId = value),
                              validator: (value) => value == null ? 'Please select patient' : null,
                            ),
                  SizedBox(height: 16),
                  // Facility
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Facility *'),
                    value: _selectedFacilityId,
                    items: widget.facilities.map<DropdownMenuItem<String>>((f) {
                      return DropdownMenuItem<String>(
                        value: f['facility_id']?.toString(),
                        child: Text(f['facility_name'] ?? 'N/A'),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedFacilityId = value;
                        _availabilitySlots = []; // Clear slots when facility changes
                      });
                      if (_selectedDate != null) {
                        _loadAvailabilitySlots();
                      }
                    },
                    validator: (value) => value == null ? 'Please select facility' : null,
                  ),
                  SizedBox(height: 16),
                  // Provider (Optional)
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Provider (Optional)'),
                    value: _selectedProviderId,
                    items: [
                      DropdownMenuItem<String>(value: null, child: Text('Select Provider (Optional)')),
                      ...widget.providers.map<DropdownMenuItem<String>>((p) {
                        return DropdownMenuItem<String>(
                          value: p['user_id']?.toString(),
                          child: Text('${p['full_name'] ?? p['username']} (${p['role'] ?? ''})'),
                        );
                      }),
                    ],
                    onChanged: (value) {
                      setState(() => _selectedProviderId = value);
                      if (_selectedDate != null && _selectedFacilityId != null) {
                        _loadAvailabilitySlots();
                      }
                    },
                  ),
                  SizedBox(height: 16),
                  // Appointment Type
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(labelText: 'Appointment Type *'),
                    value: _selectedType,
                    items: [
                      'initial',
                      'follow_up',
                      'art_pickup',
                      'lab_test',
                      'counseling',
                      'general',
                    ].map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(_formatAppointmentType(type)),
                      );
                    }).toList(),
                    onChanged: (value) => setState(() => _selectedType = value),
                    validator: (value) => value == null ? 'Please select type' : null,
                  ),
                  SizedBox(height: 16),
                  // Date with custom calendar showing availability
                  ListTile(
                    title: Text('Date *'),
                    subtitle: Text(
                      _selectedDate == null
                          ? 'Select date (green dots show available dates)'
                          : DateFormat('MMMM dd, yyyy').format(_selectedDate!),
                    ),
                    trailing: Icon(Icons.calendar_today),
                    onTap: () => _showDatePickerWithAvailability(),
                  ),
                  
                  // Show availability slots when date is selected (facility is optional)
                  if (_selectedDate != null) ...[
                    SizedBox(height: 16),
                    Text(
                      'Available Time Slots',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1A1A),
                      ),
                    ),
                    SizedBox(height: 8),
                    _isLoadingSlots
                        ? Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        : _availabilitySlots.isEmpty
                            ? Container(
                                padding: EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.orange[50],
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.orange[200]!),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'No available slots found',
                                      style: TextStyle(
                                        color: Colors.orange[900],
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Please try:\n• Selecting a different date\n• Selecting a different facility\n• Checking if slots are created in Availability Slots Management',
                                      style: TextStyle(
                                        color: Colors.orange[800],
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: _availabilitySlots.map((slot) {
                                  final startTime = slot['start_time']?.toString() ?? '';
                                  final endTime = slot['end_time']?.toString() ?? '';
                                  final isBooked = slot['appointment_id'] != null || 
                                                  slot['slot_status'] == 'booked';
                                  final isUnavailable = slot['slot_status'] == 'unavailable';
                                  final isSelected = _selectedTime != null &&
                                      _formatTimeSlot(startTime) == _formatTimeOfDay(_selectedTime!);
                                  
                                  return GestureDetector(
                                    onTap: isBooked || isUnavailable
                                        ? null
                                        : () {
                                            // Parse time from slot
                                            final timeParts = startTime.split(':');
                                            if (timeParts.length >= 2) {
                                              setState(() {
                                                _selectedTime = TimeOfDay(
                                                  hour: int.parse(timeParts[0]),
                                                  minute: int.parse(timeParts[1]),
                                                );
                                                _durationMinutes = 60; // Fixed 60 minutes
                                              });
                                            }
                                          },
                                    child: Container(
                                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: isBooked
                                            ? Colors.grey[200]
                                            : isUnavailable
                                                ? Colors.grey[100]
                                                : isSelected
                                                    ? Color(0xFFA31D1D)
                                                    : Colors.green[50],
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: isBooked
                                              ? Colors.grey[400]!
                                              : isUnavailable
                                                  ? Colors.grey[300]!
                                                  : isSelected
                                                      ? Color(0xFFA31D1D)
                                                      : Colors.green[300]!,
                                          width: isSelected ? 2 : 1,
                                        ),
                                      ),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Text(
                                            _formatTimeSlot(startTime),
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.w600,
                                              color: isBooked || isUnavailable
                                                  ? Colors.grey[600]
                                                  : isSelected
                                                      ? Colors.white
                                                      : Colors.green[900],
                                            ),
                                          ),
                                          if (endTime.isNotEmpty) ...[
                                            SizedBox(height: 2),
                                            Text(
                                              'to ${_formatTimeSlot(endTime)}',
                                              style: TextStyle(
                                                fontSize: 11,
                                                color: isBooked || isUnavailable
                                                    ? Colors.grey[500]
                                                    : isSelected
                                                        ? Colors.white70
                                                        : Colors.green[700],
                                              ),
                                            ),
                                          ],
                                          if (isBooked) ...[
                                            SizedBox(height: 4),
                                            Text(
                                              'BOOKED',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.red[700],
                                              ),
                                            ),
                                          ] else if (isUnavailable) ...[
                                            SizedBox(height: 4),
                                            Text(
                                              'UNAVAILABLE',
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.grey[600],
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ),
                                  );
                                }).toList(),
                              ),
                    SizedBox(height: 16),
                  ],
                  
                  SizedBox(height: 16),
                  // Time
                  ListTile(
                    title: Text('Time *'),
                    subtitle: Text(
                      _selectedTime == null
                          ? 'Select time or choose from available slots above'
                          : _selectedTime!.format(context),
                    ),
                    trailing: Icon(Icons.access_time),
                    onTap: () async {
                      final time = await showTimePicker(
                        context: context,
                        initialTime: _selectedTime ?? TimeOfDay.now(),
                      );
                      if (time != null) {
                        setState(() {
                          _selectedTime = time;
                          _durationMinutes = 60; // Fixed 60 minutes
                        });
                      }
                    },
                  ),
                  // Duration is fixed at 60 minutes (Module 6)
                  // Removed duration field - it's fixed at 60 minutes
                  SizedBox(height: 16),
                  // Reason
                  TextFormField(
                    controller: _reasonController,
                    decoration: InputDecoration(labelText: 'Reason'),
                    maxLines: 2,
                  ),
                  SizedBox(height: 16),
                  // Notes (patient_notes for requests)
                  TextFormField(
                    controller: _notesController,
                    decoration: InputDecoration(
                      labelText: _currentUserRole?.toLowerCase() == 'patient'
                          ? 'Notes (Optional)'
                          : 'Notes',
                      hintText: _currentUserRole?.toLowerCase() == 'patient'
                          ? 'Add any additional information for your appointment request...'
                          : null,
                    ),
                    maxLines: 3,
                  ),
                  // Info message for patients
                  if (_currentUserRole?.toLowerCase() == 'patient') ...[
                    SizedBox(height: 8),
                    Container(
                      padding: EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue[200]!),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, size: 20, color: Colors.blue[700]),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Your appointment request will be reviewed by a case manager. You will be notified once it\'s approved or declined.',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.blue[900],
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  SizedBox(height: 30),
                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitAppointment,
                      style: ElevatedButton.styleFrom(
                        padding: EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: Color(0xFFA31D1D),
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isSubmitting
                          ? SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              _currentUserRole?.toLowerCase() == 'patient'
                                  ? 'Submit Request'
                                  : 'Book Appointment',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatAppointmentType(String type) {
    return type.split('_').map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');
  }

  String _formatTimeSlot(String timeStr) {
    if (timeStr.isEmpty) return '';
    try {
      final parts = timeStr.split(':');
      if (parts.length >= 2) {
        final hour = int.parse(parts[0]);
        final minute = int.parse(parts[1]);
        final period = hour >= 12 ? 'PM' : 'AM';
        final displayHour = hour == 0 ? 12 : (hour > 12 ? hour - 12 : hour);
        return '${displayHour}:${minute.toString().padLeft(2, '0')} $period';
      }
    } catch (e) {
      // Error parsing time
    }
    return timeStr;
  }

  String _formatTimeOfDay(TimeOfDay time) {
    final period = time.hour >= 12 ? 'PM' : 'AM';
    final displayHour = time.hour == 0 ? 12 : (time.hour > 12 ? time.hour - 12 : time.hour);
    return '${displayHour}:${time.minute.toString().padLeft(2, '0')} $period';
  }

  // Show date picker with availability indicators
  Future<void> _showDatePickerWithAvailability() async {
    final selectedDate = await showDialog<DateTime>(
      context: context,
      builder: (context) => _AvailabilityCalendarDialog(
        initialDate: _selectedDate ?? DateTime.now().add(Duration(days: 1)),
        datesWithAvailability: _datesWithAvailability,
      ),
    );
    
    if (selectedDate != null) {
      setState(() {
        _selectedDate = selectedDate;
        _selectedTime = null; // Reset time when date changes
      });
      _loadAvailabilitySlots();
    }
  }
}

// Custom calendar dialog with availability indicators
class _AvailabilityCalendarDialog extends StatefulWidget {
  final DateTime initialDate;
  final Set<String> datesWithAvailability;

  const _AvailabilityCalendarDialog({
    required this.initialDate,
    required this.datesWithAvailability,
  });

  @override
  State<_AvailabilityCalendarDialog> createState() => _AvailabilityCalendarDialogState();
}

class _AvailabilityCalendarDialogState extends State<_AvailabilityCalendarDialog> {
  late DateTime _selectedDate;
  late DateTime _currentMonth;

  @override
  void initState() {
    super.initState();
    _selectedDate = widget.initialDate;
    _currentMonth = DateTime(_selectedDate.year, _selectedDate.month, 1);
  }

  String _formatDateKey(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  bool _hasAvailability(DateTime date) {
    return widget.datesWithAvailability.contains(_formatDateKey(date));
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        padding: EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Date',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1A1A),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            SizedBox(height: 20),
            // Month navigation
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                IconButton(
                  icon: Icon(Icons.chevron_left),
                  onPressed: () {
                    setState(() {
                      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1, 1);
                    });
                  },
                ),
                Text(
                  DateFormat('MMMM yyyy').format(_currentMonth),
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.chevron_right),
                  onPressed: () {
                    setState(() {
                      _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 1);
                    });
                  },
                ),
              ],
            ),
            SizedBox(height: 10),
            // Calendar grid
            _buildCalendar(),
            SizedBox(height: 20),
            // Legend
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'Available slots',
                  style: TextStyle(fontSize: 12, color: Colors.grey[700]),
                ),
              ],
            ),
            SizedBox(height: 20),
            // Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('Cancel'),
                ),
                SizedBox(width: 10),
                ElevatedButton(
                  onPressed: () => Navigator.pop(context, _selectedDate),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFFA31D1D),
                    foregroundColor: Colors.white,
                  ),
                  child: Text('Select'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendar() {
    final firstDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month, 1);
    final lastDayOfMonth = DateTime(_currentMonth.year, _currentMonth.month + 1, 0);
    final daysInMonth = lastDayOfMonth.day;
    final startingWeekday = firstDayOfMonth.weekday % 7; // 0 = Sunday, 6 = Saturday

    final today = DateTime.now();
    final tomorrow = DateTime(today.year, today.month, today.day + 1);

    return Column(
      children: [
        // Weekday headers
        Row(
          children: ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) {
            return Expanded(
              child: Center(
                child: Text(
                  day,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        SizedBox(height: 10),
        // Calendar days
        ...List.generate(6, (weekIndex) {
          return Row(
            children: List.generate(7, (dayIndex) {
              final dayNumber = weekIndex * 7 + dayIndex - startingWeekday + 1;
              
              if (dayNumber < 1 || dayNumber > daysInMonth) {
                return Expanded(child: SizedBox());
              }

              final date = DateTime(_currentMonth.year, _currentMonth.month, dayNumber);
              final dateKey = _formatDateKey(date);
              final isSelected = _formatDateKey(_selectedDate) == dateKey;
              final hasAvailability = _hasAvailability(date);
              final isPast = date.isBefore(tomorrow);
              final isToday = dateKey == _formatDateKey(today);

              return Expanded(
                child: GestureDetector(
                  onTap: isPast ? null : () {
                    setState(() {
                      _selectedDate = date;
                    });
                  },
                  child: Container(
                    margin: EdgeInsets.all(2),
                    height: 40,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Color(0xFFA31D1D)
                          : isPast
                              ? Colors.grey[200]
                              : Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isSelected
                            ? Color(0xFFA31D1D)
                            : isToday
                                ? Colors.blue
                                : Colors.grey[300]!,
                        width: isSelected ? 2 : 1,
                      ),
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Day number
                        Text(
                          '$dayNumber',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected
                                ? Colors.white
                                : isPast
                                    ? Colors.grey[400]
                                    : Colors.black87,
                          ),
                        ),
                        // Green dot indicator for availability
                        if (hasAvailability && !isPast && !isSelected)
                          Positioned(
                            bottom: 4,
                            child: Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: Colors.green,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.green.withOpacity(0.6),
                                    blurRadius: 4,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          );
        }),
      ],
    );
  }
}
