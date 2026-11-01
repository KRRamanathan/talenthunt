import os
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import Candidate, Client, InterviewFeedback, Role, utcnow


def _dt(days_ago: int, hours_ago: int = 0) -> datetime:
    return utcnow() - timedelta(days=days_ago, hours=hours_ago)


def populate(db: Session) -> None:
    clients = [
        Client(name="Stripe", contact_name="Priya Nair", created_at=_dt(40)),
        Client(name="Notion", contact_name="Arjun Mehta", created_at=_dt(36)),
        Client(name="Figma", contact_name="Kabir Shah", created_at=_dt(30)),
        Client(name="Ramp", contact_name="Leela Iyer", created_at=_dt(28)),
    ]
    db.add_all(clients)
    db.flush()
    stripe, notion, figma, ramp = clients

    roles_spec = [
        dict(
            client=stripe,
            title="Senior Backend Engineer",
            seniority="Senior",
            skills=["Python", "Backend APIs", "Kafka", "PostgreSQL", "FastAPI", "AWS", "Docker"],
            urgency="high",
            budget_range="₹18–24L",
            location="Bengaluru",
            work_mode="Hybrid",
            created_at=_dt(5),
        ),
        dict(
            client=stripe,
            title="Staff Platform Engineer",
            seniority="Staff",
            skills=["Go", "Kubernetes", "Distributed systems", "AWS", "Terraform"],
            urgency="normal",
            budget_range="₹36–48L",
            location="Bengaluru",
            work_mode="Remote",
            created_at=_dt(12),
        ),
        dict(
            client=stripe,
            title="Frontend Engineer",
            seniority="Mid-Senior",
            skills=["TypeScript", "React", "Design systems", "Vite"],
            urgency="normal",
            budget_range="₹22–30L",
            location="Pune",
            work_mode="Hybrid",
            created_at=_dt(8),
        ),
        dict(
            client=notion,
            title="Product Designer",
            seniority="Senior",
            skills=["Product design", "Figma", "Design systems", "Prototyping"],
            urgency="urgent",
            budget_range="₹20–28L",
            location="Mumbai",
            work_mode="Hybrid",
            created_at=_dt(6),
        ),
        dict(
            client=notion,
            title="Growth Marketing Lead",
            seniority="Lead",
            skills=["Growth", "Lifecycle", "Analytics", "B2B SaaS"],
            urgency="high",
            budget_range="₹28–36L",
            location="Mumbai",
            work_mode="Remote",
            created_at=_dt(9),
        ),
        dict(
            client=notion,
            title="Senior iOS Engineer",
            seniority="Senior",
            skills=["Swift", "iOS", "UIKit", "SwiftUI"],
            urgency="normal",
            budget_range="₹26–34L",
            location="Remote India",
            work_mode="Remote",
            created_at=_dt(11),
        ),
        dict(
            client=figma,
            title="ML Engineer",
            seniority="Senior",
            skills=["Python", "Applied ML", "Feature stores", "AWS"],
            urgency="high",
            budget_range="₹30–40L",
            location="Hyderabad",
            work_mode="Hybrid",
            created_at=_dt(7),
        ),
        dict(
            client=figma,
            title="DevOps Engineer",
            seniority="Senior",
            skills=["AWS", "Terraform", "CI/CD", "Kubernetes"],
            urgency="normal",
            budget_range="₹24–32L",
            location="Hyderabad",
            work_mode="Remote",
            created_at=_dt(14),
        ),
        dict(
            client=figma,
            title="Data Engineer",
            seniority="Mid-Senior",
            skills=["SQL", "dbt", "Python", "Warehousing"],
            urgency="normal",
            budget_range="₹20–28L",
            location="Hyderabad",
            work_mode="Hybrid",
            created_at=_dt(4),
        ),
        dict(
            client=ramp,
            title="Founding Designer",
            seniority="Lead",
            skills=["Brand", "Product design", "Figma", "Narrative"],
            urgency="urgent",
            budget_range="₹24–32L",
            location="Chennai",
            work_mode="Onsite",
            created_at=_dt(3),
        ),
        dict(
            client=ramp,
            title="Full-Stack Engineer",
            seniority="Senior",
            skills=["TypeScript", "React", "Node.js", "PostgreSQL"],
            urgency="high",
            budget_range="₹24–32L",
            location="Chennai",
            work_mode="Hybrid",
            created_at=_dt(10),
        ),
        dict(
            client=ramp,
            title="Customer Success Lead",
            seniority="Lead",
            skills=["Customer success", "SaaS", "Onboarding", "Narrative selling"],
            urgency="normal",
            budget_range="₹18–26L",
            location="Chennai",
            work_mode="Hybrid",
            created_at=_dt(15),
        ),
    ]

    roles: list[Role] = []
    for spec in roles_spec:
        client = spec.pop("client")
        role = Role(client_id=client.id, status="open", **spec)
        db.add(role)
        roles.append(role)
    db.flush()

    backend, platform, frontend, designer, growth, ios, ml, devops, data, founding, fullstack, cs = roles

    def C(**kwargs):
        kwargs.setdefault("created_at", kwargs.get("updated_at", _dt(4)))
        return Candidate(**kwargs)

    candidates = [
        # Stripe — Senior Backend Engineer (demo role)
        C(
            role_id=backend.id,
            name="Aarav Menon",
            current_title="Backend Engineer, fictional SaaS studio",
            years_experience=6,
            skills=["Python", "FastAPI", "PostgreSQL", "AWS", "Backend APIs", "Docker"],
            fit_score=91,
            fit_summary="Strong backend ownership across SaaS products with production Python/API experience. Matches all mandatory skills and three preferred signals.",
            stage="shortlisted",
            salary_expectation="₹32L",
            notice_period="30 days",
            location="Bengaluru",
            recruiter_notes="Quiet operator. Has shipped billing and auth services. Kafka is used but not owned — do not treat as a blocker.",
            updated_at=_dt(1, 4),
        ),
        C(
            role_id=backend.id,
            name="Diya Kapoor",
            current_title="Senior Software Engineer",
            years_experience=7,
            skills=["Python", "Django", "PostgreSQL", "AWS", "Backend APIs"],
            fit_score=84,
            fit_summary="Seasoned backend generalist. Django-heavy, FastAPI is a stretch but APIs and Postgres are production-grade.",
            stage="client_review",
            salary_expectation="₹30L",
            notice_period="45 days",
            location="Bengaluru",
            recruiter_notes="Waiting on Priya. Flagged for client review three days ago.",
            updated_at=_dt(3, 6),
        ),
        C(
            role_id=backend.id,
            name="Rohan Iyer",
            current_title="API Engineer",
            years_experience=5,
            skills=["Python", "FastAPI", "Redis", "Backend APIs"],
            fit_score=79,
            fit_summary="FastAPI-native. Thinner Postgres depth than the brief asks for; strong on shipping.",
            stage="client_review",
            salary_expectation="₹28L",
            notice_period="15 days",
            location="Chennai",
            recruiter_notes="Client has not opened the packet.",
            updated_at=_dt(2, 10),
        ),
        C(
            role_id=backend.id,
            name="Meera Shah",
            current_title="Backend Engineer",
            years_experience=6,
            skills=["Python", "PostgreSQL", "FastAPI", "Docker"],
            fit_score=81,
            fit_summary="Clean systems thinking, slightly under the compensation ceiling if we negotiate joining bonus instead of base.",
            stage="client_review",
            salary_expectation="₹29L",
            notice_period="30 days",
            location="Pune",
            recruiter_notes="Strong culture fit for a seed team.",
            updated_at=_dt(2, 2),
        ),
        C(
            role_id=backend.id,
            name="Sana Qureshi",
            current_title="Software Engineer",
            years_experience=4,
            skills=["Python", "Flask", "PostgreSQL"],
            fit_score=72,
            fit_summary="Promising mid-level. Needs one more production ownership story before client review.",
            stage="sourced",
            salary_expectation="₹24L",
            notice_period="30 days",
            location="Hyderabad",
            recruiter_notes="Screen pending this week.",
            updated_at=_dt(0, 8),
        ),
        C(
            role_id=backend.id,
            name="Vikram Nair",
            current_title="Senior Backend Engineer",
            years_experience=8,
            skills=["Python", "FastAPI", "PostgreSQL", "AWS", "Kafka"],
            fit_score=88,
            fit_summary="Closest Kafka match on the slate. Compensation sits above the current ceiling.",
            stage="interview",
            salary_expectation="₹36L",
            notice_period="60 days",
            location="Bengaluru",
            recruiter_notes="Interviewed Tuesday. Feedback still empty — collect today.",
            updated_at=_dt(0, 6),
        ),
        C(
            role_id=backend.id,
            name="Kiran Das",
            current_title="Staff Engineer",
            years_experience=10,
            skills=["Python", "Distributed systems", "AWS"],
            fit_score=77,
            fit_summary="Over-leveled for the brief and well above budget.",
            stage="rejected",
            rejection_reason="Compensation mismatch",
            salary_expectation="₹48L",
            notice_period="90 days",
            location="Bengaluru",
            recruiter_notes="Politely closed. Do not recycle at this band.",
            updated_at=_dt(4),
        ),
        C(
            role_id=backend.id,
            name="Ishaan Bhat",
            current_title="Backend Engineer",
            years_experience=5,
            skills=["Java", "Spring", "PostgreSQL"],
            fit_score=61,
            fit_summary="Strong engineer, wrong primary stack.",
            stage="rejected",
            rejection_reason="Skill gap",
            salary_expectation="₹26L",
            notice_period="30 days",
            location="Bengaluru",
            recruiter_notes="Internal reject after screen.",
            updated_at=_dt(3),
        ),
        # Platform
        C(role_id=platform.id, name="Tara Gill", current_title="Platform Engineer", years_experience=9, skills=["Go", "Kubernetes", "AWS", "Terraform"], fit_score=90, fit_summary="Deep platform ownership at a fictional infra startup.", stage="interview", salary_expectation="₹44L", notice_period="45 days", location="Bengaluru", recruiter_notes="Panel this week.", updated_at=_dt(1)),
        C(role_id=platform.id, name="Dev Patel", current_title="SRE", years_experience=7, skills=["Go", "Kubernetes", "AWS"], fit_score=82, fit_summary="SRE-shaped platform profile.", stage="shortlisted", salary_expectation="₹38L", notice_period="30 days", location="Remote", recruiter_notes="Ready for packet.", updated_at=_dt(2)),
        C(role_id=platform.id, name="Anika Rao", current_title="Infrastructure Engineer", years_experience=6, skills=["Terraform", "AWS", "Python"], fit_score=74, fit_summary="Infra-strong, Go is developing.", stage="sourced", salary_expectation="₹34L", notice_period="30 days", location="Bengaluru", recruiter_notes="", updated_at=_dt(1)),
        C(role_id=platform.id, name="Harsh Vora", current_title="Staff Engineer", years_experience=11, skills=["Go", "Distributed systems"], fit_score=80, fit_summary="Staff-level, compensation stretch.", stage="rejected", rejection_reason="Compensation mismatch", salary_expectation="₹55L", notice_period="60 days", location="Bengaluru", recruiter_notes="Closed.", updated_at=_dt(6)),
        # Frontend
        C(role_id=frontend.id, name="Nisha Varghese", current_title="Frontend Engineer", years_experience=5, skills=["TypeScript", "React", "Design systems"], fit_score=86, fit_summary="Design-system literate React engineer.", stage="client_review", salary_expectation="₹26L", notice_period="30 days", location="Pune", recruiter_notes="Packet sent.", updated_at=_dt(1, 5)),
        C(role_id=frontend.id, name="Omar Sheikh", current_title="UI Engineer", years_experience=4, skills=["TypeScript", "React", "Vite"], fit_score=78, fit_summary="Product-minded UI engineer.", stage="shortlisted", salary_expectation="₹24L", notice_period="15 days", location="Pune", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=frontend.id, name="Pia Krishnan", current_title="Software Engineer", years_experience=6, skills=["React", "JavaScript"], fit_score=70, fit_summary="Less TypeScript depth than we want.", stage="sourced", salary_expectation="₹22L", notice_period="30 days", location="Kochi", recruiter_notes="", updated_at=_dt(0, 12)),
        C(role_id=frontend.id, name="Yash Mistry", current_title="Frontend Engineer", years_experience=5, skills=["TypeScript", "React"], fit_score=75, fit_summary="Solid but notice period is long.", stage="rejected", rejection_reason="Notice period", salary_expectation="₹25L", notice_period="90 days", location="Pune", recruiter_notes="Internal.", updated_at=_dt(5)),
        # Notion Product Designer — shortlist below target
        C(role_id=designer.id, name="Lila Bose", current_title="Product Designer", years_experience=6, skills=["Product design", "Figma", "Design systems"], fit_score=88, fit_summary="End-to-end product designer with systems craft.", stage="sourced", salary_expectation="₹26L", notice_period="30 days", location="Mumbai", recruiter_notes="Needs a design review before shortlist.", updated_at=_dt(1)),
        C(role_id=designer.id, name="Rehan Malik", current_title="Product Designer", years_experience=4, skills=["Figma", "Prototyping"], fit_score=73, fit_summary="Strong craft, thinner product sense.", stage="sourced", salary_expectation="₹20L", notice_period="15 days", location="Mumbai", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=designer.id, name="Aditi Sen", current_title="Visual Designer", years_experience=7, skills=["Brand", "Figma"], fit_score=68, fit_summary="Visual-first; product systems are a stretch.", stage="sourced", salary_expectation="₹24L", notice_period="30 days", location="Kolkata", recruiter_notes="", updated_at=_dt(3)),
        C(role_id=designer.id, name="Zoe D'Souza", current_title="UX Designer", years_experience=5, skills=["Product design", "Research"], fit_score=71, fit_summary="Research-led, Figma systems developing.", stage="rejected", rejection_reason="Skill gap", salary_expectation="₹22L", notice_period="30 days", location="Goa", recruiter_notes="Internal screen.", updated_at=_dt(4)),
        # Growth
        C(role_id=growth.id, name="Farah Khan", current_title="Growth Lead", years_experience=8, skills=["Growth", "Lifecycle", "B2B SaaS"], fit_score=87, fit_summary="B2B lifecycle operator.", stage="shortlisted", salary_expectation="₹34L", notice_period="45 days", location="Mumbai", recruiter_notes="Strong narrative.", updated_at=_dt(1)),
        C(role_id=growth.id, name="Nikhil Rao", current_title="Product Marketing", years_experience=6, skills=["Analytics", "B2B SaaS"], fit_score=76, fit_summary="PMM leaning growth.", stage="sourced", salary_expectation="₹28L", notice_period="30 days", location="Bengaluru", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=growth.id, name="Smita Jain", current_title="Growth Manager", years_experience=5, skills=["Growth", "Analytics"], fit_score=80, fit_summary="Experimentation-heavy growth manager.", stage="client_review", salary_expectation="₹30L", notice_period="30 days", location="Mumbai", recruiter_notes="Awaiting Arjun.", updated_at=_dt(2, 4)),
        C(role_id=growth.id, name="Arun Pillai", current_title="Demand Gen Lead", years_experience=9, skills=["Growth"], fit_score=69, fit_summary="Demand-gen, not lifecycle.", stage="rejected", rejection_reason="Experience mismatch", salary_expectation="₹36L", notice_period="60 days", location="Delhi NCR", recruiter_notes="", updated_at=_dt(6)),
        # iOS
        C(role_id=ios.id, name="Kenji Rao", current_title="iOS Engineer", years_experience=7, skills=["Swift", "SwiftUI", "UIKit"], fit_score=89, fit_summary="Native iOS with SwiftUI production work.", stage="interview", salary_expectation="₹32L", notice_period="30 days", location="Remote India", recruiter_notes="Onsite loop scheduled.", updated_at=_dt(0, 3)),
        C(role_id=ios.id, name="Mira Anand", current_title="Mobile Engineer", years_experience=5, skills=["Swift", "UIKit"], fit_score=81, fit_summary="UIKit-strong, SwiftUI catching up.", stage="shortlisted", salary_expectation="₹28L", notice_period="30 days", location="Bengaluru", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=ios.id, name="Paul Cherian", current_title="iOS Engineer", years_experience=6, skills=["Swift", "iOS"], fit_score=77, fit_summary="Solid IC, less systems design.", stage="sourced", salary_expectation="₹27L", notice_period="45 days", location="Kochi", recruiter_notes="", updated_at=_dt(1)),
        C(role_id=ios.id, name="Ritu Lal", current_title="Android Engineer", years_experience=6, skills=["Kotlin"], fit_score=55, fit_summary="Wrong mobile stack.", stage="rejected", rejection_reason="Skill gap", salary_expectation="₹26L", notice_period="30 days", location="Pune", recruiter_notes="", updated_at=_dt(8)),
        # Figma ML — interview feedback received
        C(role_id=ml.id, name="Ayan Ghosh", current_title="ML Engineer", years_experience=6, skills=["Python", "Applied ML", "AWS"], fit_score=85, fit_summary="Applied ML with production features, not research-only.", stage="interview", salary_expectation="₹38L", notice_period="45 days", location="Hyderabad", recruiter_notes="Feedback in — recommend hold on comp.", updated_at=_dt(0, 5)),
        C(role_id=ml.id, name="Sneha Kulkarni", current_title="Applied Scientist", years_experience=5, skills=["Python", "Applied ML"], fit_score=80, fit_summary="Scientist leaning engineer.", stage="shortlisted", salary_expectation="₹34L", notice_period="30 days", location="Pune", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=ml.id, name="Joel Abraham", current_title="Data Scientist", years_experience=7, skills=["Python", "Feature stores"], fit_score=74, fit_summary="DS with light MLOps.", stage="sourced", salary_expectation="₹32L", notice_period="60 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(1)),
        C(role_id=ml.id, name="Nandini Rao", current_title="ML Engineer", years_experience=8, skills=["Python", "Applied ML", "AWS"], fit_score=83, fit_summary="Strong, above budget.", stage="rejected", rejection_reason="Compensation mismatch", salary_expectation="₹46L", notice_period="60 days", location="Bengaluru", recruiter_notes="", updated_at=_dt(5)),
        C(role_id=ml.id, name="Ibrahim Noor", current_title="ML Engineer", years_experience=4, skills=["Python"], fit_score=66, fit_summary="Too early for the brief.", stage="rejected", rejection_reason="Experience mismatch", salary_expectation="₹24L", notice_period="30 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(4)),
        # DevOps — offer narrative
        C(role_id=devops.id, name="Sahil Reddy", current_title="DevOps Engineer", years_experience=7, skills=["AWS", "Terraform", "Kubernetes", "CI/CD"], fit_score=92, fit_summary="Offer accepted verbally — paperwork pending.", stage="offer", salary_expectation="₹30L", notice_period="30 days", location="Hyderabad", recruiter_notes="Verbal yes. Move role toward closed once signed.", updated_at=_dt(0, 2)),
        C(role_id=devops.id, name="Gita Sharma", current_title="SRE", years_experience=6, skills=["AWS", "CI/CD"], fit_score=78, fit_summary="Backup if offer slips.", stage="interview", salary_expectation="₹28L", notice_period="30 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(3)),
        C(role_id=devops.id, name="Owen D'Silva", current_title="Platform Engineer", years_experience=5, skills=["Terraform", "AWS"], fit_score=73, fit_summary="Keep warm.", stage="shortlisted", salary_expectation="₹26L", notice_period="15 days", location="Goa", recruiter_notes="", updated_at=_dt(4)),
        C(role_id=devops.id, name="Bhavya Iyer", current_title="DevOps Engineer", years_experience=8, skills=["AWS", "Kubernetes"], fit_score=80, fit_summary="Withdrew after competing offer.", stage="rejected", rejection_reason="Candidate withdrew", salary_expectation="₹34L", notice_period="30 days", location="Chennai", recruiter_notes="", updated_at=_dt(7)),
        # Data
        C(role_id=data.id, name="Rhea Menon", current_title="Data Engineer", years_experience=5, skills=["SQL", "dbt", "Python"], fit_score=84, fit_summary="Modern data stack IC.", stage="shortlisted", salary_expectation="₹24L", notice_period="30 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(1)),
        C(role_id=data.id, name="Varun Sethi", current_title="Analytics Engineer", years_experience=4, skills=["SQL", "dbt"], fit_score=77, fit_summary="Analytics engineer, warehouse-native.", stage="sourced", salary_expectation="₹22L", notice_period="15 days", location="Delhi NCR", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=data.id, name="Ira Kapur", current_title="Data Engineer", years_experience=6, skills=["Python", "SQL", "Warehousing"], fit_score=81, fit_summary="Batch pipelines, light dbt.", stage="client_review", salary_expectation="₹26L", notice_period="45 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(1, 8)),
        C(role_id=data.id, name="Samir Qadri", current_title="BI Engineer", years_experience=5, skills=["SQL"], fit_score=64, fit_summary="BI, not engineering.", stage="rejected", rejection_reason="Experience mismatch", salary_expectation="₹20L", notice_period="30 days", location="Hyderabad", recruiter_notes="", updated_at=_dt(3)),
        # Founding designer
        C(role_id=founding.id, name="Esha Nair", current_title="Design Lead", years_experience=8, skills=["Brand", "Product design", "Figma", "Narrative"], fit_score=90, fit_summary="Founding-shaped designer.", stage="shortlisted", salary_expectation="₹30L", notice_period="30 days", location="Chennai", recruiter_notes="Onsite preference is the only friction.", updated_at=_dt(0, 20)),
        C(role_id=founding.id, name="Marco Alvarez", current_title="Brand Designer", years_experience=6, skills=["Brand", "Figma"], fit_score=74, fit_summary="Brand-first.", stage="sourced", salary_expectation="₹24L", notice_period="30 days", location="Goa", recruiter_notes="", updated_at=_dt(1)),
        C(role_id=founding.id, name="Tanvi Joshi", current_title="Product Designer", years_experience=5, skills=["Product design", "Figma"], fit_score=79, fit_summary="Will not relocate onsite.", stage="rejected", rejection_reason="Location", salary_expectation="₹26L", notice_period="30 days", location="Bengaluru", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=founding.id, name="Colin Dey", current_title="Designer", years_experience=4, skills=["Figma"], fit_score=67, fit_summary="Too early for founding scope.", stage="sourced", salary_expectation="₹18L", notice_period="15 days", location="Chennai", recruiter_notes="", updated_at=_dt(0, 6)),
        # Full-stack
        C(role_id=fullstack.id, name="Amrita Singh", current_title="Full-Stack Engineer", years_experience=6, skills=["TypeScript", "React", "Node.js", "PostgreSQL"], fit_score=88, fit_summary="Product full-stack with taste.", stage="client_review", salary_expectation="₹30L", notice_period="30 days", location="Chennai", recruiter_notes="Leela has the packet.", updated_at=_dt(1, 2)),
        C(role_id=fullstack.id, name="Ben Hoffman", current_title="Software Engineer", years_experience=5, skills=["TypeScript", "React", "Node.js"], fit_score=82, fit_summary="FE-leaning full-stack.", stage="shortlisted", salary_expectation="₹28L", notice_period="30 days", location="Remote", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=fullstack.id, name="Keerthi Das", current_title="Backend Engineer", years_experience=7, skills=["Node.js", "PostgreSQL"], fit_score=76, fit_summary="BE-leaning.", stage="sourced", salary_expectation="₹26L", notice_period="45 days", location="Chennai", recruiter_notes="", updated_at=_dt(3)),
        C(role_id=fullstack.id, name="Hugo Fernandez", current_title="Full-Stack Engineer", years_experience=6, skills=["React", "Node.js"], fit_score=70, fit_summary="Client passed on communication.", stage="rejected", rejection_reason="Client rejected", salary_expectation="₹27L", notice_period="30 days", location="Goa", recruiter_notes="Do not re-share.", updated_at=_dt(6)),
        # CS
        C(role_id=cs.id, name="Kavya Krishnan", current_title="CS Manager", years_experience=8, skills=["Customer success", "SaaS", "Onboarding"], fit_score=86, fit_summary="Narrative seller, not a ticket closer.", stage="offer", salary_expectation="₹24L", notice_period="30 days", location="Chennai", recruiter_notes="Offer out.", updated_at=_dt(1)),
        C(role_id=cs.id, name="Rajan Bose", current_title="Implementation Lead", years_experience=6, skills=["Onboarding", "SaaS"], fit_score=78, fit_summary="Implementation-shaped CS.", stage="interview", salary_expectation="₹22L", notice_period="30 days", location="Kolkata", recruiter_notes="", updated_at=_dt(2)),
        C(role_id=cs.id, name="Ines Dutta", current_title="Account Manager", years_experience=5, skills=["Customer success"], fit_score=72, fit_summary="AM, lighter onboarding craft.", stage="shortlisted", salary_expectation="₹20L", notice_period="15 days", location="Chennai", recruiter_notes="", updated_at=_dt(4)),
        C(role_id=cs.id, name="Vivek Nanda", current_title="Support Lead", years_experience=7, skills=["Support"], fit_score=60, fit_summary="Support, not success.", stage="rejected", rejection_reason="Experience mismatch", salary_expectation="₹18L", notice_period="30 days", location="Chennai", recruiter_notes="", updated_at=_dt(9)),
    ]
    db.add_all(candidates)
    db.flush()

    vikram = next(c for c in candidates if c.name == "Vikram Nair")
    ayan = next(c for c in candidates if c.name == "Ayan Ghosh")
    kenji = next(c for c in candidates if c.name == "Kenji Rao")
    gita = next(c for c in candidates if c.name == "Gita Sharma")
    rajan = next(c for c in candidates if c.name == "Rajan Bose")

    db.add_all(
        [
            InterviewFeedback(
                candidate_id=ayan.id,
                technical_score=4,
                communication_score=4,
                role_fit_score=3,
                recommendation="Hold",
                feedback="Technically sound. Compensation expectation is the remaining risk.",
                created_at=_dt(0, 4),
            ),
            InterviewFeedback(
                candidate_id=kenji.id,
                technical_score=5,
                communication_score=4,
                role_fit_score=4,
                recommendation="Proceed",
                feedback="Shipped a SwiftUI rewrite. Clear systems thinking for a mobile IC.",
                created_at=_dt(1),
            ),
            InterviewFeedback(
                candidate_id=gita.id,
                technical_score=3,
                communication_score=4,
                role_fit_score=4,
                recommendation="Hold",
                feedback="Reliable SRE. Kubernetes depth is thinner than Sahil.",
                created_at=_dt(2),
            ),
            InterviewFeedback(
                candidate_id=rajan.id,
                technical_score=3,
                communication_score=5,
                role_fit_score=4,
                recommendation="Proceed",
                feedback="Client-facing instinct is strong. Implementation craft is enough for a seed CS motion.",
                created_at=_dt(2),
            ),
            InterviewFeedback(
                candidate_id=vikram.id,
                technical_score=5,
                communication_score=3,
                role_fit_score=4,
                recommendation="Hold",
                feedback="Excellent systems depth. Compensation and notice period both sit above the brief — collect a second round only if budget moves.",
                created_at=_dt(0, 5),
            ),
        ]
    )
    db.commit()


STALE_AFTER_DAYS = 47


def _demo_is_stale() -> bool:
    if os.getenv("DEMO_AUTO_REFRESH", "1") == "0":
        return False
    db = SessionLocal()
    try:
        oldest = db.query(func.min(Client.created_at)).scalar()
    finally:
        db.close()
    return oldest is not None and utcnow() - oldest > timedelta(days=STALE_AFTER_DAYS)


def seed(reset: bool = True) -> None:
    Base.metadata.create_all(bind=engine)
    if not reset and _demo_is_stale():
        print("Demo data has drifted out of its story window. Refreshing.")
        reset = True
    if reset:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Client).count() == 0:
            populate(db)
            print("Seeded TalentHunt with fictional clients, roles, and candidates.")
        else:
            print("Database already has data. Skipping seed.")
    finally:
        db.close()


if __name__ == "__main__":
    seed(reset=True)
