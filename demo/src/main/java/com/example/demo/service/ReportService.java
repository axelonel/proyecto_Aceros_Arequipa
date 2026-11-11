package com.example.demo.service;

import com.example.demo.model.RutaOptimizada;
import com.example.demo.repository.RutaOptimizadaReportRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import org.apache.poi.sl.usermodel.ShapeType;
import org.apache.poi.sl.usermodel.TableCell;
import org.apache.poi.sl.usermodel.TextParagraph;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.streaming.SXSSFCell;
import org.apache.poi.xssf.streaming.SXSSFRow;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFAutoShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTable;
import org.apache.poi.xslf.usermodel.XSLFTableCell;
import org.apache.poi.xslf.usermodel.XSLFTableRow;
import org.apache.poi.xslf.usermodel.XSLFTextBox;
import org.apache.poi.xslf.usermodel.XSLFTextParagraph;
import org.apache.poi.xslf.usermodel.XSLFTextRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Rectangle;
import java.io.IOException;
import java.io.OutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
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
    // =========================================================================
    // 3. GENERACIÓN POWERPOINT (.PPTX) CON APACHE POI XSLF (16:9 Widescreen)
    // =========================================================================
    @Transactional(readOnly = true)
    public void escribirReportePptx(OutputStream outputStream, LocalDate fechaInicio, LocalDate fechaFin, String estado, String usuario) throws IOException {
        LocalDateTime dtInicio = (fechaInicio != null) ? fechaInicio.atStartOfDay() : null;
        LocalDateTime dtFin = (fechaFin != null) ? fechaFin.atTime(LocalTime.MAX) : null;

        boolean sinFiltros = (dtInicio == null && dtFin == null && (estado == null || estado.isBlank() || "TODOS".equalsIgnoreCase(estado)));
        String estadoFiltro = (!sinFiltros && estado != null && !estado.isBlank() && !"TODOS".equalsIgnoreCase(estado)) ? estado.trim() : null;

        List<RutaOptimizada> rutas = new ArrayList<>();
        double sumDistancia = 0.0;
        double sumCosto = 0.0;
        double sumTiempo = 0.0;
        double sumScore = 0.0;

        try (Stream<RutaOptimizada> stream = sinFiltros ? reportRepository.streamAllRutasParaReporte() : reportRepository.streamRutasParaReporte(dtInicio, dtFin, estadoFiltro)) {
            for (RutaOptimizada r : (Iterable<RutaOptimizada>) stream::iterator) {
                rutas.add(r);
                sumDistancia += r.getDistanciaKm() != null ? r.getDistanciaKm().doubleValue() : 0.0;
                sumCosto += r.getCostoOperativo() != null ? r.getCostoOperativo().doubleValue() : 0.0;
                sumTiempo += r.getTiempoEstimadoMin() != null ? r.getTiempoEstimadoMin().doubleValue() : 0.0;
                sumScore += r.getPuntaje() != null ? r.getPuntaje().doubleValue() : 100.0;
            }
        }

        int totalRegistros = rutas.size();
        double avgTiempo = totalRegistros > 0 ? sumTiempo / totalRegistros : 0.0;
        double avgScore = totalRegistros > 0 ? sumScore / totalRegistros : 0.0;

        Color navyDark = new Color(15, 23, 42);
        Color navyBlue = new Color(30, 58, 138);
        Color accentBlue = new Color(37, 99, 235);
        Color lightBg = new Color(248, 250, 252);
        Color borderLight = new Color(226, 232, 240);
        Color textDark = new Color(15, 23, 42);
        Color textMuted = new Color(100, 116, 139);
        Color greenOk = new Color(22, 163, 74);

        try (XMLSlideShow ppt = new XMLSlideShow()) {
            ppt.setPageSize(new Dimension(960, 540));

            // -----------------------------------------------------------------
            // DIAPOSITIVA 1: PORTADA EJECUTIVA
            // -----------------------------------------------------------------
            XSLFSlide coverSlide = ppt.createSlide();
            addPptRect(coverSlide, 0, 0, 960, 540, navyDark);
            addPptRect(coverSlide, 0, 0, 18, 540, accentBlue);
            addPptRect(coverSlide, 54, 105, 90, 5, accentBlue);

            addPptText(coverSlide, 54, 125, 840, 48, "CORPORACIÓN ACEROS AREQUIPA S.A.", 28.0, true, Color.WHITE, TextParagraph.TextAlign.LEFT);
            addPptText(coverSlide, 54, 178, 840, 44, "Reporte Ejecutivo de Optimización y Trazabilidad de Despachos", 19.0, false, new Color(147, 197, 253), TextParagraph.TextAlign.LEFT);
            addPptText(coverSlide, 54, 224, 840, 30, "Motor de Ruteo Logístico · Google OR-Tools Constraint Solver", 13.0, false, new Color(148, 163, 184), TextParagraph.TextAlign.LEFT);

            XSLFAutoShape metaBox = coverSlide.createAutoShape();
            metaBox.setShapeType(ShapeType.ROUND_RECT);
            metaBox.setAnchor(new Rectangle(54, 310, 840, 130));
            metaBox.setFillColor(new Color(30, 41, 59));
            metaBox.setLineColor(new Color(51, 65, 85));
            metaBox.setLineWidth(1.0);

            String rangoStr = (fechaInicio != null ? fechaInicio : "Todos") + " a " + (fechaFin != null ? fechaFin : "Todos");
            String estadoStr = (estado != null && !estado.isBlank()) ? estado : "TODOS";
            String operadorStr = usuario != null ? usuario : "Sistema Experto";

            addPptText(coverSlide, 74, 326, 800, 26, "Fecha de Emisión: " + LocalDateTime.now().format(DATE_TIME_FORMATTER), 12.5, false, Color.WHITE, TextParagraph.TextAlign.LEFT);
            addPptText(coverSlide, 74, 356, 800, 26, "Generado por: " + operadorStr, 12.5, false, Color.WHITE, TextParagraph.TextAlign.LEFT);
            addPptText(coverSlide, 74, 386, 800, 26, "Filtros Aplicados: Rango [" + rangoStr + "]   |   Estado: " + estadoStr, 12.5, false, new Color(56, 189, 248), TextParagraph.TextAlign.LEFT);

            int pageSize = 10;
            int totalDataPages = Math.max(1, (int) Math.ceil(totalRegistros / (double) pageSize));
            int totalSlides = 2 + totalDataPages;

            // -----------------------------------------------------------------
            // DIAPOSITIVA 2: RESUMEN EJECUTIVO & KPIs
            // -----------------------------------------------------------------
            XSLFSlide kpiSlide = ppt.createSlide();
            addPptSlideHeader(kpiSlide, "RESUMEN EJECUTIVO DE OPERACIONES", "Indicadores clave del período analizado", navyBlue);

            addPptKpiCard(kpiSlide, 44, 115, 205, 135, "RUTAS ANALIZADAS", String.valueOf(totalRegistros), "Corredores optimizados", accentBlue, lightBg, borderLight, textDark, textMuted);
            addPptKpiCard(kpiSlide, 266, 115, 205, 135, "DISTANCIA TOTAL", String.format("%.1f km", sumDistancia), "Kilometraje acumulado", navyBlue, lightBg, borderLight, textDark, textMuted);
            addPptKpiCard(kpiSlide, 488, 115, 205, 135, "COSTO OPERATIVO", String.format("S/ %.2f", sumCosto), "Flete total estimado", greenOk, lightBg, borderLight, textDark, textMuted);
            addPptKpiCard(kpiSlide, 710, 115, 205, 135, "EFICIENCIA PROMEDIO", String.format("%.0f%%", avgScore), "Score medio OR-Tools", new Color(217, 119, 6), lightBg, borderLight, textDark, textMuted);

            XSLFAutoShape summaryPanel = kpiSlide.createAutoShape();
            summaryPanel.setShapeType(ShapeType.ROUND_RECT);
            summaryPanel.setAnchor(new Rectangle(44, 280, 871, 180));
            summaryPanel.setFillColor(lightBg);
            summaryPanel.setLineColor(borderLight);
            summaryPanel.setLineWidth(1.0);

            addPptText(kpiSlide, 64, 298, 830, 28, "SÍNTESIS LOGÍSTICA DEL PERÍODO", 13.5, true, navyBlue, TextParagraph.TextAlign.LEFT);
            addPptText(kpiSlide, 64, 336, 830, 26, "• Tiempo promedio de tránsito por despacho: " + String.format("%.0f minutos", avgTiempo), 12.5, false, textDark, TextParagraph.TextAlign.LEFT);
            addPptText(kpiSlide, 64, 368, 830, 26, "• Rango consultado: " + rangoStr + "   |   Filtro de estado: " + estadoStr, 12.5, false, textDark, TextParagraph.TextAlign.LEFT);
            addPptText(kpiSlide, 64, 400, 830, 26, "• Fuente de datos: PostgreSQL Producción — Trazabilidad directa con Google OR-Tools", 12.5, false, textMuted, TextParagraph.TextAlign.LEFT);

            addPptSlideFooter(kpiSlide, 2, totalSlides, textMuted);

            // -----------------------------------------------------------------
            // DIAPOSITIVAS 3..N: DETALLE TABULAR PAGINADO (10 filas por slide)
            // -----------------------------------------------------------------
            if (totalRegistros == 0) {
                XSLFSlide emptySlide = ppt.createSlide();
                addPptSlideHeader(emptySlide, "DETALLE DE RUTAS OPTIMIZADAS", "Sin registros para los filtros seleccionados", navyBlue);
                addPptText(emptySlide, 60, 220, 840, 40, "No se encontraron rutas optimizadas que coincidan con los criterios de búsqueda.", 15.0, false, textMuted, TextParagraph.TextAlign.CENTER);
                addPptSlideFooter(emptySlide, 3, totalSlides, textMuted);
            } else {
                String[] headers = {"ID", "Pedido", "Trayecto / Secuencia", "Distancia", "Tiempo", "Costo Flete", "Score", "Estado"};
                double[] colWidths = {55, 75, 290, 85, 75, 105, 70, 125};

                for (int pageIdx = 0; pageIdx < totalDataPages; pageIdx++) {
                    int start = pageIdx * pageSize;
                    int end = Math.min(start + pageSize, totalRegistros);
                    boolean isLastPage = (pageIdx == totalDataPages - 1);

                    XSLFSlide tableSlide = ppt.createSlide();
                    addPptSlideHeader(
                        tableSlide,
                        "DETALLE DE RUTAS OPTIMIZADAS",
                        "Bloque " + (pageIdx + 1) + " de " + totalDataPages + " · Registros " + (start + 1) + " al " + end + " de " + totalRegistros,
                        navyBlue
                    );

                    XSLFTable table = tableSlide.createTable();
                    table.setAnchor(new Rectangle(40, 86, 880, 40));

                    XSLFTableRow headerRow = table.addRow();
                    headerRow.setHeight(30);
                    for (int c = 0; c < headers.length; c++) {
                        stylePptCell(headerRow.addCell(), headers[c], 10.5, true, Color.WHITE, navyBlue, borderLight, TextParagraph.TextAlign.CENTER);
                    }
                    for (int c = 0; c < colWidths.length; c++) {
                        table.setColumnWidth(c, colWidths[c]);
                    }

                    for (int i = start; i < end; i++) {
                        RutaOptimizada r = rutas.get(i);
                        double dist = r.getDistanciaKm() != null ? r.getDistanciaKm().doubleValue() : 0.0;
                        double costo = r.getCostoOperativo() != null ? r.getCostoOperativo().doubleValue() : 0.0;
                        int tiempo = r.getTiempoEstimadoMin() != null ? r.getTiempoEstimadoMin().intValue() : 0;
                        String score = (r.getPuntaje() != null ? r.getPuntaje().toString() : "100") + "%";
                        String estadoVal = r.getEstadoRuta() != null ? r.getEstadoRuta() : "OPTIMA";

                        Color rowBg = (i % 2 == 1) ? lightBg : Color.WHITE;
                        XSLFTableRow row = table.addRow();
                        row.setHeight(32);

                        stylePptCell(row.addCell(), String.valueOf(r.getIdRuta()), 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(row.addCell(), r.getIdPedido() != null ? "#PED-" + r.getIdPedido() : "-", 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(row.addCell(), r.getSecuenciaParadas() != null ? r.getSecuenciaParadas() : "-", 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.LEFT);
                        stylePptCell(row.addCell(), String.format("%.1f km", dist), 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.RIGHT);
                        stylePptCell(row.addCell(), tiempo + " min", 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(row.addCell(), String.format("S/ %.2f", costo), 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.RIGHT);
                        stylePptCell(row.addCell(), score, 9.5, false, textDark, rowBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(row.addCell(), estadoVal, 9.5, true, navyBlue, rowBg, borderLight, TextParagraph.TextAlign.CENTER);
                    }

                    if (isLastPage) {
                        Color totBg = new Color(226, 232, 240);
                        XSLFTableRow totRow = table.addRow();
                        totRow.setHeight(30);
                        for (int c = 0; c < 8; c++) totRow.addCell();
                        table.mergeCells(table.getNumberOfRows() - 1, table.getNumberOfRows() - 1, 0, 2);

                        stylePptCell(totRow.getCells().get(0), "TOTALES (" + totalRegistros + " registros)", 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.LEFT);
                        stylePptCell(totRow.getCells().get(3), String.format("%.1f km", sumDistancia), 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.RIGHT);
                        stylePptCell(totRow.getCells().get(4), "", 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(totRow.getCells().get(5), String.format("S/ %.2f", sumCosto), 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.RIGHT);
                        stylePptCell(totRow.getCells().get(6), "", 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.CENTER);
                        stylePptCell(totRow.getCells().get(7), "", 10.0, true, textDark, totBg, borderLight, TextParagraph.TextAlign.CENTER);
                    }

                    addPptSlideFooter(tableSlide, 3 + pageIdx, totalSlides, textMuted);
                }
            }

            ppt.write(outputStream);
        }
    }

    private void addPptRect(XSLFSlide slide, int x, int y, int w, int h, Color fill) {
        XSLFAutoShape rect = slide.createAutoShape();
        rect.setShapeType(ShapeType.RECT);
        rect.setAnchor(new Rectangle(x, y, w, h));
        rect.setFillColor(fill);
        rect.setLineWidth(0.0);
    }

    private void addPptText(XSLFSlide slide, int x, int y, int w, int h, String text, double fontSize, boolean bold, Color color, TextParagraph.TextAlign align) {
        XSLFTextBox box = slide.createTextBox();
        box.setAnchor(new Rectangle(x, y, w, h));
        box.clearText();
        XSLFTextParagraph p = box.addNewTextParagraph();
        p.setTextAlign(align);
        XSLFTextRun r = p.addNewTextRun();
        r.setText(text);
        r.setFontFamily("Calibri");
        r.setFontSize(fontSize);
        r.setBold(bold);
        r.setFontColor(color);
    }

    private void addPptSlideHeader(XSLFSlide slide, String title, String subtitle, Color navyBlue) {
        addPptRect(slide, 0, 0, 960, 68, navyBlue);
        addPptText(slide, 40, 10, 720, 28, title, 17.0, true, Color.WHITE, TextParagraph.TextAlign.LEFT);
        addPptText(slide, 40, 38, 720, 22, subtitle, 10.5, false, new Color(191, 219, 254), TextParagraph.TextAlign.LEFT);
        addPptText(slide, 760, 20, 165, 24, "ACEROS AREQUIPA", 11.0, true, new Color(147, 197, 253), TextParagraph.TextAlign.RIGHT);
    }

    private void addPptSlideFooter(XSLFSlide slide, int pageNum, int totalPages, Color textMuted) {
        addPptText(slide, 40, 508, 650, 20, "Corporación Aceros Arequipa S.A. · Sistema Experto de Rutas", 9.5, false, textMuted, TextParagraph.TextAlign.LEFT);
        addPptText(slide, 780, 508, 140, 20, "Diapositiva " + pageNum + " de " + totalPages, 9.5, false, textMuted, TextParagraph.TextAlign.RIGHT);
    }

    private void addPptKpiCard(XSLFSlide slide, int x, int y, int w, int h, String label, String value, String sub, Color accent, Color bg, Color border, Color textDark, Color textMuted) {
        XSLFAutoShape card = slide.createAutoShape();
        card.setShapeType(ShapeType.ROUND_RECT);
        card.setAnchor(new Rectangle(x, y, w, h));
        card.setFillColor(bg);
        card.setLineColor(border);
        card.setLineWidth(1.0);

        addPptRect(slide, x + 12, y + 14, 48, 4, accent);
        addPptText(slide, x + 12, y + 26, w - 24, 22, label, 10.0, true, textMuted, TextParagraph.TextAlign.LEFT);
        addPptText(slide, x + 12, y + 54, w - 24, 42, value, 24.0, true, textDark, TextParagraph.TextAlign.LEFT);
        addPptText(slide, x + 12, y + 102, w - 24, 20, sub, 10.0, false, accent, TextParagraph.TextAlign.LEFT);
    }

    private void stylePptCell(XSLFTableCell cell, String text, double fontSize, boolean bold, Color textColor, Color bgColor, Color borderColor, TextParagraph.TextAlign align) {
        cell.setFillColor(bgColor);
        cell.setVerticalAlignment(org.apache.poi.sl.usermodel.VerticalAlignment.MIDDLE);
        cell.setBorderColor(TableCell.BorderEdge.top, borderColor);
        cell.setBorderColor(TableCell.BorderEdge.bottom, borderColor);
        cell.setBorderColor(TableCell.BorderEdge.left, borderColor);
        cell.setBorderColor(TableCell.BorderEdge.right, borderColor);
        cell.setBorderWidth(TableCell.BorderEdge.top, 0.5);
        cell.setBorderWidth(TableCell.BorderEdge.bottom, 0.5);
        cell.setBorderWidth(TableCell.BorderEdge.left, 0.5);
        cell.setBorderWidth(TableCell.BorderEdge.right, 0.5);

        cell.clearText();
        XSLFTextParagraph p = cell.addNewTextParagraph();
        p.setTextAlign(align);
        XSLFTextRun r = p.addNewTextRun();
        r.setText(text);
        r.setFontFamily("Calibri");
        r.setFontSize(fontSize);
        r.setBold(bold);
        r.setFontColor(textColor);
    }

}