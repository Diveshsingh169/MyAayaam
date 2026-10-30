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

// RequireAuth validates the access token and loads the current active user
// from PostgreSQL. Role and department data are never trusted from the token.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		parts := strings.Fields(authHeader)

		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") ||
			parts[1] == "" {
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
			if errors.Is(err, repository.ErrUserNotFound) ||
				errors.Is(err, repository.ErrInactiveAccount) {
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

// UserIDFromContext retrieves the authenticated user's ID.
func UserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDContextKey).(int64)
	return userID, ok
}

// UserFromContext retrieves the current authenticated user from the request context.
func UserFromContext(ctx context.Context) (*model.User, bool) {
	user, ok := ctx.Value(userContextKey).(*model.User)
	return user, ok
}
