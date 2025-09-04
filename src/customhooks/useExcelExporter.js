import { useCallback } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { toast } from 'react-toastify';

const useExcelExporter = () => {
    const exportToExcel = useCallback(
        async ({ title, columns = [], data = [], metaData = {}, fileName, config = {} }) => {
            try {
                if (!Array.isArray(data) || data.length === 0) {
                    toast.error('No data available for Excel export');
                    return;
                }

                const CONFIG = {
                    colors: {
                        gradientStart: 'FF504255', // from-[#504255]
                        gradientEnd: 'FFcbb4d4',   // to-[#cbb4d4]
                        headerText: 'FFFFFFFF',
                        footerText: 'FF444444',
                    },
                    borderStyle: 'thin',
                    companyName: 'FMS (Fleet Management System)',
                    ...config,
                };

                const workbook = new ExcelJS.Workbook();
                const worksheet = workbook.addWorksheet(title || 'Sheet 1');

                const columnCount = columns.length + 1; // +1 for SN column
                const lastColumnLetter = String.fromCharCode(64 + columnCount);

                // --- COMPANY NAME (Top Banner) ---
                const companyRow = worksheet.addRow([CONFIG.companyName]);
                companyRow.height = 30;
                companyRow.font = { bold: true, size: 18, color: { argb: CONFIG.colors.headerText } };
                companyRow.alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`A${companyRow.number}:${lastColumnLetter}${companyRow.number}`);
                worksheet.getCell(`A${companyRow.number}`).fill = {
                    type: 'gradient',
                    gradient: 'linear',
                    degree: 90,
                    stops: [
                        { position: 0, color: { argb: CONFIG.colors.gradientStart } },
                        { position: 1, color: { argb: CONFIG.colors.gradientEnd } },
                    ],
                };

                // --- REPORT TITLE (under company name) ---
                const titleRow = worksheet.addRow([title]);
                titleRow.height = 24;
                titleRow.font = { bold: true, size: 16, color: { argb: 'FF333333' } };
                titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
                worksheet.mergeCells(`A${titleRow.number}:${lastColumnLetter}${titleRow.number}`);

                worksheet.addRow([]); // spacer

                // --- HEADER ROW ---
                const tableColumns = ['SN', ...columns.map((col) => col.label)];
                const headerRow = worksheet.addRow(tableColumns);
                headerRow.eachCell((cell) => {
                    cell.font = { bold: true, size: 12, color: { argb: CONFIG.colors.headerText } };
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: CONFIG.borderStyle },
                        left: { style: CONFIG.borderStyle },
                        bottom: { style: CONFIG.borderStyle },
                        right: { style: CONFIG.borderStyle },
                    };
                    cell.fill = {
                        type: 'gradient',
                        gradient: 'linear',
                        degree: 90,
                        stops: [
                            { position: 0, color: { argb: CONFIG.colors.gradientStart } },
                            { position: 1, color: { argb: CONFIG.colors.gradientEnd } },
                        ],
                    };
                });

                // --- CLEAN DATA ---
                const cleanData = (data) =>
                    data.map((item, index) => {
                        const cleanedItem = { SN: index + 1 };
                        columns.forEach((col) => {
                            let value = item[col.key];
                            try {
                                JSON.stringify(value);
                            } catch {
                                value = '[Circular]';
                            }
                            cleanedItem[col.label] =
                                typeof value === 'object' ? JSON.stringify(value) : value || 'N/A';
                        });
                        return cleanedItem;
                    });

                const cleanedData = cleanData(data);
                cleanedData.forEach((item, rowIndex) => {
                    const row = worksheet.addRow(Object.values(item));
                    row.eachCell((cell, colNumber) => {
                        cell.alignment = { horizontal: colNumber === 1 ? 'center' : 'left' };
                        cell.border = {
                            top: { style: CONFIG.borderStyle },
                            left: { style: CONFIG.borderStyle },
                            bottom: { style: CONFIG.borderStyle },
                            right: { style: CONFIG.borderStyle },
                        };

                        // Alternate row color (zebra style)
                        if (rowIndex % 2 === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF7F4FB' }, // light purple-gray shade
                            };
                        }
                    });
                });

                // --- Auto size columns ---
                worksheet.columns.forEach((col) => {
                    let maxLength = 15;
                    col.eachCell({ includeEmpty: true }, (cell) => {
                        const val = cell.value ? cell.value.toString() : '';
                        maxLength = Math.max(maxLength, val.length + 2);
                    });
                    col.width = maxLength > 50 ? 50 : maxLength;
                });

                // --- METADATA ---
                if (Object.keys(metaData).length > 0) {
                    worksheet.addRow([]);
                    Object.entries(metaData).forEach(([key, value]) => {
                        const row = worksheet.addRow([`${key}: ${value}`]);
                        row.font = { italic: true, size: 10, color: { argb: CONFIG.colors.footerText } };
                        worksheet.mergeCells(`A${row.number}:${lastColumnLetter}${row.number}`);
                    });
                }

                // --- FOOTER ---
                worksheet.addRow([]);
                const footerRow = worksheet.addRow([`© ${new Date().getFullYear()} ${CONFIG.companyName}`]);
                footerRow.font = { italic: true, size: 10, color: { argb: CONFIG.colors.footerText } };
                footerRow.alignment = { horizontal: 'right' };
                worksheet.mergeCells(`A${footerRow.number}:${lastColumnLetter}${footerRow.number}`);

                // --- EXPORT FILE ---
                const buffer = await workbook.xlsx.writeBuffer();
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                saveAs(blob, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);

                toast.success('Excel file downloaded successfully');
            } catch (error) {
                console.error('Excel Export Error:', error);
                toast.error(error.message || 'Failed to export Excel file');
            }
        },
        []
    );

    return { exportToExcel };
};

export default useExcelExporter;
