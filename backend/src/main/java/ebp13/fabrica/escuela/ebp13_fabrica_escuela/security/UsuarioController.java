package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.CreateClientUserRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final AuthService authService;

    public UsuarioController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/clientes")
    public ResponseEntity<Void> createClientUser(@Valid @RequestBody CreateClientUserRequest request) {
        authService.provisionClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}