package main

import (
	"log"
	"net/http"
	"os"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/database"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/router"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	err := godotenv.Load("../.env")
	if err != nil {
		log.Println("Warning: .env file not found, using system environment variables")
	}

	// Connect to PostgreSQL
	database.Connect()

	// Create router
	mux := router.NewRouter()

	// Get port from environment
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on http://localhost:%s", port)

	// Start server
	err = http.ListenAndServe(":"+port, mux)
	if err != nil {
		log.Fatal("Server error:", err)
	}
}