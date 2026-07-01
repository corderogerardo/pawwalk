"""user roles + walker->user link + pets table

Revision ID: 0003_roles_pets
Revises: 0002_positions
Create Date: 2026-07-01

Adds `users.role` (backfilled to 'owner' via server_default), links a walker
profile to its login (`walkers.user_id`), and creates the `pets` table. Portable
across SQLite (dev/tests) and Postgres; the walkers→users FK is added only on
Postgres (SQLite can't ALTER in a FK without a table rebuild, and enforces FKs
off by default anyway).
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
import sqlmodel

revision: str = "0003_roles_pets"
down_revision: str | None = "0002_positions"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("role", sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default="owner"),
    )
    op.add_column("walkers", sa.Column("user_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    op.create_table(
        "pets",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("owner_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("breed", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("age_years", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.Column("notes", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pets_owner_id", "pets", ["owner_id"])

    if op.get_bind().dialect.name == "postgresql":
        op.create_foreign_key("fk_walkers_user_id", "walkers", "users", ["user_id"], ["id"])


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.drop_constraint("fk_walkers_user_id", "walkers", type_="foreignkey")
    op.drop_index("ix_pets_owner_id", table_name="pets")
    op.drop_table("pets")
    with op.batch_alter_table("walkers") as batch:
        batch.drop_column("user_id")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("role")
