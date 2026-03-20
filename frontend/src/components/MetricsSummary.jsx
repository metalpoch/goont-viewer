import React from 'react';
import { Activity, Download, Upload, HardDrive } from 'lucide-react';

const MetricCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
    <div className="glass-panel metric-card" style={{ borderLeftColor: `var(--${colorClass})` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 className="metric-title">{title}</h3>
                <div className="metric-value">{value}</div>
                {subtitle && <div className="metric-subtitle">{subtitle}</div>}
            </div>
            <div style={{ padding: '0.5rem', background: `rgba(var(--${colorClass}-rgb), 0.1)`, borderRadius: '8px', color: `var(--${colorClass})` }}>
                {Icon && <Icon size={24} />}
            </div>
        </div>
    </div>
);

export const MetricsSummary = ({ data, selectedGpon, scope }) => {
    // `data` is the calculated summaries object.
    // When scope is "OLT", data is the sum across all GPONs
    // When scope is "GPON", data is the summary for the specific GPON

    if (!data) return null;

    const formatBps = (bps) => {
        if (bps === undefined || isNaN(bps)) return '0 bps';
        if (bps > 1e9) return (bps / 1e9).toFixed(2) + ' Gbps';
        if (bps > 1e6) return (bps / 1e6).toFixed(2) + ' Mbps';
        if (bps > 1e3) return (bps / 1e3).toFixed(2) + ' Kbps';
        return bps.toFixed(0) + ' bps';
    };

    const formatBytes = (bytes) => {
        if (bytes === undefined || isNaN(bytes)) return '0 B';
        if (bytes > 1e12) return (bytes / 1e12).toFixed(2) + ' TB';
        if (bytes > 1e9) return (bytes / 1e9).toFixed(2) + ' GB';
        if (bytes > 1e6) return (bytes / 1e6).toFixed(2) + ' MB';
        if (bytes > 1e3) return (bytes / 1e3).toFixed(2) + ' KB';
        return bytes.toFixed(0) + ' B';
    };

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-title">
                <Activity size={24} color="var(--accent-color)" />
                {scope === 'OLT' ? 'Resumen Global de OLT' : scope === 'GPON' ? `Resumen GPON (${selectedGpon})` : `Resumen Cliente ONT`}
            </h2>
            <div className="metrics-grid">
                <MetricCard
                    title="Tráfico Prom. (Bajada)"
                    value={formatBps(data.avgBpsIn)}
                    subtitle="Durante horas pico (19:00 - 23:59)"
                    icon={Download}
                    colorClass="success"
                />
                <MetricCard
                    title="Tráfico Prom. (Subida)"
                    value={formatBps(data.avgBpsOut)}
                    subtitle="Durante horas pico (19:00 - 23:59)"
                    icon={Upload}
                    colorClass="accent-color"
                />
                <MetricCard
                    title="Volumen Total (Bajada)"
                    value={formatBytes(data.totalBytesIn)}
                    subtitle="Acumulado en el periodo"
                    icon={HardDrive}
                    colorClass="warning"
                />
                <MetricCard
                    title="Volumen Total (Subida)"
                    value={formatBytes(data.totalBytesOut)}
                    subtitle="Acumulado en el periodo"
                    icon={HardDrive}
                    colorClass="danger"
                />
            </div>
        </div>
    );
};

export default MetricsSummary;
