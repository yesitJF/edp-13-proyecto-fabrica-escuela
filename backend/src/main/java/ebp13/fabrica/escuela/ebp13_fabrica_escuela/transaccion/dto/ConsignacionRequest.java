package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import java.math.BigDecimal;

public class ConsignacionRequest {

    private String cuentaDestino;
    private BigDecimal monto;
    private String remitente;

    public ConsignacionRequest() {
    }

    public String getCuentaDestino() {
        return cuentaDestino;
    }

    public void setCuentaDestino(String cuentaDestino) {
        this.cuentaDestino = cuentaDestino;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getRemitente() {
        return remitente;
    }

    public void setRemitente(String remitente) {
        this.remitente = remitente;
    }
}
