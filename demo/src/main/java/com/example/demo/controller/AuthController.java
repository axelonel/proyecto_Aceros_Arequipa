package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UsuarioRepository usuarioRepository,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * POST /api/auth/login
     * Body: { "email": "...", "password": "..." }
     * Respuesta: { "token": "...", "rol": "...", "nombre": "..." }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String email    = body.get("email");
        String password = body.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email y contraseña son obligatorios."));
        }

        Usuario usuario = usuarioRepository.findByEmail(email.toLowerCase().trim())
                .orElseGet(() -> usuarioRepository.findByCodEmpleado(email.trim()).orElse(null));

        if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales incorrectas o usuario inactivo."));
        }

        // Verificar contraseña (soporta BCrypt y texto plano para migración)
        boolean passwordOk;
        String hash = usuario.getPasswordHash();
        if (hash != null && hash.startsWith("$2a$")) {
            // Contraseña ya encriptada con BCrypt
            passwordOk = passwordEncoder.matches(password, hash);
        } else {
            // Contraseña en texto plano (usuarios legacy) — comparación directa
            passwordOk = password.equals(hash);
            // Aprovechar el login para encriptarla automáticamente
            if (passwordOk) {
                usuario.setPasswordHash(passwordEncoder.encode(password));
                usuarioRepository.save(usuario);
            }
        }

        if (!passwordOk) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales incorrectas."));
        }

        String nombre = usuario.getNombres() + " " + usuario.getApellidos();
        String token  = jwtUtil.generarToken(usuario.getEmail(), usuario.getRol(), nombre);

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("token", token);
        resp.put("rol", usuario.getRol());
        resp.put("nombre", nombre);
        resp.put("email", usuario.getEmail());
        resp.put("id", usuario.getIdUsuario());
        resp.put("codEmpleado", usuario.getCodEmpleado() != null ? usuario.getCodEmpleado() : "");

        return ResponseEntity.ok(resp);
    }

    /**
     * GET /api/auth/me  — devuelve info del usuario autenticado a partir del token
     */
    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token requerido."));
        }
        String token = authHeader.substring(7);
        if (!jwtUtil.esTokenValido(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Token inválido o expirado."));
        }
        return ResponseEntity.ok(Map.of(
                "email",  jwtUtil.extraerEmail(token),
                "rol",    jwtUtil.extraerRol(token),
                "nombre", jwtUtil.extraerNombre(token)
        ));
    }
}
