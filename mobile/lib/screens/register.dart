import 'package:flutter/material.dart';

class Register extends StatefulWidget {
  const Register({Key? key}) : super(key: key); // <- const constructor

  @override
  _RegisterState createState() => _RegisterState();
}

class _RegisterState extends State<Register> {
  int currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Step 1: Personal Info
  final firstNameController = TextEditingController();
  final middleNameController = TextEditingController();
  final lastNameController = TextEditingController();
  String suffix = '';
  DateTime? birthDate;
  String sex = 'M';
  String civilStatus = '';
  final nationalityController = TextEditingController(text: 'Filipino');

  // Parent info
  final motherNameController = TextEditingController();
  final fatherNameController = TextEditingController();
  final birthOrderController = TextEditingController(text: '1');

  // Step 2: Contact & Branch
  final phoneController = TextEditingController();
  final emailController = TextEditingController();
  final addressController = TextEditingController();
  final cityController = TextEditingController();
  final provinceController = TextEditingController();
  final philhealthController = TextEditingController();
  int selectedBranch = 1;

  // Step 3: Account
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmPasswordController = TextEditingController();
  bool termsConsent = false;
  bool dataConsent = false;
  bool smsConsent = false;

  // Step 4: Success
  String generatedUIC = '';

  List<String> branches = const [
    '🏥 MHC Ortigas Main',
    '🏥 MHC Pasay',
    '🏥 MHC Alabang',
  ];

  void nextStep() {
    if (_formKey.currentState?.validate() ?? false) {
      if (currentStep < 2) {
        setState(() => currentStep++);
      } else {
        submitRegistration();
      }
    }
  }

  void previousStep() {
    if (currentStep > 0) {
      setState(() => currentStep--);
    }
  }

  void submitRegistration() {
    // Generate UIC
    String mother = motherNameController.text;
    String father = fatherNameController.text;
    String birthOrder = birthOrderController.text.padLeft(2, '0');
    String date = birthDate != null
        ? "${birthDate!.month.toString().padLeft(2, '0')}-${birthDate!.day.toString().padLeft(2, '0')}-${birthDate!.year}"
        : '';
    generatedUIC =
        "${mother.substring(0, 2).toUpperCase()}${father.substring(0, 2).toUpperCase()}$birthOrder$date";

    setState(() {
      currentStep = 3; // Success screen
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('🏠 My Hub Cares'),
        backgroundColor: const Color(0xFF2563EB),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          type: StepperType.horizontal,
          currentStep: currentStep > 2 ? 2 : currentStep,
          onStepContinue: nextStep,
          onStepCancel: previousStep,
          steps: [
            Step(
              title: const Text('Personal'),
              isActive: currentStep >= 0,
              content: SingleChildScrollView(
                child: Column(
                  children: [
                    TextFormField(
                      controller: firstNameController,
                      decoration:
                          const InputDecoration(labelText: 'First Name *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: middleNameController,
                      decoration:
                          const InputDecoration(labelText: 'Middle Name'),
                    ),
                    TextFormField(
                      controller: lastNameController,
                      decoration:
                          const InputDecoration(labelText: 'Last Name *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    DropdownButtonFormField<String>(
                      value: suffix.isEmpty ? null : suffix,
                      decoration: const InputDecoration(labelText: 'Suffix'),
                      items: const ['None', 'Jr.', 'Sr.', 'II', 'III']
                          .map((s) => DropdownMenuItem(
                                value: s == 'None' ? '' : s,
                                child: Text(s),
                              ))
                          .toList(),
                      onChanged: (val) => setState(() => suffix = val!),
                    ),
                    const SizedBox(height: 10),
                    InputDatePickerFormField(
                      firstDate: DateTime(1900),
                      lastDate: DateTime(2010, 12, 31),
                      fieldLabelText: 'Date of Birth *',
                      onDateSubmitted: (val) => birthDate = val,
                      onDateSaved: (val) => birthDate = val,
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: RadioListTile(
                            title: const Text('👨 Male'),
                            value: 'M',
                            groupValue: sex,
                            onChanged: (val) => setState(() => sex = val!),
                          ),
                        ),
                        Expanded(
                          child: RadioListTile(
                            title: const Text('👩 Female'),
                            value: 'F',
                            groupValue: sex,
                            onChanged: (val) => setState(() => sex = val!),
                          ),
                        ),
                      ],
                    ),
                    DropdownButtonFormField<String>(
                      value: civilStatus.isEmpty ? null : civilStatus,
                      decoration:
                          const InputDecoration(labelText: 'Civil Status *'),
                      validator: (val) =>
                          val == null || val.isEmpty ? 'Required' : null,
                      items: const ['Single', 'Married', 'Widowed', 'Separated']
                          .map((s) => DropdownMenuItem(
                                value: s,
                                child: Text(s),
                              ))
                          .toList(),
                      onChanged: (val) => setState(() => civilStatus = val!),
                    ),
                    TextFormField(
                      controller: nationalityController,
                      decoration:
                          const InputDecoration(labelText: 'Nationality'),
                    ),
                    const SizedBox(height: 20),
                    const Text('Parent Information (for UIC)',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    TextFormField(
                      controller: motherNameController,
                      decoration:
                          const InputDecoration(labelText: "Mother's Name *"),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: fatherNameController,
                      decoration:
                          const InputDecoration(labelText: "Father's Name *"),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: birthOrderController,
                      decoration:
                          const InputDecoration(labelText: 'Birth Order *'),
                      keyboardType: TextInputType.number,
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                  ],
                ),
              ),
            ),
            Step(
              title: const Text('Contact'),
              isActive: currentStep >= 1,
              content: SingleChildScrollView(
                child: Column(
                  children: [
                    TextFormField(
                      controller: phoneController,
                      decoration: const InputDecoration(
                          labelText: 'Mobile Number *'),
                      keyboardType: TextInputType.phone,
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: emailController,
                      decoration: const InputDecoration(labelText: 'Email Address'),
                    ),
                    TextFormField(
                      controller: addressController,
                      decoration:
                          const InputDecoration(labelText: 'Street Address *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: cityController,
                      decoration: const InputDecoration(labelText: 'City *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: provinceController,
                      decoration: const InputDecoration(labelText: 'Province *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: philhealthController,
                      decoration: const InputDecoration(
                          labelText: 'PhilHealth Number'),
                    ),
                    const SizedBox(height: 20),
                    const Text('Choose Your Branch',
                        style: TextStyle(fontWeight: FontWeight.bold)),
                    ...List.generate(branches.length, (index) {
                      return RadioListTile(
                        title: Text(branches[index]),
                        value: index + 1,
                        groupValue: selectedBranch,
                        onChanged: (val) =>
                            setState(() => selectedBranch = val as int),
                      );
                    }),
                  ],
                ),
              ),
            ),
            Step(
              title: const Text('Account'),
              isActive: currentStep >= 2,
              content: SingleChildScrollView(
                child: Column(
                  children: [
                    TextFormField(
                      controller: usernameController,
                      decoration: const InputDecoration(labelText: 'Username *'),
                      validator: (value) =>
                          value!.isEmpty ? 'Required' : null,
                    ),
                    TextFormField(
                      controller: passwordController,
                      decoration: const InputDecoration(labelText: 'Password *'),
                      obscureText: true,
                      validator: (value) =>
                          value!.length < 6 ? 'Min 6 chars' : null,
                    ),
                    TextFormField(
                      controller: confirmPasswordController,
                      decoration: const InputDecoration(
                          labelText: 'Confirm Password *'),
                      obscureText: true,
                      validator: (value) => value != passwordController.text
                          ? 'Passwords do not match'
                          : null,
                    ),
                    CheckboxListTile(
                      value: termsConsent,
                      title: const Text(
                          'I agree to the Terms and Conditions and Privacy Policy'),
                      onChanged: (val) => setState(() => termsConsent = val!),
                    ),
                    CheckboxListTile(
                      value: dataConsent,
                      title: const Text(
                          'I consent to the collection and processing of my health information'),
                      onChanged: (val) => setState(() => dataConsent = val!),
                    ),
                    CheckboxListTile(
                      value: smsConsent,
                      title: const Text(
                          'I agree to receive appointment reminders and health updates via SMS and email'),
                      onChanged: (val) => setState(() => smsConsent = val!),
                    ),
                    const SizedBox(height: 20),
                    if (currentStep == 2)
                      ElevatedButton(
                        onPressed: nextStep,
                        child: const Text('🚀 Create Account'),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
