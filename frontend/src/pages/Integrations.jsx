import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useApi } from "../components/useApi.js";
import { NextStepStrip, PageTransition } from "../components/Journey.jsx";
import { ErrorState, Eyebrow, PageSkeleton } from "../components/ui.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function Integrations() {
  const toast = useToast();
  const { data, error, loading, reload, setData } = useApi(() => api.integrations());

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const toggle = async (item) => {
    const next = item.status === "connected" ? "available" : "connected";
    try {
      await api.patchIntegration(item.id, { status: next });
      toast.push(`${item.name} ${next === "connected" ? "connected" : "disconnected"} (demo)`);
      const fresh = await api.integrations();
      setData(fresh);
    } catch (err) {
      toast.push(err.message, "error");
    }
  };

  const groups = ["Collaboration", "Scheduling", "Communication", "Project management", "ATS"];

  return (
    <PageTransition>
      <NextStepStrip
        label="Wire delivery channels, keep the ATS as system of record"
        detail={data.thesis}
        href="/app/notifications"
        secondary={{ label: "Command Center", href: "/app" }}
      />

      <header>
        <Eyebrow>Integrations</Eyebrow>
        <h1 className="mt-5 font-display text-[2.5rem] leading-[1.05] tracking-[-0.03em] sm:text-[3rem]">
          Connect the operating layer.
        </h1>
        <p className="mt-4 max-w-2xl text-[1.0625rem] leading-relaxed text-muted">
          Slack, calendar, email, Jira, and ATS — so TalentHunt stays the execution OS, not another candidate database.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-[13px] text-muted">
          <span className="tabular-nums">{data.connected} connected</span>
          <span className="h-1 w-1 self-center rounded-full bg-border" />
          <span className="tabular-nums">{data.available} available</span>
          <span className="h-1 w-1 self-center rounded-full bg-border" />
          <span>{data.label}</span>
        </div>
      </header>

      <div className="mt-12 space-y-12">
        {groups.map((group) => {
          const items = data.items.filter((i) => i.category === group);
          if (!items.length) return null;
          return (
            <section key={group}>
              <h2 className="font-display text-[1.5rem] tracking-tight">{group}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {items.map((item) => (
                  <article key={item.id} className="surface-card flex flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[1.0625rem] font-semibold">{item.name}</h3>
                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{item.summary}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          item.status === "connected"
                            ? "bg-track-soft text-track"
                            : "bg-bg text-muted"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-4 flex-1 text-[13px] leading-relaxed text-muted">{item.detail}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.href && item.status === "connected" && (
                        <Link to={item.href} className="btn-primary px-4 py-2 text-[13px]">
                          Open board →
                        </Link>
                      )}
                      <button
                        type="button"
                        className={`${item.status === "connected" ? "btn-secondary" : "btn-primary"} px-4 py-2 text-[13px]`}
                        onClick={() => toggle(item)}
                      >
                        {item.status === "connected" ? "Disconnect" : "Connect"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 border-t border-border pt-8 text-[0.9375rem] leading-relaxed text-muted">
        Product principle: we intentionally did not rebuild Greenhouse/Lever/Ashby.{" "}
        <Link to="/app" className="font-semibold text-accent hover:underline">
          Back to Command Center
        </Link>
      </p>
    </PageTransition>
  );
}
