import React, { useState, useEffect } from 'react';
import { Calendar, Server, RefreshCw } from 'lucide-react';
import { getOLTs } from '../services/api';

const FilterBar = ({ onApplyFilter, isLoading }) => {
    const [olts, setOlts] = useState([]);
    const [selectedIp, setSelectedIp] = useState('');

    // Set exact default dates to match available data
    const [initDate, setInitDate] = useState('2026-03-18');
    const [endDate, setEndDate] = useState('2026-03-19');

    useEffect(() => {
        // Load OLTs on mount
        getOLTs()
            .then(data => {
                setOlts(data || []);
                if (data && data.length > 0) {
                    // Select first by default
                    setSelectedIp(data[0].ip);
                }
            })
            .catch(err => {
                console.error("Failed to load OLT lists:", err);
            });
    }, []);

    const handleApply = () => {
        if (!selectedIp || !initDate || !endDate) return;

        // Format to strict RFC3339 with local timezone offset
        const pad = (n) => n < 10 ? '0' + n : n;
        const offset = new Date().getTimezoneOffset();
        const sign = offset > 0 ? '-' : '+';
        const absOffset = Math.abs(offset);
        const hoursOffset = pad(Math.floor(absOffset / 60));
        const minsOffset = pad(absOffset % 60);
        const tz = `${sign}${hoursOffset}:${minsOffset}`;

        const rfcInit = `${initDate}T00:00:00${tz}`;
        const rfcEnd = `${endDate}T23:59:59${tz}`;

        const selectedOltObj = olts.find(o => o.ip === selectedIp);
        const name = selectedOltObj ? selectedOltObj.name : 'Unknown OLT';

        onApplyFilter({
            ip: selectedIp,
            name: name,
            initDateStr: rfcInit,
            endDateStr: rfcEnd
        });
    };

    return (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div className="control-group">
                <Server size={18} className="text-muted" />
                <select
                    className="input-field"
                    value={selectedIp}
                    onChange={e => setSelectedIp(e.target.value)}
                    disabled={olts.length === 0}
                >
                    {olts.length === 0 && <option value="">Loading OLTs...</option>}
                    {olts.map(olt => (
                        <option key={olt.ip} value={olt.ip}>
                            {olt.name} ({olt.ip})
                        </option>
                    ))}
                </select>
            </div>

            <div className="control-group">
                <Calendar size={18} className="text-muted" />
                <input
                    type="date"
                    className="input-field"
                    value={initDate}
                    onChange={e => setInitDate(e.target.value)}
                />
                <span style={{ color: 'var(--text-muted)' }}>to</span>
                <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                />
            </div>

            <div style={{ marginLeft: 'auto' }}>
                <button
                    className="btn-primary"
                    onClick={handleApply}
                    disabled={isLoading || !selectedIp}
                >
                    {isLoading ? <RefreshCw size={18} className="spinner" /> : <RefreshCw size={18} />}
                    Load Traffic
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
