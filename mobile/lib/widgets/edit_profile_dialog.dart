import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

// Brand Colors
const Color _primaryColor = Color(0xFFD84040);
const Color _primaryDarkColor = Color(0xFFA31D1D);

class EditProfileDialog extends StatefulWidget {
  final Map<String, dynamic> patient;

  const EditProfileDialog({Key? key, required this.patient}) : super(key: key);

  @override
  State<EditProfileDialog> createState() => _EditProfileDialogState();
}

class _EditProfileDialogState extends State<EditProfileDialog> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;

  // Controllers
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _middleNameController;
  late TextEditingController _emailController;
  late TextEditingController _contactPhoneController;
  late TextEditingController _birthDateController;
  String? _selectedGender;
  String? _selectedCivilStatus;

  @override
  void initState() {
    super.initState();
    _firstNameController = TextEditingController(text: widget.patient['first_name'] ?? '');
    _lastNameController = TextEditingController(text: widget.patient['last_name'] ?? '');
    _middleNameController = TextEditingController(text: widget.patient['middle_name'] ?? '');
    _emailController = TextEditingController(text: widget.patient['email'] ?? '');
    _contactPhoneController = TextEditingController(text: widget.patient['contact_phone'] ?? '');
    
    // Format birth date
    if (widget.patient['birth_date'] != null) {
      final date = DateTime.parse(widget.patient['birth_date']);
      _birthDateController = TextEditingController(text: DateFormat('yyyy-MM-dd').format(date));
    } else {
      _birthDateController = TextEditingController();
    }
    
    _selectedGender = widget.patient['sex'];
    _selectedCivilStatus = widget.patient['civil_status'];
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _middleNameController.dispose();
    _emailController.dispose();
    _contactPhoneController.dispose();
    _birthDateController.dispose();
    super.dispose();
  }

  InputDecoration _buildInputDecoration(String labelText, IconData icon) {
    return InputDecoration(
      labelText: labelText,
      prefixIcon: Icon(icon),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: _primaryColor, width: 2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      labelStyle: TextStyle(color: _primaryDarkColor.withOpacity(0.7)),
      floatingLabelStyle: TextStyle(color: _primaryColor),
    );
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: widget.patient['birth_date'] != null 
          ? DateTime.parse(widget.patient['birth_date'])
          : DateTime.now().subtract(Duration(days: 365 * 18)),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _birthDateController.text = DateFormat('yyyy-MM-dd').format(picked);
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final patientData = {
        'first_name': _firstNameController.text.trim(),
        'last_name': _lastNameController.text.trim(),
        'middle_name': _middleNameController.text.trim().isEmpty 
            ? null 
            : _middleNameController.text.trim(),
        'email': _emailController.text.trim(),
        'contact_phone': _contactPhoneController.text.trim(),
        'birth_date': _birthDateController.text,
        'sex': _selectedGender,
        'civil_status': _selectedCivilStatus,
      };

      final result = await ApiService.updatePatientProfile(
        widget.patient['patient_id'],
        patientData,
      );

      if (result['success'] == true) {
        if (mounted) {
          Navigator.of(context).pop(true); // Return true to indicate success
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Profile updated successfully'),
              backgroundColor: _primaryColor,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(result['message'] ?? 'Failed to update profile'),
              backgroundColor: _primaryDarkColor,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('An error occurred. Please try again.'),
            backgroundColor: Color(0xFFA31D1D),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: double.infinity,
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.9),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: _primaryColor,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Icon(Icons.edit_outlined, color: Colors.white, size: 24),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Edit Profile',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            // Form
            Flexible(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(20),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // First Name
                      TextFormField(
                        controller: _firstNameController,
                        decoration: _buildInputDecoration('First Name *', Icons.person_outline),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'First name is required';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Middle Name
                      TextFormField(
                        controller: _middleNameController,
                        decoration: _buildInputDecoration('Middle Name', Icons.person_outline),
                      ),
                      SizedBox(height: 16),
                      // Last Name
                      TextFormField(
                        controller: _lastNameController,
                        decoration: _buildInputDecoration('Last Name *', Icons.person_outline),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Last name is required';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Email
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: _buildInputDecoration('Email *', Icons.email_outlined),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Email is required';
                          }
                          if (!value.contains('@')) {
                            return 'Please enter a valid email';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Contact Phone
                      TextFormField(
                        controller: _contactPhoneController,
                        keyboardType: TextInputType.phone,
                        decoration: _buildInputDecoration('Contact Phone *', Icons.phone_outlined),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Contact phone is required';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Birth Date
                      TextFormField(
                        controller: _birthDateController,
                        readOnly: true,
                        decoration: _buildInputDecoration('Date of Birth *', Icons.calendar_today_outlined),
                        onTap: () => _selectDate(context),
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Date of birth is required';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Gender
                      DropdownButtonFormField<String>(
                        value: _selectedGender,
                        decoration: _buildInputDecoration('Gender *', Icons.people_outline),
                        items: ['M', 'F', 'O'].map((gender) {
                          return DropdownMenuItem(
                            value: gender,
                            child: Text(gender == 'M' ? 'Male' : gender == 'F' ? 'Female' : 'Other'),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => _selectedGender = value);
                        },
                        validator: (value) {
                          if (value == null) {
                            return 'Gender is required';
                          }
                          return null;
                        },
                      ),
                      SizedBox(height: 16),
                      // Civil Status
                      DropdownButtonFormField<String>(
                        value: _selectedCivilStatus,
                        decoration: _buildInputDecoration('Civil Status', Icons.favorite_outline),
                        items: ['Single', 'Married', 'Divorced', 'Widowed', 'Separated']
                            .map((status) {
                          return DropdownMenuItem(
                            value: status,
                            child: Text(status),
                          );
                        }).toList(),
                        onChanged: (value) {
                          setState(() => _selectedCivilStatus = value);
                        },
                      ),
                      SizedBox(height: 24),
                      // Save Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _saveProfile,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: _primaryColor,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: _isLoading
                              ? SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                  ),
                                )
                              : Text(
                                  'Save Changes',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

