package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TransaccionRepository extends JpaRepository<Transaccion, Long> {

    boolean existsByReferencia(String referencia);

    Optional<Transaccion> findByReferencia(String referencia);

    List<Transaccion> findByCuentaOrigenInOrCuentaDestinoInOrderByFechaDesc(
            List<String> cuentaOrigen, List<String> cuentaDestino);
}
