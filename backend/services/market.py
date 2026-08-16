"""Market intelligence is fictional and deterministic — labeled as sample data."""

from models import Role
from services.calibration import RoleCalibrationService


FAMILY_TABLE = {
    "backend": {
        "supply": "HIGH",
        "competition": "HIGH",
        "salary": "₹28–38L",
        "notice": "45 days",
        "difficulty": 7.8,
    },
    "frontend": {
        "supply": "MEDIUM",
        "competition": "HIGH",
        "salary": "₹24–34L",
        "notice": "30 days",
        "difficulty": 6.9,
    },
    "design": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹22–32L",
        "notice": "30 days",
        "difficulty": 6.4,
    },
    "ml": {
        "supply": "LOW",
        "competition": "HIGH",
        "salary": "₹32–48L",
        "notice": "60 days",
        "difficulty": 8.6,
    },
    "devops": {
        "supply": "MEDIUM",
        "competition": "HIGH",
        "salary": "₹26–36L",
        "notice": "45 days",
        "difficulty": 7.2,
    },
    "product": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹30–42L",
        "notice": "45 days",
        "difficulty": 7.0,
    },
    "default": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹20–30L",
        "notice": "30 days",
        "difficulty": 6.2,
    },
}


def _family(title: str) -> str:
    t = title.lower()
    if any(k in t for k in ("backend", "platform", "api")):
        return "backend"
    if any(k in t for k in ("frontend", "ios", "android", "full-stack", "fullstack")):
        return "frontend"
    if "design" in t:
        return "design"
    if any(k in t for k in ("ml", "machine learning", "data")):
        return "ml"
    if any(k in t for k in ("devops", "sre", "infra")):
        return "devops"
    if any(k in t for k in ("product", "growth", "success")):
        return "product"
    return "default"


class MarketInsightsService:
    @staticmethod
    def insights(role: Role) -> dict:
        row = FAMILY_TABLE[_family(role.title)]
        ceiling = RoleCalibrationService._parse_budget_ceiling(role.budget_range or "")
        market_floor = int("".join(ch for ch in row["salary"].split("–")[0] if ch.isdigit()) or "0")
        below = ceiling is not None and ceiling < market_floor
        recs = []
        if below:
            recs.append("Increase budget to the estimated market range.")
        if (role.work_mode or "").lower() in {"onsite", "on-site"}:
            recs.append("Allow remote work.")
        if any(s.lower() in {"kafka", "kubernetes", "spark"} for s in (role.skills or [])[:3]):
            recs.append("Broaden skill requirements — move niche tools to preferred.")
        recs.append("Reduce experience requirement if the timeline is urgent.")
        narrative = (
            "Your current budget is below the estimated market range."
            if below
            else "Compensation is inside the sample market band for this profile."
        )
        return {
            "role_id": role.id,
            "candidate_supply": row["supply"],
            "competition": row["competition"],
            "estimated_salary_range": row["salary"],
            "average_notice_period": row["notice"],
            "hiring_difficulty": row["difficulty"],
            "narrative": narrative,
            "below_market": below,
            "recommendations": recs[:4],
            "label": "SAMPLE MARKET INTELLIGENCE — fictional, deterministic, not live statistics",
        }
