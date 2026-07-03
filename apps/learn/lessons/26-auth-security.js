window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "auth-security",
  title: "Auth & Security",
  emoji: "🔑",
  lang: "python",
  lessons: [
    {
      id: "passwords-never-stored",
      title: "Passwords are never stored",
      steps: [
        {
          type: "text",
          md: [
            "## The one rule: never store the real password",
            "If PawWalk's database is ever stolen, the attacker must NOT get everyone's real password. So the backend never stores what you typed — it stores a **hash**: the one-way scramble of it. `hash(\"correct horse\")` always produces the same scramble, but there's no `unhash()` to run backwards.",
            "A **salt** — random bytes mixed in before hashing — makes sure two users with the same password get *different* stored hashes, so an attacker can't precompute one giant table of common passwords and match it against your whole database. The hashing library below generates and stores the salt for you, bundled right into the hash string.",
            "This is exactly what Part I's auth module assumed was happening on the other end of `/auth/signup`. Now you see it.",
          ],
        },
        {
          type: "code",
          title: "app/security.py",
          source: String.raw`"""Password hashing + JWT helpers. Small and pure — no DB/FastAPI imports."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.hashers.bcrypt import BcryptHasher

from .config import settings

_password_hash = PasswordHash((BcryptHasher(),))


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return _password_hash.verify(password, password_hash)`,
          caption: "`bcrypt` is the hashing algorithm — it's slow ON PURPOSE (so brute-forcing millions of guesses is expensive) and salts every hash automatically. `hash_password` runs at signup; `verify_password` runs at login and never reverses the hash — it re-hashes the attempt and compares.",
        },
        {
          type: "code",
          title: "app/routers/auth.py — signup",
          source: String.raw`@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(req: SignupRequest, session: Session = Depends(get_session)) -> AuthResponse:
    existing = session.exec(select(UserTable).where(UserTable.email == req.email)).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    row = UserTable(
        id=f"usr_{uuid4().hex[:12]}",
        email=req.email,
        name=req.name,
        password_hash=hash_password(req.password),
        role=req.role,
        created_at=datetime.now(timezone.utc),
    )
    session.add(row)
    session.commit()
    session.refresh(row)`,
          caption: "The column is called `password_hash`, not `password` — there's no column in the whole database that could leak a real password, because the real password is never written down anywhere.",
        },
        {
          type: "quiz",
          q: "Why is bcrypt deliberately SLOW instead of a fast hash like plain SHA-256?",
          choices: [
            "Slowness makes brute-forcing millions of password guesses expensive for an attacker",
            "Slow code is easier for FastAPI to validate",
            "It gives the server time to write the audit log",
            "Fast hashes don't work with Pydantic models",
          ],
          answer: 0,
          explain: "A fast hash lets an attacker who steals the database try billions of guesses per second. bcrypt (and friends like scrypt/argon2) are tuned to take real, non-trivial time per guess, so the same attack takes years instead of hours.",
          nudge: "Think about what happens to a stolen database of hashes — who is the slowness actually punishing?",
        },
        {
          type: "text",
          md: [
            "## Login: verify, don't unhash",
            "`app/routers/auth.py`'s `login` route looks up the user by email, then calls `verify_password(req.password, row.password_hash)`. If the user doesn't exist OR the password is wrong, it raises the **same** `401` either way — never leak which one failed, or you've told an attacker that an email address is registered.",
          ],
        },
        {
          type: "exercise",
          title: "The verify-password branch",
          prompt: [
            "Finish a small login-style function. Given `row` (or `None`) and `password`, raise `HTTPException(status_code=401, detail=\"Invalid email or password\")` when `row` is `None` OR `verify_password(password, row.password_hash)` is falsy. `HTTPException` and `verify_password` are already imported for you.",
          ],
          starter: String.raw`def check_login(row, password):
    # your code here
    return row`,
          solution: String.raw`def check_login(row, password):
    if row is None or not verify_password(password, row.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return row`,
          checks: [
            { re: /if row is None or not verify_password\(password,row\.password_hash\):/, hint: "One combined condition: `if row is None or not verify_password(password, row.password_hash):` — check both failure modes together." },
            { re: /raise HTTPException\(status_code=401,detail="Invalid email or password"\)/, hint: "Raise `HTTPException(status_code=401, detail=\"Invalid email or password\")` — match the repo's exact wording so both failure cases look identical to an attacker." },
          ],
          mustNot: [
            { re: /password==row\.password_hash/, hint: "Never compare the raw password to the stored hash with `==` — you have to run it back through `verify_password`, which re-hashes and compares safely." },
          ],
          success: "That's the real branch from app/routers/auth.py — one 401, two possible causes, and the attacker can't tell which.",
        },
      ],
    },
    {
      id: "jwt-tokens",
      title: "JWT tokens",
      steps: [
        {
          type: "text",
          md: [
            "## What's inside a JWT",
            "A **JWT** (JSON Web Token) is a compact, signed string with three parts joined by dots: `header.payload.signature`.",
            "- **Header** — which algorithm signed it.\n- **Payload** — the claims: who this token is for (`sub`, short for *subject*) plus timing (`iat` issued-at, `exp` expiry). Anyone can read the payload — it's only base64, not encrypted.\n- **Signature** — the server signs `header + payload` with a secret key. Change one character of the payload and the signature no longer matches, so tampering is detectable.",
            "This is the exact string Part I's iOS app received from `/auth/signup` and `/auth/login` and stored in the Keychain. Every request after that sent it back in an `Authorization: Bearer <token>` header — that token came from exactly the function below.",
          ],
        },
        {
          type: "code",
          title: "app/security.py — create and decode",
          source: String.raw`def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_alg)


def decode_token(token: str) -> str | None:
    """Returns the user id (\`sub\`), or None if the token is missing/invalid/expired."""
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_alg])
    except jwt.PyJWTError:
        return None
    return payload.get("sub")`,
          caption: "`create_access_token` builds the payload and signs it with `settings.jwt_secret` — a secret only the server knows. `decode_token` verifies that signature and checks `exp` for you; `jwt.decode` raises if the token is expired or the signature doesn't match, and that's caught and turned into a clean `None`.",
        },
        {
          type: "quiz",
          q: "The iOS app can read a JWT's payload (the `sub` and `exp` fields) just by base64-decoding it, with no secret key. Is that a security bug?",
          choices: [
            "No — the payload is meant to be readable; the SIGNATURE is what's protected, and only the server can produce a valid one",
            "Yes — the payload should be encrypted so no one but the server can read it",
            "No — because HTTPS already hides the token in transit",
            "Yes — `sub` should never appear in a token at all",
          ],
          answer: 0,
          explain: "JWTs are signed, not encrypted. Anyone holding the token can read its claims. What they CAN'T do is forge a new payload with a valid signature, because that requires `settings.jwt_secret`, which never leaves the server.",
          nudge: "Re-read what the signature actually proves versus what base64 actually hides.",
        },
        {
          type: "text",
          md: [
            "## The response shape: `AuthResponse`",
            "Both `/auth/signup` and `/auth/login` return the same shape, defined in `app/schemas.py`:",
            "```\nclass AuthResponse(BaseModel):\n    access_token: str\n    token_type: Literal[\"bearer\"] = \"bearer\"\n    user: User\n```",
            "`token_type` is always the literal string `\"bearer\"` — it tells the client HOW to send the token back: `Authorization: Bearer <access_token>`. That's the exact header Part I's `APIClient` attached to every authenticated request.",
          ],
        },
        {
          type: "exercise",
          title: "Build the token response",
          prompt: [
            "Write a function `build_auth_response(user_id, user)` that returns a dict shaped like `AuthResponse`: `access_token` from `create_access_token(user_id)`, `token_type` set to `\"bearer\"`, and `user` set to the given `user`. `create_access_token` is already imported.",
          ],
          starter: String.raw`def build_auth_response(user_id, user):
    # your code here
    pass`,
          solution: String.raw`def build_auth_response(user_id, user):
    return {
        "access_token": create_access_token(user_id),
        "token_type": "bearer",
        "user": user,
    }`,
          checks: [
            { re: /"access_token":create_access_token\(user_id\)/, hint: "The token field is `\"access_token\": create_access_token(user_id)` — build it, don't hardcode a string." },
            { re: /"token_type":"bearer"/, hint: "`token_type` is always the literal `\"bearer\"` — that's what tells the client how to send the header back." },
            { re: /"user":user/, hint: "Include `\"user\": user` in the returned dict — the client needs the profile alongside the token." },
          ],
          mustNot: [
            { re: /"token_type":"jwt"/, hint: "The scheme name is `\"bearer\"`, not `\"jwt\"` — that's the RFC 6750 convention the `Authorization: Bearer …` header follows." },
          ],
          success: "Same three fields as AuthResponse in schemas.py — this is what /auth/signup and /auth/login hand back on every call.",
        },
      ],
    },
    {
      id: "protecting-routes",
      title: "Protecting routes",
      steps: [
        {
          type: "text",
          md: [
            "## The current-user dependency",
            "Every protected route needs to answer one question first: *who is making this request?* Instead of repeating that logic in every route, FastAPI's `Depends` runs it once and hands the route a ready-made `User`.",
          ],
        },
        {
          type: "code",
          title: "app/deps.py",
          source: String.raw`bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    user_id = decode_token(credentials.credentials) if credentials else None
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    row = session.get(UserTable, user_id)
    if row is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return User.model_validate(row, from_attributes=True)


def get_current_owner(current_user: User = Depends(get_current_user)) -> User:
    """Owner-only routes (pets, creating bookings)."""
    if current_user.role != "owner":
        raise HTTPException(status_code=403, detail="This action is for pet owners")
    return current_user`,
          caption: "`get_current_user` extracts the bearer token, decodes it (module 26 lesson 2's function), and loads the matching row — no credentials or a bad/expired token is 401. `get_current_owner` builds ON TOP of it: you're authenticated (401 already ruled out) but not ALLOWED (403). That's the whole 401-vs-403 distinction in eight lines.",
        },
        {
          type: "quiz",
          q: "A walker account calls a route that requires `Depends(get_current_owner)`. What status code should they get, and why?",
          choices: [
            "403 — they proved who they are, but their role isn't allowed to do this",
            "401 — the server doesn't recognize their token",
            "404 — the route doesn't exist for walkers",
            "200 — role checks happen on the client, not the server",
          ],
          answer: 0,
          explain: "401 means \"I don't know who you are\" (missing/invalid/expired token). 403 means \"I know exactly who you are, and the answer is no.\" A walker with a perfectly valid token hitting an owner-only route is a textbook 403.",
          nudge: "Their token IS valid — `get_current_user` inside `get_current_owner` already succeeded. What fails next?",
        },
        {
          type: "text",
          md: [
            "## User-scoped queries: \"my bookings\"",
            "Authentication alone isn't enough — a route also has to make sure a user can only ever see THEIR OWN data. `GET /bookings` doesn't return every booking in the database; it passes `current_user.id` down into the query:",
            "```\n@router.get(\"\", response_model=list[Booking])\ndef list_bookings(\n    session: Session = Depends(get_session),\n    current_user: User = Depends(get_current_user),\n) -> list[Booking]:\n    return data.list_bookings(session, current_user.id)\n```",
            "Every booking lookup, cancel, and list route threads `current_user.id` through to the data layer the same way. Try to fetch someone else's booking by ID and the backend's test suite (`test_booking_scoped_to_owner`) proves you get a 404, not a 403 — the backend doesn't even admit the booking exists.",
          ],
        },
        {
          type: "xcode",
          label: "Over to the terminal",
          title: "Try it: auth and a protected route",
          intro: ["With `uv run fastapi dev` running (module 13's checklist), exercise the whole flow through the interactive docs."],
          items: [
            "Open [http://localhost:8000/docs](http://localhost:8000/docs)",
            "Expand `POST /auth/signup`, **Try it out**, submit an email/password/name — copy the `access_token` from the response",
            "Expand `POST /auth/login` with the same email/password — confirm it also returns a token",
            "Click the **Authorize** button (top right, padlock icon), paste the token, click **Authorize**, then **Close**",
            "Expand `GET /bookings`, **Try it out**, **Execute** — now it returns `200` with your bookings (empty list is fine)",
            "Click **Authorize** again, then **Logout** to clear the token, and call `GET /bookings` again — confirm it's now `401`",
          ],
        },
        {
          type: "quiz",
          q: "Which pairing is correct?",
          choices: [
            "401 = who ARE you (bad/missing/expired token); 403 = I know you, but you can't do this; 404 on someone else's booking hides that it exists at all",
            "401 and 403 are interchangeable — either works for any auth failure",
            "404 is only for typos in the URL, never used for authorization",
            "403 always means the token expired",
          ],
          answer: 0,
          explain: "That's the full picture from this lesson: 401 is an identity failure, 403 is a permission failure on a resource whose existence you're allowed to know about, and PawWalk's bookings go one step further — returning 404 for someone else's booking so an attacker can't even confirm the ID is real.",
          nudge: "Walk through the three codes in order: identity, permission, then PawWalk's extra-cautious choice for other people's bookings.",
        },
      ],
    },
  ],
});
