import React, { useState, useEffect } from 'react';
import '../css/main.css';
import '../css/components.css';

const PatientRegistration = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    birthDate: '',
    sex: '',
    civilStatus: '',
    nationality: 'Filipino',
    
    // Contact Information
    contactPhone: '',
    email: '',
    currentCity: '',
    currentProvince: '',
    philhealthNo: '',
    branch: '1',
    
    // Account Setup
    username: '',
    password: '',
    confirmPassword: '',
    termsConsent: false,
    dataConsent: false,
    smsConsent: false
  });
  
  const [confirmation, setConfirmation] = useState({
    uic: '',
    username: '',
    branch: ''
  });
  
  const [selectedBranch, setSelectedBranch] = useState('1');
  const [errors, setErrors] = useState({});
  
  // Inject stepper styles
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .registration-container {
        max-width: 700px;
        margin: 40px auto;
        padding: 20px;
      }

      .registration-card {
        background: white;
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-lg);
        overflow: hidden;
      }

      .registration-header {
        background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
        color: white;
        text-align: center;
        padding: 40px 30px;
      }

      .registration-body {
        padding: 40px 30px;
      }

      .progress-steps {
        display: flex;
        justify-content: space-between;
        margin-bottom: 40px;
        position: relative;
      }

      .progress-steps::before {
        content: '';
        position: absolute;
        top: 20px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--border-color);
        z-index: 0;
      }

      .step {
        position: relative;
        text-align: center;
        flex: 1;
        z-index: 1;
      }

      .step-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bg-secondary);
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 10px;
        font-weight: 600;
        transition: all 0.3s;
      }

      .step.active .step-circle {
        background: var(--primary-color);
        border-color: var(--primary-color);
        color: white;
      }

      .step.completed .step-circle {
        background: var(--success-color);
        border-color: var(--success-color);
        color: white;
      }

      .step-label {
        font-size: 13px;
        color: var(--text-secondary);
      }

      .step.active .step-label {
        color: var(--primary-color);
        font-weight: 600;
      }

      .registration-step {
        display: none;
      }

      .registration-step.active {
        display: block;
      }

      .form-section {
        margin-bottom: 30px;
      }

      .form-section h3 {
        font-size: 18px;
        color: var(--text-primary);
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid var(--border-color);
      }

      .form-actions {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 30px;
        padding-top: 30px;
        border-top: 1px solid var(--border-color);
      }

      .welcome-message {
        background: #eff6ff;
        padding: 20px;
        border-radius: var(--border-radius);
        margin-bottom: 20px;
        border-left: 4px solid var(--primary-color);
      }

      .branch-selection {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 12px;
      }

      .branch-card {
        border: 2px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .branch-card:hover {
        border-color: var(--primary-color);
        background: #eff6ff;
      }

      .branch-card.selected {
        border-color: var(--primary-color);
        background: #eff6ff;
      }

      .branch-card input[type="radio"] {
        display: none;
      }

      .success-icon {
        font-size: 64px;
        text-align: center;
        margin: 20px 0;
      }

      .error-message {
        color: var(--danger-color);
        font-size: 12px;
        margin-top: 5px;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);
  
  // Pre-select first branch (Ortigas Main)
  useEffect(() => {
    setSelectedBranch('1');
  }, []);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const handleBranchChange = (branchId) => {
    setSelectedBranch(branchId);
    setFormData(prev => ({
      ...prev,
      branch: branchId
    }));
  };
  
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.birthDate) newErrors.birthDate = 'Date of birth is required';
      if (!formData.sex) newErrors.sex = 'Sex is required';
      if (!formData.civilStatus) newErrors.civilStatus = 'Civil status is required';
    } else if (step === 2) {
      if (!formData.contactPhone) newErrors.contactPhone = 'Mobile number is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.currentCity) newErrors.currentCity = 'City is required';
      if (!formData.currentProvince) newErrors.currentProvince = 'Province is required';
    } else if (step === 3) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (formData.username.length < 4) newErrors.username = 'Username must be at least 4 characters';
      if (formData.username.includes(' ')) newErrors.username = 'Username cannot contain spaces';
      
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      
      if (!formData.termsConsent) newErrors.termsConsent = 'You must agree to the terms and conditions';
      if (!formData.dataConsent) newErrors.dataConsent = 'You must consent to data processing';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };
  
  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const generateUIC = (firstName, lastName, birthDate) => {
    const date = new Date(birthDate);
    const motherLetters = (firstName.substring(0, 2) || 'XX').toUpperCase();
    const fatherLetters = (lastName.substring(0, 2) || 'XX').toUpperCase();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${motherLetters}${fatherLetters}${month}${day}${year}`;
  };
  
  const showTerms = () => {
    alert('Terms and Conditions:\n\nBy using MyHubCares services, you agree to:\n- Provide accurate information\n- Maintain confidentiality of your account\n- Follow treatment plans as prescribed\n- Respect staff and other patients\n\n(Full terms would be displayed in production)');
  };
  
  const showPrivacy = () => {
    alert('Privacy Policy:\n\nMyHubCares respects your privacy and is committed to protecting your personal information in accordance with the Data Privacy Act of 2012.\n\n- Your health information is confidential\n- Data is encrypted and secure\n- Information is used only for healthcare purposes\n- You can request data deletion at any time\n\n(Full policy would be displayed in production)');
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }
    
    // Generate UIC
    const uic = generateUIC(formData.firstName, formData.lastName, formData.birthDate);
    
    // Get branch name
    const branchNames = {
      '1': 'MHC Ortigas Main',
      '2': 'MHC Pasay',
      '3': 'MHC Alabang'
    };
    
    // Set confirmation data
    setConfirmation({
      uic: uic,
      username: formData.username,
      branch: branchNames[formData.branch]
    });
    
    // Move to step 4
    setCurrentStep(4);
  };
  
  return (
    <div className="login-page">
      <div className="registration-container">
        <div className="registration-card">
          <div className="registration-header">
            <div className="logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="10" fill="white" fillOpacity="0.2"/>
                <path d="M30 15L20 25H26V35H22V45H30V35H34V45H42V35H38V25H44L30 15Z" fill="white"/>
              </svg>
            </div>
            <h1>Welcome to My Hub Cares!</h1>
            <p>"It's my hub, and it's yours" - Welcome Home!</p>
          </div>

          <div className="registration-body">
            {/* Progress Steps */}
            <div className="progress-steps">
              <div className={`step ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`} data-step="1">
                <div className="step-circle">1</div>
                <div className="step-label">Personal Info</div>
              </div>
              <div className={`step ${currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : ''}`} data-step="2">
                <div className="step-circle">2</div>
                <div className="step-label">Contact Details</div>
              </div>
              <div className={`step ${currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : ''}`} data-step="3">
                <div className="step-circle">3</div>
                <div className="step-label">Account Setup</div>
              </div>
              <div className={`step ${currentStep === 4 ? 'active' : ''}`} data-step="4">
                <div className="step-circle">4</div>
                <div className="step-label">Complete</div>
              </div>
            </div>

            <form id="registrationForm" onSubmit={handleSubmit}>
              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div className="registration-step active" data-step="1">
                  <div className="welcome-message">
                    <strong>Welcome to My Hub Cares!</strong><br/>
                    We're glad you're taking the first step. All information is confidential and secure.
                  </div>

                  <div className="form-section">
                    <h3>Personal Information</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="required">First Name</label>
                        <input 
                          type="text" 
                          id="firstName" 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required 
                          placeholder="Enter first name"
                        />
                        {errors.firstName && <div className="error-message">{errors.firstName}</div>}
                      </div>
                      <div className="form-group">
                        <label>Middle Name</label>
                        <input 
                          type="text" 
                          id="middleName" 
                          name="middleName"
                          value={formData.middleName}
                          onChange={handleInputChange}
                          placeholder="Enter middle name (optional)"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="required">Last Name</label>
                        <input 
                          type="text" 
                          id="lastName" 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required 
                          placeholder="Enter last name"
                        />
                        {errors.lastName && <div className="error-message">{errors.lastName}</div>}
                      </div>
                      <div className="form-group">
                        <label>Suffix</label>
                        <select 
                          id="suffix" 
                          name="suffix"
                          value={formData.suffix}
                          onChange={handleInputChange}
                        >
                          <option value="">None</option>
                          <option value="Jr.">Jr.</option>
                          <option value="Sr.">Sr.</option>
                          <option value="II">II</option>
                          <option value="III">III</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="required">Date of Birth</label>
                        <input 
                          type="date" 
                          id="birthDate" 
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleInputChange}
                          required 
                          max="2010-12-31"
                        />
                        {errors.birthDate && <div className="error-message">{errors.birthDate}</div>}
                      </div>
                      <div className="form-group">
                        <label className="required">Sex Assigned at Birth</label>
                        <select 
                          id="sex" 
                          name="sex"
                          value={formData.sex}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select</option>
                          <option value="M">Male</option>
                          <option value="F">Female</option>
                        </select>
                        {errors.sex && <div className="error-message">{errors.sex}</div>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="required">Civil Status</label>
                      <select 
                        id="civilStatus" 
                        name="civilStatus"
                        value={formData.civilStatus}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Widowed">Widowed</option>
                        <option value="Separated">Separated</option>
                      </select>
                      {errors.civilStatus && <div className="error-message">{errors.civilStatus}</div>}
                    </div>

                    <div className="form-group">
                      <label>Nationality</label>
                      <input 
                        type="text" 
                        id="nationality" 
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Details */}
              {currentStep === 2 && (
                <div className="registration-step active" data-step="2">
                  <div className="form-section">
                    <h3>Contact Information</h3>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label className="required">Mobile Number</label>
                        <input 
                          type="tel" 
                          id="contactPhone" 
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          required 
                          placeholder="09XX-XXX-XXXX" 
                          pattern="[0-9]{4}-[0-9]{3}-[0-9]{4}"
                        />
                        <small className="text-muted">Format: 09XX-XXX-XXXX</small>
                        {errors.contactPhone && <div className="error-message">{errors.contactPhone}</div>}
                      </div>
                      <div className="form-group">
                        <label className="required">Email Address</label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required 
                          placeholder="your.email@example.com"
                        />
                        {errors.email && <div className="error-message">{errors.email}</div>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="required">Current City</label>
                        <input 
                          type="text" 
                          id="currentCity" 
                          name="currentCity"
                          value={formData.currentCity}
                          onChange={handleInputChange}
                          required 
                          placeholder="Enter city"
                        />
                        {errors.currentCity && <div className="error-message">{errors.currentCity}</div>}
                      </div>
                      <div className="form-group">
                        <label className="required">Current Province</label>
                        <input 
                          type="text" 
                          id="currentProvince" 
                          name="currentProvince"
                          value={formData.currentProvince}
                          onChange={handleInputChange}
                          required 
                          placeholder="Enter province"
                        />
                        {errors.currentProvince && <div className="error-message">{errors.currentProvince}</div>}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>PhilHealth Number (if available)</label>
                      <input 
                        type="text" 
                        id="philhealthNo" 
                        name="philhealthNo"
                        value={formData.philhealthNo}
                        onChange={handleInputChange}
                        placeholder="XX-XXXXXXXXX-X"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Preferred My Hub Cares Branch</h3>
                    
                    <div className="branch-selection">
                      <label 
                        className={`branch-card ${selectedBranch === '1' ? 'selected' : ''}`}
                        onClick={() => handleBranchChange('1')}
                      >
                        <input 
                          type="radio" 
                          name="branch" 
                          value="1" 
                          checked={selectedBranch === '1'}
                          onChange={() => {}}
                        />
                        <div>
                          <strong>🏥 My Hub Cares</strong><br/>
                          <small>MHC Ortigas Main</small><br/>
                          <small>Pearl Drive, Pasig City</small><br/>
                          <small>📞 0917-187-CARE (2273)</small>
                        </div>
                      </label>

                      <label 
                        className={`branch-card ${selectedBranch === '2' ? 'selected' : ''}`}
                        onClick={() => handleBranchChange('2')}
                      >
                        <input 
                          type="radio" 
                          name="branch" 
                          value="2" 
                          checked={selectedBranch === '2'}
                          onChange={() => {}}
                        />
                        <div>
                          <strong>🏥 My Hub Cares</strong><br/>
                          <small>MHC Pasay</small><br/>
                          <small>EDSA, Pasay City</small><br/>
                          <small>📞 0898-700-1267</small>
                        </div>
                      </label>

                      <label 
                        className={`branch-card ${selectedBranch === '3' ? 'selected' : ''}`}
                        onClick={() => handleBranchChange('3')}
                      >
                        <input 
                          type="radio" 
                          name="branch" 
                          value="3" 
                          checked={selectedBranch === '3'}
                          onChange={() => {}}
                        />
                        <div>
                          <strong>🏥 My Hub Cares</strong><br/>
                          <small>MHC Alabang</small><br/>
                          <small>Muntinlupa City</small><br/>
                          <small>📞 0954-468-1630</small>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Account Setup */}
              {currentStep === 3 && (
                <div className="registration-step active" data-step="3">
                  <div className="welcome-message">
                    <strong>Create Your My Hub Cares Account</strong><br/>
                    Use this account to book appointments, view prescriptions, and manage your health.
                  </div>

                  <div className="form-section">
                    <h3>Account Credentials</h3>
                    
                    <div className="form-group">
                      <label className="required">Username</label>
                      <input 
                        type="text" 
                        id="username" 
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required 
                        placeholder="Choose a username" 
                        minLength="4"
                      />
                      <small className="text-muted">At least 4 characters, no spaces</small>
                      {errors.username && <div className="error-message">{errors.username}</div>}
                    </div>

                    <div className="form-group">
                      <label className="required">Password</label>
                      <input 
                        type="password" 
                        id="password" 
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required 
                        placeholder="Create a strong password" 
                        minLength="6"
                      />
                      <small className="text-muted">At least 6 characters</small>
                      {errors.password && <div className="error-message">{errors.password}</div>}
                    </div>

                    <div className="form-group">
                      <label className="required">Confirm Password</label>
                      <input 
                        type="password" 
                        id="confirmPassword" 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required 
                        placeholder="Re-enter password"
                      />
                      {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Terms and Consent</h3>
                    
                    <div className="form-group">
                      <label>
                        <input 
                          type="checkbox" 
                          id="termsConsent" 
                          name="termsConsent"
                          checked={formData.termsConsent}
                          onChange={handleInputChange}
                          required
                        />
                        I agree to the <a href="#" onClick={(e) => { e.preventDefault(); showTerms(); }}>Terms and Conditions</a> and <a href="#" onClick={(e) => { e.preventDefault(); showPrivacy(); }}>Privacy Policy</a>
                      </label>
                      {errors.termsConsent && <div className="error-message">{errors.termsConsent}</div>}
                    </div>

                    <div className="form-group">
                      <label>
                        <input 
                          type="checkbox" 
                          id="dataConsent" 
                          name="dataConsent"
                          checked={formData.dataConsent}
                          onChange={handleInputChange}
                          required
                        />
                        I consent to the collection and processing of my health information in accordance with the Data Privacy Act of 2012
                      </label>
                      {errors.dataConsent && <div className="error-message">{errors.dataConsent}</div>}
                    </div>

                    <div className="form-group">
                      <label>
                        <input 
                          type="checkbox" 
                          id="smsConsent" 
                          name="smsConsent"
                          checked={formData.smsConsent}
                          onChange={handleInputChange}
                        />
                        I agree to receive appointment reminders and health updates via SMS and email
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="registration-step active" data-step="4">
                  <div className="success-icon">✅</div>
                  <h2 className="text-center">Registration Successful!</h2>
                  
                  <div className="welcome-message">
                    <strong>Welcome to the My Hub Cares family!</strong><br/>
                    Your account has been created successfully. You can now access your patient portal.<br/>
                    <em style={{color: 'var(--primary-color)'}}>"It's my hub, and it's yours" - Welcome Home! 🏠</em>
                  </div>

                  <div className="card mt-3">
                    <div className="card-body">
                      <h4>Your Account Details</h4>
                      <div className="form-group">
                        <label>Unique Identifier Code (UIC)</label>
                        <input type="text" value={confirmation.uic} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Username</label>
                        <input type="text" value={confirmation.username} readOnly />
                      </div>
                      <div className="form-group">
                        <label>Preferred Branch</label>
                        <input type="text" value={confirmation.branch} readOnly />
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-3">
                    <strong>Next Steps:</strong>
                    <ul style={{margin: '10px 0 0 20px'}}>
                      <li>Log in to your patient portal</li>
                      <li>Complete your health profile</li>
                      <li>Book your first appointment</li>
                      <li>Set up medication reminders</li>
                    </ul>
                  </div>

                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-primary btn-lg" onClick={() => window.location.href='/'}>
                      Go to Login
                    </button>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              {currentStep < 4 && (
                <div className="form-actions" id="formActions">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    id="prevBtn" 
                    onClick={previousStep}
                    style={{display: currentStep > 1 ? 'block' : 'none'}}
                  >
                    ← Previous
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => window.location.href='/'}>
                    Cancel
                  </button>
                  {currentStep < 3 && (
                    <button type="button" className="btn btn-primary" id="nextBtn" onClick={nextStep}>
                      Next →
                    </button>
                  )}
                  {currentStep === 3 && (
                    <button type="submit" className="btn btn-success" id="submitBtn">
                      Complete Registration
                    </button>
                  )}
                </div>
              )}
            </form>

            <div className="text-center mt-3">
              <p className="text-muted">Already have an account? <a href="/">Login here</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistration;