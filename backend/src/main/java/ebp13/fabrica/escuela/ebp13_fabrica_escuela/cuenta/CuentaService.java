package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.Usuario;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UsuarioRepository;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CuentaService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final CuentaRepository cuentaRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;

    public CuentaService(
            CuentaRepository cuentaRepository,
            ClienteRepository clienteRepository,
            UsuarioRepository usuarioRepository) {
        this.cuentaRepository = cuentaRepository;
        this.clienteRepository = clienteRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public CuentaResponse crear(CuentaRequest request, String username, boolean manager) {
        Usuario user = usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ClienteNoEncontradoException("Cliente no encontrado"));
        Cliente cliente;
        if (!manager) {
            cliente = user.getCliente();
            if (cliente == null)
                throw new ClienteNoEncontradoException("Cliente no encontrado");
        } else if (request.getIdCliente() != null && !request.getIdCliente().isBlank()) {
            cliente = clienteRepository.findByIdCliente(request.getIdCliente())
                    .orElseThrow(() -> new ClienteNoEncontradoException("Cliente no encontrado"));
        } else {
            cliente = request.getClienteId() == null ? null
                    : clienteRepository.findById(request.getClienteId()).orElse(null);
            if (cliente == null)
                throw new ClienteNoEncontradoException("Cliente no encontrado");
        }

        if (!cliente.isActivo()) {
            throw new ClienteInactivoException(
                    "El cliente con id " + request.getClienteId() + " está inactivo");
        }

        Cuenta cuenta = new Cuenta();
        cuenta.setNumeroCuenta(generarNumeroCuenta(request.tipoSolicitado()));
        cuenta.setTipo(request.tipoSolicitado());
        cuenta.setSaldo(BigDecimal.ZERO);
        cuenta.setActiva(true);
        cuenta.setCliente(cliente);

        return toResponse(cuentaRepository.save(cuenta));
    }

    @Transactional(readOnly = true)
    public CuentaResponse consultarPorNumero(String numero, String username, boolean manager) {
        Cuenta cuenta = cuentaRepository.findByNumeroCuenta(numero)
                .orElseThrow(() -> new CuentaNoEncontradaException(
                        "Cuenta no encontrada"));
        if (!manager) {
            Usuario user = usuarioRepository.findByUsernameIgnoreCase(username)
                    .orElseThrow(() -> new CuentaNoEncontradaException("Cuenta no encontrada"));
            if (user.getCliente() == null || !user.getCliente().getId().equals(cuenta.getCliente().getId())) {
                throw new CuentaNoEncontradaException("Cuenta no encontrada");
            }
        }
        return toResponse(cuenta);
    }

    @Transactional(readOnly = true)
    public List<CuentaResponse> listar(String username, boolean manager) {
        if (manager) {
            return cuentaRepository.findAll().stream().map(this::toResponse).toList();
        }
        Usuario user = usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new CuentaNoEncontradaException("Cuenta no encontrada"));
        if (user.getCliente() == null) {
            throw new CuentaNoEncontradaException("Cuenta no encontrada");
        }
        return cuentaRepository.findByCliente_Id(user.getCliente().getId()).stream()
                .map(this::toResponse).toList();
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
