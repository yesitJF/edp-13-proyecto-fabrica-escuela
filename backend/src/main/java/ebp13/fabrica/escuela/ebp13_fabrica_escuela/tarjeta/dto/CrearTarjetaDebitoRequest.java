package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.dto;

import jakarta.validation.constraints.NotNull;

public record CrearTarjetaDebitoRequest(@NotNull Long cuentaId) {
}