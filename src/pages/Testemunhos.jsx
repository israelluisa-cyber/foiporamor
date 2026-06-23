import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY_T = 'testemunhos_lista';
const KEY_A = 'testemunhos_amens';

const MOCK = [
  { id: 1, nome: 'Ana Paula F.', texto: 'Deus restaurou meu casamento depois de anos de crise. Estávamos prontos para desistir, mas Ele foi fiel. Obrigada pela oração de todos!', data: '10/06/2025', amens: 24 },
  { id: 2, nome: 'Carlos L.', texto: 'Após 8 meses desempregado, recebi uma proposta de emprego exatamente no dia que precisava. Ele nunca falha!', data: '08/06/2025', amens: 31 },
  { id: 3, nome: 'Fernanda S.', texto: 'Minha filha foi diagnosticada com uma doença grave. Após meses de oração e tratamento, os médicos não encontraram mais nada nos exames. Gloria a Deus!', data: '02/06/2025', amens: 47 },
  { id: 4, nome: 'Gabriel O.', texto: 'Passei no concurso que tanto sonhava depois de três tentativas. A Palavra diz que o tempo de Deus é perfeito, e é verdade.', data: '25/05/2025', amens: 18 },
  { id: 5, nome: 'Helena C.', texto: 'Fui liberta de uma depressão severa que durou 4 anos. A comunidade desta igreja foi essencial nesse processo. Amo vocês!', data: '20/05/2025', amens: 52 },
];

function loadUserTestemunhos() {
  try { return JSON.parse(localStorage.getItem(KEY_T)) || []; }
  catch { return []; }
}

function loadAmens() {
  try { return JSON.parse(localStorage.getItem(KEY_A)) || []; }
  catch { return []; }
}

function getNome() {
  try {
    const p = JSON.parse(localStorage.getItem('membro_perfil'));
    return p?.nome || 'Membro Anônimo';
  } catch { return 'Membro Anônimo'; }
}

export default function Testemunhos() {
  const [userT, setUserT] = useState(loadUserTestemunhos);
  const [amens, setAmens] = useState(loadAmens);
  const [texto, setTexto] = useState('');
  const [toast, setToast] = useState('');
  const [enviando, setEnviando] = useState(false);

  const todos = [...userT, ...MOCK].sort((a, b) => b.id - a.id);

  const handleEnviar = () => {
    if (!texto.trim()) return;
    const novo = { id: Date.now(), nome: getNome(), texto: texto.trim(), data: new Date().toLocaleDateString('pt-BR'), amens: 0, isUser: true };
    const atualizados = [novo, ...userT];
    setUserT(atualizados);
    localStorage.setItem(KEY_T, JSON.stringify(atualizados));
    setTexto('');
    setEnviando(false);
    setToast('Testemunho enviado! Gloria a Deus!');
  };

  const handleAmem = (id) => {
    if (amens.includes(id)) return;
    const novosAmens = [...amens, id];
    setAmens(novosAmens);
    localStorage.setItem(KEY_A, JSON.stringify(novosAmens));
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Testemunhos" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {!enviando ? (
          <button
            onClick={() => setEnviando(true)}
            className="primary-btn"
            style={{ width: '100%', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}
          >
            <i className="ph ph-plus"></i> Compartilhar Meu Testemunho
          </button>
        ) : (
          <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>Seu Testemunho</h3>
            <textarea
              className="notes-area"
              placeholder="Compartilhe o que Deus fez na sua vida. Seu testemunho pode fortalecer alguém hoje..."
              value={texto}
              onChange={e => setTexto(e.target.value)}
              style={{ marginTop: 0, marginBottom: 'var(--spacing-md)' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setEnviando(false)} style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-full)', background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Cancelar</button>
              <button
                onClick={handleEnviar}
                className="primary-btn"
                style={{ flex: 2, justifyContent: 'center', opacity: texto.trim() ? 1 : 0.5 }}
                disabled={!texto.trim()}
              >
                Publicar
              </button>
            </div>
          </section>
        )}

        {todos.map(t => {
          const jaDeuAmem = amens.includes(t.id);
          const count = t.amens + (jaDeuAmem ? 1 : 0);
          return (
            <div key={t.id} className="glass-card" style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {t.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{t.nome}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.data}</p>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>{t.texto}</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleAmem(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                    borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600,
                    background: jaDeuAmem ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                    color: jaDeuAmem ? 'var(--bg-color)' : 'var(--text-secondary)',
                    border: `1px solid ${jaDeuAmem ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <i className="ph ph-hands-praying"></i>
                  <span>Amém! · {count}</span>
                </button>
                <button
                  onClick={() => {
                    const texto = `✨ Testemunho: "${t.texto.slice(0, 100)}${t.texto.length > 100 ? '...' : ''}" — ${t.nome} (Igreja Foi Por Amor)`;
                    if (navigator.share) {
                      navigator.share({ text: texto });
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px',
                    borderRadius: 'var(--radius-full)', fontSize: '0.82rem',
                    background: 'var(--bg-surface-elevated)', color: 'var(--text-muted)',
                    border: '1px solid var(--border-color)', cursor: 'pointer',
                  }}
                  title="Compartilhar"
                >
                  <i className="ph ph-share-network"></i>
                </button>
              </div>
            </div>
          );
        })}

      </main>

      {toast && <Toast message={toast} icon="ph-star" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
