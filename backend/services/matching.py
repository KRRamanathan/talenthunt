"""CandidateMatchingService — explainable fit and automated shortlist ranking."""

from models import Candidate, Role

PREFERRED_SIGNALS = {"startup", "saas", "ownership", "distributed systems", "aws"}


class CandidateMatchingService:
    @staticmethod
    def breakdown(candidate: Candidate, role: Role) -> list[dict]:
        cand_skills = {s.lower() for s in (candidate.skills or [])}
        role_skills = [s for s in (role.skills or [])]
        rows = []
        for skill in role_skills[:6]:
            if skill.lower() in cand_skills:
                rating = "Strong"
            elif skill.lower() in {"kafka", "kubernetes"}:
                rating = "Gap"
            else:
                rating = "Developing"
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

    @classmethod
    def rank_for_role(cls, role: Role, candidates: list[Candidate]) -> dict:
        """Automated matching: rank active candidates and surface next actions."""
        active = [c for c in candidates if c.stage != "rejected"]
        ranked = sorted(active, key=lambda c: (-c.fit_score, c.name))

        must = {(s or "").lower() for s in (role.skills or [])[:3]}
        matches = []
        for candidate in ranked:
            cand_skills = {(s or "").lower() for s in (candidate.skills or [])}
            covered = sorted(must & cand_skills)
            missing = sorted(must - cand_skills)
            intel = cls.intelligence(candidate, role)
            confidence = (
                "High" if candidate.fit_score >= 88 else "Strong" if candidate.fit_score >= 78 else "Moderate"
            )
            action = "Shortlist now" if candidate.stage == "sourced" and candidate.fit_score >= 78 else (
                "Send to client" if candidate.stage == "shortlisted" and candidate.fit_score >= 85 else (
                    "Keep nurturing" if candidate.fit_score >= 70 else "Park as backup"
                )
            )
            matches.append(
                {
                    "candidate_id": candidate.id,
                    "name": candidate.name,
                    "current_title": candidate.current_title,
                    "stage": candidate.stage,
                    "fit_score": candidate.fit_score,
                    "confidence": confidence,
                    "why": candidate.fit_summary,
                    "recommendation": intel["recommendation"],
                    "suggested_action": action,
                    "must_have_covered": covered,
                    "must_have_gaps": missing,
                    "skills": candidate.skills or [],
                    "location": candidate.location,
                    "fit_breakdown": intel["fit_breakdown"],
                }
            )

        ready = [m for m in matches if m["fit_score"] >= 85 and m["stage"] in {"sourced", "shortlisted"}]
        return {
            "role_id": role.id,
            "role_title": role.title,
            "client_name": role.client.name if role.client else None,
            "total_ranked": len(matches),
            "ready_for_shortlist": len(ready),
            "matches": matches,
            "insight": (
                f"{len(ready)} profiles clear the curated bar for this brief."
                if ready
                else "No high-confidence matches yet — widen one must-have or source 3 more profiles."
            ),
            "label": "Automated matching — deterministic, explainable ranking (not a live ML model)",
        }
