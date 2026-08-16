import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { EmptyState, ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

const REASONS = ["Compensation mismatch", "Experience mismatch", "Skill gap", "Notice period", "Location", "Client rejected", "Other"];

const STAGE_LABEL = {
  shortlisted: "Recommended",
  client_review: "Awaiting your review",
  interview: "Interview requested",
  offer: "At offer",
};

export default function ClientRole() {
  const { roleId } = useParams();
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi(
    () =>
      Promise.all([api.role(roleId), api.candidates(roleId, "client")]).then(([role, grouped]) => ({
        role,
        grouped,
      })),
    [roleId]
  );
  const [open, setOpen] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState(REASONS[5]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const recommended = [
    ...data.grouped.shortlisted,
    ...data.grouped.client_review,
    ...data.grouped.interview,
    ...data.grouped.offer,
  ];

  const act = async (candidate, patch, label) => {
    setBusy(candidate.id);
    try {
      await api.patchCandidate(candidate.id, patch);
      toast.push(label);
      const grouped = await api.candidates(roleId, "client");
      setData({ role: data.role, grouped });
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setBusy(null);
    }
  };

  const leaveFeedback = async (candidate) => {
    try {
      await api.feedback(candidate.id, {
        technical_score: 4,
        communication_score: 4,
        role_fit_score: 4,
        recommendation: "Hold",
        feedback: note || "Client note on file.",
      });
      toast.push("Feedback sent to your recruiter.");
      setNote("");
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const progress = [
    ["Shortlisted", data.grouped.shortlisted.length],
    ["In review", data.grouped.client_review.length],
    ["Interview", data.grouped.interview.length],
    ["Offer", data.grouped.offer.length],
  ];

  return (
    <div className="animate-rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>{data.role.client_name} · hiring progress</Eyebrow>
          <h1 className="mt-6 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em]">{data.role.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-muted">
            <span>{data.role.sla_label}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="capitalize">{data.role.urgency} urgency</span>
          </div>
        </div>
      </header>

      <section className="surface-card mt-10 grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4 sm:divide-y-0">
        {progress.map(([label, n]) => (
          <div key={label} className="px-6 py-5">
            <p className="font-display text-[1.75rem] leading-none tracking-tight tabular-nums">{n}</p>
            <p className="mt-2 text-[12.5px] text-muted">{label}</p>
          </div>
        ))}
      </section>

      {recommended.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No candidates to review yet"
            body="Your recruiter is still curating the first slate. You’ll see profiles here as soon as they’re ready."
          />
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {recommended.map((candidate) => (
            <article key={candidate.id} className="surface-card overflow-hidden">
              <div className="grid gap-6 px-7 py-7 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-8">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display text-[1.5rem] tracking-tight">{candidate.name}</h2>
                    <span className="shrink-0 rounded-full border border-border bg-bg px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted">
                      {STAGE_LABEL[candidate.stage] || candidate.stage}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[0.9375rem] text-muted">{candidate.current_title}</p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(candidate.skills || []).slice(0, 5).map((s) => (
                      <span key={s} className="rounded-full border border-border px-2.5 py-1 text-[12px] text-muted">
                        {s}
                      </span>
                    ))}
                  </div>

                  <p className="mt-5 max-w-xl text-[0.9375rem] leading-[1.7]">{candidate.fit_summary}</p>
                </div>

                <div className="flex flex-row items-start justify-between gap-4 border-t border-border pt-6 md:col-span-4 md:flex-col md:items-end md:border-l md:border-t-0 md:pl-8 md:pt-0">
                  <div className="text-right">
                    <p className="font-display text-[2.25rem] leading-none tracking-[-0.02em] tabular-nums">
                      {candidate.fit_score}
                      <span className="text-[1.25rem] text-muted">%</span>
                    </p>
                    <p className="mt-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">Match</p>
                  </div>

                  <div className="flex flex-wrap justify-end gap-2">
                    {candidate.stage !== "interview" && candidate.stage !== "offer" && (
                      <button
                        className="btn-primary px-4 py-2 text-[13px]"
                        type="button"
                        disabled={busy === candidate.id}
                        onClick={() => act(candidate, { stage: "interview" }, "Interview requested")}
                      >
                        {busy === candidate.id ? "Working…" : "Request interview"}
                      </button>
                    )}
                    <button
                      className="btn-secondary px-4 py-2 text-[13px]"
                      type="button"
                      onClick={() => setOpen(open === candidate.id ? null : candidate.id)}
                    >
                      {open === candidate.id ? "Hide profile" : "View profile"}
                    </button>
                    <button className="btn-ghost text-[13px]" type="button" onClick={() => setRejecting(candidate)}>
                      Reject
                    </button>
                  </div>
                </div>
              </div>

              {open === candidate.id && (
                <div className="animate-rise border-t border-border bg-surface/50 px-7 py-7">
                  <div className="grid gap-8 md:grid-cols-2">
                    <div>
                      <p className="type-caption">Profile</p>
                      <dl className="mt-4 divide-y divide-border/70">
                        <Row k="Experience" v={`${candidate.years_experience} years`} />
                        <Row k="Location" v={candidate.location} />
                        <Row k="Notice period" v={candidate.notice_period} />
                        <Row k="Recruiter view" v={candidate.recommendation} />
                      </dl>
                      {(candidate.feedbacks || []).length > 0 && (
                        <div className="mt-6">
                          <p className="type-caption">Interview notes</p>
                          {candidate.feedbacks.map((fb) => (
                            <p key={fb.id} className="mt-3 text-[13px] leading-relaxed text-muted">
                              {fb.feedback}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="type-caption">Leave feedback for your recruiter</p>
                      <textarea
                        className="field mt-4 resize-none"
                        rows="4"
                        placeholder="What did you think of this profile?"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                      <button className="btn-secondary mt-3" type="button" onClick={() => leaveFeedback(candidate)}>
                        Send feedback
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {rejecting && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-[2px]">
          <div className="surface-card animate-rise w-full max-w-md overflow-hidden">
            <div className="border-b border-border px-7 py-5">
              <p className="type-caption text-risk">Reject candidate</p>
              <h3 className="mt-2 font-display text-[1.5rem] tracking-tight">{rejecting.name}</h3>
            </div>
            <div className="px-7 py-6">
              <p className="text-[0.9375rem] leading-relaxed text-muted">
                Your recruiter uses this reason to recalibrate the search.
              </p>
              <select className="field mt-5" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 border-t border-border bg-surface/60 px-7 py-4">
              <button className="btn-ghost" type="button" onClick={() => setRejecting(null)}>
                Cancel
              </button>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  act(rejecting, { stage: "rejected", rejection_reason: reason }, "Candidate rejected");
                  setRejecting(null);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Link
        to="/client"
        className="mt-12 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted transition hover:text-ink"
      >
        <span aria-hidden>←</span> All roles
      </Link>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-[13px] text-muted">{k}</dt>
      <dd className="text-right text-[13px] font-medium">{v}</dd>
    </div>
  );
}
