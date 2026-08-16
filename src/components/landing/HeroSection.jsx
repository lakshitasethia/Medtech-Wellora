import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowUpRight, BookOpen, Calendar, ClipboardList, Database, FileText,
  ArrowRight, GitBranch, Layers, RefreshCw, ShieldCheck, Stethoscope, TrendingUp, Users, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLandingAnimations } from './useLandingAnimations';
import { HOME_FOR_ROLE } from '../../routes/guards';

const REPO_URL = 'https://github.com/lakshitasethia/Medtech-Wellora';
const ML_API_URL = 'https://wellora-ml.onrender.com';

/** The five roles, described by what they can actually do in the build. */
const ROLES = [
  { icon: ShieldCheck, name: 'Admin', line: 'Staff directory, capacity and hospital-wide metrics.' },
  { icon: Stethoscope, name: 'Doctor', line: 'Risk-ranked worklist, SOAP notes, e-prescribing with allergy checks.' },
  { icon: Activity, name: 'Nurse', line: 'Ward bed map, vitals recording, medication rounds.' },
  { icon: Calendar, name: 'Receptionist', line: 'Registration, booking and check-in. No clinical data.' },
  { icon: Users, name: 'Patient', line: 'Their own record only — enforced by the database.' },
];

/**
 * Representative example for the analytics preview. Static by design: this is
 * a public page, so it must not read live patient data. The figures mirror the
 * real scoring model in src/utils/riskScore.js so the preview is faithful to
 * what a clinician actually sees.
 */
const RISK_EXAMPLE = {
  score: 91,
  band: 'Needs review',
  factors: [
    { points: 41, label: 'Cardiac risk model', detail: 'Model scored 91% (Critical Risk)' },
    { points: 15, label: 'Triage priority', detail: 'Assessed as Critical at intake' },
    { points: 10, label: 'Abnormal results', detail: '2 flagged: BNP, Serum Creatinine' },
    { points: 8, label: 'Hypoxaemia', detail: 'SpO₂ 91% (below 92%)' },
    { points: 6, label: 'Blood pressure rising', detail: 'Systolic up 11 mmHg on recent readings' },
    { points: 5, label: 'Heart rate rising', detail: 'Up 12 bpm on recent readings' },
  ],
  breakdown: [
    { label: 'Model', value: 41, max: 45 },
    { label: 'Vitals trend', value: 25, max: 25 },
    { label: 'Labs', value: 10, max: 15 },
    { label: 'Triage', value: 15, max: 15 },
  ],
};

const RESOURCES = [
  {
    icon: BookOpen,
    title: 'Project README',
    line: 'Architecture, setup, environment variables and limitations.',
    href: `${REPO_URL}#readme`,
  },
  {
    icon: GitBranch,
    title: 'Source repository',
    line: 'Full source for the frontend, database layer and ML service.',
    href: REPO_URL,
  },
  {
    icon: Zap,
    title: 'Live ML API',
    line: 'Interactive OpenAPI docs for the deployed risk model.',
    href: `${ML_API_URL}/docs`,
  },
  {
    icon: Database,
    title: 'Schema & security',
    line: 'Postgres schema plus the row-level security policy set.',
    href: `${REPO_URL}/tree/main/supabase`,
  },
  {
    icon: ClipboardList,
    title: 'Model card',
    line: 'Training pipeline, metrics and honest limitations.',
    href: `${REPO_URL}/tree/main/ml-service`,
  },
  {
    icon: Layers,
    title: 'Implementation plan',
    line: 'Phased build log with decisions and trade-offs recorded.',
    href: `${REPO_URL}/blob/main/plan.md`,
  },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const { isLoggedIn, userRole, displayName } = useAuth();

  const dashboardPath = HOME_FOR_ROLE[userRole] ?? '/';

  useLandingAnimations();

  // Signed-in visitors reach this page via the navbar logo, so the primary
  // action is "go back", not "sign in".
  const goToLogin = () =>
    navigate(isLoggedIn ? dashboardPath : '/login');

  /**
   * Scroll to a section explicitly rather than relying on native fragment
   * navigation. Under the router the hash updates but the browser does not
   * perform the jump, so the links would silently do nothing. Doing it here
   * also lets us honour reduced-motion and keep the URL shareable without a
   * history entry per click.
   */
  const scrollToSection = (event, id) => {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="landing-page">
      {/* Top Public Navbar — sticky so the section links stay reachable
          once the visitor has scrolled past the hero. */}
      <header className="hero-top-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', cursor: 'pointer' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--navy-900), var(--teal-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px var(--cyan-glow)'
          }}>
            <Activity style={{ width: '26px', height: '26px', stroke: '#ffffff' }} />
          </div>
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--navy-900)', letterSpacing: '-0.02em' }}>
            Wellora
          </span>
        </div>

        <nav className="hero-nav-links">
          <a className="hero-nav-link" href="#healthcare" onClick={(e) => scrollToSection(e, 'healthcare')}>Healthcare</a>
          <a className="hero-nav-link" href="#analytics" onClick={(e) => scrollToSection(e, 'analytics')}>Analytics</a>
          <a className="hero-nav-link" href="#resources" onClick={(e) => scrollToSection(e, 'resources')}>Resources</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isLoggedIn ? (
            <>
              <span className="hero-nav-link" style={{ cursor: 'default' }}>
                Signed in{displayName ? ` as ${displayName}` : ''}
              </span>
              <button
                className="btn-pill btn-pill-primary"
                style={{ padding: '0.55rem 1.4rem', fontSize: 'var(--fs-sm)' }}
                onClick={() => navigate(dashboardPath)}
              >
                Back to dashboard
              </button>
            </>
          ) : (
            <>
              <button
                className="hero-nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button
                className="btn-pill btn-pill-primary"
                style={{ padding: '0.55rem 1.4rem', fontSize: 'var(--fs-sm)' }}
                onClick={() => navigate('/login')}
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* ── Hero: unchanged, first viewport ─────────────────────────── */}
      <div className="hero-landing-container">
        <main className="hero-center-content">
          <h1 className="hero-title" data-anim="hero-title">Healthcare, Reimagined.</h1>

          <p className="hero-subtitle" data-anim="hero-sub">
            Built on a Single Source of Truth EMR architecture. Unified patient records, real-time clinical care workflows, and ML heart disease risk intelligence for modern healthcare systems.
          </p>

          <button
            className="hero-cta-button"
            data-anim="hero-cta"
            onClick={() => goToLogin()}
          >
            {isLoggedIn ? 'Go to my dashboard' : 'Get Started'}
          </button>
        </main>

        <footer className="hero-bottom-pills">
          <div className="hero-pill-feature" data-anim="hero-pill" onClick={() => goToLogin()}>
            <div className="hero-pill-icon-box">
              <Calendar style={{ width: '28px', height: '28px' }} />
            </div>
            <span className="hero-pill-label">Appointments</span>
          </div>

          <div className="hero-pill-feature" data-anim="hero-pill" onClick={() => goToLogin()}>
            <div className="hero-pill-icon-box">
              <FileText style={{ width: '28px', height: '28px' }} />
            </div>
            <span className="hero-pill-label">Patient Records</span>
          </div>

          <div className="hero-pill-feature" data-anim="hero-pill" onClick={() => goToLogin()}>
            <div className="hero-pill-icon-box">
              <TrendingUp style={{ width: '28px', height: '28px' }} />
            </div>
            <span className="hero-pill-label">Analytics</span>
          </div>
        </footer>

        <a
          className="scroll-cue"
          data-anim="scroll-cue"
          href="#healthcare"
          onClick={(e) => scrollToSection(e, 'healthcare')}
          aria-label="Scroll to learn more"
        >
          <span className="scroll-cue-mouse"><span /></span>
          <span className="scroll-cue-label">Explore the platform</span>
        </a>
      </div>

      {/* ── Healthcare ──────────────────────────────────────────────── */}
      <section data-anim="section" id="healthcare" className="landing-section">
        <div className="section-inner">
          <span className="section-eyebrow" data-anim="rise">The platform</span>
          <h2 className="section-title" data-anim="rise">One record. Every role. No fragments.</h2>
          <p className="section-lead" data-anim="rise">
            Most hospital systems keep a separate copy of the patient per department, then
            spend enormous effort reconciling them. Wellora inverts that: a single unified
            record, with each role seeing the slice their permissions allow — enforced in
            the database, not in the interface.
          </p>

          <div className="pillar-grid" data-anim="rise">
            <article className="pillar-card">
              <div className="pillar-icon"><Database style={{ width: '22px', height: '22px' }} /></div>
              <h3>Single Source of Truth EMR</h3>
              <p>
                One patient, one record. Vitals, notes, prescriptions, labs and risk
                assessments all attach to it, and every change is appended to a shared
                care timeline that cannot be edited or deleted after the fact.
              </p>
            </article>

            <article className="pillar-card">
              <div className="pillar-icon"><ShieldCheck style={{ width: '22px', height: '22px' }} /></div>
              <h3>Access enforced by the database</h3>
              <p>
                Permissions live in Postgres row-level security, not in client-side
                checks. A receptionist querying lab results receives zero rows regardless
                of what the frontend asks for. The UI mirrors the boundary; the database
                is the boundary.
              </p>
            </article>

            <article className="pillar-card">
              <div className="pillar-icon"><RefreshCw style={{ width: '22px', height: '22px' }} /></div>
              <h3>Real-time across roles</h3>
              <p>
                A nurse records deteriorating observations at the bedside; the attending
                doctor&rsquo;s worklist re-ranks and their care timeline updates within a
                second — no refresh, no handover delay, no second system to check.
              </p>
            </article>
          </div>

          <div className="role-strip" data-anim="rise">
            <div className="role-strip-head">Five roles, one underlying record</div>
            <div className="role-grid">
              {ROLES.map(({ icon: Icon, name, line }) => (
                <div className="role-card" key={name}>
                  <Icon style={{ width: '18px', height: '18px' }} />
                  <div>
                    <strong>{name}</strong>
                    <span>{line}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Analytics ───────────────────────────────────────────────── */}
      <section data-anim="section" id="analytics" className="landing-section landing-section-alt">
        <div className="section-inner">
          <span className="section-eyebrow" data-anim="rise">Clinical intelligence</span>
          <h2 className="section-title" data-anim="rise">Risk you can interrogate, not just read.</h2>
          <p className="section-lead" data-anim="rise">
            Documented override rates for clinical decision-support alerts run between 49%
            and 96% — clinicians dismiss them because they interrupt. Wellora takes the
            opposite approach: risk determines the <em>order</em> of the worklist, so the
            patient who needs attention rises into view instead of blocking the screen.
          </p>

          <div className="analytics-layout" data-anim="rise">
            <div className="analytics-copy">
              <h3 className="analytics-subhead">A model that shows its working</h3>
              <p>
                A logistic regression trained on the UCI Cleveland heart disease dataset,
                served from a FastAPI service in production. Logistic regression was chosen
                over a marginally more accurate random forest for one reason: a linear
                model&rsquo;s prediction decomposes <em>exactly</em>. Every feature&rsquo;s
                contribution is a real number that sums to the model&rsquo;s own decision.
              </p>

              <div className="model-stats">
                <div><strong>0.929</strong><span>Recall</span></div>
                <div><strong>0.960</strong><span>ROC-AUC</span></div>
                <div><strong>0.869</strong><span>Accuracy</span></div>
                <div><strong>303</strong><span>Training records</span></div>
              </div>

              <p className="analytics-note">
                Recall is the metric to optimise here: for a screening aid, a missed case
                costs more than a false alarm. Model, metrics and limitations are documented
                in full — including why 303 records from a 1988 cohort means this is a
                demonstration, not a clinical instrument.
              </p>

              <a className="btn-pill btn-pill-teal analytics-cta" href={`${ML_API_URL}/docs`} target="_blank" rel="noopener noreferrer">
                Try the live model API <ArrowUpRight style={{ width: '15px', height: '15px' }} />
              </a>
            </div>

            {/* Mirrors the doctor dashboard's "Why?" panel so a visitor sees
                the actual explanation format before ever signing in. */}
            <aside className="risk-preview" aria-label="Example risk assessment">
              <div className="risk-preview-head">
                <div>
                  <span className="risk-preview-eyebrow">Composite deterioration score</span>
                  <div className="risk-preview-patient">Patient WEL-8945 · ICU Bed 01</div>
                </div>
                <div className="risk-preview-score">
                  <strong>{RISK_EXAMPLE.score}</strong>
                  <span>{RISK_EXAMPLE.band}</span>
                </div>
              </div>

              <ul className="risk-preview-factors">
                {RISK_EXAMPLE.factors.map((f) => (
                  <li key={f.label}>
                    <span className="rp-points">+{f.points}</span>
                    <span className="rp-label">{f.label}</span>
                    <span className="rp-detail">{f.detail}</span>
                  </li>
                ))}
              </ul>

              <div className="risk-preview-breakdown">
                {RISK_EXAMPLE.breakdown.map((b) => (
                  <div className="rp-bar" key={b.label}>
                    <div className="rp-bar-head">
                      <span>{b.label}</span>
                      <span>{b.value}/{b.max}</span>
                    </div>
                    <div className="rp-bar-track">
                      <span style={{ width: `${(b.value / b.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <p className="risk-preview-foot">
                Representative example. Weights are a design choice for this system, not a
                validated clinical scale — the ranking is a prompt to look, not a diagnosis.
              </p>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Resources ───────────────────────────────────────────────── */}
      <section data-anim="section" id="resources" className="landing-section">
        <div className="section-inner">
          <span className="section-eyebrow" data-anim="rise">Resources</span>
          <h2 className="section-title" data-anim="rise">Documentation &amp; source</h2>
          <p className="section-lead" data-anim="rise">
            Everything is documented, including the parts that don&rsquo;t work yet.
          </p>

          <div className="resource-rail" data-anim="rise" role="list">
            {RESOURCES.map(({ icon: Icon, title, line, href }) => (
              <a
                className="resource-card"
                key={title}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                role="listitem"
              >
                <div className="resource-icon"><Icon style={{ width: '19px', height: '19px' }} /></div>
                <h3>{title} <ArrowUpRight style={{ width: '14px', height: '14px' }} /></h3>
                <p>{line}</p>
              </a>
            ))}
          </div>
          <p className="rail-hint">Scroll for more <ArrowRight style={{ width: '13px', height: '13px' }} /></p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="section-inner landing-footer-inner">
          <div>
            <div className="landing-footer-brand">
              <Activity style={{ width: '18px', height: '18px' }} />
              <span>Wellora</span>
            </div>
            <p>
              A final-year demonstration project. Patient data is synthetic and the risk
              model is not clinically validated — it must not be used for patient care.
            </p>
          </div>
          <div className="landing-footer-links">
            <a href="#healthcare" onClick={(e) => scrollToSection(e, 'healthcare')}>Healthcare</a>
            <a href="#analytics" onClick={(e) => scrollToSection(e, 'analytics')}>Analytics</a>
            <a href="#resources" onClick={(e) => scrollToSection(e, 'resources')}>Resources</a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
