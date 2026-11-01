import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { api } from "../api/client.js";
import CommandPalette, { isPaletteShortcut } from "./CommandPalette.jsx";
import { recordVisit } from "./tour.js";

const recruiter = [
  { to: "/app", label: "Command Center", match: (p) => p === "/app" },
  { to: "/app/pipeline", label: "Pipeline", match: (p) => p.startsWith("/app/pipeline") || p.startsWith("/app/candidates") },
  { to: "/app/notifications", label: "Notifications", badge: "notifications", match: (p) => p.startsWith("/app/notifications") },
  { to: "/app/integrations", label: "Integrations", match: (p) => p.startsWith("/app/integrations") },
  { to: "/app/delivery", label: "Jira", match: (p) => p.startsWith("/app/delivery") },
  { to: "/intake", label: "Role intake", match: (p) => p.startsWith("/intake") },
];

const client = [{ to: "/client", label: "Active roles", match: (p) => p.startsWith("/client") }];

function Badge({ count, active }) {
  if (!count) return null;
  return (
    <span
      className={`ml-1.5 inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[10.5px] font-semibold tabular-nums leading-[1.25rem] ${
        active ? "bg-paper/15 text-paper" : "bg-accent text-paper"
      }`}
    >
      {count}
    </span>
  );
}

export default function AppShell({ perspective = "recruiter" }) {
  const links = perspective === "client" ? client : recruiter;
  const home = perspective === "client" ? "/client" : "/app";
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [alerts, setAlerts] = useState(0);

  useEffect(() => {
    recordVisit(pathname);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (perspective !== "recruiter") return;
    api
      .notifications()
      .then((res) => setAlerts(res.items?.length || 0))
      .catch(() => {});
  }, [perspective]);

  useEffect(() => {
    const onKey = (e) => {
      if (isPaletteShortcut(e)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const counts = { notifications: alerts };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-6 px-6 py-4 md:px-10">
          <div className="flex min-w-0 items-center gap-8">
            <NavLink to={home} className="shrink-0 font-display text-xl tracking-tight">
              TalentHunt
            </NavLink>
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((link) => {
                const active = link.match(pathname);
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/app"}
                    className={`rounded-full px-3.5 py-1.5 text-sm transition duration-200 ${
                      active ? "bg-ink text-paper" : "text-muted hover:bg-ink/[0.04] hover:text-ink"
                    }`}
                  >
                    {link.label}
                    <Badge count={counts[link.badge]} active={active} />
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2.5 rounded-full border border-border bg-paper/70 py-1.5 pl-3 pr-1.5 text-[13px] text-muted transition hover:border-ink/20 hover:text-ink"
              aria-label="Open command palette"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
                <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.6" />
                <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="hidden xl:inline">Jump to…</span>
              <kbd className="hidden rounded-md border border-border bg-bg px-1.5 text-[10.5px] leading-5 sm:inline">
                Ctrl K
              </kbd>
            </button>
            <div className="flex items-center gap-1 rounded-full border border-border bg-bg/70 p-1">
              <NavLink
                to="/app"
                className={`rounded-full px-3 py-1 text-[13px] font-medium transition duration-200 ${
                  perspective === "recruiter" ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                Recruiter
              </NavLink>
              <NavLink
                to="/client"
                className={`rounded-full px-3 py-1 text-[13px] font-medium transition duration-200 ${
                  perspective === "client" ? "bg-paper text-ink shadow-card" : "text-muted hover:text-ink"
                }`}
              >
                Client
              </NavLink>
            </div>
          </div>
        </div>

        <div className="scroll-soft flex gap-2 overflow-x-auto border-t border-border/60 px-6 py-2.5 lg:hidden">
          {links.map((link) => {
            const active = link.match(pathname);
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition ${
                  active ? "border-ink bg-ink text-paper" : "border-border text-muted"
                }`}
              >
                {link.label}
                <Badge count={counts[link.badge]} active={active} />
              </NavLink>
            );
          })}
        </div>
      </header>

      <main className="mx-auto min-h-[70vh] max-w-[76rem] px-6 py-10 md:px-10 md:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-6 py-7 text-[13px] text-muted md:px-10">
          <p>TalentHunt — fictional portfolio product. Sample data throughout.</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => setPaletteOpen(true)} className="transition hover:text-ink">
              Shortcuts
            </button>
            <NavLink to="/design-system" className="transition hover:text-ink">
              Design tokens
            </NavLink>
          </div>
        </div>
      </footer>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
