import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class HelpSupportScreen extends StatelessWidget {
  const HelpSupportScreen({Key? key}) : super(key: key);

  Future<void> _launchEmail(String email) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: email,
      query: 'subject=MyHubCares Support Request',
    );
    if (await canLaunchUrl(emailUri)) {
      await launchUrl(emailUri);
    } else {
      throw 'Could not launch email';
    }
  }

  Future<void> _launchPhone(String phone) async {
    final Uri phoneUri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(phoneUri)) {
      await launchUrl(phoneUri);
    } else {
      throw 'Could not launch phone';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text(
          'Help & Support',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: Color(0xFF9C27B0),
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF9C27B0), Color(0xFF7B1FA2)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Icon(Icons.help_outline, size: 48, color: Colors.white),
                  SizedBox(height: 12),
                  Text(
                    'We\'re Here to Help',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Get assistance with your account, appointments, or any questions you may have.',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.9),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            SizedBox(height: 24),
            // Contact Information
            _buildSection(
              context,
              'Contact Us',
              Icons.contact_support,
              [
                _buildContactTile(
                  context,
                  'Email Support',
                  'support@myhubcares.com',
                  Icons.email_outlined,
                  Colors.blue,
                  () => _launchEmail('support@myhubcares.com'),
                ),
                _buildContactTile(
                  context,
                  'Phone Support',
                  '+63 912 345 6789',
                  Icons.phone_outlined,
                  Colors.green,
                  () => _launchPhone('+639123456789'),
                ),
              ],
            ),
            SizedBox(height: 24),
            // Frequently Asked Questions
            _buildSection(
              context,
              'Frequently Asked Questions',
              Icons.question_answer,
              [
                _buildFAQItem(
                  context,
                  'How do I book an appointment?',
                  'You can book an appointment by going to the Appointments section and clicking the "Book Appointment" button. Select your preferred date, time, and healthcare provider.',
                ),
                _buildFAQItem(
                  context,
                  'How do I view my prescriptions?',
                  'Your prescriptions are available in the Prescriptions section. You can view active medications, dosages, and schedules.',
                ),
                _buildFAQItem(
                  context,
                  'Can I update my profile information?',
                  'Yes, you can update your profile information by going to the Profile section and clicking "Edit Profile". You can update your contact details, personal information, and more.',
                ),
                _buildFAQItem(
                  context,
                  'How do I change my password?',
                  'You can change your password from the Profile section by clicking "Change Password". You will need to enter your current password and create a new one.',
                ),
                _buildFAQItem(
                  context,
                  'What should I do if I miss a medication?',
                  'If you miss a medication, you can record it in the Medication Adherence section. The system will help track your adherence and provide recommendations.',
                ),
              ],
            ),
            SizedBox(height: 24),
            // App Information
            _buildSection(
              context,
              'App Information',
              Icons.info_outline,
              [
                _buildInfoTile(
                  context,
                  'Version',
                  '1.0.0',
                  Icons.phone_android,
                ),
                _buildInfoTile(
                  context,
                  'Last Updated',
                  '2025',
                  Icons.update,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, IconData icon, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Color(0xFF9C27B0), size: 24),
            SizedBox(width: 8),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey[800],
              ),
            ),
          ],
        ),
        SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: Offset(0, 4),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildContactTile(
    BuildContext context,
    String title,
    String subtitle,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[800],
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQItem(BuildContext context, String question, String answer) {
    return ExpansionTile(
      title: Text(
        question,
        style: TextStyle(
          fontSize: 15,
          fontWeight: FontWeight.w500,
          color: Colors.grey[800],
        ),
      ),
      children: [
        Padding(
          padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
          child: Text(
            answer,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoTile(
    BuildContext context,
    String title,
    String value,
    IconData icon,
  ) {
    return Padding(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, color: Colors.grey[600], size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[800],
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }
}

