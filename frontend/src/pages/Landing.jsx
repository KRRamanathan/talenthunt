import { Link } from "react-router-dom";

const steps = [
  { n: "01", title: "Brief", body: "Intake a role in four steps — title, constraints, urgency, review — so sourcing starts from a shared brief, not a Slack thread." },
  { n: "02", title: "Calibrate", body: "Before anyone is sourced, the brief is stress-tested: must-haves vs. preferred, feasibility, and the constraints that quietly shrink the pool." },
  { n: "03", title: "Source & shortlist", body: "Recruiters work a live pipeline. Clients see a curated slate — never the database dump." },
  { n: "04", title: "Hire", body: "Interviews, feedback, SLA, and a weekly report that explains why the search is moving — or stalling." },
];

const diffs = [
  { title: "Curated, not crowded", body: "Clients see the strongest candidates, not a database dump." },
  { title: "Calibrated before sourced", body: "Hard constraints are named while they can still be changed." },
  { title: "Expert-vetted, explainable", body: "Every match score comes with a recruiter-style why — not a black box." },
  { title: "Transparent on delivery", body: "SLAs, pipeline health, and weekly reports make RaaS execution visible." },
];

export default function Landing() {
  return (
    <div className="bg-bg text-ink">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 md:px-10">
          <Link to="/" className="font-display text-[1.375rem] tracking-tight">
            TalentHunt
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <Link to="/app" className="btn-ghost hidden sm:inline-flex">
              Recruiter
            </Link>
            <Link to="/client" className="btn-ghost hidden sm:inline-flex">
              Client
            </Link>
            <Link to="/intake" className="btn-primary">
              Submit a Role
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:px-10 md:pb-32 md:pt-24">
        <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <Eyebrow>Recruiter-as-a-Service, operationalized</Eyebrow>
            <h1 className="mt-7 font-display text-[2.75rem] leading-[1.02] tracking-[-0.03em] sm:text-[3.5rem] lg:text-[4.25rem]">
              Your recruiting team, operationalized.
            </h1>
            <p className="mt-7 max-w-xl text-[1.0625rem] leading-[1.7] text-muted">
              TalentHunt helps RaaS teams manage startup hiring from role calibration to shortlist, interview and offer —
              without losing the human layer of recruiting.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/intake" className="btn-primary px-6 py-3">
                Submit a Role
              </Link>
              <Link to="/app/pipeline" className="btn-secondary px-6 py-3">
                Explore Pipeline
              </Link>
            </div>
            <p className="mt-10 border-t border-border pt-6 text-sm leading-relaxed text-muted">
              RaaS doesn’t just have a candidate-management problem.
              <span className="text-ink"> It has an execution problem.</span>
            </p>
          </div>

          <div className="lg:col-span-6">
            <CommandPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-28">
          <Eyebrow>How it works</Eyebrow>
          <div className="mt-14 grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.n} className="border-t border-border pt-6">
                <p className="font-display text-[2.5rem] leading-none text-accent/45">{step.n}</p>
                <h2 className="mt-5 font-display text-[1.625rem] tracking-tight">{step.title}</h2>
                <p className="mt-4 text-[0.9375rem] leading-[1.7] text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="max-w-2xl">
          <Eyebrow>Why teams use it</Eyebrow>
          <h2 className="mt-7 font-display text-[2.25rem] leading-[1.1] tracking-[-0.025em] sm:text-[2.75rem]">
            Outcomes, not another ATS module.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {diffs.map((item, i) => (
            <article
              key={item.title}
              className="surface-card p-9 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift md:p-11"
            >
              <p className="type-caption text-accent/70">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-5 font-display text-[1.75rem] leading-tight tracking-tight">{item.title}</h3>
              <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.7] text-muted">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/45">
            <span className="h-px w-6 bg-accent" />
            Sample data — fictional
          </p>
          <h2 className="mt-7 max-w-2xl font-display text-[2.25rem] leading-[1.1] tracking-[-0.025em] sm:text-[2.75rem]">
            What a RaaS week is supposed to feel like.
          </h2>
          <div className="mt-16 grid gap-12 md:grid-cols-2 md:gap-16">
            <Quote
              quote="Reduced shortlist turnaround from 6 days to 3."
              who="Sana Krishnan"
              role="fictional founder"
            />
            <Quote
              quote="Finally understood why our engineering pipeline was stalling."
              who="Arjun Mehta"
              role="fictional hiring manager"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Eyebrow>Product notes</Eyebrow>
            <h2 className="mt-7 font-display text-[2.25rem] leading-[1.1] tracking-[-0.025em] sm:text-[2.5rem]">
              We built the operational layer first — on purpose.
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="space-y-10">
              <Note title="Why the pipeline dashboard came first">
                RaaS fails in the handoffs: calibration, shortlist quality, client response time, interview feedback. A
                command center that answers “what should the recruiter do next?” is the product, not a reporting
                afterthought.
              </Note>
              <Note title="What we intentionally did not build">
                We intentionally did not build another full ATS. Existing ATS products already manage candidate records.
                TalentHunt focuses on the operational layer between recruiter expertise and client decision-making.
              </Note>
              <Note title="What comes next">
                <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                  {[
                    "Automated candidate matching",
                    "Slack notifications",
                    "Calendar integration",
                    "Email automation",
                    "ATS integrations",
                    "Deeper talent market intelligence",
                  ].map((item) => (
                    <li key={item} className="flex items-baseline gap-2.5">
                      <span className="h-1 w-1 shrink-0 rounded-full bg-accent/60" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Note>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-14 md:flex-row md:items-end md:justify-between md:px-10">
          <div>
            <p className="font-display text-xl tracking-tight">TalentHunt</p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              A fictional portfolio product. No real companies, candidates, or customers.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
            <Link to="/app" className="transition hover:text-ink">
              Recruiter
            </Link>
            <Link to="/client" className="transition hover:text-ink">
              Client portal
            </Link>
            <Link to="/design-system" className="transition hover:text-ink">
              Design tokens
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
      <span className="h-px w-6 bg-accent" />
      {children}
    </p>
  );
}

function Note({ title, children }) {
  return (
    <div className="border-t border-border pt-6">
      <h3 className="font-sans text-[1.0625rem] font-semibold">{title}</h3>
      <div className="mt-3 text-[0.9375rem] leading-[1.75] text-muted">{children}</div>
    </div>
  );
}

function Quote({ quote, who, role }) {
  return (
    <blockquote className="border-l border-paper/20 pl-7">
      <p className="font-display text-[1.625rem] leading-[1.3] tracking-tight sm:text-[1.875rem]">“{quote}”</p>
      <footer className="mt-6 text-sm text-paper/55">
        <span className="text-paper/85">{who}</span>, {role}
      </footer>
    </blockquote>
  );
}

function CommandPreview() {
  const metrics = [
    ["12", "Active roles"],
    ["38", "Need action"],
    ["4", "Client pending"],
    ["2", "Interviews"],
  ];
  const rows = [
    { client: "Stripe", role: "Senior Backend Engineer", note: "3 waiting for client review · SLA 6h", tone: "risk" },
    { client: "Notion", role: "Product Designer", note: "Shortlist below target", tone: "warn" },
    { client: "Figma", role: "DevOps Engineer", note: "Candidate accepted offer", tone: "ok" },
  ];
  return (
    <div className="surface-card overflow-hidden shadow-lift">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="type-caption">Recruiter command center</p>
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-border" />
          <span className="h-1.5 w-1.5 rounded-full bg-accent/50" />
        </div>
      </div>

      <div className="px-6 pb-7 pt-6">
        <h3 className="font-display text-[1.75rem] tracking-tight">Good morning, Ramanathan.</h3>

        <div className="mt-6 grid grid-cols-2 divide-x divide-y divide-border border-y border-border sm:grid-cols-4 sm:divide-y-0">
          {metrics.map(([n, l]) => (
            <div key={l} className="px-4 py-4 sm:px-3">
              <p className="font-display text-[1.75rem] leading-none tracking-tight tabular-nums">{n}</p>
              <p className="mt-2 text-[11px] leading-tight text-muted">{l}</p>
            </div>
          ))}
        </div>

        <p className="type-caption mt-7">Attention needed</p>
        <ul className="mt-4 space-y-2.5">
          {rows.map((row) => (
            <li
              key={row.role}
              className={`rounded-xl border px-4 py-3 ${
                row.tone === "risk" ? "border-accent/25 bg-accent-soft/50" : "border-border bg-bg/40"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[0.8125rem] font-semibold">
                  {row.client} — {row.role}
                </p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    row.tone === "risk"
                      ? "bg-accent text-paper"
                      : row.tone === "warn"
                      ? "bg-accent-soft text-accent"
                      : "bg-track-soft text-track"
                  }`}
                >
                  {row.tone === "risk" ? "At risk" : row.tone === "warn" ? "Watch" : "On track"}
                </span>
              </div>
              <p className="mt-1.5 text-[0.8125rem] text-muted">{row.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
