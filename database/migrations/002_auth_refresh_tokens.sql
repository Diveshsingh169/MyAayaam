
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    replaced_by_hash CHAR(64),
    CONSTRAINT refresh_tokens_not_self_replaced
        CHECK (replaced_by_hash IS NULL OR replaced_by_hash <> token_hash)
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
    ON refresh_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at
    ON refresh_tokens(expires_at);
