import React, { useState } from 'react';
import '../css/main.css';
import '../css/components.css';
const LoginPage = () => {
  const [formData, setFormData] = useState({
    role: '',
    username: '',
    password: ''
  });
  
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Mock authentication logic
    const validCredentials = {
      admin: { username: 'admin', password: 'admin123' },
      physician: { username: 'physician', password: 'doc123' },
      nurse: { username: 'nurse', password: 'nurse123' },
      case_manager: { username: 'case_manager', password: 'case123' },
      lab_personnel: { username: 'lab_personnel', password: 'lab123' },
      patient: { username: 'patient', password: 'pat123' }
    };
    
    const roleCredentials = validCredentials[formData.role];
    
    if (roleCredentials && 
        roleCredentials.username === formData.username && 
        roleCredentials.password === formData.password) {
      // Successful login - redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      setError('Invalid credentials. Please check demo credentials.');
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="10" fill="#2563eb"/>
                <path d="M30 15L20 25H26V35H22V45H30V35H34V45H42V35H38V25H44L30 15Z" fill="white"/>
              </svg>
            </div>
            <h1>My Hub Cares</h1>
            <p>"It's my hub, and it's yours" - Welcome Home! 🏠</p>
          </div>
          
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
            
            <button type="submit" className="btn btn-primary btn-block">Login</button>
            
            <div className="login-help">
              <p><strong>Demo Credentials:</strong></p>
              <ul>
                <li><strong>Admin:</strong> admin / admin123</li>
                <li><strong>Physician:</strong> physician / doc123</li>
                <li><strong>Nurse:</strong> nurse / nurse123</li>
                <li><strong>Case Manager:</strong> case_manager / case123</li>
                <li><strong>Lab Personnel:</strong> lab_personnel / lab123</li>
                <li><strong>Patient:</strong> patient / pat123</li>
              </ul>
              <p style={{ marginTop: '15px', fontSize: '12px' }}>
                📖 See <strong>USER_GUIDE.md</strong> for complete instructions
              </p>
            </div>
          </form>

          <div className="text-center mt-3" style={{ padding: '0 30px 30px' }}>
            <p className="text-muted">New to My Hub Cares?</p>
                <a href="/register" className="btn btn-outline btn-block">              Create Patient Account
            </a>
            <p className="text-muted mt-2" style={{ fontSize: '12px' }}>
              Join our family and experience care that feels like home 🏠
            </p>
            <div className="mt-2" style={{ paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
              <p className="text-muted" style={{ fontSize: '13px' }}>Patient on mobile?</p>
<a 
  href="myhubcares://login" 
  className="btn btn-primary btn-block"
  style={{ marginTop: '8px', fontSize: '14px' }}
>
  📱 Open Mobile App
</a>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;