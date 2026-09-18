package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.ConsignacionRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.RetiroRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransferenciaRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transacciones")
public class TransaccionController {

    private final TransaccionService transaccionService;

    public TransaccionController(TransaccionService transaccionService) {
        this.transaccionService = transaccionService;
    }

    @PostMapping("/transferencia")
    public ResponseEntity<TransaccionResponse> transferir(
            @RequestBody TransferenciaRequest request) {
        TransaccionResponse response = transaccionService.transferir(
                request.getCuentaOrigen(),
                request.getCuentaDestino(),
                request.getMonto(),
                request.getConcepto());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/retiro")
    public ResponseEntity<TransaccionResponse> retirar(
            @RequestBody RetiroRequest request) {
        TransaccionResponse response = transaccionService.retirar(
                request.getNumeroCuenta(),
                request.getMonto());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/consignacion")
    public ResponseEntity<TransaccionResponse> consignar(
            @RequestBody ConsignacionRequest request) {
        TransaccionResponse response = transaccionService.consignar(
                request.getCuentaDestino(),
                request.getMonto(),
                request.getRemitente());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
