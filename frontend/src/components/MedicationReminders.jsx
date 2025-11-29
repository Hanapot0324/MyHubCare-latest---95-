import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Volume2,
  VolumeX,
  Package,
  Calendar,
  MapPin,
  Pill,
  Search,
  ExternalLink,
} from 'lucide-react';
import { SOCKET_URL } from '../config/api';

const API_BASE_URL = 'http://localhost:5000/api';

const MedicationReminders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('reminders'); // 'reminders' or 'refills'
  const [reminders, setReminders] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [myMedications, setMyMedications] = useState([]);
  const [refillRequests, setRefillRequests] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showDispenseEventsModal, setShowDispenseEventsModal] = useState(false);
  const [dispenseEvents, setDispenseEvents] = useState([]);
  const [editingReminder, setEditingReminder] = useState(null);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [selectedDispenseEvent, setSelectedDispenseEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newReminder, setNewReminder] = useState({
    medication_name: '',
    dosage: '',
    frequency: 'Once daily',
    reminder_time: '09:00',
    active: true,
    browser_notifications: true,
    sound_preference: 'default',
    special_instructions: '',
    prescription_id: null,
  });
  const [refillForm, setRefillForm] = useState({
    medication_id: '',
    prescription_id: '',
    regimen_id: '',
    quantity: '',
    unit: 'tablets',
    preferred_pickup_date: '',
    preferred_pickup_time: '',
    facility_id: '',
    patient_notes: '',
    remaining_pill_count: '',
    pills_per_day: '1',
    kulang_explanation: ''
  });

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Socket.IO connection for real-time updates
  useEffect(() => {
    if (!patientId) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('🔌 MedicationReminders: Connected to Socket.IO');
      
      // Join patient room when connected
      socket.emit('joinPatientRoom', patientId);
      console.log(`👤 MedicationReminders: Joined patient room ${patientId}`);
    });

    // Listen for medication dispensed event (real-time update)
    socket.on('medicationDispensed', (data) => {
      console.log('💊 Medication dispensed (real-time):', data);
      
      // Only refresh if this is for the current patient
      if (data.patient_id === patientId) {
        // Refresh reminders
        loadReminders(patientId).catch(err => console.error('Error loading reminders:', err));
        
        // Refresh medications list so dispensed medication automatically appears in refill requests
        if (activeTab === 'refills') {
          fetchMyMedications().catch(err => console.error('Error fetching medications:', err));
        }
        
        setToast({
          message: 'Medication dispensed! Your medications list has been updated.',
          type: 'success',
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ MedicationReminders: Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ MedicationReminders: Socket connection error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, [patientId, activeTab]);

  useEffect(() => {
    if (activeTab === 'refills' && patientId) {
      fetchMyMedications();
      fetchRefillRequests();
      fetchFacilities();
    }
  }, [activeTab, patientId]);


  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          const user = data.user;
          setCurrentUser(user);

          const patientIdValue =
            user.patient?.patient_id || user.patient_id || user.patientId;

          if (patientIdValue) {
            setPatientId(patientIdValue);
          }

          if (
            (user.role === 'patient' || user.role === 'admin') &&
            patientIdValue
          ) {
            loadReminders(patientIdValue);
            loadPrescriptions();
          }
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async (patientId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/reminders?patient_id=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setReminders(data.data);
        } else if (data.success && data.reminders) {
          setReminders(data.reminders);
        } else {
          setReminders([]);
        }
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders([]);
    }
  };

  const loadPrescriptions = async () => {
    try {
      const token = getAuthToken();
      if (!currentUser) return;

      const patientId =
        currentUser.patient?.patient_id ||
        currentUser.patient_id ||
        currentUser.patientId;
      if (!patientId) return;

      const response = await fetch(
        `${API_BASE_URL}/prescriptions?patient_id=${patientId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPrescriptions(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    }
  };

  const handleAddReminder = async () => {
    if (!newReminder.medication_name) {
      setToast({
        message: 'Please enter a medication name',
        type: 'error',
      });
      return;
    }

    try {
      const patientId =
        currentUser.patient?.patient_id ||
        currentUser.patient_id ||
        currentUser.patientId;
      if (!patientId) {
        setToast({
          message: 'Patient ID not found',
          type: 'error',
        });
        return;
      }

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/reminders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patient_id: patientId,
            medication_name: newReminder.medication_name,
            dosage: newReminder.dosage || '',
            frequency: newReminder.frequency || 'Once daily',
            reminder_time: newReminder.reminder_time || '09:00',
            active: newReminder.active !== false,
            browser_notifications: newReminder.browser_notifications !== false,
            sound_preference: newReminder.sound_preference || 'default',
            special_instructions: newReminder.special_instructions || null,
            prescription_id: newReminder.prescription_id || null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadReminders(patientId);
        setShowAddModal(false);
        setNewReminder({
          medication_name: '',
          dosage: '',
          frequency: 'Once daily',
          reminder_time: '09:00',
          active: true,
          browser_notifications: true,
          sound_preference: 'default',
          special_instructions: '',
          prescription_id: null,
        });
        setToast({
          message: 'Reminder created successfully',
          type: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to create reminder');
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
      setToast({
        message: 'Failed to create reminder: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setShowEditModal(true);
  };

  const handleUpdateReminder = async () => {
    if (!editingReminder.medication_name) {
      setToast({
        message: 'Please enter a medication name',
        type: 'error',
      });
      return;
    }

    try {
      const patientId =
        currentUser.patient?.patient_id ||
        currentUser.patient_id ||
        currentUser.patientId;
      if (!patientId) {
        setToast({
          message: 'Patient ID not found',
          type: 'error',
        });
        return;
      }

      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/reminders/${
          editingReminder.reminder_id || editingReminder.id
        }`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            medication_name: editingReminder.medication_name,
            dosage: editingReminder.dosage || '',
            frequency: editingReminder.frequency || 'Once daily',
            reminder_time: editingReminder.reminder_time || '09:00',
            active: editingReminder.active !== false,
            browser_notifications: editingReminder.browser_notifications !== false,
            sound_preference: editingReminder.sound_preference || 'default',
            special_instructions: editingReminder.special_instructions || null,
            prescription_id: editingReminder.prescription_id || null,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadReminders(patientId);
        setShowEditModal(false);
        setEditingReminder(null);
        setToast({
          message: 'Reminder updated successfully',
          type: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to update reminder');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
      setToast({
        message: 'Failed to update reminder: ' + error.message,
        type: 'error',
      });
    }
  };

  const handleDeleteReminder = async (reminderId) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) {
      return;
    }

    try {
      const patientId =
        currentUser.patient?.patient_id ||
        currentUser.patient_id ||
        currentUser.patientId;
      const token = getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/reminders/${reminderId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadReminders(patientId);
        setToast({
          message: 'Reminder deleted successfully',
          type: 'success',
        });
      } else {
        throw new Error(data.message || 'Failed to delete reminder');
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setToast({
        message: 'Failed to delete reminder: ' + error.message,
        type: 'error',
      });
    }
  };

  const toggleReminderActive = async (reminder) => {
    try {
      const patientId =
        currentUser.patient?.patient_id ||
        currentUser.patient_id ||
        currentUser.patientId;
      if (!patientId) return;

      const token = getAuthToken();
      const updatedReminder = { ...reminder, active: !reminder.active };

      const response = await fetch(
        `${API_BASE_URL}/medication-adherence/reminders/${
          reminder.reminder_id || reminder.id
        }`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedReminder),
        }
      );

      const data = await response.json();

      if (data.success) {
        await loadReminders(patientId);
        setToast({
          message: `Reminder ${updatedReminder.active ? 'activated' : 'deactivated'}`,
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      setToast({
        message: 'Failed to update reminder',
        type: 'error',
      });
    }
  };

  const getSoundIcon = (preference) => {
    switch (preference) {
      case 'urgent':
        return <Volume2 size={16} />;
      case 'gentle':
        return <VolumeX size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const getFrequencyLabel = (frequency) => {
    const freq = frequency.toLowerCase();
    if (freq.includes('once') || freq.includes('daily')) return 'Once Daily';
    if (freq.includes('twice') || freq.includes('bid')) return 'Twice Daily';
    if (freq.includes('three') || freq.includes('tid')) return 'Three Times Daily';
    if (freq.includes('four') || freq.includes('qid')) return 'Four Times Daily';
    return frequency;
  };

  // Fetch patient's medications for refill requests
  const fetchMyMedications = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!patientId) {
        setToast({
          message: 'Patient information is missing. Please log in again.',
          type: 'error',
        });
        return;
      }
      
      // Fetch medications and reminders in parallel
      const [medicationsResponse, remindersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/patients/${patientId}/medications`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }),
        fetch(`${API_BASE_URL}/medication-adherence/reminders?patient_id=${patientId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        })
      ]);
      
      const medicationsData = await medicationsResponse.json();
      const remindersData = await remindersResponse.json();
      
      if (medicationsData.success) {
        let medications = medicationsData.data || [];
        
        // Merge reminder data with medications
        if (remindersData.success) {
          const remindersList = remindersData.data || remindersData.reminders || [];
          
          // Create a map of reminders by medication name
          const remindersMap = {};
          remindersList.forEach(reminder => {
            const medName = reminder.medication_name || reminder.medicationName;
            if (medName) {
              remindersMap[medName.toLowerCase()] = reminder;
            }
          });
          
          // Merge reminder data into medications
          medications = medications.map(med => {
            const reminder = remindersMap[med.medication_name?.toLowerCase()];
            if (reminder) {
              return {
                ...med,
                reminder: {
                  reminder_id: reminder.reminder_id || reminder.id,
                  dosage: reminder.dosage || med.dosage,
                  frequency: reminder.frequency || reminder.freq || med.frequency,
                  reminder_time: reminder.reminder_time || reminder.time,
                  active: reminder.active,
                  browser_notifications: reminder.browser_notifications,
                  sound_preference: reminder.sound_preference,
                  special_instructions: reminder.special_instructions,
                }
              };
            }
            return med;
          });
        }
        
        setMyMedications(medications);
      } else {
        setMyMedications([]);
      }
    } catch (error) {
      console.error('Error fetching my medications:', error);
      setMyMedications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch refill requests
  const fetchRefillRequests = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!patientId) return;
      
      const response = await fetch(`${API_BASE_URL}/refill-requests?patient_id=${patientId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRefillRequests(data.data || []);
      } else {
        setRefillRequests([]);
      }
    } catch (error) {
      console.error('Error fetching refill requests:', error);
      setRefillRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch facilities
  const fetchFacilities = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/facilities`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFacilities(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  // Fetch dispense events for patient
  const fetchDispenseEvents = async () => {
    try {
      if (!patientId) {
        setToast({
          message: 'Patient information is missing. Please log in again.',
          type: 'error',
        });
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/refill-requests/dispense-events/${patientId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      const data = await response.json();

      if (data.success) {
        setDispenseEvents(data.data || []);
      } else {
        setDispenseEvents([]);
        setToast({
          message: data.message || 'Failed to fetch dispense events',
          type: 'error',
        });
      }
    } catch (error) {
      console.error('Error fetching dispense events:', error);
      setDispenseEvents([]);
      setToast({
        message: 'Failed to fetch dispense events',
        type: 'error',
      });
    }
  };

  // Open dispense events modal
  const openDispenseEventsModal = async () => {
    await fetchDispenseEvents();
    setShowDispenseEventsModal(true);
  };

  // Select dispense event and open refill modal
  const selectDispenseEventForRefill = async (event) => {
    setSelectedDispenseEvent(event);
    setShowDispenseEventsModal(false);
    
    // Show loading state
    setLoading(true);
    
    // Prepare medication data from dispense event
    const medicationData = {
      medication_id: event.medication_id,
      medication_name: event.medication_name,
      generic_name: event.generic_name,
      form: event.form,
      strength: event.strength,
      dosage: event.dosage,
      frequency: event.frequency,
      prescription: {
        prescription_id: event.prescription_id,
        prescription_number: event.prescription_number,
      },
    };

    // Estimate pills per day from frequency
    let pillsPerDay = '1';
    const frequency = event.frequency || '';
    if (frequency.toLowerCase().includes('twice')) {
      pillsPerDay = '2';
    } else if (frequency.toLowerCase().includes('three')) {
      pillsPerDay = '3';
    } else if (frequency.toLowerCase().includes('four')) {
      pillsPerDay = '4';
    }

    // Always fetch calculated remaining pills from API
    let remainingPills = '';
    
    try {
      if (event.prescription_id && patientId && event.medication_id) {
        const token = getAuthToken();
        const response = await fetch(
          `${API_BASE_URL}/refill-requests/calculate-remaining/${patientId}/${event.medication_id}?prescription_id=${event.prescription_id}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        
        const data = await response.json();
        
        if (data.success && data.data) {
          if (data.data.estimated_remaining !== null && data.data.estimated_remaining !== undefined) {
            remainingPills = data.data.estimated_remaining.toString();
            pillsPerDay = (data.data.pills_per_day || pillsPerDay).toString();
            
            setToast({
              message: `Remaining pills calculated: ${remainingPills} pills`,
              type: 'success',
            });
          } else {
            setToast({
              message: 'Could not calculate remaining pills. Please enter manually.',
              type: 'warning',
            });
          }
        }
      } else {
        setToast({
          message: 'Missing information to calculate remaining pills. Please enter manually.',
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('Error calculating remaining pills:', error);
      setToast({
        message: 'Error calculating remaining pills. Please enter manually.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
    
    // Set form with fetched or default values
    setRefillForm({
      ...refillForm,
      medication_id: event.medication_id,
      prescription_id: event.prescription_id,
      remaining_pill_count: remainingPills,
      pills_per_day: pillsPerDay,
      unit: event.form === 'tablet' ? 'tablets' : 
            event.form === 'capsule' ? 'capsules' :
            event.form === 'syrup' ? 'ml' :
            event.form === 'injection' ? 'vials' : 'units'
    });
    setSelectedMedication(medicationData);
    setShowRefillModal(true);
  };

  // Open refill modal
  const openRefillModal = async (medication) => {
    setSelectedMedication(medication);
    
    // Try to auto-calculate remaining pills if available
    let remainingPills = '';
    let pillsPerDay = '1';
    
    // Use estimated_remaining_pills from medication if available
    if (medication.estimated_remaining_pills !== null && medication.estimated_remaining_pills !== undefined) {
      remainingPills = medication.estimated_remaining_pills.toString();
      
      // Estimate pills per day from frequency
      const frequency = medication.frequency || '';
      if (frequency.toLowerCase().includes('twice')) {
        pillsPerDay = '2';
      } else if (frequency.toLowerCase().includes('three')) {
        pillsPerDay = '3';
      } else if (frequency.toLowerCase().includes('four')) {
        pillsPerDay = '4';
      }
    } else if (medication.prescription?.prescription_id && patientId) {
      // Try to fetch calculated remaining pills from API
      try {
        const token = getAuthToken();
        const response = await fetch(
          `${API_BASE_URL}/refill-requests/calculate-remaining/${patientId}/${medication.medication_id}?prescription_id=${medication.prescription.prescription_id}`,
          {
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.estimated_remaining !== null) {
            remainingPills = data.data.estimated_remaining.toString();
            pillsPerDay = (data.data.pills_per_day || 1).toString();
          }
        }
      } catch (error) {
        console.error('Error fetching calculated remaining pills:', error);
        // Continue with empty value - user will enter manually
      }
    }
    
    setRefillForm({
      ...refillForm,
      medication_id: medication.medication_id,
      prescription_id: medication.prescription?.prescription_id || '',
      remaining_pill_count: remainingPills,
      pills_per_day: pillsPerDay,
      unit: medication.form === 'tablet' ? 'tablets' : 
            medication.form === 'capsule' ? 'capsules' :
            medication.form === 'syrup' ? 'ml' :
            medication.form === 'injection' ? 'vials' : 'units'
    });
    setShowRefillModal(true);
  };

  // Submit refill request
  const handleSubmitRefillRequest = async () => {
    try {
      if (!patientId) {
        setToast({
          message: 'Patient information is missing. Please log in again.',
          type: 'error',
        });
        return;
      }
      
      // Validate required fields
      if (!refillForm.medication_id || !refillForm.quantity || !refillForm.preferred_pickup_date || 
          !refillForm.facility_id || !refillForm.remaining_pill_count) {
        setToast({
          message: 'Please fill in all required fields (medication, quantity, pickup date, facility, and remaining pill count)',
          type: 'error',
        });
        return;
      }

      // Validate remaining_pill_count is a number
      const remainingPills = parseInt(refillForm.remaining_pill_count);
      if (isNaN(remainingPills) || remainingPills < 0) {
        setToast({
          message: 'Remaining pill count must be a valid number',
          type: 'error',
        });
        return;
      }

      // Validate preferred_pickup_date is future date
      const pickupDate = new Date(refillForm.preferred_pickup_date);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (pickupDate < tomorrow) {
        setToast({
          message: 'Pickup date must be at least one day in advance',
          type: 'error',
        });
        return;
      }

      // Validate preferred_pickup_time is hourly (if provided)
      if (refillForm.preferred_pickup_time) {
        const timeParts = refillForm.preferred_pickup_time.split(':');
        if (timeParts.length === 2 && parseInt(timeParts[1]) !== 0) {
          setToast({
            message: 'Pickup time must be on the hour (e.g., 09:00, 10:00)',
            type: 'error',
          });
          return;
        }
      }

      // Calculate pill status
      const pillsPerDay = parseInt(refillForm.pills_per_day) || 1;
      const daysSinceLastPickup = 30; // This should be calculated from last pickup
      const expectedPills = daysSinceLastPickup * pillsPerDay;
      const isKulang = remainingPills < expectedPills - 5;
      
      if (isKulang && !refillForm.kulang_explanation) {
        setToast({
          message: 'Please provide an explanation for low pill count',
          type: 'error',
        });
        return;
      }

      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/refill-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          patient_id: patientId,
          prescription_id: refillForm.prescription_id || null,
          regimen_id: refillForm.regimen_id || null,
          medication_id: refillForm.medication_id,
          facility_id: refillForm.facility_id,
          quantity: parseInt(refillForm.quantity),
          unit: refillForm.unit,
          preferred_pickup_date: refillForm.preferred_pickup_date,
          preferred_pickup_time: refillForm.preferred_pickup_time || null,
          patient_notes: refillForm.patient_notes || null,
          remaining_pill_count: remainingPills,
          pills_per_day: pillsPerDay,
          kulang_explanation: refillForm.kulang_explanation || null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setToast({
          message: 'Refill request submitted successfully',
          type: 'success',
        });
        setShowRefillModal(false);
        setRefillForm({
          medication_id: '',
          prescription_id: '',
          regimen_id: '',
          quantity: '',
          unit: 'tablets',
          preferred_pickup_date: '',
          preferred_pickup_time: '',
          facility_id: '',
          patient_notes: '',
          remaining_pill_count: '',
          pills_per_day: '1',
          kulang_explanation: ''
        });
        fetchRefillRequests();
      } else {
        throw new Error(data.message || 'Failed to submit refill request');
      }
    } catch (error) {
      console.error('Error submitting refill request:', error);
      setToast({
        message: 'Failed to submit refill request: ' + error.message,
        type: 'error',
      });
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: '#ffc107', icon: '⏳', text: 'Pending' },
      approved: { color: '#17a2b8', icon: '✓', text: 'Approved' },
      ready: { color: '#28a745', icon: '📦', text: 'Ready for Pickup' },
      dispensed: { color: '#6f42c1', icon: '💊', text: 'Dispensed' },
      declined: { color: '#dc3545', icon: '❌', text: 'Declined' },
      cancelled: { color: '#6c757d', icon: '🚫', text: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span 
        style={{
          backgroundColor: config.color,
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '600',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  // Filter medications and refill requests
  const filteredMedications = myMedications.filter((med) => {
    const matchesSearch =
      med.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.strength?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredRefillRequests = refillRequests.filter(request => {
    const medicationName = request.medication_name?.toLowerCase() || '';
    const facilityName = request.facility_name?.toLowerCase() || '';
    const matchesSearch = 
      medicationName.includes(searchTerm.toLowerCase()) ||
      facilityName.includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading reminders...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', paddingTop: '100px', backgroundColor: 'white' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(to right, #D84040, #A31D1D)',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>
            {activeTab === 'reminders' ? 'Medication Reminders' : 'Refill Requests'}
          </h2>
          <p style={{ margin: '5px 0 0 0', color: '#F8F2DE', fontSize: '14px' }}>
            {activeTab === 'reminders' 
              ? 'Manage your medication reminders and notifications'
              : 'Request medication refills and track your requests'}
          </p>
        </div>
        {activeTab === 'reminders' && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '10px 16px',
              background: '#ECDCBF',
              color: '#A31D1D',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#F8F2DE')}
            onMouseLeave={(e) => (e.target.style.background = '#ECDCBF')}
          >
            <Plus size={16} />
            Add Reminder
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #dee2e6' }}>
          <button
            onClick={() => setActiveTab('reminders')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'reminders' ? '3px solid #D84040' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'reminders' ? '600' : '400',
              color: activeTab === 'reminders' ? '#D84040' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Bell size={18} />
            Reminders
          </button>
          <button
            onClick={() => setActiveTab('refills')}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'refills' ? '3px solid #D84040' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'refills' ? '600' : '400',
              color: activeTab === 'refills' ? '#D84040' : '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Package size={18} />
            Refill Requests
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'reminders' ? (
        <>

      {/* Reminders List */}
      {reminders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            background: '#F8F2DE',
            borderRadius: '8px',
          }}
        >
          <Bell size={48} color="#A31D1D" style={{ marginBottom: '15px' }} />
          <p style={{ color: '#A31D1D', fontSize: '16px' }}>
            No medication reminders set up yet.
          </p>
          <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
            Click "Add Reminder" to create your first reminder.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {reminders.map((reminder) => (
            <div
              key={reminder.reminder_id || reminder.id}
              style={{
                background: reminder.active ? 'white' : '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: reminder.active
                  ? '1px solid #D84040'
                  : '1px solid #dee2e6',
                opacity: reminder.active ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '10px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: '#A31D1D',
                        fontSize: '18px',
                        fontWeight: 'bold',
                      }}
                    >
                      {reminder.medication_name || reminder.medicationName}
                    </h3>
                    {!reminder.active && (
                      <span
                        style={{
                          background: '#6c757d',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px',
                    }}
                  >
                    <strong>Dosage:</strong> {reminder.dosage || 'N/A'}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px',
                    }}
                  >
                    <strong>Frequency:</strong>{' '}
                    {getFrequencyLabel(reminder.frequency || reminder.freq)}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      color: '#666',
                      marginBottom: '5px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Clock size={14} />
                    <strong>Time:</strong>{' '}
                    {reminder.reminder_time || reminder.time || 'N/A'}
                  </div>
                  {reminder.special_instructions && (
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#666',
                        marginTop: '10px',
                        padding: '10px',
                        background: '#F8F2DE',
                        borderRadius: '4px',
                        fontStyle: 'italic',
                      }}
                    >
                      <strong>Instructions:</strong>{' '}
                      {reminder.special_instructions}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      color: '#666',
                    }}
                  >
                    {getSoundIcon(reminder.sound_preference || 'default')}
                    <span>
                      {reminder.sound_preference || 'default'} sound
                    </span>
                  </div>
                  {reminder.browser_notifications && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#28a745',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <CheckCircle size={14} />
                      Notifications ON
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => toggleReminderActive(reminder)}
                      style={{
                        padding: '6px 12px',
                        background: reminder.active ? '#6c757d' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {reminder.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEditReminder(reminder)}
                      style={{
                        padding: '6px 12px',
                        background: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteReminder(
                          reminder.reminder_id || reminder.id
                        )
                      }
                      style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      ) : (
        /* Refill Requests Tab */
        <>
          {/* Search */}
          <div style={{ marginBottom: '20px', position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c757d',
              }}
            />
            <input
              type="text"
              placeholder="Search medications or facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '1px solid #ced4da',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* My Medications List */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '15px', color: '#A31D1D', fontSize: '18px' }}>
              My Medications
            </h3>
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {filteredMedications.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  No medications found
                </div>
              ) : (
                filteredMedications.map((med) => (
                  <div
                    key={med.medication_id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #e9ecef',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '20px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '18px' }}>
                          {med.medication_name}
                        </h3>
                        {med.is_art && (
                          <span style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#e3f2fd', 
                            color: '#1565c0', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ART
                          </span>
                        )}
                        {med.is_eligible_for_refill && (
                          <span style={{ 
                            padding: '4px 8px', 
                            backgroundColor: '#ffc107', 
                            color: '#333', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            ⚠️ Eligible for Refill
                          </span>
                        )}
                        {med.estimated_remaining_pills !== null && med.estimated_remaining_pills !== undefined && (
                          <span style={{ 
                            padding: '4px 8px', 
                            backgroundColor: med.estimated_remaining_pills <= 10 ? '#dc3545' : '#28a745', 
                            color: 'white', 
                            borderRadius: '4px', 
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {med.estimated_remaining_pills} pills remaining
                          </span>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                          <Pill size={16} />
                          <span>{med.generic_name || med.medication_name}</span>
                        </div>
                        {med.strength && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                            <span>Strength: {med.strength}</span>
                          </div>
                        )}
                        {med.form && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                            <span>Form: {med.form}</span>
                          </div>
                        )}
                      </div>

                      {/* Reminder Information */}
                      {med.reminder && (
                        <div style={{ 
                          marginBottom: '10px', 
                          padding: '10px', 
                          background: '#F8F2DE', 
                          borderRadius: '4px',
                          border: '1px solid #ECDCBF'
                        }}>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#A31D1D', 
                            marginBottom: '8px' 
                          }}>
                            Reminder Information
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '13px', color: '#495057' }}>
                            {med.reminder.dosage && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <strong>Dosage:</strong> {med.reminder.dosage}
                              </div>
                            )}
                            {med.reminder.frequency && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <strong>Frequency:</strong> {getFrequencyLabel(med.reminder.frequency)}
                              </div>
                            )}
                            {med.reminder.reminder_time && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Clock size={14} />
                                <strong>Time:</strong> {med.reminder.reminder_time}
                              </div>
                            )}
                            {med.reminder.active !== false && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <CheckCircle size={14} color="#28a745" />
                                <span style={{ color: '#28a745' }}>Active</span>
                              </div>
                            )}
                            {med.reminder.browser_notifications && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <Bell size={14} color="#17a2b8" />
                                <span>Notifications ON</span>
                              </div>
                            )}
                          </div>
                          {med.reminder.special_instructions && (
                            <div style={{ 
                              marginTop: '8px', 
                              padding: '8px', 
                              background: 'white', 
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontStyle: 'italic',
                              color: '#666'
                            }}>
                              <strong>Instructions:</strong> {med.reminder.special_instructions}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Prescription Information */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                        {med.prescription?.next_refill && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057', fontSize: '13px' }}>
                            <Calendar size={16} />
                            <span><strong>Next Refill:</strong> {med.prescription.next_refill}</span>
                          </div>
                        )}
                        {med.days_since_last_dispense !== null && med.days_since_last_dispense !== undefined && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057', fontSize: '13px' }}>
                            <span><strong>Days since last dispense:</strong> {med.days_since_last_dispense}</span>
                          </div>
                        )}
                        {med.adherence_percentage > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057', fontSize: '13px' }}>
                            <span><strong>Adherence:</strong> {med.adherence_percentage}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                      <button
                        onClick={() => openRefillModal(med)}
                        style={{
                          padding: '8px 16px',
                          background: '#D84040',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Package size={16} />
                        Request Refill
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Refill Requests List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#A31D1D', fontSize: '18px' }}>
                My Refill Requests
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openDispenseEventsModal();
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    zIndex: 10,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#138496';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#17a2b8';
                  }}
                >
                  <Package size={16} />
                  Select from Dispense Events
                </button>
                {currentUser && (currentUser.role === 'case manager' || currentUser.role === 'admin') && (
                  <button
                    onClick={() => navigate('/medications?tab=refills')}
                    style={{
                      padding: '8px 16px',
                      background: '#D84040',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <ExternalLink size={16} />
                    View All Requests (Case Manager)
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                background: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              }}
            >
              {filteredRefillRequests.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                  No refill requests found. Click "Request Refill" on your medications to submit a new request.
                </div>
              ) : (
                filteredRefillRequests.map((request) => (
                  <div
                    key={request.refill_id}
                    style={{
                      padding: '20px',
                      borderBottom: '1px solid #e9ecef',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '15px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '18px' }}>
                            {request.medication_name}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                            <Pill size={16} />
                            <span>{request.quantity} {request.unit}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                            <Calendar size={16} />
                            <span>Pickup: {new Date(request.pickup_date || request.preferred_pickup_date).toLocaleDateString()}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#495057' }}>
                            <MapPin size={16} />
                            <span>{request.facility_name}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6c757d', fontSize: '14px' }}>
                          <Clock size={16} />
                          <span>Submitted: {new Date(request.submitted_at || request.created_at).toLocaleString()}</span>
                        </div>
                        
                        {request.notes && (
                          <div style={{ marginTop: '10px', fontStyle: 'italic', color: '#6c757d' }}>
                            "{request.notes}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, color: '#A31D1D' }}>Add Reminder</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                }}
              >
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Medication Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={newReminder.medication_name}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    medication_name: e.target.value,
                  })
                }
                placeholder="Enter medication name"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#A31D1D',
                  }}
                >
                  Dosage
                </label>
                <input
                  type="text"
                  value={newReminder.dosage}
                  onChange={(e) =>
                    setNewReminder({ ...newReminder, dosage: e.target.value })
                  }
                  placeholder="e.g., 1 tablet"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#A31D1D',
                  }}
                >
                  Frequency
                </label>
                <select
                  value={newReminder.frequency}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      frequency: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                >
                  <option value="Once daily">Once Daily</option>
                  <option value="Twice daily">Twice Daily</option>
                  <option value="Three times daily">Three Times Daily</option>
                  <option value="Four times daily">Four Times Daily</option>
                  <option value="As needed">As Needed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Reminder Time <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                value={newReminder.reminder_time}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    reminder_time: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Sound Preference
              </label>
              <select
                value={newReminder.sound_preference}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    sound_preference: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="default">Default</option>
                <option value="gentle">Gentle</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={newReminder.browser_notifications}
                  onChange={(e) =>
                    setNewReminder({
                      ...newReminder,
                      browser_notifications: e.target.checked,
                    })
                  }
                />
                <span style={{ color: '#A31D1D', fontWeight: 'bold' }}>
                  Enable Browser Notifications
                </span>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Special Instructions (Optional)
              </label>
              <textarea
                value={newReminder.special_instructions}
                onChange={(e) =>
                  setNewReminder({
                    ...newReminder,
                    special_instructions: e.target.value,
                  })
                }
                placeholder="e.g., Take with food"
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '8px 16px',
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddReminder}
                style={{
                  padding: '8px 16px',
                  background: '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Create Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Reminder Modal */}
      {showEditModal && editingReminder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ margin: 0, color: '#A31D1D' }}>Edit Reminder</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReminder(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px',
                }}
              >
                <X size={24} color="#A31D1D" />
              </button>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Medication Name <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={editingReminder.medication_name || editingReminder.medicationName || ''}
                onChange={(e) =>
                  setEditingReminder({
                    ...editingReminder,
                    medication_name: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#A31D1D',
                  }}
                >
                  Dosage
                </label>
                <input
                  type="text"
                  value={editingReminder.dosage || ''}
                  onChange={(e) =>
                    setEditingReminder({
                      ...editingReminder,
                      dosage: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '5px',
                    fontWeight: 'bold',
                    color: '#A31D1D',
                  }}
                >
                  Frequency
                </label>
                <select
                  value={editingReminder.frequency || editingReminder.freq || 'Once daily'}
                  onChange={(e) =>
                    setEditingReminder({
                      ...editingReminder,
                      frequency: e.target.value,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                  }}
                >
                  <option value="Once daily">Once Daily</option>
                  <option value="Twice daily">Twice Daily</option>
                  <option value="Three times daily">Three Times Daily</option>
                  <option value="Four times daily">Four Times Daily</option>
                  <option value="As needed">As Needed</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Reminder Time <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="time"
                value={editingReminder.reminder_time || editingReminder.time || '09:00'}
                onChange={(e) =>
                  setEditingReminder({
                    ...editingReminder,
                    reminder_time: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Sound Preference
              </label>
              <select
                value={editingReminder.sound_preference || 'default'}
                onChange={(e) =>
                  setEditingReminder({
                    ...editingReminder,
                    sound_preference: e.target.value,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                }}
              >
                <option value="default">Default</option>
                <option value="gentle">Gentle</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={editingReminder.browser_notifications !== false}
                  onChange={(e) =>
                    setEditingReminder({
                      ...editingReminder,
                      browser_notifications: e.target.checked,
                    })
                  }
                />
                <span style={{ color: '#A31D1D', fontWeight: 'bold' }}>
                  Enable Browser Notifications
                </span>
              </label>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#A31D1D',
                }}
              >
                Special Instructions (Optional)
              </label>
              <textarea
                value={editingReminder.special_instructions || ''}
                onChange={(e) =>
                  setEditingReminder({
                    ...editingReminder,
                    special_instructions: e.target.value,
                  })
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingReminder(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#ECDCBF',
                  color: '#A31D1D',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReminder}
                style={{
                  padding: '8px 16px',
                  background: '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Update Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refill Request Modal */}
      {showRefillModal && selectedMedication && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Request Medication Refill</h3>
              <button
                onClick={() => {
                  setShowRefillModal(false);
                  setSelectedMedication(null);
                  setRefillForm({
                    medication_id: '',
                    prescription_id: '',
                    regimen_id: '',
                    quantity: '',
                    unit: 'tablets',
                    preferred_pickup_date: '',
                    preferred_pickup_time: '',
                    facility_id: '',
                    patient_notes: '',
                    remaining_pill_count: '',
                    pills_per_day: '1',
                    kulang_explanation: ''
                  });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Medication *
                </label>
                <input
                  type="text"
                  value={selectedMedication?.medication_name || ''}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
              </div>

              {/* Remaining Pill Count - REQUIRED */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 500 }}>
                    Remaining Pill Count * <span style={{ color: '#dc3545' }}>(Required)</span>
                  </label>
                  {(selectedDispenseEvent || (selectedMedication?.prescription?.prescription_id && patientId && selectedMedication?.medication_id)) && (
                    <button
                      type="button"
                      onClick={async () => {
                        // Fetch remaining pills
                        setLoading(true);
                        try {
                          const prescriptionId = selectedDispenseEvent?.prescription_id || selectedMedication?.prescription?.prescription_id;
                          const medicationId = selectedDispenseEvent?.medication_id || selectedMedication?.medication_id;
                          
                          if (prescriptionId && patientId && medicationId) {
                            const token = getAuthToken();
                            const response = await fetch(
                              `${API_BASE_URL}/refill-requests/calculate-remaining/${patientId}/${medicationId}?prescription_id=${prescriptionId}`,
                              {
                                headers: {
                                  ...(token && { Authorization: `Bearer ${token}` }),
                                },
                              }
                            );
                            
                            const data = await response.json();
                            
                            if (data.success && data.data?.estimated_remaining !== null && data.data?.estimated_remaining !== undefined) {
                              setRefillForm({
                                ...refillForm,
                                remaining_pill_count: data.data.estimated_remaining.toString(),
                                pills_per_day: (data.data.pills_per_day || refillForm.pills_per_day || '1').toString(),
                              });
                              setToast({
                                message: `✅ Fetched remaining pills: ${data.data.estimated_remaining} pills`,
                                type: 'success',
                              });
                            } else {
                              setToast({
                                message: 'Could not calculate remaining pills. Please enter manually.',
                                type: 'warning',
                              });
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching remaining pills:', error);
                          setToast({
                            message: 'Error fetching remaining pills. Please enter manually.',
                            type: 'error',
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                      style={{
                        padding: '6px 12px',
                        background: loading ? '#6c757d' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      <Package size={12} />
                      {loading ? 'Fetching...' : 'Fetch Remaining Pills'}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={refillForm.remaining_pill_count}
                  onChange={(e) => {
                    setRefillForm({ 
                      ...refillForm, 
                      remaining_pill_count: e.target.value,
                    });
                  }}
                  placeholder={refillForm.remaining_pill_count ? refillForm.remaining_pill_count : "e.g., 8"}
                  min="0"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: refillForm.remaining_pill_count ? '2px solid #28a745' : '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: refillForm.remaining_pill_count ? '#f0fff4' : '#f8f9fa',
                    fontWeight: refillForm.remaining_pill_count ? '600' : 'normal',
                  }}
                />
                {refillForm.remaining_pill_count && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#e7f3ff', borderRadius: '4px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
                      <strong>Current Remaining Pills:</strong> 
                      <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0066cc' }}>
                        {refillForm.remaining_pill_count} {refillForm.unit || 'pills'}
                      </span>
                    </div>
                    <div style={{ color: parseInt(refillForm.remaining_pill_count) <= 10 ? '#28a745' : '#ffc107', fontWeight: '600' }}>
                      {parseInt(refillForm.remaining_pill_count) <= 10 
                        ? '✅ Eligible for refill (≤10 pills)' 
                        : '⚠️ Not eligible for refill (>10 pills remaining)'}
                    </div>
                  </div>
                )}
                {!refillForm.remaining_pill_count && (
                  <small style={{ color: '#6c757d', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                    💡 Click "Fetch Remaining Pills" to auto-calculate based on dispense history and adherence, or enter manually
                  </small>
                )}
              </div>

              {/* Pills Per Day */}
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Pills Per Day *
                </label>
                <input
                  type="number"
                  value={refillForm.pills_per_day}
                  onChange={(e) => setRefillForm({ ...refillForm, pills_per_day: e.target.value })}
                  placeholder="e.g., 1"
                  min="1"
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                />
              </div>

              {/* Pill Status Explanation (if kulang) */}
              {refillForm.remaining_pill_count && (() => {
                const remaining = parseInt(refillForm.remaining_pill_count) || 0;
                const pillsPerDay = parseInt(refillForm.pills_per_day) || 1;
                const daysSinceLastPickup = 30;
                const expectedPills = daysSinceLastPickup * pillsPerDay;
                const isKulang = remaining < expectedPills - 5;
                
                return isKulang ? (
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                      Explanation for Low Pill Count * <span style={{ color: '#dc3545' }}>(Required)</span>
                    </label>
                    <textarea
                      value={refillForm.kulang_explanation}
                      onChange={(e) => setRefillForm({ ...refillForm, kulang_explanation: e.target.value })}
                      placeholder="Please explain why you have fewer pills than expected..."
                      required
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ced4da',
                        borderRadius: '4px',
                        fontSize: '14px',
                        minHeight: '80px',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                ) : null;
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Quantity Requested *
                  </label>
                  <input
                    type="number"
                    value={refillForm.quantity}
                    onChange={(e) => setRefillForm({ ...refillForm, quantity: e.target.value })}
                    placeholder="e.g., 30"
                    min="1"
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Unit *
                  </label>
                  <select
                    value={refillForm.unit}
                    onChange={(e) => setRefillForm({ ...refillForm, unit: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="ml">ML</option>
                    <option value="vials">Vials</option>
                    <option value="units">Units</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Preferred Pickup Date * <span style={{ color: '#dc3545' }}>(Future only)</span>
                  </label>
                  <input
                    type="date"
                    value={refillForm.preferred_pickup_date}
                    onChange={(e) => setRefillForm({ ...refillForm, preferred_pickup_date: e.target.value })}
                    min={(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toISOString().split('T')[0];
                    })()}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                    Preferred Pickup Time <span style={{ color: '#6c757d' }}>(Hourly only)</span>
                  </label>
                  <input
                    type="time"
                    value={refillForm.preferred_pickup_time}
                    onChange={(e) => {
                      const time = e.target.value;
                      const [hours, minutes] = time.split(':');
                      if (minutes !== '00' && minutes !== '') {
                        setToast({
                          message: 'Time must be on the hour (e.g., 09:00, 10:00)',
                          type: 'error',
                        });
                        return;
                      }
                      setRefillForm({ ...refillForm, preferred_pickup_time: time });
                    }}
                    step="3600"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontSize: '14px',
                    }}
                  />
                  <small style={{ color: '#6c757d', fontSize: '12px' }}>Only hourly slots (e.g., 09:00, 10:00)</small>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Pickup Facility *
                </label>
                <select
                  value={refillForm.facility_id}
                  onChange={(e) => setRefillForm({ ...refillForm, facility_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select a facility</option>
                  {facilities.map((facility) => (
                    <option key={facility.facility_id} value={facility.facility_id}>
                      {facility.facility_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: 500 }}>
                  Patient Notes
                </label>
                <textarea
                  value={refillForm.patient_notes}
                  onChange={(e) => setRefillForm({ ...refillForm, patient_notes: e.target.value })}
                  placeholder="Any additional notes or special instructions..."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ced4da',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowRefillModal(false);
                  setSelectedMedication(null);
                  setRefillForm({
                    medication_id: '',
                    prescription_id: '',
                    regimen_id: '',
                    quantity: '',
                    unit: 'tablets',
                    preferred_pickup_date: '',
                    preferred_pickup_time: '',
                    facility_id: '',
                    patient_notes: '',
                    remaining_pill_count: '',
                    pills_per_day: '1',
                    kulang_explanation: ''
                  });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRefillRequest}
                style={{
                  padding: '10px 20px',
                  background: '#D84040',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispense Events Selection Modal */}
      {showDispenseEventsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '12px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Select Dispense Event for Refill Request</h3>
              <button
                onClick={() => {
                  setShowDispenseEventsModal(false);
                  setDispenseEvents([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {dispenseEvents.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                <Package size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                <p>No dispense events found. Medications must be dispensed first.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {dispenseEvents.map((event) => (
                  <div
                    key={event.dispense_id}
                    onClick={() => selectDispenseEventForRefill(event)}
                    style={{
                      padding: '20px',
                      border: '1px solid #e9ecef',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      background: selectedDispenseEvent?.dispense_id === event.dispense_id ? '#F8F2DE' : 'white',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedDispenseEvent?.dispense_id !== event.dispense_id) {
                        e.currentTarget.style.background = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#D84040';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedDispenseEvent?.dispense_id !== event.dispense_id) {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#e9ecef';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', color: '#A31D1D' }}>
                            {event.medication_name}
                          </h4>
                          {event.generic_name && (
                            <span style={{ color: '#6c757d', fontSize: '14px' }}>
                              ({event.generic_name})
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '10px', fontSize: '14px', color: '#495057' }}>
                          <div>
                            <strong>Dosage:</strong> {event.dosage || 'N/A'}
                          </div>
                          <div>
                            <strong>Frequency:</strong> {event.frequency || 'N/A'}
                          </div>
                          <div>
                            <strong>Form:</strong> {event.form || 'N/A'}
                          </div>
                          {event.strength && (
                            <div>
                              <strong>Strength:</strong> {event.strength}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', fontSize: '13px', color: '#6c757d' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            <span><strong>Dispensed:</strong> {new Date(event.dispensed_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <strong>Quantity:</strong> {event.quantity_dispensed} {event.form === 'tablet' ? 'tablets' : event.form === 'capsule' ? 'capsules' : 'units'}
                          </div>
                          {event.facility_name && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <MapPin size={14} />
                              <span>{event.facility_name}</span>
                            </div>
                          )}
                          {event.prescription_number && (
                            <div>
                              <strong>Rx #:</strong> {event.prescription_number}
                            </div>
                          )}
                        </div>

                        {event.dispense_notes && (
                          <div style={{ marginTop: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '4px', fontSize: '13px', fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {event.dispense_notes}
                          </div>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectDispenseEventForRefill(event);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: '#D84040',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Request Refill
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor:
              toast.type === 'success'
                ? '#28a745'
                : toast.type === 'error'
                ? '#A31D1D'
                : '#17a2b8',
            color: 'white',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 10000,
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px' }}>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default MedicationReminders;

