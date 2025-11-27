import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'package:intl/intl.dart';
import '../services/api_service.dart';
import 'login.dart';
import 'package:flutter/services.dart';
import '../widgets/edit_profile_dialog.dart';
import '../widgets/change_password_dialog.dart';
import 'help_support_screen.dart';

// Brand Colors
const Color primaryColor = Color(0xFFD84040);
const Color primaryDarkColor = Color(0xFFA31D1D);
const Color accentColor = Color(0xFFECDCBF);
const Color backgroundColor = Color(0xFFF8F2DE);

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _patient;
  Map<String, dynamic>? _user;
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    if (!_isRefreshing) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });
    }
    
    try {
      // Get user from shared preferences
      final prefs = await SharedPreferences.getInstance();
      final userStr = prefs.getString('user');
      if (userStr != null) {
        setState(() => _user = jsonDecode(userStr));
      }

      // Get patient profile
      final result = await ApiService.getPatientProfile();
      if (result['success'] == true) {
        setState(() {
          _patient = result['patient'];
          _isLoading = false;
          _isRefreshing = false;
          _errorMessage = null;
        });
      } else {
        setState(() {
          _isLoading = false;
          _isRefreshing = false;
          _errorMessage = result['message'] ?? 'Failed to load profile';
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _isRefreshing = false;
        _errorMessage = 'An error occurred. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(
          'My Profile',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: primaryColor,
        elevation: 0,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      body: _isLoading && !_isRefreshing
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
              ),
            )
          : _errorMessage != null
              ? Center(
                  child: Padding(
                    padding: EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: accentColor,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.error_outline, size: 48, color: primaryDarkColor),
                        ),
                        SizedBox(height: 24),
                        Text(
                          _errorMessage!,
                          style: TextStyle(
                            fontSize: 16,
                            color: primaryDarkColor,
                            fontWeight: FontWeight.w500,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadProfile,
                          icon: Icon(Icons.refresh),
                          label: Text('Retry'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryColor,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 2,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: () async {
                    setState(() => _isRefreshing = true);
                    await _loadProfile();
                  },
                  color: primaryColor,
                  child: SingleChildScrollView(
                    physics: AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.only(bottom: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildProfileHeader(),
                        SizedBox(height: 20),
                        _buildPersonalInfo(),
                        SizedBox(height: 20),
                        _buildActions(),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildProfileHeader() {
    final firstName = _patient?['first_name'] ?? _user?['full_name']?.split(' ')[0] ?? 'Patient';
    final lastName = _patient?['last_name'] ?? _user?['full_name']?.split(' ').last ?? '';
    final fullName = '${_patient?['first_name'] ?? ''} ${_patient?['last_name'] ?? ''}'.trim();
    final email = _patient?['email'] ?? _user?['email'] ?? '';
    final initials = '${firstName.isNotEmpty ? firstName[0] : ''}${lastName.isNotEmpty ? lastName[0] : ''}'.toUpperCase();

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(vertical: 40, horizontal: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [primaryColor, primaryDarkColor],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(35),
          bottomRight: Radius.circular(35),
        ),
        boxShadow: [
          BoxShadow(
            color: primaryDarkColor.withOpacity(0.3),
            blurRadius: 15,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            width: 110,
            height: 110,
            decoration: BoxDecoration(
              color: accentColor,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 4),
              boxShadow: [
                BoxShadow(
                  color: primaryDarkColor.withOpacity(0.3),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Center(
              child: Text(
                initials.isNotEmpty ? initials : '?',
                style: TextStyle(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: primaryDarkColor,
                  letterSpacing: 1,
                ),
              ),
            ),
          ),
          SizedBox(height: 20),
          Text(
            fullName.isNotEmpty ? fullName : 'User',
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
          if (email.isNotEmpty) ...[
            SizedBox(height: 8),
            Text(
              email,
              style: TextStyle(
                fontSize: 15,
                color: Colors.white.withOpacity(0.9),
                fontWeight: FontWeight.w400,
              ),
            ),
          ],
          SizedBox(height: 12),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: accentColor.withOpacity(0.95),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Text(
              'Patient',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: primaryDarkColor,
                letterSpacing: 0.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalInfo() {
    final birthDate = _patient?['birth_date'] != null 
        ? DateFormat('MMMM d, y').format(DateTime.parse(_patient!['birth_date']))
        : 'N/A';
        
    final age = _patient?['birth_date'] != null
        ? _calculateAge(DateTime.parse(_patient!['birth_date'])).toString() + ' years'
        : 'N/A';
        
    final gender = _patient?['sex'] == 'M' 
        ? 'Male' 
        : _patient?['sex'] == 'F' 
            ? 'Female' 
            : 'N/A';
    
    final contact = _patient?['contact_phone'] ?? 'N/A';
    final email = _patient?['email'] ?? _user?['email'] ?? 'N/A';
    final uic = _patient?['uic'] ?? 'N/A';

    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: accentColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDarkColor.withOpacity(0.15),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 16),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.person_outline,
                    color: primaryDarkColor,
                    size: 20,
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  'Personal Information',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                    color: primaryDarkColor,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1, color: primaryDarkColor.withOpacity(0.15)),
          _buildInfoRow(Icons.badge_outlined, 'UIC', uic),
          _buildInfoRow(Icons.cake_outlined, 'Date of Birth', birthDate),
          _buildInfoRow(Icons.calendar_today_outlined, 'Age', age),
          _buildInfoRow(Icons.people_outline, 'Gender', gender),
          _buildInfoRow(Icons.phone_android_outlined, 'Contact', contact),
          _buildInfoRow(Icons.email_outlined, 'Email', email),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, size: 20, color: primaryDarkColor),
          ),
          SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    color: primaryDarkColor.withOpacity(0.65),
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: primaryDarkColor,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionTile(String title, IconData icon, Color color, VoidCallback onTap, {bool showDivider = true}) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            splashColor: primaryColor.withOpacity(0.1),
            highlightColor: primaryColor.withOpacity(0.05),
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 18, horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: color.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: color, size: 22),
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: Text(
                      title,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: primaryDarkColor,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ),
                  Icon(Icons.chevron_right, color: primaryDarkColor.withOpacity(0.5), size: 24),
                ],
              ),
            ),
          ),
        ),
        if (showDivider) 
          Padding(
            padding: EdgeInsets.only(left: 80, right: 20),
            child: Divider(height: 1, thickness: 1, color: primaryDarkColor.withOpacity(0.12)),
          ),
      ],
    );
  }

  Widget _buildActions() {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: accentColor,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: primaryDarkColor.withOpacity(0.15),
            blurRadius: 12,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(
                    Icons.settings_outlined,
                    color: primaryDarkColor,
                    size: 20,
                  ),
                ),
                SizedBox(width: 12),
                Text(
                  'Account Settings',
                  style: TextStyle(
                    fontSize: 19,
                    fontWeight: FontWeight.w700,
                    color: primaryDarkColor,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1, thickness: 1, color: primaryDarkColor.withOpacity(0.15)),
          _buildActionTile(
            'Edit Profile',
            Icons.edit_outlined,
            primaryColor,
            () async {
              if (_patient != null) {
                final result = await showDialog(
                  context: context,
                  builder: (context) => EditProfileDialog(patient: _patient!),
                );
                if (result == true) {
                  // Reload profile after successful update
                  _loadProfile();
                }
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Profile data not available. Please try again.'),
                    backgroundColor: primaryDarkColor,
                  ),
                );
              }
            },
          ),
          _buildActionTile(
            'Change Password',
            Icons.lock_outline,
            primaryDarkColor,
            () {
              showDialog(
                context: context,
                builder: (context) => ChangePasswordDialog(),
              );
            },
          ),
          _buildActionTile(
            'Help & Support',
            Icons.help_outline,
            primaryColor,
            () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => HelpSupportScreen(),
                ),
              );
            },
          ),
          _buildActionTile(
            'Logout',
            Icons.logout,
            primaryColor,
            _handleLogout,
            showDivider: false,
          ),
        ],
      ),
    );
  }

  int _calculateAge(DateTime birthDate) {
    final now = DateTime.now();
    int age = now.year - birthDate.year;
    if (now.month < birthDate.month ||
        (now.month == birthDate.month && now.day < birthDate.day)) {
      age--;
    }
    return age;
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
        title: Text(
          'Logout',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: primaryDarkColor,
          ),
        ),
        content: Text(
          'Are you sure you want to logout?',
          style: TextStyle(color: primaryDarkColor),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(
              'CANCEL',
              style: TextStyle(color: primaryDarkColor.withOpacity(0.7)),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              backgroundColor: primaryColor,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: Text('LOGOUT'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.clear();
      
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => Login()),
          (route) => false,
        );
        
        // Show a confirmation message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Successfully logged out'),
            backgroundColor: primaryColor,
            behavior: SnackBarBehavior.floating,
            margin: EdgeInsets.all(16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    }
  }
}
