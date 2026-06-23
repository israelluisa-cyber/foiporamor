import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'voluntarios_escala';

const MINISTERIOS = [
  {
    nome: 'Recepção / Hospitalidade',
    icone: 'ph-hand-waving',
    descricao: 'Receber e acolher visitantes e membros',
    escala: [
      { data: 'Dom, 22 Jun', horario: '09:00 - 12:30', vagas: 4, confirmados: ['Carlos L.', 'Ana P.'] },
      { data: 'Dom, 29 Jun', horario: '09:00 - 12:30', vagas: 4, confirmados: ['Fernanda S.'] },
    ],
  },
  {
    nome: 'Mídia e Transmissão',
    icone: 'ph-video-camera',
    descricao: 'Câmera, som e transmissão ao vivo',
    escala: [
      { data: 'Ter, 24 Jun', horario: '19:00 - 21:30', vagas: 3, confirmados: ['Rafael T.'] },
      { data: 'Dom, 22 Jun', horario: '09:00 - 12:30', vagas: 3, confirmados: ['João P.', 'Lucas M.'] },
    ],
  },
  {
    nome: 'Ministério Infantil',
    icone: 'ph-baby',
    descricao: 'Cuidar e ensinar as crianças',
    escala: [
      { data: 'Dom, 22 Jun', horario: '09:00 - 12:00', vagas: 6, confirmados: ['Helena C.', 'Sandra P.', 'Viviane N.'] },
      { data: 'Dom, 29 Jun', horario: '09:00 - 12:00', vagas: 6, confirmados: ['Juliana R.'] },
    ],
  },
  {
    nome: 'Escola Bíblica Dominical',
    icone: 'ph-chalkboard-teacher',
    descricao: 'Ensinar e discipular adultos',
    escala: [
      { data: 'Dom, 22 Jun', horario: '09:00 - 10:30', vagas: 4, confirmados: ['Paulo R.', 'Cristiano S.'] },
      { data: 'Dom, 29 Jun', horario: '09:00 - 10:30', vagas: 4, confirmados: [] },
    ],
  },
  {
    nome: 'Ação Social',
    icone: 'ph-heart',
    descricao: 'Distribuição de alimentos e assistência',
    escala: [
      { data: 'Sáb, 28 Jun', horario: '08:00 - 12:00', vagas: 8, confirmados: ['Anderson B.', 'Débora M.', 'Eduardo X.'] },
    ],
  },
];

function loadEscala() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

function getNome() {
  try {
    const p = JSON.parse(localStorage.getItem('membro_perfil'));
    return p?.nome || 'Você';
  } catch { return 'Você'; }
}

export default function Voluntarios() {
  const [inscricoes, setInscricoes] = useState(loadEscala);
  const [toast, setToast] = useState('');

  const toggleInscricao = (ministerioNome, dataIdx) => {
    const chave = `${ministerioNome}__${dataIdx}`;
    const novas = { ...inscricoes };
    if (novas[chave]) {
      delete novas[chave];
      setToast('Inscrição cancelada.');
    } else {
      novas[chave] = true;
      setToast(`Você está escalado(a)! Obrigado pelo serviço.`);
    }
    setInscricoes(novas);
    localStorage.setItem(KEY, JSON.stringify(novas));
  };

  const nome = getNome();

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Voluntários" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
          Servir é um ato de adoração. Escolha um ministério e confirme sua presença na escala.
        </p>

        {MINISTERIOS.map(min => (
          <section key={min.nome} className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-md)' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={`ph ${min.icone}`} style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}></i>
              </div>
              <div>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{min.nome}</h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{min.descricao}</p>
              </div>
            </div>

            {min.escala.map((item, idx) => {
              const chave = `${min.nome}__${idx}`;
              const inscrito = inscricoes[chave];
              const confirmados = inscrito ? [...item.confirmados, nome] : item.confirmados;
              const vagasLivres = item.vagas - confirmados.length;

              return (
                <div key={idx} style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: idx < min.escala.length - 1 ? '8px' : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{item.data}</p>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        <i className="ph ph-clock"></i> {item.horario}
                      </p>
                    </div>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: vagasLivres > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(220,38,38,0.15)',
                      color: vagasLivres > 0 ? 'var(--text-secondary)' : '#ef4444',
                      border: `1px solid ${vagasLivres > 0 ? 'var(--border-color)' : 'rgba(220,38,38,0.3)'}`,
                    }}>
                      {vagasLivres > 0 ? `${vagasLivres} vagas` : 'Lotado'}
                    </span>
                  </div>

                  {confirmados.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      {confirmados.map((n, i) => (
                        <span key={i} style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                          {n === nome ? `${n} (você)` : n}
                        </span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => toggleInscricao(min.nome, idx)}
                    disabled={vagasLivres <= 0 && !inscrito}
                    style={{
                      width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', fontWeight: 600,
                      background: inscrito ? 'var(--accent-color)' : 'none',
                      color: inscrito ? 'var(--bg-color)' : 'var(--text-secondary)',
                      border: `1px solid ${inscrito ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      opacity: (vagasLivres <= 0 && !inscrito) ? 0.4 : 1,
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
        ))}

      </main>

      {toast && <Toast message={toast} icon="ph-heart" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
