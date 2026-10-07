package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDto {
    private Long idUsuario;
    private String nombres;
    private String apellidos;
    private String email;
    private String password;
    private String telefono;
    private String codEmpleado;
    private String rol;
    private Boolean activo;
    private String fechaCreacion;
}
