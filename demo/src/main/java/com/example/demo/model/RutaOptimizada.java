package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "rutas_optimizadas")
@Getter
@Setter
@Builder
public class RutaOptimizada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ruta")
    private Long idRuta;

    @Column(name = "id_pedido", nullable = false)
    private Long idPedido;

    @Column(name = "id_vehiculo")
    private Long idVehiculo;

    @Column(name = "id_transportista")
    private Long idTransportista;

    @Column(nullable = false, length = 255)
    private String origen;

    @Column(nullable = false, length = 255)
    private String destino;

    @Column(name = "secuencia_paradas", columnDefinition = "TEXT")
    private String secuenciaParadas;

    @Column(name = "distancia_km", precision = 8, scale = 2)
    private BigDecimal distanciaKm;

    @Column(name = "tiempo_estimado_min", precision = 8, scale = 2)
    private BigDecimal tiempoEstimadoMin;

    @Column(name = "costo_operativo", precision = 10, scale = 2)
    private BigDecimal costoOperativo;

    @Column(name = "algoritmo_utilizado", length = 50)
    private String algoritmoUtilizado;

    @Column(precision = 5, scale = 2)
    private BigDecimal puntaje;

    @Column(name = "estado_ruta", nullable = false, length = 20)
    private String estadoRuta; // OPTIMA, ALTERNATIVA, NO_RECOMENDADA

    @Column(name = "fecha_calculo", insertable = false, updatable = false)
    private LocalDateTime fechaCalculo;

    public RutaOptimizada() {
    }

    public RutaOptimizada(Long idRuta, Long idPedido, Long idVehiculo, Long idTransportista,
                          String origen, String destino, String secuenciaParadas, BigDecimal distanciaKm,
                          BigDecimal tiempoEstimadoMin, BigDecimal costoOperativo, String algoritmoUtilizado,
                          BigDecimal puntaje, String estadoRuta, LocalDateTime fechaCalculo) {
        this.idRuta = idRuta;
        this.idPedido = idPedido;
        this.idVehiculo = idVehiculo;
        this.idTransportista = idTransportista;
        this.origen = origen;
        this.destino = destino;
        this.secuenciaParadas = secuenciaParadas;
        this.distanciaKm = distanciaKm;
        this.tiempoEstimadoMin = tiempoEstimadoMin;
        this.costoOperativo = costoOperativo;
        this.algoritmoUtilizado = algoritmoUtilizado;
        this.puntaje = puntaje;
        this.estadoRuta = estadoRuta != null ? estadoRuta : "OPTIMA";
        this.fechaCalculo = fechaCalculo;
    }
}
