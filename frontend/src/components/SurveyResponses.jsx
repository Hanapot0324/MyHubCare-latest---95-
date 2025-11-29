import React, { useState, useEffect } from 'react';
import { List, Eye, Filter, X, Star, Calendar, User, Building } from 'lucide-react';
import { API_BASE_URL } from '../config/api.js';

const SurveyResponses = ({ socket }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [facilities, setFacilities] = useState([]);
  const [patients, setPatients] = useState([]);
  const [filters, setFilters] = useState({
    patient_id: '',
    facility_id: '',
    start_date: '',
    end_date: '',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
  });

  useEffect(() => {
    fetchFacilities();
    fetchResponses();
  }, [filters, pagination.offset]);

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

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = new URL(`${API_BASE_URL}/survey-responses`);

      if (filters.patient_id) {
        url.searchParams.append('patient_id', filters.patient_id);
      }
      if (filters.facility_id) {
        url.searchParams.append('facility_id', filters.facility_id);
      }
      if (filters.start_date) {
        url.searchParams.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        url.searchParams.append('end_date', filters.end_date);
      }
      url.searchParams.append('limit', pagination.limit.toString());
      url.searchParams.append('offset', pagination.offset.toString());

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setResponses(data.data || []);
          if (data.pagination) {
            setPagination((prev) => ({
              ...prev,
              total: data.pagination.total,
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching survey responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchResponseDetail = async (surveyId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/survey-responses/${surveyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedResponse(data.data);
          setShowDetailModal(true);
        }
      }
    } catch (error) {
      console.error('Error fetching survey detail:', error);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const applyFilters = () => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchResponses();
  };

  const clearFilters = () => {
    setFilters({
      patient_id: '',
      facility_id: '',
      start_date: '',
      end_date: '',
    });
    setPagination((prev) => ({ ...prev, offset: 0 }));
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
        <span style={{ marginLeft: '6px', fontSize: '12px', color: '#666' }}>
          {rating}/5
        </span>
      </div>
    );
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <List size={28} color="#D84040" />
          <h2 style={{ margin: 0, color: '#333', fontSize: '28px' }}>Survey Responses</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
          View and manage all patient satisfaction survey responses
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Filter size={20} color="#666" />
          <h3 style={{ margin: 0, fontSize: '18px' }}>Filters</h3>
        </div>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Facility
            </label>
            <select
              value={filters.facility_id}
              onChange={(e) => handleFilterChange('facility_id', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            >
              <option value="">All Facilities</option>
              {facilities.map((facility) => (
                <option key={facility.facility_id} value={facility.facility_id}>
                  {facility.facility_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500' }}>
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={applyFilters}
              style={{
                background: '#D84040',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Responses Table */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>All Survey Responses</h3>
          <span style={{ color: '#666', fontSize: '14px' }}>
            Total: {pagination.total} responses
          </span>
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Loading responses...</p>
        ) : responses.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            No survey responses found. Try adjusting your filters.
          </p>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                      Patient
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                      Facility
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Satisfaction
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Staff
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Wait Time
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Cleanliness
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Recommend
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Avg Score
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600' }}>
                      Submitted
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '600' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((response) => (
                    <tr
                      key={response.survey_id}
                      style={{
                        borderBottom: '1px solid #dee2e6',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <User size={16} color="#666" />
                          <div>
                            <div style={{ fontWeight: '500' }}>
                              {response.first_name} {response.last_name}
                            </div>
                            {response.uic && (
                              <div style={{ fontSize: '12px', color: '#999' }}>{response.uic}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px' }}>
                        {response.facility_name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '20px' }}>
                            {getSatisfactionEmoji(response.overall_satisfaction)}
                          </span>
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {getSatisfactionLabel(response.overall_satisfaction)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{renderStars(response.staff_friendliness)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{renderStars(response.wait_time)}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{renderStars(response.facility_cleanliness)}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', textTransform: 'capitalize' }}>
                        {response.would_recommend}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>
                        {response.average_score ? parseFloat(response.average_score).toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                        {new Date(response.submitted_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <button
                          onClick={() => fetchResponseDetail(response.survey_id)}
                          style={{
                            background: '#D84040',
                            color: 'white',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                  disabled={pagination.offset === 0}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: pagination.offset === 0 ? '#f5f5f5' : 'white',
                    cursor: pagination.offset === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Previous
                </button>
                <span style={{ fontSize: '14px', color: '#666' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))}
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    background: pagination.offset + pagination.limit >= pagination.total ? '#f5f5f5' : 'white',
                    cursor: pagination.offset + pagination.limit >= pagination.total ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedResponse && (
        <div
          style={{
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
            padding: '20px',
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Survey Response Details</h3>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={24} color="#666" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Patient Information</h4>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Name:</strong> {selectedResponse.first_name} {selectedResponse.last_name}
                  </div>
                  {selectedResponse.uic && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>UIC:</strong> {selectedResponse.uic}
                    </div>
                  )}
                  {selectedResponse.facility_name && (
                    <div>
                      <strong>Facility:</strong> {selectedResponse.facility_name}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Overall Satisfaction</h4>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '48px' }}>{getSatisfactionEmoji(selectedResponse.overall_satisfaction)}</span>
                  <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '8px' }}>
                    {getSatisfactionLabel(selectedResponse.overall_satisfaction)}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Ratings</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <span>Staff Friendliness:</span>
                    {renderStars(selectedResponse.staff_friendliness)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <span>Wait Time:</span>
                    {renderStars(selectedResponse.wait_time)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <span>Facility Cleanliness:</span>
                    {renderStars(selectedResponse.facility_cleanliness)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '6px' }}>
                    <span>Average Score:</span>
                    <strong style={{ fontSize: '16px' }}>
                      {selectedResponse.average_score ? parseFloat(selectedResponse.average_score).toFixed(2) : 'N/A'} / 5.00
                    </strong>
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Would Recommend</h4>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', textTransform: 'capitalize', fontSize: '16px' }}>
                  {selectedResponse.would_recommend}
                </div>
              </div>

              {selectedResponse.comments && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Comments</h4>
                  <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                    {selectedResponse.comments}
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', fontWeight: '500' }}>Submitted</h4>
                <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
                  {new Date(selectedResponse.submitted_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyResponses;

