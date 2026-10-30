package middleware

import (
	"context"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/auth"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
)

type contextKey string

const (
	userIDContextKey contextKey = "authenticated_user_id"
	userContextKey   contextKey = "authenticated_user"
)

// RequireAuth validates the JWT and reloads the active user and department from PostgreSQL.
// Role and department membership are never trusted from JWT claims.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Fields(r.Header.Get("Authorization"))
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") || parts[1] == "" {
			http.Error(w, "Missing or invalid authorization header", http.StatusUnauthorized)
			return
		}
		claims, err := auth.ValidateAccessToken(parts[1])
		if err != nil {
			http.Error(w, "Invalid or expired access token", http.StatusUnauthorized)
			return
		}
		userID, err := strconv.ParseInt(claims.Subject, 10, 64)
		if err != nil || userID <= 0 {
			http.Error(w, "Invalid access token", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		user, err := repository.GetUserByID(ctx, userID)
		if err != nil {
			if errors.Is(err, repository.ErrUserNotFound) || errors.Is(err, repository.ErrInactiveAccount) {
				http.Error(w, "Account is unavailable", http.StatusUnauthorized)
				return
			}
			http.Error(w, "Unable to authenticate request", http.StatusInternalServerError)
			return
		}

		ctx = context.WithValue(r.Context(), userIDContextKey, user.ID)
		ctx = context.WithValue(ctx, userContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireRoles permits only the listed roles. Apply after RequireAuth.
func RequireRoles(allowedRoles ...model.UserRole) func(http.Handler) http.Handler {
	allowed := make(map[model.UserRole]struct{}, len(allowedRoles))
	for _, role := range allowedRoles {
		allowed[role] = struct{}{}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := UserFromContext(r.Context())
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			if _, ok := allowed[user.Role]; !ok {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func UserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDContextKey).(int64)
	return userID, ok
}

func UserFromContext(ctx context.Context) (*model.User, bool) {
	user, ok := ctx.Value(userContextKey).(*model.User)
	return user, ok
}

// DepartmentScope describes the caller's data boundary.
type DepartmentScope struct {
	DepartmentID *int64
	IsGlobal     bool
}

func DepartmentScopeFromContext(ctx context.Context) (DepartmentScope, bool) {
	user, ok := UserFromContext(ctx)
	if !ok {
		return DepartmentScope{}, false
	}
	if user.Role == model.RoleSuperAdmin {
		return DepartmentScope{IsGlobal: true}, true
	}
	if user.DepartmentID == nil {
		return DepartmentScope{}, false
	}
	return DepartmentScope{DepartmentID: user.DepartmentID}, true
}

func RequireDepartmentMembership(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if _, ok := DepartmentScopeFromContext(r.Context()); !ok {
			http.Error(w, "Department access is not configured", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	})
}
