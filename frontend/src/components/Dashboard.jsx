import { useState } from 'react';
import FilterBar from './FilterBar';
import MetricsSummary from './MetricsSummary';
import TrafficChart from './TrafficChart';
import GponTable from './GponTable';
import OntTable from './OntTable';
import TopConsumers from './TopConsumers';
import HelpModal from './HelpModal';
import ExportButton from './ExportButton';
import { getGponTraffic, getDetailedOntTraffic, getSpecificOntTraffic } from '../services/api';

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [globalData, setGlobalData] = useState(null);
  const [selectedGpon, setSelectedGpon] = useState(null);
  const [selectedGponData, setSelectedGponData] = useState(null);
  const [selectedOnt, setSelectedOnt] = useState(null);
  const [selectedOntData, setSelectedOntData] = useState(null);
  const [currentFilters, setCurrentFilters] = useState(null);

  const fetchGlobalData = async (filters) => {
    setIsLoading(true);
    setError(null);
    setSelectedGpon(null);
    setSelectedOnt(null);
    setSelectedGponData(null);
    setSelectedOntData(null);
    setCurrentFilters(filters);

    try {
      const processed = await getGponTraffic(filters.ip, filters.initDateStr, filters.endDateStr);
      setGlobalData(processed);
    } catch (err) {
      setError(err.message || 'Error cargando datos de la OLT');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGponClick = async (gponIdx) => {
    if (selectedGpon === gponIdx) {
      setSelectedGpon(null);
      setSelectedOnt(null);
      setSelectedGponData(null);
      setSelectedOntData(null);
      return;
    }

    setSelectedGpon(gponIdx);
    setSelectedOnt(null);
    setIsLoading(true);
    setError(null);

    try {
      const processed = await getDetailedOntTraffic(currentFilters.ip, gponIdx, currentFilters.initDateStr, currentFilters.endDateStr);
      setSelectedGponData(processed);
    } catch (err) {
      setError(err.message || 'Error cargando datos específicos de GPON');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOntClick = async (ontIdx) => {
    if (selectedOnt === ontIdx) {
      setSelectedOnt(null);
      setSelectedOntData(null);
      return;
    }

    setSelectedOnt(ontIdx);
    setSelectedOntData(null);
    setIsLoading(true);
    setError(null);

    try {
      const processed = await getSpecificOntTraffic(currentFilters.ip, selectedGpon, ontIdx, currentFilters.initDateStr, currentFilters.endDateStr);
      setSelectedOntData(processed);
    } catch (err) {
      setError(err.message || 'Error cargando datos específicos de ONT');
    } finally {
      setIsLoading(false);
    }
  };

  let chartsTraffic = globalData?.globalChartTraffic || [];
  let chartsTrafficDaily = globalData?.globalChartTrafficDaily || [];
  let chartsVolume = globalData?.globalChartVolume || [];
  let summaryObj = globalData?.globalSummary || null;
  let currentScope = 'OLT';

  if (selectedOnt && selectedOntData) {
    chartsTraffic = selectedOntData.chartTraffic;
    chartsTrafficDaily = selectedOntData.chartTrafficDaily || [];
    chartsVolume = selectedOntData.chartVolume;
    summaryObj = selectedOntData.summary;
    currentScope = 'ONT';
  } else if (selectedGponData) {
    chartsTraffic = selectedGponData.chartTraffic;
    chartsTrafficDaily = selectedGponData.chartTrafficDaily || [];
    chartsVolume = selectedGponData.chartVolume;
    summaryObj = selectedGponData.summary;
    currentScope = 'GPON';
  }

  const getExportColumns = () => {
    const oltColumn = { key: 'oltName', header: 'OLT' };
    if (currentScope === 'ONT') {
      return [
        oltColumn,
        { key: 'ontIdx', header: 'ID ONT' },
        { key: 'desp', header: 'Cliente ONT' },
        { key: 'sn', header: 'Serial' },
        { key: 'status', header: 'Estado' },
        { key: 'avgBpsIn', header: 'Tráfico Prom. Bajada (bps)' },
        { key: 'avgBpsOut', header: 'Tráfico Prom. Subida (bps)' },
        { key: 'plan', header: 'Plan' },
        { key: 'distance', header: 'Distancia (m)' },
        { key: 'totalBytesIn', header: 'Volumen Total Bajada (bytes)' },
        { key: 'totalBytesOut', header: 'Volumen Total Subida (bytes)' },
        { key: 'avgBytesIn', header: 'Volumen Prom. Bajada (bytes)' },
        { key: 'avgBytesOut', header: 'Volumen Prom. Subida (bytes)' }
      ];
    } else if (currentScope === 'GPON') {
      return [
        oltColumn,
        { key: 'ontIdx', header: 'ID ONT' },
        { key: 'desp', header: 'Cliente ONT' },
        { key: 'sn', header: 'Serial' },
        { key: 'status', header: 'Estado' },
        { key: 'avgBpsIn', header: 'Tráfico Prom. Bajada (bps)' },
        { key: 'avgBpsOut', header: 'Tráfico Prom. Subida (bps)' },
        { key: 'plan', header: 'Plan' },
        { key: 'distance', header: 'Distancia (m)' },
        { key: 'totalBytesIn', header: 'Volumen Total Bajada (bytes)' },
        { key: 'totalBytesOut', header: 'Volumen Total Subida (bytes)' },
        { key: 'avgBytesIn', header: 'Volumen Prom. Bajada (bytes)' },
        { key: 'avgBytesOut', header: 'Volumen Prom. Subida (bytes)' }
      ];
    } else {
      return [
        oltColumn,
        { key: 'gponIdx', header: 'ID GPON' },
        { key: 'interfaceName', header: 'Interfaz' },
        { key: 'avgBpsIn', header: 'Tráfico Prom. Bajada (bps)' },
        { key: 'avgBpsOut', header: 'Tráfico Prom. Subida (bps)' },
        { key: 'avgBytesIn', header: 'Volumen Prom. Bajada (bytes)' },
        { key: 'avgBytesOut', header: 'Volumen Prom. Subida (bytes)' },
        { key: 'totalBytesIn', header: 'Volumen Total Bajada (bytes)' },
        { key: 'totalBytesOut', header: 'Volumen Total Subida (bytes)' }
      ];
    }
  };

  const getChartSheets = () => {
    const sheets = [];
    
    if (chartsTraffic && chartsTraffic.length > 0) {
      sheets.push({
        name: 'Gráfica_Tráfico_19_23h',
        data: chartsTraffic.map(item => ({
          Fecha: item.date,
          'Tráfico_Bajada_bps': item.valueIn,
          'Tráfico_Subida_bps': item.valueOut
        }))
      });
    }
    
    if (chartsTrafficDaily && chartsTrafficDaily.length > 0) {
      sheets.push({
        name: 'Gráfica_Tráfico_00h',
        data: chartsTrafficDaily.map(item => ({
          Fecha: item.date,
          'Tráfico_Bajada_bps': item.valueIn,
          'Tráfico_Subida_bps': item.valueOut
        }))
      });
    }
    
    if (chartsVolume && chartsVolume.length > 0) {
      sheets.push({
        name: 'Gráfica_Volumen',
        data: chartsVolume.map(item => ({
          Fecha: item.date,
          'Volumen_Bajada_bytes': item.valueIn,
          'Volumen_Subida_bytes': item.valueOut
        }))
      });
    }
    
    return sheets;
  };

  const oltLabel = `${currentFilters?.name || 'OLT'}${currentFilters?.location ? ` - ${currentFilters.location}` : ''} (${currentFilters?.ip || 'IP'})`;
  let gponLabel = '';
  let ontLabel = '';

  if (selectedGpon && globalData) {
    const gItem = globalData.tableData.find(g => g.gponIdx === selectedGpon);
    gponLabel = gItem ? `${gItem.interfaceName} (${selectedGpon})` : `GPON ${selectedGpon}`;
  }
  if (selectedOnt && selectedGponData && selectedGponData.tableData) {
    const oItem = selectedGponData.tableData.find(o => o.ontIdx === selectedOnt);
    ontLabel = oItem ? `${oItem.desp} (${oItem.sn})` : `ONT ${selectedOnt}`;
  }

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
            Panel de Tráfico
          </h1>
          {currentFilters && (
            <nav className="header-breadcrumb">
              <span
                className={`breadcrumb-item${!selectedGpon ? ' active' : ''}`}
                onClick={() => { setSelectedGpon(null); setSelectedOnt(null); setSelectedGponData(null); setSelectedOntData(null); }}
              >
                {oltLabel}
              </span>
              {selectedGpon && (
                <>
                  <span className="breadcrumb-sep">›</span>
                  <span
                    className={`breadcrumb-item${!selectedOnt ? ' active' : ''}`}
                    onClick={() => { setSelectedOnt(null); setSelectedOntData(null); }}
                  >
                    {gponLabel}
                  </span>
                </>
              )}
              {selectedOnt && (
                <>
                  <span className="breadcrumb-sep">›</span>
                  <span className="breadcrumb-item active">{ontLabel}</span>
                </>
              )}
            </nav>
          )}
        </div>
        {globalData && !error && globalData.tableData.length > 0 && (
          <ExportButton
            data={(currentScope === 'ONT' ? selectedGponData?.tableData?.filter(o => o.ontIdx === selectedOnt) || [] : 
                  currentScope === 'GPON' ? selectedGponData?.tableData || [] : 
                  globalData.tableData).map(row => ({ ...row, oltName: currentFilters?.name || '' }))}
            columns={getExportColumns()}
            filename={`${(currentFilters?.name || 'OLT').replace(/[^a-zA-Z0-9_\u00f1\u00d1\s-]/g, '').trim().replace(/\s+/g, '_')}_goont_export_${currentScope.toLowerCase()}`}
            buttonText="Exportar Todo a Excel"
            sheets={getChartSheets()}
          />
        )}
      </header>

      <main className="dashboard-content" style={{ position: 'relative' }}>
        <HelpModal />
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
              <span>Procesando mediciones...</span>
            </div>
          </div>
        )}

        <FilterBar onApplyFilter={fetchGlobalData} isLoading={isLoading} />

        {error && (
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {globalData && !error && globalData.tableData.length === 0 && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Sin Datos para el Rango Seleccionado</h3>
            <p style={{ color: 'var(--text-muted)' }}>El servidor respondió exitosamente, pero no se encontraron registros de volumen para las fechas dadas.</p>
          </div>
        )}

        {globalData && !error && globalData.tableData.length > 0 && (
          <>
            <MetricsSummary
              data={summaryObj}
              selectedGpon={selectedGpon}
              scope={currentScope}
            />

            {currentScope !== 'ONT' && (
              <TopConsumers
                data={currentScope === 'GPON' ? selectedGponData.tableData : globalData.tableData}
                title={currentScope === 'GPON' ? `Top 5 Clientes en GPON` : `Top 5 GPONs por Volumen`}
                type={currentScope === 'GPON' ? 'ONT' : 'GPON'}
                onBarClick={currentScope === 'GPON' ? handleOntClick : handleGponClick}
              />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
              <TrafficChart
                data={chartsTraffic}
                dailyData={chartsTrafficDaily}
                title={currentScope === 'ONT' ? `Tendencia de Tráfico (bps) - ${ontLabel}` : currentScope === 'GPON' ? `Tendencia de Tráfico (bps) - ${gponLabel}` : 'Tendencia de Tráfico Global (bps)'}
                isTraffic={true}
                showPeakPoints={true}
              />
              <TrafficChart
                data={chartsVolume}
                title={currentScope === 'ONT' ? `Tendencia de Volumen (Bytes) - ${ontLabel}` : currentScope === 'GPON' ? `Tendencia de Volumen (Bytes) - ${gponLabel}` : 'Tendencia de Volumen Global (Bytes)'}
                isTraffic={false}
              />
            </div>

            {!selectedGpon ? (
              <GponTable
                data={globalData.tableData}
                onRowClick={handleGponClick}
                selectedGpon={selectedGpon}
              />
            ) : (
              selectedGponData && selectedGponData.tableData && (
                <OntTable
                  data={selectedGponData.tableData}
                  selectedGpon={selectedGpon}
                  onRowClick={handleOntClick}
                  selectedOnt={selectedOnt}
                />
              )
            )}
          </>
        )}
      </main>
    </div>
  );
};
