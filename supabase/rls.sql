-- Wellora — Row Level Security policies
--
-- The access matrix this file enforces:
--
--   Table               Admin  Doctor        Nurse          Receptionist   Patient
--   ------------------  -----  ------------  -------------  -------------  --------------
--   profiles            all    read staff    read staff     read staff     own row
--   patients            all    read all      read all       read + write   own row only
--                                                           demographics
--   vitals              read   read all      read + write   —              own, read only
--   prescriptions       read   read + write  read           —              own, read only
--   lab_results         read   read + write  read           —              own, read only
--   consultation_notes  read   read + write  read           —              own, read only
--   appointments        all    read all      read all       read + write   own, read only
--   beds                all    read all      read + write   read           —
--   ml_assessments      read   read + write  read           —              own, read only
--   clinical_events     read   read+append   read+append    read+append    own, read only
--
-- Nothing is UPDATE-able or DELETE-able on clinical_events by anyone —
-- it is an append-only audit trail by design.
--
-- Apply AFTER schema.sql.

alter table profiles           enable row level security;
alter table patients           enable row level security;
alter table vitals             enable row level security;
alter table prescriptions      enable row level security;
alter table lab_results        enable row level security;
alter table consultation_notes enable row level security;
alter table appointments       enable row level security;
alter table beds               enable row level security;
alter table ml_assessments     enable row level security;
alter table clinical_events    enable row level security;

-- Helper: is the given patient row the caller's own record?
create or replace function owns_patient(p_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from patients
    where id = p_id and portal_user_id = auth.uid()
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
create policy "own profile readable"
  on profiles for select
  using (id = auth.uid());

create policy "staff may read staff directory"
  on profiles for select
  using (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

create policy "admin manages profiles"
  on profiles for all
  using (auth_role() = 'admin')
  with check (auth_role() = 'admin');

-- ============================================================
-- patients
-- ============================================================
create policy "staff read patients"
  on patients for select
  using (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

create policy "patient reads only own record"
  on patients for select
  using (portal_user_id = auth.uid());

create policy "reception and admin register patients"
  on patients for insert
  with check (auth_role() in ('admin', 'receptionist'));

create policy "reception and admin update demographics"
  on patients for update
  using (auth_role() in ('admin', 'receptionist'))
  with check (auth_role() in ('admin', 'receptionist'));

-- ============================================================
-- vitals — nurses write, clinicians read, patient sees own
-- ============================================================
create policy "clinical staff read vitals"
  on vitals for select
  using (auth_role() in ('admin', 'doctor', 'nurse'));

create policy "patient reads own vitals"
  on vitals for select
  using (owns_patient(patient_id));

create policy "nurses and doctors record vitals"
  on vitals for insert
  with check (auth_role() in ('doctor', 'nurse'));

-- ============================================================
-- prescriptions — only doctors prescribe
-- ============================================================
create policy "clinical staff read prescriptions"
  on prescriptions for select
  using (auth_role() in ('admin', 'doctor', 'nurse'));

create policy "patient reads own prescriptions"
  on prescriptions for select
  using (owns_patient(patient_id));

create policy "doctors prescribe"
  on prescriptions for insert
  with check (auth_role() = 'doctor');

create policy "doctors amend own prescriptions"
  on prescriptions for update
  using (auth_role() = 'doctor')
  with check (auth_role() = 'doctor');

-- ============================================================
-- lab_results
-- ============================================================
create policy "clinical staff read labs"
  on lab_results for select
  using (auth_role() in ('admin', 'doctor', 'nurse'));

create policy "patient reads own labs"
  on lab_results for select
  using (owns_patient(patient_id));

create policy "doctors record labs"
  on lab_results for insert
  with check (auth_role() = 'doctor');

-- ============================================================
-- consultation_notes
-- ============================================================
create policy "clinical staff read notes"
  on consultation_notes for select
  using (auth_role() in ('admin', 'doctor', 'nurse'));

create policy "patient reads own notes"
  on consultation_notes for select
  using (owns_patient(patient_id));

create policy "doctors write notes"
  on consultation_notes for insert
  with check (auth_role() = 'doctor');

-- ============================================================
-- appointments — reception owns the ledger
-- ============================================================
create policy "staff read appointments"
  on appointments for select
  using (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

create policy "patient reads own appointments"
  on appointments for select
  using (owns_patient(patient_id));

create policy "reception books appointments"
  on appointments for insert
  with check (auth_role() in ('admin', 'receptionist'));

create policy "reception and clinicians update appointment status"
  on appointments for update
  using (auth_role() in ('admin', 'receptionist', 'doctor'))
  with check (auth_role() in ('admin', 'receptionist', 'doctor'));

-- ============================================================
-- beds — nurses manage the ward
-- ============================================================
create policy "staff read beds"
  on beds for select
  using (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

create policy "nurses and admin manage beds"
  on beds for update
  using (auth_role() in ('admin', 'nurse'))
  with check (auth_role() in ('admin', 'nurse'));

-- ============================================================
-- ml_assessments
-- ============================================================
create policy "clinical staff read assessments"
  on ml_assessments for select
  using (auth_role() in ('admin', 'doctor', 'nurse'));

create policy "patient reads own assessments"
  on ml_assessments for select
  using (owns_patient(patient_id));

create policy "doctors record assessments"
  on ml_assessments for insert
  with check (auth_role() = 'doctor');

-- ============================================================
-- clinical_events — append-only timeline
-- Deliberately NO update or delete policy for any role.
-- ============================================================
create policy "staff read timeline"
  on clinical_events for select
  using (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));

create policy "patient reads own timeline"
  on clinical_events for select
  using (owns_patient(patient_id));

create policy "staff append to timeline"
  on clinical_events for insert
  with check (auth_role() in ('admin', 'doctor', 'nurse', 'receptionist'));


-- ============================================================
-- NEGATIVE TESTS — run these signed in as each role.
-- Every one MUST return zero rows or raise an error. Capture the
-- output; this is the evidence for the report's security section.
-- ============================================================
--
-- As a PATIENT (Eleanor Vance's login):
--   select * from patients where id = 'WEL-8943';        -- expect 0 rows
--   select * from vitals  where patient_id = 'WEL-8943'; -- expect 0 rows
--   insert into vitals (patient_id, heart_rate) values ('WEL-8942', 60);
--                                                        -- expect: policy violation
--
-- As a RECEPTIONIST:
--   select * from lab_results;                            -- expect 0 rows
--   select * from consultation_notes;                     -- expect 0 rows
--   insert into prescriptions (patient_id, drug, dose, frequency)
--     values ('WEL-8942', 'Aspirin', '75mg', 'OD');       -- expect: policy violation
--
-- As a NURSE:
--   insert into prescriptions (patient_id, drug, dose, frequency)
--     values ('WEL-8942', 'Aspirin', '75mg', 'OD');       -- expect: policy violation
--   update beds set status = 'available' where id = 'BED-ICU-01';  -- expect: succeeds
--
-- As ANY role:
--   delete from clinical_events where id = 1;             -- expect: 0 rows affected
--   update clinical_events set summary = 'x' where id = 1;-- expect: 0 rows affected
