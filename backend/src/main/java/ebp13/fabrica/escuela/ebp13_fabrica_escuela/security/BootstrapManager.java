package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BootstrapManager {

    @Bean
    ApplicationRunner initializeManager(AuthService authService,
            @Value("${app.security.bootstrap-manager-username}") String username,
            @Value("${app.security.bootstrap-manager-password}") String password) {
        return args -> authService.bootstrapManager(username, password);
    }
}