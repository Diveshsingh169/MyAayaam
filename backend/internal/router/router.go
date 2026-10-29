package router

import (
	"net/http"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/handler"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/middleware"
)

func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("/", handler.HomeHandler)
	mux.HandleFunc("/health", handler.HealthHandler)

	// Authentication handlers
	authHandler := handler.NewAuthHandler()
	tokenHandler := handler.NewTokenHandler()

	// Public authentication routes
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/refresh", tokenHandler.Refresh)
	mux.HandleFunc("/api/v1/auth/logout", tokenHandler.Logout)

	// Protected routes
	mux.Handle(
		"/api/v1/auth/me",
		middleware.RequireAuth(http.HandlerFunc(handler.MeHandler)),
	)

	return mux
}
