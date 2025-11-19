# Copyright (c) 2025 iiPython

# Modules
import time
import typing
import secrets
from contextlib import asynccontextmanager

import aiosqlite
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from pydantic import BaseModel, StringConstraints

from fastapi import FastAPI, Header
from fastapi.responses import JSONResponse

# Models
type Username = typing.Annotated[str, StringConstraints(min_length = 3, max_length = 32)]

class AuthPayload(BaseModel):
    username: Username
    password: typing.Annotated[str, StringConstraints(min_length = 8)]

class MessagePayload(BaseModel):
    recipient: Username
    subject: typing.Annotated[str, StringConstraints(max_length = 100)]
    content: typing.Annotated[str, StringConstraints(min_length = 1, max_length = 2500)]

# Database
class Database:
    def __init__(self) -> None:
        self.argon2 = PasswordHasher()

    async def save(self) -> None:
        await self.db.commit()
        await self.db.close()

    async def init(self) -> None:
        self.db = await aiosqlite.connect("main.db")
        await self.db.execute("CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT, token TEXT)")
        await self.db.execute("CREATE TABLE IF NOT EXISTS messages (sender TEXT, recipient TEXT, subject TEXT, content TEXT, sent INTEGER)")

    async def login(self, username: str, password: str) -> str | None:
        async with self.db.execute("SELECT password, token FROM users WHERE username = ?", (username,)) as view:
            result = await view.fetchone()
            if result is None:
                return None

            try:
                password_hash, token = result
                self.argon2.verify(password_hash, password)

                # Check if we should rehash
                if self.argon2.check_needs_rehash(password_hash):
                    new_hash = self.argon2.hash(password)
                    await self.db.execute("UPDATE users SET password = ? WHERE username = ?", (new_hash, username))
                    await self.db.commit()

                return token

            except VerifyMismatchError:
                return None

    async def register(self, username: str, password: str) -> str | None:
        try:
            token = secrets.token_urlsafe()
            await self.db.execute("INSERT INTO users VALUES (?, ?, ?)", (username, self.argon2.hash(password), token))
            await self.db.commit()
            return token

        except aiosqlite.IntegrityError:
            return None

    async def validate_token(self, token: str) -> str | None:
        async with self.db.execute("SELECT username FROM users WHERE token = ?", (token,)) as result:
            result = await result.fetchone()
            return result[0] if result else None

    async def validate_username(self, username: str) -> bool:
        async with self.db.execute("SELECT token FROM users WHERE username = ?", (username,)) as result:
            return bool(await result.fetchone())

    async def message(self, sender: str, recipient: str, subject: str, content: str) -> None:
        await self.db.execute("INSERT INTO messages VALUES (?, ?, ?, ?, ?)", (sender, recipient, subject, content, round(time.time() * 1000)))
        await self.db.commit()

    async def read_inbox(self, recipient: str) -> list[dict]:
        results = await self.db.execute_fetchall("SELECT sender, subject, content, sent FROM messages WHERE recipient = ?", (recipient,))
        return [
            {"sender": sender, "recipient": recipient, "subject": subject, "content": content, "sent": sent}
            for (sender, subject, content, sent) in results
        ]

db = Database()

# Initialization
@asynccontextmanager
async def lifespan(app: FastAPI) -> typing.AsyncGenerator:
    await db.init()
    yield
    await db.save()

app = FastAPI(openapi_url = None, lifespan = lifespan)

# Routing
@app.post("/api/login")
async def route_login(data: AuthPayload) -> JSONResponse:
    token = await db.login(data.username, data.password)
    if token is None:
        return JSONResponse(
            {"code": 401, "data": {"message": "Invalid username or password."}},
            status_code = 401
        )

    return JSONResponse({"code": 200, "data": {"token": token}})

@app.post("/api/register")
async def route_register(data: AuthPayload) -> JSONResponse:
    token = await db.register(data.username, data.password)
    if token is None:
        return JSONResponse({"code": 400, "data": {"message": "Provided username is already taken."}}, 200)

    return JSONResponse({"code": 200, "data": {"token": token}}, 200)

@app.get("/api/inbox")
async def route_inbox(authorization: typing.Annotated[str, Header()]) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        })

    return JSONResponse({
        "code": 200,
        "data": await db.read_inbox(username)
    })

@app.post("/api/message")
async def route_message(authorization: typing.Annotated[str, Header()], data: MessagePayload) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        })

    if not await db.validate_username(data.recipient):
        return JSONResponse({
            "code": 400,
            "data": {"message": "Invalid message recipient specified."}
        })

    await db.message(username, data.recipient, data.subject, data.content)
    return JSONResponse({"code": 201}, status_code = 201)
