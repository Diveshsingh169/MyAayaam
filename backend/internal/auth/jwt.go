
package auth

import (
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	accessTokenDuration = 10 * time.Minute
	tokenIssuer         = "myaayaam"
	tokenAudience       = "myaayaam-api"
)

type AccessClaims struct {
	jwt.RegisteredClaims
}

// jwtSecret reads and validates the secret from the root .env file.
func jwtSecret() ([]byte, error) {
	encodedSecret := os.Getenv("JWT_SECRET")
	if encodedSecret == "" {
		return nil, errors.New("JWT_SECRET is not configured")
	}

	secret, err := base64.StdEncoding.DecodeString(encodedSecret)
	if err != nil {
		return nil, errors.New("JWT_SECRET must be valid Base64")
	}

	if len(secret) < 32 {
		return nil, errors.New("JWT_SECRET must contain at least 32 random bytes")
	}

	return secret, nil
}

// GenerateAccessToken creates a short-lived JWT for a user.
func GenerateAccessToken(userID int64) (string, error) {
	if userID <= 0 {
		return "", errors.New("user ID must be positive")
	}

	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}

	now := time.Now().UTC()

	claims := AccessClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.FormatInt(userID, 10),
			Issuer:    tokenIssuer,
			Audience:  jwt.ClaimStrings{tokenAudience},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(accessTokenDuration)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(secret)
	if err != nil {
		return "", fmt.Errorf("sign access token: %w", err)
	}

	return signedToken, nil
}

// ValidateAccessToken verifies the signature and registered claims.
func ValidateAccessToken(tokenString string) (*AccessClaims, error) {
	secret, err := jwtSecret()
	if err != nil {
		return nil, err
	}

	claims := &AccessClaims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (any, error) {
			if token.Method != jwt.SigningMethodHS256 {
				return nil, errors.New("unexpected JWT signing method")
			}

			return secret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(tokenIssuer),
		jwt.WithAudience(tokenAudience),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt(),
		jwt.WithLeeway(30*time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("validate access token: %w", err)
	}

	if !token.Valid {
		return nil, errors.New("invalid access token")
	}

	if claims.Subject == "" {
		return nil, errors.New("access token has no subject")
	}

	if _, err := strconv.ParseInt(claims.Subject, 10, 64); err != nil {
		return nil, errors.New("access token has an invalid user ID")
	}

	return claims, nil
}
