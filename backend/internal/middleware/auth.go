package middleware

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/auth"
)

type contextKey string

const userIDContextKey contextKey = "authenticated_user_id"

// RequireAuth rejects requests without a valid Bearer access token.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		parts := strings.Fields(authHeader)

		if len(parts) != 2 ||
			!strings.EqualFold(parts[0], "Bearer") ||
			parts[1] == "" {
			http.Error(w, "Missing or invalid authorization header",
				http.StatusUnauthorized)
			return
		}

		claims, err := auth.ValidateAccessToken(parts[1])
		if err != nil {
			http.Error(w, "Invalid or expired access token",
				http.StatusUnauthorized)
			return
		}

		userID, err := strconv.ParseInt(claims.Subject, 10, 64)
		if err != nil || userID <= 0 {
			http.Error(w, "Invalid access token",
				http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDContextKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserIDFromContext retrieves the authenticated user's ID.
func UserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(userIDContextKey).(int64)
	return userID, ok
}
