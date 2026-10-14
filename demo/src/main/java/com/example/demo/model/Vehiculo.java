package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehiculos")
@Getter
@Setter
@Builder
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_vehiculo")
    private Long idVehiculo;

    @Column(name = "id_flota")
    private Long idFlota;

    @Column(nullable = false, unique = true, length = 10)
    private String placa;

    @Column(name = "tipo_camion", length = 50)
    private String tipoCamion;

    @Column(name = "capacidad_max_ton", nullable = false, precision = 6, scale = 2)
    private BigDecimal capacidadMaxTon;

    @Column(name = "volumen_max_m3", precision = 6, scale = 2)
    private BigDecimal volumenMaxM3;

    @Column(name = "estado_operativo", nullable = false, length = 20)
    private String estadoOperativo; // DISPONIBLE, EN_RUTA, MANTENIMIENTO, INACTIVO

    @Column(length = 100)
    private String modelo; // Marca y modelo (ej. Volvo FH 540, Scania R500)

    @Column(name = "peso_max_eje_toneladas")
    private Double pesoMaxEjeToneladas;

    @Column(name = "conductor_id")
    private Long conductorId;

    @Column(name = "fecha_creacion", insertable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    public Vehiculo() {
    }

    public Vehiculo(Long idVehiculo, Long idFlota, String placa, String tipoCamion, BigDecimal capacidadMaxTon,
                    BigDecimal volumenMaxM3, String estadoOperativo, String modelo, Double pesoMaxEjeToneladas,
                    Long conductorId, LocalDateTime fechaCreacion) {
        this.idVehiculo = idVehiculo;
        this.idFlota = idFlota;
        this.placa = placa;
        this.tipoCamion = tipoCamion;
        this.capacidadMaxTon = capacidadMaxTon;
        this.volumenMaxM3 = volumenMaxM3;
        this.estadoOperativo = estadoOperativo != null ? estadoOperativo : "DISPONIBLE";
        this.modelo = modelo;
        this.pesoMaxEjeToneladas = pesoMaxEjeToneladas;
        this.conductorId = conductorId;
        this.fechaCreacion = fechaCreacion;
    }
}
