package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/database"
	"github.com/jackc/pgx/v5"
)

var ErrInvalidRefreshToken = errors.New("invalid refresh token")

func CreateRefreshToken(
	ctx context.Context,
	userID int64,
	tokenHash string,
	expiresAt time.Time,
) error {
	_, err := database.DB.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, tokenHash, expiresAt)

	if err != nil {
		return fmt.Errorf("create refresh token: %w", err)
	}
	return nil
}

// RotateRefreshToken atomically revokes an old token and inserts its replacement.
func RotateRefreshToken(
	ctx context.Context,
	oldHash string,
	newHash string,
	newExpiry time.Time,
) (int64, error) {
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin refresh transaction: %w", err)
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var (
		tokenID int64
		userID  int64
		expiry  time.Time
		revoked *time.Time
		active  bool
	)

	err = tx.QueryRow(ctx, `
		SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at, u.is_active
		FROM refresh_tokens rt
		JOIN users u ON u.id = rt.user_id
		WHERE rt.token_hash = $1
		FOR UPDATE OF rt
	`, oldHash).Scan(&tokenID, &userID, &expiry, &revoked, &active)

	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrInvalidRefreshToken
	}
	if err != nil {
		return 0, fmt.Errorf("find refresh token: %w", err)
	}

	if revoked != nil || !expiry.After(time.Now()) || !active {
		return 0, ErrInvalidRefreshToken
	}

	tag, err := tx.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW(), replaced_by_hash = $1
		WHERE id = $2 AND revoked_at IS NULL
	`, newHash, tokenID)
	if err != nil {
		return 0, fmt.Errorf("revoke old refresh token: %w", err)
	}
	if tag.RowsAffected() != 1 {
		return 0, ErrInvalidRefreshToken
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
		VALUES ($1, $2, $3)
	`, userID, newHash, newExpiry)
	if err != nil {
		return 0, fmt.Errorf("insert replacement refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit refresh transaction: %w", err)
	}

	return userID, nil
}

func RevokeRefreshToken(ctx context.Context, tokenHash string) error {
	_, err := database.DB.Exec(ctx, `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE token_hash = $1 AND revoked_at IS NULL
	`, tokenHash)

	if err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	return nil
}
