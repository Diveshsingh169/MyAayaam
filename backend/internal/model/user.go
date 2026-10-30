package model

import "time"

// UserRole represents a user's role in MyAayaam.
type UserRole string

const (
	RoleSuperAdmin     UserRole = "super_admin"
	RoleDepartmentAdmin UserRole = "department_admin"
	RoleWorker          UserRole = "worker"
)

// User represents an authenticated MyAayaam user.
type User struct {
	ID           int64      `json:"id"`
	Name         string     `json:"name"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	Role         UserRole   `json:"role"`
	DepartmentID *int64     `json:"department_id,omitempty"`
	IsActive     bool       `json:"is_active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}
