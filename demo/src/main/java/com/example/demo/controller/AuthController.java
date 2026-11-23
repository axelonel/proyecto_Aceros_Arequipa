package com.example.demo.controller;

import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.JakartaEmailService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final JakartaEmailService emailService;

    // Almacén seguro en memoria para códigos de recuperación (15 minutos de validez)
    private final Map<String, RecoveryEntry> recoveryTokens = new ConcurrentHashMap<>();

    private static class RecoveryEntry {
        final String codigo;
        final String email;
        final LocalDateTime expira;

        RecoveryEntry(String codigo, String email, LocalDateTime expira) {
            this.codigo = codigo;
            this.email = email;
            this.expira = expira;
        }

        boolean estaVencido() {
            return LocalDateTime.now().isAfter(expira);
        }
    }

    public AuthController(UsuarioRepository usuarioRepository,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder,
                          JakartaEmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
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

    /**
     * POST /api/auth/recuperar-password
     * Body: { "email": "usuario@acerosarequipa.com" }
     * Genera un código de 6 dígitos con validez de 15 minutos y lo envía al correo corporativo.
     */
    @PostMapping("/recuperar-password")
    public ResponseEntity<?> solicitarRecuperacion(@RequestBody Map<String, String> body) {
        String input = body.get("email");
        if (input == null || input.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Ingresa tu correo electrónico o código de empleado."));
        }
        String cleanInput = input.trim();
        Usuario usuario = usuarioRepository.findByEmail(cleanInput.toLowerCase())
                .orElseGet(() -> usuarioRepository.findByCodEmpleado(cleanInput).orElse(null));

        if (usuario == null || !Boolean.TRUE.equals(usuario.getActivo())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "No se encontró ningún usuario activo con el correo o código ingresado."));
        }

        // Generar código de 6 dígitos numérico criptográficamente seguro
        String codigo = String.format("%06d", new java.security.SecureRandom().nextInt(1000000));
        recoveryTokens.put(usuario.getEmail().toLowerCase(),
                new RecoveryEntry(codigo, usuario.getEmail(), LocalDateTime.now().plusMinutes(15)));

        String nombreCompleto = usuario.getNombres() + " " + usuario.getApellidos();
        boolean enviado = emailService.enviarCodigoRecuperacion(usuario.getEmail(), nombreCompleto, codigo);

        if (!enviado) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No se pudo enviar el correo de verificación. Verifica la conexión del servidor o intenta más tarde."));
        }

        return ResponseEntity.ok(Map.of(
                "mensaje", "Código de recuperación enviado con éxito a tu correo corporativo.",
                "email", usuario.getEmail()
        ));
    }

    /**
     * POST /api/auth/restablecer-password
     * Body: { "email": "...", "codigo": "123456", "nuevaPassword": "..." }
     * Valida el código de verificación y actualiza la contraseña con BCrypt.
     */
    @PostMapping("/restablecer-password")
    public ResponseEntity<?> restablecerPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String codigo = body.get("codigo");
        String nuevaPassword = body.get("nuevaPassword");

        if (email == null || codigo == null || nuevaPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Todos los campos son obligatorios."));
        }

        if (nuevaPassword.trim().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña debe tener al menos 6 caracteres."));
        }

        String key = email.toLowerCase().trim();
        RecoveryEntry entry = recoveryTokens.get(key);

        if (entry == null || entry.estaVencido() || !entry.codigo.equals(codigo.trim())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "El código ingresado es incorrecto o ha expirado (15 min). Solicita un nuevo código."));
        }

        Usuario usuario = usuarioRepository.findByEmail(key).orElse(null);
        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Usuario no encontrado."));
        }

        usuario.setPasswordHash(passwordEncoder.encode(nuevaPassword.trim()));
        usuarioRepository.save(usuario);
        recoveryTokens.remove(key);

        return ResponseEntity.ok(Map.of(
                "mensaje", "¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña."
        ));
    }
}
