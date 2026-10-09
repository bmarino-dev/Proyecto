import Link from "next/link";
import { BrandMark, Icon } from "./Visuals";

export default function Navbar() {
  return (
    <header className="site-nav">
      <nav className="nav-pill" aria-label="Navegación principal">
        <Link href="/" className="brand-link" aria-label="ReservaFácil, inicio"><BrandMark /><span>ReservaFácil</span></Link>
        <div className="nav-links">
          <Link href="/" className="nav-home">Inicio</Link>
          <Link href="#">Acerca de</Link>
          <Link href="#">Ayuda</Link>
        </div>
        <div className="nav-actions">
          <Link href="/login" className="nav-login">Acceso profesional</Link>
          <Link href="/signup" className="nav-register">Registrarse<span className="button-arrow"><Icon name="chevron" /></span></Link>
          <details className="mobile-menu">
            <summary aria-label="Abrir menú de navegación"><span /><span /><span /></summary>
            <div className="mobile-menu-panel">
              <Link href="/">Inicio</Link><Link href="#">Acerca de</Link><Link href="#">Ayuda</Link><Link href="/login">Acceso profesional</Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
