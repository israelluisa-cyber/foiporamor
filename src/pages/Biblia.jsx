import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import {
  PLANOS, loadPlanoAtivoId, savePlanoAtivoId, loadProgresso, saveProgresso,
  loadPlanosConcluidos, marcarPlanoConcluido, proximoPlanoSugerido,
} from '../data/biblia';
import {
  LIVROS, buscarCapitulo, CORES_MARCACAO, chaveVersiculo,
  loadMarcacoes, salvarMarcacoes, loadUltimaLeitura, salvarUltimaLeitura,
} from '../data/bibliaTexto';
import useLockBodyScroll from '../hooks/useLockBodyScroll';

const CORES_CONFETE = ['#facc15', '#fb923c', '#4ade80', '#60a5fa', '#c084fc', '#f472b6'];

function gerarConfete(qtd = 26) {
  return Array.from({ length: qtd }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duracao: 1.6 + Math.random() * 1.2,
    cor: CORES_CONFETE[i % CORES_CONFETE.length],
    rotacao: Math.random() * 360,
  }));
}

/* ── Modal de celebração ao concluir um plano ─────────────────────── */
function ModalPlanoConcluido({ plano, proximoPlano, onEscolherProximo, onFechar }) {
  useLockBodyScroll();
  const [confete] = useState(gerarConfete);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ position: 'relative', overflow: 'hidden', width: '100%', maxWidth: '380px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-xl) var(--spacing-lg)', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {confete.map(c => (
          <span
            key={c.id}
            style={{
              position: 'absolute', top: '-16px', left: `${c.left}%`, width: '8px', height: '8px',
              background: c.cor, borderRadius: '2px', transform: `rotate(${c.rotacao}deg)`,
              animation: `confeteCai ${c.duracao}s ease-in ${c.delay}s both`, zIndex: 0,
            }}
          />
        ))}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <i className="ph ph-trophy" style={{ fontSize: '3rem', color: '#facc15', display: 'block', marginBottom: '12px' }}></i>
          <h2 className="font-heading" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Plano concluído! 🎉</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            Parabéns! Você terminou o plano <strong style={{ color: 'var(--text-primary)' }}>{plano.nome}</strong>, {plano.dias.length} dias de leitura. Que a Palavra continue transformando sua caminhada.
          </p>

          {proximoPlano ? (
            <>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', textAlign: 'left' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '4px' }}>Próximo plano sugerido</p>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>{proximoPlano.nome}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{proximoPlano.descricao}</p>
              </div>
              <button className="primary-btn" style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }} onClick={onEscolherProximo}>
                <i className="ph ph-arrow-right"></i> Começar este plano
              </button>
              <button onClick={onFechar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', padding: '6px' }}>
                Continuar depois
              </button>
            </>
          ) : (
            <>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Você concluiu todos os planos disponíveis agora. Que tal reler um deles, ou explorar a Bíblia livremente na aba <strong style={{ color: 'var(--text-primary)' }}>Ler a Bíblia</strong>?
                </p>
              </div>
              <button className="primary-btn" style={{ width: '100%', justifyContent: 'center' }} onClick={onFechar}>
                Fechar
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes confeteCai {
          0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(420px) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ── Aba: Plano de Leitura ─────────────────────────────────────────── */
function PlanoDeLeitura() {
  const [planoAtivoId, setPlanoAtivoId] = useState(loadPlanoAtivoId);
  const plano = PLANOS.find(p => p.id === planoAtivoId) || PLANOS[0];

  const [concluidos, setConcluidos] = useState(() => loadProgresso(plano.id));
  const [concluidosPlanos, setConcluidosPlanos] = useState(loadPlanosConcluidos);
  const [toast, setToast] = useState('');
  const [celebracao, setCelebracao] = useState(null); // { plano, proximoPlano } | null

  const trocarPlano = (novoId) => {
    setPlanoAtivoId(novoId);
    savePlanoAtivoId(novoId);
    setConcluidos(loadProgresso(novoId));
  };

  const toggleDia = (dia) => {
    const estavaCompleto = concluidos.length === plano.dias.length;
    const jaTinha = concluidos.includes(dia);
    const novos = jaTinha ? concluidos.filter(d => d !== dia) : [...concluidos, dia];
    setConcluidos(novos);
    saveProgresso(plano.id, novos);

    if (!jaTinha) {
      const agoraCompleto = novos.length === plano.dias.length;
      if (agoraCompleto && !estavaCompleto) {
        const novosConcluidos = marcarPlanoConcluido(plano.id);
        setConcluidosPlanos(novosConcluidos);
        setCelebracao({ plano, proximoPlano: proximoPlanoSugerido(plano.id, novosConcluidos) });
      } else {
        setToast(`Dia ${dia} concluído! Parabéns!`);
      }
    }
  };

  const pct = Math.round((concluidos.length / plano.dias.length) * 100);
  const todosConcluidos = concluidosPlanos.length >= PLANOS.length;

  return (
    <>
      {/* Seletor de plano */}
      {PLANOS.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 'var(--spacing-md)', scrollbarWidth: 'none' }}>
          {PLANOS.map(p => {
            const ativo = p.id === plano.id;
            const feito = concluidosPlanos.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => trocarPlano(p.id)}
                style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
                  borderRadius: 'var(--radius-full)', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap',
                  background: ativo ? 'var(--accent-color)' : 'var(--bg-surface)',
                  color: ativo ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: `1px solid ${ativo ? 'var(--accent-color)' : 'var(--border-color)'}`,
                }}
              >
                {feito && <i className="ph ph-trophy" style={{ fontSize: '0.85rem', color: ativo ? 'var(--bg-color)' : '#facc15' }}></i>}
                {p.nome}
              </button>
            );
          })}
        </div>
      )}

      {concluidosPlanos.length > 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <i className="ph ph-trophy" style={{ color: '#facc15' }}></i>
          {concluidosPlanos.length} de {PLANOS.length} {PLANOS.length === 1 ? 'plano concluído' : 'planos concluídos'}
          {todosConcluidos && ' — ciclo completo! 🏆'}
        </p>
      )}

      {/* Progresso */}
      <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>Progresso Geral</p>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--text-primary)', lineHeight: 1 }}>{pct}<span style={{ fontSize: '1rem' }}>%</span></h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{concluidos.length}/{plano.dias.length} dias</p>
        </div>
        <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-color)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>{plano.descricao}</p>
      </section>

      {/* Lista de dias */}
      {plano.dias.map(item => {
        const feito = concluidos.includes(item.dia);
        return (
          <div
            key={item.dia}
            onClick={() => toggleDia(item.dia)}
            style={{
              background: feito ? 'var(--bg-surface)' : 'var(--bg-surface)',
              border: `1px solid ${feito ? 'rgba(255,255,255,0.2)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
              marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '14px',
              cursor: 'pointer', transition: 'all 0.2s', opacity: feito ? 0.7 : 1,
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: feito ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
              border: `1px solid ${feito ? 'var(--accent-color)' : 'var(--border-color)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {feito
                ? <i className="ph ph-check" style={{ color: 'var(--bg-color)', fontSize: '1rem', fontWeight: 700 }}></i>
                : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.dia}</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', textDecoration: feito ? 'line-through' : 'none' }}>Dia {item.dia}</p>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {item.vt} · {item.nt} · {item.sl}
              </p>
            </div>
          </div>
        );
      })}

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} />}

      {celebracao && (
        <ModalPlanoConcluido
          plano={celebracao.plano}
          proximoPlano={celebracao.proximoPlano}
          onEscolherProximo={() => {
            trocarPlano(celebracao.proximoPlano.id);
            setCelebracao(null);
          }}
          onFechar={() => setCelebracao(null)}
        />
      )}
    </>
  );
}

/* ── Aba: Ler a Bíblia (livre, com marcações) ─────────────────────── */
// Resolve a última leitura salva uma única vez, fora de qualquer effect —
// evita disparar setState logo no primeiro render.
function estadoInicialLeitura() {
  const ultima = loadUltimaLeitura();
  const livro = ultima ? LIVROS.find(l => l.slug === ultima.livroSlug) : null;
  return livro
    ? { vista: 'texto', livro, capitulo: ultima.capitulo }
    : { vista: 'livros', livro: null, capitulo: 1 };
}

function LeitorBiblia() {
  const [estadoInicial] = useState(estadoInicialLeitura);
  const [vista, setVista] = useState(estadoInicial.vista); // 'livros' | 'capitulos' | 'texto'
  const [livroSelecionado, setLivroSelecionado] = useState(estadoInicial.livro);
  const [capitulo, setCapitulo] = useState(estadoInicial.capitulo);
  const [versiculos, setVersiculos] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [tentativa, setTentativa] = useState(0);
  const [marcacoes, setMarcacoes] = useState(loadMarcacoes);

  useEffect(() => {
    if (vista !== 'texto' || !livroSelecionado) return;
    let cancelado = false;
    async function carregarCapitulo() {
      setCarregando(true);
      setErro(null);
      try {
        const data = await buscarCapitulo(livroSelecionado.slug, capitulo);
        if (cancelado) return;
        setVersiculos(data.verses);
        salvarUltimaLeitura(livroSelecionado.slug, capitulo);
      } catch {
        if (!cancelado) setErro('Não foi possível carregar esse capítulo. Verifique sua conexão e tente novamente.');
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }
    carregarCapitulo();
    return () => { cancelado = true; };
  }, [vista, livroSelecionado, capitulo, tentativa]);

  const abrirLivro = (livro) => {
    setLivroSelecionado(livro);
    setCapitulo(1);
    setVista('capitulos');
  };

  const abrirCapitulo = (n) => {
    setCapitulo(n);
    setVista('texto');
  };

  const irParaCapitulo = (direcao) => {
    if (!livroSelecionado) return;
    const novoCap = capitulo + direcao;
    if (novoCap >= 1 && novoCap <= livroSelecionado.capitulos) {
      setCapitulo(novoCap);
      return;
    }
    const idx = LIVROS.findIndex(l => l.id === livroSelecionado.id);
    const proximoLivro = LIVROS[idx + direcao];
    if (!proximoLivro) return;
    setLivroSelecionado(proximoLivro);
    setCapitulo(direcao > 0 ? 1 : proximoLivro.capitulos);
  };

  const toggleMarcacao = (chave) => {
    setMarcacoes(atuais => {
      const corAtual = atuais[chave];
      const idx = CORES_MARCACAO.indexOf(corAtual);
      const novas = { ...atuais };
      if (idx === -1) novas[chave] = CORES_MARCACAO[0];
      else if (idx === CORES_MARCACAO.length - 1) delete novas[chave];
      else novas[chave] = CORES_MARCACAO[idx + 1];
      salvarMarcacoes(novas);
      return novas;
    });
  };

  /* ── Vista: lista de livros ── */
  if (vista === 'livros') {
    return (
      <>
        {[['old', 'Antigo Testamento'], ['new', 'Novo Testamento']].map(([testamento, titulo]) => (
          <div key={testamento} style={{ marginBottom: 'var(--spacing-lg)' }}>
            <h3 className="section-title">{titulo}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {LIVROS.filter(l => l.testamento === testamento).map(livro => (
                <button
                  key={livro.id}
                  onClick={() => abrirLivro(livro)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '10px 4px',
                    background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                    cursor: 'pointer', textAlign: 'center',
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-color)' }}>{livro.abrev}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>{livro.nome}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </>
    );
  }

  /* ── Vista: lista de capítulos ── */
  if (vista === 'capitulos' && livroSelecionado) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
          <button onClick={() => setVista('livros')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <i className="ph ph-arrow-left" style={{ fontSize: '1.2rem' }}></i>
          </button>
          <h3 className="font-heading" style={{ margin: 0 }}>{livroSelecionado.nome}</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
          {Array.from({ length: livroSelecionado.capitulos }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => abrirCapitulo(n)}
              style={{
                aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </>
    );
  }

  /* ── Vista: texto do capítulo ── */
  if (vista === 'texto' && livroSelecionado) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={() => setVista('capitulos')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <i className="ph ph-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
            <h3 className="font-heading" style={{ margin: 0 }}>{livroSelecionado.nome} {capitulo}</h3>
          </div>
          <button onClick={() => setVista('livros')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <i className="ph ph-book-bookmark"></i> Livros
          </button>
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
          Toque num versículo pra marcar — toque de novo pra trocar a cor ou remover.
        </p>

        <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          {carregando && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-lg)' }}>Carregando...</p>
          )}
          {erro && !carregando && (
            <div style={{ textAlign: 'center', padding: 'var(--spacing-lg)' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>{erro}</p>
              <button onClick={() => setTentativa(t => t + 1)} className="primary-btn" style={{ padding: '8px 16px' }}>Tentar de novo</button>
            </div>
          )}
          {!carregando && !erro && versiculos && versiculos.map((texto, i) => {
            const numero = i + 1;
            const chave = chaveVersiculo(livroSelecionado.slug, capitulo, numero);
            const cor = marcacoes[chave];
            return (
              <p
                key={numero}
                onClick={() => toggleMarcacao(chave)}
                style={{
                  fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-primary)', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 'var(--radius-sm)', margin: '0 -6px',
                  background: cor ? `${cor}33` : 'transparent', transition: 'background 0.15s',
                }}
              >
                <sup style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent-color)', marginRight: '4px' }}>{numero}</sup>
                {texto}
              </p>
            );
          })}
        </section>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => irParaCapitulo(-1)}
            disabled={livroSelecionado.id === LIVROS[0].id && capitulo === 1}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (livroSelecionado.id === LIVROS[0].id && capitulo === 1) ? 0.4 : 1 }}
          >
            <i className="ph ph-caret-left"></i> Anterior
          </button>
          <button
            onClick={() => irParaCapitulo(1)}
            disabled={livroSelecionado.id === LIVROS[LIVROS.length - 1].id && capitulo === livroSelecionado.capitulos}
            style={{ flex: 1, padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (livroSelecionado.id === LIVROS[LIVROS.length - 1].id && capitulo === livroSelecionado.capitulos) ? 0.4 : 1 }}
          >
            Próximo <i className="ph ph-caret-right"></i>
          </button>
        </div>
      </>
    );
  }

  return null;
}

/* ── Componente principal ─────────────────────────────────────────── */
export default function Biblia() {
  const [aba, setAba] = useState('plano'); // 'plano' | 'ler'

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Bíblia" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '4px', marginBottom: 'var(--spacing-md)', gap: '4px' }}>
          {[['plano', 'Plano de Leitura'], ['ler', 'Ler a Bíblia']].map(([val, label]) => (
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

        {aba === 'plano' ? <PlanoDeLeitura /> : <LeitorBiblia />}

      </main>
    </div>
  );
}
