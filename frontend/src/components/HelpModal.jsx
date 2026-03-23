import React, { useState } from 'react';
import { HelpCircle, X, ExternalLink, Mail, Globe } from 'lucide-react';
import { OpenExternalURL } from '../../wailsjs/go/main/App';

const HelpModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                className="btn-primary"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    padding: 0,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 999
                }}
                onClick={() => setIsOpen(true)}
                title="Ayuda del Panel"
            >
                <HelpCircle size={28} />
            </button>

            {isOpen && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem', backdropFilter: 'blur(3px)' }}
                    onClick={() => setIsOpen(false)}
                >
                    <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem' }} onClick={e => e.stopPropagation()}>
                        <button style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', outline: 'none' }} onClick={() => setIsOpen(false)}>
                            <X size={24} />
                        </button>

                        <h2 className="section-title" style={{ marginTop: 0, fontSize: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Manual del Panel de Tráfico</h2>

                        <div style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>1. Filtro General (Arriba)</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Seleccione la <strong>IP del OLT</strong> en el menú y el <strong>Rango de Fechas</strong> deseado. Al oprimir cargar, el sistema recopilará matemáticamente todas las mediciones horarias procesando el comportamiento total del equipo.</p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>2. Navegación Profunda (Drill-Down)</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Al hacer click en cualquier puerto de la <strong>Tabla de Interfaces GPON</strong> inferior, usted aislará el equipo. Todas las tarjetas y gráficas se centrarán en dicho puerto, y se revelará la lista interna de <strong>Clientes ONTs</strong>.</p>
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>Si le hace click a un Cliente ONT, observará en vivo únicamente el comportamiento de ese aparato específico.</p>
                                <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-muted)' }}>Puede hacer click en la ruta de texto arriba (Ej. "OLT / GPON...") para retroceder niveles o deseleccionar en cualquier momento.</p>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>3. Gráficas de Tendencia</h3>
                                <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)' }}>
                                    <li style={{ marginBottom: '0.4rem' }}><strong>Tráfico (bps):</strong> Calcula el promedio de velocidad <u>solo</u> durante las horas de tráfico máximo pesado (19:00 a 23:59). Excluye SNMP corruptos de lectura de la OLT mayores a 2.5 Gbps.</li>
                                    <li><strong>Volumen Total (Bytes):</strong> Representa la dinámica de terabytes descargados y subidos registrados diariamente, extraídos al cierre de medianoche (00:00).</li>
                                </ul>
                            </div>

                             <div style={{ marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>4. Top 5 Consumidores</h3>
                                <p style={{ margin: 0, color: 'var(--text-muted)' }}>Gráfico de ranking situado al centro. Reacciona automáticamente mostrándote los 5 Puertos GPON o los 5 Clientes ONT (dependiendo del zoom) que <strong>más cuota de Terabytes o Gigabytes consumieron</strong>, sumando su bajada y subida. Útil para ubicar revendedores ilegales o consumo anómalo (malware).</p>
                            </div>

                            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <p style={{ marginBottom: '0.75rem' }}>Desarrollado por Keiber Urbila</p>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <button 
                                        onClick={() => OpenExternalURL('https://keiber.info.ve/')}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.25rem 0.5rem', borderRadius: '4px', transition: 'all 0.2s ease' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <Globe size={14} />
                                        Portfolio
                                    </button>
                                    <button 
                                        onClick={() => OpenExternalURL('https://keiberup.dev/')}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.25rem 0.5rem', borderRadius: '4px', transition: 'all 0.2s ease' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <ExternalLink size={14} />
                                        Sitio Web
                                    </button>
                                    <button 
                                        onClick={() => OpenExternalURL('mailto:keiberup.dev@gmail.com')}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.25rem 0.5rem', borderRadius: '4px', transition: 'all 0.2s ease' }}
                                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-color)'}
                                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                                    >
                                        <Mail size={14} />
                                        keiberup.dev@gmail.com
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpModal;
