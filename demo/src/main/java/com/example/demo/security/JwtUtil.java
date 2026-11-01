package com.example.demo.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final String secret;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret:AcerosArequipa_SistemaRutas_2026_ClaveSecretaJWT!}") String secret,
            @Value("${jwt.expiration-hours:8}") long expirationHours) {
        this.secret = secret;
        this.expirationMs = expirationHours * 60 * 60 * 1000;
    }

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Genera un token JWT con email, rol y nombre del usuario */
    public String generarToken(String email, String rol, String nombre) {
        return Jwts.builder()
                .subject(email)
                .claim("rol", rol)
                .claim("nombre", nombre)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getKey())
                .compact();
    }

    /** Extrae todos los claims del token */
    public Claims extraerClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Extrae el email (subject) del token */
    public String extraerEmail(String token) {
        return extraerClaims(token).getSubject();
    }

    /** Extrae el rol del token */
    public String extraerRol(String token) {
        return extraerClaims(token).get("rol", String.class);
    }

    /** Extrae el nombre del token */
    public String extraerNombre(String token) {
        return extraerClaims(token).get("nombre", String.class);
    }

    /** Valida que el token no haya expirado y sea correcto */
    public boolean esTokenValido(String token) {
        try {
            return !extraerClaims(token).getExpiration().before(new Date());
        } catch (Exception e) {
            return false;
        }
    }
}
