package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeCredentialsRequest(
        @NotBlank String currentPassword,
        String newUsername,
        String newPassword,
        String confirmNewPassword) {
}
