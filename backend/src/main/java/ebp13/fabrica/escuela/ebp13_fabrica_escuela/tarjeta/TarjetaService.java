package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.Usuario;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UsuarioRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.dto.TarjetaResponse;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.LocalDate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TarjetaService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private final TarjetaRepository tarjetas;
    private final CuentaRepository cuentas;
    private final UsuarioRepository usuarios;
    private final boolean activeClientRequired;
    private final int minimumAge;
    private final int minimumActiveAccounts;
    private final BigDecimal defaultCreditLimit;

    public TarjetaService(TarjetaRepository tarjetas, CuentaRepository cuentas,
            UsuarioRepository usuarios,
            @Value("${app.cards.credit-requires-active-client}") boolean activeClientRequired,
            @Value("${app.cards.credit-minimum-age}") int minimumAge,
            @Value("${app.cards.credit-minimum-active-accounts}") int minimumActiveAccounts,
            @Value("${app.cards.credit-default-limit}") BigDecimal defaultCreditLimit) {
        this.tarjetas = tarjetas;
        this.cuentas = cuentas;
        this.usuarios = usuarios;
        this.activeClientRequired = activeClientRequired;
        this.minimumAge = minimumAge;
        this.minimumActiveAccounts = minimumActiveAccounts;
        this.defaultCreditLimit = defaultCreditLimit;
    }

    @Transactional
    public TarjetaResponse crearDebito(String username, Long cuentaId) {
        Usuario user = findClientUser(username);
        Cuenta account = cuentas.findById(cuentaId)
                .orElseThrow(() -> new ResourceNotFoundException("CUENTA_NO_ENCONTRADA", "Cuenta no encontrada"));
        if (user.getCliente() == null || !account.getCliente().getId().equals(user.getCliente().getId())) {
            throw new ResourceNotFoundException("CUENTA_NO_ENCONTRADA", "Cuenta no encontrada");
        }
        if (!account.isActiva())
            throw new IllegalArgumentException("La cuenta debe estar activa");
        Tarjeta card = new Tarjeta();
        card.setNumero(generateCardNumber());
        card.setTipo(TipoTarjeta.DEBITO);
        card.setUsuario(user);
        card.setCuenta(account);
        return toResponse(tarjetas.save(card));
    }

    @Transactional
    public TarjetaResponse crearCredito(String username) {
        Usuario user = findClientUser(username);
        Cliente client = user.getCliente();
        if (client == null || activeClientRequired && !client.isActivo()) {
            throw new IllegalArgumentException("El cliente no cumple los requisitos para una tarjeta de crédito");
        }
        if (client.getFechaNacimiento() == null
                || client.getFechaNacimiento().plusYears(minimumAge).isAfter(LocalDate.now())
                || cuentas.countByCliente_IdAndActivaTrue(client.getId()) < minimumActiveAccounts) {
            throw new IllegalArgumentException("El cliente no cumple los requisitos para una tarjeta de crédito");
        }
        Tarjeta card = new Tarjeta();
        card.setNumero(generateCardNumber());
        card.setTipo(TipoTarjeta.CREDITO);
        card.setUsuario(user);
        card.setCupo(defaultCreditLimit);
        card.setCupoDisponible(defaultCreditLimit);
        return toResponse(tarjetas.save(card));
    }

    private Usuario findClientUser(String username) {
        return usuarios.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("USUARIO_NO_ENCONTRADO", "Usuario no encontrado"));
    }

    private String generateCardNumber() {
        String number;
        do {
            StringBuilder digits = new StringBuilder(15);
            for (int index = 0; index < 15; index++)
                digits.append(RANDOM.nextInt(10));
            number = digits.append(luhnDigit(digits.toString())).toString();
        } while (tarjetas.existsByNumero(number));
        return number;
    }

    private int luhnDigit(String digits) {
        int sum = 0;
        boolean doubleDigit = true;
        for (int index = digits.length() - 1; index >= 0; index--) {
            int digit = digits.charAt(index) - '0';
            if (doubleDigit && (digit *= 2) > 9)
                digit -= 9;
            sum += digit;
            doubleDigit = !doubleDigit;
        }
        return (10 - sum % 10) % 10;
    }

    private TarjetaResponse toResponse(Tarjeta card) {
        return new TarjetaResponse(card.getId(), card.getNumero().substring(12), card.getTipo(),
                card.getEstado(), card.getCuenta() == null ? null : card.getCuenta().getId(),
                card.getCupo(), card.getCupoDisponible(), card.getFechaCreacion());
    }
}