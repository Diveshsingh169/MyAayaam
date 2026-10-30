package service

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/auth"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
)

var (
	ErrInvalidUser       = errors.New("invalid user")
	ErrUserForbidden     = errors.New("user management is not permitted")
	ErrDepartmentInactive = errors.New("department is inactive")
	ErrCannotManageSelf  = errors.New("users cannot change their own management status")
)

type UserService struct{}

func NewUserService() *UserService { return &UserService{} }

// List returns all users for Super Admin, or only workers in the caller's department.
func (s *UserService) List(ctx context.Context, actor *model.User, includeInactive bool) ([]model.User, error) {
	if actor == nil {
		return nil, ErrUserForbidden
	}
	switch actor.Role {
	case model.RoleSuperAdmin:
		return repository.ListUsers(ctx, nil, includeInactive)
	case model.RoleDepartmentAdmin:
		if actor.DepartmentID == nil {
			return nil, ErrUserForbidden
		}
		return repository.ListDepartmentWorkers(ctx, *actor.DepartmentID, includeInactive)
	default:
		return nil, ErrUserForbidden
	}
}

func (s *UserService) Get(ctx context.Context, actor *model.User, targetID int64) (*model.User, error) {
	if actor == nil || targetID <= 0 {
		return nil, ErrInvalidUser
	}
	switch actor.Role {
	case model.RoleSuperAdmin:
		return repository.GetManagedUserByID(ctx, targetID, nil, false)
	case model.RoleDepartmentAdmin:
		if actor.DepartmentID == nil {
			return nil, ErrUserForbidden
		}
		return repository.GetManagedUserByID(ctx, targetID, actor.DepartmentID, true)
	default:
		return nil, ErrUserForbidden
	}
}

func (s *UserService) Create(ctx context.Context, actor *model.User, name, email, password string, role model.UserRole, requestedDepartmentID *int64) (*model.User, error) {
	if actor == nil {
		return nil, ErrUserForbidden
	}

	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	password = strings.TrimSpace(password)
	if name == "" || len(name) > 100 || email == "" || len(email) > 150 {
		return nil, fmt.Errorf("%w: name or email is invalid", ErrInvalidUser)
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return nil, fmt.Errorf("%w: a valid email address is required", ErrInvalidUser)
	}
	if len(password) < 12 || len(password) > 128 {
		return nil, fmt.Errorf("%w: password must contain 12 to 128 characters", ErrInvalidUser)
	}

	var departmentID *int64
	switch actor.Role {
	case model.RoleSuperAdmin:
		if role != model.RoleDepartmentAdmin && role != model.RoleWorker {
			return nil, fmt.Errorf("%w: only Department Admins and Workers can be created", ErrInvalidUser)
		}
		if requestedDepartmentID == nil || *requestedDepartmentID <= 0 {
			return nil, fmt.Errorf("%w: a department is required", ErrInvalidUser)
		}
		departmentID = requestedDepartmentID
	case model.RoleDepartmentAdmin:
		if role != model.RoleWorker || actor.DepartmentID == nil {
			return nil, ErrUserForbidden
		}
		// Never trust a department ID supplied by a Department Admin.
		departmentID = actor.DepartmentID
	default:
		return nil, ErrUserForbidden
	}

	active, err := repository.IsDepartmentActive(ctx, *departmentID)
	if err != nil {
		return nil, err
	}
	if !active {
		return nil, ErrDepartmentInactive
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("hash user password: %w", err)
	}

	user := &model.User{
		Name:         name,
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
		DepartmentID: departmentID,
	}
	if err := repository.CreateManagedUser(ctx, user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *UserService) Update(ctx context.Context, actor *model.User, targetID int64, name, email string) (*model.User, error) {
	if actor == nil || targetID <= 0 {
		return nil, ErrInvalidUser
	}
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || len(name) > 100 || email == "" || len(email) > 150 {
		return nil, fmt.Errorf("%w: name or email is invalid", ErrInvalidUser)
	}
	if _, err := mail.ParseAddress(email); err != nil {
		return nil, fmt.Errorf("%w: a valid email address is required", ErrInvalidUser)
	}

	switch actor.Role {
	case model.RoleSuperAdmin:
		if targetID == actor.ID {
			// Super Admin may update their own profile, but role/department remain immutable.
			return repository.UpdateManagedUser(ctx, targetID, name, email, nil, false, true)
		}
		return repository.UpdateManagedUser(ctx, targetID, name, email, nil, false, false)
	case model.RoleDepartmentAdmin:
		if actor.DepartmentID == nil {
			return nil, ErrUserForbidden
		}
		return repository.UpdateManagedUser(ctx, targetID, name, email, actor.DepartmentID, true, false)
	default:
		return nil, ErrUserForbidden
	}
}

func (s *UserService) SetActive(ctx context.Context, actor *model.User, targetID int64, active bool) error {
	if actor == nil || targetID <= 0 {
		return ErrInvalidUser
	}
	if targetID == actor.ID {
		return ErrCannotManageSelf
	}
	switch actor.Role {
	case model.RoleSuperAdmin:
		return repository.SetManagedUserActive(ctx, targetID, nil, false, active)
	case model.RoleDepartmentAdmin:
		if actor.DepartmentID == nil {
			return ErrUserForbidden
		}
		return repository.SetManagedUserActive(ctx, targetID, actor.DepartmentID, true, active)
	default:
		return ErrUserForbidden
	}
}
