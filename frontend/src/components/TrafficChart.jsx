import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

const formatBps = (bps) => {
    if (bps === undefined || isNaN(bps)) return '0';
    if (bps >= 1e9) return (bps / 1e9).toFixed(1) + 'G';
    if (bps >= 1e6) return (bps / 1e6).toFixed(1) + 'M';
    if (bps >= 1e3) return (bps / 1e3).toFixed(1) + 'K';
    return bps.toFixed(0);
};

const formatBytes = (bytes) => {
    if (bytes === undefined || isNaN(bytes)) return '0';
    if (bytes >= 1e12) return (bytes / 1e12).toFixed(1) + 'TB';
    if (bytes >= 1e9) return (bytes / 1e9).toFixed(1) + 'GB';
    if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + 'MB';
    if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + 'KB';
    return bytes.toFixed(0);
};

const CustomTooltip = ({ active, payload, label, isTraffic }) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-panel" style={{ padding: '1rem', border: '1px solid var(--border-color)' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color, margin: '0.25rem 0' }}>
                        {entry.name}: {isTraffic ? formatBps(entry.value) + 'bps' : formatBytes(entry.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const TrafficChart = ({ data, title, isTraffic = true }) => {
    return (
        <div className="glass-panel chart-container" style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">{title}</h2>
            <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            tick={{ fill: 'var(--text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="var(--text-muted)"
                            tickFormatter={isTraffic ? formatBps : formatBytes}
                            tick={{ fill: 'var(--text-muted)' }}
                            tickLine={false}
                            axisLine={false}
                            width={60}
                        />
                        <Tooltip content={<CustomTooltip isTraffic={isTraffic} />} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="valueIn"
                            name="Bajada"
                            stroke={isTraffic ? '#10b981' : '#f59e0b'}
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#1f2937', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="valueOut"
                            name="Subida"
                            stroke={isTraffic ? '#3b82f6' : '#ef4444'}
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#1f2937', strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrafficChart;
