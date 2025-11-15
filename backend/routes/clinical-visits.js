import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';

const router = express.Router();

/* ---------------- HELPERS ---------------- */
function clean(obj) {
  const cleaned = {};
  for (const key in obj) {
    cleaned[key] = obj[key] === undefined ? null : obj[key];
  }
  return cleaned;
}

const validVisitTypes = [
  'initial',
  'follow_up',
  'emergency',
  'routine',
  'art_pickup',
];
const validWhoStages = [
  'Stage 1',
  'Stage 2',
  'Stage 3',
  'Stage 4',
  'Not Applicable',
];
const validDiagnosisTypes = [
  'primary',
  'secondary',
  'differential',
  'rule_out',
];

/* ---------------- GET ALL VISITS ---------------- */
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT cv.*, CONCAT(p.first_name,' ',p.last_name) AS patientName
      FROM clinical_visits cv
      JOIN patients p ON cv.patient_id = p.patient_id
      ORDER BY cv.visit_date DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch visits' });
  }
});

/* ---------------- GET SINGLE VISIT + RELATED ---------------- */
router.get('/:id', async (req, res) => {
  try {
    const visitId = req.params.id;

    const [visitRows] = await db.query(
      `
      SELECT cv.*, 
             CONCAT(p.first_name,' ',p.last_name) AS patientName,
             CONCAT(u.first_name,' ',u.last_name) AS providerName,
             f.name AS facilityName
      FROM clinical_visits cv
      JOIN patients p ON cv.patient_id = p.patient_id
      JOIN users u ON cv.provider_id = u.user_id
      JOIN facilities f ON cv.facility_id = f.facility_id
      WHERE cv.visit_id = ?
    `,
      [visitId]
    );

    if (!visitRows.length)
      return res.status(404).json({ error: 'Visit not found' });
    const visit = visitRows[0];

    const [vitals] = await db.query(
      'SELECT * FROM vital_signs WHERE visit_id = ?',
      [visitId]
    );
    const [diagnoses] = await db.query(
      'SELECT * FROM diagnoses WHERE visit_id = ?',
      [visitId]
    );
    const [procedures] = await db.query(
      'SELECT * FROM procedures WHERE visit_id = ?',
      [visitId]
    );

    visit.vital_signs = vitals;
    visit.diagnoses = diagnoses;
    visit.procedures = procedures;

    res.json(visit);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch visit' });
  }
});

/* ---------------- CREATE VISIT ---------------- */
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const body = clean(req.body);
    const visit_id = uuidv4();

    // VALIDATE
    if (!validVisitTypes.includes(body.visit_type))
      throw new Error('Invalid visit_type');
    if (body.who_stage && !validWhoStages.includes(body.who_stage))
      throw new Error('Invalid who_stage');

    // INSERT VISIT
    await conn.execute(
      `
      INSERT INTO clinical_visits (
        visit_id, patient_id, provider_id, facility_id, visit_date,
        visit_type, who_stage, chief_complaint, clinical_notes,
        assessment, plan, follow_up_date, follow_up_reason
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,
      [
        visit_id,
        body.patient_id,
        body.provider_id,
        body.facility_id,
        body.visit_date,
        body.visit_type,
        body.who_stage,
        body.chief_complaint,
        body.clinical_notes,
        body.assessment,
        body.plan,
        body.follow_up_date,
        body.follow_up_reason,
      ]
    );

    // INSERT VITAL SIGNS (optional)
    if (body.vital_signs) {
      const vs = clean(body.vital_signs);
      await conn.execute(
        `
        INSERT INTO vital_signs (
          vital_id, visit_id, height_cm, weight_kg, bmi,
          systolic_bp, diastolic_bp, pulse_rate, temperature_c,
          respiratory_rate, oxygen_saturation, recorded_by
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `,
        [
          uuidv4(),
          visit_id,
          vs.height_cm,
          vs.weight_kg,
          vs.bmi,
          vs.systolic_bp,
          vs.diastolic_bp,
          vs.pulse_rate,
          vs.temperature_c,
          vs.respiratory_rate,
          vs.oxygen_saturation,
          body.provider_id,
        ]
      );
    }

    // INSERT DIAGNOSES (optional array)
    if (Array.isArray(body.diagnoses)) {
      for (let d of body.diagnoses) {
        if (d.diagnosis_type && !validDiagnosisTypes.includes(d.diagnosis_type))
          throw new Error('Invalid diagnosis_type');
        const diag = clean(d);
        await conn.execute(
          `
          INSERT INTO diagnoses (
            diagnosis_id, visit_id, icd10_code, diagnosis_description,
            diagnosis_type, is_chronic, onset_date, resolved_date
          ) VALUES (?,?,?,?,?,?,?,?)
        `,
          [
            uuidv4(),
            visit_id,
            diag.icd10_code,
            diag.diagnosis_description,
            diag.diagnosis_type || 'primary',
            diag.is_chronic || false,
            diag.onset_date,
            diag.resolved_date,
          ]
        );
      }
    }

    // INSERT PROCEDURES (optional array)
    if (Array.isArray(body.procedures)) {
      for (let p of body.procedures) {
        const proc = clean(p);
        await conn.execute(
          `
          INSERT INTO procedures (
            procedure_id, visit_id, cpt_code, procedure_name,
            procedure_description, outcome, performed_at
          ) VALUES (?,?,?,?,?,?,?)
        `,
          [
            uuidv4(),
            visit_id,
            proc.cpt_code,
            proc.procedure_name,
            proc.procedure_description,
            proc.outcome,
            proc.performed_at,
          ]
        );
      }
    }

    await conn.commit();

    const [result] = await conn.query(
      `
      SELECT * FROM clinical_visits WHERE visit_id = ?
    `,
      [visit_id]
    );

    res.status(201).json(result[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to create visit' });
  } finally {
    conn.release();
  }
});

/* ---------------- UPDATE VISIT ---------------- */
router.put('/:id', async (req, res) => {
  try {
    const body = clean(req.body);
    const visitId = req.params.id;

    if (body.visit_type && !validVisitTypes.includes(body.visit_type))
      return res.status(400).json({ error: 'Invalid visit_type' });
    if (body.who_stage && !validWhoStages.includes(body.who_stage))
      return res.status(400).json({ error: 'Invalid who_stage' });

    await db.execute(
      `
      UPDATE clinical_visits SET
        provider_id=?, facility_id=?, visit_date=?, visit_type=?, who_stage=?,
        chief_complaint=?, clinical_notes=?, assessment=?, plan=?,
        follow_up_date=?, follow_up_reason=?, updated_at=CURRENT_TIMESTAMP
      WHERE visit_id=?
    `,
      [
        body.provider_id,
        body.facility_id,
        body.visit_date,
        body.visit_type,
        body.who_stage,
        body.chief_complaint,
        body.clinical_notes,
        body.assessment,
        body.plan,
        body.follow_up_date,
        body.follow_up_reason,
        visitId,
      ]
    );

    const [rows] = await db.query(
      'SELECT * FROM clinical_visits WHERE visit_id=?',
      [visitId]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

/* ---------------- DELETE VISIT ---------------- */
router.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM clinical_visits WHERE visit_id=?', [
      req.params.id,
    ]);
    res.json({ message: 'Visit deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

export default router;
