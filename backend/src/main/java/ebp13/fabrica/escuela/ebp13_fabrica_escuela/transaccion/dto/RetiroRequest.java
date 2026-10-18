package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto;

import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public class RetiroRequest {

    private String numeroCuenta;
    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "10000.00", message = "El retiro mínimo es 10000")
    @DecimalMax(value = "3000000.00", message = "El retiro máximo es 3000000")
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
