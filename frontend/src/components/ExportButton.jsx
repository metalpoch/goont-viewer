import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SaveFileDialog } from '../../wailsjs/go/main/App';

const ExportButton = ({ data, columns, filename, buttonText = "Exportar Excel", sheets = [] }) => {
    const exportToExcel = async () => {
        if ((!data || data.length === 0) && sheets.length === 0) return;

        const wb = XLSX.utils.book_new();
        
        if (data && data.length > 0 && columns) {
            const excelData = data.map(row => {
                const excelRow = {};
                columns.forEach(col => {
                    if (col.key in row) {
                        excelRow[col.header] = row[col.key];
                    }
                });
                return excelRow;
            });

            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(wb, ws, "Datos");
        }

        sheets.forEach((sheet, index) => {
            if (sheet.data && sheet.data.length > 0) {
                const ws = XLSX.utils.json_to_sheet(sheet.data);
                XLSX.utils.book_append_sheet(wb, ws, sheet.name || `Hoja${index + 1}`);
            }
        });

        const dateStr = new Date().toISOString().split('T')[0];
        const defaultFilename = `${filename}_${dateStr}.xlsx`;

        try {
            const filePath = await SaveFileDialog(defaultFilename);
            
            if (!filePath) {
                return;
            }

            XLSX.writeFile(wb, filePath);
        } catch (error) {
            console.error('Error al guardar archivo:', error);
            try {
                XLSX.writeFile(wb, defaultFilename);
            } catch (fallbackError) {
                console.error('Error en fallback:', fallbackError);
                alert('Error al exportar el archivo. Verifica la consola para más detalles.');
            }
        }
    };

    return (
        <button
            className="export-button"
            onClick={exportToExcel}
            disabled={(!data || data.length === 0) && sheets.length === 0}
        >
            <Download size={18} />
            {buttonText}
        </button>
    );
};

export default ExportButton;