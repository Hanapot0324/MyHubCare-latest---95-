// web/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';

import Login from './components/Login.jsx';
import PatientRegistration from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import MainLayout from './components/Main.jsx';
import Appointments from './components/Appointment.jsx';
import ClinicalVisits from './components/ClinicalVisit.jsx';
import Inventory from './components/Inventory.jsx';
import InventoryTransactions from './components/InventoryTransactions.jsx';
import InventoryAlerts from './components/InventoryAlerts.jsx';
import InventorySuppliers from './components/InventorySuppliers.jsx';
import InventoryOrders from './components/InventoryOrders.jsx';
import Prescriptions from './components/Prescriptions.jsx';
import ARTRegimenManagement from './components/ArtRegimentManagement.jsx';
import LabTests from './components/LabTest.jsx';
import HTSSessions from './components/HTSSessions.jsx';
import Counseling from './components/Counseling.jsx';
import Referrals from './components/Referrals.jsx';
import Patients from './components/Patient.jsx';
import BranchManagement from './components/BranchManagement.jsx';
import Profile from './components/Profile.jsx';
import Settings from './components/Settings.jsx';
import MedicationReminders from './components/MedicationReminders.jsx';
import Medications from './components/Medications.jsx';
import RefillRequests from './components/RefillRequests.jsx';
import MyAppointments from './components/MyAppointments.jsx';
import AppointmentRequests from './components/AppointmentRequests.jsx';
import CareTasks from './components/CareTasks.jsx';
import Reports from './components/Reports.jsx';
import AuditTrail from './components/AuditTrail.jsx';
import Education from './components/Education.jsx';
import Forum from './components/Forum.jsx';
import PatientSurvey from './components/PatientSurvey.jsx';
import SurveyMetrics from './components/SurveyMetrics.jsx';
import SurveyResponses from './components/SurveyResponses.jsx';
import AvailabilitySlots from './components/AvailabilitySlots.jsx';
import DoctorAssignments from './components/DoctorAssignments.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { SOCKET_URL } from './config/api';

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
}); // global socket

const theme = createTheme({
  palette: {
    primary: {
      main: '#B82132',
      dark: '#8B1A26',
      light: '#D2665A',
    },
    secondary: {
      main: '#D2665A',
      light: '#F2B28C',
    },
    accent: {
      main: '#F2B28C',
      light: '#F6DED8',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('🧠 Connected to Socket.IO:', socket.id);
      console.log('🔗 Socket URL:', socket.io.uri);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    socket.on('newNotification', (data) => {
      console.log('📩 Real-time notification:', data);
    });

    return () => {
      // Don't disconnect socket here as it's used by other components
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('newNotification');
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login socket={socket} />} />
          <Route
            path="/register"
            element={<PatientRegistration socket={socket} />}
          />
          <Route
            path="/dashboard"
            element={
              <MainLayout socket={socket}>
                <Dashboard socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/patient"
            element={
              <MainLayout socket={socket}>
                <Patients socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/appointments"
            element={
              <MainLayout socket={socket}>
                <Appointments socket={socket} />
              </MainLayout>
            }
          />
          
          <Route
            path="/availability-slots"
            element={
              <MainLayout socket={socket}>
                <AvailabilitySlots socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/doctor-assignments"
            element={
              <MainLayout socket={socket}>
                <ProtectedRoute allowedRoles={['admin']}>
                  <DoctorAssignments socket={socket} />
                </ProtectedRoute>
              </MainLayout>
            }
          />
          <Route
            path="/clinical-visit"
            element={
              <MainLayout socket={socket}>
                <ClinicalVisits socket={socket} />
              </MainLayout>
            }
          />
          {/* Inventory routes - specific routes first to avoid matching conflicts */}
          <Route
            path="/inventory/transactions"
            element={
              <MainLayout socket={socket}>
                <InventoryTransactions socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/inventory/alerts"
            element={
              <MainLayout socket={socket}>
                <InventoryAlerts socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/inventory/suppliers"
            element={
              <MainLayout socket={socket}>
                <InventorySuppliers socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/inventory/orders"
            element={
              <MainLayout socket={socket}>
                <InventoryOrders socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <MainLayout socket={socket}>
                <Inventory socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/prescriptions"
            element={
              <MainLayout socket={socket}>
                <Prescriptions socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/medications"
            element={
              <MainLayout socket={socket}>
                <Medications socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/refill-requests"
            element={
              <MainLayout socket={socket}>
                <RefillRequests socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/art-regimen"
            element={
              <MainLayout socket={socket}>
                <ARTRegimenManagement socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/lab-test"
            element={
              <MainLayout socket={socket}>
                <LabTests socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/hts-sessions"
            element={
              <MainLayout socket={socket}>
                <HTSSessions socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/counseling"
            element={
              <MainLayout socket={socket}>
                <Counseling socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/referrals"
            element={
              <MainLayout socket={socket}>
                <Referrals socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/branch-management"
            element={
              <MainLayout socket={socket}>
                <BranchManagement socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <MainLayout socket={socket}>
                <Profile socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <MainLayout socket={socket}>
                <Settings socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/medication-adherence"
            element={
              <MainLayout socket={socket}>
                <MedicationReminders socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/medication-reminders"
            element={
              <MainLayout socket={socket}>
                <MedicationReminders socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/my-appointments"
            element={
              <MainLayout socket={socket}>
                <ProtectedRoute allowedRoles={['patient']}>
                  <MyAppointments socket={socket} />
                </ProtectedRoute>
              </MainLayout>
            }
          />
          <Route
            path="/appointment-requests"
            element={
              <MainLayout socket={socket}>
                <ProtectedRoute allowedRoles={['case_manager', 'admin']}>
                  <AppointmentRequests socket={socket} />
                </ProtectedRoute>
              </MainLayout>
            }
          />
          <Route
            path="/care-tasks"
            element={
              <MainLayout socket={socket}>
                <CareTasks socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <MainLayout socket={socket}>
                <Reports socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/audit-trail"
            element={
              <MainLayout socket={socket}>
                <AuditTrail socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/education"
            element={
              <MainLayout socket={socket}>
                <Education socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/forum"
            element={
              <MainLayout socket={socket}>
                <Forum socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/patient-survey"
            element={
              <MainLayout socket={socket}>
                <PatientSurvey socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/survey-metrics"
            element={
              <MainLayout socket={socket}>
                <SurveyMetrics socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/survey-responses"
            element={
              <MainLayout socket={socket}>
                <SurveyResponses socket={socket} />
              </MainLayout>
            }
          />

          
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
