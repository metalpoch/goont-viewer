import React from 'react';

const formatBps = (bps) => {
    if (bps === undefined || isNaN(bps)) return '0 bps';
    if (bps > 1e9) return (bps / 1e9).toFixed(2) + ' Gbps';
    if (bps > 1e6) return (bps / 1e6).toFixed(2) + ' Mbps';
    if (bps > 1e3) return (bps / 1e3).toFixed(2) + ' Kbps';
    return bps.toFixed(0) + ' bps';
};

const formatBytes = (bytes) => {
    if (bytes === undefined || isNaN(bytes)) return '0 B';
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + ' TB';
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
    return bytes.toFixed(0) + ' B';
};

const GponTable = ({ data, onRowClick, selectedGpon }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="glass-panel table-container">
            <h2 className="section-title">GPON Interfaces Summary</h2>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Interface</th>
                        <th>Avg Traffic (In)</th>
                        <th>Avg Traffic (Out)</th>
                        <th>Avg Volume (In)</th>
                        <th>Avg Volume (Out)</th>
                        <th>Total Volume (In)</th>
                        <th>Total Volume (Out)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr
                            key={row.gponIdx}
                            onClick={() => onRowClick(row.gponIdx)}
                            className={selectedGpon === row.gponIdx ? 'selected' : ''}
                        >
                            <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                {row.interfaceName} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({row.gponIdx})</span>
                            </td>
                            <td>{formatBps(row.avgBpsIn)}</td>
                            <td>{formatBps(row.avgBpsOut)}</td>
                            <td>{formatBytes(row.avgBytesIn)}</td>
                            <td>{formatBytes(row.avgBytesOut)}</td>
                            <td>{formatBytes(row.totalBytesIn)}</td>
                            <td>{formatBytes(row.totalBytesOut)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GponTable;
