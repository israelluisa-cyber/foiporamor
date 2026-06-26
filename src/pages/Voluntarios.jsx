import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { MINISTERIOS, loadVagas, VAGAS_KEY } from '../data/vagas';

const INSCRICOES_KEY = 'voluntarios_inscricoes';

function loadInscricoes() {
  try { return JSON.parse(localStorage.getItem(INSCRICOES_KEY)) || {}; }
  catch { return {}; }
}

function getNome() {
  try { return JSON.parse(sessionStorage.getItem('user_session'))?.nome?.split(' ')[0] || 'Você'; }
  catch { return 'Você'; }
}

export default function Voluntarios() {
  const [vagas, setVagas] = useState(loadVagas);
  const [inscricoes, setInscricoes] = useState(loadInscricoes);
  const [toast, setToast] = useState('');
  const nome = getNome();

  const vagasAbertas = vagas.filter(v => v.aberta);

  const toggleInscricao = (vagaId) => {
    const novas = { ...inscricoes };
    if (novas[vagaId]) {
      delete novas[vagaId];
      setToast('Inscrição cancelada.');
    } else {
      novas[vagaId] = true;
      setToast('Você está escalado(a)! Obrigado pelo serviço.');
    }
    setInscricoes(novas);
    localStorage.setItem(INSCRICOES_KEY, JSON.stringify(novas));
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Servir" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
          Servir é um ato de adoração. Confirme sua presença nas vagas abertas abaixo.
        </p>

        {vagasAbertas.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <i className="ph ph-heart" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}></i>
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Nenhuma vaga aberta no momento</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Acompanhe as próximas oportunidades de servir na nossa igreja.
            </p>
          </div>
        ) : (
          MINISTERIOS.map(min => {
            const vagasMin = vagasAbertas.filter(v => v.ministerio === min.nome);
            if (vagasMin.length === 0) return null;

            return (
              <section key={min.nome} className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
                {/* Header do ministério */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ph ${min.icone}`} style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}></i>
                  </div>
                  <div>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{min.nome}</h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{min.descricao}</p>
                  </div>
                </div>

                {/* Vagas */}
                {vagasMin.map((vaga, idx) => {
                  const inscrito = inscricoes[vaga.id];
                  const totalConfirmados = (vaga.confirmados || 0) + (inscrito ? 1 : 0);
                  const vagasLivres = vaga.vagas - totalConfirmados;

                  return (
                    <div key={vaga.id} style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: idx < vagasMin.length - 1 ? '8px' : 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{vaga.data}</p>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <i className="ph ph-clock"></i> {vaga.horario}
                          </p>
                        </div>
                        <span style={{
                          fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: vagasLivres > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(220,38,38,0.15)',
                          color: vagasLivres > 0 ? 'var(--text-secondary)' : '#ef4444',
                          border: `1px solid ${vagasLivres > 0 ? 'var(--border-color)' : 'rgba(220,38,38,0.3)'}`,
                        }}>
                          {vagasLivres > 0 ? `${vagasLivres} vaga${vagasLivres !== 1 ? 's' : ''}` : 'Lotado'}
                        </span>
                      </div>

                      {inscrito && (
                        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                            {nome} (você)
                          </span>
                        </div>
                      )}

                      <button
                        onClick={() => toggleInscricao(vaga.id)}
                        disabled={vagasLivres <= 0 && !inscrito}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 'var(--radius-md)',
                          fontSize: '0.85rem', fontWeight: 600,
                          background: inscrito ? 'var(--accent-color)' : 'none',
                          color: inscrito ? 'var(--bg-color)' : 'var(--text-secondary)',
                          border: `1px solid ${inscrito ? 'var(--accent-color)' : 'var(--border-color)'}`,
                          opacity: vagasLivres <= 0 && !inscrito ? 0.4 : 1,
                          cursor: vagasLivres <= 0 && !inscrito ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {inscrito ? (
                          <><i className="ph ph-check"></i> Confirmado — Cancelar</>
                        ) : vagasLivres > 0 ? (
                          <><i className="ph ph-plus"></i> Quero Servir</>
                        ) : 'Lotado'}
                      </button>
                    </div>
                  );
                })}
              </section>
            );
          })
        )}

      </main>

      {toast && <Toast message={toast} icon="ph-heart" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
