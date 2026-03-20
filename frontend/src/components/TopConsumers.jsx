import React, { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const formatBytes = (bytes) => {
    if (bytes === undefined || isNaN(bytes)) return '0 B';
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(2) + ' TB';
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
    return bytes.toFixed(0) + ' B';
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color, margin: '0.25rem 0' }}>
                        {entry.name}: {formatBytes(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const TopConsumers = ({ data, title, type = 'GPON' }) => {
    const topData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const sorted = [...data].sort((a, b) => {
            const volA = (a.totalBytesIn || 0) + (a.totalBytesOut || 0);
            const volB = (b.totalBytesIn || 0) + (b.totalBytesOut || 0);
            return volB - volA; // descending
        });

        // Take Top 5
        const top5 = sorted.slice(0, 5);

        return top5.map(item => {
            let label = '';
            if (type === 'GPON') {
                label = item.interfaceName || `GPON ${item.gponIdx}`;
            } else {
                // Limit very long user labels
                label = item.desp ? `${item.desp.substring(0, 15)}${item.desp.length > 15 ? '...' : ''}` : `ONT ${item.ontIdx}`;
                label = `${label} (${item.sn ? item.sn.substring(0, 8) : ''})`;
            }

            return {
                id: type === 'GPON' ? item.gponIdx : item.ontIdx,
                label,
                rawTotal: (item.totalBytesIn || 0) + (item.totalBytesOut || 0),
                valueIn: item.totalBytesIn || 0,
                valueOut: item.totalBytesOut || 0
            };
        });
    }, [data, type]);

    if (topData.length === 0 || topData.every(i => i.rawTotal === 0)) return null; // Avoid rendering empty charts if everything is 0

    return (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', padding: '1.5rem' }}>
            <div style={{ flex: '2 1 400px', minWidth: '300px' }}>
                <h2 className="section-title">{title} - Chart</h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart
                            data={topData}
                            margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={true} vertical={false} />
                            <XAxis
                                type="number"
                                stroke="var(--text-muted)"
                                tickFormatter={(val) => {
                                    if (val === 0) return '0';
                                    if (val >= 1e12) return (val / 1e12).toFixed(0) + 'T';
                                    if (val >= 1e9) return (val / 1e9).toFixed(0) + 'G';
                                    if (val >= 1e6) return (val / 1e6).toFixed(0) + 'M';
                                    return val;
                                }}
                                tick={{ fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                dataKey="label"
                                type="category"
                                stroke="var(--text-muted)"
                                tick={{ fill: 'var(--text-main)', fontSize: '0.85rem' }}
                                width={160}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="valueIn" name="Volume In" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} barSize={25} />
                            <Bar dataKey="valueOut" name="Volume Out" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={25} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ flex: '1 1 300px', minWidth: '250px', display: 'flex', flexDirection: 'column' }}>
                <h2 className="section-title">{title} - Data</h2>
                <div className="table-container" style={{ padding: 0, overflowX: 'auto', flex: 1, border: 'none', background: 'transparent' }}>
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>{type === 'GPON' ? 'GPON Port' : 'ONT Target'}</th>
                                <th style={{ textAlign: 'right' }}>Total Volume</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topData.map((item, idx) => (
                                <tr key={item.id} style={{ pointerEvents: 'none' }}>
                                    <td style={{ color: 'var(--text-muted)' }}>{idx + 1}</td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.label}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatBytes(item.rawTotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TopConsumers;
