'use client'

// hooks de React
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Hero from '@/app/components/Hero';
import { BrandMark, Icon } from '@/app/components/Visuals';

// componente reutilizable que detecta cuando entra en pantalla
function FadeInSection({ children }) {

    // estado: si el elemento ya es visible o no
    // cuando cambia → React re-renderiza el componente
    const [isVisible, setVisible] = useState(false);

    // guardamos el elemento real del DOM (el div)
    const [domRef, setDomRef] = useState(null);

    useEffect(() => {

        // crea el IntersectionObserver (API del navegador, no de React)
        // callback se ejecuta cuando cambia visibilidad del elemento observado
        const observer = new IntersectionObserver(entries => {

            // entries = lista de elementos observados que cambiaron estado
            entries.forEach(entry => {

                // si el elemento entra en pantalla
                if (entry.isIntersecting) {
                    // cambia estado → dispara re-render en React
                    setVisible(true);
                }
            });

        }, { threshold: 0.1 }); // 10% visible para activarse

        // si ya existe el elemento DOM, lo empezamos a observar
        if (domRef) observer.observe(domRef);

        // cleanup: cuando el componente se desmonta
        return () => {
            if (domRef) observer.unobserve(domRef);
        };

    }, [domRef]); // se ejecuta cuando domRef cambia

    return (
        <div
            // aquí React guarda el nodo real del DOM en domRef
            ref={setDomRef}

            // clases cambian según estado → esto dispara la animación CSS
            className={isVisible ? 'demo-visible' : 'demo-pending'}
        >
            {/* contenido que se pasa desde afuera */}
            {children}
        </div>
    );
}

export default function DemoPage() {
  return (
    <div className="landing-page">
      <Hero demo />
      <div className="demo-body">
        <section id="problem" className="demo-section">
          <FadeInSection>
            <div className="demo-split">
              <div className="demo-copy">
                <span className="eyebrow">UN POCO MENOS DE RUIDO</span>
                <h2 className="demo-heading">Tu atención,<br />donde <em>más importa.</em></h2>
                <p>Entre mensajes, cambios de horario y consultas, coordinar una agenda puede ocupar buena parte de tu día. ReservaFácil reúne la organización de tu consultorio en un solo lugar.</p>
                <div className="demo-points">
                  <div className="demo-point"><span className="icon-tile"><Icon name="check" /></span><span>Una agenda pública para tus pacientes.</span></div>
                  <div className="demo-point"><span className="icon-tile"><Icon name="check" /></span><span>Horarios semanales a tu medida.</span></div>
                  <div className="demo-point"><span className="icon-tile"><Icon name="check" /></span><span>Lista de espera para los turnos que se liberan.</span></div>
                </div>
              </div>
              <div className="demo-agenda">
                <div className="preview-card-heading"><span>Así se ve una agenda en calma</span><Icon name="calendar" /></div>
                <p className="small-label">Vista ilustrativa · datos de ejemplo</p>
                {[{ time: "09:00", initials: "ML", name: "María López", type: "Consulta", tone: "sage" }, { time: "10:00", initials: "JP", name: "Juan Pérez", type: "Seguimiento", tone: "sand" }, { time: "11:30", initials: "AS", name: "Ana Silva", type: "Consulta", tone: "lavender" }].map(item => (
                  <div className="preview-appointment" key={item.time}><span className="preview-time">{item.time}</span><span className={`preview-avatar ${item.tone}`}>{item.initials}</span><div><strong>{item.name}</strong><span>{item.type}</span></div><Icon name="check" /></div>
                ))}
                <div className="demo-agenda-note"><Icon name="leaf" /> Cada encuentro tiene su espacio.</div>
              </div>
            </div>
          </FadeInSection>
        </section>
        <section className="demo-section">
          <FadeInSection>
            <div className="demo-features"><span className="eyebrow">SIMPLE, DE PRINCIPIO A FIN</span><h2 className="demo-heading">Una agenda que<br /><em>acompaña tu práctica.</em></h2></div>
          </FadeInSection>
          <div className="feature-grid">
            {[{ icon: "calendar", title: "Reservas a su tiempo", text: "Tus pacientes consultan los horarios disponibles y eligen su turno desde tu enlace público." }, { icon: "clock", title: "Tu semana, organizada", text: "Configurá los días de atención, la duración de las consultas y tus períodos de ausencia." }, { icon: "list", title: "La espera tiene su lugar", text: "Cuando se libera un turno, la lista de espera permite ofrecerlo a quienes están esperando." }].map((card, i) => (
              <FadeInSection key={card.title}><article className="feature-card h-full"><div className="feature-top"><span className="icon-tile"><Icon name={card.icon} /></span><span className="feature-index">0{i + 1}</span></div><h3>{card.title}</h3><p>{card.text}</p></article></FadeInSection>
            ))}
          </div>
        </section>
        <FadeInSection>
          <section className="demo-cta"><span className="eyebrow">UN NUEVO RITMO PARA TU CONSULTORIO</span><h2 className="mt-5">Empezá con una agenda<br /><em>más simple.</em></h2><p>Creá tu cuenta y organizá tus horarios de atención.</p><div><Link href="/signup" className="button button-dark">Crear mi cuenta<span className="button-arrow"><Icon name="chevron" /></span></Link><Link href="/login" className="hero-secondary">Acceso profesional <Icon name="arrow" /></Link></div></section>
        </FadeInSection>
      </div>
      <footer className="site-footer"><Link href="/" className="brand-link"><BrandMark /><span>ReservaFácil</span></Link><nav className="flex gap-5 text-xs text-secondary"><Link href="#">Términos</Link><Link href="#">Privacidad</Link><Link href="#">Contacto</Link></nav><p>Cuidá tu tiempo. Acompañá mejor.</p></footer>
    </div>
  );
}
