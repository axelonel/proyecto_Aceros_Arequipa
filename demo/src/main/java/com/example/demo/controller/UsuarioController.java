package com.example.demo.controller;

import com.example.demo.dto.UsuarioDto;
import com.example.demo.model.Usuario;
import com.example.demo.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    private final UsuarioRepository usuarioRepository;

    public UsuarioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
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

        Usuario usuario = Usuario.builder()
                .nombres(dto.getNombres())
                .apellidos(dto.getApellidos() != null ? dto.getApellidos() : "")
                .email(dto.getEmail().toLowerCase().trim())
                .passwordHash(dto.getPassword() != null && !dto.getPassword().isBlank() ? dto.getPassword() : "123456")
                .telefono(dto.getTelefono())
                .codEmpleado(dto.getCodEmpleado())
                .rol(dto.getRol() != null ? dto.getRol().toUpperCase() : "CONDUCTOR")
                .activo(dto.getActivo() != null ? dto.getActivo() : true)
                .build();

        Usuario guardado = usuarioRepository.save(usuario);
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
            if (dto.getActivo() != null) usuario.setActivo(dto.getActivo());
            if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
                usuario.setPasswordHash(dto.getPassword());
            }

            Usuario actualizado = usuarioRepository.save(usuario);
            return ResponseEntity.ok(mapToDto(actualizado));
        }).orElse(ResponseEntity.notFound().build());
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
        return UsuarioDto.builder()
                .idUsuario(u.getIdUsuario())
                .nombres(u.getNombres())
                .apellidos(u.getApellidos())
                .email(u.getEmail())
                .telefono(u.getTelefono())
                .codEmpleado(u.getCodEmpleado())
                .rol(u.getRol())
                .activo(u.getActivo())
                .fechaCreacion(u.getFechaCreacion() != null ? u.getFechaCreacion().toString() : "")
                .build();
    }
}
