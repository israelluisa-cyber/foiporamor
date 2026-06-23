import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const MUSICAS = [
  {
    titulo: 'Nada Além do Sangue',
    autor: 'Robert Lowry / Arr. Hillsong',
    letra: `Que outro fundamento terei
Senão a cruz de Cristo?
Que outra esperança buscarei
Senão Jesus, bendito?

Nada além do sangue de Jesus
Me justifica e me purifica
Nada além do sangue de Jesus

Pela fé em Seu sangue precioso
Fui de todo perdoado
Hoje sou por graça, vitorioso
Por Cristo sustentado

Nada além do sangue de Jesus
Me justifica e me purifica
Nada além do sangue de Jesus`,
  },
  {
    titulo: 'Oceanos',
    autor: 'Hillsong United',
    letra: `Me chamas para as águas
Onde os pés podem falhar
E ali me encontro rendido
Em Tua graça sem igual

Me sustenta a Tua mão
Enquanto caminho sobre o mar
A minha fé será mais forte
Ao ouvir a Tua voz chamar

Espírito, me guia
Onde a fé cresce sem parar
Além de toda fronteira
Onde posso Te adorar`,
  },
  {
    titulo: 'Tua Graça Me Basta',
    autor: 'Celina Borges',
    letra: `Tua graça me basta, Senhor
Tua força se aperfeiçoa
Na minha fraqueza, ó Senhor
Tua glória se renova

Quando a tempestade braveja
E o meu chão desmorona
Firme e seguro me sustenta
A Tua graça que me perdoa

Eu me glorio na fraqueza
Para que em mim habite
O Teu poder, Senhor Jesus
A glória que me envolve`,
  },
];

function ModalVisitante({ onClose }) {
  const [form, setForm] = useState({ nome: '', telefone: '', como: 'Redes sociais' });
  const [enviado, setEnviado] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone) return;
    const visita = { ...form, data: new Date().toLocaleDateString('pt-BR'), id: Date.now() };
    try {
      const lista = JSON.parse(localStorage.getItem('visitantes') || '[]');
      localStorage.setItem('visitantes', JSON.stringify([...lista, visita]));
    } catch {}
    setEnviado(true);
  };

  const inputSt = { width: '100%', padding: '11px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxWidth: '500px', padding: 'var(--spacing-lg)', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}>
        {!enviado ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', margin: 0 }}>Bem-vindo(a)! 👋</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Deixe seus dados e entraremos em contato</p>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.3rem' }}>
                <i className="ph ph-x"></i>
              </button>
            </div>
            <form onSubmit={handleEnviar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Seu nome *</label>
                <input type="text" value={form.nome} onChange={set('nome')} style={inputSt} placeholder="Nome completo" required />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Telefone / WhatsApp *</label>
                <input type="tel" value={form.telefone} onChange={set('telefone')} style={inputSt} placeholder="(11) 99999-9999" required />
              </div>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Como nos conheceu?</label>
                <select value={form.como} onChange={set('como')} style={inputSt}>
                  {['Redes sociais', 'Indicação de amigo', 'Família', 'Pesquisa na internet', 'Passei e entrei', 'Outro'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <button type="submit" style={{ width: '100%', padding: '13px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', marginTop: '4px' }}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-lg) 0' }}>
            <i className="ph ph-heart" style={{ fontSize: '3rem', color: 'var(--accent-color)', display: 'block', marginBottom: '12px' }}></i>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '8px' }}>Que alegria ter você aqui!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>Seus dados foram registrados. Em breve alguém da nossa equipe vai entrar em contato.</p>
            <button onClick={onClose} style={{ padding: '12px 32px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-full)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700 }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Culto() {
  const [toastMessage, setToastMessage] = useState('');
  const [notes, setNotes] = useState(() => localStorage.getItem('culto_notes') || '');
  const [musicaAberta, setMusicaAberta] = useState(null);
  const [modalVisitante, setModalVisitante] = useState(false);

  const handleSave = () => {
    localStorage.setItem('culto_notes', notes);
    setToastMessage('Anotações salvas com sucesso no seu dispositivo!');
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Modo Culto" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Player */}
        <div className="video-container">
          <div className="live-badge">
            <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }}></div>
            Ao Vivo
          </div>
          <iframe
            src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=1"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Detalhes da mensagem */}
        <section className="glass-card">
          <span className="hero-tag" style={{ background: 'rgba(255,255,255,0.05)', border: 'none', marginBottom: '8px', color: 'var(--text-secondary)' }}>Curso de Teologia</span>
          <h1 className="font-heading" style={{ fontSize: '1.5rem', marginBottom: '4px' }}>A Essência da Graça</h1>
          <p className="text-secondary" style={{ fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            <i className="ph ph-book-bookmark"></i> Efésios 2:8-9
          </p>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', borderLeft: '2px solid var(--border-color)', paddingLeft: '12px' }}>
            "Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus."
          </p>
        </section>

        {/* Ações rápidas */}
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)', overflowX: 'auto', paddingBottom: '4px' }}>
          <button className="primary-btn" style={{ flex: 1, padding: '10px', background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
            <i className="ph ph-hands-praying"></i> Pedido de Oração
          </button>
          <button onClick={() => setModalVisitante(true)} className="primary-btn" style={{ flex: 1, padding: '10px', background: 'var(--bg-surface-elevated)', color: 'var(--text-primary)', whiteSpace: 'nowrap', display: 'flex', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
            <i className="ph ph-hand-waving"></i> Sou Visitante
          </button>
        </div>

        {/* Letras de Louvor */}
        <h3 className="section-title" style={{ marginTop: 'var(--spacing-lg)' }}>Letras do Louvor</h3>
        <section className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-md)' }}>
          {MUSICAS.map((musica, i) => {
            const aberta = musicaAberta === i;
            return (
              <div key={i} style={{ borderBottom: i < MUSICAS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <button
                  onClick={() => setMusicaAberta(aberta ? null : i)}
                  style={{
                    width: '100%', padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', gap: 'var(--spacing-md)', background: 'none',
                    color: 'var(--text-primary)', textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ph ph-music-notes" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}></i>
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{musica.titulo}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{musica.autor}</p>
                    </div>
                  </div>
                  <i className={`ph ${aberta ? 'ph-caret-up' : 'ph-caret-down'}`} style={{ color: 'var(--text-muted)', flexShrink: 0 }}></i>
                </button>
                {aberta && (
                  <div style={{ padding: '0 var(--spacing-md) var(--spacing-md)', animation: 'fadeIn 0.2s ease' }}>
                    <pre style={{
                      fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-secondary)',
                      lineHeight: 1.9, whiteSpace: 'pre-wrap', margin: 0,
                      borderLeft: '2px solid var(--border-color)', paddingLeft: 'var(--spacing-md)',
                    }}>
                      {musica.letra}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Anotações */}
        <h3 className="font-heading" style={{ marginTop: 'var(--spacing-lg)' }}>Minhas Anotações</h3>
        <textarea
          className="notes-area"
          placeholder="Escreva aqui o que Deus falou com você hoje... Essas anotações ficarão salvas no seu celular."
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
        <button
          className="primary-btn"
          style={{ marginTop: 'var(--spacing-sm)', display: 'flex', justifyContent: 'center' }}
          onClick={handleSave}
        >
          <i className="ph ph-floppy-disk"></i> Salvar Anotações
        </button>

      </main>

      {toastMessage && <Toast message={toastMessage} icon="ph-floppy-disk" type="success" onClose={() => setToastMessage('')} />}
      {modalVisitante && <ModalVisitante onClose={() => setModalVisitante(false)} />}
    </div>
  );
}
