import Link from "next/link";
import DashboardPreview from "./DashboardPreview";
import { Icon } from "./Visuals";

export default function Hero({ demo = false }) {
  return (
    <section className="landing-hero">
      <video className="hero-video" autoPlay loop muted playsInline preload="auto" disableRemotePlayback poster="https://images.unsplash.com/photo-1557683316-973673baf926?w=1600&q=60" aria-hidden="true" tabIndex={-1}>
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260424_064411_9e9d7f84-9277-41f4-ab10-59172d89e6be.mp4" type="video/mp4" />
      </video>
      <div className="hero-overlay" />
      <div className="hero-foreground">
        <div className="hero-content">
          <div className="hero-badge"><span className="status-dot" /> Tu consultorio, en armonía</div>
          <h1>{demo ? <>Tu agenda,<br /><em>a tu ritmo.</em></> : <>Más tiempo<br />para <em>cuidar.</em></>}</h1>
          <p>Organizá tus turnos con calma.<br className="mobile-break" /> Dedicá tu tiempo a tus pacientes.</p>
          <div className="hero-actions">
            <Link href={demo ? "/signup" : "/demo"} className="button button-dark">{demo ? "Empezar ahora" : "Conocé ReservaFácil"}<span className="button-arrow"><Icon name="chevron" /></span></Link>
            <Link href={demo ? "#problem" : "/login"} className="hero-secondary">{demo ? "Ver cómo funciona" : "Iniciar sesión"}<Icon name="arrow" /></Link>
          </div>
          <div className="hero-caption"><span /> Pensado para profesionales de la salud <span /></div>
        </div>
        <div className="hero-dashboard"><DashboardPreview /></div>
      </div>
    </section>
  );
}
