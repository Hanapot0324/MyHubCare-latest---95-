import React, { useState, useEffect } from 'react';
import { MessageSquare, Star, Send, CheckCircle, History, Calendar } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

const PatientSurvey = ({ socket }) => {
  const [formData, setFormData] = useState({
    patient_id: '',
    facility_id: '',
    overall_satisfaction: '',
    staff_friendliness: 0,
    wait_time: 0,
    facility_cleanliness: 0,
    would_recommend: '',
    comments: '',
  });
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isPatientRole, setIsPatientRole] = useState(false);
  const [surveyHistory, setSurveyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'history'

  useEffect(() => {
    fetchFacilities();
    fetchCurrentUserPatientId();
  }, []);

  useEffect(() => {
    if (formData.patient_id && activeTab === 'history') {
      fetchSurveyHistory();
    }
  }, [formData.patient_id, activeTab]);

  const fetchCurrentUserPatientId = async () => {
    try {
      setIsPatientRole(true); // This component is only accessible to patients
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found');
        return;
      }
      
      // Try to get patient_id from /api/auth/me endpoint
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const user = data.user;
          // Try to get patient_id from nested patient object or direct property
          const patientId = user.patient?.patient_id || user.patient_id || null;
          
          if (patientId) {
            setFormData((prev) => ({
              ...prev,
              patient_id: patientId.toString(),
            }));
            return;
          }
        }
      }
      
      // If not found, try to fetch from profile endpoint
      try {
        const profileResponse = await fetch(`${API_BASE_URL}/profile/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success && profileData.patient) {
            setFormData((prev) => ({
              ...prev,
              patient_id: profileData.patient.patient_id.toString(),
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching patient profile:', err);
      }
    } catch (error) {
      console.error('Error fetching current user patient ID:', error);
    }
  };

  const fetchFacilities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/facilities?is_active=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFacilities(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStarClick = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.patient_id || !formData.overall_satisfaction || !formData.would_recommend) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.staff_friendliness === 0 || formData.wait_time === 0 || formData.facility_cleanliness === 0) {
      setError('Please rate all categories (Staff Friendliness, Wait Time, Facility Cleanliness)');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/survey-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
        // Preserve patient_id if user is a patient
        const resetPatientId = isPatientRole ? formData.patient_id : '';
        setFormData({
          patient_id: resetPatientId,
          facility_id: '',
          overall_satisfaction: '',
          staff_friendliness: 0,
          wait_time: 0,
          facility_cleanliness: 0,
          would_recommend: '',
          comments: '',
        });
        setTimeout(() => setSubmitted(false), 5000);
        // Refresh history if on history tab
        if (activeTab === 'history' && formData.patient_id) {
          fetchSurveyHistory();
        }
      } else {
        setError(data.message || 'Failed to submit survey');
      }
    } catch (error) {
      console.error('Error submitting survey:', error);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const satisfactionOptions = [
    { value: 'very_happy', label: '😊 Very Happy', emoji: '😊' },
    { value: 'happy', label: '🙂 Happy', emoji: '🙂' },
    { value: 'neutral', label: '😐 Neutral', emoji: '😐' },
    { value: 'unhappy', label: '😞 Unhappy', emoji: '😞' },
    { value: 'very_unhappy', label: '😢 Very Unhappy', emoji: '😢' },
  ];

  const fetchSurveyHistory = async () => {
    if (!formData.patient_id) return;
    
    try {
      setLoadingHistory(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/survey-responses/patient/${formData.patient_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSurveyHistory(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error fetching survey history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getSatisfactionEmoji = (satisfaction) => {
    const emojiMap = {
      very_happy: '😊',
      happy: '🙂',
      neutral: '😐',
      unhappy: '😞',
      very_unhappy: '😢',
    };
    return emojiMap[satisfaction] || '😐';
  };

  const getSatisfactionLabel = (satisfaction) => {
    const labelMap = {
      very_happy: 'Very Happy',
      happy: 'Happy',
      neutral: 'Neutral',
      unhappy: 'Unhappy',
      very_unhappy: 'Very Unhappy',
    };
    return labelMap[satisfaction] || satisfaction;
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            fill={star <= rating ? '#FFD700' : '#ddd'}
            color={star <= rating ? '#FFD700' : '#ddd'}
          />
        ))}
      </div>
    );
  };

  const StarRating = ({ value, onChange, label }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
        {label} <span style={{ color: '#D84040' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <Star
              size={28}
              fill={star <= value ? '#FFD700' : 'none'}
              color={star <= value ? '#FFD700' : '#ddd'}
            />
          </button>
        ))}
        {value > 0 && (
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '14px' }}>
            {value} {value === 1 ? 'star' : 'stars'}
          </span>
        )}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div style={{ padding: '20px', paddingTop: '100px', textAlign: 'center' }}>
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '40px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '500px',
            margin: '0 auto',
          }}
        >
          <CheckCircle size={64} color="#28a745" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#28a745', marginBottom: '10px' }}>Thank You!</h2>
          <p style={{ color: '#666', fontSize: '16px' }}>
            Your feedback has been submitted successfully. We appreciate your time!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: 'white',
        minHeight: '100vh',
        paddingTop: '100px',
      }}
    >
      {/* Header with Title - matching Patient.jsx style */}
      <div style={{ 
        marginBottom: '30px', 
        background: 'linear-gradient(to right, #D84040, #A31D1D)', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 15px rgba(216, 64, 64, 0.2)' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: '0 0 5px 0', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
              Patient Satisfaction Survey
            </h2>
            <p style={{ margin: 0, color: '#F8F2DE', fontSize: '16px' }}>
              Help us improve by sharing your experience
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MessageSquare size={32} color="#F8F2DE" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setActiveTab('submit')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            background: activeTab === 'submit' ? '#D84040' : '#f0f0f0',
            color: activeTab === 'submit' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={18} />
          Submit Survey
        </button>
        <button
          onClick={() => setActiveTab('history')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            background: activeTab === 'history' ? '#D84040' : '#f0f0f0',
            color: activeTab === 'history' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <History size={18} />
          My Survey History
        </button>
      </div>

      {activeTab === 'submit' ? (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
        {error && (
          <div
            style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            Facility
          </label>
          <select
            name="facility_id"
            value={formData.facility_id}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          >
            <option value="">Select Facility (Optional)</option>
            {facilities.map((facility) => (
              <option key={facility.facility_id} value={facility.facility_id}>
                {facility.facility_name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            Overall Satisfaction <span style={{ color: '#D84040' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {satisfactionOptions.map((option) => (
              <label
                key={option.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: `2px solid ${formData.overall_satisfaction === option.value ? '#D84040' : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: formData.overall_satisfaction === option.value ? '#fff5f5' : 'white',
                }}
              >
                <input
                  type="radio"
                  name="overall_satisfaction"
                  value={option.value}
                  checked={formData.overall_satisfaction === option.value}
                  onChange={handleChange}
                  required
                  style={{ margin: 0 }}
                />
                <span style={{ fontSize: '24px' }}>{option.emoji}</span>
                <span>{option.label.replace(/^[^\s]+\s/, '')}</span>
              </label>
            ))}
          </div>
        </div>

        <StarRating
          value={formData.staff_friendliness}
          onChange={(value) => handleStarClick('staff_friendliness', value)}
          label="Staff Friendliness"
        />

        <StarRating
          value={formData.wait_time}
          onChange={(value) => handleStarClick('wait_time', value)}
          label="Wait Time"
        />

        <StarRating
          value={formData.facility_cleanliness}
          onChange={(value) => handleStarClick('facility_cleanliness', value)}
          label="Facility Cleanliness"
        />

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            Would you recommend us? <span style={{ color: '#D84040' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['yes', 'maybe', 'no'].map((option) => (
              <label
                key={option}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: `2px solid ${formData.would_recommend === option ? '#D84040' : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: formData.would_recommend === option ? '#fff5f5' : 'white',
                  textTransform: 'capitalize',
                }}
              >
                <input
                  type="radio"
                  name="would_recommend"
                  value={option}
                  checked={formData.would_recommend === option}
                  onChange={handleChange}
                  required
                  style={{ margin: 0 }}
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#333' }}>
            Additional Comments (Optional)
          </label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            rows={4}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
            placeholder="Share any additional feedback..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            background: loading ? '#ccc' : '#D84040',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Send size={18} />
          {loading ? 'Submitting...' : 'Submit Survey'}
        </button>
      </form>
      ) : (
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '1000px',
            margin: '0 auto',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', color: '#333' }}>
            My Survey History
          </h3>

          {loadingHistory ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading survey history...</p>
          ) : surveyHistory.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              You haven't submitted any surveys yet. Submit your first survey to see it here!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {surveyHistory.map((survey) => (
                <div
                  key={survey.survey_id}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '20px',
                    background: '#f8f9fa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Calendar size={16} color="#666" />
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {new Date(survey.submitted_at).toLocaleString()}
                        </span>
                      </div>
                      {survey.facility_name && (
                        <div style={{ fontSize: '14px', color: '#666' }}>
                          Facility: {survey.facility_name}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '32px', marginBottom: '4px' }}>
                        {getSatisfactionEmoji(survey.overall_satisfaction)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {getSatisfactionLabel(survey.overall_satisfaction)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Staff Friendliness</div>
                      {renderStars(survey.staff_friendliness)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Wait Time</div>
                      {renderStars(survey.wait_time)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Cleanliness</div>
                      {renderStars(survey.facility_cleanliness)}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Average Score</div>
                      <div style={{ fontSize: '16px', fontWeight: '500' }}>
                        {survey.average_score ? parseFloat(survey.average_score).toFixed(2) : 'N/A'} / 5.00
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#666' }}>Would Recommend: </span>
                      <span style={{ fontSize: '14px', textTransform: 'capitalize', fontWeight: '500' }}>
                        {survey.would_recommend}
                      </span>
                    </div>
                  </div>

                  {survey.comments && (
                    <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px' }}>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Comments:</div>
                      <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{survey.comments}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientSurvey;
