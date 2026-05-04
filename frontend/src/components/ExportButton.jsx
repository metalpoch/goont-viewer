import { Download } from 'lucide-react';
import { ExportToExcel } from '../../wailsjs/go/main/App';

const ExportButton = ({ data, columns, filename, buttonText = "Exportar Excel", sheets = [], oltName = 'OLT', oltIp = '', selectedGpon = null, gponInterfaceName = null, selectedOnt = null, currentScope = 'OLT' }) => {
    const sanitizeFilename = (str) => {
        if (!str) return str;
        return str.replace(/[\s/\\]/g, '_');
    };

    const getDeviceLabel = () => {
        if (currentScope === 'ONT' && selectedOnt !== null && selectedGpon !== null && data.length > 0) {
            const ont = data[0];
            const ontSerial = ont.sn || selectedOnt;
            return `${oltName}_gpon_${sanitizeFilename(gponInterfaceName || selectedGpon)}_${ontSerial}`;
        } else if (currentScope === 'GPON' && selectedGpon !== null) {
            return `${oltName}_gpon_${sanitizeFilename(gponInterfaceName || selectedGpon)}`;
        } else if (currentScope === 'OLT' && oltName) {
            return `${oltName}`;
        }
        return oltName || 'OLT';
    };

    const getFilename = () => {
        if (oltName && oltName !== 'OLT') {
            return `goont_${getDeviceLabel()}`;
        }
        return filename || `goont_export`;
    };

    const exportToExcel = async () => {
        if ((!data || data.length === 0) && sheets.length === 0) return;

        const exportData = {
            data: [],
            sheets: []
        };

        if (data && data.length > 0 && columns) {
            const deviceLabel = getDeviceLabel();
            const excelData = data.map(row => {
                const excelRow = {};
                columns.forEach(col => {
                    if (col.key === 'dispositivo') {
                        excelRow[col.header] = deviceLabel;
                    } else if (col.key in row) {
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
        const finalFilename = `${getFilename()}_${dateStr}`;

        const columnOrder = columns.map(col => col.header);

        try {
            const result = await ExportToExcel({ ...exportData, columnOrder }, finalFilename);
            
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