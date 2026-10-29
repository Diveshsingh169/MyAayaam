package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/database"
)

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	// Tell the client that we are returning JSON
	w.Header().Set("Content-Type", "application/json")

	// Check PostgreSQL connection
	err := database.DB.Ping(context.Background())

	// If database is not available
	if err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)

		json.NewEncoder(w).Encode(map[string]string{
			"status":   "error",
			"database": "disconnected",
		})

		return
	}

	// Everything is working
	json.NewEncoder(w).Encode(map[string]string{
		"status":   "ok",
		"message":  "MyAayaam API is running",
		"database": "connected",
	})
}
