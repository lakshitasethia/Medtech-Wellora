-- Wellora seed data — GENERATED from src/data/mockData.js. Do not hand-edit.
-- Apply AFTER schema.sql and rls.sql.
-- Runs as the postgres role in the SQL editor, which bypasses RLS.

begin;

-- ============ patients ============
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8942', 'Eleanor Vance', 48, 'Female', 'A+', '+1 (555) 234-8901', 'eleanor.vance@example.com', '742 Evergreen Terrace, Ward 4, Sector B', 'Thomas Vance (Spouse) - +1 (555) 998-1122',
  ARRAY['Penicillin','Sulfa Drugs','Shellfish']::text[], ARRAY['Hypertension','Type 2 Diabetes Mellitus']::text[], 'ICU - Bed 04', 'Critical', '09:00 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8943', 'Marcus Thorne', 62, 'Male', 'O+', '+1 (555) 887-3412', 'm.thorne@example.com', '128 Skyline Boulevard, Suite 4A', 'Rachel Thorne (Daughter) - +1 (555) 443-2211',
  ARRAY['Aspirin','Codeine']::text[], ARRAY['Coronary Artery Disease','Hyperlipidemia']::text[], 'Ward A - Bed 12', 'Urgent', '10:00 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8944', 'Sophia Lin', 29, 'Female', 'B+', '+1 (555) 341-9082', 'sophia.lin@example.com', '420 Innovation Way, Apt 8C', 'David Lin (Father) - +1 (555) 776-9001',
  ARRAY['None Known']::text[], ARRAY['Asthma']::text[], 'Outpatient', 'Routine', '02:15 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8945', 'Arthur Pendelton', 71, 'Male', 'AB+', '+1 (555) 662-7710', 'a.pendelton@example.com', '9 Harbour Court, Sector C', 'Margaret Pendelton (Spouse) - +1 (555) 662-7711',
  ARRAY['Iodine Contrast']::text[], ARRAY['Congestive Heart Failure','Atrial Fibrillation']::text[], 'ICU - Bed 01', 'Critical', '08:15 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8946', 'Clara Oswald', 34, 'Female', 'O-', '+1 (555) 220-4417', 'c.oswald@example.com', '16 Blackfriars Lane, Apt 2B', 'Dan Oswald (Brother) - +1 (555) 220-4418',
  ARRAY['Latex']::text[], ARRAY['Post-Operative Recovery']::text[], 'ICU - Bed 02', 'Urgent', '08:45 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8947', 'Rajesh Gupta', 58, 'Male', 'B-', '+1 (555) 771-2093', 'r.gupta@example.com', '88 Meridian Park Road', 'Priya Gupta (Spouse) - +1 (555) 771-2094',
  ARRAY['None Known']::text[], ARRAY['Type 2 Diabetes Mellitus','Diabetic Nephropathy']::text[], 'Ward A - Bed 14', 'Urgent', '11:00 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8948', 'Fatima Al-Rashid', 45, 'Female', 'A-', '+1 (555) 308-6621', 'f.alrashid@example.com', '23 Crescent Gardens', 'Omar Al-Rashid (Spouse) - +1 (555) 308-6622',
  ARRAY['Ibuprofen','NSAIDs']::text[], ARRAY['Migraine with Aura','Iron Deficiency Anaemia']::text[], 'Outpatient', 'Routine', '11:30 AM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8949', 'Daniel Okafor', 66, 'Male', 'O+', '+1 (555) 419-8873', 'd.okafor@example.com', '301 Kingsway Avenue', 'Grace Okafor (Daughter) - +1 (555) 419-8874',
  ARRAY['Penicillin']::text[], ARRAY['COPD','Hypertension']::text[], 'Ward A - Bed 15', 'Urgent', '12:00 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8950', 'Mei Tanaka', 52, 'Female', 'A+', '+1 (555) 553-9012', 'm.tanaka@example.com', '77 Lantern Way', 'Kenji Tanaka (Spouse) - +1 (555) 553-9013',
  ARRAY['None Known']::text[], ARRAY['Hypothyroidism','Hyperlipidaemia']::text[], 'Outpatient', 'Routine', '12:30 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8951', 'Thomas Reyes', 39, 'Male', 'B+', '+1 (555) 884-1156', 't.reyes@example.com', '5 Foundry Street, Unit 12', 'Ana Reyes (Sister) - +1 (555) 884-1157',
  ARRAY['Morphine']::text[], ARRAY['Anxiety Disorder']::text[], 'Outpatient', 'Routine', '01:00 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8952', 'Helen Whitfield', 78, 'Female', 'O+', '+1 (555) 226-3388', 'h.whitfield@example.com', 'Rosewood Care Home, Room 14', 'Peter Whitfield (Son) - +1 (555) 226-3389',
  ARRAY['Codeine','Tramadol']::text[], ARRAY['Osteoporosis','Hypertension','Mild Cognitive Impairment']::text[], 'Ward B - Bed 03', 'Urgent', '01:30 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8953', 'Jonas Berg', 55, 'Male', 'AB-', '+1 (555) 990-4471', 'j.berg@example.com', '142 Northgate Terrace', 'Lise Berg (Spouse) - +1 (555) 990-4472',
  ARRAY['None Known']::text[], ARRAY['Hypertension','Obstructive Sleep Apnoea']::text[], 'Outpatient', 'Urgent', '02:45 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8954', 'Amara Nwosu', 27, 'Female', 'A+', '+1 (555) 145-7729', 'a.nwosu@example.com', '60 Willow Bank, Flat 5', 'Chidi Nwosu (Brother) - +1 (555) 145-7730',
  ARRAY['Peanuts']::text[], ARRAY['Sickle Cell Trait']::text[], 'Outpatient', 'Routine', '03:15 PM'
) on conflict (id) do nothing;
insert into patients (id, full_name, age, gender, blood_type, phone, email, address, emergency_contact, allergies, chronic_conditions, room_bed, triage_priority, appointment_time) values (
  'WEL-8955', 'Victor Almeida', 63, 'Male', 'O-', '+1 (555) 337-2214', 'v.almeida@example.com', '19 Sandpiper Close', 'Sofia Almeida (Spouse) - +1 (555) 337-2215',
  ARRAY['Statins (myalgia)']::text[], ARRAY['Previous Myocardial Infarction','Hypertension']::text[], 'Ward A - Bed 16', 'Critical', '03:45 PM'
) on conflict (id) do nothing;

-- ============ vitals ============
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8942', now() - interval '0 hours', 148, 92, 88, 98.6, 96, 18);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8942', now() - interval '6 hours', 152, 95, 92, 98.8, 95, 20);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8942', now() - interval '12 hours', 142, 88, 84, 98.4, 97, 16);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8943', now() - interval '0 hours', 135, 85, 74, 98.2, 98, 16);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8944', now() - interval '0 hours', 118, 74, 68, 98.4, 99, 14);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8945', now() - interval '0 hours', 165, 98, 118, 99.1, 91, 24);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8945', now() - interval '6 hours', 158, 94, 110, 98.9, 93, 22);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8945', now() - interval '12 hours', 150, 90, 102, 98.6, 94, 20);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8946', now() - interval '0 hours', 112, 70, 92, 100.4, 96, 18);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8946', now() - interval '6 hours', 108, 68, 88, 99.8, 97, 17);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8947', now() - interval '0 hours', 146, 90, 82, 98.5, 97, 17);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8947', now() - interval '6 hours', 141, 86, 78, 98.3, 98, 16);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8948', now() - interval '0 hours', 122, 78, 76, 98.4, 99, 15);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8949', now() - interval '0 hours', 154, 92, 96, 98.9, 92, 22);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8949', now() - interval '6 hours', 149, 88, 90, 98.7, 93, 21);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8950', now() - interval '0 hours', 128, 82, 70, 98.2, 98, 15);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8951', now() - interval '0 hours', 134, 84, 94, 98.6, 99, 18);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8952', now() - interval '0 hours', 158, 86, 84, 97.9, 95, 18);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8952', now() - interval '6 hours', 162, 88, 88, 98.1, 95, 19);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8953', now() - interval '0 hours', 150, 94, 80, 98.5, 96, 17);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8953', now() - interval '6 hours', 147, 91, 78, 98.4, 96, 16);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8954', now() - interval '0 hours', 114, 72, 72, 98.3, 99, 14);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8955', now() - interval '0 hours', 168, 100, 104, 98.8, 94, 21);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8955', now() - interval '6 hours', 159, 95, 98, 98.6, 95, 19);
insert into vitals (patient_id, recorded_at, bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, respiratory_rate) values ('WEL-8955', now() - interval '12 hours', 151, 90, 92, 98.5, 96, 18);

-- ============ prescriptions ============
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8942', 'Lisinopril', '20mg', 'Once daily (Morning)', '30 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8942', 'Metformin', '500mg', 'Twice daily (Meals)', '60 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8942', 'Atorvastatin', '10mg', 'Once daily (Bedtime)', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8943', 'Clopidogrel', '75mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8943', 'Rosuvastatin', '20mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8944', 'Albuterol Inhaler', '90mcg', 'As needed for dyspnea', '180 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8945', 'Furosemide', '40mg', 'Twice daily', '30 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8945', 'Apixaban', '5mg', 'Twice daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8946', 'Cefazolin', '1g', 'Three times daily (IV)', '5 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8946', 'Paracetamol', '1g', 'Four times daily PRN', '7 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8947', 'Insulin Glargine', '24 units', 'Once nightly', 'Ongoing', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8947', 'Ramipril', '10mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8948', 'Sumatriptan', '50mg', 'As needed at onset', '60 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8948', 'Ferrous Sulfate', '200mg', 'Twice daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8949', 'Tiotropium', '18mcg', 'Once daily (inhaled)', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8949', 'Amlodipine', '10mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8950', 'Levothyroxine', '100mcg', 'Once daily (fasting)', '180 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8950', 'Simvastatin', '20mg', 'Once daily (bedtime)', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8951', 'Sertraline', '50mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8952', 'Alendronic Acid', '70mg', 'Once weekly', '180 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8952', 'Bisoprolol', '2.5mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8953', 'Losartan', '50mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8954', 'Folic Acid', '5mg', 'Once daily', '180 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8955', 'Aspirin', '75mg', 'Once daily', 'Ongoing', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8955', 'Ezetimibe', '10mg', 'Once daily', '90 Days', 'Active');
insert into prescriptions (patient_id, drug, dose, frequency, duration, status) values ('WEL-8955', 'Glyceryl Trinitrate', '400mcg', 'Sublingual PRN', '90 Days', 'Active');

-- ============ lab_results ============
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8942', 'Lipid Profile & Cholesterol', 'Total: 245 mg/dL (Elevated)', 'Flagged', 'Aug 10, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8942', '12-Lead ECG Waveform Scan', 'ST Depression (1.8mm downsloping)', 'Flagged', 'Aug 08, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8942', 'HbA1c Blood Test', '6.8% (Controlled)', 'Normal', 'Jul 25, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8943', 'Coronary Calcium CT Scan', 'Agatston Score: 420 (Severe Calcification)', 'Flagged', 'Aug 11, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8944', 'Routine Pulmonary Function', 'FEV1/FVC: 82% (Normal)', 'Normal', 'Jul 15, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8945', 'BNP (Heart Failure Marker)', '1,240 pg/mL (Markedly Elevated)', 'Flagged', 'Aug 13, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8945', 'Serum Creatinine', '1.9 mg/dL (Elevated)', 'Flagged', 'Aug 13, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8946', 'White Cell Count', '14.2 x10⁹/L (Raised)', 'Flagged', 'Aug 14, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8947', 'HbA1c Blood Test', '9.4% (Poorly Controlled)', 'Flagged', 'Aug 12, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8947', 'eGFR', '48 mL/min (Stage 3a CKD)', 'Flagged', 'Aug 12, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8948', 'Full Blood Count', 'Hb 10.2 g/dL (Low)', 'Flagged', 'Aug 09, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8949', 'Arterial Blood Gas', 'pO2 62 mmHg (Hypoxaemic)', 'Flagged', 'Aug 13, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8950', 'Thyroid Function (TSH)', '3.1 mIU/L (Normal)', 'Normal', 'Aug 07, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8950', 'Lipid Profile', 'Total: 218 mg/dL (Borderline)', 'Normal', 'Aug 07, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8951', '12-Lead ECG', 'Sinus rhythm, no acute changes', 'Normal', 'Aug 14, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8951', 'Troponin I', '< 0.01 ng/mL (Negative)', 'Normal', 'Aug 14, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8952', 'Hip X-Ray', 'No acute fracture. Marked osteopenia.', 'Normal', 'Aug 13, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8952', 'Vitamin D', '18 nmol/L (Deficient)', 'Flagged', 'Aug 13, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8953', 'Exercise Tolerance Test', '1.4mm ST depression at 7 METs', 'Flagged', 'Aug 11, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8953', 'Lipid Profile', 'Total: 254 mg/dL (Elevated)', 'Flagged', 'Aug 11, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8954', 'Haemoglobin Electrophoresis', 'HbAS pattern confirmed', 'Normal', 'Aug 06, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8955', 'Troponin I', '0.42 ng/mL (Elevated)', 'Flagged', 'Aug 14, 2026'::date);
insert into lab_results (patient_id, test_name, result, status, resulted_at) values ('WEL-8955', '12-Lead ECG', '2.2mm ST depression, leads V3-V6', 'Flagged', 'Aug 14, 2026'::date);

-- ============ consultation_notes ============
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8942', 'Patient reports intermittent retrosternal chest tightness radiating to left shoulder during moderate exertion.', 'BP 148/92 mmHg, HR 88 bpm. ECG shows 1.8mm ST segment depression in leads V4-V6.', 'High risk of coronary artery ischemia. ML Heart Risk Classifier computed 78% risk score.', 'Admit to ICU Bed 04. Stat Troponin I, emergency coronary angiogram scheduled for 14:00.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8943', 'Post angioplasty follow-up consultation.', 'Stable vitals, clear lung fields.', 'Post-PCI recovery progressing well.', 'Continue antiplatelet therapy. Cardiac rehab starting next week.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8944', 'Annual wellness visit.', 'Vitals normal.', 'Mild intermittent asthma.', 'Renew rescue inhaler prescription.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8945', 'Increasing dyspnoea on minimal exertion, orthopnoea requiring three pillows overnight.', 'BP 165/98, HR 118 irregularly irregular, SpO2 91% on room air. Bibasal crepitations.', 'Acute decompensated heart failure with rapid AF. Renal function declining.', 'IV diuresis, rate control, strict fluid balance, daily U&E. Cardiology review twice daily.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8946', 'Day 2 post laparoscopic appendicectomy. Reports moderate incisional pain.', 'Temp 100.4°F, WCC 14.2. Wound sites clean, no discharge.', 'Low-grade post-operative pyrexia, likely inflammatory. Infection not excluded.', 'Continue IV antibiotics, repeat WCC in 24h, encourage early mobilisation.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8947', 'Reports polyuria and fatigue over six weeks. Admits poor dietary adherence.', 'HbA1c 9.4%, eGFR 48. BP 146/90.', 'Poorly controlled T2DM with progressive diabetic nephropathy.', 'Escalate insulin, dietitian referral, nephrology review in 4 weeks.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8948', 'Migraine frequency increased to three episodes weekly. Persistent fatigue.', 'Hb 10.2 g/dL, ferritin low. Neurological examination unremarkable.', 'Migraine with aura, likely exacerbated by iron deficiency anaemia.', 'Continue iron replacement, headache diary, review in 8 weeks.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8949', 'Productive cough with increased sputum volume over four days.', 'SpO2 92% room air, RR 22, widespread expiratory wheeze.', 'Infective exacerbation of COPD on background of hypertension.', 'Nebulised bronchodilators, controlled oxygen therapy, non-penicillin antibiotic.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8950', 'Routine six-monthly review. Energy levels stable, no cold intolerance.', 'TSH within range on current replacement dose. Lipids borderline.', 'Euthyroid on levothyroxine. Hyperlipidaemia adequately controlled.', 'Continue current therapy. Repeat lipids and TFTs in six months.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8951', 'Recurrent episodes of chest tightness and palpitations, associated with work stress.', 'ECG sinus rhythm. Troponin negative. Chest wall tender on palpation.', 'Non-cardiac chest pain, likely anxiety-related with musculoskeletal component.', 'Reassurance, continue sertraline, CBT referral. Safety-net advice given.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8952', 'Mechanical fall at care home. No loss of consciousness reported by staff.', 'BP 158/86. No fracture on imaging. Vitamin D deficient. Steady with frame.', 'Mechanical fall, multifactorial. Uncontrolled hypertension contributing.', 'Vitamin D replacement, falls team referral, review antihypertensive dosing.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8953', 'Exertional breathlessness climbing stairs. Loud snoring reported by partner.', 'BP 150/94. ETT positive at 7 METs. Cholesterol 254 mg/dL. BMI 34.', 'Probable stable angina on background of untreated OSA and hypertension.', 'Start statin, sleep study referral, CT coronary angiogram requested.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8954', 'Attends for pre-conception counselling regarding sickle cell trait.', 'Well. Observations normal. Electrophoresis confirms HbAS.', 'Sickle cell trait, asymptomatic. Partner screening indicated.', 'Genetic counselling referral, continue folic acid, partner testing arranged.');
insert into consultation_notes (patient_id, subjective, objective, assessment, plan) values ('WEL-8955', 'Crushing central chest pain at rest for 40 minutes, radiating to jaw. Diaphoretic.', 'BP 168/100, HR 104. ECG 2.2mm ST depression V3-V6. Troponin 0.42 rising.', 'Non-ST elevation myocardial infarction. High ischaemic risk.', 'Dual antiplatelet loading, IV nitrate, urgent inpatient coronary angiography.');

-- ============ ml_assessments ============
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8942', 78, 'High Risk', 'seed-import', '{"age":48,"sex":0,"cp":2,"trestbps":148,"chol":245,"fbs":1,"restecg":1,"thalach":132,"exang":1,"oldpeak":1.8,"slope":2,"ca":2,"thal":3}'::jsonb, ARRAY['ST Depression (1.8mm) indicates myocardial stress','Elevated Total Cholesterol (245 mg/dL)','Exercise-Induced Angina positive','Fasting Blood Sugar > 120 mg/dL']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8943', 62, 'Moderate-High Risk', 'seed-import', '{"age":62,"sex":1,"cp":1,"trestbps":135,"chol":210,"fbs":0,"restecg":0,"thalach":145,"exang":0,"oldpeak":0.8,"slope":1,"ca":1,"thal":2}'::jsonb, ARRAY['Age factor (>60 yrs)','Previous CAD history','Moderate Coronary Calcium score']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8944', 12, 'Low Risk', 'seed-import', '{"age":29,"sex":0,"cp":0,"trestbps":118,"chol":175,"fbs":0,"restecg":0,"thalach":172,"exang":0,"oldpeak":0,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['Optimal Blood Pressure','Low Resting HR','No Ischemic Markers']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8945', 91, 'Critical Risk', 'seed-import', '{"age":71,"sex":1,"cp":3,"trestbps":165,"chol":268,"fbs":1,"restecg":1,"thalach":118,"exang":1,"oldpeak":2.6,"slope":2,"ca":3,"thal":3}'::jsonb, ARRAY['Severe ST Depression (2.6mm)','Advanced age (>70 yrs) with CHF history','Resting tachycardia with rapid AF','Elevated Total Cholesterol (268 mg/dL)']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8946', 18, 'Low Risk', 'seed-import', '{"age":34,"sex":0,"cp":0,"trestbps":112,"chol":182,"fbs":0,"restecg":0,"thalach":168,"exang":0,"oldpeak":0,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['No ischaemic markers','Normal blood pressure']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8947', 68, 'Moderate-High Risk', 'seed-import', '{"age":58,"sex":1,"cp":1,"trestbps":146,"chol":232,"fbs":1,"restecg":1,"thalach":138,"exang":0,"oldpeak":1.2,"slope":2,"ca":1,"thal":2}'::jsonb, ARRAY['Uncontrolled fasting blood sugar','Systolic hypertension (146 mmHg)','Moderate ST depression (1.2mm)']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8948', 22, 'Low Risk', 'seed-import', '{"age":45,"sex":0,"cp":0,"trestbps":122,"chol":196,"fbs":0,"restecg":0,"thalach":160,"exang":0,"oldpeak":0.2,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['No significant ischaemic markers detected']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8949', 74, 'Moderate-High Risk', 'seed-import', '{"age":66,"sex":1,"cp":2,"trestbps":154,"chol":241,"fbs":0,"restecg":1,"thalach":128,"exang":1,"oldpeak":1.5,"slope":2,"ca":2,"thal":3}'::jsonb, ARRAY['Exercise-induced angina positive','Systolic hypertension (154 mmHg)','ST depression 1.5mm','Chronic hypoxaemia']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8950', 31, 'Low Risk', 'seed-import', '{"age":52,"sex":0,"cp":0,"trestbps":128,"chol":218,"fbs":0,"restecg":0,"thalach":152,"exang":0,"oldpeak":0.3,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['Borderline cholesterol (218 mg/dL)']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8951', 26, 'Low Risk', 'seed-import', '{"age":39,"sex":1,"cp":1,"trestbps":134,"chol":204,"fbs":0,"restecg":0,"thalach":164,"exang":0,"oldpeak":0.1,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['No ischaemic markers; negative troponin']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8952', 79, 'High Risk', 'seed-import', '{"age":78,"sex":0,"cp":2,"trestbps":158,"chol":252,"fbs":0,"restecg":1,"thalach":122,"exang":1,"oldpeak":1.9,"slope":2,"ca":2,"thal":3}'::jsonb, ARRAY['Advanced age (>75 yrs)','Significant ST depression (1.9mm)','Systolic hypertension (158 mmHg)','Elevated cholesterol (252 mg/dL)']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8953', 72, 'Moderate-High Risk', 'seed-import', '{"age":55,"sex":1,"cp":2,"trestbps":150,"chol":254,"fbs":0,"restecg":1,"thalach":134,"exang":1,"oldpeak":1.4,"slope":2,"ca":1,"thal":3}'::jsonb, ARRAY['Positive exercise tolerance test','Elevated cholesterol (254 mg/dL)','Systolic hypertension (150 mmHg)']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8954', 10, 'Low Risk', 'seed-import', '{"age":27,"sex":0,"cp":0,"trestbps":114,"chol":168,"fbs":0,"restecg":0,"thalach":178,"exang":0,"oldpeak":0,"slope":1,"ca":0,"thal":2}'::jsonb, ARRAY['Optimal blood pressure','No ischaemic markers']::text[]);
insert into ml_assessments (patient_id, risk_score, risk_category, model_version, input_snapshot, key_factors) values ('WEL-8955', 88, 'Critical Risk', 'seed-import', '{"age":63,"sex":1,"cp":3,"trestbps":168,"chol":276,"fbs":1,"restecg":1,"thalach":116,"exang":1,"oldpeak":2.2,"slope":2,"ca":3,"thal":3}'::jsonb, ARRAY['Severe ST depression (2.2mm) across anterolateral leads','Rising troponin with prior infarct history','Severe hypertension (168/100 mmHg)','Statin intolerance limiting lipid control']::text[]);

-- ============ beds ============
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-01', 'ICU', 'ICU-01', 'critical', 'WEL-8945', 'Heart Failure RVR') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-02', 'ICU', 'ICU-02', 'occupied', 'WEL-8946', 'Post-Op Monitoring') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-03', 'ICU', 'ICU-03', 'cleaning', null, 'Terminal Clean') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-04', 'ICU', 'ICU-04', 'critical', 'WEL-8942', 'Ischemia Alert') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-05', 'ICU', 'ICU-05', 'available', null, 'Ready for Admission') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-ICU-06', 'ICU', 'ICU-06', 'occupied', null, 'Ventilated - Sedation Hold') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-11', 'Ward A', 'WA-11', 'available', null, 'Ready for Admission') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-12', 'Ward A', 'WA-12', 'occupied', 'WEL-8943', 'Post-PCI Stable') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-13', 'Ward A', 'WA-13', 'cleaning', null, 'Discharge Clean') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-14', 'Ward A', 'WA-14', 'occupied', 'WEL-8947', 'Diabetic Nephropathy') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-15', 'Ward A', 'WA-15', 'occupied', 'WEL-8949', 'COPD Exacerbation') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WA-16', 'Ward A', 'WA-16', 'critical', 'WEL-8955', 'NSTEMI - Awaiting Angio') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-01', 'Ward B', 'WB-01', 'available', null, 'Ready for Admission') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-02', 'Ward B', 'WB-02', 'available', null, 'Ready for Admission') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-03', 'Ward B', 'WB-03', 'occupied', 'WEL-8952', 'Post-Fall Observation') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-04', 'Ward B', 'WB-04', 'occupied', null, 'Cellulitis - IV Antibiotics') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-05', 'Ward B', 'WB-05', 'cleaning', null, 'Terminal Clean') on conflict (id) do nothing;
insert into beds (id, ward, bed_number, status, patient_id, condition) values ('BED-WB-06', 'Ward B', 'WB-06', 'available', null, 'Ready for Admission') on conflict (id) do nothing;

-- ============ appointments ============
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8945', (current_date + time '08:15') at time zone 'UTC', 'Cardiology', 'Decompensated heart failure', 'In Consultation', 'Urgent');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8946', (current_date + time '08:45') at time zone 'UTC', 'Internal Med', 'Post-op pyrexia review', 'Completed', 'Follow-up');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8942', (current_date + time '09:00') at time zone 'UTC', 'Cardiology', 'Chest pain workup', 'In Consultation', 'Urgent');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8943', (current_date + time '10:00') at time zone 'UTC', 'Cardiology', 'Post-PCI checkup', 'Completed', 'Follow-up');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8947', (current_date + time '11:00') at time zone 'UTC', 'Internal Med', 'Diabetes escalation review', 'Completed', 'Follow-up');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8948', (current_date + time '11:30') at time zone 'UTC', 'Internal Med', 'Migraine and anaemia review', 'Completed', 'Routine');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8949', (current_date + time '12:00') at time zone 'UTC', 'Cardiology', 'COPD exacerbation review', 'Checked-In', 'Urgent');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8950', (current_date + time '12:30') at time zone 'UTC', 'Internal Med', 'Thyroid six-month review', 'Checked-In', 'Routine');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8951', (current_date + time '13:00') at time zone 'UTC', 'Internal Med', 'Chest pain - non-cardiac', 'Checked-In', 'Routine');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8952', (current_date + time '13:30') at time zone 'UTC', 'Cardiology', 'Post-fall assessment', 'Checked-In', 'Urgent');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8944', (current_date + time '14:15') at time zone 'UTC', 'Internal Med', 'Asthma inhaler refill', 'Scheduled', 'Routine');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8953', (current_date + time '14:45') at time zone 'UTC', 'Cardiology', 'Stable angina workup', 'Scheduled', 'Urgent');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8954', (current_date + time '15:15') at time zone 'UTC', 'Internal Med', 'Pre-conception counselling', 'Scheduled', 'Routine');
insert into appointments (patient_id, scheduled_at, department, reason, status, appt_type) values ('WEL-8955', (current_date + time '15:45') at time zone 'UTC', 'Cardiology', 'NSTEMI - urgent angiography', 'Scheduled', 'Urgent');

commit;

-- After creating the staff auth users and their profiles rows, link
-- patients to their assigned doctor by name:
--
--   update patients p set assigned_doctor_id = pr.id
--   from profiles pr where pr.full_name = 'Dr. Alexander Vance'
--     and p.id in ('WEL-8942','WEL-8943','WEL-8945','WEL-8949','WEL-8952','WEL-8953','WEL-8955');
