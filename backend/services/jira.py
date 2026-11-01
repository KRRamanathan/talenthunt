"""JiraService — delivery board for TalentHunt product work (demo-synced).

This board mirrors the real five-sprint delivery of TalentHunt so recruiters
and portfolio reviewers can see how delivery risk was tracked like a PM
would in Jira: epics, sprints, statuses, and story points.
"""

from datetime import datetime

from models import Role
from services.health import PipelineHealthService


SPRINTS = [
    {
        "id": "TH-S1",
        "name": "Sprint 1 — Foundation",
        "goal": "Ship the core recruiter OS: intake, pipeline, calibration, and client portal.",
        "state": "closed",
        "velocity": 34,
    },
    {
        "id": "TH-S2",
        "name": "Sprint 2 — Intelligence",
        "goal": "Add deterministic role health, candidate fit, market intel, and weekly reports.",
        "state": "closed",
        "velocity": 29,
    },
    {
        "id": "TH-S3",
        "name": "Sprint 3 — Product complete",
        "goal": "Close roadmap gaps: matching, notifications, integrations, deeper market.",
        "state": "closed",
        "velocity": 31,
    },
    {
        "id": "TH-S4",
        "name": "Sprint 4 — Comfort UX",
        "goal": "Guided tour, command palette, undo moves, risk-first pipeline, nav badges.",
        "state": "closed",
        "velocity": 27,
    },
    {
        "id": "TH-S5",
        "name": "Sprint 5 — Delivery OS",
        "goal": "Jira delivery board, at-risk role sync, and demo-lifecycle ops.",
        "state": "active",
        "velocity": 18,
    },
]

EPICS = [
    {"key": "TH-E1", "name": "Recruiter command & pipeline", "status": "Done"},
    {"key": "TH-E2", "name": "Explainable candidate trust", "status": "Done"},
    {"key": "TH-E3", "name": "Client transparency portal", "status": "Done"},
    {"key": "TH-E4", "name": "Delivery integrations", "status": "In Progress"},
    {"key": "TH-E5", "name": "Adoption & first-run comfort", "status": "Done"},
]

BACKLOG = [
    {"key": "TH-101", "summary": "Role intake and open-role pipeline", "epic": "TH-E1", "sprint": "TH-S1", "points": 8, "status": "Done", "type": "Story"},
    {"key": "TH-102", "summary": "Kanban stages with optimistic updates", "epic": "TH-E1", "sprint": "TH-S1", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-103", "summary": "Client portal without internal notes", "epic": "TH-E3", "sprint": "TH-S1", "points": 8, "status": "Done", "type": "Story"},
    {"key": "TH-104", "summary": "Role calibration against must-haves", "epic": "TH-E2", "sprint": "TH-S1", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-201", "summary": "Explainable 0–100 role health score", "epic": "TH-E2", "sprint": "TH-S2", "points": 8, "status": "Done", "type": "Story"},
    {"key": "TH-202", "summary": "Candidate fit with skill-gap evidence", "epic": "TH-E2", "sprint": "TH-S2", "points": 8, "status": "Done", "type": "Story"},
    {"key": "TH-203", "summary": "Market intelligence for briefs", "epic": "TH-E1", "sprint": "TH-S2", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-204", "summary": "Weekly client report narrative", "epic": "TH-E3", "sprint": "TH-S2", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-301", "summary": "Automated candidate matching board", "epic": "TH-E2", "sprint": "TH-S3", "points": 8, "status": "Done", "type": "Story"},
    {"key": "TH-302", "summary": "Slack / email / calendar notifications", "epic": "TH-E4", "sprint": "TH-S3", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-303", "summary": "ATS connectors (Greenhouse, Lever, Ashby)", "epic": "TH-E4", "sprint": "TH-S3", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-304", "summary": "Deeper skill-demand market intel", "epic": "TH-E1", "sprint": "TH-S3", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-401", "summary": "Seven-step guided first-run tour", "epic": "TH-E5", "sprint": "TH-S4", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-402", "summary": "⌘K command palette across roles", "epic": "TH-E5", "sprint": "TH-S4", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-403", "summary": "Undo on pipeline stage moves", "epic": "TH-E5", "sprint": "TH-S4", "points": 3, "status": "Done", "type": "Story"},
    {"key": "TH-404", "summary": "Risk-first pipeline filters", "epic": "TH-E1", "sprint": "TH-S4", "points": 3, "status": "Done", "type": "Story"},
    {"key": "TH-501", "summary": "Jira delivery board in product", "epic": "TH-E4", "sprint": "TH-S5", "points": 5, "status": "Done", "type": "Story"},
    {"key": "TH-502", "summary": "Sync at-risk roles as Jira issues", "epic": "TH-E4", "sprint": "TH-S5", "points": 5, "status": "In Progress", "type": "Story"},
    {"key": "TH-503", "summary": "Demo data refresh & reset ops", "epic": "TH-E5", "sprint": "TH-S5", "points": 3, "status": "Done", "type": "Task"},
]


class JiraService:
    @staticmethod
    def board(roles: list[Role] | None = None, now: datetime | None = None) -> dict:
        now = now or datetime.utcnow()
        synced = []
        for role in roles or []:
            if role.status != "open":
                continue
            health = PipelineHealthService.health(role, list(role.candidates or []), now)
            if health["status"] not in {"at_risk", "blocked"}:
                continue
            client = role.client.name if role.client else "Client"
            synced.append(
                {
                    "key": f"TH-R{role.id}",
                    "summary": f"[{client}] {role.title} — {health['status'].replace('_', ' ')}",
                    "epic": "TH-E1",
                    "sprint": "TH-S5",
                    "points": 2,
                    "status": "To Do" if health["status"] == "at_risk" else "In Progress",
                    "type": "Bug" if health["status"] == "blocked" else "Task",
                    "priority": "Highest" if health["status"] == "blocked" else "High",
                    "href": f"/app/pipeline/{role.id}",
                    "health_score": health["score"],
                    "source": "role-sync",
                }
            )

        issues = list(BACKLOG) + synced
        by_status = {
            "To Do": [i for i in issues if i["status"] == "To Do"],
            "In Progress": [i for i in issues if i["status"] == "In Progress"],
            "Done": [i for i in issues if i["status"] == "Done"],
        }
        active = next((s for s in SPRINTS if s["state"] == "active"), SPRINTS[-1])
        active_issues = [i for i in issues if i.get("sprint") == active["id"]]
        done_points = sum(i["points"] for i in BACKLOG if i["status"] == "Done")

        return {
            "project": {
                "key": "TH",
                "name": "TalentHunt Delivery",
                "methodology": "Scrum",
                "label": "Jira-style delivery board — deterministic demo sync, no live Atlassian API call",
            },
            "sprints": SPRINTS,
            "epics": EPICS,
            "active_sprint": active,
            "columns": by_status,
            "active_issues": active_issues,
            "synced_roles": synced,
            "metrics": {
                "sprints_completed": len([s for s in SPRINTS if s["state"] == "closed"]),
                "stories_done": len([i for i in BACKLOG if i["status"] == "Done"]),
                "story_points_done": done_points,
                "open_synced_risks": len(synced),
                "avg_velocity": round(
                    sum(s["velocity"] for s in SPRINTS if s["state"] == "closed")
                    / max(1, len([s for s in SPRINTS if s["state"] == "closed"]))
                ),
            },
            "thesis": "Delivery risks from the recruiter OS surface as Jira issues so PMs and recruiters share one backlog language.",
        }
