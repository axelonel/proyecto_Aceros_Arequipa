package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "transportistas")
@Getter
@Setter
@Builder
public class Transportista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_transportista")
    private Long idTransportista;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, unique = true, length = 8)
    private String dni;

    @Column(name = "licencia_conducir", nullable = false, unique = true, length = 20)
    private String licenciaConducir;

    @Column(name = "categoria_licencia", length = 10)
    private String categoriaLicencia; // A-IIb, A-IIIa, A-IIIc

    @Column(length = 20)
    private String telefono;

    @Column(nullable = false)
    private Boolean activo;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public Transportista() {
    }

    public Transportista(Long idTransportista, String nombres, String apellidos, String dni,
                         String licenciaConducir, String categoriaLicencia, String telefono,
                         Boolean activo, LocalDateTime fechaCreacion) {
        this.idTransportista = idTransportista;
        this.nombres = nombres;
        this.apellidos = apellidos;
        this.dni = dni;
        this.licenciaConducir = licenciaConducir;
        this.categoriaLicencia = categoriaLicencia;
        this.telefono = telefono;
        this.activo = activo != null ? activo : true;
        this.fechaCreacion = fechaCreacion;
    }
}
