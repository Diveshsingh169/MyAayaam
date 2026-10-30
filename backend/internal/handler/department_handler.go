package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/service"
	"github.com/jackc/pgx/v5/pgconn"
)

type DepartmentHandler struct {
	service *service.DepartmentService
}

func NewDepartmentHandler() *DepartmentHandler {
	return &DepartmentHandler{service: service.NewDepartmentService()}
}

type departmentRequest struct {
	Name        string  `json:"name"`
	Code        string  `json:"code"`
	Description *string `json:"description"`
}

func (h *DepartmentHandler) Collection(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.list(w, r)
	case http.MethodPost:
		h.create(w, r)
	default:
		w.Header().Set("Allow", "GET, POST")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *DepartmentHandler) Item(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "Invalid department ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		department, err := h.service.Get(ctx, id)
		if err != nil {
			writeDepartmentError(w, err)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"department": department})
	case http.MethodPut:
		h.update(w, r, id)
	case http.MethodDelete:
		h.deactivate(w, r, id)
	case http.MethodPatch:
		h.changeStatus(w, r, id)
	default:
		w.Header().Set("Allow", "GET, PUT, PATCH, DELETE")
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *DepartmentHandler) list(w http.ResponseWriter, r *http.Request) {
	includeInactive := r.URL.Query().Get("include_inactive") == "true"
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	departments, err := h.service.List(ctx, includeInactive)
	if err != nil {
		http.Error(w, "Unable to list departments", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"departments": departments})
}

func (h *DepartmentHandler) create(w http.ResponseWriter, r *http.Request) {
	var req departmentRequest
	if !decodeDepartmentRequest(w, r, &req) {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	department, err := h.service.Create(ctx, req.Name, req.Code, req.Description)
	if err != nil {
		writeDepartmentError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, map[string]any{
		"message":    "Department created successfully",
		"department": department,
	})
}

func (h *DepartmentHandler) update(w http.ResponseWriter, r *http.Request, id int64) {
	var req departmentRequest
	if !decodeDepartmentRequest(w, r, &req) {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	department, err := h.service.Update(ctx, id, req.Name, req.Code, req.Description)
	if err != nil {
		writeDepartmentError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"message":    "Department updated successfully",
		"department": department,
	})
}

func (h *DepartmentHandler) changeStatus(w http.ResponseWriter, r *http.Request, id int64) {
	var req struct {
		IsActive *bool `json:"is_active"`
	}
	if !decodeDepartmentRequest(w, r, &req) {
		return
	}
	if req.IsActive == nil {
		http.Error(w, "is_active is required", http.StatusBadRequest)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if err := h.service.SetActive(ctx, id, *req.IsActive); err != nil {
		writeDepartmentError(w, err)
		return
	}
	message := "Department deactivated successfully"
	if *req.IsActive {
		message = "Department activated successfully"
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": message})
}

func (h *DepartmentHandler) deactivate(w http.ResponseWriter, r *http.Request, id int64) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	if err := h.service.SetActive(ctx, id, false); err != nil {
		writeDepartmentError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Department deactivated successfully"})
}

func decodeDepartmentRequest[T any](w http.ResponseWriter, r *http.Request, req *T) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 16*1024)
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return false
	}
	var extra any
	if err := decoder.Decode(&extra); err != io.EOF {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return false
	}
	return true
}

func writeDepartmentError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, service.ErrInvalidDepartment):
		http.Error(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, repository.ErrDepartmentNotFound):
		http.Error(w, "Department not found", http.StatusNotFound)
	default:
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			http.Error(w, "Department name or code already exists", http.StatusConflict)
			return
		}
		http.Error(w, "Unable to process department request", http.StatusInternalServerError)
	}
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}
