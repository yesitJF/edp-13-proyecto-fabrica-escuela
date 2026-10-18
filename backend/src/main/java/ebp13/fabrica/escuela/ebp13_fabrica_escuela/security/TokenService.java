package ebp13.fabrica.escuela.ebp13_fabrica_escuela.security;

import ebp13.fabrica.escuela.ebp13_fabrica_escuela.shared.exception.ResourceNotFoundException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TokenService {

    private final RevokedTokenRepository revokedTokens;
    private final byte[] secret;
    private final long expirationSeconds;

    public TokenService(RevokedTokenRepository revokedTokens,
            @Value("${app.security.token-secret}") String secret,
            @Value("${app.security.token-expiration-minutes}") long expirationMinutes) {
        this.revokedTokens = revokedTokens;
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationSeconds = expirationMinutes * 60;
        if (secret.length() < 32) {
            throw new IllegalArgumentException("TOKEN_SECRET debe tener al menos 32 caracteres");
        }
    }

    public String create(Usuario user) {
        long expiration = Instant.now().getEpochSecond() + expirationSeconds;
        String payload = user.getUsername() + "|" + user.getRole() + "|" + expiration + "|" + UUID.randomUUID();
        String encoded = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encoded + "." + sign(encoded);
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public TokenClaims validate(String token) {
        String[] parts = token.split("\\.", -1);
        if (parts.length != 2 || !constantTimeEquals(sign(parts[0]), parts[1])) {
            throw new IllegalArgumentException("Token inválido");
        }
        String[] claims = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8).split("\\|", -1);
        if (claims.length != 4 || Long.parseLong(claims[2]) <= Instant.now().getEpochSecond()
                || revokedTokens.existsById(claims[3])) {
            throw new IllegalArgumentException("Token expirado o revocado");
        }
        return new TokenClaims(claims[0], UserRole.valueOf(claims[1]), claims[3],
                Instant.ofEpochSecond(Long.parseLong(claims[2])));
    }

    @Transactional
    public void revoke(String token) {
        TokenClaims claims = validate(token);
        revokedTokens.save(new RevokedToken(claims.tokenId(), claims.expiresAt()));
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(
                    mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("No fue posible firmar el token", exception);
        }
    }

    private boolean constantTimeEquals(String first, String second) {
        return java.security.MessageDigest.isEqual(first.getBytes(StandardCharsets.UTF_8),
                second.getBytes(StandardCharsets.UTF_8));
    }

    public record TokenClaims(String username, UserRole role, String tokenId, Instant expiresAt) {
    }
}