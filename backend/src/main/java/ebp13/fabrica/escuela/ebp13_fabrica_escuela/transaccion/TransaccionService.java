package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.CuentaInactivaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.SaldoInsuficienteException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionResponse;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransaccionService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CuentaRepository cuentaRepository;
    private final TransaccionRepository transaccionRepository;

    public TransaccionService(
            CuentaRepository cuentaRepository,
            TransaccionRepository transaccionRepository) {
        this.cuentaRepository = cuentaRepository;
        this.transaccionRepository = transaccionRepository;
    }

    @Transactional
    public TransaccionResponse transferir(
            String cuentaOrigenNum,
            String cuentaDestinoNum,
            BigDecimal monto,
            String concepto) {
        validarMonto(monto);
            if (Objects.equals(cuentaOrigenNum, cuentaDestinoNum)) {
            throw new IllegalArgumentException("Las cuentas de origen y destino deben ser distintas");
        }

        Cuenta origen = buscarCuenta(cuentaOrigenNum);
        Cuenta destino = buscarCuenta(cuentaDestinoNum);
        validarCuentaActiva(destino);
        validarSaldo(origen, monto);

        origen.setSaldo(origen.getSaldo().subtract(monto));
        destino.setSaldo(destino.getSaldo().add(monto));
        cuentaRepository.save(origen);
        cuentaRepository.save(destino);

        return guardarTransaccion(
                TipoTransaccion.TRANSFERENCIA,
                monto,
                cuentaOrigenNum,
                cuentaDestinoNum,
                concepto);
    }

    @Transactional
    public TransaccionResponse retirar(String numeroCuenta, BigDecimal monto) {
        validarMonto(monto);
        Cuenta cuenta = buscarCuenta(numeroCuenta);
        validarCuentaActiva(cuenta);
        validarSaldo(cuenta, monto);

        cuenta.setSaldo(cuenta.getSaldo().subtract(monto));
        cuentaRepository.save(cuenta);

        return guardarTransaccion(
                TipoTransaccion.RETIRO,
                monto,
                numeroCuenta,
                "EFECTIVO",
                null);
    }

    @Transactional
    public TransaccionResponse consignar(
            String cuentaDestinoNum,
            BigDecimal monto,
            String remitente) {
        validarMonto(monto);
        Cuenta destino = buscarCuenta(cuentaDestinoNum);
        validarCuentaActiva(destino);

        destino.setSaldo(destino.getSaldo().add(monto));
        cuentaRepository.save(destino);

        return guardarTransaccion(
                TipoTransaccion.CONSIGNACION,
                monto,
                remitente == null || remitente.isBlank() ? "EXTERNO" : remitente,
                cuentaDestinoNum,
                null);
    }

    private Cuenta buscarCuenta(String numero) {
        return cuentaRepository.findByNumeroCuenta(numero)
                .orElseThrow(() -> new CuentaNoEncontradaException(
                        "No existe la cuenta con número " + numero));
    }

    private void validarCuentaActiva(Cuenta cuenta) {
        if (!cuenta.isActiva()) {
            throw new CuentaInactivaException(
                    "La cuenta " + cuenta.getNumeroCuenta() + " está inactiva");
        }
    }

    private void validarSaldo(Cuenta cuenta, BigDecimal monto) {
        if (cuenta.getSaldo().compareTo(monto) < 0) {
            throw new SaldoInsuficienteException(
                    "La cuenta " + cuenta.getNumeroCuenta() + " no tiene saldo suficiente");
        }
    }

    private void validarMonto(BigDecimal monto) {
        if (monto == null || monto.signum() <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor que cero");
        }
    }

    private TransaccionResponse guardarTransaccion(
            TipoTransaccion tipo,
            BigDecimal monto,
            String cuentaOrigen,
            String cuentaDestino,
            String descripcion) {
        Transaccion transaccion = new Transaccion();
        transaccion.setReferencia(generarReferencia());
        transaccion.setTipo(tipo);
        transaccion.setMonto(monto);
        transaccion.setCuentaOrigen(cuentaOrigen);
        transaccion.setCuentaDestino(cuentaDestino);
        transaccion.setDescripcion(descripcion);
        return toResponse(transaccionRepository.save(transaccion));
    }

    private String generarReferencia() {
        String referencia;
        do {
            referencia = "REF-%06d".formatted(RANDOM.nextInt(1_000_000));
        } while (transaccionRepository.existsByReferencia(referencia));
        return referencia;
    }

    private TransaccionResponse toResponse(Transaccion transaccion) {
        TransaccionResponse response = new TransaccionResponse();
        response.setId(transaccion.getId());
        response.setReferencia(transaccion.getReferencia());
        response.setTipo(transaccion.getTipo());
        response.setMonto(transaccion.getMonto());
        response.setCuentaOrigen(transaccion.getCuentaOrigen());
        response.setCuentaDestino(transaccion.getCuentaDestino());
        response.setFecha(transaccion.getFecha());
        response.setDescripcion(transaccion.getDescripcion());
        return response;
    }
}
