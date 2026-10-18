package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;
import jakarta.validation.constraints.AssertTrue;

public class CuentaRequest {

    private Long clienteId;
    private String idCliente;
    private TipoCuenta tipo;
    private TipoCuenta tipoCuenta;

    public CuentaRequest() {
    }

    public Long getClienteId() {
        return clienteId;
    }

    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }

    public String getIdCliente() {
        return idCliente;
    }

    public void setIdCliente(String idCliente) {
        this.idCliente = idCliente;
    }

    public TipoCuenta getTipo() {
        return tipo;
    }

    public void setTipo(TipoCuenta tipo) {
        this.tipo = tipo;
    }

    public TipoCuenta getTipoCuenta() {
        return tipoCuenta;
    }

    public void setTipoCuenta(TipoCuenta tipoCuenta) {
        this.tipoCuenta = tipoCuenta;
    }

    public TipoCuenta tipoSolicitado() {
        return tipo != null ? tipo : tipoCuenta;
    }

    @AssertTrue(message = "El tipo de cuenta es obligatorio")
    public boolean isTipoValido() {
        return tipoSolicitado() != null;
    }
}
