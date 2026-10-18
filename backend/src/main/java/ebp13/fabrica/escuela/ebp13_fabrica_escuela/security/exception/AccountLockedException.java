package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception;

public class AccountLockedException extends RuntimeException {
    public AccountLockedException() {
        super("Usuario bloqueado temporalmente por intentos fallidos");
    }
}