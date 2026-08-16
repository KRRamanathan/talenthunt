"""RecruiterCopilotService — action-oriented, rule-based next steps. Not a chatbot."""

from datetime import datetime

from models import Candidate, Role
from services.health import PipelineHealthService


class RecruiterCopilotService:
    @staticmethod
    def actions(roles: list[Role], now: datetime | None = None) -> list[dict]:
        now = now or datetime.utcnow()
        out: list[dict] = []
        for role in roles:
            candidates: list[Candidate] = list(role.candidates or [])
            if role.status != "open":
                continue
            health = PipelineHealthService.health(role, candidates, now)
            client_name = role.client.name if role.client else "Client"
            waiting = health["waiting_client_review"]
            interviews = [c for c in candidates if c.stage == "interview"]
            offers = [c for c in candidates if c.stage == "offer"]
            rejected = [c for c in candidates if c.stage == "rejected"]

            if offers and role.status == "open":
                out.append(
                    {
                        "role_id": role.id,
                        "title": f"{client_name} — {role.title}",
                        "why": "A candidate is at offer. Close the loop so the role does not stall after a yes.",
                        "action": "Move role toward closed",
                        "href": f"/app/pipeline/{role.id}",
                        "priority": "high",
                    }
                )
            elif waiting >= 2:
                hours = health["sla"]["client_response_hours"]
                out.append(
                    {
                        "role_id": role.id,
                        "title": f"{client_name} — {role.title}",
                        "why": f"{waiting} candidates are waiting on client review"
                        + (f" ({hours}h on the oldest)." if hours else "."),
                        "action": "Draft follow-up",
                        "href": f"/app/pipeline/{role.id}",
                        "priority": "high",
                    }
                )
            elif health["status"] in {"at_risk", "blocked"} and health["breakdown"]["candidate_volume"] < 20:
                out.append(
                    {
                        "role_id": role.id,
                        "title": f"{client_name} — {role.title}",
                        "why": "Pipeline is below target for this urgency.",
                        "action": "Source 3 additional candidates",
                        "href": f"/app/pipeline/{role.id}/health",
                        "priority": "high" if health["status"] == "blocked" else "medium",
                    }
                )
            elif len(interviews) >= 2 and not offers:
                insight = health["rejections"]["insight"]
                out.append(
                    {
                        "role_id": role.id,
                        "title": f"{client_name} — {role.title}",
                        "why": f"{len(interviews)} candidates interviewed, {len(offers)} offers. {insight}",
                        "action": "Review compensation bottleneck",
                        "href": f"/app/pipeline/{role.id}/report",
                        "priority": "medium",
                    }
                )
            elif interviews:
                out.append(
                    {
                        "role_id": role.id,
                        "title": f"{client_name} — {role.title}",
                        "why": "Interview feedback is the next decision gate.",
                        "action": "Submit interview feedback",
                        "href": f"/app/pipeline/{role.id}",
                        "priority": "medium",
                    }
                )

        # Stable, demo-friendly order: high first, then by title
        rank = {"high": 0, "medium": 1, "low": 2}
        out.sort(key=lambda a: (rank.get(a["priority"], 9), a["title"]))
        return out[:6]
