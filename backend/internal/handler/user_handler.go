package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/middleware"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/service"
	"github.com/jackc/pgx/v5/pgconn"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler() *UserHandler {
	return &UserHandler{service: service.NewUserService()}
}

type createUserRequest struct {
	Name         string          `json:"name"`
	Email        string          `json:"email"`
	Password     string          `json:"password"`
	Role         model.UserRole  `json:"role"`
	DepartmentID *int64          `json:"department_id"`
}

type updateUserRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

func (h *UserHandler) Collection(w http.ResponseWriter, r *http.Request) {
	actor, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	switch r.Method {
	case http.MethodGet:
		includeInactive := r.URL.Query().Get("include_inactive") == "true"
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		users, err := h.service.List(ctx, actor, includeInactive)
		if err != nil {
			writeUserError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"users": users})
	case http.MethodPost:
		var req createUserRequest
		if !decodeDepartmentRequest(w, r, &req) {
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()
		user, err := h.service.Create(ctx, actor, req.Name, req.Email, req.Password, req.Role, req.DepartmentID)
		if err != nil {
			writeUserError(w, err)
			return
		}
		writeJSON(w, http.StatusCreated, map[string]any{
			"message": "User created successfully",
			"user": user,
		})
	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *UserHandler) Item(w http.ResponseWriter, r *http.Request) {
	actor, ok := middleware.UserFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || userID <= 0 {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		user, err := h.service.Get(ctx, actor, userID)
		if err != nil {
			writeUserError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"user": user})
	case http.MethodPut:
		var req updateUserRequest
		if !decodeDepartmentRequest(w, r, &req) {
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		user, err := h.service.Update(ctx, actor, userID, req.Name, req.Email)
		if err != nil {
			writeUserError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"message": "User updated successfully",
			"user": user,
		})
	case http.MethodPatch:
		var req struct {
			IsActive *bool `json:"is_active"`
		}
		if !decodeDepartmentRequest(w, r, &req) {
			return
		}
		if req.IsActive == nil {
			http.Error(w, "is_active is required", http.StatusBadRequest)
			return
		}
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		if err := h.service.SetActive(ctx, actor, userID, *req.IsActive); err != nil {
			writeUserError(w, err)
			return
		}
		message := "User deactivated successfully"
		if *req.IsActive {
			message = "User activated successfully"
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": message})
	default:
		w.Header().Set("Allow", "GET, PUT, PATCH")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func writeUserError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidUser):
		http.Error(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, service.ErrUserForbidden):
		http.Error(w, "You are not allowed to manage users", http.StatusForbidden)
	case errors.Is(err, service.ErrCannotManageSelf):
		http.Error(w, "You cannot change your own account status", http.StatusForbidden)
	case errors.Is(err, service.ErrDepartmentInactive):
		http.Error(w, "The selected department is inactive", http.StatusConflict)
	case errors.Is(err, repository.ErrUserNotFound):
		http.Error(w, "User not found", http.StatusNotFound)
	case errors.Is(err, repository.ErrDepartmentNotFound):
		http.Error(w, "Department not found", http.StatusNotFound)
	default:
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			switch pgErr.Code {
			case "23505":
				http.Error(w, "A user with this email or an active Department Admin for this department already exists", http.StatusConflict)
				return
			case "23503", "23514":
				http.Error(w, "The user data violates a database constraint", http.StatusBadRequest)
				return
			}
		}
		http.Error(w, "Unable to process user request", http.StatusInternalServerError)
	}
}

// Keep strict JSON decoding consistent across management endpoints.
var _ = json.Valid
var _ = io.EOF
