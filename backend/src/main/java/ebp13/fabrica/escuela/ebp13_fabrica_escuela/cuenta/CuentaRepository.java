package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CuentaRepository extends JpaRepository<Cuenta, Long> {

    boolean existsByNumeroCuenta(String numero);

    Optional<Cuenta> findByNumeroCuenta(String numero);
}
