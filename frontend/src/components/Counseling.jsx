import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Counseling = () => {
  const navigate = useNavigate();

  // Initialize with dummy data matching the screenshots
  const [sessions, setSessions] = useState([
    {
      id: 1,
      patientId: 1,
      patientName: 'John Doe',
      sessionDate: '2025-10-22',
      sessionType: 'Adherence Counseling',
      duration: 45,
      topics: [
        'Medication Adherence',
        'Side Effect Management',
        'Lifestyle Modifications',
      ],
      notes:
        'Patient discussed challenges with medication adherence and we set up reminders.',
      followUpRequired: true,
      followUpDate: '2025-11-22',
      counselorId: 1,
      counselorName: 'Anna Reyes',
    },
    {
      id: 2,
      patientId: 2,
      patientName: 'Maria Santos',
      sessionDate: '2025-10-18',
      sessionType: 'Mental Health Support',
      duration: 60,
      topics: ['Coping Strategies', 'Stigma Management', 'Family Disclosure'],
      notes:
        'Patient expressed concerns about stigma and we discussed coping strategies.',
      followUpRequired: true,
      followUpDate: '2025-11-01',
      counselorId: 2,
      counselorName: 'Dr. James Wilson',
    },
  ]);

  const [patients] = useState([
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Maria Santos' },
    { id: 3, name: 'Robert Chen' },
    { id: 4, name: 'Emily Johnson' },
  ]);

  const [counselors] = useState([
    { id: 1, name: 'Anna Reyes' },
    { id: 2, name: 'Dr. James Wilson' },
    { id: 3, name: 'Dr. Sarah Miller' },
  ]);

  // Users with their names and roles
  const [users] = useState([
    { name: 'Admin User', role: 'ADMIN' },
    { name: 'Dr. Alice Johnson', role: 'PHYSICIAN' },
    { name: 'Dr. Bob Williams', role: 'PHYSICIAN' },
    { name: 'Nurse Carol Davis', role: 'NURSE' },
    { name: 'Manager Frank Wright', role: 'CASE MANAGER' },
    { name: 'Counselor Eve Miller', role: 'COUNSELOR' },
  ]);

  // Extract unique roles for the role dropdown
  const uniqueRoles = [...new Set(users.map((user) => user.role))];

  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [newSession, setNewSession] = useState({
    patientId: '',
    sessionDate: '',
    duration: 45,
    sessionType: '',
    topics: [],
    notes: '',
    followUpRequired: false,
    followUpDate: '',
    counselorId: 1,
    performedByName: 'Admin User',
    performedByRole: 'ADMIN',
  });

  // Calculate statistics
  const totalSessions = sessions.length;
  const followUpNeeded = sessions.filter(
    (s) => s.followUpRequired && new Date(s.followUpDate) <= new Date()
  ).length;
  const avgDuration =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        )
      : 0;

  // Filter sessions based on search and type filter
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.sessionType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === 'all' || session.sessionType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      if (name === 'topics') {
        const updatedTopics = [...newSession.topics];
        if (checked) {
          updatedTopics.push(value);
        } else {
          const index = updatedTopics.indexOf(value);
          if (index > -1) {
            updatedTopics.splice(index, 1);
          }
        }
        setNewSession((prev) => ({ ...prev, topics: updatedTopics }));
      } else {
        setNewSession((prev) => ({ ...prev, [name]: checked }));
      }
    } else {
      setNewSession((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      newSession.patientId &&
      newSession.sessionDate &&
      newSession.sessionType &&
      newSession.topics.length > 0
    ) {
      const patient = patients.find(
        (p) => p.id === parseInt(newSession.patientId)
      );
      const counselor = counselors.find(
        (c) => c.id === parseInt(newSession.counselorId)
      );

      const newId =
        sessions.length > 0 ? Math.max(...sessions.map((s) => s.id)) + 1 : 1;
      const sessionToAdd = {
        id: newId,
        patientId: parseInt(newSession.patientId),
        patientName: patient ? patient.name : 'Unknown',
        sessionDate: newSession.sessionDate,
        sessionType: newSession.sessionType,
        duration: parseInt(newSession.duration),
        topics: newSession.topics,
        notes: newSession.notes,
        followUpRequired: newSession.followUpRequired,
        followUpDate: newSession.followUpDate,
        counselorId: parseInt(newSession.counselorId),
        counselorName: counselor ? counselor.name : 'Unknown',
      };

      setSessions([...sessions, sessionToAdd]);
      setNewSession({
        patientId: '',
        sessionDate: '',
        duration: 45,
        sessionType: '',
        topics: [],
        notes: '',
        followUpRequired: false,
        followUpDate: '',
        counselorId: 1,
        performedByName: 'Admin User',
        performedByRole: 'ADMIN',
      });
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setNewSession({
      patientId: '',
      sessionDate: '',
      duration: 45,
      sessionType: '',
      topics: [],
      notes: '',
      followUpRequired: false,
      followUpDate: '',
      counselorId: 1,
      performedByName: 'Admin User',
      performedByRole: 'ADMIN',
    });
    setShowModal(false);
  };

  const viewSessionDetails = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowDetailsModal(true);
    }
  };

  const scheduleFollowUp = (sessionId) => {
    // Navigate to appointments page
    navigate('/appointments');
  };

  // Styles matching the screenshots
  const styles = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
    },
    topBar: {
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '0 5px',
    },
    adminUser: {
      color: '#555',
      fontSize: '14px',
      marginRight: '15px',
    },
    notificationIcon: {
      position: 'relative',
      cursor: 'pointer',
      color: '#555',
    },
    notificationBadge: {
      position: 'absolute',
      top: '-5px',
      right: '-5px',
      backgroundColor: '#e74c3c',
      color: 'white',
      borderRadius: '50%',
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '10px',
      fontWeight: 'bold',
    },
    headerSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
    },
    headerTitle: {
      color: '#333',
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
    },
    headerSubtitle: {
      color: '#6c757d',
      margin: '5px 0 0 0',
    },
    addButton: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '5px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    alertWarning: {
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeeba',
      color: '#856404',
      padding: '15px',
      borderRadius: '5px',
      marginBottom: '20px',
    },
    statsContainer: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    statCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      padding: '20px',
      flex: '1',
      display: 'flex',
      alignItems: 'center',
    },
    statIcon: {
      fontSize: '32px',
      marginRight: '15px',
    },
    statContent: {
      flex: '1',
    },
    statValue: {
      fontSize: '28px',
      fontWeight: 'bold',
      margin: '0 0 5px 0',
    },
    statLabel: {
      fontSize: '14px',
      color: '#6c757d',
      margin: 0,
    },
    filterBar: {
      display: 'flex',
      gap: '15px',
      marginBottom: '20px',
      backgroundColor: 'white',
      padding: '15px 20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    searchInput: {
      flex: '1',
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '5px',
      fontSize: '14px',
    },
    filterSelect: {
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '5px',
      fontSize: '14px',
      width: '200px',
    },
    // New card-based list styles
    listContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '15px',
    },
    patientCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      padding: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    patientInfo: {
      flex: 1,
    },
    patientName: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: '0 0 10px 0',
    },
    patientMeta: {
      display: 'flex',
      gap: '20px',
      fontSize: '14px',
      color: '#495057',
      marginBottom: '10px',
    },
    patientTopics: {
      fontSize: '14px',
      color: '#495057',
      margin: 0,
    },
    // --- UPDATED STYLE ---
    patientActions: {
      display: 'flex',
      flexDirection: 'row', // Changed to 'row'
      alignItems: 'center', // Changed to 'center'
      gap: '10px',
    },
    // --- UPDATED STYLE ---
    badgeWarning: {
      display: 'inline-block',
      padding: '8px 16px', // Updated padding to match buttons
      fontSize: '14px', // Updated font size to match buttons
      fontWeight: '500', // Updated font weight to match buttons
      color: '#856404',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeeba',
      borderRadius: '5px', // Updated border radius to match buttons
    },
    actionButton: {
      padding: '8px 16px',
      fontSize: '14px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    successButton: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    // Modal styles (largely unchanged)
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
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    },
    modalHeader: {
      padding: '20px 25px',
      borderBottom: '1px solid #dee2e6',
      backgroundColor: '#f8f9fa',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    },
    modalTitle: {
      margin: 0,
      color: '#333',
      fontSize: '20px',
      fontWeight: '600',
    },
    form: {
      padding: '25px',
    },
    formRow: {
      display: 'flex',
      gap: '20px',
      marginBottom: '20px',
    },
    formGroup: {
      flex: 1,
      marginBottom: '20px',
    },
    label: {
      display: 'block',
      marginBottom: '8px',
      color: '#495057',
      fontSize: '14px',
      fontWeight: '600',
    },
    select: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '5px',
      fontSize: '14px',
      color: '#495057',
      backgroundColor: 'white',
    },
    input: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '5px',
      fontSize: '14px',
      color: '#495057',
    },
    textarea: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #ced4da',
      borderRadius: '5px',
      fontSize: '14px',
      color: '#495057',
      minHeight: '100px',
      resize: 'vertical',
    },
    checkboxGroup: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '10px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      fontSize: '14px',
      color: '#495057',
    },
    checkboxInput: {
      marginRight: '8px',
    },
    modalActions: {
      display: 'flex',
      gap: '10px',
      justifyContent: 'flex-end',
      marginTop: '25px',
      paddingTop: '20px',
      borderTop: '1px solid #dee2e6',
    },
    cancelButton: {
      padding: '10px 20px',
      border: '1px solid #6c757d',
      backgroundColor: 'white',
      color: '#6c757d',
      borderRadius: '5px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    submitButton: {
      padding: '10px 20px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '5px',
      fontSize: '14px',
      cursor: 'pointer',
      fontWeight: '500',
    },
    alertInfo: {
      backgroundColor: '#d1ecf1',
      border: '1px solid #bee5eb',
      color: '#0c5460',
      padding: '15px',
      borderRadius: '5px',
      marginTop: '15px',
    },
  };

  return (
    <div style={styles.pageContainer}>
      {/* Top Bar for User and Notifications */}
      <div style={styles.topBar}>
        <span style={styles.adminUser}>Admin User</span>
        <div style={styles.notificationIcon}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span style={styles.notificationBadge}>3</span>
        </div>
      </div>

      {/* Header Section */}
      <div style={styles.headerSection}>
        <div>
          <h1 style={styles.headerTitle}>Counseling Sessions</h1>
          <p style={styles.headerSubtitle}>
            Manage patient counseling and support sessions
          </p>
        </div>
        <button style={styles.addButton} onClick={() => setShowModal(true)}>
          Record Session
        </button>
      </div>

      {/* Alert for follow-ups needed */}
      {followUpNeeded > 0 && (
        <div style={styles.alertWarning}>
          <strong>
            ⚠️ {followUpNeeded} patient(s) require follow-up counseling
          </strong>
        </div>
      )}

      {/* Statistics Cards */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: '#007bff' }}>💬</div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{totalSessions}</p>
            <p style={styles.statLabel}>Total Sessions</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: '#ffc107' }}>🔔</div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{followUpNeeded}</p>
            <p style={styles.statLabel}>Follow-ups Due</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIcon, color: '#17a2b8' }}>⏱️</div>
          <div style={styles.statContent}>
            <p style={styles.statValue}>{avgDuration}</p>
            <p style={styles.statLabel}>Avg. Duration (min)</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search sessions..."
          style={styles.searchInput}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="Adherence Counseling">Adherence Counseling</option>
          <option value="Mental Health Support">Mental Health Support</option>
          <option value="Pre-ART Counseling">Pre-ART Counseling</option>
          <option value="Disclosure Support">Disclosure Support</option>
        </select>
      </div>

      {/* Session List - Card Layout */}
      <div style={styles.listContainer}>
        {filteredSessions.map((session) => {
          const isFollowUpDue =
            session.followUpRequired &&
            new Date(session.followUpDate) <= new Date();
          return (
            <div key={session.id} style={styles.patientCard}>
              <div style={styles.patientInfo}>
                <h3 style={styles.patientName}>{session.patientName}</h3>
                <div style={styles.patientMeta}>
                  <span>
                    📅 {new Date(session.sessionDate).toLocaleDateString()}
                  </span>
                  <span>💬 {session.sessionType}</span>
                  <span>⏱ {session.duration} minutes</span>
                  {session.followUpRequired && (
                    <span>
                      🔄 Follow-up:{' '}
                      {new Date(session.followUpDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p style={styles.patientTopics}>
                  <strong>Topics:</strong> {session.topics.join(', ')}
                </p>
              </div>
              <div style={styles.patientActions}>
                {isFollowUpDue && (
                  <span style={styles.badgeWarning}>Follow-up Due</span>
                )}
                <button
                  style={{ ...styles.actionButton, ...styles.primaryButton }}
                  onClick={() => viewSessionDetails(session.id)}
                >
                  View Details
                </button>
                {isFollowUpDue && (
                  <button
                    style={{ ...styles.actionButton, ...styles.successButton }}
                    onClick={() => scheduleFollowUp(session.id)}
                  >
                    Schedule
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Session Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Record Counseling Session</h2>
            </div>
            <form style={styles.form} onSubmit={handleSubmit}>
              {/* Form content remains the same */}
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="patientId">
                    Patient
                  </label>
                  <select
                    id="patientId"
                    name="patientId"
                    value={newSession.patientId}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
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
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="duration">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={newSession.duration}
                    onChange={handleInputChange}
                    min="15"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
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
                    <option value="">Select Type</option>
                    <option value="Adherence Counseling">
                      Adherence Counseling
                    </option>
                    <option value="Mental Health Support">
                      Mental Health Support
                    </option>
                    <option value="Pre-ART Counseling">
                      Pre-ART Counseling
                    </option>
                    <option value="Disclosure Support">
                      Disclosure Support
                    </option>
                  </select>
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Topics Covered</label>
                <div style={styles.checkboxGroup}>
                  {[
                    'Medication Adherence',
                    'Side Effect Management',
                    'Lifestyle Modifications',
                    'Mental Health',
                    'Stigma Management',
                    'Family Disclosure',
                  ].map((topic) => (
                    <label key={topic} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="topics"
                        value={topic}
                        checked={newSession.topics.includes(topic)}
                        onChange={handleInputChange}
                        style={styles.checkboxInput}
                      />
                      {topic}
                    </label>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="notes">
                  Session Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={newSession.notes}
                  onChange={handleInputChange}
                  placeholder="Document the counseling session..."
                  style={styles.textarea}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="followUpRequired"
                    checked={newSession.followUpRequired}
                    onChange={handleInputChange}
                    style={styles.checkboxInput}
                  />
                  Follow-up session required
                </label>
              </div>
              {newSession.followUpRequired && (
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="followUpDate">
                    Follow-up Date
                  </label>
                  <input
                    type="date"
                    id="followUpDate"
                    name="followUpDate"
                    value={newSession.followUpDate}
                    onChange={handleInputChange}
                    style={styles.input}
                  />
                </div>
              )}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
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
              <h2 style={styles.modalTitle}>Counseling Session Details</h2>
            </div>
            <div style={styles.form}>
              {/* Details content remains the same */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Patient Name</label>
                <input
                  type="text"
                  value={selectedSession.patientName}
                  readOnly
                  style={styles.input}
                />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Session Date</label>
                  <input
                    type="date"
                    value={selectedSession.sessionDate}
                    readOnly
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Counselor</label>
                  <input
                    type="text"
                    value={selectedSession.counselorName}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Session Type</label>
                  <input
                    type="text"
                    value={selectedSession.sessionType}
                    readOnly
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Duration</label>
                  <input
                    type="text"
                    value={`${selectedSession.duration} minutes`}
                    readOnly
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Topics Covered</label>
                <div
                  style={{
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '5px',
                    backgroundColor: '#f8f9fa',
                  }}
                >
                  {selectedSession.topics.map((topic, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#fff',
                        backgroundColor: '#007bff',
                        borderRadius: '4px',
                        marginRight: '5px',
                        marginBottom: '5px',
                      }}
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Session Notes</label>
                <textarea
                  rows="4"
                  value={selectedSession.notes}
                  readOnly
                  style={styles.textarea}
                />
              </div>
              {selectedSession.followUpRequired && (
                <div style={styles.alertInfo}>
                  <strong>Follow-up Required:</strong>{' '}
                  {new Date(selectedSession.followUpDate).toLocaleDateString()}
                </div>
              )}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Counseling;
