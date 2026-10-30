package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/database"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/jackc/pgx/v5"
)

var ErrDepartmentNotFound = errors.New("department not found")

func ListDepartments(ctx context.Context, includeInactive bool) ([]model.Department, error) {
	query := `SELECT id, name, code, description, is_active, created_at, updated_at
		FROM departments`
	if !includeInactive {
		query += " WHERE is_active = TRUE"
	}
	query += " ORDER BY name ASC, id ASC"

	rows, err := database.DB.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list departments: %w", err)
	}
	defer rows.Close()

	departments := make([]model.Department, 0)
	for rows.Next() {
		var department model.Department
		if err := rows.Scan(&department.ID, &department.Name, &department.Code,
			&department.Description, &department.IsActive, &department.CreatedAt,
			&department.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan department: %w", err)
		}
		departments = append(departments, department)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate departments: %w", err)
	}
	return departments, nil
}

func GetDepartmentByID(ctx context.Context, id int64) (*model.Department, error) {
	var department model.Department
	err := database.DB.QueryRow(ctx, `
		SELECT id, name, code, description, is_active, created_at, updated_at
		FROM departments WHERE id = $1
	`, id).Scan(&department.ID, &department.Name, &department.Code,
		&department.Description, &department.IsActive, &department.CreatedAt,
		&department.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrDepartmentNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get department: %w", err)
	}
	return &department, nil
}

func CreateDepartment(ctx context.Context, department *model.Department) error {
	err := database.DB.QueryRow(ctx, `
		INSERT INTO departments (name, code, description)
		VALUES ($1, $2, $3)
		RETURNING id, is_active, created_at, updated_at
	`, department.Name, department.Code, department.Description).Scan(
		&department.ID, &department.IsActive, &department.CreatedAt, &department.UpdatedAt)
	if err != nil {
		return fmt.Errorf("create department: %w", err)
	}
	return nil
}

func UpdateDepartment(ctx context.Context, department *model.Department) error {
	err := database.DB.QueryRow(ctx, `
		UPDATE departments
		SET name = $2, code = $3, description = $4, updated_at = NOW()
		WHERE id = $1
		RETURNING is_active, created_at, updated_at
	`, department.ID, department.Name, department.Code, department.Description).Scan(
		&department.IsActive, &department.CreatedAt, &department.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrDepartmentNotFound
	}
	if err != nil {
		return fmt.Errorf("update department: %w", err)
	}
	return nil
}

func SetDepartmentActive(ctx context.Context, id int64, active bool) error {
	command, err := database.DB.Exec(ctx, `
		UPDATE departments SET is_active = $2, updated_at = NOW() WHERE id = $1
	`, id, active)
	if err != nil {
		return fmt.Errorf("change department status: %w", err)
	}
	if command.RowsAffected() == 0 {
		return ErrDepartmentNotFound
	}
	return nil
}
