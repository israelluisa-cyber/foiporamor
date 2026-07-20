import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadConfig } from '../data/config';
import { savePedidoOracaoToSupabase, deletePedidoOracaoFromSupabase } from '../data/supabase';

const STORAGE_KEY   = 'pedidos_oracao';
const AMENS_KEY     = 'oracao_amens';
const SESSION_KEY   = 'user_session';
const CADASTROS_KEY = 'cadastros_pendentes';
const MEUS_IDS_KEY  = 'meus_pedidos_ids'; // IDs enviados a partir deste aparelho — nunca sincronizado, só local

function loadCadastros() {
  try { return JSON.parse(localStorage.getItem(CADASTROS_KEY)) || []; }
  catch { return []; }
}

// Foto de perfil do membro logado (mesma fonte usada em Usuario.jsx)
function fotoDoMembroLogado(session) {
  if (!session) return null;
  return loadCadastros().find(c => String(c.id) === String(session.id))?.foto || null;
}

// Foto por celular — cobre pedidos antigos (enviados antes de guardarmos a foto
// junto) reencontrando o cadastro do membro pelo mesmo celular do pedido.
function fotoPorCelular(celular) {
  if (!celular) return null;
  return loadCadastros().find(c => c.celular === celular)?.foto || null;
}

// Retorna o timestamp do fim do último culto de oração (quinta-feira)
function ultimoCultoOracaoMs() {
  const cultos = loadConfig().cultos || [];
  const culto  = cultos.find(c => c.diaSemana === 4); // 4 = quinta-feira
  if (!culto) return null;
  const now      = new Date();
  const daysBack = (now.getDay() - 4 + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(now.getDate() - daysBack);
  candidate.setHours(culto.horaFim, culto.minFim, 0, 0);
  // Se o culto desta semana ainda não terminou, volta uma semana
  if (candidate.getTime() > Date.now()) candidate.setDate(candidate.getDate() - 7);
  return candidate.getTime();
}

// Converte "dd/mm/aaaa" para timestamp; retorna null se não der pra interpretar
function parseDataBR(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime();
}

// Já foi intercedido no último Culto de Oração (quinta) → sai do mural público.
// Sem data legível, mantém visível (não esconde por engano).
function jaFoiIntercedido(pedido, corte) {
  if (!corte) return false;
  const ts = parseDataBR(pedido.data);
  return ts !== null && ts < corte;
}

function loadPedidos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function loadAmens() {
  try { return JSON.parse(localStorage.getItem(AMENS_KEY)) || []; }
  catch { return []; }
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function loadMeusIds() {
  try { return JSON.parse(localStorage.getItem(MEUS_IDS_KEY)) || []; }
  catch { return []; }
}

const campoStyle = {
  width: '100%', padding: '10px 12px', background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none',
};

export default function Oracao() {
  const [pedidos, setPedidos] = useState(loadPedidos);
  const [amens, setAmens] = useState(loadAmens);
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [aba, setAba] = useState('mural'); // 'mural' | 'meus'
  const [session] = useState(loadSession);
  const [nomeVisitante, setNomeVisitante] = useState('');
  const [celularVisitante, setCelularVisitante] = useState('');
  const [meusIds, setMeusIds] = useState(loadMeusIds);

  const handleSubmit = () => {
    if (!texto.trim()) return;
    const nome    = session ? session.nome    : nomeVisitante.trim();
    const celular = session ? session.celular : celularVisitante.trim();
    const novo = {
      id: Date.now(), texto: texto.trim(), privado,
      nome: nome || null, celular: celular || null,
      foto: fotoDoMembroLogado(session),
      data: new Date().toLocaleDateString('pt-BR'),
    };
    const atualizados = [novo, ...pedidos];
    setPedidos(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    savePedidoOracaoToSupabase(novo);

    const novosMeusIds = [String(novo.id), ...meusIds];
    setMeusIds(novosMeusIds);
    localStorage.setItem(MEUS_IDS_KEY, JSON.stringify(novosMeusIds));

    setTexto('');
    setPrivado(false);
    setNomeVisitante('');
    setCelularVisitante('');
    setToastMessage('Pedido de oração enviado! Estaremos orando por você.');
    setAba('meus');
  };

  const handleRemover = (id) => {
    const atualizados = pedidos.filter(p => p.id !== id);
    setPedidos(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    deletePedidoOracaoFromSupabase(id);
  };

  const handleAmem = (id) => {
    if (amens.includes(id)) return;
    const novos = [...amens, id];
    setAmens(novos);
    localStorage.setItem(AMENS_KEY, JSON.stringify(novos));
    setToastMessage('Você orou por este pedido. Amém!');
  };

  // Só os pedidos enviados a partir DESTE aparelho — não o pool inteiro sincronizado
  const meusPedidos = pedidos.filter(p => meusIds.includes(String(p.id)));

  // Mural público: pedidos de todos (com o nome real de quem enviou, ou Anônimo),
  // exceto os já intercedidos no último Culto de Oração — esses saem do mural
  // automaticamente, mas continuam salvos (o admin ainda os vê/gerencia).
  const corteMural = ultimoCultoOracaoMs();
  const pedidosPublicos = pedidos
    .filter(p => !p.privado && !jaFoiIntercedido(p, corteMural))
    .map(p => ({ ...p, nome: p.nome || 'Anônimo', amens: p.amens || 0, foto: p.foto || fotoPorCelular(p.celular) }));
  const mural = [...pedidosPublicos].sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Pedidos de Oração" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontSize: '0.95rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            "Orai uns pelos outros, para que sejais curados."
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tiago 5:16</p>
        </section>

        {/* Formulário de novo pedido */}
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <h3 className="font-heading" style={{ marginBottom: 'var(--spacing-sm)' }}>Novo Pedido</h3>
          <textarea
            className="notes-area"
            placeholder="Compartilhe seu pedido de oração. Ele será intercedido na quinta-feira pelo time pastoral..."
            value={texto}
            onChange={e => setTexto(e.target.value)}
            style={{ marginTop: 0, marginBottom: '10px' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--spacing-md)', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <i className="ph ph-calendar-check" style={{ color: 'var(--accent-color)', fontSize: '1rem', flexShrink: 0 }}></i>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
              Seu pedido será levado ao altar e intercedido pela equipe pastoral no{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>Culto de Oração — toda Quinta-feira às 19h30.</strong>{' '}
              Após a intercessão, o pedido é removido automaticamente.
            </p>
          </div>

          <div
            onClick={() => setPrivado(p => !p)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className={`ph ${privado ? 'ph-lock' : 'ph-users'}`} style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}></i>
              <div>
                <p style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{privado ? 'Pedido Privado' : 'Pedido Público'}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {privado ? 'Só a liderança verá' : 'Aparece no mural da igreja'}
                </p>
              </div>
            </div>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: privado ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'var(--text-primary)', position: 'absolute', top: '2px', left: privado ? '22px' : '2px', transition: 'left 0.2s' }} />
            </div>
          </div>

          {session ? (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ph ph-user-circle"></i>
              Enviando como <strong style={{ color: 'var(--text-secondary)' }}>{session.nome}</strong>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-md)' }}>
              <input
                type="text" value={nomeVisitante} onChange={e => setNomeVisitante(e.target.value)}
                placeholder="Seu nome (opcional)" style={campoStyle}
              />
              <input
                type="tel" value={celularVisitante} onChange={e => setCelularVisitante(e.target.value)}
                placeholder="Seu celular (opcional — ajuda a igreja a te responder)" style={campoStyle}
              />
            </div>
          )}

          <button
            className="primary-btn"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', opacity: texto.trim() ? 1 : 0.5 }}
            onClick={handleSubmit}
            disabled={!texto.trim()}
          >
            <i className="ph ph-hands-praying"></i>
            <span>Enviar Pedido</span>
          </button>
        </section>

        {/* Abas: Mural | Meus Pedidos */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '4px', marginBottom: 'var(--spacing-md)', gap: '4px' }}>
          {[['mural', 'Mural da Igreja'], ['meus', `Meus Pedidos (${meusPedidos.length})`]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setAba(val)}
              style={{
                flex: 1, padding: '8px', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: aba === val ? 700 : 400,
                background: aba === val ? 'var(--accent-color)' : 'none',
                color: aba === val ? 'var(--bg-color)' : 'var(--text-muted)',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Mural público */}
        {aba === 'mural' && (
          mural.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>Nenhum pedido público ainda.</p>
          ) : (
            mural.map(pedido => {
              const jaDeuAmem = amens.includes(pedido.id);
              return (
                <div key={pedido.id} className="glass-card" style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {pedido.foto ? (
                          <img src={pedido.foto} alt={pedido.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {pedido.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{pedido.nome}</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{pedido.data}</p>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '12px' }}>{pedido.texto}</p>
                  <button
                    onClick={() => handleAmem(pedido.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px',
                      borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 600,
                      background: jaDeuAmem ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                      color: jaDeuAmem ? 'var(--bg-color)' : 'var(--text-secondary)',
                      border: `1px solid ${jaDeuAmem ? 'var(--accent-color)' : 'var(--border-color)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    <i className="ph ph-hands-praying"></i>
                    <span>{jaDeuAmem ? 'Orei por isso' : 'Orar'} · {pedido.amens + (jaDeuAmem ? 1 : 0)}</span>
                  </button>
                </div>
              );
            })
          )
        )}

        {/* Meus pedidos */}
        {aba === 'meus' && (
          meusPedidos.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>Você ainda não enviou pedidos.</p>
          ) : (
            meusPedidos.map(pedido => (
              <div key={pedido.id} className="glass-card" style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className={`ph ${pedido.privado ? 'ph-lock' : 'ph-users'}`} style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}></i>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pedido.privado ? 'Privado' : 'Público'} • {pedido.data}
                    </span>
                  </div>
                  <button onClick={() => handleRemover(pedido.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>
                    <i className="ph ph-x"></i>
                  </button>
                </div>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{pedido.texto}</p>
              </div>
            ))
          )
        )}

      </main>

      {toastMessage && <Toast message={toastMessage} icon="ph-hands-praying" type="success" onClose={() => setToastMessage('')} />}
    </div>
  );
}
