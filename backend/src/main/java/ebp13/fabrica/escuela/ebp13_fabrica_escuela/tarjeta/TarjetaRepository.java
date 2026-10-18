package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TarjetaRepository extends JpaRepository<Tarjeta, Long> {
    boolean existsByNumero(String numero);
}