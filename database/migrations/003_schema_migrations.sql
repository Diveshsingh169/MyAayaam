BEGIN;

CREATE TABLE IF NOT EXISTS schema_migrations (
    version BIGINT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    checksum_sha256 CHAR(64),
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_baseline BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT
);

COMMIT;
