package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "asignaciones_conduccion")
@Getter
@Setter
@Builder
public class AsignacionConduccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_asignacion")
    private Long idAsignacion;

    @Column(name = "id_vehiculo", nullable = false)
    private Long idVehiculo;

    @Column(name = "id_transportista", nullable = false)
    private Long idTransportista;

    @Column(name = "id_pedido")
    private Long idPedido;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(nullable = false, length = 15)
    private String estado; // ACTIVA, EN_TRANSITO, FINALIZADA, CANCELADA

    public AsignacionConduccion() {
    }

    public AsignacionConduccion(Long idAsignacion, Long idVehiculo, Long idTransportista, Long idPedido,
                                LocalDateTime fechaInicio, LocalDateTime fechaFin, String estado) {
        this.idAsignacion = idAsignacion;
        this.idVehiculo = idVehiculo;
        this.idTransportista = idTransportista;
        this.idPedido = idPedido;
        this.fechaInicio = fechaInicio != null ? fechaInicio : LocalDateTime.now();
        this.fechaFin = fechaFin;
        this.estado = estado != null ? estado : "ACTIVA";
    }

    // Sobrecarga para compatibilidad previa
    public AsignacionConduccion(Long idAsignacion, Long idVehiculo, Long idTransportista,
                                LocalDateTime fechaInicio, LocalDateTime fechaFin, String estado) {
        this(idAsignacion, idVehiculo, idTransportista, null, fechaInicio, fechaFin, estado);
    }
}
