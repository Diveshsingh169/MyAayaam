package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
)

var ErrInvalidDepartment = errors.New("invalid department")

type DepartmentService struct{}

func NewDepartmentService() *DepartmentService {
	return &DepartmentService{}
}

func (s *DepartmentService) List(ctx context.Context, includeInactive bool) ([]model.Department, error) {
	return repository.ListDepartments(ctx, includeInactive)
}

func (s *DepartmentService) Get(ctx context.Context, id int64) (*model.Department, error) {
	if id <= 0 {
		return nil, ErrInvalidDepartment
	}
	return repository.GetDepartmentByID(ctx, id)
}

func (s *DepartmentService) Create(ctx context.Context, name, code string, description *string) (*model.Department, error) {
	department := &model.Department{
		Name:        strings.TrimSpace(name),
		Code:        strings.ToUpper(strings.TrimSpace(code)),
		Description: cleanDescription(description),
	}
	if err := validateDepartment(department); err != nil {
		return nil, err
	}
	if err := repository.CreateDepartment(ctx, department); err != nil {
		return nil, err
	}
	return department, nil
}

func (s *DepartmentService) Update(ctx context.Context, id int64, name, code string, description *string) (*model.Department, error) {
	if id <= 0 {
		return nil, ErrInvalidDepartment
	}
	department := &model.Department{
		ID:          id,
		Name:        strings.TrimSpace(name),
		Code:        strings.ToUpper(strings.TrimSpace(code)),
		Description: cleanDescription(description),
	}
	if err := validateDepartment(department); err != nil {
		return nil, err
	}
	if err := repository.UpdateDepartment(ctx, department); err != nil {
		return nil, err
	}
	return department, nil
}

func (s *DepartmentService) SetActive(ctx context.Context, id int64, active bool) error {
	if id <= 0 {
		return ErrInvalidDepartment
	}
	return repository.SetDepartmentActive(ctx, id, active)
}

func cleanDescription(description *string) *string {
	if description == nil {
		return nil
	}
	value := strings.TrimSpace(*description)
	if value == "" {
		return nil
	}
	return &value
}

func validateDepartment(department *model.Department) error {
	if department.Name == "" || len(department.Name) > 120 {
		return fmt.Errorf("%w: name must contain 1 to 120 characters", ErrInvalidDepartment)
	}
	if department.Code == "" || len(department.Code) > 30 {
		return fmt.Errorf("%w: code must contain 1 to 30 characters", ErrInvalidDepartment)
	}
	return nil
}
