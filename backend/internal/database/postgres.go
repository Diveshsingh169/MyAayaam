package database

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Connect() {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL is not set")
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatal("Unable to create database connection pool:", err)
	}

	err = pool.Ping(context.Background())
	if err != nil {
		log.Fatal("Unable to connect to database:", err)
	}

	DB = pool

	log.Println("Successfully connected to PostgreSQL database")
}