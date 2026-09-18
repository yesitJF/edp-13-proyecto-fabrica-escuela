package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import java.math.BigDecimal;

public class RetiroRequest {

    private String numeroCuenta;
    private BigDecimal monto;

    public RetiroRequest() {
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }
}
