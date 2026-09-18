package ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteInactivoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.ClienteNoEncontradoException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.exception.CuentaNoEncontradaException;
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
    public ResponseEntity<ErrorResponse> handleNoEncontrado(RuntimeException exception) {
        return response(HttpStatus.NOT_FOUND, codigo(exception), exception.getMessage());
    }

    @ExceptionHandler(CedulaDuplicadaException.class)
    public ResponseEntity<ErrorResponse> handleDuplicada(CedulaDuplicadaException exception) {
        return response(HttpStatus.CONFLICT, "CEDULA_DUPLICADA", exception.getMessage());
    }

    @ExceptionHandler(CedulaInvalidaException.class)
    public ResponseEntity<ErrorResponse> handleCedulaInvalida(
            CedulaInvalidaException exception) {
        return response(HttpStatus.BAD_REQUEST, "CEDULA_INVALIDA", exception.getMessage());
    }

    @ExceptionHandler(ClienteInactivoException.class)
    public ResponseEntity<ErrorResponse> handleClienteInactivo(
            ClienteInactivoException exception) {
        return response(HttpStatus.BAD_REQUEST, "CLIENTE_INACTIVO", exception.getMessage());
    }

    @ExceptionHandler(CuentaInactivaException.class)
    public ResponseEntity<ErrorResponse> handleCuentaInactiva(
            CuentaInactivaException exception) {
        return response(HttpStatus.BAD_REQUEST, "CUENTA_INACTIVA", exception.getMessage());
    }

    @ExceptionHandler(SaldoInsuficienteException.class)
    public ResponseEntity<ErrorResponse> handleSaldoInsuficiente(
            SaldoInsuficienteException exception) {
        return response(HttpStatus.BAD_REQUEST, "SALDO_INSUFICIENTE", exception.getMessage());
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
            String mensaje) {
        return ResponseEntity.status(status).body(new ErrorResponse(error, mensaje));
    }

    public record ErrorResponse(String error, String mensaje) {
    }
}
