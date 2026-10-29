package com.example.demo.dto;

import lombok.*;

@Getter
@Setter
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
    private Long idAdminSupervisor;
    private String supervisorNombre;
    private Boolean activo;
    private String fechaCreacion;
    private String fechaActualizacion;

    public UsuarioDto() {
    }

    public UsuarioDto(Long idUsuario, String nombres, String apellidos, String email, String password,
                      String telefono, String codEmpleado, String rol, Long idAdminSupervisor,
                      String supervisorNombre, Boolean activo, String fechaCreacion, String fechaActualizacion) {
        this.idUsuario = idUsuario;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.email = email;
        this.password = password;
        this.telefono = telefono;
        this.codEmpleado = codEmpleado;
        this.rol = rol;
        this.idAdminSupervisor = idAdminSupervisor;
        this.supervisorNombre = supervisorNombre;
        this.activo = activo;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
    }
}
