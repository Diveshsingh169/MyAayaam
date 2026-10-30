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
	ErrUserNotFound       = errors.New("user not found")
	ErrInactiveAccount    = errors.New("user account is inactive")
	ErrDepartmentInactive = errors.New("department is inactive")
)

const userColumns = `id, name, email, password_hash, role,
	department_id, is_active, created_at, updated_at`

func scanUser(row pgx.Row) (*model.User, error) {
	user := &model.User{}
	err := row.Scan(
		&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.Role,
		&user.DepartmentID, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func GetUserByEmail(ctx context.Context, email string) (*model.User, error) {
	user, err := scanUser(database.DB.QueryRow(ctx, `
		SELECT u.id, u.name, u.email, u.password_hash, u.role,
		       u.department_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		LEFT JOIN departments d ON d.id = u.department_id
		WHERE u.email = $1
		  AND (u.role = 'super_admin' OR d.is_active = TRUE)
		LIMIT 1
	`, email))
	if err != nil {
		return nil, err
	}
	return user, nil
}

// GetUserByID is used by authentication middleware. Inactive users and users
// whose department is inactive cannot authenticate.
func GetUserByID(ctx context.Context, userID int64) (*model.User, error) {
	user, err := scanUser(database.DB.QueryRow(ctx, `
		SELECT u.id, u.name, u.email, u.password_hash, u.role,
		       u.department_id, u.is_active, u.created_at, u.updated_at
		FROM users u
		LEFT JOIN departments d ON d.id = u.department_id
		WHERE u.id = $1
		  AND u.is_active = TRUE
		  AND (u.role = 'super_admin' OR d.is_active = TRUE)
	`, userID))
	if errors.Is(err, ErrUserNotFound) {
		return nil, ErrInactiveAccount
	}
	if err != nil {
		return nil, fmt.Errorf("get active user by ID: %w", err)
	}
	return user, nil
}

func ListUsers(ctx context.Context, departmentID *int64, includeInactive bool) ([]model.User, error) {
	query := `SELECT ` + userColumns + ` FROM users WHERE role <> 'super_admin'`
	args := make([]any, 0, 2)
	if departmentID != nil {
		args = append(args, *departmentID)
		query += fmt.Sprintf(" AND department_id = $%d", len(args))
	}
	if !includeInactive {
		query += " AND is_active = TRUE"
	}
	query += " ORDER BY created_at DESC, id DESC"

	rows, err := database.DB.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("list users: %w", err)
	}
	defer rows.Close()
	users := make([]model.User, 0)
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, fmt.Errorf("scan user: %w", err)
		}
		users = append(users, *user)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate users: %w", err)
	}
	return users, nil
}

func ListDepartmentWorkers(ctx context.Context, departmentID int64, includeInactive bool) ([]model.User, error) {
	query := `SELECT ` + userColumns + ` FROM users
		WHERE department_id = $1 AND role = 'worker'`
	if !includeInactive {
		query += " AND is_active = TRUE"
	}
	query += " ORDER BY created_at DESC, id DESC"

	rows, err := database.DB.Query(ctx, query, departmentID)
	if err != nil {
		return nil, fmt.Errorf("list department workers: %w", err)
	}
	defer rows.Close()
	users := make([]model.User, 0)
	for rows.Next() {
		user, err := scanUser(rows)
		if err != nil {
			return nil, fmt.Errorf("scan department worker: %w", err)
		}
		users = append(users, *user)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate department workers: %w", err)
	}
	return users, nil
}

func GetManagedUserByID(ctx context.Context, userID int64, departmentID *int64, workersOnly bool) (*model.User, error) {
	query := `SELECT ` + userColumns + ` FROM users
		WHERE id = $1 AND role <> 'super_admin'`
	args := []any{userID}
	if departmentID != nil {
		args = append(args, *departmentID)
		query += fmt.Sprintf(" AND department_id = $%d", len(args))
	}
	if workersOnly {
		query += " AND role = 'worker'"
	}
	user, err := scanUser(database.DB.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("get managed user: %w", err)
	}
	return user, nil
}

func IsDepartmentActive(ctx context.Context, departmentID int64) (bool, error) {
	var active bool
	err := database.DB.QueryRow(ctx,
		"SELECT is_active FROM departments WHERE id = $1", departmentID,
	).Scan(&active)
	if errors.Is(err, pgx.ErrNoRows) {
		return false, ErrDepartmentNotFound
	}
	if err != nil {
		return false, fmt.Errorf("check department status: %w", err)
	}
	return active, nil
}

func CreateManagedUser(ctx context.Context, user *model.User) error {
	tx, err := database.DB.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin create user transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	var departmentActive bool
	if err := tx.QueryRow(ctx, "SELECT is_active FROM departments WHERE id = $1 FOR SHARE", *user.DepartmentID).Scan(&departmentActive); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrDepartmentNotFound
		}
		return fmt.Errorf("lock user department: %w", err)
	}
	if !departmentActive {
		return ErrDepartmentInactive
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash, role, department_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, is_active, created_at, updated_at
	`, user.Name, user.Email, user.PasswordHash, user.Role, user.DepartmentID).Scan(
		&user.ID, &user.IsActive, &user.CreatedAt, &user.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("create managed user: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit create user transaction: %w", err)
	}
	return nil
}

// Department Admins can only update workers in their own department.
// Role and department membership are intentionally immutable through this endpoint.
func UpdateManagedUser(ctx context.Context, userID int64, name, email string, departmentID *int64, workersOnly bool) (*model.User, error) {
	query := `UPDATE users
		SET name = $2, email = $3, updated_at = NOW()
		WHERE id = $1 AND role <> 'super_admin'`
	args := []any{userID, name, email}
	if departmentID != nil {
		args = append(args, *departmentID)
		query += fmt.Sprintf(" AND department_id = $%d", len(args))
	}
	if workersOnly {
		query += " AND role = 'worker'"
	}
	query += " RETURNING " + userColumns

	user, err := scanUser(database.DB.QueryRow(ctx, query, args...))
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("update managed user: %w", err)
	}
	return user, nil
}

func SetManagedUserActive(ctx context.Context, userID int64, departmentID *int64, workersOnly, active bool) error {
	query := `UPDATE users SET is_active = $2, updated_at = NOW()
		WHERE id = $1 AND role <> 'super_admin'`
	args := []any{userID, active}
	if departmentID != nil {
		args = append(args, *departmentID)
		query += fmt.Sprintf(" AND department_id = $%d", len(args))
	}
	if workersOnly {
		query += " AND role = 'worker'"
	}
	command, err := database.DB.Exec(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("change managed user status: %w", err)
	}
	if command.RowsAffected() == 0 {
		return ErrUserNotFound
	}
	return nil
}
