import React, { useState, useEffect } from 'react';

const HTSSessions = () => {
  // Initial dummy data matching the images
  const [sessions, setSessions] = useState([
    {
      id: 1,
      patientName: 'John Doe',
      sessionDate: '5/15/2024',
      sessionType: 'Facility-based',
      preTest: true,
      postTest: true,
      result: 'Positive',
      details: {
        branch: 'My Hub Cares Ortigas Main',
        counselor: 'Anna Reyes',
        referral: 'ART Clinic',
        remarks: 'Patient well-informed and prepared for results',
      },
    },
    {
      id: 2,
      patientName: 'Maria Santos',
      sessionDate: '11/20/2023',
      sessionType: 'Community-based',
      preTest: true,
      postTest: true,
      result: 'Positive',
      details: {
        branch: 'My Hub Cares Ortigas Main',
        counselor: 'Anna Reyes',
        referral: 'Treatment Hub',
        remarks: 'Referred to nearest treatment facility',
      },
    },
  ]);

  const [filteredSessions, setFilteredSessions] = useState(sessions);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultFilter, setResultFilter] = useState('All Results');
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newSession, setNewSession] = useState({
    patient: '',
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'Facility-based',
    preTestCounseling: true,
    consentGiven: true,
    testResult: '',
    postTestCounseling: false,
    linkageReferred: false,
    referralDestination: '',
    remarks: '',
  });

  // Filter sessions based on search and result filter
  useEffect(() => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter((session) =>
        session.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (resultFilter !== 'All Results') {
      filtered = filtered.filter((session) => session.result === resultFilter);
    }

    setFilteredSessions(filtered);
  }, [searchTerm, resultFilter, sessions]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewSession((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newId = Math.max(...sessions.map((s) => s.id), 0) + 1;
    const sessionToAdd = {
      id: newId,
      patientName: newSession.patient,
      sessionDate: new Date(newSession.sessionDate).toLocaleDateString(
        'en-US',
        {
          month: 'numeric',
          day: 'numeric',
          year: 'numeric',
        }
      ),
      sessionType: newSession.sessionType,
      preTest: newSession.preTestCounseling,
      postTest: newSession.postTestCounseling,
      result: newSession.testResult,
      details: {
        branch: 'My Hub Cares Ortigas Main',
        counselor: 'Admin User',
        referral: newSession.referralDestination,
        remarks: newSession.remarks,
      },
    };

    setSessions([...sessions, sessionToAdd]);
    setNewSession({
      patient: '',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionType: 'Facility-based',
      preTestCounseling: true,
      consentGiven: true,
      testResult: '',
      postTestCounseling: false,
      linkageReferred: false,
      referralDestination: '',
      remarks: '',
    });
    setShowModal(false);
  };

  const handleCancel = () => {
    setNewSession({
      patient: '',
      sessionDate: new Date().toISOString().split('T')[0],
      sessionType: 'Facility-based',
      preTestCounseling: true,
      consentGiven: true,
      testResult: '',
      postTestCounseling: false,
      linkageReferred: false,
      referralDestination: '',
      remarks: '',
    });
    setShowModal(false);
  };

  const viewSessionDetails = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  // Styles
  const styles = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    headerTitle: {
      margin: 0,
      color: '#333',
      fontSize: '24px',
      fontWeight: 'bold',
      marginTop: '70px',
    },
    headerSubtitle: {
      margin: '5px 0 0 0',
      color: '#666',
      fontSize: '14px',
    },
    recordButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
    },
    cardHeader: {
      padding: '15px 20px',
    },
    searchFilterContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    searchInput: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
    },
    filterSelect: {
      width: '100%',
      maxWidth: '200px',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    cardBody: {
      padding: '0',
    },
    sessionCard: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '15px 20px',
      borderBottom: '1px solid #eee',
    },
    sessionInfo: {
      flex: 1,
    },
    patientName: {
      margin: '0 0 10px 0',
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#333',
    },
    patientMeta: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '15px',
      fontSize: '14px',
      color: '#666',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
    },
    sessionActions: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    badge: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
    },
    badgePositive: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
    },
    badgeNegative: {
      backgroundColor: '#d4edda',
      color: '#155724',
    },
    viewButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '6px 12px',
      borderRadius: '4px',
      fontSize: '12px',
      cursor: 'pointer',
    },
    modalOverlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: 'white',
      borderRadius: '8px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    modalHeader: {
      padding: '15px 20px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 'bold',
    },
    modalClose: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
    },
    modalBody: {
      padding: '20px',
    },
    formGroup: {
      marginBottom: '15px',
    },
    formRow: {
      display: 'flex',
      gap: '15px',
      marginBottom: '15px',
    },
    formGroupHalf: {
      flex: 1,
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontSize: '14px',
      fontWeight: 'bold',
    },
    input: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
    },
    select: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      backgroundColor: 'white',
    },
    checkboxGroup: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px',
    },
    checkbox: {
      marginRight: '8px',
    },
    textarea: {
      width: '100%',
      padding: '8px 12px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '14px',
      minHeight: '80px',
      resize: 'vertical',
    },
    modalFooter: {
      padding: '15px 20px',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '10px',
    },
    cancelButton: {
      padding: '8px 16px',
      border: '1px solid #ddd',
      backgroundColor: 'white',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    saveButton: {
      padding: '8px 16px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '4px',
      fontSize: '14px',
      cursor: 'pointer',
    },
    detailsGroup: {
      marginBottom: '15px',
    },
    detailsLabel: {
      fontWeight: 'bold',
      fontSize: '14px',
      marginBottom: '5px',
    },
    detailsValue: {
      fontSize: '14px',
      marginBottom: '15px',
      padding: '8px 12px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
    },
  };

  return (
    <div style={styles.pageContainer}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>HIV Testing Services (HTS)</h1>
          <p style={styles.headerSubtitle}>
            HIV testing sessions and counseling
          </p>
        </div>
        <button style={styles.recordButton} onClick={() => setShowModal(true)}>
          Record HTS Session
        </button>
      </div>

      {/* Sessions Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.searchFilterContainer}>
            <input
              type="text"
              placeholder="Search sessions..."
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              style={styles.filterSelect}
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
            >
              <option value="All Results">All Results</option>
              <option value="Positive">Positive</option>
              <option value="Reactive">Reactive</option>
              <option value="Non-reactive">Non-reactive</option>
            </select>
          </div>
        </div>
        <div style={styles.cardBody}>
          {filteredSessions.length > 0 ? (
            filteredSessions.map((session) => (
              <div key={session.id} style={styles.sessionCard}>
                <div style={styles.sessionInfo}>
                  <h3 style={styles.patientName}>{session.patientName}</h3>
                  <div style={styles.patientMeta}>
                    <div style={styles.metaItem}>📅 {session.sessionDate}</div>
                    <div style={styles.metaItem}>🏥 {session.sessionType}</div>
                    <div style={styles.metaItem}>
                      ✓ Pre-test: {session.preTest ? 'Yes' : 'No'}
                    </div>
                    <div style={styles.metaItem}>
                      ✓ Post-test: {session.postTest ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
                <div style={styles.sessionActions}>
                  <span
                    style={{
                      ...styles.badge,
                      ...(session.result === 'POSITIVE'
                        ? styles.badgePositive
                        : styles.badgeNegative),
                    }}
                  >
                    {session.result}
                  </span>
                  <button
                    style={styles.viewButton}
                    onClick={() => viewSessionDetails(session.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{ padding: '20px', textAlign: 'center', color: '#666' }}
            >
              No HTS sessions found
            </div>
          )}
        </div>
      </div>

      {/* Add Session Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Record HTS Session</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="patient">
                    Patient
                  </label>
                  <select
                    id="patient"
                    name="patient"
                    value={newSession.patient}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Patient</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Maria Santos">Maria Santos</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.formRow}>
                  <div style={styles.formGroupHalf}>
                    <label style={styles.label} htmlFor="sessionDate">
                      Session Date
                    </label>
                    <input
                      type="date"
                      id="sessionDate"
                      name="sessionDate"
                      value={newSession.sessionDate}
                      onChange={handleInputChange}
                      style={styles.input}
                      required
                    />
                  </div>
                  <div style={styles.formGroupHalf}>
                    <label style={styles.label} htmlFor="sessionType">
                      Session Type
                    </label>
                    <select
                      id="sessionType"
                      name="sessionType"
                      value={newSession.sessionType}
                      onChange={handleInputChange}
                      style={styles.select}
                      required
                    >
                      <option value="Facility-based">Facility-based</option>
                      <option value="Community-based">Community-based</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Home">Home</option>
                    </select>
                  </div>
                </div>

                <h4>Pre-Test Counseling</h4>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="preTestCounseling"
                    name="preTestCounseling"
                    checked={newSession.preTestCounseling}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <label htmlFor="preTestCounseling">
                    Pre-test counseling provided
                  </label>
                </div>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="consentGiven"
                    name="consentGiven"
                    checked={newSession.consentGiven}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <label htmlFor="consentGiven">
                    Informed consent obtained
                  </label>
                </div>

                <h4>Test Results</h4>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="testResult">
                    Test Result
                  </label>
                  <select
                    id="testResult"
                    name="testResult"
                    value={newSession.testResult}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Result</option>
                    <option value="Non-reactive">Non-reactive</option>
                    <option value="Reactive">Reactive</option>
                    <option value="Positive">Positive</option>
                    <option value="Indeterminate">Indeterminate</option>
                  </select>
                </div>

                <h4>Post-Test</h4>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="postTestCounseling"
                    name="postTestCounseling"
                    checked={newSession.postTestCounseling}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <label htmlFor="postTestCounseling">
                    Post-test counseling provided
                  </label>
                </div>
                <div style={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    id="linkageReferred"
                    name="linkageReferred"
                    checked={newSession.linkageReferred}
                    onChange={handleInputChange}
                    style={styles.checkbox}
                  />
                  <label htmlFor="linkageReferred">
                    Referred for linkage to care
                  </label>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="referralDestination">
                    Referral Destination
                  </label>
                  <input
                    type="text"
                    id="referralDestination"
                    name="referralDestination"
                    value={newSession.referralDestination}
                    onChange={handleInputChange}
                    placeholder="e.g., ART Clinic"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="remarks">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={newSession.remarks}
                    onChange={handleInputChange}
                    style={styles.textarea}
                  />
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveButton}>
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>HTS Session Details</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowDetailsModal(false)}
              >
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.detailsGroup}>
                <div style={styles.detailsLabel}>Patient Name</div>
                <div style={styles.detailsValue}>
                  {selectedSession.patientName}
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <div style={styles.detailsLabel}>Session Date</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.sessionDate}
                  </div>
                </div>
                <div style={styles.formGroupHalf}>
                  <div style={styles.detailsLabel}>Session Type</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.sessionType}
                  </div>
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroupHalf}>
                  <div style={styles.detailsLabel}>MyHubCares Branch</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.details.branch}
                  </div>
                </div>
                <div style={styles.formGroupHalf}>
                  <div style={styles.detailsLabel}>Counselor</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.details.counselor}
                  </div>
                </div>
              </div>

              <h4>Counseling & Consent</h4>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={selectedSession.preTest}
                  disabled
                  style={styles.checkbox}
                />
                <label>Pre-test counseling provided</label>
              </div>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  style={styles.checkbox}
                />
                <label>Informed consent obtained</label>
              </div>

              <h4>Test Results</h4>
              <div style={styles.detailsGroup}>
                <div style={styles.detailsLabel}>Result</div>
                <div style={styles.detailsValue}>{selectedSession.result}</div>
              </div>

              <h4>Post-Test & Linkage</h4>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={selectedSession.postTest}
                  disabled
                  style={styles.checkbox}
                />
                <label>Post-test counseling provided</label>
              </div>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={selectedSession.details.referral ? true : false}
                  disabled
                  style={styles.checkbox}
                />
                <label>Referred for linkage to care</label>
              </div>
              {selectedSession.details.referral && (
                <div style={styles.detailsGroup}>
                  <div style={styles.detailsLabel}>Referral Destination</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.details.referral}
                  </div>
                </div>
              )}

              {selectedSession.details.remarks && (
                <div style={styles.detailsGroup}>
                  <div style={styles.detailsLabel}>Remarks</div>
                  <div style={styles.detailsValue}>
                    {selectedSession.details.remarks}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HTSSessions;
