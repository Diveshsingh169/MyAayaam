package auth

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

const (
	saltLength = 16

	argonMemory      = 19 * 1024
	argonIterations  = 2
	argonParallelism = 1
	keyLength        = 32
)

// HashPassword creates an Argon2id password hash.
func HashPassword(password string) (string, error) {
	salt := make([]byte, saltLength)

	if _, err := rand.Read(salt); err != nil {
		return "", fmt.Errorf("failed to generate password salt: %w", err)
	}

	hash := argon2.IDKey(
		[]byte(password),
		salt,
		argonIterations,
		argonMemory,
		argonParallelism,
		keyLength,
	)

	encodedSalt := base64.RawStdEncoding.EncodeToString(salt)
	encodedHash := base64.RawStdEncoding.EncodeToString(hash)

	return fmt.Sprintf(
		"$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s",
		argonMemory,
		argonIterations,
		argonParallelism,
		encodedSalt,
		encodedHash,
	), nil
}

// VerifyPassword verifies a plain password against an Argon2id hash.
func VerifyPassword(password string, encodedHash string) (bool, error) {
	parts := strings.Split(encodedHash, "$")

	if len(parts) != 6 {
		return false, fmt.Errorf("invalid Argon2id hash format")
	}

	if parts[1] != "argon2id" {
		return false, fmt.Errorf("unsupported password hashing algorithm")
	}

	var memory uint32
	var iterations uint32
	var parallelism uint8

	_, err := fmt.Sscanf(
		parts[3],
		"m=%d,t=%d,p=%d",
		&memory,
		&iterations,
		&parallelism,
	)

	if err != nil {
		return false, fmt.Errorf("invalid Argon2id parameters: %w", err)
	}

	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, fmt.Errorf("invalid salt encoding: %w", err)
	}

	expectedHash, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil {
		return false, fmt.Errorf("invalid hash encoding: %w", err)
	}

	actualHash := argon2.IDKey(
		[]byte(password),
		salt,
		iterations,
		memory,
		parallelism,
		uint32(len(expectedHash)),
	)

	if len(actualHash) != len(expectedHash) {
		return false, nil
	}

	var difference byte

	for i := range actualHash {
		difference |= actualHash[i] ^ expectedHash[i]
	}

	return difference == 0, nil
}