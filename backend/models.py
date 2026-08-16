from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def utcnow() -> datetime:
    return datetime.utcnow()


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    contact_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    roles: Mapped[list["Role"]] = relationship("Role", back_populates="client")


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("clients.id"), index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    seniority: Mapped[str] = mapped_column(String(40), nullable=False)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    urgency: Mapped[str] = mapped_column(String(20), default="normal")
    budget_range: Mapped[str] = mapped_column(String(80), nullable=False)
    location: Mapped[str] = mapped_column(String(80), nullable=False)
    work_mode: Mapped[str] = mapped_column(String(40), default="hybrid")
    status: Mapped[str] = mapped_column(String(40), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    client: Mapped["Client"] = relationship("Client", back_populates="roles")
    candidates: Mapped[list["Candidate"]] = relationship(
        "Candidate", back_populates="role", cascade="all, delete-orphan"
    )


class Candidate(Base):
    __tablename__ = "candidates"
    __table_args__ = (Index("ix_candidates_role_stage", "role_id", "stage"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    current_title: Mapped[str] = mapped_column(String(160), nullable=False)
    years_experience: Mapped[int] = mapped_column(Integer, default=0)
    skills: Mapped[list] = mapped_column(JSON, default=list)
    fit_score: Mapped[int] = mapped_column(Integer, default=0)
    fit_summary: Mapped[str] = mapped_column(Text, default="")
    stage: Mapped[str] = mapped_column(String(32), index=True, default="sourced")
    salary_expectation: Mapped[str] = mapped_column(String(80), default="")
    notice_period: Mapped[str] = mapped_column(String(40), default="")
    location: Mapped[str] = mapped_column(String(80), default="")
    recruiter_notes: Mapped[str] = mapped_column(Text, default="")
    rejection_reason: Mapped[str | None] = mapped_column(String(80), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    role: Mapped["Role"] = relationship("Role", back_populates="candidates")
    feedbacks: Mapped[list["InterviewFeedback"]] = relationship(
        "InterviewFeedback", back_populates="candidate", cascade="all, delete-orphan"
    )


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    candidate_id: Mapped[int] = mapped_column(ForeignKey("candidates.id"), index=True, nullable=False)
    technical_score: Mapped[int] = mapped_column(Integer, nullable=False)
    communication_score: Mapped[int] = mapped_column(Integer, nullable=False)
    role_fit_score: Mapped[int] = mapped_column(Integer, nullable=False)
    recommendation: Mapped[str] = mapped_column(String(40), nullable=False)
    feedback: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    candidate: Mapped["Candidate"] = relationship("Candidate", back_populates="feedbacks")
