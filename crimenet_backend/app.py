from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import sqlite3
from contextlib import asynccontextmanager, contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator


ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv("CRIMENET_DB", ROOT / "crimenet.db"))
NOW = lambda: datetime.now(timezone.utc).isoformat()


@contextmanager
def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def password_hash(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), 240_000)
    return f"{salt}:{digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split(":", 1)
        return secrets.compare_digest(password_hash(password, salt).split(":", 1)[1], expected)
    except ValueError:
        return False


SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL, designation TEXT NOT NULL, role TEXT NOT NULL,
  badge_number TEXT NOT NULL, profile_image TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, risk TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
  UNIQUE(name, type)
);
CREATE TABLE IF NOT EXISTS case_entities (
  case_id TEXT NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY(case_id, entity_id)
);
CREATE TABLE IF NOT EXISTS relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  target TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  type TEXT NOT NULL, confidence TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  UNIQUE(source, target, type)
);
CREATE TABLE IF NOT EXISTS intelligence (
  id TEXT PRIMARY KEY, source TEXT NOT NULL, type TEXT NOT NULL,
  confidence TEXT NOT NULL, content TEXT NOT NULL, case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL, created_by INTEGER REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS intelligence_entities (
  intelligence_id TEXT NOT NULL REFERENCES intelligence(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  PRIMARY KEY(intelligence_id, entity_id)
);
CREATE TABLE IF NOT EXISTS flags (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
  severity TEXT NOT NULL, created_at TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, case_id TEXT REFERENCES cases(id) ON DELETE SET NULL,
  author TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL,
  content_json TEXT NOT NULL, created_at TEXT NOT NULL
);
"""


SEED_CASES = [
    ("CR-001", "Network Investigation Alpha", "active", "high", "Investigation involving a coordinated network with multiple linked entities."),
    ("CR-002", "Intelligence Review", "under-investigation", "critical", "Cross-entity investigation involving financial and communication links."),
    ("CR-003", "Financial Relationship Analysis", "active", "medium", "Analysis of suspected financial relationships between multiple entities."),
    ("CR-004", "Entity Connection Review", "closed", "low", "Completed investigation involving historical relationship analysis."),
]
SEED_ENTITIES = [
    ("ENT-001", "Arjun Mehta", "Person", "High", "Key operative identified in high-volume transaction clusters.", ["CR-001", "CR-003"]),
    ("ENT-002", "Nova Trading Ltd.", "Organization", "High", "Registered export firm used as conduit for regional shipments.", ["CR-001", "CR-002"]),
    ("ENT-003", "Delhi North Hub", "Location", "Medium", "Logistics staging warehouse in industrial sector.", ["CR-001", "CR-003"]),
    ("ENT-004", "Rohan Kapoor", "Person", "Medium", "Associate linked through encrypted communications.", ["CR-002"]),
    ("ENT-005", "Apex Holdings", "Organization", "Low", "Holding corporation with real estate assets under scrutiny.", ["CR-002", "CR-004"]),
    ("ENT-006", "Mumbai Port Sector 4", "Location", "Low", "Freight forwarding transit point.", ["CR-004"]),
    ("ENT-007", "+91 98230 44812", "Phone", "High", "Mobile observed in cross-network ping bursts.", ["CR-001", "CR-002"]),
]
SEED_RELATIONSHIPS = [
    ("ENT-001", "ENT-002", "Financial", "High", "Direct shell account wire transfers totaling $420,000"),
    ("ENT-001", "ENT-003", "Logistics", "Medium", "Vehicle geo-coordinates matched warehouse perimeter"),
    ("ENT-002", "ENT-005", "Association", "High", "Shared executive directorship records"),
    ("ENT-004", "ENT-001", "Communication", "High", "Frequent call logs spanning 30-day window"),
    ("ENT-004", "ENT-007", "Communication", "High", "Subscriber registration match"),
    ("ENT-005", "ENT-006", "Logistics", "Low", "Consignment bill of lading linkage"),
]
SEED_INTELLIGENCE = [
    ("INT-2026-081", "Financial Intelligence Unit", "Wire Transfer Anomaly", "High", "Flagged repeated high-frequency transfers of $48,000 below reporting threshold to shell company Nova Trading Ltd.", "CR-001"),
    ("INT-2026-079", "Field Surveillance Unit 3", "Physical Surveillance", "High", "Subject ENT-001 observed meeting associate at industrial staging warehouse near Delhi North Hub.", "CR-001"),
    ("INT-2026-074", "Telecom Intercepts", "Communication Log", "Medium", "Mobile +91 98230 44812 active with burst encrypted transmissions targeting offshore IP block.", "CR-002"),
]


def next_id(connection: sqlite3.Connection, table: str, prefix: str, width: int = 3) -> str:
    rows = connection.execute(f"SELECT id FROM {table} WHERE id LIKE ?", (f"{prefix}%",)).fetchall()
    nums = [int(match.group(1)) for row in rows if (match := re.search(r"(\d+)$", row["id"]))]
    return f"{prefix}{max(nums, default=0) + 1:0{width}d}"


def seed(connection: sqlite3.Connection, clear: bool = False) -> None:
    if clear:
        for table in ("intelligence_entities", "case_entities", "relationships", "reports", "flags", "intelligence", "entities", "cases"):
            connection.execute(f"DELETE FROM {table}")
    stamp = NOW()
    connection.execute(
        "INSERT OR IGNORE INTO users(username,password_hash,first_name,last_name,email,designation,role,badge_number) VALUES(?,?,?,?,?,?,?,?)",
        ("analyst", password_hash("Crimenet@123"), "System", "Analyst", "analyst@crimenet.com", "Senior Investigator", "Administrator", "INV-8492"),
    )
    user_id = connection.execute("SELECT id FROM users WHERE username='analyst'").fetchone()["id"]
    for item in SEED_CASES:
        connection.execute("INSERT OR IGNORE INTO cases VALUES(?,?,?,?,?,?,?)", (*item, stamp, stamp))
    for eid, name, kind, risk, details, cases in SEED_ENTITIES:
        connection.execute("INSERT OR IGNORE INTO entities VALUES(?,?,?,?,?,?)", (eid, name, kind, risk, details, stamp))
        for case_id in cases:
            connection.execute("INSERT OR IGNORE INTO case_entities VALUES(?,?)", (case_id, eid))
    for source, target, kind, confidence, notes in SEED_RELATIONSHIPS:
        connection.execute("INSERT OR IGNORE INTO relationships(source,target,type,confidence,notes,created_at) VALUES(?,?,?,?,?,?)", (source, target, kind, confidence, notes, stamp))
    for iid, source, kind, confidence, content, case_id in SEED_INTELLIGENCE:
        connection.execute("INSERT OR IGNORE INTO intelligence VALUES(?,?,?,?,?,?,?,?)", (iid, source, kind, confidence, content, case_id, stamp, user_id))
    flags = [
        ("FLG-001", "Repeated connection pattern", "Multiple cross-domain relationships connect the same high-risk cluster.", "HIGH"),
        ("FLG-002", "Entity activity overlap", "Related entities were active within the same investigation window.", "MEDIUM"),
        ("FLG-003", "High-value financial relationship", "A financial link involving a high-risk entity requires review.", "REVIEW"),
    ]
    for item in flags:
        connection.execute("INSERT OR IGNORE INTO flags(id,title,description,severity,created_at) VALUES(?,?,?,?,?)", (*item, stamp))


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with db() as connection:
        connection.executescript(SCHEMA)
        seed(connection)


def human_time(value: str) -> str:
    try:
        delta = datetime.now(timezone.utc) - datetime.fromisoformat(value)
        seconds = max(0, int(delta.total_seconds()))
        if seconds < 60: return "Just now"
        if seconds < 3600: return f"{seconds // 60}m ago"
        if seconds < 86400: return f"{seconds // 3600}h ago"
        return f"{seconds // 86400}d ago"
    except Exception:
        return "Recent"


class LoginInput(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=1, max_length=200)


class CaseInput(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    status: Literal["active", "under-investigation", "closed", "archived"] = "active"
    priority: Literal["critical", "high", "medium", "low"] = "medium"
    summary: str = Field(default="", max_length=5000)
    entityCount: int = 0
    updated: str = "Just now"


class EntityInput(BaseModel):
    id: str | None = None
    name: str = Field(min_length=1, max_length=250)
    type: Literal["Person", "Organization", "Location", "Phone", "Vehicle"]
    risk: Literal["Critical", "High", "Medium", "Low"] = "Medium"
    cases: list[str] = []
    details: str = Field(default="", max_length=5000)


class RelationshipInput(BaseModel):
    source: str
    target: str
    type: Literal["Financial", "Communication", "Association", "Family", "Logistics", "Co-occurrence"] = "Association"
    confidence: Literal["High", "Medium", "Low"] = "High"
    notes: str = Field(default="", max_length=5000)

    @field_validator("target")
    @classmethod
    def different_nodes(cls, value: str, info):
        if value == info.data.get("source"):
            raise ValueError("source and target must differ")
        return value


class IntelligenceInput(BaseModel):
    source: str = Field(min_length=1, max_length=200)
    type: str = Field(default="Investigator Submission", max_length=100)
    confidence: Literal["High", "Medium", "Low"] = "Medium"
    content: str = Field(min_length=3, max_length=50_000)
    caseId: str | None = None


class ProfileInput(BaseModel):
    firstName: str = Field(min_length=1, max_length=100)
    lastName: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=200)
    designation: str = Field(min_length=1, max_length=150)
    role: str = Field(min_length=1, max_length=100)
    badgeNumber: str = Field(min_length=1, max_length=100)
    profileImage: str = ""


class ReportInput(BaseModel):
    caseId: str | None = None
    title: str | None = None
    type: str = "Comprehensive Intelligence Brief"


def current_user(authorization: str | None = Header(default=None)) -> sqlite3.Row:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required")
    token = authorization[7:]
    with db() as connection:
        row = connection.execute("SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=?", (token,)).fetchone()
    if not row:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session")
    return row


def profile_json(row: sqlite3.Row) -> dict[str, Any]:
    return {"firstName": row["first_name"], "lastName": row["last_name"], "email": row["email"], "designation": row["designation"], "role": row["role"], "badgeNumber": row["badge_number"], "profileImage": row["profile_image"]}


def case_json(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    count = connection.execute("SELECT COUNT(*) n FROM case_entities WHERE case_id=?", (row["id"],)).fetchone()["n"]
    return {"id": row["id"], "title": row["title"], "status": row["status"], "priority": row["priority"], "summary": row["summary"], "entityCount": count, "updated": human_time(row["updated_at"])}


def entity_json(connection: sqlite3.Connection, row: sqlite3.Row) -> dict[str, Any]:
    cases = [x["case_id"] for x in connection.execute("SELECT case_id FROM case_entities WHERE entity_id=? ORDER BY case_id", (row["id"],))]
    return {"id": row["id"], "name": row["name"], "type": row["type"], "risk": row["risk"], "cases": cases, "details": row["details"]}


def extract_entities(text: str) -> list[tuple[str, str]]:
    """Deterministic NLP extraction for identifiers and named entities in submitted evidence."""
    found: set[tuple[str, str]] = set()
    for phone in re.findall(r"(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}", text):
        found.add((re.sub(r"\s+", " ", phone).strip(), "Phone"))
    for vehicle in re.findall(r"\b[A-Z]{2}[ -]?\d{1,2}[ -]?[A-Z]{1,3}[ -]?\d{4}\b", text):
        found.add((vehicle, "Vehicle"))
    org_re = r"\b([A-Z][\w&'-]+(?:\s+[A-Z][\w&'-]+){0,4}\s+(?:Ltd\.?|Limited|Holdings|Corporation|Corp\.?|Company|Foundation|Group|Bank))\b"
    for org in re.findall(org_re, text):
        found.add((org.strip(), "Organization"))
    location_re = r"\b([A-Z][\w'-]+(?:\s+[A-Z0-9][\w'-]+){0,4}\s+(?:Hub|Port|Warehouse|Airport|Station|Sector\s+\d+))\b"
    for location in re.findall(location_re, text):
        found.add((location.strip(), "Location"))
    person_re = r"\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})\b"
    excluded = {"Financial Intelligence", "Physical Surveillance", "Telecom Intercepts", "Open Source Intelligence"}
    for person in re.findall(person_re, text):
        overlaps_known = any(
            kind != "Person" and (person in name or name in person)
            for name, kind in found
        )
        if person not in excluded and not overlaps_known and not any(s in person for s in ("Trading", "Holdings", "North Hub")):
            found.add((person.strip(), "Person"))
    return sorted(found)


def relationship_kind(text: str) -> str:
    value = text.lower()
    if any(x in value for x in ("transfer", "payment", "account", "wire", "transaction")): return "Financial"
    if any(x in value for x in ("call", "phone", "message", "communication", "intercept")): return "Communication"
    if any(x in value for x in ("shipment", "vehicle", "warehouse", "port", "logistics")): return "Logistics"
    if any(x in value for x in ("brother", "sister", "father", "mother", "family")): return "Family"
    return "Co-occurrence"


def network_analysis(connection: sqlite3.Connection) -> dict[str, Any]:
    entities = connection.execute("SELECT * FROM entities").fetchall()
    links = connection.execute("SELECT * FROM relationships").fetchall()
    degrees = {row["id"]: 0 for row in entities}
    for link in links:
        degrees[link["source"]] = degrees.get(link["source"], 0) + 1
        degrees[link["target"]] = degrees.get(link["target"], 0) + 1
    ranked = sorted(entities, key=lambda row: degrees[row["id"]], reverse=True)
    n = len(entities)
    return {
        "nodes": n,
        "links": len(links),
        "density": round((2 * len(links) / (n * (n - 1))) if n > 1 else 0, 4),
        "influencers": [{"id": row["id"], "name": row["name"], "degree": degrees[row["id"]], "score": round(degrees[row["id"]] / max(1, n - 1), 3)} for row in ranked[:10]],
    }


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(title="CrimeNet Intelligence API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health():
    return {"status": "ok", "database": str(DB_PATH.name), "time": NOW()}


@app.post("/api/auth/login")
def login(payload: LoginInput):
    with db() as connection:
        user = connection.execute("SELECT * FROM users WHERE username=?", (payload.username.strip(),)).fetchone()
        if not user or not verify_password(payload.password, user["password_hash"]):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid username or password")
        token = secrets.token_urlsafe(32)
        connection.execute("INSERT INTO sessions VALUES(?,?,?)", (token, user["id"], NOW()))
        return {"token": token, "profile": profile_json(user)}


@app.post("/api/auth/logout", status_code=204)
def logout(authorization: str | None = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        with db() as connection:
            connection.execute("DELETE FROM sessions WHERE token=?", (authorization[7:],))
    return Response(status_code=204)


@app.get("/api/cases")
def list_cases(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [case_json(connection, row) for row in connection.execute("SELECT * FROM cases ORDER BY updated_at DESC")]


@app.post("/api/cases", status_code=201)
def create_case(payload: CaseInput, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        case_id = next_id(connection, "cases", "CR-")
        stamp = NOW()
        connection.execute("INSERT INTO cases VALUES(?,?,?,?,?,?,?)", (case_id, payload.title.strip(), payload.status, payload.priority, payload.summary.strip(), stamp, stamp))
        return case_json(connection, connection.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())


@app.put("/api/cases/{case_id}")
def update_case(case_id: str, payload: CaseInput, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if not connection.execute("SELECT 1 FROM cases WHERE id=?", (case_id,)).fetchone(): raise HTTPException(404, "Case not found")
        connection.execute("UPDATE cases SET title=?,status=?,priority=?,summary=?,updated_at=? WHERE id=?", (payload.title.strip(), payload.status, payload.priority, payload.summary.strip(), NOW(), case_id))
        return case_json(connection, connection.execute("SELECT * FROM cases WHERE id=?", (case_id,)).fetchone())


@app.delete("/api/cases/{case_id}", status_code=204)
def delete_case(case_id: str, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if connection.execute("DELETE FROM cases WHERE id=?", (case_id,)).rowcount == 0: raise HTTPException(404, "Case not found")
    return Response(status_code=204)


@app.get("/api/entities")
def list_entities(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [entity_json(connection, row) for row in connection.execute("SELECT * FROM entities ORDER BY created_at DESC")]


@app.post("/api/entities", status_code=201)
def create_entity(payload: EntityInput, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        entity_id = next_id(connection, "entities", "ENT-")
        try:
            connection.execute("INSERT INTO entities VALUES(?,?,?,?,?,?)", (entity_id, payload.name.strip(), payload.type, payload.risk, payload.details.strip(), NOW()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "An entity with this name and type already exists")
        for case_id in payload.cases:
            if connection.execute("SELECT 1 FROM cases WHERE id=?", (case_id,)).fetchone(): connection.execute("INSERT OR IGNORE INTO case_entities VALUES(?,?)", (case_id, entity_id))
        return entity_json(connection, connection.execute("SELECT * FROM entities WHERE id=?", (entity_id,)).fetchone())


@app.put("/api/entities/{entity_id}")
def update_entity(entity_id: str, payload: EntityInput, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if not connection.execute("SELECT 1 FROM entities WHERE id=?", (entity_id,)).fetchone(): raise HTTPException(404, "Entity not found")
        connection.execute("UPDATE entities SET name=?,type=?,risk=?,details=? WHERE id=?", (payload.name.strip(), payload.type, payload.risk, payload.details.strip(), entity_id))
        connection.execute("DELETE FROM case_entities WHERE entity_id=?", (entity_id,))
        for case_id in payload.cases: connection.execute("INSERT OR IGNORE INTO case_entities VALUES(?,?)", (case_id, entity_id))
        return entity_json(connection, connection.execute("SELECT * FROM entities WHERE id=?", (entity_id,)).fetchone())


@app.delete("/api/entities/{entity_id}", status_code=204)
def delete_entity(entity_id: str, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if connection.execute("DELETE FROM entities WHERE id=?", (entity_id,)).rowcount == 0: raise HTTPException(404, "Entity not found")
    return Response(status_code=204)


@app.get("/api/relationships")
def list_relationships(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [dict(row) for row in connection.execute("SELECT source,target,type,confidence,notes FROM relationships ORDER BY created_at")]


@app.post("/api/relationships", status_code=201)
def create_relationship(payload: RelationshipInput, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        for eid in (payload.source, payload.target):
            if not connection.execute("SELECT 1 FROM entities WHERE id=?", (eid,)).fetchone(): raise HTTPException(400, f"Unknown entity {eid}")
        try:
            connection.execute("INSERT INTO relationships(source,target,type,confidence,notes,created_at) VALUES(?,?,?,?,?,?)", (payload.source, payload.target, payload.type, payload.confidence, payload.notes, NOW()))
        except sqlite3.IntegrityError:
            raise HTTPException(409, "Relationship already exists")
        return payload.model_dump()


@app.get("/api/flags")
def list_flags(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [{"id": row["id"], "title": row["title"], "description": row["description"], "severity": row["severity"], "detectedAt": human_time(row["created_at"])} for row in connection.execute("SELECT * FROM flags WHERE resolved=0 ORDER BY created_at DESC")]


@app.get("/api/intelligence")
def list_intelligence(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [{"id": row["id"], "source": row["source"], "type": row["type"], "confidence": row["confidence"], "content": row["content"], "caseId": row["case_id"], "time": human_time(row["created_at"]), "createdAt": row["created_at"]} for row in connection.execute("SELECT * FROM intelligence ORDER BY created_at DESC")]


@app.post("/api/intelligence", status_code=201)
def ingest(payload: IntelligenceInput, user: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if payload.caseId and not connection.execute("SELECT 1 FROM cases WHERE id=?", (payload.caseId,)).fetchone(): raise HTTPException(400, "Unknown case")
        iid = next_id(connection, "intelligence", f"INT-{datetime.now().year}-", 3)
        stamp = NOW()
        connection.execute("INSERT INTO intelligence VALUES(?,?,?,?,?,?,?,?)", (iid, payload.source.strip(), payload.type, payload.confidence, payload.content.strip(), payload.caseId, stamp, user["id"]))
        extracted_ids: list[str] = []
        # Link explicit known names/IDs first, then add newly extracted entities.
        for row in connection.execute("SELECT * FROM entities"):
            if row["id"].lower() in payload.content.lower() or row["name"].lower() in payload.content.lower(): extracted_ids.append(row["id"])
        for name, kind in extract_entities(payload.content):
            row = connection.execute("SELECT id FROM entities WHERE lower(name)=lower(?) AND type=?", (name, kind)).fetchone()
            if row:
                entity_id = row["id"]
            else:
                entity_id = next_id(connection, "entities", "ENT-")
                connection.execute("INSERT INTO entities VALUES(?,?,?,?,?,?)", (entity_id, name, kind, "Medium", f"Automatically extracted from {iid}.", stamp))
            extracted_ids.append(entity_id)
        extracted_ids = list(dict.fromkeys(extracted_ids))
        for eid in extracted_ids:
            connection.execute("INSERT OR IGNORE INTO intelligence_entities VALUES(?,?)", (iid, eid))
            if payload.caseId: connection.execute("INSERT OR IGNORE INTO case_entities VALUES(?,?)", (payload.caseId, eid))
        kind = relationship_kind(payload.content)
        for index, source in enumerate(extracted_ids):
            for target in extracted_ids[index + 1:]:
                try:
                    connection.execute("INSERT INTO relationships(source,target,type,confidence,notes,created_at) VALUES(?,?,?,?,?,?)", (source, target, kind, payload.confidence, f"Co-mentioned in {iid}: {payload.content[:240]}", stamp))
                except sqlite3.IntegrityError:
                    pass
        suspicious = bool(re.search(r"(?:\$|₹|rs\.?)[\s]*[\d,]{4,}|encrypted|offshore|shell|threshold|burst|multiple accounts", payload.content, re.I))
        if suspicious:
            fid = next_id(connection, "flags", "FLG-")
            connection.execute("INSERT INTO flags(id,title,description,severity,created_at) VALUES(?,?,?,?,?)", (fid, "Suspicious intelligence pattern", f"Automated analysis flagged {iid} for financial, concealment, or communication-risk indicators.", "HIGH" if payload.confidence == "High" else "MEDIUM", stamp))
        return {"id": iid, "source": payload.source, "type": payload.type, "confidence": payload.confidence, "content": payload.content, "caseId": payload.caseId, "time": "Just now", "createdAt": stamp, "extractedEntityIds": extracted_ids, "relationshipsCreated": max(0, len(extracted_ids) * (len(extracted_ids) - 1) // 2), "flagged": suspicious}


@app.get("/api/analytics/network")
def analytics(_: sqlite3.Row = Depends(current_user)):
    with db() as connection: return network_analysis(connection)


@app.get("/api/profile")
def get_profile(user: sqlite3.Row = Depends(current_user)):
    return profile_json(user)


@app.put("/api/profile")
def update_profile(payload: ProfileInput, user: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        connection.execute("UPDATE users SET first_name=?,last_name=?,email=?,designation=?,role=?,badge_number=?,profile_image=? WHERE id=?", (payload.firstName, payload.lastName, payload.email, payload.designation, payload.role, payload.badgeNumber, payload.profileImage, user["id"]))
        return profile_json(connection.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone())


@app.get("/api/reports")
def list_reports(_: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        return [{"id": row["id"], "title": row["title"], "caseId": row["case_id"] or "All", "author": row["author"], "date": datetime.fromisoformat(row["created_at"]).strftime("%d %b %Y"), "type": row["type"], "status": row["status"]} for row in connection.execute("SELECT * FROM reports ORDER BY created_at DESC")]


@app.post("/api/reports", status_code=201)
def generate_report(payload: ReportInput, user: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        if payload.caseId and not connection.execute("SELECT 1 FROM cases WHERE id=?", (payload.caseId,)).fetchone(): raise HTTPException(400, "Unknown case")
        case_filter = " WHERE ce.case_id=?" if payload.caseId else ""
        params = (payload.caseId,) if payload.caseId else ()
        entities = [entity_json(connection, row) for row in connection.execute(f"SELECT DISTINCT e.* FROM entities e LEFT JOIN case_entities ce ON ce.entity_id=e.id{case_filter}", params)]
        entity_ids = {item["id"] for item in entities}
        relationships = [dict(row) for row in connection.execute("SELECT source,target,type,confidence,notes FROM relationships") if row["source"] in entity_ids and row["target"] in entity_ids]
        flags = [{"id": r["id"], "title": r["title"], "severity": r["severity"], "description": r["description"]} for r in connection.execute("SELECT * FROM flags WHERE resolved=0")]
        analysis = network_analysis(connection)
        report_id = next_id(connection, "reports", "REP-")
        title = payload.title or (f"Intelligence Brief: {payload.caseId}" if payload.caseId else "Comprehensive Criminal Network Intelligence Brief")
        author = f"{user['first_name']} {user['last_name']}"
        content = {"generatedAt": NOW(), "scope": payload.caseId or "All investigations", "executiveSummary": f"Analysis covers {len(entities)} entities, {len(relationships)} relationships, and {len(flags)} unresolved analytical flags.", "networkAnalysis": analysis, "entities": entities, "relationships": relationships, "flags": flags}
        connection.execute("INSERT INTO reports VALUES(?,?,?,?,?,?,?,?)", (report_id, title, payload.caseId, author, payload.type, "Finalized", json.dumps(content), NOW()))
        return {"id": report_id, "title": title, "caseId": payload.caseId or "All", "author": author, "date": datetime.now().strftime("%d %b %Y"), "type": payload.type, "status": "Finalized"}


@app.get("/api/reports/{report_id}/export")
def export_report(report_id: str, _: sqlite3.Row = Depends(current_user)):
    with db() as connection:
        row = connection.execute("SELECT * FROM reports WHERE id=?", (report_id,)).fetchone()
        if not row: raise HTTPException(404, "Report not found")
        body = {"id": row["id"], "title": row["title"], "caseId": row["case_id"], "author": row["author"], "type": row["type"], "status": row["status"], **json.loads(row["content_json"])}
        return Response(json.dumps(body, indent=2), media_type="application/json", headers={"Content-Disposition": f'attachment; filename="{report_id}.json"'})


@app.post("/api/admin/reset")
def reset_data(user: sqlite3.Row = Depends(current_user)):
    if user["role"].lower() != "administrator": raise HTTPException(403, "Administrator role required")
    with db() as connection: seed(connection, clear=True)
    return {"status": "restored"}
