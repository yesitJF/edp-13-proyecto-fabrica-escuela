package ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.Cliente;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cliente.ClienteRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.Cuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.CuentaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.cuenta.TipoCuenta;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.TokenService;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UserRole;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.Usuario;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.security.UsuarioRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.tarjeta.TarjetaRepository;
import ebp13.fabrica.escuela.ebp13_fabrica_escuela.transaccion.dto.TransaccionHistorialResponse;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TransaccionQueryServiceTest {

    private static final AtomicLong SEQUENCE = new AtomicLong(1);

    @Autowired
    private TransaccionQueryService queryService;

    @Autowired
    private TransaccionRepository transacciones;

    @Autowired
    private CuentaRepository cuentas;

    @Autowired
    private ClienteRepository clientes;

    @Autowired
    private UsuarioRepository usuarios;

    @Autowired
    private TarjetaRepository tarjetas;

    @Autowired
    private TokenService tokenService;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void cleanDatabase() {
        transacciones.deleteAll();
        tarjetas.deleteAll();
        cuentas.deleteAll();
        usuarios.deleteAll();
        clientes.deleteAll();
    }

    @Test
    void consignacionIsReceivedByDestinationAccount() {
        TestClient owner = createClient("consignacion");
        Cuenta account = createAccount(owner, "301-000-0001-01");
        saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO", account.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 10, 0));

        TransaccionHistorialResponse result = history(owner.username(), account).getFirst();

        assertEquals(TipoTransaccion.CONSIGNACION, result.tipo());
        assertEquals("recibida", result.direccion());
    }

    @Test
    void withdrawalIsSentFromSourceAccount() {
        TestClient owner = createClient("retiro");
        Cuenta account = createAccount(owner, "301-000-0002-02");
        saveTransaction(TipoTransaccion.RETIRO, account.getNumeroCuenta(), "EFECTIVO",
                LocalDateTime.of(2026, 10, 1, 11, 0));

        TransaccionHistorialResponse result = history(owner.username(), account).getFirst();

        assertEquals(TipoTransaccion.RETIRO, result.tipo());
        assertEquals("enviada", result.direccion());
    }

    @Test
    void transferIsSentWhenViewedFromSourceAccount() {
        TestClient sourceOwner = createClient("transfer-source");
        TestClient destinationOwner = createClient("transfer-destination");
        Cuenta source = createAccount(sourceOwner, "301-000-0003-03");
        Cuenta destination = createAccount(destinationOwner, "301-000-0004-04");
        saveTransaction(TipoTransaccion.TRANSFERENCIA, source.getNumeroCuenta(), destination.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 12, 0));

        TransaccionHistorialResponse result = history(sourceOwner.username(), source).getFirst();

        assertEquals(TipoTransaccion.TRANSFERENCIA, result.tipo());
        assertEquals("enviada", result.direccion());
    }

    @Test
    void transferIsReceivedWhenViewedFromDestinationAccount() {
        TestClient sourceOwner = createClient("transfer-source-received");
        TestClient destinationOwner = createClient("transfer-destination-received");
        Cuenta source = createAccount(sourceOwner, "301-000-0005-05");
        Cuenta destination = createAccount(destinationOwner, "301-000-0006-06");
        saveTransaction(TipoTransaccion.TRANSFERENCIA, source.getNumeroCuenta(), destination.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 13, 0));

        TransaccionHistorialResponse result = history(destinationOwner.username(), destination).getFirst();

        assertEquals(TipoTransaccion.TRANSFERENCIA, result.tipo());
        assertEquals("recibida", result.direccion());
    }

    @Test
    void sameCustomerTransferIsSentFromItsSourceAccount() {
        TestClient owner = createClient("same-customer-source");
        Cuenta source = createAccount(owner, "301-000-0007-07");
        Cuenta destination = createAccount(owner, "501-000-0008-08");
        saveTransaction(TipoTransaccion.TRANSFERENCIA, source.getNumeroCuenta(), destination.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 14, 0));

        assertEquals("enviada", history(owner.username(), source).getFirst().direccion());
    }

    @Test
    void sameCustomerTransferIsReceivedFromItsDestinationAccount() {
        TestClient owner = createClient("same-customer-destination");
        Cuenta source = createAccount(owner, "301-000-0009-09");
        Cuenta destination = createAccount(owner, "501-000-0010-10");
        saveTransaction(TipoTransaccion.TRANSFERENCIA, source.getNumeroCuenta(), destination.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 15, 0));

        assertEquals("recibida", history(owner.username(), destination).getFirst().direccion());
    }

    @Test
    void rejectsAnotherCustomersAccount() {
        TestClient authenticated = createClient("foreign-account-user");
        TestClient other = createClient("foreign-account-owner");
        Cuenta foreignAccount = createAccount(other, "301-000-0011-11");

        assertThrows(ResourceNotFoundException.class,
                () -> history(authenticated.username(), foreignAccount));
    }

    @Test
    void nullAccountSidesAreSafeAndStillDetermineDirection() {
        TestClient owner = createClient("null-account-sides");
        Cuenta account = createAccount(owner, "301-000-0015-15");
        saveTransaction(TipoTransaccion.CONSIGNACION, null, account.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 9, 0));
        saveTransaction(TipoTransaccion.RETIRO, account.getNumeroCuenta(), null,
                LocalDateTime.of(2026, 10, 1, 10, 0));

        List<TransaccionHistorialResponse> results = history(owner.username(), account);

        assertEquals(2, results.size());
        assertEquals("enviada", results.get(0).direccion());
        assertEquals("recibida", results.get(1).direccion());
    }

    @Test
    void detailDirectionCanBeRelativeToAnExplicitOwnedAccountAndIncludesDescription() throws Exception {
        TestClient owner = createClient("detail-account-direction");
        Cuenta source = createAccount(owner, "301-000-0016-16");
        Cuenta destination = createAccount(owner, "501-000-0017-17");
        Transaccion transfer = saveTransaction(TipoTransaccion.TRANSFERENCIA,
                source.getNumeroCuenta(), destination.getNumeroCuenta(), LocalDateTime.of(2026, 10, 1, 12, 0));
        transfer.setDescripcion("Traslado entre mis cuentas");
        transacciones.saveAndFlush(transfer);
        Usuario user = usuarios.findByUsernameIgnoreCase(owner.username()).orElseThrow();

        mockMvc.perform(get("/api/transacciones/{identifier}", transfer.getReferencia())
                .header("Authorization", "Bearer " + tokenService.create(user))
                .param("cuenta", destination.getNumeroCuenta()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.direccion").value("recibida"))
                .andExpect(jsonPath("$.tipo").value("TRANSFERENCIA"))
                .andExpect(jsonPath("$.descripcion").value("Traslado entre mis cuentas"));
    }

    @Test
    void dateOnlyUntilIncludesTransactionsThroughEndOfThatDay() throws Exception {
        TestClient owner = createClient("date-only-until");
        Cuenta account = createAccount(owner, "301-000-0012-12");
        Transaccion lastMoment = saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO",
                account.getNumeroCuenta(), LocalDate.of(2026, 10, 15).atTime(23, 59, 59));
        saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO", account.getNumeroCuenta(),
                LocalDate.of(2026, 10, 16).atStartOfDay());
        Usuario user = usuarios.findByUsernameIgnoreCase(owner.username()).orElseThrow();

        List<TransaccionHistorialResponse> results = queryService.history(user.getUsername(),
                account.getNumeroCuenta(), null, LocalDate.of(2026, 10, 15).atTime(23, 59, 59, 999_999_999));

        assertEquals(1, results.size());
        assertEquals(lastMoment.getReferencia(), results.getFirst().referencia());
        mockMvc.perform(get("/api/transacciones/cuentas/{accountNumber}/historial", account.getNumeroCuenta())
                .header("Authorization", "Bearer " + tokenService.create(user))
                .param("hasta", "2026-10-15"))
                .andExpect(status().isOk());
    }

    @Test
    void fromAfterUntilReturnsBadRequest() throws Exception {
        TestClient owner = createClient("invalid-range");
        Cuenta account = createAccount(owner, "301-000-0013-13");
        Usuario user = usuarios.findByUsernameIgnoreCase(owner.username()).orElseThrow();

        mockMvc.perform(get("/api/transacciones/cuentas/{accountNumber}/historial", account.getNumeroCuenta())
                .header("Authorization", "Bearer " + tokenService.create(user))
                .param("desde", "2026-10-16T00:00:00")
                .param("hasta", "2026-10-15T23:59:59"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void resultsAreOrderedNewestFirst() {
        TestClient owner = createClient("descending-history");
        Cuenta account = createAccount(owner, "301-000-0014-14");
        saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO", account.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 1, 8, 0));
        saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO", account.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 2, 8, 0));
        saveTransaction(TipoTransaccion.CONSIGNACION, "EXTERNO", account.getNumeroCuenta(),
                LocalDateTime.of(2026, 10, 3, 8, 0));

        List<TransaccionHistorialResponse> results = history(owner.username(), account);

        assertEquals(3, results.size());
        assertEquals(LocalDateTime.of(2026, 10, 3, 8, 0), results.get(0).fecha());
        assertEquals(LocalDateTime.of(2026, 10, 2, 8, 0), results.get(1).fecha());
        assertEquals(LocalDateTime.of(2026, 10, 1, 8, 0), results.get(2).fecha());
    }

    private List<TransaccionHistorialResponse> history(String username, Cuenta account) {
        return queryService.history(username, account.getNumeroCuenta(), null, null);
    }

    private TestClient createClient(String suffix) {
        long sequence = SEQUENCE.getAndIncrement();
        Cliente client = new Cliente();
        client.setIdCliente("TEST-CLIENT-" + sequence);
        client.setCedula(String.format("%010d", sequence));
        client.setPrimerNombre("Test");
        client.setPrimerApellido(suffix);
        client.setFechaNacimiento(LocalDate.of(1990, 1, 1));
        client = clientes.saveAndFlush(client);

        Usuario user = new Usuario();
        user.setUsername("test-user-" + sequence);
        user.setPasswordHash("not-used-by-these-tests");
        user.setRole(UserRole.CLIENTE);
        user.setCliente(client);
        user = usuarios.saveAndFlush(user);
        return new TestClient(user.getUsername(), client);
    }

    private Cuenta createAccount(TestClient owner, String number) {
        Cuenta account = new Cuenta();
        account.setNumeroCuenta(number);
        account.setTipo(number.startsWith("501") ? TipoCuenta.CORRIENTE : TipoCuenta.AHORROS);
        account.setSaldo(BigDecimal.ZERO);
        account.setActiva(true);
        account.setCliente(owner.cliente());
        return cuentas.saveAndFlush(account);
    }

    private Transaccion saveTransaction(TipoTransaccion type, String source, String destination,
            LocalDateTime date) {
        Transaccion transaction = new Transaccion();
        transaction.setReferencia("REF-TEST-" + SEQUENCE.getAndIncrement());
        transaction.setTipo(type);
        transaction.setMonto(new BigDecimal("1000.00"));
        transaction.setCuentaOrigen(source);
        transaction.setCuentaDestino(destination);
        transaction.setFecha(date);
        transaction.setDescripcion("Transacción de prueba");
        return transacciones.saveAndFlush(transaction);
    }

    private record TestClient(String username, Cliente cliente) {
    }
}