# MyHubCares - Sidebar Navigation by User Role

## 📋 Overview

This document details the sidebar navigation menu items available for each user role in the MyHubCares system. Items marked with ✨ **NEW** were added in recent updates.

---

## 👤 User Roles

| Role | Description | Menu Items |
|------|-------------|------------|
| **Admin** | System administrator with full access | 22 items |
| **Physician** | Medical doctor providing care | 13 items |
| **Nurse** | Nursing staff | 11 items |
| **Case Manager** | Patient care coordinator | 11 items |
| **Lab Personnel** | Laboratory technician | 6 items |
| **Patient** | Client/Patient user | 10 items |

---

## 🔐 Admin

Full system access with all management capabilities.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | Dashboard | 🏠 home | `#dashboard` | System overview & statistics |
| 2 | Patients | 👥 users | `#patients` | Patient management |
| 3 | ✨ **Doctor Availability** | 📅 calendar | `#doctor-availability` | **NEW** - Assign doctors, manage conflicts & locks |
| 4 | ✨ **Appointment Requests** | 📋 clipboard | `#appointment-requests` | **NEW** - Review & approve appointment requests |
| 5 | ✨ **Refill Requests** | 💊 pills | `#refill-requests` | **NEW** - Review & approve medication refills |
| 6 | Appointments | 📅 calendar | `#appointments` | Appointment scheduling |
| 7 | Clinical Visits | 📋 clipboard | `#visits` | Visit documentation |
| 8 | Inventory | 📦 package | `#inventory` | Medication stock management |
| 9 | Prescriptions | 📄 file-text | `#prescriptions` | Prescription management |
| 10 | ART Regimens | 💊 pills | `#art-regimen` | HIV treatment regimens |
| 11 | Vaccination Program | 💉 syringe | `#vaccinations` | Immunization tracking |
| 12 | Lab Tests | 📊 activity | `#lab-tests` | Laboratory orders & results |
| 13 | HTS Sessions | 🧪 test-tube | `#hts` | HIV Testing Services |
| 14 | Counseling | 💬 message-circle | `#counseling` | Counseling sessions |
| 15 | Referrals | 🔗 share | `#referrals` | Patient referrals |
| 16 | Care Tasks | ✅ check-square | `#care-tasks` | Task management |
| 17 | Satisfaction Surveys | ⭐ star | `#surveys` | Patient feedback |
| 18 | User Management | 👤+ user-plus | `#users` | System users |
| 19 | My Hub Cares Branches | 🏢 building | `#facilities` | Facility management |
| 20 | Audit Trail | 🛡️ shield | `#audit` | Activity logs |
| 21 | Reports | 📊 bar-chart | `#reports` | Analytics & reports |
| 22 | Education | 📚 book | `#education` | Health education modules |

---

## 👨‍⚕️ Physician

Clinical care provider with patient treatment capabilities.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | Dashboard | 🏠 home | `#dashboard` | Clinical overview |
| 2 | Patients | 👥 users | `#patients` | Patient list with ARPA risk |
| 3 | Appointments | 📅 calendar | `#appointments` | View appointments |
| 4 | Clinical Visits | 📋 clipboard | `#visits` | Document visits |
| 5 | Prescriptions | 📄 file-text | `#prescriptions` | Create/manage prescriptions |
| 6 | ART Regimens | 💊 pills | `#art-regimen` | Manage HIV treatment |
| 7 | Vaccination Program | 💉 syringe | `#vaccinations` | Immunizations |
| 8 | Lab Results | 📊 activity | `#lab-tests` | View lab results |
| 9 | Counseling | 💬 message-circle | `#counseling` | Counseling notes |
| 10 | Care Tasks | ✅ check-square | `#care-tasks` | Assigned tasks |
| 11 | Inventory | 📦 package | `#inventory` | View stock levels |
| 12 | My Activity Log | 🛡️ shield | `#audit` | Personal audit log |
| 13 | Education | 📚 book | `#education` | Patient education |

---

## 👩‍⚕️ Nurse

Nursing care and clinical support.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | Dashboard | 🏠 home | `#dashboard` | Daily overview |
| 2 | Patients | 👥 users | `#patients` | Patient list |
| 3 | Appointments | 📅 calendar | `#appointments` | Appointment management |
| 4 | Clinical Visits | 📋 clipboard | `#visits` | Vitals & documentation |
| 5 | Vaccination Program | 💉 syringe | `#vaccinations` | Administer vaccines |
| 6 | Inventory | 📦 package | `#inventory` | Stock management |
| 7 | Prescriptions | 📄 file-text | `#prescriptions` | View prescriptions |
| 8 | HTS Sessions | 🧪 test-tube | `#hts` | HIV testing |
| 9 | Care Tasks | ✅ check-square | `#care-tasks` | Nursing tasks |
| 10 | My Activity Log | 🛡️ shield | `#audit` | Personal audit log |
| 11 | Education | 📚 book | `#education` | Health education |

---

## 📋 Case Manager

Patient care coordination and approval workflows.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | Dashboard | 🏠 home | `#dashboard` | Pending requests overview |
| 2 | Patients | 👥 users | `#patients` | Assigned patients |
| 3 | ✨ **Appointment Requests** | 📋 clipboard | `#appointment-requests` | **NEW** - Approve/decline patient appointment requests |
| 4 | ✨ **Refill Requests** | 💊 pills | `#refill-requests` | **NEW** - Approve/decline medication refill requests |
| 5 | Appointments | 📅 calendar | `#appointments` | Appointment coordination |
| 6 | Counseling | 💬 message-circle | `#counseling` | Adherence counseling |
| 7 | Referrals | 🔗 share | `#referrals` | Manage referrals |
| 8 | Care Tasks | ✅ check-square | `#care-tasks` | Follow-up tasks |
| 9 | HTS Sessions | 🧪 test-tube | `#hts` | HIV testing coordination |
| 10 | My Activity Log | 🛡️ shield | `#audit` | Personal audit log |
| 11 | Education | 📚 book | `#education` | Patient education |

---

## 🔬 Lab Personnel

Laboratory test management.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | Dashboard | 🏠 home | `#dashboard` | Lab overview |
| 2 | Lab Tests | 📊 activity | `#lab-tests` | Order & enter results |
| 3 | HTS Sessions | 🧪 test-tube | `#hts` | HIV rapid testing |
| 4 | Patients | 👥 users | `#patients` | Patient lookup |
| 5 | My Activity Log | 🛡️ shield | `#audit` | Personal audit log |
| 6 | Education | 📚 book | `#education` | Lab protocols |

---

## 🧑‍🤝‍🧑 Patient

Patient self-service portal.

| # | Menu Item | Icon | Route | Description |
|---|-----------|------|-------|-------------|
| 1 | My Dashboard | 🏠 home | `#dashboard` | Personal health summary |
| 2 | My Profile | 👤 user | `#profile` | Personal information |
| 3 | Appointments | 📅 calendar | `#appointments` | Book & view appointments |
| 4 | ✨ **My Medications** | 💊 pills | `#my-medications` | **NEW** - Combined reminders & refill requests |
| 5 | My Vaccinations | 💉 syringe | `#vaccinations` | Vaccination records |
| 6 | Prescriptions | 📄 file-text | `#prescriptions` | View prescriptions |
| 7 | Lab Results | 📊 activity | `#lab-results` | View lab results |
| 8 | Feedback | ⭐ star | `#surveys` | Satisfaction surveys |
| 9 | My Activity Log | 🛡️ shield | `#audit` | Personal activity log |
| 10 | Health Education | 📚 book | `#education` | Educational materials |

---

## ✨ Recently Added Features

### 1. Doctor Availability Management
**Added to:** Admin Only

| Route | Description |
|-------|-------------|
| `#doctor-availability` | Admin assigns doctors to days, manages conflicts, and locks schedules |

**Features:**
- 📅 **Daily View**: Assign doctors to specific days with time slots
- 📆 **Weekly Overview**: 7-day calendar showing all doctor assignments
- ⚠️ **Conflicts & Agendas**: Record doctor unavailability (leave, meetings, training, etc.)
- 🔒 **Lock Protection**: Lock schedules to prevent modifications by others
- ⚙️ **Scheduling Settings**: Configure daily patient capacity, max slots per doctor, slot duration

**Key Rules:**
- No same-day booking (future dates only)
- Hourly intervals only (no 30-minute slots)
- Daily patient capacity limits
- Maximum slots per doctor per day
- Locked schedules cannot be edited except by Admin unlock

**Flow:**
```
Admin → Assign Doctor to Day → Set Time/Facility → Optionally Lock → Creates Availability Slots
```

---

### 2. Appointment Request Flow
**Added to:** Admin, Case Manager

| Route | Description |
|-------|-------------|
| `#appointment-requests` | Case Manager reviews and approves/declines patient appointment requests |

**Flow:**
```
Patient → Request Appointment (future date, hourly slots) → Case Manager Reviews → Approve/Decline → Patient Notified
```

**Key Rules:**
- No same-day booking (tomorrow minimum)
- Hourly time slots only
- Validates daily capacity and doctor max slots
- Appointments sorted newest on top

---

### 3. Medication Refill Request Flow
**Added to:** Admin, Case Manager

| Route | Description |
|-------|-------------|
| `#refill-requests` | Case Manager reviews and approves/declines medication refill requests |

**Flow:**
```
Patient → Request Refill (with pill count) → System validates (kulang/sakto/sobra) → Case Manager Reviews → Approve/Decline → Patient Notified
```

**Key Features:**
- 📊 **Pill Count Input**: Patient must report remaining pills
- 📉 **Kulang/Sakto/Sobra**: Automatic validation of pill status
- ⚠️ **Kulang Explanation**: Required explanation when pills are insufficient
- ✅ **10-Pill Eligibility**: Recommended refill when ≤10 pills remaining
- 🚫 **No Doctor Selection**: Refills processed by Treatment Partner only

---

### 4. My Medications (Combined View)
**Added to:** Patient

| Route | Description |
|-------|-------------|
| `#my-medications` | Unified view combining Medication Reminders + Refill Requests |

**Features:**
- 📊 Statistics: Active reminders, adherence rate, pending refills, ready pickups
- 🔔 **Reminders Tab**: Medication schedule, mark as taken
- 📦 **Refills Tab**: Submit requests, track status, view approvals

**Previously:**
- `#reminders` - Medication Reminders (separate)
- `#my-refills` - Refill Requests (separate)

**Now merged into:**
- `#my-medications` - Single unified page with tabs

---

## 📊 Feature Access Matrix

| Feature | Admin | Physician | Nurse | Case Manager | Lab | Patient |
|---------|:-----:|:---------:|:-----:|:------------:|:---:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Patients | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| ✨ Doctor Availability | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| ✨ Appointment Requests | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| ✨ Refill Requests | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Appointments | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| ✨ My Medications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Clinical Visits | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Prescriptions | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| ART Regimens | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vaccinations | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Lab Tests | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| HTS Sessions | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Counseling | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Referrals | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Care Tasks | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Surveys | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Facilities | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Trail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reports | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Education | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🔗 Related Files

| File | Description |
|------|-------------|
| `js/auth.js` | Navigation menu definitions (`getNavigationMenu()`) |
| `js/app.js` | Route handling (`loadPage()`) |
| `js/doctor-availability.js` | Admin doctor availability management module |
| `js/appointment-requests.js` | Appointment request module |
| `js/refill-requests.js` | Refill request module (with pill count validation) |
| `js/appointments.js` | Appointment scheduling (no same-day, hourly slots) |
| `js/reminders.js` | Medication reminders + My Medications page |

---

## 📚 Related Documentation

| Document | Description |
|----------|-------------|
| `SYSTEM_REQUIREMENTS_IMPLEMENTATION.md` | Complete implementation details of all system requirements |
| `APPOINTMENT_BOOKING_FLOW.md` | Detailed appointment booking workflow |
| `REFILL_REQUEST_FLOW.md` | Detailed refill request workflow |

---

*Document Version: 2.0*  
*Last Updated: December 2024*


