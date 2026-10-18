package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.dto.CrearTarjetaDebitoRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.dto.TarjetaResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tarjetas")
public class TarjetaController {

    private final TarjetaService tarjetaService;

    public TarjetaController(TarjetaService tarjetaService) {
        this.tarjetaService = tarjetaService;
    }

    @PostMapping("/debito")
    public ResponseEntity<TarjetaResponse> crearDebito(@AuthenticationPrincipal String username,
            @Valid @RequestBody CrearTarjetaDebitoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(tarjetaService.crearDebito(username, request.cuentaId()));
    }

    @PostMapping("/credito")
    public ResponseEntity<TarjetaResponse> crearCredito(@AuthenticationPrincipal String username) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tarjetaService.crearCredito(username));
    }
}