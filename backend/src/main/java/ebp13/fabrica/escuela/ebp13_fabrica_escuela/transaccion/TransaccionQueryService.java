package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.Usuario;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UsuarioRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionHistorialResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransaccionQueryService {

    private final CuentaRepository cuentas;
    private final UsuarioRepository usuarios;
    private final TransaccionRepository transacciones;

    public TransaccionQueryService(CuentaRepository cuentas, UsuarioRepository usuarios,
            TransaccionRepository transacciones) {
        this.cuentas = cuentas;
        this.usuarios = usuarios;
        this.transacciones = transacciones;
    }

    @Transactional(readOnly = true)
    public List<TransaccionHistorialResponse> history(String username, String accountNumber,
            LocalDateTime desde, LocalDateTime hasta) {
        validateDateRange(desde, hasta);
        Cliente client = findClient(username);
        Cuenta account = findOwnedAccount(accountNumber, client);
        List<String> ownAccountNumbers = cuentas.findByCliente_Id(client.getId()).stream()
                .map(Cuenta::getNumeroCuenta).toList();
        return transacciones.findByCuentaOrigenInOrCuentaDestinoInOrderByFechaDesc(
                ownAccountNumbers, ownAccountNumbers).stream()
                .filter(transaction -> desde == null || !transaction.getFecha().isBefore(desde))
                .filter(transaction -> hasta == null || !transaction.getFecha().isAfter(hasta))
                .filter(transaction -> Objects.equals(transaction.getCuentaOrigen(), account.getNumeroCuenta())
                        || Objects.equals(transaction.getCuentaDestino(), account.getNumeroCuenta()))
                .map(transaction -> toResponse(transaction,
                        Objects.equals(transaction.getCuentaOrigen(), account.getNumeroCuenta())
                                ? "enviada"
                                : "recibida"))
                .toList();
    }

    @Transactional(readOnly = true)
    public TransaccionHistorialResponse detail(String username, String identifier) {
        return detail(username, identifier, null);
    }

    @Transactional(readOnly = true)
    public TransaccionHistorialResponse detail(String username, String identifier, String accountNumber) {
        Cliente client = findClient(username);
        Transaccion transaction;
        if (identifier.matches("\\d+")) {
            transaction = transacciones.findById(Long.valueOf(identifier))
                    .orElseThrow(() -> transactionNotFound());
        } else {
            transaction = transacciones.findByReferencia(identifier)
                    .orElseThrow(() -> transactionNotFound());
        }
        List<String> ownAccountNumbers = cuentas.findByCliente_Id(client.getId()).stream()
                .map(Cuenta::getNumeroCuenta).toList();
        boolean involved = ownAccountNumbers.contains(transaction.getCuentaOrigen())
                || ownAccountNumbers.contains(transaction.getCuentaDestino());
        if (!involved)
            throw transactionNotFound();
        String direction;
        if (accountNumber != null && !accountNumber.isBlank()) {
            Cuenta account = findOwnedAccount(accountNumber, client);
            boolean isSource = Objects.equals(transaction.getCuentaOrigen(), account.getNumeroCuenta());
            boolean isDestination = Objects.equals(transaction.getCuentaDestino(), account.getNumeroCuenta());
            if (!isSource && !isDestination) {
                throw transactionNotFound();
            }
            direction = isSource ? "enviada" : "recibida";
        } else {
            direction = ownAccountNumbers.contains(transaction.getCuentaOrigen()) ? "enviada" : "recibida";
        }
        return toResponse(transaction, direction);
    }

    private Cliente findClient(String username) {
        Usuario user = usuarios.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado"));
        if (user.getCliente() == null)
            throw new ResourceNotFoundException("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado");
        return user.getCliente();
    }

    private Cuenta findOwnedAccount(String accountNumber, Cliente client) {
        Cuenta account = cuentas.findByNumeroCuenta(accountNumber)
                .orElseThrow(() -> new ResourceNotFoundException("CUENTA_NO_ENCONTRADA", "Cuenta no encontrada"));
        if (!account.getCliente().getId().equals(client.getId())) {
            throw new ResourceNotFoundException("CUENTA_NO_ENCONTRADA", "Cuenta no encontrada");
        }
        return account;
    }

    private void validateDateRange(LocalDateTime desde, LocalDateTime hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new IllegalArgumentException("La fecha desde debe ser anterior o igual a hasta");
        }
    }

    private ResourceNotFoundException transactionNotFound() {
        return new ResourceNotFoundException("TRANSACCION_NO_ENCONTRADA", "Transacción no encontrada");
    }

    private TransaccionHistorialResponse toResponse(Transaccion transaction, String direction) {
        return new TransaccionHistorialResponse(transaction.getId(), transaction.getReferencia(),
                transaction.getTipo(), direction, transaction.getMonto(), transaction.getFecha(),
                transaction.getCuentaOrigen(), transaction.getCuentaDestino(),
                transaction.getEstado() == null ? EstadoTransaccion.EXITOSA : transaction.getEstado(),
                transaction.getDescripcion());
    }
}