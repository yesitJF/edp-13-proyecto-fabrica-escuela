package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.EstadoTransaccion;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.TipoTransaccion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransaccionHistorialResponse(Long id, String referencia,
        TipoTransaccion tipo, String direccion, BigDecimal monto,
        LocalDateTime fecha, String cuentaOrigen, String cuentaDestino,
        EstadoTransaccion estado, String descripcion) {
}