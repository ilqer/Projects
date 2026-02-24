package com.artifactcomparator.export.service;

import com.artifactcomparator.common.Exportable;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Generic Export Service - handles CSV, XLSX, and PDF exports for any Exportable entity
 */
@Service
public class ExportService {

    /**
     * Export any Exportable entity to CSV format
     */
    public byte[] exportCsv(Exportable exportable) {
        Map<String, String> map = exportable.toExportMap();

        StringBuilder sb = new StringBuilder();
        sb.append("Field,Value\n");
        map.forEach((k, v) -> sb.append(escapeCSV(k)).append(",").append(escapeCSV(v)).append("\n"));

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Export any Exportable entity to XLSX format
     */
    public byte[] exportXlsx(Exportable exportable) {
        Map<String, String> map = exportable.toExportMap();

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Export");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            int rowNum = 0;
            for (Map.Entry<String, String> entry : map.entrySet()) {
                Row row = sheet.createRow(rowNum++);

                Cell keyCell = row.createCell(0);
                keyCell.setCellValue(entry.getKey());
                keyCell.setCellStyle(headerStyle);

                Cell valueCell = row.createCell(1);
                valueCell.setCellValue(entry.getValue());
            }

            // Auto-size columns
            sheet.autoSizeColumn(0);
            sheet.autoSizeColumn(1);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("XLSX export failed", e);
        }
    }

    /**
     * Export any Exportable entity to PDF format
     */
    public byte[] exportPdf(Exportable exportable) {
        Map<String, String> map = exportable.toExportMap();

        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(out);
            PdfDocument pdf = new PdfDocument(writer);
            Document doc = new Document(pdf);

            // Add title
            doc.add(new Paragraph("Export Data").setBold().setFontSize(16));
            doc.add(new Paragraph("\n"));

            // Add data
            map.forEach((k, v) -> {
                Paragraph p = new Paragraph();
                p.add(new com.itextpdf.layout.element.Text(k + ": ").setBold());
                p.add(new com.itextpdf.layout.element.Text(v));
                doc.add(p);
            });

            doc.close();
            return out.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF export failed", e);
        }
    }

    /**
     * Escape CSV special characters
     */
    private String escapeCSV(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}

