package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)

const refreshTokenDuration = 30 * 24 * time.Hour

func GenerateRefreshToken() (string, error) {
	randomBytes := make([]byte, 32)

	if _, err := rand.Read(randomBytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(randomBytes), nil
}

func HashRefreshToken(token string) (string, error) {
	if token == "" || strings.TrimSpace(token) != token {
		return "", errors.New("invalid refresh token format")
	}

	raw, err := base64.RawURLEncoding.DecodeString(token)
	if err != nil || len(raw) != 32 {
		return "", errors.New("invalid refresh token format")
	}

	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:]), nil
}

func RefreshTokenExpiry() time.Time {
	return time.Now().UTC().Add(refreshTokenDuration)
}
