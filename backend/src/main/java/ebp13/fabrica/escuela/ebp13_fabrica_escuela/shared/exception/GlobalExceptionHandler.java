package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception.AccountLockedException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.exception.AuthenticationFailedException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceConflictException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.UUID;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            ClienteNoEncontradoException.class,
            CuentaNoEncontradaException.class
    })
    public ResponseEntity<ErrorResponse> handleNoEncontrado(
            RuntimeException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, codigo(exception), exception.getMessage(), request);
    }

    @ExceptionHandler(CedulaDuplicadaException.class)
    public ResponseEntity<ErrorResponse> handleDuplicada(
            CedulaDuplicadaException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, "CEDULA_DUPLICADA", exception.getMessage(), request);
    }

    @ExceptionHandler(CedulaInvalidaException.class)
    public ResponseEntity<ErrorResponse> handleCedulaInvalida(
            CedulaInvalidaException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "CEDULA_INVALIDA", exception.getMessage(), request);
    }

    @ExceptionHandler(ClienteInactivoException.class)
    public ResponseEntity<ErrorResponse> handleClienteInactivo(
            ClienteInactivoException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "CLIENTE_INACTIVO", exception.getMessage(), request);
    }

    @ExceptionHandler(CuentaInactivaException.class)
    public ResponseEntity<ErrorResponse> handleCuentaInactiva(
            CuentaInactivaException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "CUENTA_INACTIVA", exception.getMessage(), request);
    }

    @ExceptionHandler(SaldoInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handleSaldoInsuficiente(
            SaldoInsuficienteException exception, HttpServletRequest request) {
        return response(HttpStatus.BAD_REQUEST, "SALDO_INSUFICIENTE", exception.getMessage(), request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException exception, HttpServletRequest request) {
        return response(HttpStatus.NOT_FOUND, exception.getErrorCode(), exception.getMessage(), request);
    }

    @ExceptionHandler(ResourceConflictException.class)
    public ResponseEntity<ErrorResponse> handleResourceConflict(
            ResourceConflictException exception, HttpServletRequest request) {
        return response(HttpStatus.CONFLICT, exception.getErrorCode(), exception.getMessage(), request);
    }

    @ExceptionHandler(AuthenticationFailedException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationFailed(
            AuthenticationFailedException exception, HttpServletRequest request) {
        return response(HttpStatus.UNAUTHORIZED, "CREDENCIALES_INVALIDAS", exception.getMessage(), request);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(
            AccountLockedException exception, HttpServletRequest request) {
        return response(HttpStatus.LOCKED, "USUARIO_BLOQUEADO", exception.getMessage(), request);
    }

    @ExceptionHandler({ IllegalArgumentException.class, ConstraintViolationException.class,
            MethodArgumentNotValidException.class, HttpMessageNotReadableException.class })
    public ResponseEntity<ErrorResponse> handleBadRequest(
            Exception exception, HttpServletRequest request) {
        String message = exception instanceof MethodArgumentNotValidException validation
                ? validation.getBindingResult().getFieldErrors().stream()
                        .map(error -> error.getDefaultMessage())
                        .findFirst().orElse("Solicitud inválida")
                : exception instanceof IllegalArgumentException
                        ? exception.getMessage()
                        : "Solicitud inválida";
        return response(HttpStatus.BAD_REQUEST, "SOLICITUD_INVALIDA", message, request);
    }

    private String codigo(RuntimeException exception) {
        if (exception instanceof ClienteNoEncontradoException) {
            return "CLIENTE_NO_ENCONTRADO";
        }
        return "CUENTA_NO_ENCONTRADA";
    }

    private ResponseEntity<ErrorResponse> response(
            HttpStatus status,
            String error,
            String message,
            HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ErrorResponse(
                error, message, request.getRequestURI(), UUID.randomUUID().toString()));
    }

    public record ErrorResponse(String errorCode, String message, String details, String traceId) {
    }
}
