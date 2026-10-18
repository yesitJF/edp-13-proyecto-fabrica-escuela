package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UserRole;

public record LoginResponse(String accessToken, String tokenType, long expiresIn, UserRole role) {
}