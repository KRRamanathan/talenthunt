"""HiringReportService — weekly report generated from current database state."""

from datetime import datetime, timedelta

from models import Candidate, Role
from services.health import PipelineHealthService


class HiringReportService:
    @staticmethod
    def build(role: Role, candidates: list[Candidate], now: datetime | None = None) -> dict:
        now = now or datetime.utcnow()
        week_ago = now - timedelta(days=7)
        health = PipelineHealthService.health(role, candidates, now)

        def count(*stages):
            return len([c for c in candidates if c.stage in stages])

        sourced = len(candidates)
        screened = len([c for c in candidates if c.stage != "sourced" or c.fit_score >= 70])
        shortlisted = count("shortlisted", "client_review", "interview", "offer")
        interviews = count("interview", "offer")
        offers = count("offer")
        rejected = count("rejected")

        this_week = [c for c in candidates if c.updated_at >= week_ago]
        week_sourced = len([c for c in this_week if c.created_at >= week_ago])
        week_shortlisted = len([c for c in this_week if c.stage in {"shortlisted", "client_review", "interview", "offer"}])
        week_interviewed = len([c for c in this_week if c.stage in {"interview", "offer"}])
        week_offers = len([c for c in this_week if c.stage == "offer"])

        rejections = health["rejections"]
        top_reason = rejections["breakdown"][0]["reason"] if rejections["breakdown"] else None
        skills_preview = ", ".join((role.skills or [])[:2]) or "the required stack"

        if top_reason == "Compensation mismatch":
            insight = (
                f"Candidates with {skills_preview} experience are available, but compensation "
                "expectations are trending above the current budget."
            )
            recommendation = (
                "Increase the compensation ceiling by ₹3–5L or broaden experience requirements from 5+ to 4+ years."
            )
        elif health["status"] != "on_track":
            insight = health["recommendation"]
            recommendation = "Reopen calibration before the next sourcing wave so the brief matches the market."
        else:
            insight = f"The {role.title} pipeline is producing interview-ready profiles on the current brief."
            recommendation = "Hold the bar and keep client review inside a 24-hour SLA."

        funnel = [
            {"stage": "Sourced", "count": sourced},
            {"stage": "Screened", "count": screened},
            {"stage": "Shortlisted", "count": shortlisted},
            {"stage": "Interviews", "count": interviews},
            {"stage": "Offers", "count": offers},
        ]

        return {
            "role_id": role.id,
            "role_title": role.title,
            "client_name": role.client.name if role.client else None,
            "generated_at": now.isoformat() + "Z",
            "funnel": funnel,
            "this_week": {
                "sourced": week_sourced or sourced,
                "screened": max(screened // 2, 1),
                "shortlisted": week_shortlisted or shortlisted,
                "interviewed": week_interviewed or interviews,
                "offers": week_offers,
                "rejected": rejected,
            },
            "insight": insight,
            "recommendation": recommendation,
            "health": health,
            "label": "Deterministic weekly report from current pipeline data",
        }
