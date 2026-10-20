package com.example.demo.dto;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

public class OptimizacionResponseDto implements Serializable {
    private boolean exito;
    private String mensaje;
    private Long idRuta;
    private Long idPedido;
    private String rutaOptimaTrayecto;   // ej. "A → C → E → F"
    private List<String> nodosClave;     // ["A", "C", "E", "F"]
    private List<String> paradasNombres; // ["Almacén Principal Lima", "Centro Logístico Lurín", ...]
    private double distanciaKm;
    private int tiempoMinutos;
    private double costoSoles;
    private String puntajeEficiencia;    // "95%"
    private List<String> motivosSeleccion;
    private List<RutaAlternativaDto> rutasAlternativas;
    private String vehiculoAsignadoInfo;
    private String transportistaAsignadoInfo;

    public OptimizacionResponseDto() {
        this.nodosClave = new ArrayList<>();
        this.paradasNombres = new ArrayList<>();
        this.motivosSeleccion = new ArrayList<>();
        this.rutasAlternativas = new ArrayList<>();
    }

    public boolean isExito() { return exito; }
    public void setExito(boolean exito) { this.exito = exito; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public Long getIdRuta() { return idRuta; }
    public void setIdRuta(Long idRuta) { this.idRuta = idRuta; }

    public Long getIdPedido() { return idPedido; }
    public void setIdPedido(Long idPedido) { this.idPedido = idPedido; }

    public String getRutaOptimaTrayecto() { return rutaOptimaTrayecto; }
    public void setRutaOptimaTrayecto(String rutaOptimaTrayecto) { this.rutaOptimaTrayecto = rutaOptimaTrayecto; }

    public List<String> getNodosClave() { return nodosClave; }
    public void setNodosClave(List<String> nodosClave) { this.nodosClave = nodosClave; }

    public List<String> getParadasNombres() { return paradasNombres; }
    public void setParadasNombres(List<String> paradasNombres) { this.paradasNombres = paradasNombres; }

    public double getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(double distanciaKm) { this.distanciaKm = distanciaKm; }

    public int getTiempoMinutos() { return tiempoMinutos; }
    public void setTiempoMinutos(int tiempoMinutos) { this.tiempoMinutos = tiempoMinutos; }

    public double getCostoSoles() { return costoSoles; }
    public void setCostoSoles(double costoSoles) { this.costoSoles = costoSoles; }

    public String getPuntajeEficiencia() { return puntajeEficiencia; }
    public void setPuntajeEficiencia(String puntajeEficiencia) { this.puntajeEficiencia = puntajeEficiencia; }

    public List<String> getMotivosSeleccion() { return motivosSeleccion; }
    public void setMotivosSeleccion(List<String> motivosSeleccion) { this.motivosSeleccion = motivosSeleccion; }

    public List<RutaAlternativaDto> getRutasAlternativas() { return rutasAlternativas; }
    public void setRutasAlternativas(List<RutaAlternativaDto> rutasAlternativas) { this.rutasAlternativas = rutasAlternativas; }

    public String getVehiculoAsignadoInfo() { return vehiculoAsignadoInfo; }
    public void setVehiculoAsignadoInfo(String vehiculoAsignadoInfo) { this.vehiculoAsignadoInfo = vehiculoAsignadoInfo; }

    public String getTransportistaAsignadoInfo() { return transportistaAsignadoInfo; }
    public void setTransportistaAsignadoInfo(String transportistaAsignadoInfo) { this.transportistaAsignadoInfo = transportistaAsignadoInfo; }
}
