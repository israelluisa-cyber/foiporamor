import { useState, useRef } from 'react';
import Header from '../components/Header';
import PixPanel from '../components/PixPanel';
import { loadConfig } from '../data/config';


export default function Contribuir() {
  const config = loadConfig();
  const obras  = config.obras || [];

  const [obraSelecionada, setObraSelecionada] = useState(null);
  const pixRef = useRef(null);

  const handleContribuir = (obra) => {
    setObraSelecionada(obra);
    setTimeout(() => {
      pixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Contribuir" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Intro */}
        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação, pois Deus ama quem dá com alegria."
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>2 Coríntios 9:7</p>
        </section>

        {/* Obras Sociais */}
        <h3 className="section-title" style={{ marginTop: 0 }}>Nossas Obras Sociais</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
          Sua contribuição transforma vidas. Conheça os trabalhos que realizamos com amor e dedição.
        </p>

        {obras.map((obra) => (
          <div key={obra.id} style={{ marginBottom: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>

            {/* Banner / Foto */}
            <div style={{ position: 'relative', width: '100%', height: '200px' }}>
              {obra.foto ? (
                <img
                  src={obra.foto}
                  alt={obra.nome}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: obra.gradiente, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <i className={`ph ${obra.icone}`} style={{ fontSize: '3.5rem', color: 'rgba(255,255,255,0.9)' }}></i>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>foto em breve</span>
                </div>
              )}
              {/* Overlay com nome */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)', padding: '32px 16px 14px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#fff', margin: 0 }}>{obra.nome}</h3>
              </div>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '16px', background: 'var(--bg-surface)' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '14px' }}>
                {obra.descricao}
              </p>
              <button
                onClick={() => handleContribuir(obra)}
                style={{ width: '100%', padding: '12px', background: obra.gradiente, border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <i className="ph ph-hand-coins"></i>
                Contribuir para esta causa
              </button>
            </div>
          </div>
        ))}

        {/* PIX */}
        <div ref={pixRef} style={{ scrollMarginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ph ph-key" style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}></i>
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1rem', margin: 0 }}>
                {obraSelecionada ? `Contribuir — ${obraSelecionada.nome}` : 'Faça sua Contribuição'}
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Pague via PIX · rápido e seguro</p>
            </div>
          </div>

          {/* Chips de obras */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 'var(--spacing-md)', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setObraSelecionada(null)}
              style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, border: '1px solid var(--border-color)', background: !obraSelecionada ? 'var(--accent-color)' : 'var(--bg-surface)', color: !obraSelecionada ? 'var(--bg-color)' : 'var(--text-secondary)', cursor: 'pointer' }}
            >
              Geral
            </button>
            {obras.map(o => (
              <button
                key={o.id}
                onClick={() => setObraSelecionada(o)}
                style={{ flexShrink: 0, padding: '6px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600, border: '1px solid var(--border-color)', background: obraSelecionada?.id === o.id ? 'var(--accent-color)' : 'var(--bg-surface)', color: obraSelecionada?.id === o.id ? 'var(--bg-color)' : 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {o.nome.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>

          <section className="glass-card">
            <PixPanel
              tipo={obraSelecionada ? obraSelecionada.nome : 'Contribuição Geral'}
              toastText="Chave PIX copiada! Que Deus multiplique sua oferta."
            />
          </section>
        </div>

        {/* Transparência */}
        <div style={{ marginTop: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <i className="ph ph-shield-check" style={{ fontSize: '1.2rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}></i>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            As contribuições são administradas com transparência pela liderança da {config.nomeIgreja}. Relatórios financeiros são apresentados periodicamente à congregação.
          </p>
        </div>

      </main>
    </div>
  );
}
