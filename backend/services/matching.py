"""CandidateMatchingService — explainable fit breakdown from skills overlap."""

from models import Candidate, Role

PREFERRED_SIGNALS = {"startup", "saas", "ownership", "distributed systems", "aws"}


class CandidateMatchingService:
    @staticmethod
    def breakdown(candidate: Candidate, role: Role) -> list[dict]:
        cand_skills = {s.lower() for s in (candidate.skills or [])}
        role_skills = [s for s in (role.skills or [])]
        rows = []
        for skill in role_skills[:6]:
            rating = "Strong" if skill.lower() in cand_skills else "Partial"
            if skill.lower() not in cand_skills:
                rating = "Gap" if skill.lower() in {"kafka", "kubernetes"} else "Developing"
            rows.append({"signal": skill, "rating": rating})

        if candidate.years_experience >= 5:
            rows.append({"signal": "Experience", "rating": "Strong"})
        elif candidate.years_experience >= 3:
            rows.append({"signal": "Experience", "rating": "Match"})
        else:
            rows.append({"signal": "Experience", "rating": "Light"})

        loc_match = candidate.location.split(",")[0].strip().lower() in role.location.lower()
        rows.append({"signal": "Location", "rating": "Match" if loc_match else "Flexible"})
        rows.append({"signal": "Startup experience", "rating": "Preferred"})
        return rows

    @staticmethod
    def recommendation(candidate: Candidate) -> str:
        if candidate.stage == "rejected":
            return "Do not proceed"
        if candidate.fit_score >= 88:
            if candidate.stage in {"sourced", "shortlisted"}:
                return "Proceed to Client Review"
            if candidate.stage == "client_review":
                return "Nudge client — this is a high-confidence match"
            if candidate.stage == "interview":
                return "Collect interview feedback this week"
            return "Advance toward offer"
        if candidate.fit_score >= 75:
            return "Keep on a curated shortlist"
        return "Hold — better used as a pipeline backup"

    @classmethod
    def intelligence(cls, candidate: Candidate, role: Role) -> dict:
        return {
            "fit_breakdown": cls.breakdown(candidate, role),
            "recommendation": cls.recommendation(candidate),
            "why": candidate.fit_summary,
        }
