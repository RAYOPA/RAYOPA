"""Add verified email identity and Google OAuth login codes."""
from alembic import op
import sqlalchemy as sa

revision = "4a7d9c2e1f30"
down_revision = "c91e42f3a7bd"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("users", sa.Column("email", sa.String(), nullable=True))
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("users", sa.Column("google_subject", sa.String(), nullable=True))
    op.add_column("users", sa.Column("auth_provider", sa.String(), nullable=False, server_default="password"))
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_google_subject", "users", ["google_subject"], unique=True)
    op.create_table("oauth_login_codes",
        sa.Column("code_hash", sa.String(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()))
    op.create_index("ix_oauth_login_codes_user_id", "oauth_login_codes", ["user_id"])
    op.create_index("ix_oauth_login_codes_expires_at", "oauth_login_codes", ["expires_at"])

def downgrade():
    op.drop_table("oauth_login_codes")
    op.drop_index("ix_users_google_subject", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.alter_column("users", "password_hash", existing_type=sa.String(), nullable=False)
    op.drop_column("users", "auth_provider")
    op.drop_column("users", "google_subject")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "email")
