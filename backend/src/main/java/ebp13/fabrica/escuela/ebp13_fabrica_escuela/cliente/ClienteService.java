package ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteRequest;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.dto.ClienteResponse;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaDuplicadaException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.exception.CedulaInvalidaException;
import java.security.SecureRandom;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private static final String RANDOM_CHARACTERS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static final SecureRandom RANDOM = new SecureRandom();

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional
    public ClienteResponse crear(ClienteRequest request) {
        validarCedula(request.getCedula());

        if (clienteRepository.existsByCedula(request.getCedula())) {
            throw new CedulaDuplicadaException(
                    "La cédula ya está registrada"
            );
        }

        Cliente cliente = new Cliente();

        cliente.setIdCliente(generarIdCliente());
        cliente.setCedula(request.getCedula());
        cliente.setPrimerNombre(request.getPrimerNombre());
        cliente.setSegundoNombre(request.getSegundoNombre());
        cliente.setPrimerApellido(request.getPrimerApellido());
        cliente.setSegundoApellido(request.getSegundoApellido());
        cliente.setFechaNacimiento(request.getFechaNacimiento());
        cliente.setGenero(request.getGenero());
        cliente.setEmail(request.getEmail());
        cliente.setTelefono(request.getTelefono());
        cliente.setDireccion(request.getDireccion());
        cliente.setCiudad(request.getCiudad());
        cliente.setDepartamento(request.getDepartamento());
        cliente.setActivo(true);

        return toResponse(clienteRepository.save(cliente));
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void validarCedula(String cedula) {
        if (cedula == null || !cedula.matches("\\d{6,10}")) {
            throw new CedulaInvalidaException(
                    "La cédula debe contener entre 6 y 10 dígitos"
            );
        }
    }

    private String generarIdCliente() {
        String idCliente;

        do {
            idCliente = "BX-"
                    + Long.toString(System.currentTimeMillis(), 36)
                    + "-"
                    + generarSufijoAleatorio();
        } while (clienteRepository.existsByIdCliente(idCliente));

        return idCliente;
    }

    private String generarSufijoAleatorio() {
        StringBuilder sufijo = new StringBuilder(3);

        for (int i = 0; i < 3; i++) {
            sufijo.append(
                    RANDOM_CHARACTERS.charAt(
                            RANDOM.nextInt(RANDOM_CHARACTERS.length())
                    )
            );
        }

        return sufijo.toString();
    }

    private ClienteResponse toResponse(Cliente cliente) {
        ClienteResponse response = new ClienteResponse();

        response.setId(cliente.getId());
        response.setIdCliente(cliente.getIdCliente());
        response.setCedula(cliente.getCedula());
        response.setPrimerNombre(cliente.getPrimerNombre());
        response.setSegundoNombre(cliente.getSegundoNombre());
        response.setPrimerApellido(cliente.getPrimerApellido());
        response.setSegundoApellido(cliente.getSegundoApellido());
        response.setFechaNacimiento(cliente.getFechaNacimiento());
        response.setGenero(cliente.getGenero());
        response.setEmail(cliente.getEmail());
        response.setTelefono(cliente.getTelefono());
        response.setDireccion(cliente.getDireccion());
        response.setCiudad(cliente.getCiudad());
        response.setDepartamento(cliente.getDepartamento());
        response.setActivo(cliente.isActivo());

        return response;
    }
}