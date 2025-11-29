import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Mail,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
  Copy,
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * MFA Management Component
 * 
 * HOW IT WORKS:
 * 
 * 1. MFA STATUS CHECK:
 *    - Fetches current MFA status from /api/mfa/status/:user_id
 *    - Shows if MFA is enabled/disabled
 *    - Displays current method (SMS/Email/TOTP)
 * 
 * 2. ENABLE MFA:
 *    - User selects method (SMS, Email, or TOTP)
 *    - For SMS: Requires phone number
 *    - For Email: Uses user's email
 *    - For TOTP: Generates secret and shows QR code
 *    - Calls /api/mfa/setup to enable MFA
 * 
 * 3. DISABLE MFA:
 *    - Requires password verification
 *    - Calls /api/mfa/disable to disable MFA
 *    - Updates user's mfa_enabled flag
 * 
 * 4. TOTP SETUP:
 *    - Generates secret and QR code
 *    - User scans QR code with authenticator app
 *    - Verifies with test code before enabling
 */
const MFAManagement = () => {
  const [loading, setLoading] = useState(true);
  const [mfaStatus, setMfaStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [setupMethod, setSetupMethod] = useState('sms');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [totpSecret, setTotpSecret] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  /**
   * Fetch current MFA status for the logged-in user
   */
  const fetchMFAStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setError('Please login to manage MFA settings');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userStr);
      setUser(userData);

      const response = await fetch(`${API_BASE_URL}/mfa/status/${userData.user_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setMfaStatus(data.data);
        if (data.data.phone) {
          setPhoneNumber(data.data.phone);
        }
      } else {
        setError(data.message || 'Failed to fetch MFA status');
      }
    } catch (err) {
      console.error('Error fetching MFA status:', err);
      setError('Failed to load MFA settings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Setup MFA for the user
   * Step 1: Call /api/mfa/setup to enable MFA
   * Step 2: For TOTP, generate QR code
   * Step 3: For SMS/Email, verify code is sent
   */
  const handleSetupMFA = async () => {
    try {
      setProcessing(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr);

      if (setupMethod === 'sms' && !phoneNumber) {
        setError('Phone number is required for SMS MFA');
        setProcessing(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/mfa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_id,
          method: setupMethod,
          phone_number: setupMethod === 'sms' ? phoneNumber : undefined,
          email: setupMethod === 'email' ? userData.email : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to setup MFA');
      }

      // For TOTP, generate QR code
      if (setupMethod === 'totp' && data.data.secret) {
        setTotpSecret(data.data.secret);
        // Generate QR code URL (format: otpauth://totp/AppName:user@email.com?secret=SECRET&issuer=AppName)
        const qrData = `otpauth://totp/MyHubCare:${userData.email || userData.username}?secret=${data.data.secret}&issuer=MyHubCare`;
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`);
        setSuccess('TOTP secret generated. Please scan the QR code and enter a verification code to complete setup.');
      } else {
        // For SMS/Email, MFA is now enabled
        setSuccess(`MFA enabled successfully via ${setupMethod.toUpperCase()}. Please verify on next login.`);
        setShowSetupModal(false);
        fetchMFAStatus();
      }
    } catch (err) {
      console.error('Error setting up MFA:', err);
      setError(err.message || 'Failed to setup MFA');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Verify TOTP code to complete setup
   */
  const handleVerifyTOTP = async () => {
    try {
      setProcessing(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr);

      // Generate MFA token first
      const generateResponse = await fetch(`${API_BASE_URL}/mfa/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_id,
          method: 'totp',
        }),
      });

      const generateData = await generateResponse.json();
      if (!generateResponse.ok || !generateData.success) {
        throw new Error('Failed to generate verification code');
      }

      // Verify the code
      const verifyResponse = await fetch(`${API_BASE_URL}/mfa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mfa_token_id: generateData.data.mfa_token_id,
          code: verificationCode,
          user_id: userData.user_id,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Invalid verification code');
      }

      setSuccess('TOTP MFA enabled successfully!');
      setShowSetupModal(false);
      setTotpSecret(null);
      setQrCodeUrl(null);
      setVerificationCode('');
      fetchMFAStatus();
    } catch (err) {
      console.error('Error verifying TOTP:', err);
      setError(err.message || 'Failed to verify TOTP code');
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Disable MFA (requires password verification)
   */
  const handleDisableMFA = async () => {
    try {
      setProcessing(true);
      setError('');
      setSuccess('');

      if (!disablePassword) {
        setError('Password is required to disable MFA');
        setProcessing(false);
        return;
      }

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const userData = JSON.parse(userStr);

      const response = await fetch(`${API_BASE_URL}/mfa/disable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userData.user_id,
          password: disablePassword,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to disable MFA');
      }

      setSuccess('MFA disabled successfully');
      setShowDisableModal(false);
      setDisablePassword('');
      fetchMFAStatus();
    } catch (err) {
      console.error('Error disabling MFA:', err);
      setError(err.message || 'Failed to disable MFA');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Secret copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #D84040',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading MFA settings...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 10px 0', color: '#1f2937', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={28} color="#D84040" />
          Multi-Factor Authentication (MFA)
        </h2>
        <p style={{ color: '#6b7280', margin: 0 }}>
          Add an extra layer of security to your account by enabling two-factor authentication
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          borderRadius: '8px',
          color: '#dc2626',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div style={{
          padding: '12px 16px',
          background: '#d1fae5',
          border: '1px solid #86efac',
          borderRadius: '8px',
          color: '#059669',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      {/* MFA Status Card */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#1f2937', fontSize: '18px' }}>
              Current Status
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mfaStatus?.mfa_enabled ? (
                <>
                  <CheckCircle size={20} color="#059669" />
                  <span style={{ color: '#059669', fontWeight: 600 }}>MFA Enabled</span>
                  {mfaStatus.method && (
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>
                      ({mfaStatus.method.toUpperCase()})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle size={20} color="#dc2626" />
                  <span style={{ color: '#dc2626', fontWeight: 600 }}>MFA Disabled</span>
                </>
              )}
            </div>
            {mfaStatus?.mfa_enabled && (
              <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                Your account is protected with two-factor authentication. You'll need to enter a verification code when logging in.
              </p>
            )}
          </div>
          <div>
            {mfaStatus?.mfa_enabled ? (
              <button
                onClick={() => setShowDisableModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Disable MFA
              </button>
            ) : (
              <button
                onClick={() => setShowSetupModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Enable MFA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* MFA Methods Info */}
      <div style={{
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h3 style={{ margin: '0 0 16px 0', color: '#1f2937', fontSize: '18px' }}>
          Available Methods
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Smartphone size={24} color="#D84040" style={{ marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>SMS</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Receive a verification code via text message
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Mail size={24} color="#D84040" style={{ marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>Email</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Receive a verification code via email
            </p>
          </div>
          <div style={{ padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <Key size={24} color="#D84040" style={{ marginBottom: '8px' }} />
            <h4 style={{ margin: '0 0 4px 0', color: '#1f2937' }}>TOTP (Authenticator App)</h4>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
              Use an authenticator app like Google Authenticator
            </p>
          </div>
        </div>
      </div>

      {/* Setup Modal */}
      {showSetupModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>
              Enable Multi-Factor Authentication
            </h3>

            {!totpSecret ? (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 600 }}>
                    Select Method
                  </label>
                  <select
                    value={setupMethod}
                    onChange={(e) => setSetupMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                    <option value="totp">TOTP (Authenticator App)</option>
                  </select>
                </div>

                {setupMethod === 'sms' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 600 }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+63-912-345-6789"
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                )}

                {setupMethod === 'email' && (
                  <div style={{
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}>
                    Verification codes will be sent to: <strong>{user?.email}</strong>
                  </div>
                )}

                {setupMethod === 'totp' && (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '14px',
                    color: '#92400e',
                  }}>
                    <strong>Note:</strong> You'll need an authenticator app (Google Authenticator, Authy, etc.) to scan the QR code.
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowSetupModal(false);
                      setError('');
                      setSuccess('');
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSetupMFA}
                    disabled={processing || (setupMethod === 'sms' && !phoneNumber)}
                    style={{
                      padding: '10px 20px',
                      background: processing ? '#9ca3af' : '#D84040',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {processing ? 'Setting up...' : 'Continue'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 16px 0', color: '#374151' }}>
                    Scan this QR code with your authenticator app:
                  </p>
                  {qrCodeUrl && (
                    <div style={{ marginBottom: '16px' }}>
                      <img src={qrCodeUrl} alt="TOTP QR Code" style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                    </div>
                  )}
                  <div style={{
                    padding: '12px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}>
                    <span style={{ flex: 1 }}>{totpSecret}</span>
                    <button
                      onClick={() => copyToClipboard(totpSecret)}
                      style={{
                        padding: '4px 8px',
                        background: '#D84040',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Copy size={14} />
                    </button>
                  </div>
                  <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
                    Or enter this secret manually: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{totpSecret}</code>
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 600 }}>
                    Enter verification code from your app
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength="6"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '18px',
                      textAlign: 'center',
                      letterSpacing: '8px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setTotpSecret(null);
                      setQrCodeUrl(null);
                      setVerificationCode('');
                      setError('');
                    }}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyTOTP}
                    disabled={processing || verificationCode.length !== 6}
                    style={{
                      padding: '10px 20px',
                      background: processing ? '#9ca3af' : '#D84040',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: processing ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {processing ? 'Verifying...' : 'Verify & Enable'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Disable Modal */}
      {showDisableModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            width: '90%',
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1f2937', fontSize: '20px' }}>
              Disable Multi-Factor Authentication
            </h3>
            <p style={{ margin: '0 0 20px 0', color: '#6b7280', fontSize: '14px' }}>
              For security reasons, please enter your password to disable MFA.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: 600 }}>
                Password
              </label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisablePassword('');
                  setError('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDisableMFA}
                disabled={processing || !disablePassword}
                style={{
                  padding: '10px 20px',
                  background: processing ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: processing ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {processing ? 'Disabling...' : 'Disable MFA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MFAManagement;

