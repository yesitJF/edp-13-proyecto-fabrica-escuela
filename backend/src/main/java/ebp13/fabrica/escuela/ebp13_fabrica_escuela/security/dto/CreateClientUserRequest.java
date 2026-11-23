package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateClientUserRequest(
        @NotNull Long clienteId,
        @NotBlank String username,
        @NotBlank String password) {
}