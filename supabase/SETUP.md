# Wellora — Supabase setup

Everything here needs the SQL Editor or the dashboard, because DDL and user
creation require privileges the browser's publishable key does not have (by
design). Roughly 15 minutes end to end.

Project: `pgrzehdpihwmfbfonvtf` — <https://pgrzehdpihwmfbfonvtf.supabase.co>

---

## 1. Apply the schema

Supabase dashboard → **SQL Editor** → paste and run, **in this order**:

1. `schema.sql` — tables, enums, indexes, realtime publication
2. `rls.sql` — Row Level Security policies
3. `seed.sql` — 14 patients, 18 beds, 14 appointments, vitals, prescriptions, labs, notes, ML assessments

> **Run `rls.sql` before `seed.sql`, and before the app ever points at this
> project.** Until RLS is on, the publishable key is an unrestricted read/write
> handle on every table. That is the single most important step on this page.

Verify:

```sql
select tablename, rowsecurity from pg_tables
where schemaname = 'public' order by tablename;
```

Every row must show `rowsecurity = true`. If any is false, stop and fix it.

---

## 2. Create one user per role

**Authentication → Users → Add user** (tick *Auto Confirm User*). Suggested accounts:

| Email | Role | Name |
|---|---|---|
| `a.vance@wellora.med` | doctor | Dr. Alexander Vance |
| `j.alba@wellora.med` | nurse | Nurse Jessica Alba |
| `e.rostova@wellora.med` | receptionist | Elena Rostova |
| `m.brody@wellora.med` | admin | Marcus Brody |
| `eleanor.vance@example.com` | patient | Eleanor Vance |

Use a throwaway password you are willing to type in a viva — these are demo
accounts, not real credentials.

## 3. Give each user a profile row

The role lives in `profiles`, not in the client. Copy each user's UUID from the
Users list, then:

```sql
insert into profiles (id, full_name, role, department, email) values
  ('<uuid>', 'Dr. Alexander Vance', 'doctor',       'Cardiology',      'a.vance@wellora.med'),
  ('<uuid>', 'Nurse Jessica Alba',  'nurse',        'ICU Ward',        'j.alba@wellora.med'),
  ('<uuid>', 'Elena Rostova',       'receptionist', 'Front Desk',      'e.rostova@wellora.med'),
  ('<uuid>', 'Marcus Brody',        'admin',        'Operations',      'm.brody@wellora.med'),
  ('<uuid>', 'Eleanor Vance',       'patient',      null,              'eleanor.vance@example.com');
```

Link the patient login to their record, so RLS can scope them to it:

```sql
update patients set portal_user_id = '<eleanor-uuid>' where id = 'WEL-8942';
```

Link patients to their assigned doctor:

```sql
update patients p set assigned_doctor_id = pr.id
from profiles pr
where pr.full_name = 'Dr. Alexander Vance'
  and p.id in ('WEL-8942','WEL-8943','WEL-8945','WEL-8949','WEL-8952','WEL-8953','WEL-8955');

update patients p set assigned_doctor_id = pr.id
from profiles pr
where pr.full_name = 'Dr. Sarah Jenkins'
  and p.assigned_doctor_id is null;
```

(Add a `Dr. Sarah Jenkins` user first if you want that second statement to match.)

---

## 4. Switch the app to live mode

In `.env.local`:

```
VITE_USE_MOCK=false
```

Restart the dev server (Vite only reads env at startup). The login screen will
drop its role picker — in live mode the role comes from `profiles`, so there is
nothing to pick.

To go back to the offline demo, set it to `true` again. Handy when the venue
wifi fails during a presentation.

---

## 5. Prove the security boundary

This is the evidence for your report's security section. Sign in as each role in
the app, open the browser console, and run the queries. **Every one must return
zero rows or an error.**

```js
const { data, error } = await window.supabase
  .from('lab_results').select('*');
console.log({ rows: data?.length, error });
```

`rls.sql` ends with the full negative-test list. The ones worth screenshotting:

| Signed in as | Query | Expected |
|---|---|---|
| patient | `select * from patients where id = 'WEL-8943'` | 0 rows |
| patient | `insert into vitals ...` | policy violation |
| receptionist | `select * from lab_results` | 0 rows |
| receptionist | `insert into prescriptions ...` | policy violation |
| nurse | `insert into prescriptions ...` | policy violation |
| any role | `delete from clinical_events where id = 1` | 0 rows affected |

The last one matters: `clinical_events` has no UPDATE or DELETE policy for
anyone, so the timeline is append-only by construction rather than by
convention.

---

## Troubleshooting

**"Your account has no assigned role."** — the auth user exists but has no
`profiles` row. Step 3.

**Login succeeds, dashboards are empty.** — RLS is on and working, but the
signed-in role has no policy granting SELECT on that table. Check `rls.sql`
matches the role you expect.

**Still seeing demo data.** — `VITE_USE_MOCK` is still `true`, or the dev server
was not restarted.

**`infinite recursion detected in policy`** — a policy on `profiles` is querying
`profiles` without going through `auth_role()`. That helper is `SECURITY
DEFINER` precisely to break the loop; use it rather than a subquery.
