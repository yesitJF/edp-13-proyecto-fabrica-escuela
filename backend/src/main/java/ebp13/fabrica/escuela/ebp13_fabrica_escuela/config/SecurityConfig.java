package ebp13.fabrica.escuela.ebp13_fabrica_escuela.config;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.BearerTokenFilter;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, BearerTokenFilter bearerTokenFilter) throws Exception {
        return http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/clientes/**", "/api/usuarios/**").hasRole("GESTOR")
                        .requestMatchers("/api/tarjetas/**").hasRole("CLIENTE")
                        .requestMatchers("/api/transacciones/**").hasRole("CLIENTE")
                        .requestMatchers("/api/cuentas/**").hasAnyRole("CLIENTE", "GESTOR")
                        .requestMatchers("/api/auth/credentials").authenticated()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> writeSecurityError(response, 401,
                                "NO_AUTENTICADO", "Autenticación requerida"))
                        .accessDeniedHandler((request, response, exception) -> writeSecurityError(response, 403,
                                "ACCESO_DENEGADO", "No tiene permisos para esta operación")))
                .addFilterBefore(bearerTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    private void writeSecurityError(HttpServletResponse response, int status, String code, String message)
            throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"errorCode\":\"" + code + "\",\"message\":\"" + message
                + "\",\"details\":\"/api\",\"traceId\":\"" + UUID.randomUUID() + "\"}");
    }
}