import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadConfig } from '../data/config';
import { savePedidoOracaoToSupabase, deletePedidoOracaoFromSupabase } from '../data/supabase';

const STORAGE_KEY = 'pedidos_oracao';
const AMENS_KEY   = 'oracao_amens';

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

const MURAL_MOCK = [
  { id: 'm1', nome: 'Maria L.',     texto: 'Peço oração pela saúde da minha mãe que está internada. Deus é o médico dos médicos.', data: '19/06/2025', amens: 18 },
  { id: 'm2', nome: 'Roberto S.',   texto: 'Oração pela minha família, estamos passando por um momento difícil financeiramente. Cremos na provisão de Deus.', data: '17/06/2025', amens: 11 },
  { id: 'm3', nome: 'Patrícia M.',  texto: 'Meu filho está longe de Deus. Não desisto de orar por ele. Por favor intercedam comigo.', data: '15/06/2025', amens: 29 },
  { id: 'm4', nome: 'Anônimo',      texto: 'Estou passando por uma depressão. Peço oração e que Deus me dê forças para continuar.', data: '12/06/2025', amens: 34 },
  { id: 'm5', nome: 'Cláudio F.',   texto: 'Graças a Deus e às orações desta comunidade, consegui o emprego! Continuem orando por mim.', data: '10/06/2025', amens: 22 },
];

function loadPedidos() {
  try {
    const todos  = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const corte  = ultimoCultoOracaoMs();
    // Mantém apenas pedidos enviados APÓS o último culto de quinta (já foram orados → excluir)
    const validos = corte
      ? todos.filter(p => typeof p.id === 'string' || p.id >= corte)
      : todos;
    if (validos.length !== todos.length)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validos));
    return validos;
  } catch { return []; }
}

function loadAmens() {
  try { return JSON.parse(localStorage.getItem(AMENS_KEY)) || []; }
  catch { return []; }
}

export default function Oracao() {
  const [pedidos, setPedidos] = useState(loadPedidos);
  const [amens, setAmens] = useState(loadAmens);
  const [texto, setTexto] = useState('');
  const [privado, setPrivado] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [aba, setAba] = useState('mural'); // 'mural' | 'meus'

  const handleSubmit = () => {
    if (!texto.trim()) return;
    const novo = { id: Date.now(), texto: texto.trim(), privado, data: new Date().toLocaleDateString('pt-BR') };
    const atualizados = [novo, ...pedidos];
    setPedidos(atualizados);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizados));
    savePedidoOracaoToSupabase(novo);
    setTexto('');
    setPrivado(false);
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

  // Mural público: mock + pedidos públicos do usuário
  const pedidosPublicos = pedidos.filter(p => !p.privado).map(p => ({
    ...p, nome: 'Você', amens: 0, isUser: true,
  }));
  const mural = [...pedidosPublicos, ...MURAL_MOCK].sort((a, b) => {
    const aNum = typeof a.id === 'number';
    const bNum = typeof b.id === 'number';
    if (aNum && bNum) return b.id - a.id;
    if (aNum) return -1;
    if (bNum) return 1;
    return String(b.id).localeCompare(String(a.id));
  });

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
          {[['mural', 'Mural da Igreja'], ['meus', `Meus Pedidos (${pedidos.length})`]].map(([val, label]) => (
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
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {pedido.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
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
          pedidos.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-xl)' }}>Você ainda não enviou pedidos.</p>
          ) : (
            pedidos.map(pedido => (
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
