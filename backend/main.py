import os
from contextlib import asynccontextmanager
from datetime import datetime

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from database import Base, engine, get_db
from models import Candidate, Client, InterviewFeedback, Role, utcnow
from schemas import (
    CandidateOut,
    CandidatePatch,
    ClientOut,
    FeedbackCreate,
    FeedbackOut,
    FitSignal,
    GroupedCandidates,
    PaginatedRoles,
    RoleCreate,
    RoleOut,
)
from seed import seed as run_seed
from services import calibration_cache, market_cache
from services.calibration import RoleCalibrationService
from services.copilot import RecruiterCopilotService
from services.health import PipelineHealthService
from services.integrations import IntegrationsService
from services.jira import JiraService
from services.market import MarketInsightsService
from services.matching import CandidateMatchingService
from services.notifications import NotificationService
from services.report import HiringReportService

load_dotenv()

KANBAN = ("sourced", "shortlisted", "client_review", "interview", "offer")
VALID_STAGES = KANBAN + ("rejected",)
TIMELINE = {"urgent": "3–5 days", "high": "5–7 days", "normal": "7–10 days"}


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    run_seed(reset=False)
    yield


app = FastAPI(title="TalentHunt API", version="1.0.0", lifespan=lifespan)
app.add_middleware(GZipMiddleware, minimum_size=400)

frontend = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _humanize_hours(hours: int) -> str:
    if hours < 48:
        return f"{max(1, hours)}h"
    return f"{hours // 24} days"


def _timeline(urgency: str) -> str:
    return TIMELINE.get((urgency or "normal").lower(), TIMELINE["normal"])


def _role_out(role: Role, health: dict | None = None) -> RoleOut:
    candidates = list(role.candidates or [])
    health = health or PipelineHealthService.health(role, candidates)
    sla = health["sla"]
    return RoleOut(
        id=role.id,
        client_id=role.client_id,
        title=role.title,
        seniority=role.seniority,
        skills=role.skills or [],
        urgency=role.urgency,
        budget_range=role.budget_range,
        location=role.location,
        work_mode=role.work_mode,
        status=role.status,
        created_at=role.created_at,
        client_name=role.client.name if role.client else None,
        contact_name=role.client.contact_name if role.client else None,
        candidate_count=len([c for c in candidates if c.stage != "rejected"]),
        days_active=sla["days_active"],
        estimated_timeline=_timeline(role.urgency),
        health_score=health["score"],
        health_status=health["status"],
        sla_label=sla["label"],
    )


def _feedback_out(row: InterviewFeedback) -> FeedbackOut:
    avg = round((row.technical_score + row.communication_score + row.role_fit_score) / 3, 2)
    return FeedbackOut(
        id=row.id,
        candidate_id=row.candidate_id,
        technical_score=row.technical_score,
        communication_score=row.communication_score,
        role_fit_score=row.role_fit_score,
        recommendation=row.recommendation,
        feedback=row.feedback,
        created_at=row.created_at,
        average_score=avg,
    )


def _candidate_out(candidate: Candidate, role: Role | None = None, public: bool = False) -> CandidateOut:
    role = role or candidate.role
    intel = CandidateMatchingService.intelligence(candidate, role) if role else {"fit_breakdown": [], "recommendation": None}
    feedbacks = [_feedback_out(f) for f in (candidate.feedbacks or [])]
    avg = None
    if feedbacks:
        avg = round(sum(f.average_score or 0 for f in feedbacks) / len(feedbacks), 2)
    return CandidateOut(
        id=candidate.id,
        role_id=candidate.role_id,
        name=candidate.name,
        current_title=candidate.current_title,
        years_experience=candidate.years_experience,
        skills=candidate.skills or [],
        fit_score=candidate.fit_score,
        fit_summary=candidate.fit_summary,
        stage=candidate.stage,
        salary_expectation=candidate.salary_expectation,
        notice_period=candidate.notice_period,
        location=candidate.location,
        recruiter_notes=None if public else candidate.recruiter_notes,
        rejection_reason=None if public else candidate.rejection_reason,
        updated_at=candidate.updated_at,
        created_at=candidate.created_at,
        fit_breakdown=[FitSignal(**row) for row in intel["fit_breakdown"]],
        recommendation=intel["recommendation"],
        feedbacks=feedbacks,
        role_title=role.title if role else None,
        client_name=role.client.name if role and role.client else None,
        average_interview_score=avg,
    )


def _load_role(db: Session, role_id: int) -> Role:
    role = db.scalars(
        select(Role)
        .options(selectinload(Role.client), selectinload(Role.candidates).selectinload(Candidate.feedbacks))
        .where(Role.id == role_id)
    ).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@app.get("/health")
@app.get("/healthz")
def healthz():
    return {"ok": True, "service": "talenthunt-api"}


@app.post("/demo/reset")
def reset_demo():
    run_seed(reset=True)
    calibration_cache.invalidate()
    market_cache.invalidate()
    IntegrationsService.reset()
    return {"ok": True, "detail": "Demo data restored to the original story."}


@app.get("/clients", response_model=list[ClientOut])
def list_clients(db: Session = Depends(get_db)):
    return db.scalars(select(Client).order_by(Client.id)).all()


@app.post("/roles", response_model=RoleOut)
def create_role(payload: RoleCreate, db: Session = Depends(get_db)):
    client = db.get(Client, payload.client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    role = Role(
        client_id=payload.client_id,
        title=payload.title,
        seniority=payload.seniority,
        skills=payload.skills,
        urgency=payload.urgency,
        budget_range=payload.budget_range,
        location=payload.location,
        work_mode=payload.work_mode,
        status="open",
        created_at=utcnow(),
    )
    db.add(role)
    db.commit()
    role = _load_role(db, role.id)
    calibration_cache.invalidate()
    market_cache.invalidate()
    return _role_out(role)


@app.get("/roles", response_model=PaginatedRoles)
def list_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count(Role.id))) or 0
    roles = db.scalars(
        select(Role)
        .options(selectinload(Role.client), selectinload(Role.candidates))
        .order_by(Role.created_at.desc())
        .offset(skip)
        .limit(limit)
    ).all()
    return PaginatedRoles(
        items=[_role_out(role) for role in roles],
        total=total,
        skip=skip,
        limit=limit,
    )


@app.get("/roles/{role_id}", response_model=RoleOut)
def get_role(role_id: int, db: Session = Depends(get_db)):
    return _role_out(_load_role(db, role_id))


@app.get("/roles/{role_id}/candidates", response_model=GroupedCandidates)
def role_candidates(
    role_id: int,
    perspective: str = Query("recruiter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    role = _load_role(db, role_id)
    public = perspective == "client"
    grouped = {stage: [] for stage in KANBAN}
    grouped["rejected"] = []
    ordered = sorted(role.candidates, key=lambda c: (-c.fit_score, c.name))
    sliced = ordered[skip : skip + limit]
    for candidate in sliced:
        if public and candidate.stage == "rejected":
            continue
        if public and candidate.stage == "sourced":
            continue
        bucket = candidate.stage if candidate.stage in grouped else "rejected"
        grouped[bucket].append(_candidate_out(candidate, role, public=public))
    return GroupedCandidates(total=len(ordered), **grouped)


@app.get("/roles/{role_id}/health")
def role_health(role_id: int, db: Session = Depends(get_db)):
    role = _load_role(db, role_id)
    return PipelineHealthService.health(role, list(role.candidates))


@app.get("/roles/{role_id}/report")
def role_report(role_id: int, db: Session = Depends(get_db)):
    role = _load_role(db, role_id)
    return HiringReportService.build(role, list(role.candidates))


@app.get("/roles/{role_id}/calibration")
def role_calibration(role_id: int, db: Session = Depends(get_db)):
    role = _load_role(db, role_id)

    def compute():
        return RoleCalibrationService.calibrate(role)

    return calibration_cache.get_or_set(f"cal:{role_id}", compute)


@app.get("/roles/{role_id}/market-insights")
def role_market(role_id: int, db: Session = Depends(get_db)):
    role = _load_role(db, role_id)

    def compute():
        return MarketInsightsService.insights(role)

    # Versioned key so deeper market fields refresh after deploy
    return market_cache.get_or_set(f"mkt:v2:{role_id}", compute)


@app.get("/roles/{role_id}/matches")
def role_matches(role_id: int, db: Session = Depends(get_db)):
    role = _load_role(db, role_id)
    return CandidateMatchingService.rank_for_role(role, list(role.candidates))


@app.get("/notifications")
def list_notifications(db: Session = Depends(get_db)):
    roles = db.scalars(
        select(Role)
        .options(selectinload(Role.client), selectinload(Role.candidates))
        .where(Role.status == "open")
    ).all()
    return NotificationService.build(list(roles))


class NotificationAct(BaseModel):
    note: str = ""


@app.post("/notifications/{notification_id}/act")
def act_notification(notification_id: str, payload: NotificationAct | None = None):
    return {
        "ok": True,
        "notification_id": notification_id,
        "status": "queued",
        "message": "Simulated action queued. No external Slack/email/calendar send was performed.",
        "note": (payload.note if payload else "") or None,
    }


@app.get("/integrations")
def list_integrations():
    return IntegrationsService.list_all()


@app.get("/integrations/jira/board")
def jira_board(db: Session = Depends(get_db)):
    roles = db.scalars(
        select(Role)
        .options(selectinload(Role.client), selectinload(Role.candidates))
        .where(Role.status == "open")
    ).all()
    return JiraService.board(list(roles))


class IntegrationPatch(BaseModel):
    status: str


@app.patch("/integrations/{integration_id}")
def patch_integration(integration_id: str, payload: IntegrationPatch):
    try:
        item = IntegrationsService.set_status(integration_id, payload.status)
    except KeyError:
        raise HTTPException(status_code=404, detail="Integration not found")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return item


@app.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: int,
    perspective: str = Query("recruiter"),
    db: Session = Depends(get_db),
):
    candidate = db.scalars(
        select(Candidate)
        .options(
            selectinload(Candidate.feedbacks),
            selectinload(Candidate.role).selectinload(Role.client),
        )
        .where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    public = perspective == "client"
    if public and candidate.stage in {"sourced", "rejected"}:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return _candidate_out(candidate, candidate.role, public=public)


@app.patch("/candidates/{candidate_id}", response_model=CandidateOut)
def patch_candidate(candidate_id: int, payload: CandidatePatch, db: Session = Depends(get_db)):
    candidate = db.scalars(
        select(Candidate)
        .options(
            selectinload(Candidate.feedbacks),
            selectinload(Candidate.role).selectinload(Role.client),
        )
        .where(Candidate.id == candidate_id)
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if payload.stage:
        if payload.stage not in VALID_STAGES:
            raise HTTPException(status_code=400, detail="Invalid stage")
        candidate.stage = payload.stage
        if payload.stage != "rejected":
            candidate.rejection_reason = None
    if payload.rejection_reason is not None:
        candidate.rejection_reason = payload.rejection_reason
        if payload.stage == "rejected" or candidate.stage == "rejected":
            candidate.stage = "rejected"
    if payload.recruiter_notes is not None:
        candidate.recruiter_notes = payload.recruiter_notes
    candidate.updated_at = utcnow()
    db.commit()
    db.refresh(candidate)
    return _candidate_out(candidate, candidate.role)


@app.post("/candidates/{candidate_id}/feedback", response_model=FeedbackOut)
def add_feedback(candidate_id: int, payload: FeedbackCreate, db: Session = Depends(get_db)):
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    row = InterviewFeedback(
        candidate_id=candidate_id,
        technical_score=payload.technical_score,
        communication_score=payload.communication_score,
        role_fit_score=payload.role_fit_score,
        recommendation=payload.recommendation,
        feedback=payload.feedback,
        created_at=utcnow(),
    )
    db.add(row)
    candidate.updated_at = utcnow()
    db.commit()
    db.refresh(row)
    return _feedback_out(row)


@app.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    roles = db.scalars(
        select(Role)
        .options(selectinload(Role.client), selectinload(Role.candidates).selectinload(Candidate.feedbacks))
        .where(Role.status == "open")
        .order_by(Role.created_at.desc())
    ).all()
    now = datetime.utcnow()
    active_roles = len(roles)
    awaiting = 0
    client_pending = 0
    interviews = 0
    at_risk = 0
    attention = []
    for role in roles:
        health = PipelineHealthService.health(role, list(role.candidates), now)
        awaiting += len([c for c in role.candidates if c.stage in {"sourced", "shortlisted", "client_review"}])
        waiting = health["waiting_client_review"]
        client_pending += waiting
        interviews += len([c for c in role.candidates if c.stage == "interview"])
        if health["status"] in {"at_risk", "blocked"}:
            at_risk += 1
        sla_hours = health["sla"]["client_response_hours"]
        reason = health["recommendation"]
        if waiting >= 2:
            reason = f"{waiting} candidates waiting for client review"
            sla = (
                f"Client SLA: {max(1, 24 - sla_hours)}h left"
                if sla_hours < 24
                else f"Client SLA: {_humanize_hours(sla_hours - 24)} overdue"
            )
        elif health["breakdown"]["candidate_volume"] < 18:
            reason = "Shortlist below target"
            sla = health["sla"]["label"]
        elif any(c.stage == "interview" and c.feedbacks for c in role.candidates):
            reason = "Interview feedback received"
            sla = health["sla"]["label"]
        else:
            sla = health["sla"]["label"]
        if health["status"] != "on_track" or waiting >= 2 or any(c.stage == "offer" for c in role.candidates):
            attention.append(
                {
                    "role_id": role.id,
                    "client_name": role.client.name if role.client else "",
                    "title": role.title,
                    "reason": reason,
                    "sla": sla,
                    "status": health["status"],
                    "score": health["score"],
                }
            )

    attention.sort(
        key=lambda row: (
            0 if "waiting for client" in row["reason"] else 1,
            {"blocked": 0, "at_risk": 1, "on_track": 2}[row["status"]],
            -row["score"],
        )
    )
    copilot = RecruiterCopilotService.actions(list(roles), now)
    notifications = NotificationService.build(list(roles), now)
    primary = attention[0] if attention else None
    next_step = None
    if primary:
        next_step = {
            "label": "Open the top at-risk role",
            "detail": f"{primary['client_name']} — {primary['title']}",
            "href": f"/app/pipeline/{primary['role_id']}",
        }
    elif copilot:
        next_step = {
            "label": copilot[0]["action"],
            "detail": copilot[0]["title"],
            "href": copilot[0]["href"],
        }
    else:
        next_step = {
            "label": "Review the pipeline",
            "detail": "All roles look quiet — scan for shortlist opportunities.",
            "href": "/app/pipeline",
        }

    return {
        "greeting_name": "Ramanathan",
        "metrics": {
            "active_roles": active_roles,
            "candidates_awaiting_action": awaiting,
            "client_responses_pending": client_pending,
            "interviews_today": interviews,
            "roles_at_risk": at_risk,
        },
        "attention": attention[:6],
        "copilot": {
            "headline": f"You have {len(copilot)} actions that need attention."
            if copilot
            else "No urgent copilot actions. Pipelines are quiet.",
            "actions": copilot,
        },
        "notifications_count": len(notifications["items"]),
        "next_step": next_step,
        "journey": [
            {"id": "brief", "label": "Brief", "href": "/intake"},
            {"id": "calibrate", "label": "Calibrate", "href": "/app/pipeline"},
            {"id": "match", "label": "Match", "href": "/app/pipeline"},
            {"id": "pipeline", "label": "Pipeline", "href": "/app/pipeline"},
            {"id": "decide", "label": "Decide", "href": "/client"},
            {"id": "report", "label": "Report", "href": "/app/pipeline"},
        ],
        "note": "Deterministic command-center summary from live pipeline data. Intelligence is explainable and rule-based.",
    }
