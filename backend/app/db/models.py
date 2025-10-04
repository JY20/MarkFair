from typing import Optional

from sqlalchemy import Integer, String, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .session import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    # Clerk subject id
    sub: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    # Optional YouTube channel id
    youtube_channel_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    # Optional wallet address (chain-agnostic string)
    wallet_address: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    # User type: 'KOL' or 'Advertiser'
    user_type: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    videos = relationship("Video", back_populates="user")


class Video(Base):
    __tablename__ = "videos"
    __table_args__ = (UniqueConstraint("user_id", "video_url", name="uq_user_video"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    video_url: Mapped[str] = mapped_column(String, nullable=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    views: Mapped[int] = mapped_column(Integer, default=0)
    subscribers_at_add: Mapped[int] = mapped_column(Integer, default=0)
    # YouTube metadata captured at add time
    yt_channel_id: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)
    yt_channel_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Auto-refresh support
    last_refreshed_at: Mapped[Optional[DateTime]] = mapped_column(DateTime, nullable=True)
    subscribers_current: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    user = relationship("User", back_populates="videos")


