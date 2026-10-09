export function Icon({ name = "arrow", className = "", ...props }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M16 3v4M8 3v4M3 11h18m-12 5h.01m3 0h.01m3 0h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 7 9 6 9-6" /></>,
    person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2a14 14 0 0 1-7-7l2-2-2-5Z" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    leaf: <><path d="M20 4c-8-2-16 2-16 9a7 7 0 0 0 7 7c7 0 10-8 9-16Z" /><path d="m5 19 10-10" /></>,
    list: <><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z" /></>,
    alert: <><path d="m12 3 10 18H2L12 3Z" /><path d="M12 9v4m0 4h.01" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
  };
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.arrow}</svg>;
}

export function BrandMark({ className = "" }) {
  return (
    <svg className={`brand-mark ${className}`} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <circle cx="16" cy="6" r="3.5" /><circle cx="23.07" cy="8.93" r="3.5" />
      <circle cx="26" cy="16" r="3.5" /><circle cx="23.07" cy="23.07" r="3.5" />
      <circle cx="16" cy="26" r="3.5" /><circle cx="8.93" cy="23.07" r="3.5" />
      <circle cx="6" cy="16" r="3.5" /><circle cx="8.93" cy="8.93" r="3.5" /><circle cx="16" cy="16" r="3.5" />
    </svg>
  );
}

export function AuthAside() {
  return (
    <aside className="auth-aside">
      <div className="eyebrow"><span className="status-dot" /> HECHO PARA TU CONSULTORIO</div>
      <h2>Tu tiempo,<br /> para lo que<br /> <em>importa.</em></h2>
      <p>Una agenda más simple. Más espacio para acompañar a tus pacientes.</p>
      <div className="auth-note"><span className="icon-tile"><Icon name="calendar" /></span><div><strong>Todo en su lugar.</strong><span>Turnos, horarios y lista de espera.</span></div><Icon name="check" /></div>
      <div className="auth-aside-footer"><BrandMark /><span>ReservaFácil · Cuidá tu tiempo.</span></div>
    </aside>
  );
}
