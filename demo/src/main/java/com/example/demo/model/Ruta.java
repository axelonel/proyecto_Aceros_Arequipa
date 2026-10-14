package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "rutas")
@Getter
@Setter
@Builder
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "algoritmo_usado", length = 50)
    private String algoritmoUsado;

    @Column(name = "costo_estimado_soles")
    private Double costoEstimadoSoles;

    @Column(name = "distancia_total_km")
    private Double distanciaTotalKm;

    @Column(nullable = false, length = 20)
    private String estado; // PLANIFICADA, EN_EJECUCION, COMPLETADA, CANCELADA

    @Column(name = "fecha_ruta", nullable = false)
    private LocalDate fechaRuta;

    @Column(name = "tiempo_estimado_min")
    private Integer tiempoEstimadoMin;

    @Column(name = "creado_por_id")
    private Long creadoPorId;

    @Column(name = "vehiculo_id", nullable = false)
    private Long vehiculoId;

    @Column(name = "creado_en", insertable = false, updatable = false)
    private LocalDateTime creadoEn;

    public Ruta() {
    }

    public Ruta(Long id, String algoritmoUsado, Double costoEstimadoSoles, Double distanciaTotalKm,
                String estado, LocalDate fechaRuta, Integer tiempoEstimadoMin, Long creadoPorId,
                Long vehiculoId, LocalDateTime creadoEn) {
        this.id = id;
        this.algoritmoUsado = algoritmoUsado;
        this.costoEstimadoSoles = costoEstimadoSoles;
        this.distanciaTotalKm = distanciaTotalKm;
        this.estado = estado != null ? estado : "PLANIFICADA";
        this.fechaRuta = fechaRuta != null ? fechaRuta : LocalDate.now();
        this.tiempoEstimadoMin = tiempoEstimadoMin;
        this.creadoPorId = creadoPorId;
        this.vehiculoId = vehiculoId;
        this.creadoEn = creadoEn;
    }
}
