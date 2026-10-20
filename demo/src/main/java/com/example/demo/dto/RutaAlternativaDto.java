package com.example.demo.dto;

import java.io.Serializable;

public class RutaAlternativaDto implements Serializable {
    private int numero;
    private String trayecto;
    private int tiempoMinutos;
    private double distanciaKm;
    private double costoSoles;
    private String puntaje;
    private String recomendacion; // "Óptima", "Alternativa", "No recomendada"
    private String badgeClase;   // "badge-optima", "badge-alternativa", etc.

    public RutaAlternativaDto() {}

    public RutaAlternativaDto(int numero, String trayecto, int tiempoMinutos, double distanciaKm,
                              double costoSoles, String puntaje, String recomendacion, String badgeClase) {
        this.numero = numero;
        this.trayecto = trayecto;
        this.tiempoMinutos = tiempoMinutos;
        this.distanciaKm = distanciaKm;
        this.costoSoles = costoSoles;
        this.puntaje = puntaje;
        this.recomendacion = recomendacion;
        this.badgeClase = badgeClase;
    }

    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }

    public String getTrayecto() { return trayecto; }
    public void setTrayecto(String trayecto) { this.trayecto = trayecto; }

    public int getTiempoMinutos() { return tiempoMinutos; }
    public void setTiempoMinutos(int tiempoMinutos) { this.tiempoMinutos = tiempoMinutos; }

    public double getDistanciaKm() { return distanciaKm; }
    public void setDistanciaKm(double distanciaKm) { this.distanciaKm = distanciaKm; }

    public double getCostoSoles() { return costoSoles; }
    public void setCostoSoles(double costoSoles) { this.costoSoles = costoSoles; }

    public String getPuntaje() { return puntaje; }
    public void setPuntaje(String puntaje) { this.puntaje = puntaje; }

    public String getRecomendacion() { return recomendacion; }
    public void setRecomendacion(String recomendacion) { this.recomendacion = recomendacion; }

    public String getBadgeClase() { return badgeClase; }
    public void setBadgeClase(String badgeClase) { this.badgeClase = badgeClase; }
}
