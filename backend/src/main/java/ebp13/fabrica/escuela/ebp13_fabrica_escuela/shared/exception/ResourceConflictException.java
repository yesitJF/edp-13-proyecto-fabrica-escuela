package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception;

public class ResourceConflictException extends RuntimeException {
    private final String errorCode;

    public ResourceConflictException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}