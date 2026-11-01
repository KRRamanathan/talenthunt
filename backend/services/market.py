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
        "time_to_hire": "28–40 days",
        "skill_demand": [
            {"skill": "Python", "demand": 92},
            {"skill": "Backend APIs", "demand": 88},
            {"skill": "PostgreSQL", "demand": 81},
            {"skill": "FastAPI", "demand": 74},
            {"skill": "Kafka", "demand": 46},
        ],
        "competitor_density": "8–12 open senior backend searches in peer seed/Series A firms",
        "salary_bands": [
            {"band": "P25", "value": "₹26L"},
            {"band": "Median", "value": "₹32L"},
            {"band": "P75", "value": "₹38L"},
        ],
    },
    "frontend": {
        "supply": "MEDIUM",
        "competition": "HIGH",
        "salary": "₹24–34L",
        "notice": "30 days",
        "difficulty": 6.9,
        "time_to_hire": "24–35 days",
        "skill_demand": [
            {"skill": "TypeScript", "demand": 90},
            {"skill": "React", "demand": 94},
            {"skill": "Design systems", "demand": 68},
            {"skill": "Vite", "demand": 55},
        ],
        "competitor_density": "6–10 product-facing frontend searches in comparable startups",
        "salary_bands": [
            {"band": "P25", "value": "₹22L"},
            {"band": "Median", "value": "₹28L"},
            {"band": "P75", "value": "₹34L"},
        ],
    },
    "design": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹22–32L",
        "notice": "30 days",
        "difficulty": 6.4,
        "time_to_hire": "21–32 days",
        "skill_demand": [
            {"skill": "Product design", "demand": 86},
            {"skill": "Figma", "demand": 95},
            {"skill": "Design systems", "demand": 72},
            {"skill": "Prototyping", "demand": 70},
        ],
        "competitor_density": "4–7 senior product design searches among peer startups",
        "salary_bands": [
            {"band": "P25", "value": "₹20L"},
            {"band": "Median", "value": "₹26L"},
            {"band": "P75", "value": "₹32L"},
        ],
    },
    "ml": {
        "supply": "LOW",
        "competition": "HIGH",
        "salary": "₹32–48L",
        "notice": "60 days",
        "difficulty": 8.6,
        "time_to_hire": "35–55 days",
        "skill_demand": [
            {"skill": "Python", "demand": 96},
            {"skill": "Applied ML", "demand": 84},
            {"skill": "Feature stores", "demand": 61},
            {"skill": "AWS", "demand": 78},
        ],
        "competitor_density": "Few strong applied-ML ICs; competition is intense for production experience",
        "salary_bands": [
            {"band": "P25", "value": "₹32L"},
            {"band": "Median", "value": "₹40L"},
            {"band": "P75", "value": "₹48L"},
        ],
    },
    "devops": {
        "supply": "MEDIUM",
        "competition": "HIGH",
        "salary": "₹26–36L",
        "notice": "45 days",
        "difficulty": 7.2,
        "time_to_hire": "26–38 days",
        "skill_demand": [
            {"skill": "AWS", "demand": 91},
            {"skill": "Terraform", "demand": 79},
            {"skill": "CI/CD", "demand": 85},
            {"skill": "Kubernetes", "demand": 72},
        ],
        "competitor_density": "Platform/DevOps demand outpaces supply in mid-market SaaS",
        "salary_bands": [
            {"band": "P25", "value": "₹24L"},
            {"band": "Median", "value": "₹30L"},
            {"band": "P75", "value": "₹36L"},
        ],
    },
    "product": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹30–42L",
        "notice": "45 days",
        "difficulty": 7.0,
        "time_to_hire": "30–45 days",
        "skill_demand": [
            {"skill": "Growth", "demand": 80},
            {"skill": "Lifecycle", "demand": 74},
            {"skill": "Analytics", "demand": 82},
            {"skill": "B2B SaaS", "demand": 77},
        ],
        "competitor_density": "Growth and CS leads are contested across Series A–B cohorts",
        "salary_bands": [
            {"band": "P25", "value": "₹28L"},
            {"band": "Median", "value": "₹34L"},
            {"band": "P75", "value": "₹42L"},
        ],
    },
    "default": {
        "supply": "MEDIUM",
        "competition": "MEDIUM",
        "salary": "₹20–30L",
        "notice": "30 days",
        "difficulty": 6.2,
        "time_to_hire": "25–35 days",
        "skill_demand": [
            {"skill": "Core craft", "demand": 70},
            {"skill": "Communication", "demand": 75},
        ],
        "competitor_density": "Moderate competition for generalist profiles",
        "salary_bands": [
            {"band": "P25", "value": "₹18L"},
            {"band": "Median", "value": "₹24L"},
            {"band": "P75", "value": "₹30L"},
        ],
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

        # Highlight skills on the brief that are low-demand / pool-shrinking
        brief_skills = {(s or "").lower() for s in (role.skills or [])}
        scarce = [
            s for s in row["skill_demand"] if s["skill"].lower() in brief_skills and s["demand"] < 55
        ]

        return {
            "role_id": role.id,
            "candidate_supply": row["supply"],
            "competition": row["competition"],
            "estimated_salary_range": row["salary"],
            "average_notice_period": row["notice"],
            "hiring_difficulty": row["difficulty"],
            "time_to_hire_benchmark": row["time_to_hire"],
            "competitor_density": row["competitor_density"],
            "skill_demand": row["skill_demand"],
            "salary_bands": row["salary_bands"],
            "scarce_skills_on_brief": scarce,
            "narrative": narrative,
            "below_market": below,
            "recommendations": recs[:4],
            "label": "SAMPLE MARKET INTELLIGENCE — fictional, deterministic, not live statistics",
        }
