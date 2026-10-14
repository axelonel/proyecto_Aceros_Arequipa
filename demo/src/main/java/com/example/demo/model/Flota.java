package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "flota")
@Getter
@Setter
@Builder
public class Flota {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_flota")
    private Long idFlota;

    @Column(name = "nombre_flota", nullable = false, length = 100)
    private String nombreFlota;

    @Column(length = 255)
    private String descripcion;

    @Column(nullable = false)
    private Boolean activo;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public Flota() {
    }

    public Flota(Long idFlota, String nombreFlota, String descripcion, Boolean activo, LocalDateTime fechaCreacion) {
        this.idFlota = idFlota;
        this.nombreFlota = nombreFlota;
        this.descripcion = descripcion;
        this.activo = activo != null ? activo : true;
        this.fechaCreacion = fechaCreacion;
    }
}
