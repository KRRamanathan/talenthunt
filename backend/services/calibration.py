"""RoleCalibrationService — rule-based hiring feasibility, not an ML model."""

from models import Role


MUST_HAVE_CAP = 3
STRONG_CAP = 3

RESTRICTIVE_SKILLS = {"kafka", "kubernetes", "spark", "rust", "golang", "go"}
TIGHT_BUDGET_MARKERS = ("18", "20", "22", "24", "12", "14", "16")


class RoleCalibrationService:
    @staticmethod
    def _split_skills(skills: list[str]) -> tuple[list[str], list[str], list[str]]:
        cleaned = [s.strip() for s in skills if s and str(s).strip()]
        must = cleaned[:MUST_HAVE_CAP]
        strong = cleaned[MUST_HAVE_CAP : MUST_HAVE_CAP + STRONG_CAP]
        nice = cleaned[MUST_HAVE_CAP + STRONG_CAP :]
        return must, strong, nice

    @staticmethod
    def _parse_budget_ceiling(budget_range: str) -> int | None:
        digits = []
        for token in budget_range.replace("–", "-").replace("—", "-").split("-"):
            nums = "".join(ch for ch in token if ch.isdigit())
            if nums:
                digits.append(int(nums))
        return max(digits) if digits else None

    @classmethod
    def calibrate(cls, role: Role) -> dict:
        must, strong, nice = cls._split_skills(role.skills or [])
        recommendations: list[str] = []
        constraints: list[str] = []
        score = 72

        restrictive = [s for s in must if s.lower() in RESTRICTIVE_SKILLS]
        for skill in restrictive:
            recommendations.append(
                f"Make {skill} preferred instead of mandatory - it is unnecessarily restricting the candidate pool."
            )
            constraints.append(f"{skill} as a must-have")
            score -= 10

        work_mode = (role.work_mode or "").lower()
        if work_mode in {"onsite", "on-site", "office"}:
            recommendations.append("Allow remote or hybrid work to widen the available pool.")
            constraints.append("onsite-only requirement")
            score -= 8

        ceiling = cls._parse_budget_ceiling(role.budget_range or "")
        if ceiling is not None and ceiling <= 24:
            recommendations.append("Increase the compensation ceiling by ₹3–5L to match market expectation.")
            constraints.append("compensation below typical senior range")
            score -= 12

        seniority = (role.seniority or "").lower()
        if "staff" in seniority or "principal" in seniority or "lead" in seniority:
            recommendations.append("Reduce required experience if delivery timeline is the priority.")
            score -= 6

        if role.urgency == "urgent":
            constraints.append("urgent timeline")
            score -= 4

        if not recommendations:
            recommendations.append("Current brief is calibrated. Proceed to sourcing with the must-have list as written.")

        if score >= 75:
            feasibility = "Strong"
            narrative = "This brief is hireable on the current timeline with a focused, curated search."
        elif score >= 55:
            feasibility = "Moderate"
            narrative = (
                "Your current combination of experience, location and compensation may significantly "
                "narrow the candidate pool."
            )
        else:
            feasibility = "Constrained"
            narrative = "The brief will be difficult to fill without relaxing at least one hard constraint."

        return {
            "role_id": role.id,
            "title": role.title,
            "must_have": must,
            "strong_signals": strong,
            "nice_to_have": nice,
            "feasibility": feasibility,
            "feasibility_score": max(20, min(score, 95)),
            "narrative": narrative,
            "constraints": constraints,
            "recommendations": recommendations,
            "label": "Rule-based calibration — not a live market model",
        }
