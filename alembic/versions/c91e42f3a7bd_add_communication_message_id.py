"""Add persistent Message-ID to communications.

Revision ID: c91e42f3a7bd
Revises: bab08920a458
Create Date: 2026-09-26
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c91e42f3a7bd"
down_revision: Union[str, None] = "bab08920a458"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("communications", sa.Column("message_id", sa.String(), nullable=True))
    op.create_index("ix_communications_message_id", "communications", ["message_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_communications_message_id", table_name="communications")
    op.drop_column("communications", "message_id")
