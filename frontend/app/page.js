import Link from "next/link";
import Hero from "./components/Hero";
import { BrandMark, Icon } from "./components/Visuals";

export default function Home() {
  return (
    <div className="landing-page">
      <Hero />
      <section className="home-features" aria-label="Funciones de ReservaFácil">
        <div className="section-intro"><span className="eyebrow">MENOS GESTIÓN, MÁS PRESENCIA</span><h2>Tu consultorio.<br /><em>Un poco más simple.</em></h2><p>Desde la primera reserva hasta tu organización semanal, todo tiene su lugar.</p></div>
        <div className="feature-grid">
          {[{ icon: "calendar", title: "Una reserva simple", text: "Tus pacientes eligen un día y un horario disponible desde tu agenda pública." }, { icon: "leaf", title: "Una semana a tu medida", text: "Definí tus horarios de atención y organizá tus días de ausencia desde el panel." }, { icon: "list", title: "Un lugar para esperar", text: "La lista de espera conecta a tus pacientes con los turnos que se liberan." }].map((item, index) => <article className="feature-card" key={item.title}><div className="feature-top"><span className="icon-tile"><Icon name={item.icon} /></span><span className="feature-index">0{index + 1}</span></div><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>
      <footer className="site-footer"><Link href="/" className="brand-link"><BrandMark /><span>ReservaFácil</span></Link><p>Cuidá tu tiempo. Acompañá mejor.</p><Link href="/login">Acceso profesional <Icon name="arrow" /></Link></footer>
    </div>
  );
}
