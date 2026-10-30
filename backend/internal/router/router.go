package router

import (
	"net/http"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/handler"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/middleware"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
)

func NewRouter() *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("/", handler.HomeHandler)
	mux.HandleFunc("/health", handler.HealthHandler)

	authHandler := handler.NewAuthHandler()
	tokenHandler := handler.NewTokenHandler()
	mux.HandleFunc("/api/v1/auth/login", authHandler.Login)
	mux.HandleFunc("/api/v1/auth/refresh", tokenHandler.Refresh)
	mux.HandleFunc("/api/v1/auth/logout", tokenHandler.Logout)
	mux.Handle("GET /api/v1/auth/me",
		middleware.RequireAuth(http.HandlerFunc(handler.MeHandler)))

	departmentHandler := handler.NewDepartmentHandler()
	superAdminOnly := func(next http.Handler) http.Handler {
		return middleware.RequireAuth(
			middleware.RequireRoles(model.RoleSuperAdmin)(next),
		)
	}
	mux.Handle("GET /api/v1/departments", superAdminOnly(http.HandlerFunc(departmentHandler.Collection)))
	mux.Handle("POST /api/v1/departments", superAdminOnly(http.HandlerFunc(departmentHandler.Collection)))
	mux.Handle("GET /api/v1/departments/{id}", superAdminOnly(http.HandlerFunc(departmentHandler.Item)))
	mux.Handle("PUT /api/v1/departments/{id}", superAdminOnly(http.HandlerFunc(departmentHandler.Item)))
	mux.Handle("DELETE /api/v1/departments/{id}", superAdminOnly(http.HandlerFunc(departmentHandler.Item)))
	mux.Handle("PATCH /api/v1/departments/{id}", superAdminOnly(http.HandlerFunc(departmentHandler.Item)))

	// User management is available to Super Admins and Department Admins.
	// The service and SQL queries enforce the exact department-level permissions.
	userHandler := handler.NewUserHandler()
	userManagersOnly := func(next http.Handler) http.Handler {
		return middleware.RequireAuth(
			middleware.RequireRoles(model.RoleSuperAdmin, model.RoleDepartmentAdmin)(next),
		)
	}
	mux.Handle("GET /api/v1/users", userManagersOnly(http.HandlerFunc(userHandler.Collection)))
	mux.Handle("POST /api/v1/users", userManagersOnly(http.HandlerFunc(userHandler.Collection)))
	mux.Handle("GET /api/v1/users/{id}", userManagersOnly(http.HandlerFunc(userHandler.Item)))
	mux.Handle("PUT /api/v1/users/{id}", userManagersOnly(http.HandlerFunc(userHandler.Item)))
	mux.Handle("PATCH /api/v1/users/{id}", userManagersOnly(http.HandlerFunc(userHandler.Item)))

	return mux
}
