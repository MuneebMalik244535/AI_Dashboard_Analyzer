import uuid
from datetime import datetime
import json
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sessions = relationship("SessionModel", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessageModel", back_populates="user", cascade="all, delete-orphan")

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    file_info_json = Column(Text, nullable=False, default="{}")

    user = relationship("User", back_populates="sessions")
    chat_messages = relationship("ChatMessageModel", back_populates="session", cascade="all, delete-orphan")

    @property
    def file_info(self):
        try:
            return json.loads(self.file_info_json)
        except Exception:
            return {}

    @file_info.setter
    def file_info(self, value):
        self.file_info_json = json.dumps(value)

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("sessions.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    stats_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chat_messages")
    session = relationship("SessionModel", back_populates="chat_messages")
