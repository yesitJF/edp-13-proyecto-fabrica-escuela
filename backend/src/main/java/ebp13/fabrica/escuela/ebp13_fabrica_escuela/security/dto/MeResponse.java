package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UserRole;

public record MeResponse(String username, UserRole role, String idCliente, String nombre) {
}