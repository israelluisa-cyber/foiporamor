import { useState, useEffect } from 'react';
import Header from '../components/Header';

const READ_KEY = 'avisos_lidos';
const ADMIN_AVISOS_KEY = 'admin_avisos';

function loadAdminAvisos() {
  try { return JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY)) || []; }
  catch { return []; }
}

export const AVISOS = [
  { id: 1, tipo: 'Urgente', titulo: 'Culto de Oração Especial', texto: 'Nesta quinta-feira teremos um culto especial de oração pela nação. Venha interceder! Às 19h30.', data: '20/06/2025', icone: 'ph-warning' },
  { id: 2, tipo: 'Evento', titulo: 'Retiro de Jovens — Julho', texto: 'As inscrições para o Retiro Geração de Fogo estão abertas! De 18 a 20 de julho. Vagas limitadas. Fale com seu líder.', data: '18/06/2025', icone: 'ph-campfire' },
  { id: 3, tipo: 'Informativo', titulo: 'Nova Turma do ITEAP', texto: 'A nova turma do Instituto Teológico Amor e Palavra iniciará em agosto. Inscrições abertas para membros.', data: '15/06/2025', icone: 'ph-graduation-cap' },
  { id: 4, tipo: 'Evento', titulo: 'Jantar de Confraternização', texto: 'Dia 29 de junho realizaremos nosso jantar anual. Cada família leva um prato. Confirme presença com a secretaria.', data: '12/06/2025', icone: 'ph-fork-knife' },
  { id: 5, tipo: 'Informativo', titulo: 'Atualização do Cadastro de Membros', texto: 'A secretaria solicita que todos os membros atualizem seus dados de contato. Acesse seu perfil no app.', data: '10/06/2025', icone: 'ph-identification-card' },
  { id: 6, tipo: 'Informativo', titulo: 'Batismo nas Águas — Próximo Domingo', texto: 'No próximo domingo haverá cerimônia de batismo. Interessados devem falar com os pastores antes de sábado.', data: '08/06/2025', icone: 'ph-drop' },
  { id: 7, tipo: 'Evento', titulo: 'Congresso de Mulheres', texto: 'O Congresso Mulher de Fé acontecerá no dia 5 de julho. Convidem amigas e familiares!', data: '05/06/2025', icone: 'ph-star' },
  { id: 8, tipo: 'Informativo', titulo: 'Coleta de Alimentos', texto: 'Continuamos coletando alimentos não perecíveis para as famílias assistidas pela nossa ação social. Entregue no hall da igreja.', data: '01/06/2025', icone: 'ph-package' },
];

const TIPO_CORES = {
  Urgente:     { bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)',  text: '#ef4444' },
  Evento:      { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.2)', text: 'var(--text-primary)' },
  Informativo: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border-color)',   text: 'var(--text-secondary)' },
};

export function getUnreadCount() {
  try {
    const lidos = JSON.parse(localStorage.getItem(READ_KEY)) || [];
    const adminAvisos = loadAdminAvisos();
    const todos = [...adminAvisos, ...AVISOS];
    return todos.filter(a => !lidos.includes(a.id)).length;
  } catch { return AVISOS.length; }
}

export default function Avisos() {
  const [filtro, setFiltro] = useState('Todos');
  const [expandido, setExpandido] = useState(null);
  const [adminAvisos] = useState(loadAdminAvisos);

  const todosAvisos = [...adminAvisos, ...AVISOS];

  useEffect(() => {
    localStorage.setItem(READ_KEY, JSON.stringify(todosAvisos.map(a => a.id)));
  }, []);

  const filtrados = filtro === 'Todos' ? todosAvisos : todosAvisos.filter(a => a.tipo === filtro);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Avisos" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-lg)', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {['Todos', 'Urgente', 'Evento', 'Informativo'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 'var(--radius-full)',
              background: filtro === f ? 'var(--accent-color)' : 'var(--bg-surface)',
              color: filtro === f ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: `1px solid ${filtro === f ? 'var(--accent-color)' : 'var(--border-color)'}`,
              fontSize: '0.82rem', fontWeight: filtro === f ? 700 : 400, transition: 'all 0.2s',
            }}>
              {f}
            </button>
          ))}
        </div>

        {filtrados.map((aviso, idx) => {
          const cor = TIPO_CORES[aviso.tipo];
          const aberto = expandido === aviso.id;
          return (
            <div
              key={aviso.id}
              onClick={() => setExpandido(aberto ? null : aviso.id)}
              style={{
                background: cor.bg, border: `1px solid ${cor.border}`,
                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ph ${aviso.icone}`} style={{ fontSize: '1.2rem', color: cor.text }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: cor.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{aviso.tipo}</span>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--text-primary)', margin: '2px 0' }}>{aviso.titulo}</h4>
                    </div>
                    <i className={`ph ${aberto ? 'ph-caret-up' : 'ph-caret-down'}`} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}></i>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{aviso.data}</p>
                  {aberto && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6, animation: 'fadeIn 0.2s ease' }}>
                      {aviso.texto}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Redes Sociais ───────────────────────────── */}
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>Nos siga nas redes</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                nome: 'YouTube',
                handle: '@IgrejaFoiPorAmorOficial',
                url: 'https://www.youtube.com/@IgrejaFoiPorAmorOficial',
                gradient: 'linear-gradient(135deg, #c4302b, #ff6347)',
                icon: 'ph-youtube-logo',
              },
              {
                nome: 'Instagram',
                handle: '@igrejafoiporamor',
                url: 'https://www.instagram.com/igrejafoiporamor/',
                gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #f77737)',
                icon: 'ph-instagram-logo',
              },
              {
                nome: 'Facebook',
                handle: '/igrejafpa',
                url: 'https://www.facebook.com/igrejafpa',
                gradient: 'linear-gradient(135deg, #1877f2, #0c5ebf)',
                icon: 'ph-facebook-logo',
              },
            ].map(rede => (
              <button
                key={rede.nome}
                onClick={() => window.open(rede.url, '_blank')}
                style={{
                  width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: rede.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <i className={`ph ${rede.icon}`} style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{rede.nome}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{rede.handle}</p>
                </div>
                <i className="ph ph-arrow-square-out" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', flexShrink: 0 }}></i>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
