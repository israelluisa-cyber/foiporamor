import { useState } from 'react';
import Header from '../components/Header';
import { loadSaidas } from '../data/evangelismo';

function parseSaidaDate(s) {
  const [dia, mes, ano] = s.data.split('/').map(Number);
  return new Date(ano, mes - 1, dia);
}

function proximaSaida(saidas) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return saidas
    .filter(s => parseSaidaDate(s) >= hoje)
    .sort((a, b) => parseSaidaDate(a) - parseSaidaDate(b))[0] || null;
}

function saidaDeOntem(saidas) {
  const ontem = new Date(); ontem.setDate(ontem.getDate() - 1); ontem.setHours(0, 0, 0, 0);
  const hoje  = new Date(); hoje.setHours(0, 0, 0, 0);
  return saidas.find(s => {
    const d = parseSaidaDate(s);
    return d >= ontem && d < hoje;
  }) || null;
}

function diasAte(saida) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const diff = parseSaidaDate(saida) - hoje;
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function Evangelismo() {
  const saidas = loadSaidas();
  const [expandido, setExpandido] = useState(null);

  const realizada     = saidaDeOntem(saidas);
  const proximo       = !realizada ? proximaSaida(saidas) : null;
  const diasRestantes = proximo ? diasAte(proximo) : null;

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Evangelismo" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Trabalho Realizado — aparece no dia seguinte à saída */}
        {realizada && (
          <section style={{ marginBottom: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <i className="ph ph-check-circle"></i> Trabalho Realizado
              </span>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                {realizada.titulo}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.75)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ph ph-calendar-check"></i> {realizada.diaSemana}, {realizada.data} · {realizada.local}
              </p>

              <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
                <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, margin: 0 }}>
                  "Assim será a palavra que sair da minha boca: não voltará para mim vazia, mas fará o que eu quero."
                </p>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: '6px', marginBottom: 0 }}>Isaías 55:11</p>
              </div>
            </div>
          </section>
        )}

        {/* Próxima saída — destaque */}
        {proximo && (
          <section style={{ marginBottom: 'var(--spacing-lg)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)', position: 'relative' }}>
            {/* Círculos decorativos */}
            <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '130px', height: '130px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-20px', left: '-10px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

            <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
              {/* Tag */}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <i className="ph ph-megaphone"></i>
                {diasRestantes === 0 ? 'HOJE!' : diasRestantes === 1 ? 'AMANHÃ!' : `EM ${diasRestantes} DIAS`}
              </span>

              {/* Título */}
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px', lineHeight: 1.2, fontFamily: 'var(--font-heading)' }}>
                {proximo.titulo}
              </h2>

              {/* Infos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                {[
                  { icon: 'ph-calendar-blank', texto: `${proximo.diaSemana}, ${proximo.data} · ${proximo.horario}` },
                  { icon: 'ph-map-pin',         texto: proximo.local || proximo.pontoEncontro },
                  { icon: 'ph-user-circle',     texto: proximo.lider },
                ].map(item => item.texto && (
                  <span key={item.icon} style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <i className={`ph ${item.icon}`} style={{ flexShrink: 0 }}></i> {item.texto}
                  </span>
                ))}
              </div>

            </div>
          </section>
        )}

        {/* Versículo */}
        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            "Ide por todo o mundo e pregai o evangelho a toda criatura."
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Marcos 16:15</p>
        </section>


        {/* Lista de saídas */}
        <h3 className="section-title" style={{ marginTop: 0 }}>Agenda de Saídas</h3>

        {saidas.map(saida => {
          const aberto = expandido === saida.id;

          return (
            <div key={saida.id} className="glass-card" style={{ marginBottom: '12px', padding: 0, overflow: 'hidden' }}>

              {/* Cabeçalho do card */}
              <div
                onClick={() => setExpandido(aberto ? null : saida.id)}
                style={{ padding: '16px', cursor: 'pointer', display: 'flex', gap: '14px', alignItems: 'flex-start' }}
              >
                {/* Data */}
                <div style={{ minWidth: '48px', textAlign: 'center', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 6px', flexShrink: 0 }}>
                  <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {saida.data.split('/')[1]}/{saida.data.split('/')[2].slice(2)}
                  </span>
                  <span style={{ display: 'block', fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-color)', lineHeight: 1, fontFamily: 'var(--font-heading)' }}>
                    {saida.data.split('/')[0]}
                  </span>
                  <span style={{ display: 'block', fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {saida.diaSemana.slice(0, 3).toUpperCase()}
                  </span>
                </div>

                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{saida.titulo}</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="ph ph-clock"></i> {saida.horario}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <i className="ph ph-map-pin"></i> {saida.local}
                    </span>
                  </div>
                </div>

                <i className={`ph ${aberto ? 'ph-caret-up' : 'ph-caret-down'}`} style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }}></i>
              </div>

              {/* Detalhes expandidos */}
              {aberto && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '14px 0 12px' }}>
                    {saida.descricao}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { icon: 'ph-user-circle', label: 'Líder', valor: saida.lider },
                      { icon: 'ph-map-pin-area', label: 'Ponto de encontro', valor: saida.pontoEncontro },
                      { icon: 'ph-users', label: 'Vagas', valor: `${saida.vagas} pessoas` },
                    ].map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className={`ph ${item.icon}`} style={{ fontSize: '0.95rem', color: 'var(--text-muted)', width: '16px', flexShrink: 0 }}></i>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{item.label}:</span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>{item.valor}</span>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>
          );
        })}

      </main>

    </div>
  );
}
