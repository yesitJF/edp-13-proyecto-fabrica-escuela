package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.EstadoTarjeta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.TipoTarjeta;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TarjetaResponse(Long id, String ultimosCuatroDigitos, TipoTarjeta tipo,
        EstadoTarjeta estado, Long cuentaId, BigDecimal cupo, BigDecimal cupoDisponible,
        LocalDateTime fechaCreacion) {
}