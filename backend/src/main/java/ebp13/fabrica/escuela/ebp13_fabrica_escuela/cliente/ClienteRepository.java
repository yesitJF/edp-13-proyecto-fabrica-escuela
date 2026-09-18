package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    boolean existsByCedula(String cedula);

    boolean existsByIdCliente(String idCliente);

    Optional<Cliente> findByCedula(String cedula);
}
