package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(@NotBlank String username, @NotBlank String password) {
}