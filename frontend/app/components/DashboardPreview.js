import { Icon } from "./Visuals";

function Gauge({ value = 75 }) {
  return (
    <svg viewBox="0 0 200 120" className="preview-gauge" aria-label={`${value}% de la agenda de ejemplo ocupada`} role="img">
      {Array.from({ length: 40 }, (_, i) => {
        const angle = Math.PI + (i / 39) * Math.PI;
        return <line key={i} x1={100 + 69 * Math.cos(angle)} y1={100 + 69 * Math.sin(angle)} x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke={i < Math.round(value / 100 * 40) ? "var(--brand)" : "#dde5df"} strokeWidth="2.5" strokeLinecap="round" />;
      })}
      <text x="100" y="101" textAnchor="middle" fill="var(--ink)" fontSize="27" fontWeight="500">{value}%</text>
    </svg>
  );
}

export default function DashboardPreview({ compact = false }) {
  return (
    <div className={`dashboard-preview ${compact ? "preview-compact" : ""}`}>
      <div className="preview-topline"><span><Icon name="calendar" /> Mi consultorio</span><span className="preview-example">Vista ilustrativa · datos de ejemplo</span></div>
      <div className="preview-grid">
        <article className="preview-card preview-overview">
          <div className="preview-card-heading"><span>Tu agenda</span><span className="small-label">Hoy</span></div>
          <div className="preview-number">03<span className="soft-tag"><span className="status-dot" /> Turnos confirmados</span></div>
          <p className="small-label">Cada encuentro, en su lugar.</p>
          <Gauge /><div className="gauge-caption">Disponibilidad del día</div>
          <div className="preview-segment"><span className="selected">Agenda</span><span>Disponibilidad</span></div>
        </article>
        <article className="preview-card preview-appointments">
          <div className="preview-card-heading"><span>Próximos turnos</span><Icon name="clock" /></div>
          <div className="preview-date"><span className="status-dot" /> Miércoles · agenda de ejemplo</div>
          {[{ time: "09:00", initials: "ML", name: "María López", type: "Consulta", tone: "sage" }, { time: "10:00", initials: "JP", name: "Juan Pérez", type: "Seguimiento", tone: "sand" }, { time: "11:30", initials: "AS", name: "Ana Silva", type: "Consulta", tone: "lavender" }].map(item => (
            <div className="preview-appointment" key={item.time}><span className="preview-time">{item.time}</span><span className={`preview-avatar ${item.tone}`}>{item.initials}</span><div><strong>{item.name}</strong><span>{item.type}</span></div><Icon name="chevron" /></div>
          ))}
          <div className="preview-note"><Icon name="check" /> Una agenda que respira.</div>
        </article>
        <article className="preview-card preview-settings">
          <div className="preview-card-heading"><span>A tu ritmo</span><Icon name="leaf" /></div>
          <p className="small-label">Un espacio para organizar tu semana.</p>
          <div className="preview-field"><span>Días de atención</span><div>Lunes a viernes <span>⌄</span></div></div>
          <div className="preview-field"><span>Horario del consultorio</span><div>09:00 — 17:00 <Icon name="clock" /></div></div>
          <div className="preview-field"><span>Duración de la consulta</span><div>30 minutos <span>⌄</span></div></div>
          <div className="preview-saved"><Icon name="check" /> Tu semana, organizada</div>
        </article>
      </div>
    </div>
  );
}
