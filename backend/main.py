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

class DeletePayload(BaseModel):
    message_id: typing.Annotated[str, StringConstraints(min_length = 43, max_length = 43)]

class TypingLog(typing.TypedDict):
    key: str
    offset: int

class TypingPayload(BaseModel):
    logs: list[TypingLog]
    hits: int

# Database
class Database:
    def __init__(self) -> None:
        self.argon2 = PasswordHasher()

    async def save(self) -> None:
        await self.db.commit()
        await self.db.close()

    async def init(self) -> None:
        self.db = await aiosqlite.connect("main.db")
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS users (
                username TEXT PRIMARY KEY,
                password TEXT,
                token    TEXT,
                pb_wpm   FLOAT,
                pb_acc   FLOAT,
                moneyz   INT DEFAULT 0,
                bio      TEXT
            )
        """)
        await self.db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                sender     TEXT,
                recipient  TEXT,
                subject    TEXT,
                content    TEXT,
                sent_at    INTEGER,
                message_id TEXT
            )
        """)

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
            await self.db.execute("INSERT INTO users (username, password, token) VALUES (?, ?, ?)", (username, self.argon2.hash(password), token))
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
        await self.db.execute("INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)", (
            sender, recipient, subject, content, round(time.time() * 1000), secrets.token_urlsafe()
        ))
        await self.db.commit()

    @staticmethod
    def serialize_messages(messages: typing.Iterable) -> list[dict]:
        return [
            {
                name: message[index]
                for index, name in enumerate(["sender", "recipient", "subject", "content", "sent_at", "message_id"])
            }
            for message in messages
        ]

    async def read_inbox(self, recipient: str) -> list[dict]:
        results = await self.db.execute_fetchall("SELECT * FROM messages WHERE recipient = ?", (recipient,))
        return self.serialize_messages(results)

    async def read_outbox(self, sender: str) -> list[dict]:
        results = await self.db.execute_fetchall("SELECT * FROM messages WHERE sender = ?", (sender,))
        return self.serialize_messages(results)

    async def delete_message(self, recipient: str, message_id: str) -> bool:
        async with self.db.execute("SELECT recipient FROM messages WHERE message_id = ?", (message_id,)) as result:
            message = await result.fetchone()
            if message is None:
                return False

            if message[0] != recipient:
                return False

        await self.db.execute("DELETE FROM messages WHERE message_id = ?", (message_id,))
        await self.db.commit()

        return True

    async def delete_account(self, username: str) -> None:
        await self.db.execute("DELETE FROM users WHERE username = ?", (username,))
        await self.db.execute("DELETE FROM messages WHERE recipient = ?", (username,))
        await self.db.commit()

    async def update_profile(self, username: str, bio: str) -> None:
        await self.db.execute("UPDATE users SET bio = ? WHERE username = ?", (username,))

    async def update_typing_pb(self, username: str, wpm: float, accuracy: float) -> bool:
        async with self.db.execute("SELECT pb_wpm FROM users WHERE username = ?", (username,)) as result:
            result = await result.fetchone()
            if result is None or (wpm > (result[0] or 0)):
                await self.db.execute(
                    "UPDATE users SET pb_wpm = ?, pb_acc = ? WHERE username = ?",
                    (round(wpm, 2), round(accuracy, 2), username)
                )
                await self.db.commit()
                return True

            return False

db = Database()

# Initialization
@asynccontextmanager
async def lifespan(app: FastAPI) -> typing.AsyncGenerator:
    await db.init()
    yield
    await db.save()

app = FastAPI(openapi_url = None, lifespan = lifespan)

# Routing
@app.post("/api/account/login")
async def route_account_login(data: AuthPayload) -> JSONResponse:
    token = await db.login(data.username, data.password)
    if token is None:
        return JSONResponse(
            {"code": 401, "data": {"message": "Invalid username or password."}},
            status_code = 401
        )

    return JSONResponse({"code": 200, "data": {"token": token}})

@app.post("/api/account/register")
async def route_account_register(data: AuthPayload) -> JSONResponse:
    token = await db.register(data.username, data.password)
    if token is None:
        return JSONResponse({"code": 400, "data": {"message": "Provided username is already taken."}}, status_code = 400)

    return JSONResponse({"code": 200, "data": {"token": token}})

@app.post("/api/account/delete")
async def route_account_delete(authorization: typing.Annotated[str, Header()]) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    await db.delete_account(username)
    return JSONResponse({"code": 200, "data": {"message": "Goodbye."}})

@app.get("/api/inbox")
async def route_inbox(authorization: typing.Annotated[str, Header()]) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    return JSONResponse({
        "code": 200,
        "data": await db.read_inbox(username)
    })

@app.get("/api/outbox")
async def route_outbox(authorization: typing.Annotated[str, Header()]) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    return JSONResponse({
        "code": 200,
        "data": await db.read_outbox(username)
    })

@app.post("/api/message/send")
async def route_message_send(authorization: typing.Annotated[str, Header()], data: MessagePayload) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    if not await db.validate_username(data.recipient):
        return JSONResponse({
            "code": 400,
            "data": {"message": "Invalid message recipient specified."}
        }, status_code = 400)

    await db.message(username, data.recipient, data.subject, data.content)
    return JSONResponse({"code": 201}, status_code = 201)

@app.post("/api/message/delete")
async def route_message_delete(authorization: typing.Annotated[str, Header()], data: DeletePayload) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    success = await db.delete_message(username, data.message_id)
    if not success:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid MID or missing authorization to delete it."}
        }, status_code = 403)

    return JSONResponse({"code": 200})

@app.post("/api/typing")
async def route_typing(authorization: typing.Annotated[str, Header()], data: TypingPayload) -> JSONResponse:
    username = await db.validate_token(authorization)
    if username is None:
        return JSONResponse({
            "code": 403,
            "data": {"message": "Invalid token provided."}
        }, status_code = 403)

    # Calculate offsets
    keypress_times = [
        abs(moment["offset"] - data.logs[index - 1]["offset"])
        for index, moment in enumerate(data.logs) if index > 0
    ]
    if len(keypress_times) > 160:
        return JSONResponse({"code": 400, "data": {"message": "0A"}}, status_code = 400)

    # Any hit < 5ms
    if any([_ for _ in keypress_times if _ < 2]):
        return JSONResponse({"code": 400, "data": {"message": "1A"}}, status_code = 400)

    # Average < 10ms
    average_delay = sum(keypress_times) / len(keypress_times)
    if average_delay < 10:
        print("average less than 10ms")
        return JSONResponse({"code": 400, "data": {"message": "1B"}}, status_code = 400)

    # Check hits
    if data.hits < 0 or data.hits > 161:
        return JSONResponse({"code": 400, "data": {"message": "2"}}, status_code = 400)

    # Calculate run details
    elapsed  = data.logs[-1]["offset"] / 1000
    if elapsed < 5.65:
        return JSONResponse({"code": 400, "data": {"message": "3"}}, status_code = 400)

    accuracy = data.hits / 161
    return JSONResponse({"code": 200, "data": {"best": await db.update_typing_pb(
        username,
        ((12 * 161) / elapsed) * accuracy,
        accuracy * 100
    )}})
