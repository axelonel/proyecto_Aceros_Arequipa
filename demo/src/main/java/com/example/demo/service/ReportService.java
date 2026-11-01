package com.example.demo.service;

import com.example.demo.model.RutaOptimizada;
import com.example.demo.repository.RutaOptimizadaReportRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFCell;
import org.apache.poi.xssf.streaming.SXSSFRow;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.Stream;

@Service
public class ReportService {

    private final RutaOptimizadaReportRepository reportRepository;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public ReportService(RutaOptimizadaReportRepository reportRepository) {
        this.reportRepository = reportRepository;
    }

    // =========================================================================
    // 1. GENERACIÓN EXCEL EN STREAMING (Apache POI SXSSFWorkbook)
    // =========================================================================
    @Transactional(readOnly = true)
    public void escribirReporteExcel(OutputStream outputStream, LocalDate fechaInicio, LocalDate fechaFin, String estado, String usuario) throws IOException {
        // Ventana de 100 filas en memoria; el resto se vuelca a disco temporal
        SXSSFWorkbook workbook = new SXSSFWorkbook(100);
        workbook.setCompressTempFiles(true);

        try {
            SXSSFSheet sheet = workbook.createSheet("Rutas Optimizadas");
            sheet.trackAllColumnsForAutoSizing();

            DataFormat dataFormat = workbook.createDataFormat();

            // Estilos ÚNICOS instanciados fuera del bucle
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerFont.setFontHeightInPoints((short) 10);

            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle textStyle = workbook.createCellStyle();
            textStyle.setBorderBottom(BorderStyle.THIN);
            textStyle.setBorderTop(BorderStyle.THIN);
            textStyle.setBorderLeft(BorderStyle.THIN);
            textStyle.setBorderRight(BorderStyle.THIN);

            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(textStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.cloneStyleFrom(textStyle);
            currencyStyle.setDataFormat(dataFormat.getFormat("\"S/ \"#,##0.00"));
            currencyStyle.setAlignment(HorizontalAlignment.RIGHT);

            CellStyle decimalStyle = workbook.createCellStyle();
            decimalStyle.cloneStyleFrom(textStyle);
            decimalStyle.setDataFormat(dataFormat.getFormat("#,##0.0"));
            decimalStyle.setAlignment(HorizontalAlignment.RIGHT);

            org.apache.poi.ss.usermodel.Font totalFont = workbook.createFont();
            totalFont.setBold(true);

            CellStyle totalCurrencyStyle = workbook.createCellStyle();
            totalCurrencyStyle.cloneStyleFrom(currencyStyle);
            totalCurrencyStyle.setFont(totalFont);
            totalCurrencyStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            totalCurrencyStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle totalDecimalStyle = workbook.createCellStyle();
            totalDecimalStyle.cloneStyleFrom(decimalStyle);
            totalDecimalStyle.setFont(totalFont);
            totalDecimalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            totalDecimalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Metadatos de cabecera
            int rowIdx = 0;
            SXSSFRow titleRow = sheet.createRow(rowIdx++);
            org.apache.poi.ss.usermodel.Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("CORPORACIÓN ACEROS AREQUIPA S.A. - REPORTE DE RUTAS OPTIMIZADAS");
            org.apache.poi.ss.usermodel.Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);
            CellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            SXSSFRow metaRow1 = sheet.createRow(rowIdx++);
            metaRow1.createCell(0).setCellValue("Fecha de Emisión: " + LocalDateTime.now().format(DATE_TIME_FORMATTER));
            metaRow1.createCell(3).setCellValue("Generado por: " + (usuario != null ? usuario : "Sistema Experto"));

            SXSSFRow metaRow2 = sheet.createRow(rowIdx++);
            metaRow2.createCell(0).setCellValue("Filtros Aplicados -> Rango: [" + 
                (fechaInicio != null ? fechaInicio : "Todos") + " al " + (fechaFin != null ? fechaFin : "Todos") + 
                "] | Estado: " + (estado != null ? estado : "TODOS"));
            rowIdx++;

            // Encabezados de tabla
            String[] headers = {
                "ID Ruta", "Pedido N°", "Trayecto / Paradas", "Distancia (Km)", 
                "Tiempo (Min)", "Costo Flete", "Score", "Estado / Recomendación"
            };
            SXSSFRow headerRow = sheet.createRow(rowIdx++);
            headerRow.setHeightInPoints(24);
            for (int i = 0; i < headers.length; i++) {
                SXSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Conversión de fechas a LocalDateTime para la consulta
            LocalDateTime dtInicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
            LocalDateTime dtFin = (fechaFin != null) ? fechaFin.atTime(LocalTime.MAX) : null;

            AtomicInteger totalRegistros = new AtomicInteger(0);
            AtomicReference<Double> sumDistancia = new AtomicReference<>(0.0);
            AtomicReference<Double> sumCosto = new AtomicReference<>(0.0);

            boolean sinFiltros = (dtInicio == null && dtFin == null && (estado == null || estado.isBlank() || "TODOS".equalsIgnoreCase(estado)));
            String estadoFiltro = (!sinFiltros && estado != null && !estado.isBlank() && !"TODOS".equalsIgnoreCase(estado)) ? estado.trim() : null;
            try (Stream<RutaOptimizada> stream = sinFiltros ? reportRepository.streamAllRutasParaReporte() : reportRepository.streamRutasParaReporte(dtInicio, dtFin, estadoFiltro)) {
                int currentRow = rowIdx;
                for (RutaOptimizada ruta : (Iterable<RutaOptimizada>) stream::iterator) {
                    SXSSFRow row = sheet.createRow(currentRow++);

                    SXSSFCell c0 = row.createCell(0);
                    c0.setCellValue(ruta.getIdRuta());
                    c0.setCellStyle(centerStyle);

                    SXSSFCell c1 = row.createCell(1);
                    c1.setCellValue(ruta.getIdPedido() != null ? "#PED-" + ruta.getIdPedido() : "General");
                    c1.setCellStyle(centerStyle);

                    SXSSFCell c2 = row.createCell(2);
                    c2.setCellValue(ruta.getSecuenciaParadas() != null ? ruta.getSecuenciaParadas() : "-");
                    c2.setCellStyle(textStyle);

                    double dist = ruta.getDistanciaKm() != null ? ruta.getDistanciaKm().doubleValue() : 0.0;
                    sumDistancia.updateAndGet(v -> v + dist);
                    SXSSFCell c3 = row.createCell(3);
                    c3.setCellValue(dist);
                    c3.setCellStyle(decimalStyle);

                    SXSSFCell c4 = row.createCell(4);
                    c4.setCellValue(ruta.getTiempoEstimadoMin() != null ? ruta.getTiempoEstimadoMin().intValue() : 0);
                    c4.setCellStyle(centerStyle);

                    double costo = ruta.getCostoOperativo() != null ? ruta.getCostoOperativo().doubleValue() : 0.0;
                    sumCosto.updateAndGet(v -> v + costo);
                    SXSSFCell c5 = row.createCell(5);
                    c5.setCellValue(costo);
                    c5.setCellStyle(currencyStyle);

                    SXSSFCell c6 = row.createCell(6);
                    c6.setCellValue(ruta.getPuntaje() != null ? ruta.getPuntaje().toString() + "%" : "100%");
                    c6.setCellStyle(centerStyle);

                    SXSSFCell c7 = row.createCell(7);
                    c7.setCellValue(ruta.getEstadoRuta() != null ? ruta.getEstadoRuta() : "OPTIMA");
                    c7.setCellStyle(centerStyle);

                    totalRegistros.incrementAndGet();
                }
                rowIdx = currentRow;
            }

            // Fila de Totales
            SXSSFRow totalRow = sheet.createRow(rowIdx);
            SXSSFCell totalLabel = totalRow.createCell(0);
            totalLabel.setCellValue("TOTALES (" + totalRegistros.get() + " registros)");
            totalLabel.setCellStyle(totalDecimalStyle);
            sheet.addMergedRegion(new CellRangeAddress(rowIdx, rowIdx, 0, 2));

            SXSSFCell totalDistCell = totalRow.createCell(3);
            totalDistCell.setCellValue(sumDistancia.get());
            totalDistCell.setCellStyle(totalDecimalStyle);

            totalRow.createCell(4).setCellStyle(totalDecimalStyle);

            SXSSFCell totalCostoCell = totalRow.createCell(5);
            totalCostoCell.setCellValue(sumCosto.get());
            totalCostoCell.setCellStyle(totalCurrencyStyle);

            totalRow.createCell(6).setCellStyle(totalDecimalStyle);
            totalRow.createCell(7).setCellStyle(totalDecimalStyle);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(outputStream);

        } finally {
            workbook.dispose();
            workbook.close();
        }
    }

    // =========================================================================
    // 2. GENERACIÓN PDF EN STREAMING (OpenPDF - Landscape)
    // =========================================================================
    @Transactional(readOnly = true)
    public void escribirReportePdf(OutputStream outputStream, LocalDate fechaInicio, LocalDate fechaFin, String estado, String usuario) throws DocumentException {
        Document document = new Document(PageSize.A4.rotate(), 20, 20, 30, 35);
        PdfWriter writer = PdfWriter.getInstance(document, outputStream);

        PdfHeaderFooterEvent event = new PdfHeaderFooterEvent();
        writer.setPageEvent(event);

        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(30, 58, 138));
        Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.DARK_GRAY);
        Font thFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.WHITE);
        Font tdFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.BLACK);
        Font tdFontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Color.BLACK);

        Paragraph pTitle = new Paragraph("CORPORACIÓN ACEROS AREQUIPA S.A.", titleFont);
        pTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(pTitle);

        Paragraph pSub = new Paragraph("Reporte Ejecutivo de Optimización y Trazabilidad de Despachos", subTitleFont);
        document.add(pSub);

        Paragraph pMeta = new Paragraph(String.format(
            "Emisión: %s | Operador: %s | Filtros: [Rango: %s a %s | Estado: %s]",
            LocalDateTime.now().format(DATE_TIME_FORMATTER),
            usuario != null ? usuario : "Sistema Experto",
            fechaInicio != null ? fechaInicio : "Todos",
            fechaFin != null ? fechaFin : "Todos",
            estado != null ? estado : "TODOS"
        ), subTitleFont);
        pMeta.setSpacingAfter(10);
        document.add(pMeta);

        PdfPTable table = new PdfPTable(8);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.0f, 1.2f, 3.2f, 1.3f, 1.2f, 1.5f, 1.1f, 1.8f});
        table.setHeaderRows(1);

        String[] headers = {"ID", "Pedido", "Trayecto / Secuencia", "Distancia", "Tiempo", "Costo Flete", "Score", "Estado"};
        for (String title : headers) {
            PdfPCell c = new PdfPCell(new Phrase(title, thFont));
            c.setBackgroundColor(new Color(30, 58, 138));
            c.setHorizontalAlignment(Element.ALIGN_CENTER);
            c.setVerticalAlignment(Element.ALIGN_MIDDLE);
            c.setPadding(5);
            table.addCell(c);
        }

        LocalDateTime dtInicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
        LocalDateTime dtFin = (fechaFin != null) ? fechaFin.atTime(LocalTime.MAX) : null;

        int totalRegistros = 0;
        double sumDistancia = 0.0;
        double sumCosto = 0.0;

        boolean sinFiltros = (dtInicio == null && dtFin == null && (estado == null || estado.isBlank() || "TODOS".equalsIgnoreCase(estado)));
        String estadoFiltro = (!sinFiltros && estado != null && !estado.isBlank() && !"TODOS".equalsIgnoreCase(estado)) ? estado.trim() : null;
        try (Stream<RutaOptimizada> stream = sinFiltros ? reportRepository.streamAllRutasParaReporte() : reportRepository.streamRutasParaReporte(dtInicio, dtFin, estadoFiltro)) {
            for (RutaOptimizada r : (Iterable<RutaOptimizada>) stream::iterator) {
                totalRegistros++;
                double dist = r.getDistanciaKm() != null ? r.getDistanciaKm().doubleValue() : 0.0;
                double costo = r.getCostoOperativo() != null ? r.getCostoOperativo().doubleValue() : 0.0;
                sumDistancia += dist;
                sumCosto += costo;

                Color rowBg = (totalRegistros % 2 == 0) ? new Color(248, 250, 252) : Color.WHITE;

                addCell(table, String.valueOf(r.getIdRuta()), tdFont, Element.ALIGN_CENTER, rowBg);
                addCell(table, r.getIdPedido() != null ? "#PED-" + r.getIdPedido() : "-", tdFont, Element.ALIGN_CENTER, rowBg);
                addCell(table, r.getSecuenciaParadas() != null ? r.getSecuenciaParadas() : "-", tdFont, Element.ALIGN_LEFT, rowBg);
                addCell(table, String.format("%.1f km", dist), tdFont, Element.ALIGN_RIGHT, rowBg);
                addCell(table, (r.getTiempoEstimadoMin() != null ? r.getTiempoEstimadoMin().intValue() : 0) + " min", tdFont, Element.ALIGN_CENTER, rowBg);
                addCell(table, String.format("S/ %.2f", costo), tdFont, Element.ALIGN_RIGHT, rowBg);
                addCell(table, (r.getPuntaje() != null ? r.getPuntaje().toString() : "100") + "%", tdFont, Element.ALIGN_CENTER, rowBg);
                addCell(table, r.getEstadoRuta() != null ? r.getEstadoRuta() : "OPTIMA", tdFontBold, Element.ALIGN_CENTER, rowBg);
            }
        }

        PdfPCell cTotTitle = new PdfPCell(new Phrase("TOTALES (" + totalRegistros + " registros)", tdFontBold));
        cTotTitle.setColspan(3);
        cTotTitle.setBackgroundColor(new Color(226, 232, 240));
        cTotTitle.setPadding(5);
        table.addCell(cTotTitle);

        PdfPCell cTotDist = new PdfPCell(new Phrase(String.format("%.1f km", sumDistancia), tdFontBold));
        cTotDist.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cTotDist.setBackgroundColor(new Color(226, 232, 240));
        cTotDist.setPadding(5);
        table.addCell(cTotDist);

        PdfPCell cVacia = new PdfPCell();
        cVacia.setBackgroundColor(new Color(226, 232, 240));
        table.addCell(cVacia);

        PdfPCell cTotCosto = new PdfPCell(new Phrase(String.format("S/ %.2f", sumCosto), tdFontBold));
        cTotCosto.setHorizontalAlignment(Element.ALIGN_RIGHT);
        cTotCosto.setBackgroundColor(new Color(226, 232, 240));
        cTotCosto.setPadding(5);
        table.addCell(cTotCosto);

        PdfPCell cFin1 = new PdfPCell();
        cFin1.setColspan(2);
        cFin1.setBackgroundColor(new Color(226, 232, 240));
        table.addCell(cFin1);

        document.add(table);
        document.close();
    }

    private void addCell(PdfPTable table, String text, Font font, int alignment, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setHorizontalAlignment(alignment);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        cell.setBackgroundColor(bg);
        cell.setPadding(4);
        cell.setBorderColor(new Color(226, 232, 240));
        table.addCell(cell);
    }

    private static class PdfHeaderFooterEvent extends PdfPageEventHelper {
        private PdfTemplate totalPagesTemplate;
        private BaseFont baseFont;

        @Override
        public void onOpenDocument(PdfWriter writer, Document document) {
            totalPagesTemplate = writer.getDirectContent().createTemplate(30, 16);
            try {
                baseFont = BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
            } catch (Exception ignored) {}
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            if (baseFont == null) return;
            PdfContentByte cb = writer.getDirectContent();
            String text = "Página " + writer.getPageNumber() + " de ";
            float textSize = baseFont.getWidthPoint(text, 8);
            float textBase = document.bottom() - 15;
            float center = (document.right() + document.left()) / 2.0f;

            cb.beginText();
            cb.setFontAndSize(baseFont, 8);
            cb.setColorFill(Color.GRAY);
            cb.setTextMatrix(center - textSize, textBase);
            cb.showText(text);
            cb.endText();

            cb.addTemplate(totalPagesTemplate, center, textBase);
        }

        @Override
        public void onCloseDocument(PdfWriter writer, Document document) {
            if (totalPagesTemplate == null || baseFont == null) return;
            totalPagesTemplate.beginText();
            totalPagesTemplate.setFontAndSize(baseFont, 8);
            totalPagesTemplate.setColorFill(Color.GRAY);
            totalPagesTemplate.setTextMatrix(0, 0);
            totalPagesTemplate.showText(String.valueOf(writer.getPageNumber() - 1));
            totalPagesTemplate.endText();
        }
    }
}
