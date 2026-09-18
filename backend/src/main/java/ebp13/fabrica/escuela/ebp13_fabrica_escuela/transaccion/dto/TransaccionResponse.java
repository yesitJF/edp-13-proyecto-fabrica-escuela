package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.TipoTransaccion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class TransaccionResponse {

    private Long id;
    private String referencia;
    private TipoTransaccion tipo;
    private BigDecimal monto;
    private String cuentaOrigen;
    private String cuentaDestino;
    private LocalDateTime fecha;
    private String descripcion;

    public TransaccionResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public TipoTransaccion getTipo() {
        return tipo;
    }

    public void setTipo(TipoTransaccion tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getCuentaOrigen() {
        return cuentaOrigen;
    }

    public void setCuentaOrigen(String cuentaOrigen) {
        this.cuentaOrigen = cuentaOrigen;
    }

    public String getCuentaDestino() {
        return cuentaDestino;
    }

    public void setCuentaDestino(String cuentaDestino) {
        this.cuentaDestino = cuentaDestino;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }
}
