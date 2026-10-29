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

	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")

	_ = json.NewEncoder(w).Encode(map[string]any{
		"message": "Authentication successful",
		"user_id": userID,
	})
}
