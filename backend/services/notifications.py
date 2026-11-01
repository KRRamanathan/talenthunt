"""NotificationService — deterministic Slack / email / calendar style alerts."""

from datetime import datetime

from models import Candidate, Role
from services.health import PipelineHealthService


class NotificationService:
    @staticmethod
    def build(roles: list[Role], now: datetime | None = None) -> dict:
        now = now or datetime.utcnow()
        items = []

        for role in roles:
            if role.status != "open":
                continue
            client = role.client.name if role.client else "Client"
            candidates: list[Candidate] = list(role.candidates or [])
            health = PipelineHealthService.health(role, candidates, now)
            waiting = [c for c in candidates if c.stage == "client_review"]
            interviews = [c for c in candidates if c.stage == "interview"]
            offers = [c for c in candidates if c.stage == "offer"]

            if waiting:
                oldest = max(waiting, key=lambda c: (now - c.updated_at).total_seconds())
                hours = int((now - oldest.updated_at).total_seconds() // 3600)
                items.append(
                    {
                        "id": f"slack-client-{role.id}",
                        "channel": "slack",
                        "priority": "high" if hours >= 24 or len(waiting) >= 2 else "medium",
                        "title": f"Follow up with {client}",
                        "body": f"{len(waiting)} candidate(s) waiting on client review for {role.title}. Oldest packet: {hours}h.",
                        "cta": "Draft Slack nudge",
                        "href": f"/app/pipeline/{role.id}",
                        "role_id": role.id,
                        "simulated_payload": {
                            "to": f"#{client.lower().replace(' ', '-')}-hiring",
                            "message": f"Quick nudge on {role.title} — {len(waiting)} profiles awaiting your review.",
                        },
                    }
                )

            for cand in interviews[:1]:
                items.append(
                    {
                        "id": f"calendar-{cand.id}",
                        "channel": "calendar",
                        "priority": "medium",
                        "title": f"Schedule loop — {cand.name}",
                        "body": f"{cand.name} is in interview for {role.title}. Hold a 45-minute panel this week.",
                        "cta": "Hold calendar slot",
                        "href": f"/app/candidates/{cand.id}",
                        "role_id": role.id,
                        "simulated_payload": {
                            "event": f"Interview · {cand.name} · {role.title}",
                            "duration": "45 min",
                            "when": "Next business morning 11:00",
                        },
                    }
                )

            if health["status"] in {"at_risk", "blocked"} and health["breakdown"]["candidate_volume"] < 22:
                items.append(
                    {
                        "id": f"email-source-{role.id}",
                        "channel": "email",
                        "priority": "medium",
                        "title": f"Sourcing cadence — {role.title}",
                        "body": "Pipeline volume is thin. Send a curated outreach batch to 8–12 warm contacts.",
                        "cta": "Queue outreach email",
                        "href": f"/app/pipeline/{role.id}/matching",
                        "role_id": role.id,
                        "simulated_payload": {
                            "subject": f"Quick note — {role.title} at {client}",
                            "preview": "Sharing a tightly scoped brief we think matches your recent work…",
                        },
                    }
                )

            if offers:
                items.append(
                    {
                        "id": f"slack-offer-{role.id}",
                        "channel": "slack",
                        "priority": "high",
                        "title": f"Offer in motion — {client}",
                        "body": f"{offers[0].name} is at offer for {role.title}. Align paperwork and close the loop.",
                        "cta": "Notify hiring channel",
                        "href": f"/app/pipeline/{role.id}",
                        "role_id": role.id,
                        "simulated_payload": {
                            "to": f"#{client.lower().replace(' ', '-')}-hiring",
                            "message": f"Offer stage: {offers[0].name} for {role.title}. Confirm sign-off path.",
                        },
                    }
                )

        rank = {"high": 0, "medium": 1, "low": 2}
        channel_rank = {"slack": 0, "email": 1, "calendar": 2}
        items.sort(key=lambda x: (rank.get(x["priority"], 9), channel_rank.get(x["channel"], 9), x["title"]))
        items = items[:12]

        return {
            "headline": f"You have {len(items)} delivery notifications ready.",
            "items": items,
            "channels": {
                "slack": len([i for i in items if i["channel"] == "slack"]),
                "email": len([i for i in items if i["channel"] == "email"]),
                "calendar": len([i for i in items if i["channel"] == "calendar"]),
            },
            "label": "Simulated notifications — deterministic, no live Slack/email/calendar send",
        }
