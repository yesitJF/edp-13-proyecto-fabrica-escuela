package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;
import java.math.BigDecimal;

public class CuentaResponse {

    private Long id;
    private String numeroCuenta;
    private TipoCuenta tipo;
    private BigDecimal saldo;
    private boolean activa;
    private String idCliente;

    public CuentaResponse() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroCuenta() {
        return numeroCuenta;
    }

    public void setNumeroCuenta(String numeroCuenta) {
        this.numeroCuenta = numeroCuenta;
    }

    public TipoCuenta getTipo() {
        return tipo;
    }

    public void setTipo(TipoCuenta tipo) {
        this.tipo = tipo;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public void setSaldo(BigDecimal saldo) {
        this.saldo = saldo;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }

    public String getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(String idCliente) {
        this.idCliente = idCliente;
    }
}
