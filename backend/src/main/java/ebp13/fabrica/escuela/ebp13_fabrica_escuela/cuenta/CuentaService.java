package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import java.math.BigDecimal;
import java.security.SecureRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CuentaService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CuentaRepository cuentaRepository;
    private final ClienteRepository clienteRepository;

    public CuentaService(
            CuentaRepository cuentaRepository,
            ClienteRepository clienteRepository) {
        this.cuentaRepository = cuentaRepository;
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public CuentaResponse crear(CuentaRequest request) {
        Cliente cliente = clienteRepository.findById(request.getClienteId())
                .orElseThrow(() -> new ClienteNoEncontradoException(
                        "No existe el cliente con id " + request.getClienteId()));

        if (!cliente.isActivo()) {
            throw new ClienteInactivoException(
                    "El cliente con id " + request.getClienteId() + " está inactivo");
        }

        Cuenta cuenta = new Cuenta();
        cuenta.setNumeroCuenta(generarNumeroCuenta(request.getTipo()));
        cuenta.setTipo(request.getTipo());
        cuenta.setSaldo(BigDecimal.ZERO);
        cuenta.setActiva(true);
        cuenta.setCliente(cliente);

        return toResponse(cuentaRepository.save(cuenta));
    }

    @Transactional(readOnly = true)
    public CuentaResponse consultarPorNumero(String numero) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuenta(numero)
                .orElseThrow(() -> new CuentaNoEncontradaException(
                        "No existe la cuenta con número " + numero));
        return toResponse(cuenta);
    }

    private String generarNumeroCuenta(TipoCuenta tipo) {
        String prefijo;
        if (tipo == TipoCuenta.AHORROS) {
            prefijo = "301";
        } else if (tipo == TipoCuenta.CORRIENTE) {
            prefijo = "501";
        } else {
            throw new IllegalArgumentException("El tipo de cuenta es obligatorio");
        }

        String numero;
        do {
            numero = "%s-%03d-%04d-%02d".formatted(
                    prefijo,
                    RANDOM.nextInt(1_000),
                    RANDOM.nextInt(10_000),
                    RANDOM.nextInt(100));
        } while (cuentaRepository.existsByNumeroCuenta(numero));
        return numero;
    }

    private CuentaResponse toResponse(Cuenta cuenta) {
        CuentaResponse response = new CuentaResponse();
        response.setId(cuenta.getId());
        response.setNumeroCuenta(cuenta.getNumeroCuenta());
        response.setTipo(cuenta.getTipo());
        response.setSaldo(cuenta.getSaldo());
        response.setActiva(cuenta.isActiva());
        response.setIdCliente(cuenta.getCliente().getIdCliente());
        return response;
    }
}
