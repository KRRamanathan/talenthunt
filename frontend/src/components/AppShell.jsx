import { NavLink, Outlet } from "react-router-dom";

const recruiter = [
  { to: "/app", label: "Command Center" },
  { to: "/app/pipeline", label: "Pipeline" },
  { to: "/intake", label: "Role intake" },
];

export default function AppShell({ perspective = "recruiter" }) {
  const links = perspective === "client" ? [{ to: "/client", label: "Active roles" }] : recruiter;
  const home = perspective === "client" ? "/client" : "/app";

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[76rem] items-center justify-between gap-6 px-6 py-4 md:px-10">
          <div className="flex items-center gap-8">
            <NavLink to={home} className="font-display text-xl tracking-tight">
              TalentHunt
            </NavLink>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/app" || link.to === "/client"}
                  className={({ isActive }) =>
                    `rounded-full px-3.5 py-1.5 text-sm transition duration-200 ${
                      isActive ? "bg-ink text-paper" : "text-muted hover:bg-ink/[0.04] hover:text-ink"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

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

        <div className="scroll-soft flex gap-2 overflow-x-auto border-t border-border/60 px-6 py-2.5 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/app" || link.to === "/client"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full border px-3 py-1 text-sm ${
                  isActive ? "border-ink bg-ink text-paper" : "border-border text-muted"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="mx-auto min-h-[70vh] max-w-[76rem] px-6 py-10 md:px-10 md:py-14">
        <Outlet />
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex max-w-[76rem] flex-wrap items-center justify-between gap-3 px-6 py-7 text-[13px] text-muted md:px-10">
          <p>TalentHunt — fictional portfolio product. Sample data throughout.</p>
          <NavLink to="/design-system" className="transition hover:text-ink">
            Design tokens
          </NavLink>
        </div>
      </footer>
    </div>
  );
}
