-- Wellora — Single Source of Truth EMR schema
-- Mirrors the shape of src/data/mockData.js so the frontend can switch
-- from the mock dataset to live queries without reshaping components.
--
-- Apply with:  supabase db push       (or paste into the SQL editor)

-- ============================================================
-- Enums
-- ============================================================
create type user_role       as enum ('admin', 'doctor', 'nurse', 'receptionist', 'patient');
create type triage_priority as enum ('Critical', 'Urgent', 'Routine');
create type bed_status      as enum ('available', 'occupied', 'critical', 'cleaning');
create type appt_status     as enum ('Scheduled', 'Checked-In', 'In Consultation', 'Completed', 'Cancelled');
create type rx_status       as enum ('Active', 'Completed', 'Discontinued');
create type lab_status      as enum ('Normal', 'Flagged');

-- ============================================================
-- profiles — one row per authenticated user, carries the role
-- ============================================================
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null,
  role        user_role not null,
  department  text,
  shift       text,
  status      text default 'On Duty',
  email       text,
  created_at  timestamptz not null default now()
);

-- Role lookup used by every RLS policy below. SECURITY DEFINER so the
-- policy can read profiles without recursively triggering its own policy.
create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- ============================================================
-- patients
-- ============================================================
create table patients (
  id                  text primary key,              -- e.g. 'WEL-8942'
  full_name           text not null,
  age                 int  not null check (age >= 0 and age < 130),
  gender              text,
  blood_type          text,
  phone               text,
  email               text,
  address             text,
  emergency_contact   text,
  allergies           text[] not null default '{}',
  chronic_conditions  text[] not null default '{}',
  assigned_doctor_id  uuid references profiles(id),
  room_bed            text,
  triage_priority     triage_priority not null default 'Routine',
  appointment_time    text,
  -- Links the record to the patient's own login, so a patient can be
  -- restricted to exactly their own row.
  portal_user_id      uuid unique references auth.users on delete set null,
  created_at          timestamptz not null default now()
);

create index on patients (assigned_doctor_id);
create index on patients (portal_user_id);

-- ============================================================
-- vitals — the realtime trigger for risk re-ranking
-- ============================================================
create table vitals (
  id             bigserial primary key,
  patient_id     text not null references patients(id) on delete cascade,
  recorded_by    uuid references profiles(id),
  recorded_at    timestamptz not null default now(),
  bp_systolic    int,
  bp_diastolic   int,
  heart_rate     int,
  temperature_f  numeric(4,1),
  spo2           int,
  respiratory_rate int
);

create index on vitals (patient_id, recorded_at desc);

-- ============================================================
-- prescriptions
-- ============================================================
create table prescriptions (
  id              bigserial primary key,
  patient_id      text not null references patients(id) on delete cascade,
  drug            text not null,
  dose            text not null,
  frequency       text not null,
  duration        text,
  status          rx_status not null default 'Active',
  prescribed_by   uuid references profiles(id),
  prescribed_at   timestamptz not null default now()
);

create index on prescriptions (patient_id, status);

-- ============================================================
-- lab_results
-- ============================================================
create table lab_results (
  id           bigserial primary key,
  patient_id   text not null references patients(id) on delete cascade,
  test_name    text not null,
  result       text not null,
  status       lab_status not null default 'Normal',
  resulted_at  timestamptz not null default now()
);

create index on lab_results (patient_id, resulted_at desc);

-- ============================================================
-- consultation_notes — SOAP as columns, not JSON, so it is queryable
-- ============================================================
create table consultation_notes (
  id            bigserial primary key,
  patient_id    text not null references patients(id) on delete cascade,
  author_id     uuid references profiles(id),
  subjective    text,
  objective     text,
  assessment    text,
  plan          text,
  created_at    timestamptz not null default now()
);

create index on consultation_notes (patient_id, created_at desc);

-- ============================================================
-- appointments
-- ============================================================
create table appointments (
  id            bigserial primary key,
  patient_id    text not null references patients(id) on delete cascade,
  doctor_id     uuid references profiles(id),
  scheduled_at  timestamptz not null,
  department    text,
  reason        text,
  status        appt_status not null default 'Scheduled',
  appt_type     text,
  created_at    timestamptz not null default now()
);

create index on appointments (scheduled_at);
create index on appointments (doctor_id, scheduled_at);

-- ============================================================
-- beds
-- ============================================================
create table beds (
  id           text primary key,               -- e.g. 'BED-ICU-01'
  ward         text not null,
  bed_number   text not null,
  status       bed_status not null default 'available',
  patient_id   text references patients(id) on delete set null,
  condition    text,
  updated_at   timestamptz not null default now()
);

create index on beds (ward, status);

-- ============================================================
-- ml_assessments — every score keeps its inputs and model version
-- ============================================================
create table ml_assessments (
  id             bigserial primary key,
  patient_id     text not null references patients(id) on delete cascade,
  risk_score     int  not null check (risk_score between 0 and 100),
  risk_category  text not null,
  model_version  text not null,
  -- Provenance: which vitals row the score was computed from, plus the
  -- exact feature vector sent to the model.
  source_vitals_id bigint references vitals(id),
  input_snapshot jsonb not null,
  key_factors    text[] not null default '{}',
  computed_by    uuid references profiles(id),
  computed_at    timestamptz not null default now()
);

create index on ml_assessments (patient_id, computed_at desc);

-- ============================================================
-- clinical_events — append-only unified timeline (Phase 3.2)
-- Every mutation elsewhere writes one row here.
-- ============================================================
create table clinical_events (
  id           bigserial primary key,
  patient_id   text not null references patients(id) on delete cascade,
  actor_id     uuid references profiles(id),
  actor_role   user_role not null,
  event_type   text not null,   -- 'check_in' | 'vitals' | 'note' | 'prescription' | 'lab' | 'ml_assessment' | 'bed_change'
  summary      text not null,
  payload      jsonb,
  created_at   timestamptz not null default now()
);

create index on clinical_events (patient_id, created_at desc);

-- ============================================================
-- Realtime — publish the tables the UI subscribes to
-- ============================================================
alter publication supabase_realtime add table vitals;
alter publication supabase_realtime add table clinical_events;
alter publication supabase_realtime add table beds;
alter publication supabase_realtime add table appointments;
