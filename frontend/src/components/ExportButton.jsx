import { Download } from 'lucide-react';
import { ExportToExcel } from '../../wailsjs/go/main/App';

const ExportButton = ({ data, columns, filename, buttonText = "Exportar Excel", sheets = [] }) => {
    const exportToExcel = async () => {
        if ((!data || data.length === 0) && sheets.length === 0) return;

        const exportData = {
            data: [],
            sheets: []
        };

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
            exportData.data = excelData;
        }

        if (sheets.length > 0) {
            exportData.sheets = sheets.map(sheet => ({
                name: sheet.name,
                data: sheet.data
            }));
        }

        const dateStr = new Date().toISOString().split('T')[0];
        const finalFilename = `${filename}_${dateStr}`;

        try {
            const result = await ExportToExcel(exportData, finalFilename);
            
            if (!result) {
                return;
            }

            console.log('Archivo exportado exitosamente:', result);
        } catch (error) {
            console.error('Error al exportar archivo:', error);
            alert('Error al exportar el archivo. Verifica la consola para más detalles.');
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