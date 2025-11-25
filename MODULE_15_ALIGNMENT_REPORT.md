# Module 15: ART Regimen Management - Alignment Report

**Date:** Generated on analysis  
**Status:** ❌ **MAJOR MISALIGNMENT DETECTED**

---

## Executive Summary

Module 15 (ART Regimen Management) is **NOT aligned** with the current implementation. The database schema, backend routes, and frontend implementation do not match the requirements specified in `DATABASE_STRUCTURE.md`.

---

## 1. Database Schema Alignment

### ❌ **CRITICAL MISMATCH**

#### **Current SQL Schema** (`myhub (3) (1).sql`):

**Table 1: `art_regimens`** (Reference/Catalog Table)
```sql
CREATE TABLE `art_regimens` (
  `regimen_id` char(36) NOT NULL,
  `regimen_name` varchar(150) NOT NULL,
  `regimen_code` varchar(50) DEFAULT NULL,
  `line` enum('first_line','second_line','third_line','other') DEFAULT 'first_line',
  `components` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`components`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp()
)
```
- **Purpose:** Reference table for ART regimen types (catalog)
- **Missing:** Patient-specific fields, provider, facility, status tracking

**Table 2: `patient_art_history`**
```sql
CREATE TABLE `patient_art_history` (
  `history_id` char(36) NOT NULL,
  `patient_id` char(36) NOT NULL,
  `regimen_id` char(36) NOT NULL,  -- FK to art_regimens (reference table)
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `reason_for_change` text DEFAULT NULL,
  `outcome` enum('ongoing','completed','discontinued','transferred_out','died') DEFAULT 'ongoing',
  `recorded_by` char(36) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp()
)
```
- **Purpose:** Patient ART history tracking
- **Missing:** Detailed drug tracking, pill dispensing, adherence metrics

#### **Required Schema** (from `DATABASE_STRUCTURE.md` Module 15):

**Table 1: `art_regimens`** (Patient-Specific Regimen Table)
```sql
CREATE TABLE `art_regimens` (
  `regimen_id` UUID PRIMARY KEY,
  `patient_id` UUID NOT NULL,  -- ❌ MISSING
  `provider_id` UUID NOT NULL,  -- ❌ MISSING
  `facility_id` UUID NOT NULL,  -- ❌ MISSING
  `start_date` DATE NOT NULL,
  `stop_date` DATE,  -- ❌ MISSING
  `status` ENUM('active', 'stopped', 'changed') DEFAULT 'active',  -- ❌ MISSING
  `stop_reason` TEXT,  -- ❌ MISSING
  `change_reason` TEXT,  -- ❌ MISSING
  `notes` TEXT,  -- ❌ MISSING
  `created_at` TIMESTAMPTZ DEFAULT NOW(),
  `updated_at` TIMESTAMPTZ DEFAULT NOW()  -- ❌ MISSING
)
```

**Table 2: `art_regimen_drugs`** (Drugs in Regimen)
```sql
CREATE TABLE `art_regimen_drugs` (
  `regimen_drug_id` UUID PRIMARY KEY,
  `regimen_id` UUID NOT NULL,  -- ❌ TABLE DOES NOT EXIST
  `medication_id` UUID NOT NULL,
  `drug_name` VARCHAR(200) NOT NULL,
  `dosage` VARCHAR(50) NOT NULL,
  `pills_per_day` INTEGER NOT NULL,
  `pills_dispensed` INTEGER DEFAULT 0,
  `pills_remaining` INTEGER DEFAULT 0,
  `missed_doses` INTEGER DEFAULT 0,
  `last_dispensed_date` DATE,
  `created_at` TIMESTAMPTZ DEFAULT NOW()
)
```
- **Status:** ❌ **TABLE DOES NOT EXIST**

**Table 3: `art_regimen_history`** (Detailed History Tracking)
```sql
CREATE TABLE `art_regimen_history` (
  `history_id` UUID PRIMARY KEY,
  `regimen_id` UUID NOT NULL,  -- ❌ TABLE DOES NOT EXIST
  `action_type` ENUM('started', 'stopped', 'changed', 'drug_added', 'drug_removed', 'pills_dispensed', 'dose_missed') NOT NULL,
  `action_date` DATE DEFAULT CURRENT_DATE,
  `previous_status` VARCHAR(50),
  `new_status` VARCHAR(50),
  `details` JSONB,
  `performed_by` UUID NOT NULL,
  `notes` TEXT,
  `created_at` TIMESTAMPTZ DEFAULT NOW()
)
```
- **Status:** ❌ **TABLE DOES NOT EXIST** (Current `patient_art_history` is different structure)

### **Schema Comparison Summary:**

| Component | Current SQL | Required (Module 15) | Status |
|-----------|-------------|---------------------|--------|
| `art_regimens` | Reference table (catalog) | Patient-specific regimen table | ❌ **MISMATCH** |
| `art_regimen_drugs` | ❌ Does not exist | Drug tracking per regimen | ❌ **MISSING** |
| `art_regimen_history` | `patient_art_history` (different structure) | Detailed action history | ❌ **MISMATCH** |

---

## 2. Backend Implementation

### ❌ **NO BACKEND ROUTES FOUND**

**Current Status:**
- No `backend/routes/art-regimens.js` file exists
- No ART regimen endpoints registered in `backend/server.js`
- No API integration for ART regimen management

**Required Endpoints** (based on Module 15 requirements):

```javascript
// Required: backend/routes/art-regimens.js
GET    /api/art-regimens                    // List all regimens (with filters)
GET    /api/art-regimens/:id                // Get single regimen with drugs
GET    /api/art-regimens/patient/:patientId // Get regimens for patient
POST   /api/art-regimens                    // Start new regimen
PUT    /api/art-regimens/:id                // Update regimen
PUT    /api/art-regimens/:id/stop           // Stop regimen
PUT    /api/art-regimens/:id/change         // Change regimen
POST   /api/art-regimens/:id/dispense       // Dispense pills
POST   /api/art-regimens/:id/missed-dose    // Record missed dose
GET    /api/art-regimens/:id/history        // Get regimen history
```

**Status:** ❌ **NOT IMPLEMENTED**

---

## 3. Frontend Implementation

### ⚠️ **PARTIAL IMPLEMENTATION (DUMMY DATA ONLY)**

**Current Status:**
- ✅ Component exists: `frontend/src/components/ArtRegimentManagement.jsx`
- ❌ Uses **dummy/mock data** (hardcoded arrays)
- ❌ **No API integration** - no fetch calls to backend
- ❌ **No real database operations**

**Component Analysis:**
```javascript
// Lines 30-122: Uses dummy data
const dummyPatients = [...];
const dummyInventory = [...];
const dummyRegimens = [...];

// Lines 198-216: handleAddRegimen - only updates local state
setRegimens([...regimens, newRegimen]);  // ❌ No API call

// Lines 219-238: handleStopRegimen - only updates local state
setRegimens(updatedRegimens);  // ❌ No API call
```

**Required Integration:**
- Connect to `/api/art-regimens` endpoints
- Fetch real patient data from `/api/patients`
- Fetch real medication data from `/api/medications?is_art=true`
- Implement proper error handling and loading states
- Add form validation

**Status:** ⚠️ **UI EXISTS BUT NOT FUNCTIONAL**

---

## 4. System Flow Alignment

### ❌ **FLOWS NOT IMPLEMENTED**

#### **Required Flow 1: Start ART Regimen** (Module 15.1)
```
Current: ❌ Not implemented
Required:
  1. Physician selects patient → query patients (D2)
  2. Select medications → query medications (D4) where is_art = true
  3. Enter regimen details → create regimen → save to art_regimens (D15)
  4. Add drugs → save to art_regimen_drugs (D15)
  5. Create history entry → save to art_regimen_history (D15) with action_type = 'started'
  6. Log audit entry to audit_log (D8)
```

#### **Required Flow 2: Dispense ART Pills** (Module 15.2)
```
Current: ❌ Not implemented
Required:
  1. Nurse selects regimen → query art_regimens + art_regimen_drugs (D15)
  2. Enter quantity dispensed → update pills_dispensed and pills_remaining
  3. Update last_dispensed_date = CURRENT_DATE
  4. Create history entry → save to art_regimen_history (D15) with action_type = 'pills_dispensed'
  5. Check inventory → update medication_inventory (D4) if needed
  6. Log audit entry to audit_log (D8)
```

#### **Required Flow 3: Stop/Change Regimen** (Module 15.3)
```
Current: ❌ Not implemented
Required:
  1. Physician selects regimen → query art_regimens (D15)
  2. Enter stop/change reason → update status, stop_date, stop_reason/change_reason
  3. Create history entry → save to art_regimen_history (D15) with action_type = 'stopped' or 'changed'
  4. If changed → create new regimen → link to previous regimen
  5. Log audit entry to audit_log (D8)
```

#### **Required Flow 4: Track Missed Dose** (Module 15.4)
```
Current: ❌ Not implemented
Required:
  1. Patient reports missed dose OR system detects missed dose → update art_regimen_drugs.missed_doses
  2. Create history entry → save to art_regimen_history (D15) with action_type = 'dose_missed'
  3. Update ARPA risk score → trigger P2.4 (ARPA calculation)
  4. Log to audit_log (D8)
```

---

## 5. Data Retrieval Points Alignment

### ❌ **MISMATCHES IDENTIFIED**

| Data Store | Current Usage | Required Usage (Module 15) | Status |
|------------|---------------|----------------------------|--------|
| **D2 (Patients)** | ❌ Not queried | Query patients for regimen context | ❌ Missing |
| **D4 (Medications)** | ❌ Not queried | Query medications where `is_art = true` | ❌ Missing |
| **D15 (ART Regimens)** | ❌ Tables don't match | `art_regimens`, `art_regimen_drugs`, `art_regimen_history` | ❌ Mismatch |
| **D8 (Audit Log)** | ❌ Not logged | All ART regimen events should be logged | ❌ Missing |

---

## 6. Cross-Module Integration

### ❌ **INTEGRATIONS NOT IMPLEMENTED**

1. **ARPA Risk Calculation (P2.4)**
   - **Required:** ART regimen data should be used in ARPA risk calculation
   - **Current:** `backend/services/arpaService.js` references `art_regimen_drugs` but table doesn't exist
   - **Status:** ❌ Will fail if called

2. **Medication Inventory (Module 4)**
   - **Required:** Dispensing ART pills should update inventory
   - **Current:** No integration
   - **Status:** ❌ Missing

3. **Medication Adherence (Module 4)**
   - **Required:** Missed doses should update adherence tracking
   - **Current:** No integration
   - **Status:** ❌ Missing

---

## 7. Recommendations

### **Priority 1: Database Schema Alignment** 🔴 **CRITICAL**

1. **Create new patient-specific `art_regimens` table:**
   ```sql
   -- Migration needed: Create patient-specific art_regimens table
   -- Keep existing art_regimens as art_regimen_catalog (reference table)
   ```

2. **Create `art_regimen_drugs` table:**
   ```sql
   -- New table for tracking drugs per regimen
   ```

3. **Create `art_regimen_history` table:**
   ```sql
   -- New table for detailed action history
   -- Can keep patient_art_history for backward compatibility or migrate
   ```

### **Priority 2: Backend Implementation** 🔴 **CRITICAL**

1. **Create `backend/routes/art-regimens.js`** with all required endpoints
2. **Register route in `backend/server.js`**
3. **Implement business logic:**
   - Start regimen
   - Dispense pills
   - Stop/change regimen
   - Track missed doses
   - History tracking

### **Priority 3: Frontend Integration** 🟡 **HIGH**

1. **Replace dummy data with API calls:**
   - Fetch from `/api/art-regimens`
   - Fetch patients from `/api/patients`
   - Fetch medications from `/api/medications?is_art=true`

2. **Implement proper error handling and loading states**

3. **Add form validation**

### **Priority 4: Integration Testing** 🟡 **MEDIUM**

1. **Test ARPA integration** with ART regimen data
2. **Test inventory updates** when dispensing pills
3. **Test adherence tracking** with missed doses

---

## 8. Migration Strategy

### **Option A: Add New Tables (Recommended)**
- Keep existing `art_regimens` as `art_regimen_catalog` (reference)
- Create new patient-specific tables as specified in Module 15
- Migrate data from `patient_art_history` to new structure if needed

### **Option B: Modify Existing Tables**
- Modify `art_regimens` to be patient-specific (breaking change)
- Create `art_regimen_drugs` and `art_regimen_history`
- Update all references

---

## 9. Summary

| Component | Status | Alignment |
|-----------|--------|-----------|
| **Database Schema** | ❌ | **0%** - Tables don't match requirements |
| **Backend Routes** | ❌ | **0%** - No routes exist |
| **Frontend Component** | ⚠️ | **30%** - UI exists but uses dummy data |
| **System Flows** | ❌ | **0%** - No flows implemented |
| **Cross-Module Integration** | ❌ | **0%** - No integrations |

### **Overall Alignment: 6%** ❌

---

## 10. Next Steps

1. ✅ **Review this alignment report**
2. 🔴 **Create database migration** for Module 15 tables
3. 🔴 **Implement backend routes** (`backend/routes/art-regimens.js`)
4. 🟡 **Update frontend** to use real API calls
5. 🟡 **Test integrations** with ARPA, inventory, and adherence
6. 🟢 **Update documentation** once aligned

---

**Report Generated:** Based on analysis of:
- `DATABASE_STRUCTURE.md` (Module 15 requirements)
- `myhub (3) (1).sql` (current database schema)
- `backend/routes/` (backend implementation)
- `frontend/src/components/ArtRegimentManagement.jsx` (frontend implementation)

