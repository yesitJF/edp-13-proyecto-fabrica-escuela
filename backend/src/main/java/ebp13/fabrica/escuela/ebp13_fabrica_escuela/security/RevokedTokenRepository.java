package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {
}