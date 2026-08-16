"""PipelineHealthService — deterministic health, SLA, and rejection analytics."""

from collections import Counter
from datetime import datetime

from models import Candidate, Role

KANBAN_STAGES = ("sourced", "shortlisted", "client_review", "interview", "offer")
REJECTION_REASONS = (
    "Compensation mismatch",
    "Experience mismatch",
    "Skill gap",
    "Notice period",
    "Location",
    "Client rejected",
    "Candidate withdrew",
    "Other",
)

URGENCY_TARGET_DAYS = {"urgent": 4, "high": 7, "normal": 9}


class PipelineHealthService:
    @staticmethod
    def days_active(role: Role, now: datetime | None = None) -> int:
        now = now or datetime.utcnow()
        delta = now - role.created_at
        return max(1, delta.days)

    @staticmethod
    def target_days(role: Role) -> int:
        return URGENCY_TARGET_DAYS.get((role.urgency or "normal").lower(), 9)

    @classmethod
    def sla(cls, role: Role, candidates: list[Candidate], now: datetime | None = None) -> dict:
        now = now or datetime.utcnow()
        days = cls.days_active(role, now)
        target = cls.target_days(role)
        waiting = [c for c in candidates if c.stage == "client_review"]
        oldest_hours = 0
        if waiting:
            oldest_hours = max(int((now - c.updated_at).total_seconds() // 3600) for c in waiting)

        shortlist_done = any(c.stage in {"shortlisted", "client_review", "interview", "offer"} for c in candidates)
        interview_done = any(c.stage in {"interview", "offer"} for c in candidates)

        if days > target + 2:
            overall = "Breached"
        elif days >= target or oldest_hours >= 36 or (role.urgency == "high" and not shortlist_done):
            overall = "At risk"
        else:
            overall = "On track"

        return {
            "days_active": days,
            "target_day": target,
            "label": f"Day {days} / Target Day {target}",
            "overall": overall,
            "shortlist_sla": "Met" if shortlist_done else ("Due" if days >= 3 else "On track"),
            "interview_sla": "Met" if interview_done else ("Due" if days >= 5 else "On track"),
            "client_response_sla": (
                f"{oldest_hours}h waiting" if waiting else "Clear"
            ),
            "client_response_hours": oldest_hours,
            "timeline": [
                {"step": "Role opened", "state": "done"},
                {"step": "Sourcing", "state": "done" if candidates else "current"},
                {
                    "step": "Shortlist",
                    "state": "done" if shortlist_done else "current",
                },
                {
                    "step": "Client review",
                    "state": "current" if waiting else ("done" if interview_done else "upcoming"),
                },
                {
                    "step": "Interview",
                    "state": "done" if interview_done else ("current" if any(c.stage == "interview" for c in candidates) else "upcoming"),
                },
                {
                    "step": "Offer",
                    "state": "done" if any(c.stage == "offer" for c in candidates) else "upcoming",
                },
            ],
        }

    @staticmethod
    def rejection_analytics(candidates: list[Candidate]) -> dict:
        rejected = [c for c in candidates if c.stage == "rejected" and c.rejection_reason]
        total = len(rejected) or 1
        counts = Counter(c.rejection_reason for c in rejected)
        breakdown = []
        for reason in REJECTION_REASONS:
            n = counts.get(reason, 0)
            if n:
                breakdown.append({"reason": reason, "count": n, "pct": round(100 * n / total)})
        if not breakdown and rejected:
            breakdown = [{"reason": "Other", "count": len(rejected), "pct": 100}]

        top = breakdown[0]["reason"] if breakdown else None
        if top == "Compensation mismatch":
            insight = "Compensation appears to be the primary bottleneck. Consider increasing the budget by ₹3–5L."
        elif top == "Experience mismatch":
            insight = "Experience bar is filtering out otherwise strong operators. Consider 4+ years instead of 5+."
        elif top == "Skill gap":
            insight = "Must-have skills are tighter than the market can fill quickly. Demote one skill to preferred."
        elif top:
            insight = f"{top} is the leading rejection reason. Recalibrate the brief before the next sourcing wave."
        else:
            insight = "No rejections yet — keep the shortlist tight and document reasons when they appear."

        return {"total": len(rejected), "breakdown": breakdown, "insight": insight}

    @classmethod
    def health(cls, role: Role, candidates: list[Candidate], now: datetime | None = None) -> dict:
        now = now or datetime.utcnow()
        active = [c for c in candidates if c.stage != "rejected"]
        rejected = [c for c in candidates if c.stage == "rejected"]
        days = cls.days_active(role, now)

        volume = min(25, round(25 * len(active) / 4))
        avg_fit = sum(c.fit_score for c in active) / len(active) if active else 0
        quality = round(25 * (avg_fit / 100))

        interviews = len([c for c in active if c.stage in {"interview", "offer"}])
        expected_interviews = max(1.0, days / 2.5)
        velocity = min(25, round(25 * (interviews / expected_interviews)))

        waiting = [c for c in active if c.stage == "client_review"]
        oldest_hours = 0
        if waiting:
            oldest_hours = max(int((now - c.updated_at).total_seconds() // 3600) for c in waiting)
        if not waiting:
            client = 25
        elif oldest_hours >= 48 or len(waiting) >= 3:
            client = 10
        elif oldest_hours >= 24:
            client = 16
        else:
            client = 20

        score = volume + quality + velocity + client
        if any(c.stage == "offer" for c in active):
            score += 18
        elif not waiting and interviews >= 1:
            score += 10
        if len(waiting) >= 3:
            score -= 6
        score = max(0, min(100, score))
        if score >= 75:
            status = "on_track"
        elif score >= 55:
            status = "at_risk"
        else:
            status = "blocked"

        shortlisted = [c for c in active if c.stage == "shortlisted"]
        recs = []
        if len(shortlisted) < 3:
            recs.append("Shortlist is below target.")
        if waiting and oldest_hours >= 24:
            recs.append("Client response time is slowing the pipeline.")
        if velocity <= 12:
            recs.append("Pipeline velocity is below target. Source 3–5 additional candidates this week.")
        if not recs:
            recs.append("Pipeline is moving. Keep the next shortlist wave on the current SLA.")

        recommendation = " ".join(recs)
        sla = cls.sla(role, candidates, now)

        return {
            "role_id": role.id,
            "score": score,
            "status": status,
            "status_label": {"on_track": "On track", "at_risk": "At risk", "blocked": "Blocked"}[status],
            "breakdown": {
                "candidate_volume": volume,
                "candidate_quality": quality,
                "pipeline_velocity": velocity,
                "client_responsiveness": client,
            },
            "recommendation": recommendation,
            "sla": sla,
            "active_count": len(active),
            "rejected_count": len(rejected),
            "waiting_client_review": len(waiting),
            "rejections": cls.rejection_analytics(candidates),
        }
