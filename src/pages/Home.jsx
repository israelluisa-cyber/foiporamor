import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { loadMembros } from '../data/membros';
import { loadConfig, DIAS_ABBR, formatHora, cultoIcon } from '../data/config';
import { loadSaidas } from '../data/evangelismo';
import { loadMural } from '../data/muralData';

// EVENTOS_SEMANA é derivado dinamicamente do config no componente

// TODO: placeholders temporários — trocar por fotos reais de cada culto (ver /admin)
const CULTO_FOTO_PLACEHOLDERS = [
  '/culto-placeholder-1.jpg',
  '/culto-placeholder-2.jpg',
  '/culto-placeholder-3.jpg',
  '/culto-placeholder-4.jpg',
];

const STORAGE_KEY_PEDIDOS = 'pedidos_oracao';

// true só na primeira vez que a Home monta nesta sessão do app — evita
// que a animação de entrada repita toda vez que o usuário navega de volta pra Home
let homeEntranceShown = false;

// Pedidos mock (IDs string = antigos = sempre intercedidos)
const MOCK_PREVIEW = [
  { id: 'm1', nome: 'Maria L.',    texto: 'Peço oração pela saúde da minha mãe que está internada.' },
  { id: 'm2', nome: 'Roberto S.',  texto: 'Oração pela minha família, estamos passando por dificuldades financeiras.' },
  { id: 'm3', nome: 'Patrícia M.', texto: 'Meu filho está longe de Deus. Não desisto de orar por ele.' },
];

function timestampUltimoCulto(cultos) {
  const CULTO_ORACAO = cultos.find(c => c.diaSemana === 4);
  if (!CULTO_ORACAO) return null;
  const now = new Date();
  for (let d = 0; d <= 13; d++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() - d);
    if (candidate.getDay() !== 4) continue;
    candidate.setHours(CULTO_ORACAO.horaFim, CULTO_ORACAO.minFim, 0, 0);
    if (candidate.getTime() <= now.getTime()) return candidate.getTime();
    break;
  }
  return null;
}

// Pedido foi intercedido se foi criado ANTES do último culto terminar
function foiIntercedido(pedido, ultimoCultoMs) {
  if (!ultimoCultoMs) return false;
  if (typeof pedido.id === 'string') return true; // mock = antigo
  return pedido.id < ultimoCultoMs;
}

// Carrega pedidos públicos do localStorage + mocks, limita a 3
function loadPreviewPedidos() {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY_PEDIDOS)) || [];
    const publicos = user.filter(p => !p.privado);
    const todos = [
      ...publicos.map(p => ({ id: p.id, nome: p.nome || 'Anônimo', texto: p.texto })),
      ...MOCK_PREVIEW,
    ];
    return todos.slice(0, 3);
  } catch {
    return MOCK_PREVIEW.slice(0, 3);
  }
}

const VERSOS_DIA = [
  { texto: '"Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna."', ref: 'João 3:16' },
  { texto: '"O Senhor é o meu pastor; nada me faltará."', ref: 'Salmos 23:1' },
  { texto: '"Tudo posso naquele que me fortalece."', ref: 'Filipenses 4:13' },
  { texto: '"Entrega o teu caminho ao Senhor; confia nele, e ele tudo fará."', ref: 'Salmos 37:5' },
  { texto: '"Não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente."', ref: 'Romanos 12:2' },
  { texto: '"Buscai primeiro o reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas."', ref: 'Mateus 6:33' },
  { texto: '"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz, e não de mal, para vos dar o fim que esperais."', ref: 'Jeremias 29:11' },
  { texto: '"Confia no Senhor de todo o teu coração e não te apoies no teu próprio entendimento."', ref: 'Provérbios 3:5' },
  { texto: '"Não andeis ansiosos por coisa alguma; antes em tudo, pela oração e pela súplica, com ações de graças, apresentai os vossos pedidos a Deus."', ref: 'Filipenses 4:6' },
  { texto: '"As misericórdias do Senhor renovam-se cada manhã. Grande é a tua fidelidade."', ref: 'Lamentações 3:23' },
  { texto: '"Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias."', ref: 'Isaías 40:31' },
  { texto: '"Não temas, porque eu sou contigo; não te assombres, porque eu sou teu Deus; eu te fortaleço, e te ajudo."', ref: 'Isaías 41:10' },
  { texto: '"Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco."', ref: '1 Tessalonicenses 5:18' },
  { texto: '"O Senhor te abençoará e te guardará; o Senhor fará resplandecer o seu rosto sobre ti."', ref: 'Números 6:24-25' },
  { texto: '"Deleita-te também no Senhor, e ele te concederá os desejos do teu coração."', ref: 'Salmos 37:4' },
  { texto: '"O amor é paciente, é benigno; o amor não arde em ciúmes, não se ufana, não se ensoberbece."', ref: '1 Coríntios 13:4' },
  { texto: '"Deus é o nosso refúgio e força, socorro bem presente na angústia."', ref: 'Salmos 46:1' },
  { texto: '"Porque pela graça sois salvos, por meio da fé; e isto não vem de vós, é dom de Deus."', ref: 'Efésios 2:8' },
  { texto: '"Sede fortes e corajosos! Não temais, porque o Senhor teu Deus é o que vai contigo."', ref: 'Deuteronômio 31:6' },
  { texto: '"Jesus disse-lhe: Eu sou o caminho, e a verdade, e a vida."', ref: 'João 14:6' },
  { texto: '"Perdoai-vos mutuamente, como também Deus vos perdoou em Cristo."', ref: 'Efésios 4:32' },
  { texto: '"Porque onde estiverem dois ou três reunidos em meu nome, aí estou eu no meio deles."', ref: 'Mateus 18:20' },
  { texto: '"Mais vale um dia nos teus átrios do que mil fora deles."', ref: 'Salmos 84:10' },
  { texto: '"Criou Deus o homem à sua imagem; à imagem de Deus o criou."', ref: 'Gênesis 1:27' },
  { texto: '"A fé é o firme fundamento das coisas que se esperam e a prova das coisas que se não vêem."', ref: 'Hebreus 11:1' },
  { texto: '"Sede fortes no Senhor e na força do seu poder."', ref: 'Efésios 6:10' },
  { texto: '"Amai-vos uns aos outros; como eu vos amei, que também vós uns aos outros vos ameis."', ref: 'João 13:34' },
  { texto: '"A minha força se aperfeiçoa na fraqueza."', ref: '2 Coríntios 12:9' },
  { texto: '"Porque sou convencido de que nem a morte, nem a vida... nos poderá separar do amor de Deus."', ref: 'Romanos 8:38-39' },
  { texto: '"Honra ao Senhor com os teus bens e com as primícias de toda a tua renda."', ref: 'Provérbios 3:9' },
];

function getVersoDia() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
  return VERSOS_DIA[dayOfYear % VERSOS_DIA.length];
}

function getAniversariantesSemana() {
  try {
    const membros = loadMembros();
    const hoje = new Date();
    const resultado = [];
    for (let d = 0; d < 7; d++) {
      const dia = new Date(hoje);
      dia.setDate(hoje.getDate() + d);
      const mes = dia.getMonth() + 1;
      const diaN = dia.getDate();
      membros.forEach(m => {
        if (!m.dataNascimento) return;
        const [, mNasc, dNasc] = m.dataNascimento.split('-').map(Number);
        if (mNasc === mes && dNasc === diaN) {
          resultado.push({ ...m, diaAniversario: dia, isHoje: d === 0 });
        }
      });
    }
    return resultado;
  } catch { return []; }
}

const DIAS_SEMANA_NOME = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function eventosSaidasProximas() {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const limite = new Date(hoje); limite.setDate(hoje.getDate() + 7);
  return loadSaidas()
    .filter(s => {
      const [dia, mes, ano] = s.data.split('/').map(Number);
      const d = new Date(ano, mes - 1, dia);
      return d >= hoje && d <= limite;
    })
    .map(s => ({
      dia:          s.data.split('/')[0] + '/' + s.data.split('/')[1],
      icon:         'ph-megaphone',
      nome:         s.titulo,
      horario:      s.horario,
      restrito:     false,
      periodo:      s.horario + (s.local ? ' · ' + s.local : ''),
      diaNome:      s.diaSemana,
      foto:         null,
      isEvangelismo: true,
    }));
}

function cultoEmAndamento(cultos) {
  const now = new Date();
  const diaSemana = now.getDay();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  return cultos.find(c => {
    if (c.diaSemana !== diaSemana) return false;
    const inicio = c.hora * 60 + c.min;
    const fim    = c.horaFim * 60 + c.minFim;
    return hhmm >= inicio && hhmm < fim;
  }) || null;
}

function cultoTerminouHoje(cultos) {
  const now = new Date();
  const diaSemana = now.getDay();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  return cultos.find(c => {
    if (c.diaSemana !== diaSemana) return false;
    const fim = c.horaFim * 60 + c.minFim;
    return hhmm >= fim;
  }) || null;
}

function proximoCulto(cultos) {
  const now = new Date();
  let melhor = null;
  let melhorMs = Infinity;
  cultos.forEach(c => {
    const diasAte = (c.diaSemana - now.getDay() + 7) % 7;
    const prox = new Date(now);
    prox.setDate(now.getDate() + diasAte);
    prox.setHours(c.hora, c.min, 0, 0);
    if (prox.getTime() <= now.getTime()) prox.setDate(prox.getDate() + 7);
    const diff = prox.getTime() - now.getTime();
    if (diff < melhorMs) { melhorMs = diff; melhor = { ...c, proximaData: prox }; }
  });
  return melhor;
}

function getCountdownParts(proximaData) {
  const diff = proximaData.getTime() - Date.now();
  if (diff <= 0) return { dias: 0, horas: 0, min: 0, seg: 0 };
  const total = Math.floor(diff / 1000);
  return {
    dias:  Math.floor(total / 86400),
    horas: Math.floor((total % 86400) / 3600),
    min:   Math.floor((total % 3600) / 60),
    seg:   total % 60,
  };
}

function tipoMsgCulto(culto) {
  const nome = (culto.nome || '').toLowerCase();
  if (culto.diaSemana === 0)
    return { titulo: 'ESTAMOS ONLINE!', badge: 'AO VIVO', cor: '#dc2626', pulso: true, youtube: true };
  if (nome.includes('oração') || nome.includes('oracao'))
    return { titulo: 'ESTAMOS EM ORAÇÃO', badge: 'EM ORAÇÃO', cor: '#0c4a6e', pulso: false, youtube: false };
  if (nome.includes('ensino') || nome.includes('estudo'))
    return { titulo: 'ESTAMOS NO ESTUDO', badge: 'ESTUDO', cor: '#4c1d95', pulso: false, youtube: false };
  if (nome.includes('louvor') || nome.includes('adoração') || nome.includes('adoracao'))
    return { titulo: 'ESTAMOS EM ADORAÇÃO', badge: 'ADORAÇÃO', cor: '#92400e', pulso: false, youtube: false };
  return { titulo: 'ESTAMOS CULTUANDO', badge: 'EM CULTO', cor: '#1f2937', pulso: false, youtube: false };
}

export default function Home() {
  const config   = loadConfig();
  const mural    = loadMural();
  const cultos   = config.cultos
    .filter(c => c.ativo !== false)
    .map(c => ({
      ...c,
      diaNome: DIAS_SEMANA_NOME[c.diaSemana],
      periodo: `${formatHora(c.hora, c.min)} às ${formatHora(c.horaFim, c.minFim)}`,
    }));
  const aviso    = config.avisoHome;
  const heroBg         = config.heroBg || '/hero_bg.png';
  const heroBgPosition = config.heroBgPosition || 'center';

  const eventosSemana = cultos.map(c => ({
    id:        c.id,
    dia:       DIAS_ABBR[c.diaSemana],
    icon:      cultoIcon(c.nome),
    nome:      c.nome,
    horario:   formatHora(c.hora, c.min),
    restrito:  c.restrito || false,
    periodo:   `${formatHora(c.hora, c.min)} às ${formatHora(c.horaFim, c.minFim)}`,
    diaNome:   DIAS_SEMANA_NOME[c.diaSemana],
    foto:      c.foto || null,
  }));

  const logado          = !!sessionStorage.getItem('user_session');
  const admin           = sessionStorage.getItem('adminAuth') === 'true';
  const ultimoCultoMs   = timestampUltimoCulto(cultos);
  const pedidosPreview  = loadPreviewPedidos();
  const versoDia        = getVersoDia();
  const aniversariantes = getAniversariantesSemana();

  const eventosFiltrados = [
    ...eventosSemana.filter(ev => !ev.restrito || logado),
    ...eventosSaidasProximas(),
  ];

  const cultosVisiveis = cultos.filter(c => !c.restrito || logado);

  const [showEntrance] = useState(() => !homeEntranceShown);
  useEffect(() => { homeEntranceShown = true; }, []);

  // Indicador de "tem mais itens pro lado" no Acesso Rápido
  const acessoRapidoRef = useRef(null);
  const [scrollFade, setScrollFade] = useState({ left: false, right: false });

  useEffect(() => {
    const el = acessoRapidoRef.current;
    if (!el) return;
    const atualizarFade = () => {
      setScrollFade({
        left:  el.scrollLeft > 4,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      });
    };
    atualizarFade();
    el.addEventListener('scroll', atualizarFade, { passive: true });
    window.addEventListener('resize', atualizarFade);
    return () => {
      el.removeEventListener('scroll', atualizarFade);
      window.removeEventListener('resize', atualizarFade);
    };
  }, []);

  const [aoVivo, setAoVivo]                   = useState(() => cultoEmAndamento(cultosVisiveis));
  const [terminouHoje, setTerminouHoje]       = useState(() => cultoTerminouHoje(cultosVisiveis));
  const [proximoInfo, setProximoInfo]         = useState(() => proximoCulto(cultosVisiveis));

  useEffect(() => {
    const tick = () => {
      setAoVivo(cultoEmAndamento(cultosVisiveis));
      setTerminouHoje(cultoTerminouHoje(cultosVisiveis));
      setProximoInfo(proximoCulto(cultosVisiveis));
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mural de fotos do ministério — troca o fundo do hero a cada 5s, entrada da direita
  const [muralIndex, setMuralIndex] = useState(0);
  useEffect(() => {
    if (mural.length < 2) return;
    const timer = setInterval(() => setMuralIndex(i => (i + 1) % mural.length), 5000);
    return () => clearInterval(timer);
  }, [mural.length]);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header />

      <main className={showEntrance ? 'home-entrance' : ''} style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Hero */}
        {(() => {
          const fotoMural = mural.length > 0 ? mural[muralIndex % mural.length] : null;
          const fotoCulto = !aoVivo && !(terminouHoje?.diaSemana === 0) && proximoInfo?.foto;
          const heroBgAtual = fotoMural ? fotoMural.foto : (fotoCulto ? proximoInfo.foto : heroBg);
          const overlayOpacity = 0.15;
          return (
        <section className="glass-card hero-card image-bg" style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <img
            key={heroBgAtual}
            src={heroBgAtual}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: fotoMural ? 'center' : heroBgPosition, zIndex: 0, animation: fotoMural ? 'slideInRight 0.6s ease both' : 'none' }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `rgba(0,0,0,${overlayOpacity})`, zIndex: 1 }} />
          <div style={{ position: 'relative', zIndex: 2 }}>

            {aoVivo ? (() => {
              const msg = tipoMsgCulto(aoVivo);
              return (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-md)', background: `${msg.cor}dd`, padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
                    {msg.pulso
                      ? <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'pulseAoVivo 1.2s ease-in-out infinite' }} />
                      : <i className="ph ph-broadcast" style={{ fontSize: '0.9rem' }}></i>
                    }
                    {msg.badge}
                  </span>
                  <h1 className="hero-title font-heading" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '10px', lineHeight: 1.2 }}>
                    {msg.titulo}
                  </h1>
                  <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '6px', fontWeight: 600 }}>
                    {aoVivo.nome}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', marginBottom: msg.youtube ? 'var(--spacing-lg)' : '0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ph ph-clock"></i> {aoVivo.periodo}
                  </p>
                  {msg.youtube && (
                    <button onClick={() => window.open(config.youtubeLink || 'https://youtube.com', '_blank')} className="primary-btn" style={{ width: '100%', justifyContent: 'center', gap: '8px', background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: 'var(--spacing-lg)' }}>
                      <i className="ph ph-play-circle"></i>
                      ENTRAR NA LIVE
                    </button>
                  )}
                </>
              );
            })()
            : terminouHoje && terminouHoje.diaSemana === 0 ? (
              /* ── Culto de domingo encerrado ── */
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-md)', background: 'rgba(30,30,30,0.7)', padding: '5px 12px', borderRadius: 'var(--radius-full)' }}>
                  <i className="ph ph-check-circle" style={{ fontSize: '0.9rem' }}></i>
                  CULTO ENCERRADO
                </span>
                <h1 className="hero-title font-heading" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '10px', lineHeight: 1.2 }}>
                  QUE CULTO LINDO!
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', marginBottom: 'var(--spacing-lg)' }}>
                  Assista a pregação de hoje no YouTube
                </p>
                <button onClick={() => window.open(config.youtubeLink || 'https://youtube.com', '_blank')} className="primary-btn" style={{ width: '100%', justifyContent: 'center', gap: '8px', background: '#c4302b', color: '#fff', fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
                  <i className="ph ph-youtube-logo"></i>
                  ACESSAR YOUTUBE
                </button>
              </>
            ) : (
              /* ── Próximo culto + contagem regressiva ── */
              <>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                  Próximo culto
                </p>
                {proximoInfo ? (
                  <>
                    <h1 className="hero-title font-heading" style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '6px', lineHeight: 1.2, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                      {proximoInfo.nome}
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.95)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '6px', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                      <i className="ph ph-calendar-blank"></i>
                      {DIAS_SEMANA_NOME[proximoInfo.diaSemana]} · {formatHora(proximoInfo.hora, proximoInfo.min)}
                    </p>
                    {(() => {
                      const { dias, horas, min, seg } = getCountdownParts(proximoInfo.proximaData);
                      const partes = dias > 0
                        ? [{ v: dias, l: dias === 1 ? 'DIA' : 'DIAS' }, { v: horas, l: 'HRS' }, { v: min, l: 'MIN' }, { v: seg, l: 'SEG' }]
                        : [{ v: horas, l: 'HRS' }, { v: min, l: 'MIN' }, { v: seg, l: 'SEG' }];
                      return (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {partes.map(({ v, l }) => (
                            <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(0,0,0,0.45)', borderRadius: 'var(--radius-md)', padding: '10px 14px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.12)', minWidth: '52px' }}>
                              <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', fontFamily: 'monospace', lineHeight: 1 }}>
                                {String(v).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '1.5px', marginTop: '5px' }}>
                                {l}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <h1 className="hero-title font-heading" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2, textTransform: 'uppercase' }}>
                    {config.nomeIgreja}
                  </h1>
                )}
              </>
            )}

          </div>
        </section>
          );
        })()}

        <style>{`
          @keyframes pulseAoVivo {
            0%, 100% { opacity: 1; transform: scale(1); }
            50%       { opacity: 0.4; transform: scale(0.75); }
          }
          @keyframes floatIcon {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-4px); }
          }
          @keyframes popIn {
            0%   { opacity: 0; transform: scale(0.3) translateY(46px); }
            45%  { opacity: 1; transform: scale(1.12) translateY(-16px); }
            65%  { transform: scale(0.94) translateY(5px); }
            82%  { transform: scale(1.05) translateY(-4px); }
            100% { transform: scale(1) translateY(0); }
          }
          @keyframes cascadeIn {
            from { opacity: 0; transform: translateY(18px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          /* Entrada em cascata dos blocos da Home — só na primeira vez que o app abre.
             O atraso de 3s embutido em cada regra casa com o tempo mínimo do splash
             screen (main.jsx: hideSplash aguarda 3000ms), pra cascata só começar
             quando o splash já sumiu. Se mudar o tempo do splash, ajuste aqui também. */
          .home-entrance > * {
            opacity: 0;
            animation: cascadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          .home-entrance > *:nth-child(1)  { animation-delay: 3.00s; }
          .home-entrance > *:nth-child(2)  { animation-delay: 3.06s; }
          .home-entrance > *:nth-child(3)  { animation-delay: 3.12s; }
          .home-entrance > *:nth-child(4)  { animation-delay: 3.18s; }
          .home-entrance > *:nth-child(5)  { animation-delay: 3.24s; }
          .home-entrance > *:nth-child(6)  { animation-delay: 3.30s; }
          .home-entrance > *:nth-child(7)  { animation-delay: 3.36s; }
          .home-entrance > *:nth-child(8)  { animation-delay: 3.42s; }
          .home-entrance > *:nth-child(9)  { animation-delay: 3.48s; }
          .home-entrance > *:nth-child(10) { animation-delay: 3.54s; }
          .home-entrance > *:nth-child(n+11) { animation-delay: 3.60s; }
          .quick-btn {
            text-decoration: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            padding: 12px 4px;
            background: var(--bg-surface);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            transition: transform 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
            animation: popIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            min-width: 72px;
            flex: 0 0 auto;
          }
          .quick-btn:active {
            transform: scale(0.92);
          }
          .quick-btn:hover .quick-icon {
            animation: floatIcon 0.7s ease infinite;
          }
          .quick-btn:hover {
            background: var(--bg-surface-elevated);
            box-shadow: 0 4px 16px rgba(0,0,0,0.25);
            border-color: rgba(255,255,255,0.15);
          }
          .quick-icon {
            width: 40px; height: 40px;
            border-radius: var(--radius-sm);
            display: flex; align-items: center; justify-content: center;
            transition: filter 0.18s ease, width 0.18s ease, height 0.18s ease;
          }
          .quick-icon-glyph {
            font-size: 1.2rem;
          }
          .quick-label {
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-align: center;
            line-height: 1.2;
          }
          .quick-btn:hover .quick-icon {
            filter: brightness(1.25);
          }
          .scroll-fade {
            position: absolute;
            top: 0; bottom: 4px;
            width: 40px;
            display: flex;
            align-items: center;
            pointer-events: none;
            transition: opacity 0.2s ease;
            z-index: 2;
          }
          .scroll-fade i {
            font-size: 1rem;
            color: var(--text-secondary);
          }
          .scroll-fade-left {
            left: 0;
            background: linear-gradient(90deg, var(--bg-color) 15%, transparent 100%);
            justify-content: flex-start;
          }
          .scroll-fade-right {
            right: 0;
            background: linear-gradient(270deg, var(--bg-color) 15%, transparent 100%);
            justify-content: flex-end;
          }
          @media (min-width: 768px) {
            .scroll-fade { display: none; }
          }
          @media (min-width: 768px) and (max-width: 1024px) {
            .quick-btn {
              min-width: 88px;
              padding: 16px 8px;
            }
            .quick-icon {
              width: 52px; height: 52px;
            }
            .quick-icon-glyph {
              font-size: 1.5rem;
            }
            .quick-label {
              font-size: 0.78rem;
            }
          }
          .evento-card {
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .evento-card-next {
            box-shadow: 0 0 0 2px #fbbf24, 0 6px 22px rgba(251,191,36,0.5);
            animation: nextCultoGlow 2.2s ease-in-out infinite;
          }
          @keyframes nextCultoGlow {
            0%, 100% { box-shadow: 0 0 0 2px #fbbf24, 0 6px 22px rgba(251,191,36,0.35); }
            50%      { box-shadow: 0 0 0 2px #fde68a, 0 8px 28px rgba(251,191,36,0.7); }
          }
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideOutLeft {
            from { opacity: 1; transform: translateX(0); }
            to   { opacity: 0; transform: translateX(-40px); }
          }
        `}</style>

        {/* Acesso Rápido — scroll horizontal no celular, distribuído em telas maiores */}
        <div className="quick-access-wrap" style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
        <section ref={acessoRapidoRef} className="quick-access-row" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {[
            { to: '/oracao',         icon: 'ph-hands-praying',   label: 'Oração',        delay: '0s',    color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
            { to: '/financeiro',     icon: 'ph-hand-heart',      label: 'Contribuir',    delay: '0.07s', color: '#facc15', bg: 'rgba(250,204,21,0.15)'  },
            { to: '/evangelismo',    icon: 'ph-megaphone',       label: 'Evangelismo',   delay: '0.14s', color: '#fb923c', bg: 'rgba(251,146,60,0.15)'  },
            { to: '/teologia',       icon: 'ph-graduation-cap',  label: 'Teologia',      delay: '0.21s', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
            { to: '/ministerios',    icon: 'ph-users-three',     label: 'Ministérios',   delay: '0.28s', color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
            { to: '/devocional',     icon: 'ph-sun-horizon',     label: 'Devocional',    delay: '0.35s', color: '#f97316', bg: 'rgba(249,115,22,0.15)'  },
            { to: '/biblia',         icon: 'ph-book-bookmark',   label: 'Bíblia',        delay: '0.42s', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
            { to: '/voluntarios',    icon: 'ph-heart',           label: 'Voluntários',   delay: '0.49s', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
            { to: '/aconselhamento', icon: 'ph-chat-circle-dots', label: 'Aconselhamento', delay: '0.56s', color: '#4ade80', bg: 'rgba(74,222,128,0.15)'  },
            { to: '/carteira',       icon: 'ph-identification-card', label: 'Carteira',   delay: '0.63s', color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', apenasLogado: true },
            { to: '/admin',          icon: 'ph-shield-check',    label: 'Painel Admin',  delay: '0.70s', color: '#a3a3a3', bg: 'rgba(163,163,163,0.15)', apenasAdmin: true },
          ].filter(item => (!item.apenasLogado || logado) && (!item.apenasAdmin || admin)).map(item => (
            <Link key={item.to} to={item.to} className="quick-btn" style={{ animationDelay: item.delay }}>
              <div className="quick-icon" style={{ background: item.bg }}>
                <i className={`ph ${item.icon} quick-icon-glyph`} style={{ color: item.color }}></i>
              </div>
              <span className="quick-label">{item.label}</span>
            </Link>
          ))}
        </section>

        {/* Fade + seta indicando que dá pra rolar pros lados */}
        <div className="scroll-fade scroll-fade-left" style={{ opacity: scrollFade.left ? 1 : 0 }}>
          <i className="ph ph-caret-left"></i>
        </div>
        <div className="scroll-fade scroll-fade-right" style={{ opacity: scrollFade.right ? 1 : 0 }}>
          <i className="ph ph-caret-right"></i>
        </div>
        </div>

        {/* Programação da Semana — cards verticais */}
        <h3 className="section-title">Programação da Semana</h3>
        {eventosFiltrados.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', overflowX: 'auto', paddingTop: '6px', paddingRight: 'var(--spacing-md)', paddingBottom: '4px', paddingLeft: 'var(--spacing-md)', marginLeft: 'calc(-1 * var(--spacing-md))', marginRight: 'calc(-1 * var(--spacing-md))', marginBottom: 'var(--spacing-lg)', scrollbarWidth: 'none' }}>
            {eventosFiltrados.map((ev, i) => {
              const isLive = !ev.isEvangelismo && aoVivo?.id === ev.id;
              const isNext = !ev.isEvangelismo && !isLive && !!proximoInfo && ev.id === proximoInfo.id;
              const foto = ev.foto || CULTO_FOTO_PLACEHOLDERS[i % CULTO_FOTO_PLACEHOLDERS.length];
              const card = (
                <div className={isNext ? 'evento-card evento-card-next' : 'evento-card'} style={{ width: isNext ? '128px' : '108px', aspectRatio: '9 / 16', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.8) 100%)' }} />
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px' }}>
                    {isNext && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#fbbf24', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        <i className="ph ph-sparkle" style={{ fontSize: '0.7rem' }}></i>
                        Próximo
                      </span>
                    )}
                    {isLive && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(220,38,38,0.9)', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', animation: 'pulseAoVivo 1.2s ease-in-out infinite' }} />
                        Ao vivo
                      </span>
                    )}
                    {ev.isEvangelismo && (
                      <span style={{ alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(22,101,52,0.85)', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        Evangelismo
                      </span>
                    )}
                    <p style={{ fontSize: isNext ? '0.62rem' : '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 2px' }}>{ev.diaNome || ev.dia}</p>
                    <p style={{ fontSize: isNext ? '0.98rem' : '0.86rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', lineHeight: 1.15, margin: 0 }}>{ev.nome}</p>
                  </div>
                </div>
              );
              return ev.isEvangelismo
                ? <Link key={i} to="/evangelismo" style={{ textDecoration: 'none', flexShrink: 0 }}>{card}</Link>
                : <div key={i}>{card}</div>;
            })}
          </div>
        )}

        {/* Palavra do Dia */}
        <h3 className="section-title">Palavra do Dia</h3>
        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
          <p className="word-text" style={{ fontStyle: 'italic', marginBottom: 'var(--spacing-md)' }}>{versoDia.texto}</p>
          <p className="word-ref">{versoDia.ref}</p>
        </section>

        {/* Aniversariantes da Semana — apenas para membros logados */}
        {logado && aniversariantes.length > 0 && (
          <>
            <h3 className="section-title">🎂 Aniversariantes da Semana</h3>
            <section className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-lg)' }}>
              {aniversariantes.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: i < aniversariantes.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: m.isHoje ? 'rgba(251,146,60,0.15)' : 'var(--bg-surface-elevated)', border: `2px solid ${m.isHoje ? 'rgba(251,146,60,0.6)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: m.isHoje ? '#fb923c' : 'var(--text-secondary)' }}>
                      {m.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '1px' }}>{m.nome}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.cargo} · {m.celula}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {m.isHoje ? (
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#fb923c', background: 'rgba(251,146,60,0.12)', padding: '3px 8px', borderRadius: 'var(--radius-full)' }}>Hoje! 🎉</span>
                    ) : (
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {m.diaAniversario.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        )}

        {/* Pedidos de Oração */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Pedidos de Oração</h3>
          <Link to="/oracao" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Ver todos <i className="ph ph-caret-right"></i>
          </Link>
        </div>
        <section className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-lg)' }}>
          {pedidosPreview.map((pedido, i) => {
            const intercedido = foiIntercedido(pedido, ultimoCultoMs);
            return (
              <div key={pedido.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: i < pedidosPreview.length - 1 ? '1px solid var(--border-color)' : 'none', opacity: intercedido ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                  <i className="ph ph-hands-praying" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{pedido.nome}</p>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {pedido.texto}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        {/* Aviso da Igreja */}
        {aviso && (
          <section className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)' }}>
            <i className="ph ph-megaphone" style={{ fontSize: '1.5rem', color: 'var(--accent-color)', flexShrink: 0 }}></i>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                AVISO DA IGREJA
              </p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{aviso}</p>
            </div>
          </section>
        )}

        {/* Localização */}
        <h3 className="section-title">Onde nos encontrar</h3>
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', border: config.enderecoFoto ? 'none' : undefined }}>
          {config.enderecoFoto && (
            <>
              <img src={config.enderecoFoto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(170deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.7) 100%)', zIndex: 0 }} />
            </>
          )}
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: config.enderecoFoto ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${config.enderecoFoto ? 'rgba(255,255,255,0.3)' : 'var(--border-color)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}>
            <i className="ph ph-map-pin" style={{ fontSize: '1.4rem', color: config.enderecoFoto ? '#fff' : 'var(--accent-color)' }}></i>
          </div>
          <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: config.enderecoFoto ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{config.nomeIgreja}</p>
            <p style={{ fontSize: '0.9rem', color: config.enderecoFoto ? '#fff' : 'var(--text-primary)', marginBottom: '2px' }}>{config.endereco}</p>
            <p style={{ fontSize: '0.8rem', color: config.enderecoFoto ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)' }}>{config.cidade}</p>
          </div>
          <button
            onClick={() => window.open(config.mapsLink || 'https://maps.google.com', '_blank')}
            style={{ padding: '8px 14px', background: config.enderecoFoto ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${config.enderecoFoto ? 'rgba(255,255,255,0.3)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-full)', color: config.enderecoFoto ? '#fff' : 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0, position: 'relative', zIndex: 1 }}
          >
            <i className="ph ph-navigation-arrow"></i> Como chegar
          </button>
        </section>

        {/* Redes Sociais */}
        <div style={{ marginTop: 'var(--spacing-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>Nos siga nas redes</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { nome: 'YouTube',   icon: 'ph-youtube-logo',   gradient: 'linear-gradient(135deg,#c4302b,#ff6347)', url: config.youtubeLink },
              { nome: 'Instagram', icon: 'ph-instagram-logo', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)', url: config.instagramLink },
              { nome: 'Facebook',  icon: 'ph-facebook-logo',  gradient: 'linear-gradient(135deg,#1877f2,#0c5ebf)', url: config.facebookLink },
            ].filter(r => r.url).map(r => (
              <button
                key={r.nome}
                onClick={() => window.open(r.url, '_blank')}
                style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '14px 8px', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: r.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                  <i className={`ph ${r.icon}`} style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{r.nome}</span>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
