-- Wellora — automatic patient portal linking
--
-- Problem this solves: a receptionist registers a patient and captures their
-- email, but cannot create a login for them. Creating an auth user needs the
-- service_role key, which must never reach a browser. So the patient record
-- exists with no way for the patient to reach it.
--
-- This trigger closes the gap from the other end: when a person signs up with
-- an email that matches an unclaimed patient record, the two are linked and a
-- patient profile is created.
--
-- ── THE SECURITY CONDITION ──────────────────────────────────────────────
-- The link happens ONLY when the email is verified (email_confirmed_at is
-- set). Without that check, anyone could sign up as eleanor.vance@example.com
-- and be handed her medical record. Verification is what makes the email
-- evidence of identity rather than a claim.
--
--   • Google / OAuth sign-in  → verified by the provider, links immediately
--   • Email + password        → links only after the confirmation link is
--                               clicked, so Confirm Email MUST stay enabled
--                               (Authentication → Providers → Email)
-- ────────────────────────────────────────────────────────────────────────
--
-- Apply once in the SQL Editor. Safe to re-run.

create or replace function public.link_patient_portal_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_patient text;
  matched_name    text;
begin
  -- 1. Only verified emails may claim a record.
  if new.email is null or new.email_confirmed_at is null then
    return new;
  end if;

  -- 2. Never touch an account that already has a role. Staff sign-ins pass
  --    through here too, and a doctor whose address happens to match a
  --    patient row must not be demoted to a patient.
  if exists (select 1 from public.profiles where id = new.id) then
    return new;
  end if;

  -- 3. Find one unclaimed patient record with this email. `portal_user_id`
  --    is UNIQUE, so an already-linked record can never be stolen by a
  --    second signup. Oldest first, for determinism if duplicates exist.
  select p.id, p.full_name
    into matched_patient, matched_name
    from public.patients p
   where lower(p.email) = lower(new.email)
     and p.portal_user_id is null
   order by p.created_at
   limit 1;

  if matched_patient is null then
    -- No match: the account is created but reaches nothing. The portal shows
    -- its "no medical record linked" state, which is the correct outcome —
    -- better than inventing a record or failing the signup.
    return new;
  end if;

  -- 4. Link, then grant the patient role.
  update public.patients
     set portal_user_id = new.id
   where id = matched_patient;

  insert into public.profiles (id, full_name, role, email)
  values (new.id, coalesce(matched_name, new.email), 'patient', new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Fires on signup (OAuth confirms immediately) and on the UPDATE that sets
-- email_confirmed_at when a password user clicks their confirmation link.
drop trigger if exists on_auth_user_confirmed on auth.users;

create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row
  execute function public.link_patient_portal_account();


-- ── Backfill: link any patient already registered before this trigger ────
-- Only matches verified accounts and unclaimed records, same rules as above.
update public.patients p
   set portal_user_id = u.id
  from auth.users u
 where lower(p.email) = lower(u.email)
   and u.email_confirmed_at is not null
   and p.portal_user_id is null
   and not exists (select 1 from public.profiles pr where pr.id = u.id);

insert into public.profiles (id, full_name, role, email)
select p.portal_user_id, p.full_name, 'patient', p.email
  from public.patients p
 where p.portal_user_id is not null
on conflict (id) do nothing;


-- ── Verify ──────────────────────────────────────────────────────────────
-- Every patient record and whether it has a reachable login:
--
--   select p.id, p.full_name, p.email,
--          case when p.portal_user_id is null then 'no login' else 'linked' end
--     from public.patients p
--    order by p.created_at;
