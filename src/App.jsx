import React, { useState, useEffect } from 'react';
import './main.css';

export default function App() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('current');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger données simulées
    const mockData = {
      period: 'W17-2026',
      totalHospitalizations: 342,
      totalUrg: 156,
      avgDuration: 8.2,
      readmissions: 28,
      nightAdmissions: 85,
      occupancy: 87,
      deaths: 12,
      prevStats: {
        totalHospitalizations: 305,
        totalUrg: 144,
        avgDuration: 8.5,
        readmissions: 29,
        occupancy: 84
      },
      facilities: [
        { name: 'EMS Vallée de Joux', occupancy: 97, beds: 45, alert: true },
        { name: 'CAT Renens-Ouest', occupancy: 92, beds: 32, alert: false },
        { name: 'EPSM Aubonne', occupancy: 88, beds: 50, alert: false }
      ],
      alerts: [
        { facility: 'EMS Vallée de Joux', detail: 'Taux d\'occupation ≥ 95% (97%)' },
        { facility: 'CAT Renens-Ouest', detail: 'Durée anormale (15.3j vs 8.2j moy.)' },
        { facility: 'EPSM Aubonne', detail: 'Taux réadmission élevé (8.9%)' }
      ]
    };
    setData(mockData);
    setLoading(false);
  }, []);

  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const { default: html2canvas } = await import('html2canvas');
    
    const element = document.getElementById('dashboardContent');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('VeilleHospital_export.pdf');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px', color: '#00b2c3' }}>Chargement...</div>;

  const getChangeColor = (current, prev) => {
    return current >= prev ? 'positive' : 'negative';
  };

  return (
    <div className="app-container" id="dashboardContent">
      {/* Header */}
      <header className="header">
        <div className="logo-section">
          <svg width="120" height="60" viewBox="0 0 340 100" className="logo">
            <defs>
              <polygon id="hex1" points="30,0 60,15 60,45 30,60 0,45 0,15"/>
            </defs>
            <use href="#hex1" fill="#00b2c3" transform="translate(30, 15)"/>
            <polygon points="50,25 65,35 65,50 50,60 35,50 35,35" fill="#00a1ac"/>
            <polygon points="65,30 80,37 80,52 65,59 50,52 50,37" fill="#d3d800"/>
            <text x="100" y="55" fontSize="42" fontWeight="bold" fill="#00b2c3" fontFamily="Avenir, sans-serif">HévivA</text>
          </svg>
          <div className="header-text">
            <h1>VeilleHospital</h1>
            <p>Monitoring centralisé des hospitalisations</p>
          </div>
        </div>
        <div className="controls">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="current">Période actuelle (W17)</option>
            <option value="previous">Période précédente (W16)</option>
          </select>
          <button className="export-btn" onClick={exportPDF}>📊 Export PDF</button>
        </div>
      </header>

      {/* KPIs */}
      <div className="container">
        <div className="metrics-grid">
          <MetricCard 
            label="Hospitalisations"
            value={data.totalHospitalizations}
            change={data.totalHospitalizations - data.prevStats.totalHospitalizations}
            type="positive"
          />
          <MetricCard 
            label="Durée moyenne"
            value={data.avgDuration.toFixed(1) + ' j'}
            change={data.avgDuration - data.prevStats.avgDuration}
            type="negative"
          />
          <MetricCard 
            label="Urgences"
            value={data.totalUrg}
            change={data.totalUrg - data.prevStats.totalUrg}
            type="positive"
          />
          <MetricCard 
            label="Réadmissions"
            value={data.readmissions}
            change={data.readmissions - data.prevStats.readmissions}
            type="negative"
          />
          <MetricCard 
            label="Hospitalisations nuit"
            value={data.nightAdmissions}
            change={data.nightAdmissions - (data.nightAdmissions * 0.94)}
            type="positive"
          />
          <MetricCard 
            label="Taux occupation"
            value={data.occupancy + '%'}
            change={data.occupancy - data.prevStats.occupancy}
            type="positive"
          />
          <MetricCard 
            label="Décès"
            value={data.deaths}
            change={data.deaths - (data.deaths * 1.02)}
            type="negative"
          />
        </div>

        {/* Carte */}
        <section className="section">
          <h2 className="section-title">📍 Carte - Établissements HévivA (Vaud)</h2>
          <div className="map-placeholder">
            <div style={{ textAlign: 'center', color: '#00b2c3' }}>
              <div style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>32 établissements</div>
              <div style={{ fontSize: '12px', color: '#999' }}>Carte interactive - Données simulées</div>
            </div>
          </div>
        </section>

        {/* Alertes */}
        <section className="section alerts-section">
          <h2 className="section-title">⚠️ Alertes automatiques</h2>
          <div className="alerts-list">
            {data.alerts.map((alert, idx) => (
              <div key={idx} className="alert-item">
                <div className="alert-facility">{alert.facility}</div>
                <div className="alert-detail">{alert.detail}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparaison */}
        <section className="section">
          <h2 className="section-title">📊 Comparaison N vs N-1</h2>
          <div className="comparison-table">
            <ComparisonRow 
              label="Total hospitalisations"
              current={data.totalHospitalizations}
              prev={data.prevStats.totalHospitalizations}
            />
            <ComparisonRow 
              label="Urgences"
              current={data.totalUrg}
              prev={data.prevStats.totalUrg}
            />
            <ComparisonRow 
              label="Durée moyenne (jours)"
              current={data.avgDuration}
              prev={data.prevStats.avgDuration}
            />
            <ComparisonRow 
              label="Réadmissions"
              current={data.readmissions}
              prev={data.prevStats.readmissions}
            />
            <ComparisonRow 
              label="Taux occupation moyen"
              current={data.occupancy}
              prev={data.prevStats.occupancy}
              suffix="%"
            />
          </div>
        </section>

        {/* Charts */}
        <section className="section">
          <h2 className="section-title">📈 Hospitalisations par motif (top 5)</h2>
          <div className="chart-container">
            <svg viewBox="0 0 600 200" style={{ height: '200px', width: '100%' }}>
              <rect x="40" y="30" width="80" height="120" fill="#00b2c3"/>
              <rect x="130" y="50" width="80" height="100" fill="#00a1ac"/>
              <rect x="220" y="80" width="80" height="70" fill="#007a85"/>
              <rect x="310" y="110" width="80" height="40" fill="#009399"/>
              <rect x="400" y="140" width="80" height="10" fill="#00939b" opacity="0.6"/>
              
              <text x="80" y="165" fontSize="11" textAnchor="middle" fill="#666">Somatique</text>
              <text x="170" y="165" fontSize="11" textAnchor="middle" fill="#666">Psy</text>
              <text x="260" y="165" fontSize="11" textAnchor="middle" fill="#666">Rééducation</text>
              <text x="350" y="165" fontSize="11" textAnchor="middle" fill="#666">Urgence</text>
              <text x="440" y="165" fontSize="11" textAnchor="middle" fill="#666">Autre</text>
              
              <text x="80" y="142" fontSize="12" fontWeight="600" textAnchor="middle" fill="#333">158</text>
              <text x="170" y="142" fontSize="12" fontWeight="600" textAnchor="middle" fill="#333">132</text>
              <text x="260" y="142" fontSize="12" fontWeight="600" textAnchor="middle" fill="#333">105</text>
              <text x="350" y="142" fontSize="12" fontWeight="600" textAnchor="middle" fill="#333">35</text>
              <text x="440" y="142" fontSize="12" fontWeight="600" textAnchor="middle" fill="#333">12</text>
            </svg>
          </div>
        </section>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 HévivA - VeilleHospital Prototype | Données simulées à titre illustratif</p>
        </footer>
      </div>
    </div>
  );
}

function MetricCard({ label, value, change, type }) {
  const changePercent = change > 0 ? '+' + Math.abs(Math.round(change)) + '%' : Math.round(change) + '%';
  return (
    <div className="metric">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-change ${type === 'positive' ? 'positive' : 'negative'}`}>
        {type === 'positive' ? '↑' : '↓'} {changePercent}
      </div>
    </div>
  );
}

function ComparisonRow({ label, current, prev, suffix = '' }) {
  const change = ((current - prev) / prev * 100).toFixed(1);
  const arrow = current >= prev ? '↑' : '↓';
  return (
    <div className="comp-row">
      <span>{label}</span>
      <span className="comp-value">{current}{suffix} vs {prev}{suffix} ({arrow}{Math.abs(change)}%)</span>
    </div>
  );
}
