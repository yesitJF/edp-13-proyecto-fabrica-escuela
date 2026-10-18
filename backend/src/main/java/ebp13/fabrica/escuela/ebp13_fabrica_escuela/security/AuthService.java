package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.ChangeCredentialsRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.CreateClientUserRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.LoginResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.MeResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception.AccountLockedException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception.AuthenticationFailedException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceConflictException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final ClienteRepository clientes;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokens;
    private final int maximumAttempts;
    private final long lockMinutes;

    public AuthService(UsuarioRepository usuarios, ClienteRepository clientes,
            PasswordEncoder passwordEncoder, TokenService tokens,
            @Value("${app.security.max-failed-attempts}") int maximumAttempts,
            @Value("${app.security.lock-minutes}") long lockMinutes) {
        this.usuarios = usuarios;
        this.clientes = clientes;
        this.passwordEncoder = passwordEncoder;
        this.tokens = tokens;
        this.maximumAttempts = maximumAttempts;
        this.lockMinutes = lockMinutes;
    }

    @Transactional(noRollbackFor = { AuthenticationFailedException.class, AccountLockedException.class })
    public LoginResponse login(String username, String password) {
        Usuario user = usuarios.findByUsernameIgnoreCase(username).orElse(null);
        if (user == null)
            throw new AuthenticationFailedException();
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            throw new AccountLockedException();
        }
        if (user.getLockedUntil() != null) {
            user.setLockedUntil(null);
            user.setFailedLoginAttempts(0);
        }
        if (!user.isActive() || !passwordEncoder.matches(password, user.getPasswordHash())) {
            int failures = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(failures);
            if (failures >= maximumAttempts) {
                user.setLockedUntil(LocalDateTime.now().plusMinutes(lockMinutes));
                throw new AccountLockedException();
            }
            throw new AuthenticationFailedException();
        }
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        return new LoginResponse(tokens.create(user), "Bearer", tokens.getExpirationSeconds(), user.getRole());
    }

    @Transactional
    public void provisionClient(CreateClientUserRequest request) {
        if (usuarios.existsByUsernameIgnoreCase(request.username())) {
            throw new ResourceConflictException("USUARIO_DUPLICADO", "El nombre de usuario ya está registrado");
        }
        validateUsername(request.username());
        Cliente client = clientes.findById(request.clienteId())
                .orElseThrow(() -> new ResourceNotFoundException("CLIENTE_NO_ENCONTRADO", "Cliente no encontrado"));
        if (!client.isActivo())
            throw new IllegalArgumentException("El cliente debe estar activo");
        Usuario user = new Usuario();
        user.setUsername(request.username().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.CLIENTE);
        user.setCliente(client);
        usuarios.save(user);
    }

    @Transactional
    public void changeCredentials(String username, ChangeCredentialsRequest request) {
        Usuario user = usuarios.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("USUARIO_NO_ENCONTRADO", "Usuario no encontrado"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new AuthenticationFailedException();
        }
        if (request.newUsername() != null && !request.newUsername().isBlank()) {
            String newUsername = request.newUsername().trim();
            validateUsername(newUsername);
            if (!newUsername.equalsIgnoreCase(user.getUsername()) && usuarios.existsByUsernameIgnoreCase(newUsername)) {
                throw new ResourceConflictException("USUARIO_DUPLICADO", "El nombre de usuario ya está registrado");
            }
            user.setUsername(newUsername);
        }
        boolean changingPassword = request.newPassword() != null && !request.newPassword().isBlank();
        if (!changingPassword) {
            if (request.newUsername() == null || request.newUsername().isBlank()) {
                throw new IllegalArgumentException("Debe indicar un nuevo usuario o contraseña");
            }
            return;
        }
        if (!request.newPassword().equals(request.confirmNewPassword())) {
            throw new IllegalArgumentException("La confirmación de contraseña no coincide");
        }
        if (!request.newPassword().matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d]).{8,}$")) {
            throw new IllegalArgumentException(
                    "La contraseña debe tener mínimo 8 caracteres, mayúscula, minúscula, número y símbolo");
        }
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional(readOnly = true)
    public MeResponse me(String username) {
        Usuario user = usuarios.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ResourceNotFoundException("USUARIO_NO_ENCONTRADO", "Usuario no encontrado"));
        Cliente client = user.getCliente();
        String clientId = client == null ? null : client.getIdCliente();
        String name = client == null ? user.getRole().name()
                : String.join(" ", java.util.stream.Stream.of(client.getPrimerNombre(), client.getSegundoNombre(),
                        client.getPrimerApellido(), client.getSegundoApellido())
                        .filter(value -> value != null && !value.isBlank()).toList());
        return new MeResponse(user.getUsername(), user.getRole(), clientId, name);
    }

    @Transactional
    public void bootstrapManager(String username, String password) {
        if (username == null || username.isBlank() || password == null || password.isBlank())
            return;
        validateUsername(username);
        if (usuarios.existsByUsernameIgnoreCase(username))
            return;
        Usuario manager = new Usuario();
        manager.setUsername(username.trim());
        manager.setPasswordHash(passwordEncoder.encode(password));
        manager.setRole(UserRole.GESTOR);
        usuarios.save(manager);
    }

    private void validateUsername(String username) {
        if (username == null || !username.matches("[A-Za-z0-9._@-]{3,80}")) {
            throw new IllegalArgumentException("El usuario debe tener entre 3 y 80 caracteres alfanuméricos");
        }
    }
}