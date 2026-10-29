package com.example.demo.controller;

import com.example.demo.dto.UsuarioDto;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;
    private final com.example.demo.repository.TransportistaRepository transportistaRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioController(UsuarioRepository usuarioRepository,
                             com.example.demo.repository.TransportistaRepository transportistaRepository,
                             PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.transportistaRepository = transportistaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDto>> listarUsuarios() {
        List<UsuarioDto> lista = usuarioRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id)
                .map(u -> ResponseEntity.ok(mapToDto(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody UsuarioDto dto) {
        if (dto.getEmail() == null || dto.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El correo electrónico es obligatorio."));
        }
        if (usuarioRepository.existsByEmail(dto.getEmail())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El correo ya se encuentra registrado."));
        }
        if (dto.getCodEmpleado() != null && !dto.getCodEmpleado().isBlank()
                && usuarioRepository.existsByCodEmpleado(dto.getCodEmpleado())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "El código de empleado ya está en uso."));
        }

        // Autocompletar código de empleado si no fue ingresado
        String codEmpleado = dto.getCodEmpleado();
        if (codEmpleado == null || codEmpleado.isBlank()) {
            String rolUpper = dto.getRol() != null ? dto.getRol().toUpperCase() : "CONDUCTOR";
            String prefijo = "CONDUCTOR".equals(rolUpper) ? "TRP" :
                             ("SUPERVISOR".equals(rolUpper) ? "SUP" : "ADM");
            long total = usuarioRepository.count() + 1;
            codEmpleado = String.format("%s-%03d", prefijo, total);
            while (usuarioRepository.existsByCodEmpleado(codEmpleado)) {
                total++;
                codEmpleado = String.format("%s-%03d", prefijo, total);
            }
        }

        // Autocompletar teléfono corporativo si viene vacío
        String telefono = dto.getTelefono();
        if (telefono == null || telefono.isBlank()) {
            telefono = "9" + (int)(10000000 + Math.random() * 89999999);
        }

        // Delegar id_admin_supervisor si viene explícito o asignar por jerarquía
        Long idAdminSupervisor = dto.getIdAdminSupervisor();
        if (idAdminSupervisor == null) {
            String rolUpper = dto.getRol() != null ? dto.getRol().toUpperCase() : "CONDUCTOR";
            if ("CONDUCTOR".equals(rolUpper)) {
                // Delegar al primer supervisor activo o administrador
                idAdminSupervisor = usuarioRepository.findAll().stream()
                        .filter(u -> "SUPERVISOR".equalsIgnoreCase(u.getRol()) && Boolean.TRUE.equals(u.getActivo()))
                        .map(Usuario::getIdUsuario)
                        .findFirst()
                        .orElse(1L);
            } else if ("SUPERVISOR".equals(rolUpper)) {
                // Supervisores se delegan al Administrador Principal
                idAdminSupervisor = usuarioRepository.findAll().stream()
                        .filter(u -> "ADMINISTRADOR".equalsIgnoreCase(u.getRol()) && Boolean.TRUE.equals(u.getActivo()))
                        .map(Usuario::getIdUsuario)
                        .findFirst()
                        .orElse(1L);
            } else {
                // Administradores se auto-delegan o ligan a la cuenta raíz ID 1
                idAdminSupervisor = 1L;
            }
        }

        java.time.LocalDateTime fechaCreacion = java.time.LocalDateTime.now();
        if (dto.getFechaCreacion() != null && !dto.getFechaCreacion().isBlank()) {
            try {
                String fc = dto.getFechaCreacion().trim().replace(" ", "T");
                if (fc.length() == 16) fc += ":00";
                fechaCreacion = java.time.LocalDateTime.parse(fc);
            } catch (Exception ignore) {}
        }

        Usuario usuario = Usuario.builder()
                .nombres(dto.getNombres())
                .apellidos(dto.getApellidos() != null ? dto.getApellidos() : "")
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(dto.getPassword() != null && !dto.getPassword().isBlank()
                        ? passwordEncoder.encode(dto.getPassword())
                        : passwordEncoder.encode("123456"))
                .telefono(telefono)
                .codEmpleado(codEmpleado)
                .rol(dto.getRol() != null ? dto.getRol().toUpperCase() : "CONDUCTOR")
                .idAdminSupervisor(idAdminSupervisor)
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .fechaCreacion(fechaCreacion)
                .fechaActualizacion(java.time.LocalDateTime.now())
                .build();

        Usuario guardado = usuarioRepository.save(usuario);

        // Si el usuario registrado tiene rol CONDUCTOR, registrarlo automáticamente como transportista si no existe
        if ("CONDUCTOR".equalsIgnoreCase(guardado.getRol())) {
            try {
                String dniGen = (dto.getCodEmpleado() != null && dto.getCodEmpleado().length() >= 8) 
                    ? dto.getCodEmpleado().substring(dto.getCodEmpleado().length() - 8) 
                    : String.format("%08d", (int)(10000000 + Math.random() * 89999999));
                
                if (!transportistaRepository.existsByDni(dniGen)) {
                    com.example.demo.model.Transportista t = new com.example.demo.model.Transportista(
                        null, guardado.getNombres(), guardado.getApellidos(),
                        dniGen, "Q" + dniGen, "A-IIIc", guardado.getTelefono(), true, null
                    );
                    transportistaRepository.save(t);
                }
            } catch (Exception ignore) {}
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDto(guardado));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody UsuarioDto dto) {
        return usuarioRepository.findById(id).map(usuario -> {
            if (dto.getNombres() != null) usuario.setNombres(dto.getNombres());
            if (dto.getApellidos() != null) usuario.setApellidos(dto.getApellidos());
            if (dto.getTelefono() != null) usuario.setTelefono(dto.getTelefono());
            if (dto.getRol() != null && !dto.getRol().isBlank()) {
                usuario.setRol(dto.getRol().toUpperCase());
            }
            if (dto.getCodEmpleado() != null) usuario.setCodEmpleado(dto.getCodEmpleado());
            if (dto.getIdAdminSupervisor() != null) usuario.setIdAdminSupervisor(dto.getIdAdminSupervisor());
            if (dto.getActivo() != null) usuario.setActivo(dto.getActivo());
            if (dto.getFechaCreacion() != null && !dto.getFechaCreacion().isBlank()) {
                try {
                    String fc = dto.getFechaCreacion().trim().replace(" ", "T");
                    if (fc.length() == 16) fc += ":00";
                    usuario.setFechaCreacion(java.time.LocalDateTime.parse(fc));
                } catch (Exception ignore) {}
            }
            if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
                usuario.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
            }
            usuario.setFechaActualizacion(java.time.LocalDateTime.now());

            Usuario actualizado = usuarioRepository.save(usuario);
            return ResponseEntity.ok(mapToDto(actualizado));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/usuarios/sincronizar-faltantes
     * Rellena automáticamente los campos fecha_creacion, fecha_actualizacion, telefono y delega id_admin_supervisor
     * para todas las cuentas existentes en la base de datos que se encuentren incompletas o en NULL.
     */
    @PostMapping("/sincronizar-faltantes")
    public ResponseEntity<?> sincronizarFaltantes() {
        List<Usuario> usuarios = usuarioRepository.findAll();
        Long primerAdmin = usuarios.stream()
                .filter(u -> "ADMINISTRADOR".equalsIgnoreCase(u.getRol()))
                .map(Usuario::getIdUsuario)
                .findFirst().orElse(1L);
        Long primerSupervisor = usuarios.stream()
                .filter(u -> "SUPERVISOR".equalsIgnoreCase(u.getRol()))
                .map(Usuario::getIdUsuario)
                .findFirst().orElse(primerAdmin);

        int actualizados = 0;
        java.time.LocalDateTime ahora = java.time.LocalDateTime.now();
        for (Usuario u : usuarios) {
            boolean modificado = false;
            if (u.getFechaCreacion() == null) {
                u.setFechaCreacion(ahora.minusDays(7));
                modificado = true;
            }
            if (u.getFechaActualizacion() == null) {
                u.setFechaActualizacion(ahora);
                modificado = true;
            }
            if (u.getIdAdminSupervisor() == null) {
                if ("CONDUCTOR".equalsIgnoreCase(u.getRol())) {
                    u.setIdAdminSupervisor(primerSupervisor);
                } else if ("SUPERVISOR".equalsIgnoreCase(u.getRol())) {
                    u.setIdAdminSupervisor(primerAdmin);
                } else {
                    u.setIdAdminSupervisor(primerAdmin);
                }
                modificado = true;
            }
            if (u.getTelefono() == null || u.getTelefono().isBlank()) {
                u.setTelefono("9" + (int)(10000000 + Math.random() * 89999999));
                modificado = true;
            }
            if (u.getCodEmpleado() == null || u.getCodEmpleado().isBlank()) {
                String prefijo = "CONDUCTOR".equalsIgnoreCase(u.getRol()) ? "TRP" :
                                 ("SUPERVISOR".equalsIgnoreCase(u.getRol()) ? "SUP" : "ADM");
                u.setCodEmpleado(String.format("%s-%03d", prefijo, u.getIdUsuario()));
                modificado = true;
            }
            if (modificado) {
                usuarioRepository.save(u);
                actualizados++;
            }
        }
        return ResponseEntity.ok(Map.of(
                "mensaje", "Campos faltantes rellenados y usuarios delegados correctamente.",
                "totalUsuariosActualizados", actualizados
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        if (!usuarioRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        try {
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Usuario eliminado exitosamente de la base de datos."));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No se pudo eliminar el usuario: " + ex.getMessage()));
        }
    }

    private UsuarioDto mapToDto(Usuario u) {
        String supervisorNombre = "Sin Delegar (Cuenta Raíz)";
        if (u.getIdAdminSupervisor() != null) {
            supervisorNombre = usuarioRepository.findById(u.getIdAdminSupervisor())
                    .map(s -> s.getNombres() + " " + s.getApellidos() + " [" + s.getRol() + "]")
                    .orElse("ID #" + u.getIdAdminSupervisor());
        }

        return UsuarioDto.builder()
                .idUsuario(u.getIdUsuario())
                .nombres(u.getNombres())
                .apellidos(u.getApellidos())
                .email(u.getEmail())
                .telefono(u.getTelefono())
                .codEmpleado(u.getCodEmpleado())
                .rol(u.getRol())
                .idAdminSupervisor(u.getIdAdminSupervisor())
                .supervisorNombre(supervisorNombre)
                .activo(u.getActivo())
                .fechaCreacion(u.getFechaCreacion() != null ? u.getFechaCreacion().toString() : "")
                .fechaActualizacion(u.getFechaActualizacion() != null ? u.getFechaActualizacion().toString() : "")
                .build();
    }
}
