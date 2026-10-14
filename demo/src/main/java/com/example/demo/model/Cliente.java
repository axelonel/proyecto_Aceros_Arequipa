package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
@Getter
@Setter
@Builder
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_cliente")
    private Long idCliente;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(name = "tipo_documento", nullable = false, length = 4)
    private String tipoDocumento; // DNI o RUC

    @Column(name = "numero_documento", nullable = false, unique = true, length = 15)
    private String numeroDocumento;

    @Column(name = "direccion_fiscal", length = 255)
    private String direccionFiscal;

    @Column(name = "contacto_nombre", length = 150)
    private String contactoNombre;

    @Column(length = 20)
    private String telefono;

    @Column(length = 150)
    private String email;

    @Column(nullable = false)
    private Boolean activo;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion", insertable = false, updatable = false)
    private LocalDateTime fechaActualizacion;

    public Cliente() {
    }

    public Cliente(Long idCliente, String nombre, String tipoDocumento, String numeroDocumento,
                   String direccionFiscal, String contactoNombre, String telefono, String email,
                   Boolean activo, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion) {
        this.idCliente = idCliente;
        this.nombre = nombre;
        this.tipoDocumento = tipoDocumento;
        this.numeroDocumento = numeroDocumento;
        this.direccionFiscal = direccionFiscal;
        this.contactoNombre = contactoNombre;
        this.telefono = telefono;
        this.email = email;
        this.activo = activo != null ? activo : true;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
    }
}
