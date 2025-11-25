import 'package:flutter/material.dart';
import '../services/socket_service.dart';
import '../services/api_service.dart';
import 'dart:convert';

/// Widget that handles medication reminder notifications from Socket.IO
/// This should be added to the app's root widget to listen for real-time reminders
class MedicationReminderHandler extends StatefulWidget {
  final Widget child;
  
  const MedicationReminderHandler({
    Key? key,
    required this.child,
  }) : super(key: key);

  @override
  State<MedicationReminderHandler> createState() => _MedicationReminderHandlerState();
}

class _MedicationReminderHandlerState extends State<MedicationReminderHandler> {
  @override
  void initState() {
    super.initState();
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    // Listen for medication reminder notifications
    SocketService.onMedicationReminder((data) {
      // Convert data to Map if it's not already
      Map<String, dynamic> reminderData;
      if (data is Map) {
        reminderData = Map<String, dynamic>.from(data);
      } else if (data is String) {
        try {
          reminderData = jsonDecode(data) as Map<String, dynamic>;
        } catch (e) {
          reminderData = {'message': 'Medication reminder'};
        }
      } else {
        reminderData = {'message': 'Medication reminder'};
      }
      _handleMedicationReminder(reminderData);
    });
  }

  Future<void> _handleMedicationReminder(Map<String, dynamic> reminderData) async {
    final reminderId = reminderData['reminder_id']?.toString() ?? '';
    final medicationName = reminderData['medication_name']?.toString() ?? 'Medication';
    final dosage = reminderData['dosage']?.toString() ?? '';
    final message = reminderData['message']?.toString() ?? 
                   'Time to take $medicationName${dosage.isNotEmpty ? ' ($dosage)' : ''}';
    final specialInstructions = reminderData['special_instructions']?.toString();

    // Show in-app snackbar notification
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.medication, color: Colors.white, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      '💊 Medication Reminder',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Text(
                message,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
              if (specialInstructions != null && specialInstructions.isNotEmpty) ...[
                SizedBox(height: 4),
                Text(
                  'Note: $specialInstructions',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
          backgroundColor: Color(0xFFA31D1D),
          duration: Duration(seconds: 10),
          behavior: SnackBarBehavior.floating,
          margin: EdgeInsets.all(16),
          action: reminderId.isNotEmpty
              ? SnackBarAction(
                  label: 'Acknowledge',
                  textColor: Colors.white,
                  onPressed: () async {
                    await _acknowledgeReminder(reminderId);
                  },
                )
              : null,
        ),
      );
    }
  }

  Future<void> _acknowledgeReminder(String reminderId) async {
    try {
      final result = await ApiService.acknowledgeMedicationReminder(reminderId);
      if (result['success'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).hideCurrentSnackBar();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Text('✅ Reminder acknowledged'),
                ],
              ),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to acknowledge reminder'),
              backgroundColor: Colors.red,
              duration: Duration(seconds: 3),
            ),
          );
        }
      }
    } catch (e) {
      print('Error acknowledging reminder: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
