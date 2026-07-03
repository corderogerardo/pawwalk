window.COURSE = window.COURSE || [];
window.COURSE.push({
  id: "classes-typing",
  title: "Classes & Typing",
  emoji: "🧬",
  lang: "python",
  lessons: [
    {
      id: "classes",
      title: "Classes",
      steps: [
        {
          type: "text",
          md: [
            "## Swift structs had a Python cousin all along",
            "In Part I, `struct Walker { let name: String }` bundled data and behavior together. Python's version is `class Walker:`. The mechanics differ, but the idea — a blueprint for making objects — is the same one you already know.",
          ],
        },
        {
          type: "code",
          title: "A Walker class",
          source: String.raw`class Walker:
    def __init__(self, name, price_cents):
        self.name = name
        self.price_cents = price_cents

    def price_label(self):
        return f"` + "$" + String.raw`{self.price_cents / 100:.2f}"


mochi_walker = Walker("Ana", 2400)
print(mochi_walker.price_label())`,
          caption: "`__init__` is the initializer — Swift synthesizes one for structs for free; Python always wants you to write it.",
        },
        {
          type: "text",
          md: [
            "## `self` isn't optional",
            "Swift's methods can say `name` and it silently means `self.name`. Python never assumes that — every instance method takes `self` as its **first parameter**, explicitly, and you write `self.name` every time you mean 'this object's name'. `self` is just a variable name by convention (you could call it anything), but everyone calls it `self`.",
            "`__init__(self, name, price_cents)` runs once, when you create an instance: `Walker(\"Ana\", 2400)`. Python fills in `self` for you — you only pass `name` and `price_cents`.",
          ],
        },
        {
          type: "quiz",
          q: "Why does every method in a Python class list `self` as its first parameter?",
          choices: [
            "Python doesn't implicitly know which instance a method is called on — `self` makes it explicit",
            "It's a keyword required for syntax reasons only, and does nothing",
            "It's optional and just a style convention with no effect",
            "It's how Python marks a method as `static`",
          ],
          answer: 0,
          explain: "Swift hides this wiring for you. Python hands it to you explicitly: `self` IS the instance the method was called on, and you access its attributes as `self.attribute`.",
          nudge: "Compare `mochi_walker.price_label()` — something has to tell the method WHICH walker's `price_cents` to use.",
        },
        {
          type: "exercise",
          title: "Build a Walker class",
          prompt: [
            "Write a `Walker` class: `__init__(self, name, price_cents)` storing both as `self.name` / `self.price_cents`, and a method `price_label(self)` returning a string like `\"$24.00\"` using an f-string and `self.price_cents / 100`.",
          ],
          starter: String.raw`class Walker:
    # your code here
    pass`,
          solution: String.raw`class Walker:
    def __init__(self, name, price_cents):
        self.name = name
        self.price_cents = price_cents

    def price_label(self):
        return f"` + "$" + String.raw`{self.price_cents / 100:.2f}"`,
          checks: [
            { re: /def __init__\(self,name,price_cents\):/, hint: "The initializer signature: `def __init__(self, name, price_cents):` — `self` always comes first." },
            { re: /self\.name=name/, hint: "Store the parameter on the instance: `self.name = name`." },
            { re: /def price_label\(self\):/, hint: "Define the method with just `self` as its parameter: `def price_label(self):`." },
            { re: /self\.price_cents\/100/, hint: "Divide `self.price_cents` by 100 to get dollars, same as the Part I `priceLabel` computed property." },
          ],
          mustNot: [
            { re: /def price_label\(self,/, hint: "`price_label` needs no extra parameters — it already has `self.price_cents` to work with." },
          ],
          success: "That's a real Python class: an initializer that fills in `self`, and a method that reads it back.",
        },
      ],
    },
    {
      id: "dataclasses",
      title: "Dataclasses",
      steps: [
        {
          type: "text",
          md: [
            "## What's that `@` doing there?",
            "`@dataclass` is your first **decorator** — a function that wraps another piece of code to add behavior, written with `@` directly above a `class` or `def`. Think of it like a Swift property wrapper (`@State`, `@Published`) you've already seen: same `@Name` shape, same idea of 'this attaches extra behavior', just applied to a whole class here instead of one property. You'll see `@` again soon (Flask routes, FastAPI decorators) — it's a core Python pattern, not a one-off.",
          ],
        },
        {
          type: "code",
          title: "The same Walker, as a dataclass",
          source: String.raw`from dataclasses import dataclass


@dataclass
class Walker:
    name: str
    price_cents: int
    rating: float = 5.0

    def price_label(self):
        return f"` + "$" + String.raw`{self.price_cents / 100:.2f}"


ana = Walker("Ana", 2400)
print(ana.name, ana.price_label())`,
          caption: "`@dataclass` writes `__init__` (and `__repr__`, and `__eq__`) FOR you from the field list above the methods — no more typing `self.x = x` by hand.",
        },
        {
          type: "text",
          md: [
            "## Less boilerplate, same object",
            "Compare to lesson 1's class: you still get `ana.name`, `ana.price_cents`, and a method that works exactly the same way. All `@dataclass` removed is the repetitive `__init__` that just assigns parameters to `self`. `rating: float = 5.0` is a default value — skip it when constructing and you get `5.0` for free, just like a Swift struct's memberwise initializer defaults.",
            "This is the closest Python gets to a Swift struct: a plain bag of typed fields, generated for you.",
          ],
        },
        {
          type: "quiz",
          q: "What does `@dataclass` actually save you from writing by hand?",
          choices: [
            "The `__init__` method that assigns each field to `self`",
            "The class body itself",
            "Type hints on the fields",
            "The ability to add methods like `price_label`",
          ],
          answer: 0,
          explain: "`@dataclass` reads the field list (`name: str`, `price_cents: int`, …) and generates `__init__` from it. You can still add your own methods — `price_label` still works exactly as before.",
          nudge: "Look at what disappeared between lesson 1's `Walker` and this one: no `def __init__(self, name, price_cents): self.name = name…`.",
        },
        {
          type: "exercise",
          title: "Convert Walker to a dataclass",
          prompt: [
            "Rewrite `Walker` as a `@dataclass` with fields `name: str` and `price_cents: int` (no custom `__init__`), keeping the `price_label` method from before.",
          ],
          starter: String.raw`from dataclasses import dataclass

# your code here`,
          solution: String.raw`from dataclasses import dataclass


@dataclass
class Walker:
    name: str
    price_cents: int

    def price_label(self):
        return f"` + "$" + String.raw`{self.price_cents / 100:.2f}"`,
          checks: [
            { re: /@dataclass/, hint: "Add the decorator on its own line right above the class: `@dataclass`." },
            { re: /class Walker:/, hint: "Keep the class header itself unchanged: `class Walker:`." },
            { re: /name:str/, hint: "Declare `name` as a typed field: `name: str` (no `self`, no `__init__` needed anymore)." },
            { re: /price_cents:int/, hint: "Declare `price_cents` the same way: `price_cents: int`." },
          ],
          mustNot: [
            { re: /def __init__/, hint: "That's the whole point of `@dataclass` — it generates `__init__` for you, so don't write one." },
          ],
          success: "Same object, a third of the typing. That's what a decorator buys you.",
        },
      ],
    },
    {
      id: "type-hints",
      title: "Type hints",
      steps: [
        {
          type: "text",
          md: [
            "## Hints Python never enforced — until now, sort of",
            "You've already been writing type hints (`name: str`, `price_cents: int`) without naming them. A **type hint** is an annotation after `:` on a parameter, or after `->` on a function, describing the type you INTEND. `def price_label(cents: int) -> str:` reads: takes an `int`, returns a `str`.",
          ],
        },
        {
          type: "code",
          title: "Hints on a function",
          source: String.raw`def price_label(cents: int) -> str:
    return f"` + "$" + String.raw`{cents / 100:.2f}"


def find_walker(name: str, walkers: list[str]) -> str | None:
    for w in walkers:
        if w == name:
            return w
    return None`,
          caption: "`list[str]` is a list of strings. `str | None` reads just like it sounds: a `str`, or `None` — Python's answer to Swift's `String?` optional.",
        },
        {
          type: "text",
          md: [
            "## The gap: hints don't enforce anything at runtime",
            "Here's the part that trips people up coming from Swift: Python's type hints are **documentation, not a contract**. Call `price_label(\"oops\")` with a string instead of an `int` and Python happily tries to run it — no compiler, no crash at the call site, just a hint your editor and linter can read. Swift's compiler would refuse to build that call; Python just... runs it, until something inside breaks.",
            "> Hold that thought — it's exactly the gap **Pydantic** fills once you reach FastAPI in Stage D. Pydantic turns these same hints into models that DO validate at runtime, rejecting bad data before your code ever sees it.",
          ],
        },
        {
          type: "quiz",
          q: "You write `def price_label(cents: int) -> str:` and then call it as `price_label(\"24\")` (a string, not an int). What happens?",
          choices: [
            "Python runs it anyway — the hint isn't checked at runtime",
            "Python raises a TypeError immediately, like a compiler error",
            "The file fails to even parse",
            "Python silently converts the string to an int first",
          ],
          answer: 0,
          explain: "Type hints are for humans and tools (editors, linters, mypy) — Python itself never checks them when the function runs. That gap is real, and it's exactly what Pydantic is built to close later.",
          nudge: "Think about what tool would need to exist to actually enforce these hints — Python's interpreter isn't it.",
        },
        {
          type: "exercise",
          title: "Add type hints",
          prompt: [
            "This function has no hints. Add them: `duration` is an `int`, `notes` is `str | None` with a default of `None`, and the function returns a `str`.",
          ],
          starter: String.raw`def booking_summary(duration, notes=None):
    # your code here
    return f"{duration} min booking"`,
          solution: String.raw`def booking_summary(duration: int, notes: str | None = None) -> str:
    return f"{duration} min booking"`,
          checks: [
            { re: /duration:int/, hint: "Hint the first parameter: `duration: int`." },
            { re: /notes:str\|None=None/, hint: "Hint `notes` as optional: `notes: str | None = None` — keep its default value." },
            { re: /\)->str:/, hint: "Add the return-type arrow after the closing `)`: `) -> str:`." },
          ],
          mustNot: [
            { re: /duration:int,notes:None/, hint: "The type is `str | None`, not just `None` — `None` is a value, not a type." },
          ],
          success: "Hints added — and remember, none of this stops someone from calling it wrong. That enforcement is still to come.",
        },
      ],
    },
    {
      id: "enums-literal",
      title: "Enums & Literal",
      steps: [
        {
          type: "text",
          md: [
            "## Closed sets, same philosophy as Swift enums",
            "Swift's `enum BookingStatus { case pending, confirmed, ... }` makes invalid states unrepresentable — you can't accidentally pass `\"pnding\"` where a `BookingStatus` is expected. Python has two tools for the same job: `Enum` classes, and `Literal` types. The real PawWalk backend uses both.",
          ],
        },
        {
          type: "code",
          title: "app/schemas.py",
          source: String.raw`from enum import Enum
from typing import Literal

from pydantic import BaseModel, EmailStr, Field

Duration = Literal[30, 45, 60]
Role = Literal["owner", "walker"]


class BookingStatus(str, Enum):
    pending = "pending"
    confirmed = "confirmed"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class User(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Role = "owner"
    created_at: datetime


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str
    role: Role = "owner"`,
          caption: "Quoted verbatim from the real backend. `BookingStatus(str, Enum)` is a fixed set of named string values; `Duration = Literal[30, 45, 60]` is a fixed set of literal values — no class needed. `User.role` and `SignupRequest.role` both reuse the same `Role` literal.",
        },
        {
          type: "text",
          md: [
            "## Enum vs Literal — when to reach for which",
            "`class BookingStatus(str, Enum):` is worth it when the values need names you'll refer to in code (`BookingStatus.pending`) — and note `(str, Enum)` means each member IS also a string, so it serializes to JSON as plain text like `\"pending\"`.",
            "`Duration = Literal[30, 45, 60]` is faster to reach for when you just need 'exactly one of these exact values' with no extra behavior — a walk is 30, 45, or 60 minutes, full stop. Both are closed sets: pass `90` or `\"pendign\"` and — once Pydantic validates it in Stage D — it's rejected before your code runs.",
          ],
        },
        {
          type: "quiz",
          q: "Why does `Duration = Literal[30, 45, 60]` beat plain `duration: int` for a booking's length?",
          choices: [
            "`Literal[30, 45, 60]` documents AND (via Pydantic) enforces that only those three values are valid — `int` allows any whole number, including nonsense like 7 or -100",
            "`Literal` runs faster than `int` at runtime",
            "`int` can't hold the numbers 30, 45, or 60",
            "`Literal` is required syntax — Python doesn't allow bare `int` hints on function parameters",
          ],
          answer: 0,
          explain: "`int` says 'any whole number' — 7-minute walks, negative durations, all technically fit. `Literal[30, 45, 60]` narrows the type itself to exactly the three durations PawWalk actually offers, so an invalid duration becomes a type error (and, with Pydantic, a rejected request) instead of a bug waiting to happen.",
          nudge: "Ask what `int` allows that a real booking duration never should.",
        },
      ],
    },
  ],
});
