import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

const RATING_TONE = {
  Strong: "bg-track-soft text-track",
  Match: "bg-sage-soft text-sage",
  Preferred: "bg-sage-soft text-sage",
  Developing: "bg-accent-soft text-accent",
  Partial: "bg-accent-soft text-accent",
  Flexible: "bg-bg text-muted border border-border",
  Light: "bg-bg text-muted border border-border",
  Gap: "bg-risk-soft text-risk",
};

const SCORE_LABELS = {
  technical_score: "Technical",
  communication_score: "Communication",
  role_fit_score: "Role fit",
};

export default function CandidateIntelligence() {
  const { candidateId } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi(() => api.candidate(candidateId), [candidateId]);
  const [form, setForm] = useState({
    technical_score: 4,
    communication_score: 4,
    role_fit_score: 4,
    recommendation: "Proceed",
    feedback: "",
  });
  const [saving, setSaving] = useState(false);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const row = await api.feedback(data.id, form);
      setData({
        ...data,
        feedbacks: [row, ...(data.feedbacks || [])],
        average_interview_score: row.average_score,
      });
      setForm({ ...form, feedback: "" });
      toast.push("Interview feedback saved.");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-rise">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-7">
          <Eyebrow>
            {data.client_name} · {data.role_title}
          </Eyebrow>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
            <div>
              <h1 className="font-display text-[3rem] leading-[1] tracking-[-0.03em]">{data.name}</h1>
              <p className="mt-3 text-[1.0625rem] text-muted">{data.current_title}</p>
            </div>
            <span className="mt-3 shrink-0 rounded-full border border-border bg-paper px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
              {data.stage.replace("_", " ")}
            </span>
          </div>

          <section className="surface-card mt-10 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-border px-8 py-7">
              <div>
                <p className="type-caption">Fit score</p>
                <p className="mt-3 font-display text-[3.5rem] leading-none tracking-[-0.03em] tabular-nums">
                  {data.fit_score}
                  <span className="text-[2rem] text-muted">%</span>
                </p>
              </div>
              <div className="w-full max-w-[17rem] pb-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border/70">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-700"
                    style={{ width: `${data.fit_score}%` }}
                  />
                </div>
                <p className="mt-3 text-[12.5px] leading-relaxed text-muted">
                  Explainable score — every signal below is a named reason, not a black box.
                </p>
              </div>
            </div>

            <ul className="divide-y divide-border">
              {data.fit_breakdown.map((row) => (
                <li key={row.signal} className="flex items-center justify-between gap-4 px-8 py-3.5">
                  <span className="text-[0.9375rem]">{row.signal}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      RATING_TONE[row.rating] || "bg-bg text-muted"
                    }`}
                  >
                    {row.rating}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <Eyebrow>Why we recommend them</Eyebrow>
            <p className="mt-5 max-w-2xl font-display text-[1.5rem] leading-[1.45] tracking-tight">
              {data.fit_summary}
            </p>
          </section>

          <section className="mt-10 flex flex-wrap items-center gap-5 rounded-card border border-accent/25 bg-accent-soft/45 px-8 py-7">
            <div>
              <p className="type-caption text-accent">Recruiter recommendation</p>
              <p className="mt-2 font-display text-[1.75rem] tracking-tight">{data.recommendation}</p>
            </div>
          </section>

          {data.recruiter_notes && (
            <section className="mt-10 border-t border-border pt-7">
              <p className="type-caption">Recruiter notes · internal only</p>
              <p className="mt-3 max-w-2xl text-[0.9375rem] leading-[1.75] text-muted">{data.recruiter_notes}</p>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:col-span-5">
          <div className="surface-card overflow-hidden">
            <p className="type-caption border-b border-border px-6 py-4">Candidate detail</p>
            <dl className="divide-y divide-border">
              <Row k="Salary expectation" v={data.salary_expectation} />
              <Row k="Notice period" v={data.notice_period} />
              <Row k="Location" v={data.location} />
              <Row k="Experience" v={`${data.years_experience} years`} />
            </dl>
          </div>

          <form className="surface-card overflow-hidden" onSubmit={submit}>
            <div className="flex items-baseline justify-between border-b border-border px-6 py-4">
              <p className="type-caption">Interview feedback</p>
              {data.average_interview_score != null && (
                <span className="text-[12.5px] tabular-nums text-muted">
                  avg {data.average_interview_score} / 5
                </span>
              )}
            </div>

            <div className="space-y-6 px-6 py-6">
              {Object.keys(SCORE_LABELS).map((key) => (
                <label key={key} className="block">
                  <span className="flex items-baseline justify-between text-[13px]">
                    <span className="font-medium">{SCORE_LABELS[key]}</span>
                    <span className="tabular-nums text-muted">{form[key]} / 5</span>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
                    className="mt-3 w-full cursor-pointer"
                  />
                </label>
              ))}

              <label className="block">
                <span className="type-caption">Recommendation</span>
                <select
                  className="field mt-2.5"
                  value={form.recommendation}
                  onChange={(e) => setForm({ ...form, recommendation: e.target.value })}
                >
                  {["Proceed", "Hold", "Reject"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </label>

              <textarea
                required
                className="field resize-none"
                rows="3"
                placeholder="What should the hiring manager know?"
                value={form.feedback}
                onChange={(e) => setForm({ ...form, feedback: e.target.value })}
              />

              <button className="btn-primary w-full py-3" disabled={saving}>
                {saving ? "Saving…" : "Submit feedback"}
              </button>
            </div>
          </form>

          {(data.feedbacks || []).length > 0 && (
            <div className="space-y-2.5">
              <p className="type-caption px-1">Feedback on file</p>
              {data.feedbacks.map((fb) => (
                <div key={fb.id} className="surface-card px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        fb.recommendation === "Proceed"
                          ? "bg-track-soft text-track"
                          : fb.recommendation === "Hold"
                          ? "bg-accent-soft text-accent"
                          : "bg-risk-soft text-risk"
                      }`}
                    >
                      {fb.recommendation}
                    </span>
                    <span className="text-[12.5px] tabular-nums text-muted">avg {fb.average_score} / 5</span>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-muted">{fb.feedback}</p>
                </div>
              ))}
            </div>
          )}

          <Link
            to={`/app/pipeline/${data.role_id}`}
            className="inline-flex items-center gap-1.5 px-1 text-[13px] font-semibold text-muted transition hover:text-ink"
          >
            <span aria-hidden>←</span> Back to pipeline
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3.5">
      <dt className="text-[13px] text-muted">{k}</dt>
      <dd className="text-[0.9375rem] font-medium">{v}</dd>
    </div>
  );
}
