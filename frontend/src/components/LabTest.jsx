import React, { useState } from 'react';

const LabTests = () => {
  const [testResults, setTestResults] = useState([
    {
      id: 1,
      patient: 'John Doe',
      testName: 'CD4 Count',
      result: '450 cells/μL',
      date: '10/1/2025',
      labCode: 'LAB - 2025 - 001',
    },
    {
      id: 2,
      patient: 'John Doe',
      testName: 'Viral Load',
      result: 'Undetectable copies/mL',
      date: '10/1/2025',
      labCode: 'LAB - 2025 - 002',
    },
    {
      id: 3,
      patient: 'Maria Santos',
      testName: 'CD4 Count',
      result: '380 cells/μL',
      date: '9/28/2025',
      labCode: 'LAB - 2025 - 003',
    },
  ]);

  // Users with their names and roles
  const [users] = useState([
    { name: 'Admin User', role: 'ADMIN' },
    { name: 'Dr. Alice Johnson', role: 'PHYSICIAN' },
    { name: 'Dr. Bob Williams', role: 'PHYSICIAN' },
    { name: 'Nurse Carol Davis', role: 'NURSE' },
    { name: 'Manager Frank Wright', role: 'CASE MANAGER' },
    { name: 'Lab Tech Eve Miller', role: 'LAB PERSONNEL' },
  ]);

  // Extract unique roles for the role dropdown
  const uniqueRoles = [...new Set(users.map((user) => user.role))];

  const [showModal, setShowModal] = useState(false);
  const [newTest, setNewTest] = useState({
    patient: '',
    testName: '',
    resultValue: '',
    unit: '',
    dateDone: '',
    labCode: '',
    performedByName: 'Admin User', // Default name
    performedByRole: 'ADMIN', // Default role
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      newTest.patient &&
      newTest.testName &&
      newTest.resultValue &&
      newTest.dateDone
    ) {
      const newId = Math.max(...testResults.map((r) => r.id), 0) + 1;
      const resultWithUnit = newTest.unit
        ? `${newTest.resultValue} ${newTest.unit}`
        : newTest.resultValue;
      const newResult = {
        id: newId,
        patient: newTest.patient,
        testName: newTest.testName,
        result: resultWithUnit,
        date: newTest.dateDone,
        labCode:
          newTest.labCode || `LAB - 2025 - ${String(newId).padStart(3, '0')}`,
      };
      setTestResults([...testResults, newResult]);
      setNewTest({
        patient: '',
        testName: '',
        resultValue: '',
        unit: '',
        dateDone: '',
        labCode: '',
        performedByName: 'Admin User',
        performedByRole: 'ADMIN',
      });
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    setNewTest({
      patient: '',
      testName: '',
      resultValue: '',
      unit: '',
      dateDone: '',
      labCode: '',
      performedByName: 'Admin User',
      performedByRole: 'ADMIN',
    });
    setShowModal(false);
  };

  // Styles
  const styles = {
    pageContainer: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
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
    mainCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      marginTop: '50px',
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 25px',
      borderBottom: '1px solid #e9ecef',
    },
    cardTitle: {
      color: '#333',
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
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
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    tableHeaderCell: {
      padding: '12px 25px',
      textAlign: 'left',
      fontWeight: 'bold',
      fontSize: '14px',
      color: '#495057',
      backgroundColor: '#f8f9fa',
      borderBottom: '2px solid #dee2e6',
    },
    tableRow: {
      borderBottom: '1px solid #dee2e6',
      transition: 'background-color 0.2s',
    },
    tableCell: {
      padding: '15px 25px',
      color: '#333',
      fontSize: '14px',
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

      {/* Main Card containing Title, Button, and Table */}
      <div style={styles.mainCard}>
        <div style={styles.cardHeader}>
          <h1 style={styles.cardTitle}>Laboratory Tests</h1>
          <button style={styles.addButton} onClick={() => setShowModal(true)}>
            Add Test Result
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeaderCell}>PATIENT</th>
              <th style={styles.tableHeaderCell}>TEST NAME</th>
              <th style={styles.tableHeaderCell}>RESULT</th>
              <th style={styles.tableHeaderCell}>DATE</th>
              <th style={styles.tableHeaderCell}>LAB CODE</th>
            </tr>
          </thead>
          <tbody>
            {testResults.map((result) => (
              <tr
                key={result.id}
                style={styles.tableRow}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f8f9fa')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <td style={styles.tableCell}>{result.patient}</td>
                <td style={styles.tableCell}>{result.testName}</td>
                <td style={styles.tableCell}>{result.result}</td>
                <td style={styles.tableCell}>{result.date}</td>
                <td style={styles.tableCell}>{result.labCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Add Lab Test Result</h2>
            </div>
            <form style={styles.form} onSubmit={handleSubmit}>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="patient">
                    Patient
                  </label>
                  <select
                    id="patient"
                    name="patient"
                    value={newTest.patient}
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
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="testName">
                    Test Name
                  </label>
                  <select
                    id="testName"
                    name="testName"
                    value={newTest.testName}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    <option value="">Select Test</option>
                    <option value="CD4 Count">CD4 Count</option>
                    <option value="Viral Load">Viral Load</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="resultValue">
                    Result Value
                  </label>
                  <input
                    type="text"
                    id="resultValue"
                    name="resultValue"
                    value={newTest.resultValue}
                    onChange={handleInputChange}
                    placeholder="Enter result value"
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="unit">
                    Unit
                  </label>
                  <input
                    type="text"
                    id="unit"
                    name="unit"
                    value={newTest.unit}
                    onChange={handleInputChange}
                    placeholder="e.g. cells/μL"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="dateDone">
                    Date Done
                  </label>
                  <input
                    type="date"
                    id="dateDone"
                    name="dateDone"
                    value={newTest.dateDone}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="labCode">
                    Lab Code
                  </label>
                  <input
                    type="text"
                    id="labCode"
                    name="labCode"
                    value={newTest.labCode}
                    onChange={handleInputChange}
                    placeholder="LAB - 2025 - XXX"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="performedByName">
                    Performed By (Name)
                  </label>
                  <select
                    id="performedByName"
                    name="performedByName"
                    value={newTest.performedByName}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    {users.map((user) => (
                      <option key={user.name} value={user.name}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label} htmlFor="performedByRole">
                    Performed By (Role)
                  </label>
                  <select
                    id="performedByRole"
                    name="performedByRole"
                    value={newTest.performedByRole}
                    onChange={handleInputChange}
                    style={styles.select}
                    required
                  >
                    {uniqueRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Add Test Result
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabTests;
