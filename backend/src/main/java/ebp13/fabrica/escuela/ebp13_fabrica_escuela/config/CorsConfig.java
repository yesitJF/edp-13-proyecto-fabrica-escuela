package ebp13.fabrica.escuela.ebp13_fabrica_escuela.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:8443",
                        "http://localhost:4173",
                        "https://proyecto-fabrica-escuela-yesitjf.vercel.app",
                        "https://proyecto-fabrica-escuela-yesitjf-jiiu08ni-yesitjf.vercel.app"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
