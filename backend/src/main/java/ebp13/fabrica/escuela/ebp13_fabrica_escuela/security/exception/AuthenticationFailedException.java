package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception;

public class AuthenticationFailedException extends RuntimeException {
    public AuthenticationFailedException() {
        super("Usuario o contraseña incorrectos");
    }
}