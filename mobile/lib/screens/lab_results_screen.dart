import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
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

class _LabResultsScreenState extends State<LabResultsScreen> {
  List<dynamic> _labResults = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadLabResults();
  }

  Future<void> _loadLabResults() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.getLabResults();
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
      final date = result['result_date'] != null 
          ? DateFormat('MMMM yyyy').format(DateTime.parse(result['result_date']))
          : 'No Date';
      grouped.putIfAbsent(date, () => []).add(result);
    }
    return grouped;
  }

  @override
  Widget build(BuildContext context) {
    final filteredResults = _filteredResults;
    final groupedResults = _groupResultsByDate(filteredResults);
    
    return Scaffold(
      appBar: AppBar(
        title: Text('Lab Results'),
        backgroundColor: backgroundColor,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search tests...',
                prefixIcon: Icon(Icons.search, color: Colors.grey),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: primaryColor.withOpacity(0.1),
                contentPadding: EdgeInsets.symmetric(vertical: 0, horizontal: 16),
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
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadLabResults,
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
    );
  }

  Widget _buildEmptyState() {
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
                Icons.science_outlined,
                size: 64,
                color: primaryColor,
              ),
            ),
            SizedBox(height: 24),
            Text(
              'No Lab Results Found',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 12),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No results match your search. Try a different term.'
                  : 'You don\'t have any lab results yet. Your test results will appear here once they\'re available.',
              style: TextStyle(
                fontSize: 15,
                color: Colors.white,
                height: 1.5,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24),
            if (_searchQuery.isEmpty)
              ElevatedButton.icon(
                onPressed: _loadLabResults,
                icon: Icon(Icons.refresh, size: 20),
                label: Text('Refresh'),
                style: ElevatedButton.styleFrom(
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
    final date = test['result_date'] != null
        ? DateTime.parse(test['result_date'])
        : null;
    final isAbnormal = test['is_abnormal'] == true;
    final referenceRange = test['reference_range'] ?? '';

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
                  Text(
                    test['result_unit'] ?? '',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white,
                    ),
                  ),
                  Spacer(),
                  if (referenceRange.isNotEmpty)
                    Text(
                      'Ref: $referenceRange',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.white,
                      ),
                    ),
                ],
              ),
              if (test['lab_code'] != null || date != null) ...[
                SizedBox(height: 8),
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    if (test['lab_code'] != null)
                      _buildInfoChip(
                        icon: Icons.fingerprint,
                        text: test['lab_code'],
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
        color: Colors.white.withOpacity(0.1),
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
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  void _showResultDetails(Map<String, dynamic> test) {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        expand: false,
        builder: (_, controller) => SingleChildScrollView(
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
                      color: Colors.white.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Text(
                  test['test_name'] ?? 'Lab Test',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 24),
                _buildDetailRow('Result', '${test['result_value'] ?? 'N/A'} ${test['result_unit'] ?? ''}'),
                _buildDetailRow('Reference Range', test['reference_range'] ?? 'Not specified'),
                _buildDetailRow('Status', test['is_abnormal'] == true ? 'Abnormal' : 'Normal', 
                    isHighlighted: test['is_abnormal'] == true),
                if (test['lab_code'] != null)
                  _buildDetailRow('Lab Code', test['lab_code']),
                if (test['result_date'] != null)
                  _buildDetailRow('Test Date', 
                      DateFormat('MMM dd, yyyy').format(DateTime.parse(test['result_date']))),
                if (test['notes'] != null && test['notes'].isNotEmpty) ...[
                  SizedBox(height: 16),
                  Text(
                    'Notes',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    test['notes'],
                    style: TextStyle(
                      fontSize: 15,
                      color: Colors.white,
                      height: 1.5,
                    ),
                  ),
                ],
                SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      // Handle download/print action
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text('Download PDF'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
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
                color: Colors.white,
                fontSize: 15,
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
                color: isHighlighted ? Colors.red[600] : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }
}




