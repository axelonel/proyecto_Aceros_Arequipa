package com.example.demo.controller;

import com.example.demo.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/reportes")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * Descarga de Reporte Excel en Streaming (.xlsx)
     * GET /api/reportes/excel?fechaInicio=2026-01-01&fechaFin=2026-10-31&estado=OPTIMA
     */
    @GetMapping("/excel")
    public ResponseEntity<StreamingResponseBody> descargarReporteExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(required = false) String estado,
            Authentication auth) {

        String usuario = (auth != null) ? auth.getName() : "Usuario Logística";
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Reporte_Rutas_AcerosArequipa_" + timeStamp + ".xlsx";

        StreamingResponseBody stream = outputStream -> {
            try {
                reportService.escribirReporteExcel(outputStream, fechaInicio, fechaFin, estado, usuario);
            } catch (Exception ex) {
                throw new RuntimeException("Error en streaming de archivo Excel", ex);
            }
        };

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(stream);
    }

    /**
     * Descarga de Reporte PDF en Streaming (.pdf)
     * GET /api/reportes/pdf?fechaInicio=2026-01-01&fechaFin=2026-10-31&estado=OPTIMA
     */
    @GetMapping("/pdf")
    public ResponseEntity<StreamingResponseBody> descargarReportePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(required = false) String estado,
            Authentication auth) {

        String usuario = (auth != null) ? auth.getName() : "Usuario Logística";
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Reporte_Rutas_AcerosArequipa_" + timeStamp + ".pdf";

        StreamingResponseBody stream = outputStream -> {
            try {
                reportService.escribirReportePdf(outputStream, fechaInicio, fechaFin, estado, usuario);
            } catch (Exception ex) {
                throw new RuntimeException("Error en streaming de archivo PDF", ex);
            }
        };

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .contentType(MediaType.APPLICATION_PDF)
            .body(stream);
    }

    /**
     * Descarga de Reporte PowerPoint en Streaming (.pptx)
     * GET /api/reportes/pptx?fechaInicio=2026-01-01&fechaFin=2026-10-31&estado=OPTIMA
     */
    @GetMapping("/pptx")
    public ResponseEntity<StreamingResponseBody> descargarReportePptx(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            @RequestParam(required = false) String estado,
            Authentication auth) {

        String usuario = (auth != null) ? auth.getName() : "Usuario Logística";
        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String filename = "Reporte_Rutas_AcerosArequipa_" + timeStamp + ".pptx";

        StreamingResponseBody stream = outputStream -> {
            try {
                reportService.escribirReportePptx(outputStream, fechaInicio, fechaFin, estado, usuario);
            } catch (Exception ex) {
                throw new RuntimeException("Error en streaming de archivo PowerPoint", ex);
            }
        };

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
            .header(HttpHeaders.PRAGMA, "no-cache")
            .header(HttpHeaders.EXPIRES, "0")
            .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation"))
            .body(stream);
    }
}
