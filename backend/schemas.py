from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ClientOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    contact_name: str
    created_at: datetime


class RoleCreate(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    seniority: str
    skills: list[str] = Field(default_factory=list)
    urgency: str = "normal"
    budget_range: str
    location: str
    work_mode: str = "hybrid"
    client_id: int


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_id: int
    title: str
    seniority: str
    skills: list[str]
    urgency: str
    budget_range: str
    location: str
    work_mode: str
    status: str
    created_at: datetime
    client_name: Optional[str] = None
    contact_name: Optional[str] = None
    candidate_count: int = 0
    days_active: int = 0
    estimated_timeline: Optional[str] = None
    health_score: Optional[int] = None
    health_status: Optional[str] = None
    sla_label: Optional[str] = None


class CandidatePatch(BaseModel):
    stage: Optional[str] = None
    rejection_reason: Optional[str] = None
    recruiter_notes: Optional[str] = None


class FeedbackCreate(BaseModel):
    technical_score: int = Field(ge=1, le=5)
    communication_score: int = Field(ge=1, le=5)
    role_fit_score: int = Field(ge=1, le=5)
    recommendation: str
    feedback: str = ""


class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_id: int
    technical_score: int
    communication_score: int
    role_fit_score: int
    recommendation: str
    feedback: str
    created_at: datetime
    average_score: Optional[float] = None


class FitSignal(BaseModel):
    signal: str
    rating: str


class CandidateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role_id: int
    name: str
    current_title: str
    years_experience: int
    skills: list[str]
    fit_score: int
    fit_summary: str
    stage: str
    salary_expectation: str
    notice_period: str
    location: str
    recruiter_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    updated_at: datetime
    created_at: datetime
    fit_breakdown: list[FitSignal] = Field(default_factory=list)
    recommendation: Optional[str] = None
    feedbacks: list[FeedbackOut] = Field(default_factory=list)
    role_title: Optional[str] = None
    client_name: Optional[str] = None
    average_interview_score: Optional[float] = None


class PaginatedRoles(BaseModel):
    items: list[RoleOut]
    total: int
    skip: int
    limit: int


class GroupedCandidates(BaseModel):
    sourced: list[CandidateOut]
    shortlisted: list[CandidateOut]
    client_review: list[CandidateOut]
    interview: list[CandidateOut]
    offer: list[CandidateOut]
    rejected: list[CandidateOut] = Field(default_factory=list)
    total: int
