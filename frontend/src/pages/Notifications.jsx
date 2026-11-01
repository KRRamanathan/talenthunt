import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

const CHANNEL = {
  slack: { label: "Slack", tone: "bg-accent-soft text-accent" },
  email: { label: "Email", tone: "bg-sage-soft text-sage" },
  calendar: { label: "Calendar", tone: "bg-track-soft text-track" },
};

export default function Notifications() {
  const toast = useToast();
  const { data, error, loading, reload } = useApi(() => api.notifications());

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const first = data.items[0];

  const act = async (item) => {
    try {
      await api.actNotification(item.id);
      toast.push(`${CHANNEL[item.channel]?.label || "Action"} queued (simulated)`);
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  return (
    <PageTransition>
      <NextStepStrip
        label={first ? first.cta : "Open Command Center"}
        detail={first ? first.body : "No delivery alerts right now."}
        href={first?.href || "/app"}
        secondary={{ label: "Integrations", href: "/app/integrations" }}
      />

      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Slack · Email · Calendar</Eyebrow>
          <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
            Delivery notifications
          </h1>
          <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
            Action-oriented alerts that keep RaaS execution moving — without leaving TalentHunt.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {["slack", "email", "calendar"].map((ch) => (
            <div key={ch} className="surface-card min-w-[4.5rem] px-4 py-3">
              <p className="font-display text-xl tabular-nums">{data.channels[ch] || 0}</p>
              <p className="mt-1 text-[11px] capitalize text-muted">{ch}</p>
            </div>
          ))}
        </div>
      </header>

      <p className="mt-6 text-[12.5px] text-muted">{data.label}</p>
      <p className="mt-2 font-medium">{data.headline}</p>

      <ul className="mt-10 space-y-3">
        {data.items.map((item) => {
          const meta = CHANNEL[item.channel] || CHANNEL.email;
          return (
            <li key={item.id} className="surface-card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
                <div className="min-w-0 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        item.priority === "high" ? "bg-risk-soft text-risk" : "bg-bg text-muted"
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <h2 className="mt-3 text-[1.0625rem] font-semibold">{item.title}</h2>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{item.body}</p>
                  {item.simulated_payload && (
                    <pre className="mt-4 overflow-x-auto rounded-xl bg-bg px-4 py-3 text-[12px] leading-relaxed text-muted">
                      {JSON.stringify(item.simulated_payload, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" className="btn-primary px-4 py-2 text-[13px]" onClick={() => act(item)}>
                    {item.cta}
                  </button>
                  <Link to={item.href} className="btn-secondary px-4 py-2 text-center text-[13px]">
                    Open context
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
        {data.items.length === 0 && (
          <li className="surface-card px-8 py-12 text-center text-muted">
            Pipelines are quiet — no Slack, email, or calendar nudges right now.
          </li>
        )}
      </ul>
    </PageTransition>
  );
}
