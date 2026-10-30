package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/database"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/jackc/pgx/v5"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInactiveAccount = errors.New("user account is inactive")
)

func GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	user := &model.User{}

	err := database.DB.QueryRow(ctx, `
		SELECT id, name, email, password_hash, role,
		       department_id, is_active, created_at, updated_at
		FROM users
		WHERE email = $1
		LIMIT 1
	`, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.DepartmentID,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}

	return user, nil
}

func GetUserByID(ctx context.Context, userID int64) (*model.User, error) {
	user := &model.User{}

	err := database.DB.QueryRow(ctx, `
		SELECT id, name, email, password_hash, role,
		       department_id, is_active, created_at, updated_at
		FROM users
		WHERE id = $1
	`, userID).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&user.PasswordHash,
		&user.Role,
		&user.DepartmentID,
		&user.IsActive,
		&user.CreatedAt,
		&user.UpdatedAt,
	)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get user by ID: %w", err)
	}
	if !user.IsActive {
		return nil, ErrInactiveAccount
	}

	return user, nil
}
