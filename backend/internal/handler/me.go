package handler

import (
    "encoding/json"
    "net/http"

    "github.com/Diveshsingh169/MyAayaam/backend/internal/middleware"
)

func MeHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        w.Header().Set("Allow", http.MethodGet)
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    user, ok := middleware.UserFromContext(r.Context())
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }

    // Return only public profile fields. Never expose password hashes.
    response := struct {
        Message string `json:"message"`
        ID int64 `json:"id"`
        Name string `json:"name"`
        Email string `json:"email"`
        Role string `json:"role"`
        DepartmentID *int64 `json:"department_id"`
        IsActive bool `json:"is_active"`
    }{
        Message: "Authentication successful",
        ID: user.ID,
        Name: user.Name,
        Email: user.Email,
        Role: string(user.Role),
        DepartmentID: user.DepartmentID,
        IsActive: user.IsActive,
    }

    w.Header().Set("Content-Type", "application/json")
    w.Header().Set("Cache-Control", "no-store")
    _ = json.NewEncoder(w).Encode(response)
}
