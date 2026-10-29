package service

import (
	"context"
	"errors"
	"strings"

	"github.com/Diveshsingh169/MyAayaam/backend/internal/auth"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/model"
	"github.com/Diveshsingh169/MyAayaam/backend/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrInactiveUser       = errors.New("user account is inactive")
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
}

type AuthService struct{}

func NewAuthService() *AuthService {
	return &AuthService{}
}

func (s *AuthService) Login(
	ctx context.Context,
	email string,
	password string,
) (*model.User, error) {
	email = strings.TrimSpace(email)
	if email == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := repository.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if !user.IsActive {
		return nil, ErrInvalidCredentials
	}

	valid, err := auth.VerifyPassword(password, user.PasswordHash)
	if err != nil {
		return nil, err
	}
	if !valid {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *AuthService) IssueTokens(
	ctx context.Context,
	userID int64,
) (*TokenPair, error) {
	accessToken, err := auth.GenerateAccessToken(userID)
	if err != nil {
		return nil, err
	}

	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, err
	}

	tokenHash, err := auth.HashRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}

	if err := repository.CreateRefreshToken(
		ctx, userID, tokenHash, auth.RefreshTokenExpiry(),
	); err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Refresh(
	ctx context.Context,
	rawRefreshToken string,
) (*model.User, *TokenPair, error) {
	oldHash, err := auth.HashRefreshToken(rawRefreshToken)
	if err != nil {
		return nil, nil, repository.ErrInvalidRefreshToken
	}

	newRefreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return nil, nil, err
	}

	newHash, err := auth.HashRefreshToken(newRefreshToken)
	if err != nil {
		return nil, nil, err
	}

	newExpiry := auth.RefreshTokenExpiry()

	userID, err := repository.RotateRefreshToken(
		ctx, oldHash, newHash, newExpiry,
	)
	if err != nil {
		return nil, nil, err
	}

	user, err := repository.GetUserByID(ctx, userID)
	if err != nil {
		return nil, nil, err
	}

	accessToken, err := auth.GenerateAccessToken(user.ID)
	if err != nil {
		return nil, nil, err
	}

	return user, &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
	}, nil
}

func (s *AuthService) Logout(
	ctx context.Context,
	rawRefreshToken string,
) error {
	tokenHash, err := auth.HashRefreshToken(rawRefreshToken)
	if err != nil {
		// Logout is idempotent for missing or malformed tokens.
		return nil
	}

	return repository.RevokeRefreshToken(ctx, tokenHash)
}

func (s *AuthService) CurrentUser(
	ctx context.Context,
	userID int64,
) (*model.User, error) {
	return repository.GetUserByID(ctx, userID)
}
