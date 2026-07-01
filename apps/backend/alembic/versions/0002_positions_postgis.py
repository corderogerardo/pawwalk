"""positions table + PostGIS geography (Postgres only)

Revision ID: 0002_positions
Revises: c507af0b7e1c
Create Date: 2026-07-01

The table itself (lat/lng) is portable — it's created on SQLite too so dev/tests
work. The PostGIS bits (extension, `geog` column, GiST index, sync trigger) are
guarded to the postgresql dialect, so pointing PAWWALK_DATABASE_URL at
Neon/Supabase lights up real spatial support with no code change.
"""
from __future__ import annotations

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = "0002_positions"
down_revision: str | None = "c507af0b7e1c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "positions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("booking_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["booking_id"], ["bookings.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_positions_booking_id", "positions", ["booking_id"])

    if op.get_bind().dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
        op.execute("ALTER TABLE positions ADD COLUMN geog geography(Point, 4326)")
        op.execute("CREATE INDEX ix_positions_geog ON positions USING GIST (geog)")
        op.execute(
            """
            CREATE OR REPLACE FUNCTION positions_set_geog() RETURNS trigger AS $$
            BEGIN
                NEW.geog := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
            """
        )
        op.execute(
            "CREATE TRIGGER trg_positions_geog BEFORE INSERT OR UPDATE ON positions "
            "FOR EACH ROW EXECUTE FUNCTION positions_set_geog()"
        )


def downgrade() -> None:
    if op.get_bind().dialect.name == "postgresql":
        op.execute("DROP TRIGGER IF EXISTS trg_positions_geog ON positions")
        op.execute("DROP FUNCTION IF EXISTS positions_set_geog()")
    op.drop_index("ix_positions_booking_id", table_name="positions")
    op.drop_table("positions")
