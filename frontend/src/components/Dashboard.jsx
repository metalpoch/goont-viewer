import React, { useState } from 'react';
import FilterBar from './FilterBar';
import MetricsSummary from './MetricsSummary';
import TrafficChart from './TrafficChart';
import GponTable from './GponTable';
import OntTable from './OntTable';
import TopConsumers from './TopConsumers';
import HelpModal from './HelpModal';
import { getGponTraffic, getDetailedOntTraffic, getSpecificOntTraffic } from '../services/api';




const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data States
  const [globalData, setGlobalData] = useState(null); // The processed result of all GPONs

  // Selection States
  const [selectedGpon, setSelectedGpon] = useState(null);
  const [selectedGponData, setSelectedGponData] = useState(null);
  const [selectedOnt, setSelectedOnt] = useState(null);
  const [selectedOntData, setSelectedOntData] = useState(null);

  // Filter memory
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
      // Deselect
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

  // Build drill-down properties
  let chartsTraffic = globalData?.globalChartTraffic || [];
  let chartsVolume = globalData?.globalChartVolume || [];
  let summaryObj = globalData?.globalSummary || null;
  let currentScope = 'OLT';

  if (selectedOnt && selectedOntData) {
    chartsTraffic = selectedOntData.chartTraffic;
    chartsVolume = selectedOntData.chartVolume;
    summaryObj = selectedOntData.summary;
    currentScope = 'ONT';
  } else if (selectedGponData) {
    chartsTraffic = selectedGponData.chartTraffic;
    chartsVolume = selectedGponData.chartVolume;
    summaryObj = selectedGponData.summary;
    currentScope = 'GPON';
  }

  // Breadcrumb labels
  const oltLabel = `${currentFilters?.name || 'OLT'} (${currentFilters?.ip || 'IP'})`;
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
        <h1 className="dashboard-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
          Panel de Tráfico GoONT
        </h1>
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

        {currentFilters && (
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '8px', color: 'var(--text-muted)', alignItems: 'center' }}>
            <span
              style={{ cursor: 'pointer', color: selectedGpon ? 'var(--accent-color)' : 'var(--text-main)', textDecoration: selectedGpon ? 'underline' : 'none' }}
              onClick={() => { setSelectedGpon(null); setSelectedOnt(null); setSelectedGponData(null); setSelectedOntData(null); }}
            >
              {oltLabel}
            </span>
            {selectedGpon && (
              <>
                <span>/</span>
                <span
                  style={{ cursor: 'pointer', color: selectedOnt ? 'var(--accent-color)' : 'var(--text-main)', textDecoration: selectedOnt ? 'underline' : 'none' }}
                  onClick={() => { setSelectedOnt(null); setSelectedOntData(null); }}
                >
                  GPON Summary {gponLabel}
                </span>
              </>
            )}
            {selectedOnt && (
              <>
                <span>/</span>
                <span style={{ color: 'var(--text-main)' }}>
                  {ontLabel}
                </span>
              </>
            )}
          </div>
        )}



        {error && (
          <div className="glass-panel" style={{ padding: '1rem', borderLeft: '4px solid var(--danger)', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            <p style={{ color: 'var(--danger)', fontWeight: 500 }}>{error}</p>
          </div>
        )}

        {globalData && !error && globalData.tableData.length === 0 && (
          <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', marginTop: '2rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto 1rem' }}><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>Sin Datos para el Rango Seleccionado</h3>
            <p style={{ color: 'var(--text-muted)' }}>El servidor respondió exitosamente, pero no se encontraron registros de volumen para las fechas dadas. Prueba expandir los días a evaluar (ej. incluye el 18 de Marzo).</p>
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
                title={currentScope === 'ONT' ? `Tendencia de Tráfico (bps) - ${ontLabel}` : currentScope === 'GPON' ? `Tendencia de Tráfico (bps) - ${gponLabel}` : 'Tendencia de Tráfico Global (bps)'}
                isTraffic={true}
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

export default Dashboard;
