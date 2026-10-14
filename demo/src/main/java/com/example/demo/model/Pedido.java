package com.example.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pedidos")
@Getter
@Setter
@Builder
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_pedido")
    private Long idPedido;

    @Column(name = "id_cliente", nullable = false)
    private Long idCliente;

    @Column(name = "id_usuario_gestor", nullable = false)
    private Long idUsuarioGestor;

    @Column(name = "tipo_material", nullable = false, length = 100)
    private String tipoMaterial;

    @Column(name = "peso_t", nullable = false, precision = 6, scale = 2)
    private BigDecimal pesoT;

    @Column(name = "volumen_m3", precision = 6, scale = 2)
    private BigDecimal volumenM3;

    @Column(name = "direccion_destino", nullable = false, length = 255)
    private String direccionDestino;

    @Column(nullable = false, length = 10)
    private String prioridad; // ALTA, MEDIA, BAJA

    @Column(name = "objetivo_optimizacion", nullable = false, length = 20)
    private String objetivoOptimizacion; // EQUILIBRIO, MENOR_TIEMPO, MENOR_COSTO

    @Column(name = "evitar_trafico_pesado", nullable = false)
    private Boolean evitarTraficoPesado;

    @Column(name = "evitar_zonas_mantenimiento", nullable = false)
    private Boolean evitarZonasMantenimiento;

    @Column(name = "estado_pedido", nullable = false, length = 20)
    private String estadoPedido; // REGISTRADO, EN_PROCESO, OPTIMIZADO, DESPACHADO, ENTREGADO, CANCELADO

    @Column(name = "ruta_id")
    private Long rutaId;

    @Column(name = "fecha_emision", insertable = false, updatable = false)
    private LocalDateTime fechaEmision;

    @Column(name = "fecha_entrega")
    private LocalDateTime fechaEntrega;

    public Pedido() {
    }

    public Pedido(Long idPedido, Long idCliente, Long idUsuarioGestor, String tipoMaterial,
                  BigDecimal pesoT, BigDecimal volumenM3, String direccionDestino, String prioridad,
                  String objetivoOptimizacion, Boolean evitarTraficoPesado, Boolean evitarZonasMantenimiento,
                  String estadoPedido, Long rutaId, LocalDateTime fechaEmision, LocalDateTime fechaEntrega) {
        this.idPedido = idPedido;
        this.idCliente = idCliente;
        this.idUsuarioGestor = idUsuarioGestor;
        this.tipoMaterial = tipoMaterial;
        this.pesoT = pesoT;
        this.volumenM3 = volumenM3;
        this.direccionDestino = direccionDestino;
        this.prioridad = prioridad != null ? prioridad : "MEDIA";
        this.objetivoOptimizacion = objetivoOptimizacion != null ? objetivoOptimizacion : "EQUILIBRIO";
        this.evitarTraficoPesado = evitarTraficoPesado != null ? evitarTraficoPesado : false;
        this.evitarZonasMantenimiento = evitarZonasMantenimiento != null ? evitarZonasMantenimiento : false;
        this.estadoPedido = estadoPedido != null ? estadoPedido : "REGISTRADO";
        this.rutaId = rutaId;
        this.fechaEmision = fechaEmision;
        this.fechaEntrega = fechaEntrega;
    }
}
