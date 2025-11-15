// web/src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import Login from './components/Login.jsx';
import PatientRegistration from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import MainLayout from './components/Main.jsx';
import Appointments from './components/Appointment.jsx';
import ClinicalVisits from './components/ClinicalVisit.jsx';
import Inventory from './components/Inventory.jsx';
import Prescriptions from './components/Prescriptions.jsx';
import ARTRegimenManagement from './components/ArtRegimentManagement.jsx';
import VaccinationProgram from './components/VaccinationProgram.jsx';
import LabTests from './components/LabTest.jsx';
import HTSSessions from './components/HTSSessions.jsx';
import Counseling from './components/Counseling.jsx';
import Referrals from './components/Referrals.jsx';
import Patients from './components/Patient.jsx';
import BranchManagement from './components/BranchManagement.jsx';
import Medications from './components/Medication.jsx';
const socket = io('http://localhost:5000'); // global socket

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#4caf50',
    },
  },
});

export default function App() {
  useEffect(() => {
    socket.on('connect', () => {
      console.log('🧠 Connected to Socket.IO:', socket.id);
    });

    socket.on('newNotification', (data) => {
      console.log('📩 Real-time notification:', data);
    });

    return () => {
      socket.disconnect();
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
              <MainLayout>
                <Dashboard socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/patient"
            element={
              <MainLayout>
                <Patients socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/appointments"
            element={
              <MainLayout>
                <Appointments socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/clinical-visit"
            element={
              <MainLayout>
                <ClinicalVisits socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <MainLayout>
                <Inventory socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/prescriptions"
            element={
              <MainLayout>
                <Prescriptions socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/art-regimen"
            element={
              <MainLayout>
                <ARTRegimenManagement socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/vaccination-program"
            element={
              <MainLayout>
                <VaccinationProgram socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/lab-test"
            element={
              <MainLayout>
                <LabTests socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/hts-sessions"
            element={
              <MainLayout>
                <HTSSessions socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/counseling"
            element={
              <MainLayout>
                <Counseling socket={socket} />
              </MainLayout>
            }
          />
          <Route
            path="/referrals"
            element={
              <MainLayout>
                <Referrals socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/branch-management"
            element={
              <MainLayout>
                <BranchManagement socket={socket} />
              </MainLayout>
            }
          />

          <Route
            path="/medications"
            element={
              <MainLayout>
                <Medications socket={socket} />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
