import React, { useState } from 'react';
import FilterBar from './FilterBar';
import MetricsSummary from './MetricsSummary';
import TrafficChart from './TrafficChart';
import GponTable from './GponTable';
import OntTable from './OntTable';
import { getGponTraffic, getDetailedOntTraffic } from '../services/api';

const processGponData = (rawData) => {
    const tableData = [];
    const globalChartTrafficMap = new Map();
    const globalChartVolumeMap = new Map();

    let globalTotalBytesIn = 0;
    let globalTotalBytesOut = 0;
    let globalAvgBpsInSum = 0;
    let globalAvgBpsOutSum = 0;

    Object.entries(rawData).forEach(([gponIdx, measurements]) => {
        if (!measurements || measurements.length === 0) return;

        const interfaceName = measurements[0].gpon_interface || `GPON ${gponIdx}`;
        const dailyBlocks = new Map();

        measurements.forEach(m => {
            const timeStr = m.time || m.hour;
            if (!m || !timeStr) return;
            const hourStr = timeStr.substring(11, 13);
            const hours = parseInt(hourStr, 10);
            const dateOnlyStr = timeStr.substring(0, 10);
            const isMidnight = hours === 0;

            const blockDate = new Date(dateOnlyStr + "T12:00:00Z");
            if (isMidnight) {
                blockDate.setUTCDate(blockDate.getUTCDate() - 1);
            }
            const dateStr = blockDate.toISOString().split('T')[0];

            if (!dailyBlocks.has(dateStr)) {
                dailyBlocks.set(dateStr, { bpsInSum: 0, bpsOutSum: 0, count: 0, volumeIn: null, volumeOut: null });
            }

            const bpsInVal = m.total_bps_in || 0;
            const bpsOutVal = m.total_bps_out || 0;

            // Reject impossible data (BPS > 2.5 Gbps)
            if (bpsInVal > 2.5e9 || bpsOutVal > 2.5e9) return;

            const block = dailyBlocks.get(dateStr);

            if (hours >= 19 && hours <= 23) {
                block.bpsInSum += bpsInVal;
                block.bpsOutSum += bpsOutVal;
                block.count += 1;
            }

            if (hours === 0) {
                block.volumeIn = m.total_bytes_in || 0;
                block.volumeOut = m.total_bytes_out || 0;
            }
        });

        let gponTotalVolumeIn = 0;
        let gponTotalVolumeOut = 0;
        let gponSumOfAvgBpsIn = 0;
        let gponSumOfAvgBpsOut = 0;
        let validDaysCount = 0;
        let validVolumeDaysCount = 0;

        dailyBlocks.forEach((block, dateStr) => {
            if (block.count > 0) {
                const dayAvgBpsIn = block.bpsInSum / block.count;
                const dayAvgBpsOut = block.bpsOutSum / block.count;

                gponSumOfAvgBpsIn += dayAvgBpsIn;
                gponSumOfAvgBpsOut += dayAvgBpsOut;
                validDaysCount += 1;

                if (!globalChartTrafficMap.has(dateStr)) {
                    globalChartTrafficMap.set(dateStr, { bpsIn: 0, bpsOut: 0 });
                }
                const gTraffic = globalChartTrafficMap.get(dateStr);
                gTraffic.bpsIn += dayAvgBpsIn;
                gTraffic.bpsOut += dayAvgBpsOut;
            }

            if (block.volumeIn !== null) {
                gponTotalVolumeIn += block.volumeIn;
                gponTotalVolumeOut += block.volumeOut;
                validVolumeDaysCount += 1;

                if (!globalChartVolumeMap.has(dateStr)) {
                    globalChartVolumeMap.set(dateStr, { vIn: 0, vOut: 0 });
                }
                const gVolume = globalChartVolumeMap.get(dateStr);
                gVolume.vIn += block.volumeIn;
                gVolume.vOut += block.volumeOut;
            }
        });

        const avgBpsIn = validDaysCount > 0 ? (gponSumOfAvgBpsIn / validDaysCount) : 0;
        const avgBpsOut = validDaysCount > 0 ? (gponSumOfAvgBpsOut / validDaysCount) : 0;
        const avgVolumeIn = validVolumeDaysCount > 0 ? (gponTotalVolumeIn / validVolumeDaysCount) : 0;
        const avgVolumeOut = validVolumeDaysCount > 0 ? (gponTotalVolumeOut / validVolumeDaysCount) : 0;

        tableData.push({
            gponIdx,
            interfaceName,
            avgBpsIn,
            avgBpsOut,
            avgBytesIn: avgVolumeIn,
            avgBytesOut: avgVolumeOut,
            totalBytesIn: gponTotalVolumeIn,
            totalBytesOut: gponTotalVolumeOut
        });

        globalTotalBytesIn += gponTotalVolumeIn;
        globalTotalBytesOut += gponTotalVolumeOut;
        globalAvgBpsInSum += avgBpsIn;
        globalAvgBpsOutSum += avgBpsOut;
    });

    const gponCount = tableData.length;
    const globalSummary = {
        avgBpsIn: gponCount > 0 ? globalAvgBpsInSum : 0,
        avgBpsOut: gponCount > 0 ? globalAvgBpsOutSum : 0,
        totalBytesIn: globalTotalBytesIn,
        totalBytesOut: globalTotalBytesOut
    };

    const chartTraffic = Array.from(globalChartTrafficMap.keys()).sort().map(date => ({
        date,
        valueIn: globalChartTrafficMap.get(date).bpsIn,
        valueOut: globalChartTrafficMap.get(date).bpsOut
    }));

    const chartVolume = Array.from(globalChartVolumeMap.keys()).sort().map(date => ({
        date,
        valueIn: globalChartVolumeMap.get(date).vIn,
        valueOut: globalChartVolumeMap.get(date).vOut
    }));

    return {
        tableData,
        globalSummary,
        globalChartTraffic: chartTraffic,
        globalChartVolume: chartVolume,
        rawData
    };
};

const processDetailedOntData = (rawData) => {
    const timeMap = new Map();

    Object.values(rawData).forEach(measurements => {
        if (!measurements) return;
        measurements.forEach(m => {
            const timeStr = m.time || m.hour;
            if (!m || !timeStr) return;
            const bpsInVal = m.bps_in || 0;
            const bpsOutVal = m.bps_out || 0;

            // Reject impossible data for ONT as well (BPS > 2.5 Gbps)
            if (bpsInVal > 2.5e9 || bpsOutVal > 2.5e9) return;

            if (!timeMap.has(timeStr)) {
                timeMap.set(timeStr, { bps_in: 0, bps_out: 0, bytes_in: 0, bytes_out: 0 });
            }
            const t = timeMap.get(timeStr);
            t.bps_in += bpsInVal;
            t.bps_out += bpsOutVal;
            t.bytes_in += (m.bytes_in || 0);
            t.bytes_out += (m.bytes_out || 0);
        });
    });

    const dailyBlocks = new Map();
    let totalBytesIn = 0;
    let totalBytesOut = 0;
    let sumAvgBpsIn = 0;
    let sumAvgBpsOut = 0;
    let validDaysCount = 0;

    timeMap.forEach((m, timeStr) => {
        const hourStr = timeStr.substring(11, 13);
        const hours = parseInt(hourStr, 10);
        const dateOnlyStr = timeStr.substring(0, 10);
        const isMidnight = hours === 0;

        const blockDate = new Date(dateOnlyStr + "T12:00:00Z");
        if (isMidnight) blockDate.setUTCDate(blockDate.getUTCDate() - 1);
        const dateStr = blockDate.toISOString().split('T')[0];

        if (!dailyBlocks.has(dateStr)) {
            dailyBlocks.set(dateStr, { bpsInSum: 0, bpsOutSum: 0, count: 0, volumeIn: null, volumeOut: null });
        }
        const block = dailyBlocks.get(dateStr);

        if (hours >= 19 && hours <= 23) {
            block.bpsInSum += m.bps_in;
            block.bpsOutSum += m.bps_out;
            block.count += 1;
        }

        if (hours === 0) {
            block.volumeIn = m.bytes_in;
            block.volumeOut = m.bytes_out;
        }
    });

    const chartTrafficMap = new Map();
    const chartVolumeMap = new Map();

    dailyBlocks.forEach((block, dateStr) => {
        if (block.count > 0) {
            const dayAvgIn = block.bpsInSum / block.count;
            const dayAvgOut = block.bpsOutSum / block.count;
            chartTrafficMap.set(dateStr, { in: dayAvgIn, out: dayAvgOut });
            sumAvgBpsIn += dayAvgIn;
            sumAvgBpsOut += dayAvgOut;
            validDaysCount += 1;
        }
        if (block.volumeIn !== null) {
            totalBytesIn += block.volumeIn;
            totalBytesOut += block.volumeOut;
            chartVolumeMap.set(dateStr, { in: block.volumeIn, out: block.volumeOut });
        }
    });

    const chartTraffic = Array.from(chartTrafficMap.keys()).sort().map(date => ({
        date,
        valueIn: chartTrafficMap.get(date).in,
        valueOut: chartTrafficMap.get(date).out
    }));

    const chartVolume = Array.from(chartVolumeMap.keys()).sort().map(date => ({
        date,
        valueIn: chartVolumeMap.get(date).in,
        valueOut: chartVolumeMap.get(date).out
    }));

    const avgBpsIn = validDaysCount > 0 ? sumAvgBpsIn / validDaysCount : 0;
    const avgBpsOut = validDaysCount > 0 ? sumAvgBpsOut / validDaysCount : 0;

    const ontTableData = [];

    Object.entries(rawData).forEach(([ontIdx, measurements]) => {
        if (!measurements || measurements.length === 0) return;

        const infoPoint = measurements[measurements.length - 1];
        const status = infoPoint.status;
        const desp = infoPoint.desp || `ONT ${ontIdx}`;
        const sn = infoPoint.serial_number;
        const plan = infoPoint.plan;
        const distance = infoPoint.olt_distance;

        const dailyBlocks = new Map();

        measurements.forEach(m => {
            const timeStr = m.time || m.hour;
            if (!m || !timeStr) return;
            const bpsInVal = m.bps_in || 0;
            const bpsOutVal = m.bps_out || 0;

            if (bpsInVal > 2.5e9 || bpsOutVal > 2.5e9) return;

            const hourStr = timeStr.substring(11, 13);
            const hours = parseInt(hourStr, 10);
            const dateOnlyStr = timeStr.substring(0, 10);
            const isMidnight = hours === 0;

            const blockDate = new Date(dateOnlyStr + "T12:00:00Z");
            if (isMidnight) blockDate.setUTCDate(blockDate.getUTCDate() - 1);
            const dateStr = blockDate.toISOString().split('T')[0];

            if (!dailyBlocks.has(dateStr)) {
                dailyBlocks.set(dateStr, { bpsInSum: 0, bpsOutSum: 0, count: 0, volumeIn: null, volumeOut: null });
            }
            const block = dailyBlocks.get(dateStr);

            if (hours >= 19 && hours <= 23) {
                block.bpsInSum += bpsInVal;
                block.bpsOutSum += bpsOutVal;
                block.count += 1;
            }

            if (hours === 0) {
                block.volumeIn = m.bytes_in || 0;
                block.volumeOut = m.bytes_out || 0;
            }
        });

        let totalVolumeIn = 0;
        let totalVolumeOut = 0;
        let pSumAvgBpsIn = 0;
        let pSumAvgBpsOut = 0;
        let pValidDaysCount = 0;
        let pValidVolumeDaysCount = 0;

        dailyBlocks.forEach((block) => {
            if (block.count > 0) {
                pSumAvgBpsIn += (block.bpsInSum / block.count);
                pSumAvgBpsOut += (block.bpsOutSum / block.count);
                pValidDaysCount += 1;
            }
            if (block.volumeIn !== null) {
                totalVolumeIn += block.volumeIn;
                totalVolumeOut += block.volumeOut;
                pValidVolumeDaysCount += 1;
            }
        });

        ontTableData.push({
            ontIdx,
            desp,
            sn,
            plan,
            distance,
            status,
            avgBpsIn: pValidDaysCount > 0 ? (pSumAvgBpsIn / pValidDaysCount) : 0,
            avgBpsOut: pValidDaysCount > 0 ? (pSumAvgBpsOut / pValidDaysCount) : 0,
            avgBytesIn: pValidVolumeDaysCount > 0 ? (totalVolumeIn / pValidVolumeDaysCount) : 0,
            avgBytesOut: pValidVolumeDaysCount > 0 ? (totalVolumeOut / pValidVolumeDaysCount) : 0,
            totalBytesIn: totalVolumeIn,
            totalBytesOut: totalVolumeOut
        });
    });

    return {
        tableData: ontTableData,
        summary: {
            avgBpsIn,
            avgBpsOut,
            totalBytesIn,
            totalBytesOut
        },
        chartTraffic,
        chartVolume,
        rawData
    };
};


const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Data States
    const [globalData, setGlobalData] = useState(null); // The processed result of all GPONs

    // Selection States
    const [selectedGpon, setSelectedGpon] = useState(null);
    const [selectedGponData, setSelectedGponData] = useState(null);
    const [selectedOnt, setSelectedOnt] = useState(null);

    // Filter memory
    const [currentFilters, setCurrentFilters] = useState(null);

    const fetchGlobalData = async (filters) => {
        setIsLoading(true);
        setError(null);
        setSelectedGpon(null);
        setSelectedOnt(null);
        setSelectedGponData(null);
        setCurrentFilters(filters);

        try {
            const data = await getGponTraffic(filters.ip, filters.initDateStr, filters.endDateStr);
            const processed = processGponData(data);
            setGlobalData(processed);
        } catch (err) {
            setError(err.message || 'Error loading OLT data');
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
            return;
        }

        setSelectedGpon(gponIdx);
        setSelectedOnt(null);
        setIsLoading(true);
        setError(null);

        try {
            const data = await getDetailedOntTraffic(currentFilters.ip, gponIdx, currentFilters.initDateStr, currentFilters.endDateStr);
            const processed = processDetailedOntData(data);
            setSelectedGponData(processed);
        } catch (err) {
            setError(err.message || 'Error loading GPON specific data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOntClick = (ontIdx) => {
        if (selectedOnt === ontIdx) {
            setSelectedOnt(null);
            return;
        }
        setSelectedOnt(ontIdx);
    };

    // Build drill-down properties
    let chartsTraffic = globalData?.globalChartTraffic || [];
    let chartsVolume = globalData?.globalChartVolume || [];
    let summaryObj = globalData?.globalSummary || null;
    let currentScope = 'OLT';

    if (selectedOnt && selectedGponData) {
        // Isolate single ONT data reusing processDetailedOntData locally
        const fakeRawData = {};
        fakeRawData[selectedOnt] = selectedGponData.rawData[selectedOnt];
        const isolatedOntData = processDetailedOntData(fakeRawData);
        chartsTraffic = isolatedOntData.chartTraffic;
        chartsVolume = isolatedOntData.chartVolume;
        summaryObj = isolatedOntData.summary;
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
                    GoONT Traffic Dashboard
                </h1>
            </header>

            <main className="dashboard-content" style={{ position: 'relative' }}>
                {isLoading && (
                    <div className="loading-overlay">
                        <div className="loading-content">
                            <svg className="spinner" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                            <span>Processing measurements...</span>
                        </div>
                    </div>
                )}

                <FilterBar onApplyFilter={fetchGlobalData} isLoading={isLoading} />

                {currentFilters && (
                    <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '8px', color: 'var(--text-muted)', alignItems: 'center' }}>
                        <span
                            style={{ cursor: 'pointer', color: selectedGpon ? 'var(--accent-color)' : 'var(--text-main)', textDecoration: selectedGpon ? 'underline' : 'none' }}
                            onClick={() => { setSelectedGpon(null); setSelectedOnt(null); setSelectedGponData(null); }}
                        >
                            {oltLabel}
                        </span>
                        {selectedGpon && (
                            <>
                                <span>/</span>
                                <span
                                    style={{ cursor: 'pointer', color: selectedOnt ? 'var(--accent-color)' : 'var(--text-main)', textDecoration: selectedOnt ? 'underline' : 'none' }}
                                    onClick={() => setSelectedOnt(null)}
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
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '0.5rem' }}>No Data Found for Selected Range</h3>
                        <p style={{ color: 'var(--text-muted)' }}>The server answered successfully, but there were no traffic measurements in the dates you selected. Please try expanding your date range to include March 18th (when testing mock data).</p>
                    </div>
                )}

                {globalData && !error && globalData.tableData.length > 0 && (
                    <>
                        <MetricsSummary
                            data={summaryObj}
                            selectedGpon={selectedGpon}
                            scope={currentScope}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                            <TrafficChart
                                data={chartsTraffic}
                                title={currentScope === 'ONT' ? `Traffic Trend (bps) - ${ontLabel}` : currentScope === 'GPON' ? `Traffic Trend (bps) - ${gponLabel}` : 'Global Traffic Trend (bps)'}
                                isTraffic={true}
                            />
                            <TrafficChart
                                data={chartsVolume}
                                title={currentScope === 'ONT' ? `Volume Trend (Bytes) - ${ontLabel}` : currentScope === 'GPON' ? `Volume Trend (Bytes) - ${gponLabel}` : 'Global Volume Trend (Bytes)'}
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
