package com.example.demo.dto;

import java.io.Serializable;

public class OptimizacionRequestDto implements Serializable {
    private String origen;              // ej: "A", "B", "C"
    private String destino;             // ej: "F", "E", "D"
    private String material;            // ej: "Bobinas de acero", "Barras de construcción"
    private Double peso;                // en toneladas, ej: 24.0
    private String prioridad;           // "Alta", "Media", "Baja"
    private String tipoTransporte;      // "camion", "trailer", "furgon"
    private String objetivo;            // "tiempo", "costo", "equilibrio"
    private Boolean evitarTrafico;
    private Boolean evitarMantenimiento;
    private Long idVehiculo;
    private Long idCliente;

    public OptimizacionRequestDto() {}

    public OptimizacionRequestDto(String origen, String destino, String material, Double peso,
                                  String prioridad, String tipoTransporte, String objetivo,
                                  Boolean evitarTrafico, Boolean evitarMantenimiento,
                                  Long idVehiculo, Long idCliente) {
        this.origen = origen;
        this.destino = destino;
        this.material = material;
        this.peso = peso;
        this.prioridad = prioridad;
        this.tipoTransporte = tipoTransporte;
        this.objetivo = objetivo;
        this.evitarTrafico = evitarTrafico;
        this.evitarMantenimiento = evitarMantenimiento;
        this.idVehiculo = idVehiculo;
        this.idCliente = idCliente;
    }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getDestino() { return destino; }
    public void setDestino(String destino) { this.destino = destino; }

    public String getMaterial() { return material; }
    public void setMaterial(String material) { this.material = material; }

    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }

    public String getPrioridad() { return prioridad; }
    public void setPrioridad(String prioridad) { this.prioridad = prioridad; }

    public String getTipoTransporte() { return tipoTransporte; }
    public void setTipoTransporte(String tipoTransporte) { this.tipoTransporte = tipoTransporte; }

    public String getObjetivo() { return objetivo; }
    public void setObjetivo(String objetivo) { this.objetivo = objetivo; }

    public Boolean getEvitarTrafico() { return evitarTrafico != null ? evitarTrafico : false; }
    public void setEvitarTrafico(Boolean evitarTrafico) { this.evitarTrafico = evitarTrafico; }

    public Boolean getEvitarMantenimiento() { return evitarMantenimiento != null ? evitarMantenimiento : false; }
    public void setEvitarMantenimiento(Boolean evitarMantenimiento) { this.evitarMantenimiento = evitarMantenimiento; }

    public Long getIdVehiculo() { return idVehiculo; }
    public void setIdVehiculo(Long idVehiculo) { this.idVehiculo = idVehiculo; }

    public Long getIdCliente() { return idCliente; }
    public void setIdCliente(Long idCliente) { this.idCliente = idCliente; }
}
