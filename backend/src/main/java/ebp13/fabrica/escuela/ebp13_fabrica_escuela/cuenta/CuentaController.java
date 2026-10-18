package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.dto.CuentaResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/cuentas")
public class CuentaController {

    private final CuentaService cuentaService;

    public CuentaController(CuentaService cuentaService) {
        this.cuentaService = cuentaService;
    }

    @PostMapping
    public ResponseEntity<CuentaResponse> crear(@Valid @RequestBody CuentaRequest request,
            Authentication authentication) {
        boolean manager = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_GESTOR"));
        CuentaResponse response = cuentaService.crear(request, authentication.getName(), manager);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<CuentaResponse>> listar(Authentication authentication) {
        boolean manager = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_GESTOR"));
        return ResponseEntity.ok(cuentaService.listar(authentication.getName(), manager));
    }

    @GetMapping("/{numero}")
    public ResponseEntity<CuentaResponse> consultarPorNumero(
            @PathVariable String numero, Authentication authentication) {
        boolean manager = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_GESTOR"));
        return ResponseEntity.ok(cuentaService.consultarPorNumero(numero, authentication.getName(), manager));
    }

    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<CuentaResponse>> listarPorCliente(
            @PathVariable Long clienteId) {
        return ResponseEntity.ok(cuentaService.listarPorCliente(clienteId));
    }
}
