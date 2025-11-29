import React, { useState } from 'react';
import { Home, BookOpen, Smartphone } from 'lucide-react';
import '../css/main.css';
import '../css/components.css';
import logowoname from '../assets/logowoname.png';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    role: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // MFA State
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaTokenId, setMfaTokenId] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaMethod, setMfaMethod] = useState('sms'); // 'sms', 'email', or 'totp'
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMfaCodeChange = (e) => {
    setMfaCode(e.target.value);
    setMfaError('');
  };

  /**
   * MFA FLOW EXPLANATION:
   * 
   * Step 1: User submits username/password → Login API checks if MFA is enabled
   * Step 2: If MFA enabled, API returns requires_mfa: true with user_id
   * Step 3: Frontend calls /api/mfa/generate to get MFA code (SMS/Email/TOTP)
   * Step 4: User enters MFA code → Frontend calls /api/mfa/verify
   * Step 5: If verified, Frontend calls /api/auth/complete-login to get JWT token
   * Step 6: Token is saved and user is redirected to dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Check if MFA is required
      if (data.requires_mfa) {
        setRequiresMFA(true);
        setMfaUserId(data.user_id);
        setLoading(false);
        
        // Automatically generate MFA code
        await generateMFACode(data.user_id);
        return;
      }

      // No MFA - proceed with normal login
      localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  /**
   * Generate MFA Code
   * Calls /api/mfa/generate to send SMS/Email or generate TOTP code
   */
  const generateMFACode = async (userId) => {
    try {
      setMfaLoading(true);
      setMfaError('');
      
      const res = await fetch('http://localhost:5000/api/mfa/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          method: mfaMethod
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to generate MFA code');
      }

      setMfaTokenId(data.data.mfa_token_id);
      setMfaMethod(data.data.method);
      
      // In development, show the code (remove in production)
      if (data.data.code) {
        console.log('MFA Code (DEV ONLY):', data.data.code);
        alert(`MFA Code (DEV ONLY): ${data.data.code}\n\nIn production, this would be sent via ${data.data.method.toUpperCase()}`);
      }
    } catch (err) {
      setMfaError(err.message);
    } finally {
      setMfaLoading(false);
    }
  };

  /**
   * Verify MFA Code and Complete Login
   * Step 1: Verify MFA code with /api/mfa/verify
   * Step 2: If verified, call /api/auth/complete-login to get JWT token
   */
  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setMfaError('');
    setMfaLoading(true);

    try {
      // Step 1: Verify MFA code
      const verifyRes = await fetch('http://localhost:5000/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mfa_token_id: mfaTokenId,
          code: mfaCode,
          user_id: mfaUserId
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.message || 'Invalid MFA code');
      }

      // Step 2: Complete login to get JWT token
      const completeRes = await fetch('http://localhost:5000/api/auth/complete-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: mfaUserId,
          mfa_token_id: mfaTokenId
        })
      });

      const completeData = await completeRes.json();
      if (!completeRes.ok || !completeData.success) {
        throw new Error(completeData.message || 'Login completion failed');
      }

      // Save token and redirect
      localStorage.setItem('token', completeData.token);
      if (completeData.user) {
        localStorage.setItem('user', JSON.stringify(completeData.user));
      }
      window.location.href = '/dashboard';
    } catch (err) {
      setMfaError(err.message);
      setMfaLoading(false);
    }
  };

  return (
    <div className="login-page" style={{ background: 'linear-gradient(to bottom, #B82132, #D2665A, #F2B28C, #F6DED8)' }}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-header" style={{ background: 'linear-gradient(to bottom, #FFFFFF, #FFF5F5, #FFEBEB, #F6DED8)', color: '#1f2937' }}>
            <div className="logo">
              <img src={logowoname} alt="My Hub Cares Logo" style={{ width: '80px', height: '80px', objectFit: 'contain' }} />
            </div>
            <h1>My Hub Cares</h1>
            <p>
              "It's my hub, and it's yours" - Welcome Home!{' '}
              <Home size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </p>
          </div>

          {!requiresMFA ? (
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}

              <div className="form-group">
                <label htmlFor="role">Login As</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="case_manager">Case Manager</option>
                  <option value="nurse">Nurse</option>
                  <option value="physician">Physician</option>
                  <option value="lab_personnel">Lab Personnel</option>
                  <option value="patient">Patient</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter password"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaVerify} className="login-form">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <Smartphone size={48} style={{ color: '#B82132', marginBottom: '10px' }} />
                <h3>Multi-Factor Authentication</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  Enter the verification code sent to your {mfaMethod === 'sms' ? 'phone' : mfaMethod === 'email' ? 'email' : 'authenticator app'}
                </p>
              </div>

              {mfaError && <div className="error-message">{mfaError}</div>}

              <div className="form-group">
                <label htmlFor="mfaCode">Verification Code</label>
                <input
                  type="text"
                  id="mfaCode"
                  name="mfaCode"
                  value={mfaCode}
                  onChange={handleMfaCodeChange}
                  required
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '8px' }}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block" disabled={mfaLoading || !mfaCode}>
                {mfaLoading ? 'Verifying...' : 'Verify & Login'}
              </button>

              <button 
                type="button" 
                className="btn btn-outline btn-block" 
                onClick={() => {
                  setRequiresMFA(false);
                  setMfaCode('');
                  setMfaError('');
                  setMfaTokenId(null);
                }}
                style={{ marginTop: '10px' }}
              >
                Back to Login
              </button>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <button 
                  type="button" 
                  onClick={() => generateMFACode(mfaUserId)}
                  disabled={mfaLoading}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#B82132', 
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px'
                  }}
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-3" style={{ padding: '0 30px 30px' }}>
            <p className="text-muted">New to My Hub Cares?</p>
            <a href="/register" className="btn btn-outline btn-block">
              Create Patient Account
            </a>
            <p className="text-muted mt-2" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              Join our family and experience care that feels like home <Home size={14} />
            </p>

           
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;