package com.artifactcomparator.common;

import java.util.Map;

/**
 * Interface for entities that can be exported to various formats (CSV, XLSX, PDF)
 * Entities implement this to provide their data as key-value pairs for export
 */
public interface Exportable {
    /**
     * Convert entity to export format as key-value pairs
     * @return LinkedHashMap to preserve order of fields
     */
    Map<String, String> toExportMap();
}

