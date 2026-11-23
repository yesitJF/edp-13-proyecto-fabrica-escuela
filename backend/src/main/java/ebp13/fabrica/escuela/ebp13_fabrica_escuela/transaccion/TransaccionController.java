package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.ConsignacionRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.RetiroRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransferenciaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionHistorialResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;

@RestController
@RequestMapping("/api/transacciones")
public class TransaccionController {

    private final TransaccionService transaccionService;
    private final TransaccionQueryService transaccionQueryService;

    public TransaccionController(TransaccionService transaccionService,
            TransaccionQueryService transaccionQueryService) {
        this.transaccionService = transaccionService;
        this.transaccionQueryService = transaccionQueryService;
    }

    @PostMapping("/transferencia")
    public ResponseEntity<TransaccionResponse> transferir(
            @Valid @RequestBody TransferenciaRequest request,
            @AuthenticationPrincipal String username) {
        TransaccionResponse response = transaccionService.transferir(
                request.getCuentaOrigen(),
                request.getCuentaDestino(),
                request.getMonto(),
                request.getConcepto(), username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/retiro")
    public ResponseEntity<TransaccionResponse> retirar(
            @Valid @RequestBody RetiroRequest request,
            @AuthenticationPrincipal String username) {
        TransaccionResponse response = transaccionService.retirar(
                request.getNumeroCuenta(),
                request.getMonto(), username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/consignacion")
    public ResponseEntity<TransaccionResponse> consignar(
            @Valid @RequestBody ConsignacionRequest request,
            @AuthenticationPrincipal String username) {
        TransaccionResponse response = transaccionService.consignar(
                request.getCuentaDestino(),
                request.getMonto(),
                request.getRemitente(), username);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/cuentas/{accountNumber}/historial")
    public ResponseEntity<List<TransaccionHistorialResponse>> historial(
            @AuthenticationPrincipal String username,
            @PathVariable String accountNumber,
            @RequestParam(required = false) String desde,
            @RequestParam(required = false) String hasta) {
        return ResponseEntity.ok(transaccionQueryService.history(username, accountNumber,
                parseDateTime(desde, false), parseDateTime(hasta, true)));
    }

    private LocalDateTime parseDateTime(String value, boolean endOfDay) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            if (value.length() == 10) {
                LocalDate date = LocalDate.parse(value);
                return endOfDay ? date.atTime(LocalTime.MAX) : date.atStartOfDay();
            }
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException exception) {
            throw new IllegalArgumentException(
                    "Las fechas deben usar formato ISO (yyyy-MM-dd o yyyy-MM-dd'T'HH:mm:ss)");
        }
    }

    @GetMapping("/{identifier}")
    public ResponseEntity<TransaccionHistorialResponse> detalle(
            @AuthenticationPrincipal String username,
            @PathVariable String identifier,
            @RequestParam(required = false) String cuenta) {
        return ResponseEntity.ok(transaccionQueryService.detail(username, identifier, cuenta));
    }
}
