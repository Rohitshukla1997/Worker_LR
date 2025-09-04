import { useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'react-toastify';
import Logo from '../assets/brand/fmslogo1.png';

// Helper: Fetch image and convert to base64 if needed
const loadImageAsBase64 = async (url) => {
    if (url.startsWith('data:image')) {
        return url; // Already base64
    }
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
};

const usePdfExporter = () => {
    const exportToPDF = useCallback(
        async ({
            title,        // Report Title
            columns = [], // Table Columns
            data = [],    // Table Data
            metaData = {},// Extra Metadata
            fileName,     // PDF File Name
            config = {},  // Custom Configurations
        }) => {
            try {
                if (!Array.isArray(data) || data.length === 0) {
                    toast.error('No data available for PDF export');
                    return;
                }

                // Default Configuration
                const CONFIG = {
                    colors: {
                        primary: [10, 45, 99],
                        border: [220, 220, 220],
                        background: [249, 250, 251],
                    },
                    company: {
                        name: 'FMS (Fleet Management System)',
                        logo: Logo,
                    },
                    layout: {
                        margin: 16,
                    },
                    fonts: {
                        primary: 'helvetica',
                    },
                    orientation: 'landscape',
                    ...config,
                };

                const doc = new jsPDF({
                    orientation: CONFIG.orientation,
                    unit: 'mm',
                    format: 'a4',
                });

                // --- Add Logo ---
                try {
                    const logoBase64 = await loadImageAsBase64(CONFIG.company.logo);
                    const logoWidth = 30;
                    const logoHeight = 15;
                    doc.addImage(logoBase64, 'PNG', CONFIG.layout.margin, 10, logoWidth, logoHeight);
                } catch (e) {
                    console.warn('Logo could not be loaded:', e);
                }

                // --- Company Name ---
                doc.setFont(CONFIG.fonts.primary, 'bold');
                doc.setFontSize(16);
                doc.text(
                    CONFIG.company.name,
                    CONFIG.layout.margin + 40, // Right of logo
                    18
                );

                // Draw line lower to avoid touching logo
                doc.setDrawColor(...CONFIG.colors.primary);
                doc.line(CONFIG.layout.margin, 28, doc.internal.pageSize.width - CONFIG.layout.margin, 28);

                // --- Title (Centered) ---
                doc.setFontSize(20);
                doc.setFont(CONFIG.fonts.primary, 'bold');
                doc.text(
                    title,
                    doc.internal.pageSize.width / 2,
                    40,
                    { align: 'center' }
                );

                // --- Table Data ---
                const tableColumns = ['SN', ...columns.map((col) => col.label)];
                const tableRows = data.map((row, index) => [
                    index + 1,
                    ...columns.map((col) => row[col.key] || 'N/A'),
                ]);

                autoTable(doc, {
                    startY: 50,
                    head: [tableColumns],
                    body: tableRows,
                    theme: 'grid',
                    styles: {
                        fontSize: 8,
                        halign: 'center',
                        valign: 'middle',
                        lineColor: CONFIG.colors.border,
                        lineWidth: 0.1,
                        cellWidth: 'wrap',
                        overflow: 'linebreak',
                    },
                    headStyles: {
                        fillColor: CONFIG.colors.primary,
                        textColor: 255,
                        fontStyle: 'bold',
                        halign: 'center',
                    },
                    alternateRowStyles: {
                        fillColor: CONFIG.colors.background,
                    },
                    margin: { left: CONFIG.layout.margin, right: CONFIG.layout.margin },
                    pageBreak: 'auto',
                });

                // --- Metadata ---
                if (metaData && Object.keys(metaData).length > 0) {
                    doc.setFontSize(10);
                    doc.setFont(CONFIG.fonts.primary, 'bold');
                    let yPosition = doc.lastAutoTable.finalY + 10;
                    const xPosition = CONFIG.layout.margin;
                    Object.keys(metaData).forEach((key) => {
                        doc.text(`${key}: ${metaData[key]}`, xPosition, yPosition);
                        yPosition += 6;
                    });
                }

                // --- Footer ---
                const pageCount = doc.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(...CONFIG.colors.border);
                    doc.line(
                        CONFIG.layout.margin,
                        doc.internal.pageSize.height - 15,
                        doc.internal.pageSize.width - CONFIG.layout.margin,
                        doc.internal.pageSize.height - 15
                    );
                    doc.setFontSize(9);
                    doc.text(
                        `© ${new Date().getFullYear()} ${CONFIG.company.name}`,
                        CONFIG.layout.margin,
                        doc.internal.pageSize.height - 10
                    );
                    const pageNumber = `Page ${i} of ${pageCount}`;
                    doc.text(
                        pageNumber,
                        doc.internal.pageSize.width - CONFIG.layout.margin - doc.getTextWidth(pageNumber),
                        doc.internal.pageSize.height - 10
                    );
                }

                // --- Save File ---
                doc.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('PDF downloaded successfully');
            } catch (error) {
                console.error('PDF Export Error:', error);
                toast.error(error.message || 'Failed to export PDF');
            }
        },
        []
    );

    return { exportToPDF };
};

export default usePdfExporter;
