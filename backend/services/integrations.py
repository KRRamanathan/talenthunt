"""IntegrationsService — demo connection state for Slack, Calendar, Email, ATS."""

from threading import Lock

_DEFAULT = {
    "slack": {
        "id": "slack",
        "name": "Slack",
        "category": "Collaboration",
        "status": "connected",
        "summary": "Post client nudges and offer updates into hiring channels.",
        "detail": "Workspace connected in demo mode. Messages are simulated — nothing is sent externally.",
    },
    "calendar": {
        "id": "calendar",
        "name": "Google Calendar",
        "category": "Scheduling",
        "status": "connected",
        "summary": "Hold interview slots and sync panel availability.",
        "detail": "Calendar holds are simulated for the portfolio demo.",
    },
    "email": {
        "id": "email",
        "name": "Email outreach",
        "category": "Communication",
        "status": "connected",
        "summary": "Queue curated candidate outreach without leaving the OS.",
        "detail": "Templates are deterministic. No SMTP provider is wired in this build.",
    },
    "jira": {
        "id": "jira",
        "name": "Jira",
        "category": "Project management",
        "status": "connected",
        "summary": "Track TalentHunt delivery in Scrum sprints and sync at-risk roles as issues.",
        "detail": "Board is live inside the product. At-risk and blocked roles sync into the active sprint as delivery tasks — demo mode, no live Atlassian API call.",
        "href": "/app/delivery",
    },
    "greenhouse": {
        "id": "greenhouse",
        "name": "Greenhouse",
        "category": "ATS",
        "status": "available",
        "summary": "Sync stages one-way from TalentHunt into your ATS of record.",
        "detail": "We intentionally stay an operational layer — not a full ATS replacement.",
    },
    "lever": {
        "id": "lever",
        "name": "Lever",
        "category": "ATS",
        "status": "available",
        "summary": "Push shortlist decisions without duplicating recruiter notes.",
        "detail": "Connect when you want TalentHunt decisions mirrored into Lever.",
    },
    "ashby": {
        "id": "ashby",
        "name": "Ashby",
        "category": "ATS",
        "status": "available",
        "summary": "Export weekly funnel metrics into Ashby's reporting.",
        "detail": "Demo toggle only — no live API keys required.",
    },
}

_lock = Lock()
_state = {k: dict(v) for k, v in _DEFAULT.items()}


class IntegrationsService:
    @staticmethod
    def list_all() -> dict:
        with _lock:
            items = list(_state.values())
        connected = len([i for i in items if i["status"] == "connected"])
        return {
            "items": items,
            "connected": connected,
            "available": len(items) - connected,
            "thesis": "TalentHunt integrates outward so the ATS stays the system of record for candidates — we own delivery execution.",
            "label": "Demo integrations — connection state is in-memory for this session",
        }

    @staticmethod
    def reset() -> None:
        with _lock:
            for key, value in _DEFAULT.items():
                _state[key] = dict(value)

    @staticmethod
    def set_status(integration_id: str, status: str) -> dict:
        if status not in {"connected", "available"}:
            raise ValueError("status must be connected or available")
        with _lock:
            if integration_id not in _state:
                raise KeyError(integration_id)
            _state[integration_id]["status"] = status
            return dict(_state[integration_id])
