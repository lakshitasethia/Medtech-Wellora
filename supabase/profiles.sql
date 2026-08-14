-- Wellora — link the five auth users to roles.
-- Run in the SQL Editor AFTER schema.sql, rls.sql and seed.sql.
--
-- UUIDs below are the actual auth.users ids from this project. If you ever
-- delete and recreate a user, its UUID changes and this file must be updated.

begin;

insert into profiles (id, full_name, role, department, shift, email) values
  ('1b9763c3-721e-4902-a496-bc6ff1a54f69', 'Marcus Brody',        'admin',        'Operations',      'Administrative (09:00 - 18:00)', 'admin@wellora.med'),
  ('8f6e074b-cc4c-43af-8319-01512c980aa2', 'Dr. Alexander Vance', 'doctor',       'Cardiology',      'Day Shift (08:00 - 16:00)',      'doctor@wellora.med'),
  ('c0aa8ca3-34b2-406e-849e-3c6453d540df', 'Nurse Jessica Alba',  'nurse',        'ICU Ward',        'Morning Shift (07:00 - 15:00)',  'nurse@wellora.med'),
  ('21f9c04b-4705-4f68-9187-828ba77407d0', 'Elena Rostova',       'receptionist', 'Front Desk',      'Full Day (08:00 - 17:00)',       'receptionist@wellora.med'),
  ('ce4e8a7a-052d-443e-9d4a-8f40415353b7', 'Eleanor Vance',       'patient',      null,              null,                             'patient@wellora.med')
on conflict (id) do update
  set full_name  = excluded.full_name,
      role       = excluded.role,
      department = excluded.department,
      shift      = excluded.shift,
      email      = excluded.email;

-- Scope the patient login to exactly one record. Without this the patient
-- signs in successfully and then sees nothing, because every RLS policy for
-- the patient role matches on portal_user_id.
update patients
   set portal_user_id = 'ce4e8a7a-052d-443e-9d4a-8f40415353b7'
 where id = 'WEL-8942';

-- Only one doctor account exists, so every patient is assigned to them.
-- (The seed data names a second physician, Dr. Sarah Jenkins, in historical
-- notes — those are text records, not foreign keys, so they stay valid.)
update patients p
   set assigned_doctor_id = pr.id
  from profiles pr
 where pr.role = 'doctor'
   and p.assigned_doctor_id is null;

commit;


-- ============================================================
-- Verification — run these and check the output before moving on.
-- ============================================================

-- 1. Every auth user should have exactly one profile with a role.
--    Any row with a null role means a user was missed.
select u.email, p.full_name, p.role
  from auth.users u
  left join profiles p on p.id = u.id
 order by p.role nulls first;

-- 2. The patient login must be attached to exactly one patient record.
select id, full_name, portal_user_id
  from patients
 where portal_user_id is not null;

-- 3. All 14 patients should now have an assigned doctor.
select count(*) filter (where assigned_doctor_id is null) as unassigned,
       count(*)                                            as total
  from patients;

-- 4. RLS must be enabled on every table. Expect zero rows.
select tablename
  from pg_tables
 where schemaname = 'public' and rowsecurity = false;
