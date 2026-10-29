package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/service"
)

type TokenHandler struct {
	authService *service.AuthService
}

func NewTokenHandler() *TokenHandler {
	return &TokenHandler{
		authService: service.NewAuthService(),
	}
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type tokenResponse struct {
	Message      string `json:"message"`
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int64  `json:"expires_in"`
}

func (h *TokenHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 8*1024)

	var req refreshRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var extra any
	if err := decoder.Decode(&extra); err != nil && !errors.Is(err, context.Canceled) {
		if err.Error() != "EOF" {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	} else {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		http.Error(w, "Refresh token is required", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	user, tokens, err := h.authService.Refresh(ctx, req.RefreshToken)
	if err != nil {
		if errors.Is(err, repository.ErrInvalidRefreshToken) {
			http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusOK)

	_ = json.NewEncoder(w).Encode(tokenResponse{
		Message:      "Token refreshed successfully",
		AccessToken:  tokens.AccessToken,
		RefreshToken: tokens.RefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    600,
	})

	_ = user // The refreshed response currently returns tokens only.
}

func (h *TokenHandler) Logout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	r.Body = http.MaxBytesReader(w, r.Body, 8*1024)

	var req refreshRequest
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var extra any
	if err := decoder.Decode(&extra); err != nil && !errors.Is(err, context.Canceled) {
		if err.Error() != "EOF" {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
	} else {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	if err := h.authService.Logout(ctx, req.RefreshToken); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(http.StatusNoContent)
}
