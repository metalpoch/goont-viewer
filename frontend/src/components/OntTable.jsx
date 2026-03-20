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

const OntTable = ({ data, selectedGpon, onRowClick, selectedOnt }) => {
    if (!data || data.length === 0) return null;

    return (
        <div className="glass-panel table-container">
            <h2 className="section-title">ONT Breakdown (GPON {selectedGpon})</h2>
            <table className="data-table">
                <thead>
                    <tr>
                        <th>ONT</th>
                        <th>Device Info</th>
                        <th>Avg Traffic (In)</th>
                        <th>Avg Traffic (Out)</th>
                        <th>Location/Plan</th>
                        <th>Total Volume (In)</th>
                        <th>Total Volume (Out)</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((row) => (
                        <tr
                            key={row.ontIdx}
                            onClick={() => onRowClick && onRowClick(row.ontIdx)}
                            className={selectedOnt === row.ontIdx ? 'selected' : ''}
                            style={{ cursor: 'pointer' }}
                        >
                            <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                                {row.desp} <br />
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>IDX: {row.ontIdx}</span>
                            </td>
                            <td>
                                <div>{row.sn}</div>
                                <div style={{ fontSize: '0.8rem', color: row.status === 1 ? 'var(--success)' : 'var(--text-muted)' }}>
                                    {row.status === 1 ? 'Active' : 'Down/Offline'}
                                </div>
                            </td>
                            <td>{formatBps(row.avgBpsIn)}</td>
                            <td>{formatBps(row.avgBpsOut)}</td>
                            <td>
                                <div>{row.plan || 'N/A'}</div>
                                {row.distance !== undefined && row.distance !== -1 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.distance}m</div>}
                            </td>
                            <td>
                                {formatBytes(row.totalBytesIn)}<br />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>avg: {formatBytes(row.avgBytesIn)}</span>
                            </td>
                            <td>
                                {formatBytes(row.totalBytesOut)}<br />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>avg: {formatBytes(row.avgBytesOut)}</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OntTable;
