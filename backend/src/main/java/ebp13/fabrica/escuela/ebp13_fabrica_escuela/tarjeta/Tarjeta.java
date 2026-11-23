package ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "tarjetas")
public class Tarjeta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 16)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoTarjeta tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private EstadoTarjeta estado = EstadoTarjeta.ACTIVA;

    @ManyToOne(optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "cuenta_id")
    private Cuenta cuenta;

    @Column(precision = 19, scale = 2)
    private BigDecimal cupo;

    @Column(precision = 19, scale = 2)
    private BigDecimal cupoDisponible;

    @Column(nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public Long getId() {
        return id;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public TipoTarjeta getTipo() {
        return tipo;
    }

    public void setTipo(TipoTarjeta tipo) {
        this.tipo = tipo;
    }

    public EstadoTarjeta getEstado() {
        return estado;
    }

    public void setEstado(EstadoTarjeta estado) {
        this.estado = estado;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Cuenta getCuenta() {
        return cuenta;
    }

    public void setCuenta(Cuenta cuenta) {
        this.cuenta = cuenta;
    }

    public BigDecimal getCupo() {
        return cupo;
    }

    public void setCupo(BigDecimal cupo) {
        this.cupo = cupo;
    }

    public BigDecimal getCupoDisponible() {
        return cupoDisponible;
    }

    public void setCupoDisponible(BigDecimal cupoDisponible) {
        this.cupoDisponible = cupoDisponible;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}