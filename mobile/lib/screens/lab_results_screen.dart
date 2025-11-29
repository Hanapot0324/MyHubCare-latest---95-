import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';

// Brand Colors
const Color primaryColor = Color(0xFFD84040);
const Color primaryDarkColor = Color(0xFFA31D1D);
const Color accentColor = Color(0xFFECDCBF);
const Color backgroundColor = Color(0xFFF8F2DE);

class LabResultsScreen extends StatefulWidget {
  const LabResultsScreen({Key? key}) : super(key: key);

  @override
  State<LabResultsScreen> createState() => _LabResultsScreenState();
}

class _LabResultsScreenState extends State<LabResultsScreen> with SingleTickerProviderStateMixin {
  List<dynamic> _labResults = [];
  List<dynamic> _labOrders = [];
  bool _isLoading = true;
  String? _patientId;
  String? _userRole;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadCurrentUser();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _tabController.dispose();
    super.dispose();
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
      
      setState(() {
        _patientId = patientId;
        _userRole = userRole;
      });
      
      // Load data after getting patient ID
      await _loadLabResults();
      await _loadLabOrders();
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadLabResults() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getLabResults(patientId: _patientId);
      if (result['success'] == true) {
        setState(() {
          _labResults = result['data'] as List;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadLabOrders() async {
    try {
      final result = await ApiService.getLabOrders(patientId: _patientId);
      if (result['success'] == true) {
        setState(() {
          _labOrders = result['data'] as List;
        });
      }
    } catch (e) {
      // Silently fail for orders
    }
  }

  List<dynamic> get _filteredResults {
    if (_searchQuery.isEmpty) return _labResults;
    return _labResults.where((test) => 
      test['test_name']?.toLowerCase().contains(_searchQuery.toLowerCase()) == true ||
      test['lab_code']?.toLowerCase().contains(_searchQuery.toLowerCase()) == true
    ).toList();
  }

  Map<String, List<dynamic>> _groupResultsByDate(List<dynamic> results) {
    final Map<String, List<dynamic>> grouped = {};
    for (var result in results) {
      final dateStr = result['reported_at'] ?? result['result_date'] ?? result['date'];
      final date = dateStr != null 
          ? DateFormat('MMMM yyyy').format(DateTime.parse(dateStr))
          : 'No Date';
      grouped.putIfAbsent(date, () => []).add(result);
    }
    return grouped;
  }

  Widget _buildLabOrderCard(Map<String, dynamic> order) {
    final orderDate = order['order_date'] != null
        ? DateTime.parse(order['order_date'])
        : null;
    final status = order['status'] ?? 'ordered';
    final priority = order['priority'] ?? 'routine';
    
    Color statusColor;
    switch (status) {
      case 'completed':
        statusColor = Colors.green;
        break;
      case 'in_progress':
        statusColor = Colors.orange;
        break;
      case 'collected':
        statusColor = Colors.blue;
        break;
      case 'cancelled':
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    order['test_panel'] ?? 'Lab Order',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    status.replaceAll('_', ' ').toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      color: statusColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            if (orderDate != null)
              Row(
                children: [
                  Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                  SizedBox(width: 8),
                  Text(
                    DateFormat('MMM dd, yyyy').format(orderDate),
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  SizedBox(width: 16),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: priority == 'urgent' || priority == 'stat' 
                          ? Colors.red.withOpacity(0.1)
                          : Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      priority.toUpperCase(),
                      style: TextStyle(
                        fontSize: 11,
                        color: priority == 'urgent' || priority == 'stat' 
                            ? Colors.red[700]
                            : Colors.grey[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ],
              ),
            if (order['collection_date'] != null) ...[
              SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.bloodtype, size: 16, color: Colors.grey[600]),
                  SizedBox(width: 8),
                  Text(
                    'Collection: ${DateFormat('MMM dd, yyyy').format(DateTime.parse(order['collection_date']))}',
                    style: TextStyle(
                      fontSize: 13,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
            if (order['notes'] != null && order['notes'].toString().isNotEmpty) ...[
              SizedBox(height: 12),
              Container(
                padding: EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.note, size: 16, color: Colors.grey[600]),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        order['notes'],
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredResults = _filteredResults;
    final groupedResults = _groupResultsByDate(filteredResults);
    
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: Text('Lab Tests'),
        backgroundColor: primaryColor,
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: accentColor,
          indicatorWeight: 3,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(text: 'Results', icon: Icon(Icons.science)),
            Tab(text: 'Orders', icon: Icon(Icons.assignment)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Results Tab
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search tests...',
                    prefixIcon: Icon(Icons.search, color: primaryColor),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: primaryColor.withOpacity(0.3)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: primaryColor.withOpacity(0.3)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: primaryColor, width: 2),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
                  ),
                  onChanged: (value) {
                    setState(() {
                      _searchQuery = value;
                    });
                  },
                ),
              ),
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(primaryColor)))
                    : filteredResults.isEmpty
                        ? _buildEmptyState('No Lab Results Found', 'You don\'t have any lab results yet.')
                        : RefreshIndicator(
                            onRefresh: _loadLabResults,
                            color: primaryColor,
                            child: ListView.builder(
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              itemCount: groupedResults.length,
                              itemBuilder: (context, index) {
                                final date = groupedResults.keys.elementAt(index);
                                final results = groupedResults[date]!;
                                return _buildDateGroup(date, results);
                              },
                            ),
                          ),
              ),
            ],
          ),
          // Orders Tab
          Column(
            children: [
              Expanded(
                child: _isLoading
                    ? Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(primaryColor)))
                    : _labOrders.isEmpty
                        ? _buildEmptyState('No Lab Orders Found', 'You don\'t have any lab orders yet.')
                        : RefreshIndicator(
                            onRefresh: () async {
                              await _loadLabOrders();
                            },
                            color: primaryColor,
                            child: ListView.builder(
                              padding: EdgeInsets.all(16),
                              itemCount: _labOrders.length,
                              itemBuilder: (context, index) {
                                return _buildLabOrderCard(_labOrders[index]);
                              },
                            ),
                          ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: accentColor,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _tabController.index == 0 ? Icons.science_outlined : Icons.assignment_outlined,
                size: 64,
                color: primaryColor,
              ),
            ),
            SizedBox(height: 24),
            Text(
              title,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: primaryDarkColor,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 12),
            Text(
              _searchQuery.isNotEmpty && _tabController.index == 0
                  ? 'No results match your search. Try a different term.'
                  : message,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[700],
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24),
            if (_searchQuery.isEmpty)
              ElevatedButton.icon(
                onPressed: _tabController.index == 0 ? _loadLabResults : _loadLabOrders,
                icon: Icon(Icons.refresh, size: 20),
                label: Text('Refresh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: primaryColor,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildDateGroup(String date, List<dynamic> results) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 16.0, horizontal: 8.0),
          child: Text(
            date,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.white,
            ),
          ),
        ),
        ...results.map((test) => _buildLabResultCard(test)).toList(),
      ],
    );
  }

  Widget _buildLabResultCard(Map<String, dynamic> test) {
    final dateStr = test['reported_at'] ?? test['result_date'] ?? test['date'];
    final date = dateStr != null
        ? DateTime.parse(dateStr)
        : null;
    final isAbnormal = test['is_critical'] == true || test['is_abnormal'] == true;
    final referenceRange = test['reference_range_text'] ?? 
                          (test['reference_range_min'] != null && test['reference_range_max'] != null
                              ? '${test['reference_range_min']}-${test['reference_range_max']} ${test['unit'] ?? ''}'
                              : test['reference_range'] ?? '');
    final isPatient = _userRole == 'patient';

    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showResultDetails(test),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      test['test_name'] ?? 'Lab Test',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (isAbnormal)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Color(0xFFFFF3E0),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.warning_amber_rounded, 
                              size: 14, 
                              color: Colors.orange[800]),
                          SizedBox(width: 4),
                          Text(
                            'Abnormal',
                            style: TextStyle(
                              fontSize: 12,
                              color: primaryDarkColor,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
              SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Text(
                    '${test['result_value'] ?? 'N/A'}',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: isAbnormal ? primaryDarkColor : primaryColor,
                    ),
                  ),
                  SizedBox(width: 4),
                  if (test['unit'] != null || test['result_unit'] != null)
                    Text(
                      test['unit'] ?? test['result_unit'] ?? '',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[700],
                      ),
                    ),
                  Spacer(),
                  if (referenceRange.isNotEmpty)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Ref: $referenceRange',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[700],
                        ),
                      ),
                    ),
                ],
              ),
              if (test['test_code'] != null || test['lab_code'] != null || date != null) ...[
                SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    if (test['test_code'] != null || test['lab_code'] != null)
                      _buildInfoChip(
                        icon: Icons.fingerprint,
                        text: test['test_code'] ?? test['lab_code'] ?? '',
                      ),
                    if (date != null)
                      _buildInfoChip(
                        icon: Icons.calendar_today,
                        text: DateFormat('MMM dd, yyyy').format(date),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChip({required IconData icon, required String text}) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: Colors.grey[600]),
          SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[700],
            ),
          ),
        ],
      ),
    );
  }

  void _showResultDetails(Map<String, dynamic> test) {
    final dateStr = test['reported_at'] ?? test['result_date'] ?? test['date'];
    final isAbnormal = test['is_critical'] == true || test['is_abnormal'] == true;
    final referenceRange = test['reference_range_text'] ?? 
                          (test['reference_range_min'] != null && test['reference_range_max'] != null
                              ? '${test['reference_range_min']}-${test['reference_range_max']} ${test['unit'] ?? ''}'
                              : test['reference_range'] ?? '');
    
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, controller) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            controller: controller,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      margin: EdgeInsets.only(bottom: 20),
                      decoration: BoxDecoration(
                        color: Colors.grey[300],
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  Text(
                    test['test_name'] ?? 'Lab Test',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: primaryDarkColor,
                    ),
                  ),
                  SizedBox(height: 24),
                  _buildDetailRow('Result', '${test['result_value'] ?? 'N/A'} ${test['unit'] ?? test['result_unit'] ?? ''}'),
                  _buildDetailRow('Reference Range', referenceRange.isNotEmpty ? referenceRange : 'Not specified'),
                  _buildDetailRow('Status', isAbnormal ? 'Critical/Abnormal' : 'Normal', 
                      isHighlighted: isAbnormal),
                  if (test['test_code'] != null || test['lab_code'] != null)
                    _buildDetailRow('Test Code', test['test_code'] ?? test['lab_code'] ?? ''),
                  if (dateStr != null)
                    _buildDetailRow('Test Date', 
                        DateFormat('MMM dd, yyyy').format(DateTime.parse(dateStr))),
                if (test['notes'] != null && test['notes'].toString().isNotEmpty) ...[
                  SizedBox(height: 16),
                  Text(
                    'Notes',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: primaryDarkColor,
                    ),
                  ),
                  SizedBox(height: 8),
                  Container(
                    padding: EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      test['notes'].toString(),
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.grey[700],
                        height: 1.5,
                      ),
                    ),
                  ),
                ],
                SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(_userRole == 'patient' ? 'Close' : 'Download PDF'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ));
  }

  Widget _buildDetailRow(String label, String value, {bool isHighlighted = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey[700],
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 15,
                fontWeight: isHighlighted ? FontWeight.w600 : FontWeight.normal,
                color: isHighlighted ? primaryDarkColor : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}




