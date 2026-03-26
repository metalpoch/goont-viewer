import { useState, useEffect } from 'react';
import { Calendar, Server, RefreshCw } from 'lucide-react';
import { getOLTs } from '../services/api';

const FilterBar = ({ onApplyFilter, isLoading }) => {
    const [olts, setOlts] = useState([]);
    const [selectedIp, setSelectedIp] = useState('');

    // Set dynamic dates: from March 11, 2026 to today
    const getDefaultDates = () => {
        const today = new Date();
        const minDate = new Date(2026, 2, 11); // March 11, 2026 (month is 0-indexed)
        
        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        return {
            initDate: formatDate(minDate),
            endDate: formatDate(today)
        };
    };
    
    const defaultDates = getDefaultDates();
    const [initDate, setInitDate] = useState(defaultDates.initDate);
    const [endDate, setEndDate] = useState(defaultDates.endDate);

    useEffect(() => {
        // Load OLTs on mount
        getOLTs()
            .then(data => {
                // Ordenar ascendentemente por nombre
                const sortedData = (data || []).sort((a, b) => 
                    a.name.localeCompare(b.name)
                );
                setOlts(sortedData);
            })
            .catch(err => {
                console.error("Failed to load OLT lists:", err);
            });
    }, []);

    const handleOltSelect = (e) => {
        const selectedValue = e.target.value;
        // Buscar OLT que coincida con el texto ingresado (puede ser nombre, IP o location)
        const foundOlt = olts.find(olt => 
            `${olt.name} - ${olt.ip} (${olt.location})` === selectedValue ||
            olt.name === selectedValue ||
            olt.ip === selectedValue ||
            olt.location === selectedValue ||
            selectedValue.includes(olt.ip)
        );
        
        if (foundOlt) {
            setSelectedIp(foundOlt.ip);
        } else {
            setSelectedIp('');
        }
    };

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
        const location = selectedOltObj ? selectedOltObj.location : '';

        onApplyFilter({
            ip: selectedIp,
            name: name,
            location: location,
            initDateStr: rfcInit,
            endDateStr: rfcEnd
        });
    };

    return (
        <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div className="control-group">
                <Server size={18} className="text-muted" />
                <input
                    list="olt-list"
                    className="input-field"
                    placeholder="Buscar por nombre, IP o ubicación..."
                    onChange={handleOltSelect}
                />
                <datalist id="olt-list">
                    {olts.map(olt => (
                        <option key={olt.ip} value={`${olt.name} - ${olt.ip} - (${olt.location})`} />
                    ))}
                </datalist>
            </div>

            <div className="control-group">
                <Calendar size={18} className="text-muted" />
                <input
                    type="date"
                    className="input-field"
                    value={initDate}
                    onChange={e => setInitDate(e.target.value)}
                    min="2026-03-11"
                    max={new Date().toISOString().split('T')[0]}
                />
                <span style={{ color: 'var(--text-muted)' }}>hasta</span>
                <input
                    type="date"
                    className="input-field"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    min="2026-03-11"
                    max={new Date().toISOString().split('T')[0]}
                />
            </div>

            <div style={{ marginLeft: 'auto' }}>
                <button
                    className="btn-primary"
                    onClick={handleApply}
                    disabled={isLoading || !selectedIp}
                >
                    {isLoading ? <RefreshCw size={18} className="spinner" /> : <RefreshCw size={18} />}
                    Cargar Tráfico
                </button>
            </div>
        </div>
    );
};

export default FilterBar;
