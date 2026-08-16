import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

const empty = {
  title: "",
  seniority: "Senior",
  skills: "Python, Backend APIs, PostgreSQL",
  location: "Bengaluru",
  work_mode: "Hybrid",
  urgency: "high",
  budget_range: "₹24–32L",
  client_id: "",
};

const STEPS = [
  { label: "Title", hint: "What are we hiring for?" },
  { label: "Profile", hint: "Seniority, skills, location" },
  { label: "Delivery", hint: "Urgency and budget" },
  { label: "Review", hint: "Confirm the brief" },
];

const TIMELINE = { urgent: "3–5 days", high: "5–7 days", normal: "7–10 days" };

export default function RoleIntake() {
  const { data: clients, error, loading, reload } = useApi(() => api.clients());
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const toast = useToast();
  const navigate = useNavigate();

  const clientId = form.client_id || clients?.[0]?.id || "";
  const payload = useMemo(
    () => ({
      ...form,
      client_id: Number(clientId),
      skills: form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    }),
    [form, clientId]
  );

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const validate = () => {
    if (step === 0 && form.title.trim().length < 3) return "Give the role a real title.";
    if (step === 1 && payload.skills.length < 2) return "Add at least two skills.";
    if (step === 2 && !form.budget_range.trim()) return "Budget range is required.";
    return "";
  };

  const next = () => {
    const msg = validate();
    if (msg) {
      setFieldError(msg);
      return;
    }
    setFieldError("");
    setStep((s) => Math.min(3, s + 1));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const role = await api.createRole(payload);
      setCreated(role);
      toast.push("Role brief submitted.");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="animate-rise mx-auto max-w-2xl py-10">
        <Eyebrow>Role confirmed</Eyebrow>
        <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] tracking-[-0.03em]">{created.title}</h1>
        <p className="mt-3 text-muted">
          {created.client_name} · {created.seniority} · {created.location}
        </p>

        <div className="surface-card mt-10 divide-y divide-border">
          <div className="flex items-center justify-between px-7 py-5">
            <span className="text-sm text-muted">Estimated shortlist window</span>
            <span className="font-display text-xl tracking-tight">{created.estimated_timeline}</span>
          </div>
          <div className="flex items-center justify-between px-7 py-5">
            <span className="text-sm text-muted">Urgency</span>
            <span className="text-sm font-semibold capitalize">{created.urgency}</span>
          </div>
          <div className="flex items-center justify-between px-7 py-5">
            <span className="text-sm text-muted">Budget</span>
            <span className="text-sm font-semibold">{created.budget_range}</span>
          </div>
        </div>

        <p className="mt-12 max-w-lg font-display text-[1.75rem] leading-snug tracking-tight">
          Before sourcing, let’s calibrate the role.
        </p>
        <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-muted">
          Calibration stress-tests the brief while the constraints can still be changed — that is the cheapest moment to
          widen a pool.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            className="btn-primary px-6 py-3"
            type="button"
            onClick={() => navigate(`/app/pipeline/${created.id}/calibration`)}
          >
            Open calibration
          </button>
          <Link to="/app" className="btn-secondary px-6 py-3">
            Command Center
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise grid gap-12 lg:grid-cols-12 lg:gap-16">
      <aside className="lg:col-span-4">
        <Eyebrow>Role intake</Eyebrow>
        <h1 className="mt-6 font-display text-[2.25rem] leading-[1.1] tracking-[-0.025em]">
          A brief everyone can source from.
        </h1>
        <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.7] text-muted">
          Four steps, then calibration. No Slack thread required.
        </p>

        <ol className="mt-10 space-y-1">
          {STEPS.map((s, i) => {
            const state = i === step ? "current" : i < step ? "done" : "upcoming";
            return (
              <li
                key={s.label}
                className={`flex gap-4 rounded-xl px-4 py-3.5 transition duration-200 ${
                  state === "current" ? "bg-paper shadow-card" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    state === "done"
                      ? "bg-track-soft text-track"
                      : state === "current"
                      ? "bg-accent text-paper"
                      : "border border-border text-muted"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-semibold ${state === "upcoming" ? "text-muted" : "text-ink"}`}>
                    {s.label}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-muted">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </aside>

      <div className="lg:col-span-8">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-8 py-4">
            <p className="type-caption">
              Step {step + 1} of 4 · {STEPS[step].label}
            </p>
            <div className="flex gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.label}
                  className={`h-1 w-8 rounded-full transition-colors duration-300 ${
                    i <= step ? "bg-accent" : "bg-border"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-8 py-10 md:px-10 md:py-12">
            {step === 0 && (
              <div className="animate-rise">
                <label className="block">
                  <span className="type-caption">Role title</span>
                  <input
                    autoFocus
                    className="mt-4 w-full border-b border-border bg-transparent pb-4 font-display text-[2rem] leading-tight tracking-tight outline-none transition placeholder:text-muted/35 focus:border-accent"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Senior Backend Engineer"
                  />
                </label>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-muted">
                  Use the title the market searches for, not the internal level name.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="animate-rise space-y-7">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Client">
                    <select
                      className="field"
                      value={clientId}
                      onChange={(e) => setForm({ ...form, client_id: e.target.value })}
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Seniority">
                    <select
                      className="field"
                      value={form.seniority}
                      onChange={(e) => setForm({ ...form, seniority: e.target.value })}
                    >
                      {["Mid", "Mid-Senior", "Senior", "Staff", "Lead"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Skills" hint="Comma separated — first three become must-haves">
                  <input
                    className="field"
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  />
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {payload.skills.map((s, i) => (
                      <span
                        key={s + i}
                        className={`rounded-full px-2.5 py-1 text-[12px] ${
                          i < 3 ? "bg-accent-soft text-accent" : "border border-border text-muted"
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Field>
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field label="Location">
                    <input
                      className="field"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                    />
                  </Field>
                  <Field label="Work mode">
                    <select
                      className="field"
                      value={form.work_mode}
                      onChange={(e) => setForm({ ...form, work_mode: e.target.value })}
                    >
                      {["Remote", "Hybrid", "Onsite"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-rise space-y-8">
                <Field label="Urgency">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {["urgent", "high", "normal"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setForm({ ...form, urgency: u })}
                        className={`rounded-xl border px-4 py-4 text-left transition duration-200 ${
                          form.urgency === u
                            ? "border-accent bg-accent-soft/60"
                            : "border-border bg-bg hover:border-ink/20"
                        }`}
                      >
                        <span className="block text-sm font-semibold capitalize">{u}</span>
                        <span className="mt-1 block text-[13px] text-muted">{TIMELINE[u]}</span>
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Budget range">
                  <input
                    className="field"
                    value={form.budget_range}
                    onChange={(e) => setForm({ ...form, budget_range: e.target.value })}
                  />
                </Field>
                <p className="border-t border-border pt-6 text-sm text-muted">
                  Estimated shortlist window: <span className="text-ink">{TIMELINE[form.urgency]}</span>
                </p>
              </div>
            )}

            {step === 3 && (
              <dl className="animate-rise divide-y divide-border">
                {[
                  ["Title", form.title],
                  ["Client", clients.find((c) => String(c.id) === String(clientId))?.name],
                  ["Seniority", form.seniority],
                  ["Skills", payload.skills.join(" · ")],
                  ["Location / mode", `${form.location} · ${form.work_mode}`],
                  ["Urgency / budget", `${form.urgency} · ${form.budget_range}`],
                  ["Estimated window", TIMELINE[form.urgency]],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-8 py-4 first:pt-0">
                    <dt className="shrink-0 text-sm text-muted">{k}</dt>
                    <dd className="text-right text-[0.9375rem] font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {fieldError && (
              <p className="mt-6 rounded-xl border border-risk/20 bg-risk-soft/60 px-4 py-3 text-sm text-risk">
                {fieldError}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-surface/60 px-8 py-5">
            <button
              className="btn-ghost"
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              Back
            </button>
            {step < 3 ? (
              <button className="btn-primary px-6" type="button" onClick={next}>
                Continue
              </button>
            ) : (
              <button className="btn-primary px-6" type="button" onClick={submit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit role"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="type-caption">{label}</span>
      {hint && <span className="mt-1 block text-[13px] normal-case tracking-normal text-muted">{hint}</span>}
      <div className="mt-2.5">{children}</div>
    </label>
  );
}
