package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.ChangeCredentialsRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.LoginRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.LoginResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.dto.MeResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TokenService tokenService;

    public AuthController(AuthService authService, TokenService tokenService) {
        this.authService = authService;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.username(), request.password());
    }

    @GetMapping("/me")
    public MeResponse me(Authentication authentication) {
        return authService.me(authentication.getName());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authorization) {
        tokenService.revoke(authorization.substring("Bearer ".length()));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/credentials")
    public ResponseEntity<Void> changeCredentials(Authentication authentication,
            @Valid @RequestBody ChangeCredentialsRequest request) {
        authService.changeCredentials(authentication.getName(), request);
        return ResponseEntity.noContent().build();
    }
}