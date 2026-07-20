import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { loadMembros } from '../data/membros';
import { loadConfig, DIAS_ABBR, formatHora, cultoIcon } from '../data/config';
import { loadSaidas } from '../data/evangelismo';
import { loadMural } from '../data/muralData';
import { loadAvisosValidos, TIPO_CORES } from '../data/avisos';
import { FaInstagram, FaFacebook, FaYoutube } from 'react-icons/fa6';

// EVENTOS_SEMANA é derivado dinamicamente do config no componente

// TODO: placeholders temporários — trocar por fotos reais de cada culto (ver /admin)
const CULTO_FOTO_PLACEHOLDERS = [
  '/culto-placeholder-1.jpg',
  '/culto-placeholder-2.jpg',
  '/culto-placeholder-3.jpg',
  '/culto-placeholder-4.jpg',
];

const STORAGE_KEY_PEDIDOS = 'pedidos_oracao';
const CADASTROS_KEY_PEDIDOS = 'cadastros_pendentes';

// Foto por celular — cobre pedidos antigos (enviados antes de guardarmos a foto
// junto) reencontrando o cadastro do membro pelo mesmo celular do pedido.
function fotoPorCelular(celular) {
  if (!celular) return null;
  try {
    const cadastros = JSON.parse(localStorage.getItem(CADASTROS_KEY_PEDIDOS)) || [];
    return cadastros.find(c => c.celular === celular)?.foto || null;
  } catch { return null; }
}

// true só na primeira vez que a Home monta nesta sessão do app — evita
// que a animação de entrada repita toda vez que o usuário navega de volta pra Home
let homeEntranceShown = false;

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
  return pedido.id < ultimoCultoMs;
}

// Carrega pedidos públicos do localStorage, limita a 3 — os já intercedidos no
// último Culto de Oração saem da lista (mesmo critério do mural em /oracao).
function loadPreviewPedidos(ultimoCultoMs) {
  try {
    const user = JSON.parse(localStorage.getItem(STORAGE_KEY_PEDIDOS)) || [];
    const publicos = user.filter(p => !p.privado && !foiIntercedido(p, ultimoCultoMs));
    return publicos.map(p => ({ id: p.id, nome: p.nome || 'Anônimo', texto: p.texto, foto: p.foto || fotoPorCelular(p.celular) })).slice(0, 3);
  } catch {
    return [];
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
  if (nome.includes('teologia') || nome.includes('curso'))
    return { titulo: 'ESTAMOS EM AULA', badge: 'AO VIVO', cor: '#1d4ed8', pulso: true, youtube: true };
  if (nome.includes('oração') || nome.includes('oracao'))
    return { titulo: 'ESTAMOS EM ORAÇÃO', badge: 'AO VIVO', cor: '#0c4a6e', pulso: true, youtube: true };
  if (nome.includes('ensino') || nome.includes('estudo'))
    return { titulo: 'ESTAMOS NO ESTUDO', badge: 'AO VIVO', cor: '#4c1d95', pulso: true, youtube: true };
  if (nome.includes('ensaio'))
    return { titulo: 'ESTAMOS ENSAIANDO', badge: 'AGORA', cor: '#92400e', pulso: true, youtube: false };
  if (nome.includes('louvor') || nome.includes('adoração') || nome.includes('adoracao'))
    return { titulo: 'ESTAMOS EM ADORAÇÃO', badge: 'AO VIVO', cor: '#92400e', pulso: true, youtube: true };
  return { titulo: 'ESTAMOS CULTUANDO', badge: 'AO VIVO', cor: '#1f2937', pulso: true, youtube: true };
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
  const avisosAtivos = loadAvisosValidos();
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
  const pedidosPreview  = loadPreviewPedidos(ultimoCultoMs);
  const versoDia        = getVersoDia();
  const aniversariantes = getAniversariantesSemana();

  const eventosFiltrados = [
    ...eventosSemana.filter(ev => !ev.restrito || logado),
    ...eventosSaidasProximas(),
  ];

  const cultosVisiveis = cultos.filter(c => !c.restrito || logado);

  const [showEntrance] = useState(() => !homeEntranceShown);
  useEffect(() => { homeEntranceShown = true; }, []);

  // Zoom de entrada — só na primeira vez que a Home monta na sessão (mesmo gatilho
  // do showEntrance): a tela toda começa afastada (dá pra ver do topo até as redes
  // sociais) e puxa rápido pro zoom normal, bem no momento em que o splash termina.
  const containerRef = useRef(null);
  const [introAtivo, setIntroAtivo] = useState(showEntrance);
  const [introEscala, setIntroEscala] = useState(0.55);
  const INTRO_ZOOM_DURACAO_MS = 900;
  const INTRO_ZOOM_ATRASO_MS = 3000; // casa com o tempo mínimo do splash (main.jsx)

  useLayoutEffect(() => {
    if (!introAtivo || !containerRef.current) return;
    const alturaConteudo = containerRef.current.scrollHeight;
    const alturaTela = window.innerHeight;
    const escala = Math.min(0.85, Math.max(0.32, alturaTela / alturaConteudo));
    setIntroEscala(escala);
  }, [introAtivo]);

  useEffect(() => {
    if (!introAtivo) return;
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => setIntroAtivo(false), INTRO_ZOOM_ATRASO_MS + INTRO_ZOOM_DURACAO_MS);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [introAtivo]);

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

  const scrollAcessoRapido = (direcao) => {
    acessoRapidoRef.current?.scrollBy({ left: direcao * 220, behavior: 'smooth' });
  };

  // Ticker de avisos — quando tem mais de um, troca pro próximo a cada 5s.
  // Quando só tem um, fica sempre nele (não tem pra onde trocar).
  const [avisoIndex, setAvisoIndex] = useState(0);

  const avisoAtual = avisosAtivos[avisoIndex % avisosAtivos.length] || null;
  const avisoTickerTexto = avisoAtual?.texto || '';
  const avisoTipoCor = TIPO_CORES[avisoAtual?.tipo] || TIPO_CORES.Informativo;

  // Mede a largura real do texto e do bloco pra calcular um percurso exato:
  // entra pela direita, sai pela esquerda e some por 3s até repetir.
  const avisoTickerWrapRef  = useRef(null);
  const avisoTickerTrackRef = useRef(null);
  const [avisoTickerMedidas, setAvisoTickerMedidas] = useState({ largura: 0, texto: 0 });

  useLayoutEffect(() => {
    const medir = () => {
      if (avisoTickerWrapRef.current && avisoTickerTrackRef.current) {
        setAvisoTickerMedidas({
          largura: avisoTickerWrapRef.current.offsetWidth,
          texto:   avisoTickerTrackRef.current.offsetWidth,
        });
      }
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [avisoTickerTexto]);

  const AVISO_TICKER_PAUSA_S = 3;
  const AVISO_TICKER_VELOCIDADE_PX_S = 90;
  const avisoTickerPercurso = avisoTickerMedidas.largura + avisoTickerMedidas.texto;
  const avisoTickerDuracaoScroll = avisoTickerMedidas.texto
    ? Math.max(3, avisoTickerPercurso / AVISO_TICKER_VELOCIDADE_PX_S)
    : 3;
  const avisoTickerDuracaoTotal = avisoTickerDuracaoScroll + AVISO_TICKER_PAUSA_S;
  const avisoTickerScrollPct = (avisoTickerDuracaoScroll / avisoTickerDuracaoTotal) * 100;

  // Só passa pro próximo aviso depois que a mensagem atual termina o ciclo completo
  // (rolagem + pausa) — um timer fixo cortava mensagens longas no meio do percurso.
  useEffect(() => {
    if (avisosAtivos.length <= 1) return;
    const timer = setTimeout(() => {
      setAvisoIndex(i => (i + 1) % avisosAtivos.length);
    }, avisoTickerDuracaoTotal * 1000);
    return () => clearTimeout(timer);
  }, [avisoTickerDuracaoTotal, avisosAtivos.length]);

  const [aoVivo, setAoVivo]                   = useState(() => cultoEmAndamento(cultosVisiveis));
  const [terminouHoje, setTerminouHoje]       = useState(() => cultoTerminouHoje(cultosVisiveis));
  const [proximoInfo, setProximoInfo]         = useState(() => proximoCulto(cultosVisiveis));

  // cultosVisiveis é um array novo a cada render (vem de um .filter()) — colocá-lo
  // aqui recriaria o interval a cada render em vez de manter só um rodando por segundo.
  useEffect(() => {
    const tick = () => {
      setAoVivo(cultoEmAndamento(cultosVisiveis));
      setTerminouHoje(cultoTerminouHoje(cultosVisiveis));
      setProximoInfo(proximoCulto(cultosVisiveis));
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Programação da Semana — mantém a ordem cronológica normal dos cards, mas rola
  // a faixa automaticamente até o card do próximo culto ficar centralizado. Reroda só
  // quando o próximo culto muda de fato (não a cada tick do relógio).
  const programacaoRef = useRef(null);
  const programacaoJaRolouRef = useRef(false);
  useLayoutEffect(() => {
    const container = programacaoRef.current;
    if (!container) return;
    const proximoCard = container.querySelector('[data-proximo-culto="true"]');
    if (!proximoCard) return;
    const containerRect = container.getBoundingClientRect();
    const cardRect = proximoCard.getBoundingClientRect();
    const alvo = container.scrollLeft + (cardRect.left - containerRect.left) - (container.clientWidth - cardRect.width) / 2;
    container.scrollTo({ left: Math.max(0, alvo), behavior: programacaoJaRolouRef.current ? 'smooth' : 'auto' });
    programacaoJaRolouRef.current = true;
  }, [proximoInfo?.id]);

  // Mural de fotos do ministério — troca o fundo do hero a cada 5s, entrada da direita.
  // O efeito depende de muralIndex pra reiniciar a contagem dos 5s sempre que a foto
  // muda — seja pelo próprio timer ou por um swipe manual do usuário.
  const [muralIndex, setMuralIndex] = useState(0);
  useEffect(() => {
    if (mural.length < 2) return;
    const timer = setInterval(() => setMuralIndex(i => (i + 1) % mural.length), 5000);
    return () => clearInterval(timer);
  }, [mural.length, muralIndex]);

  // Swipe manual no hero pra navegar entre as fotos do mural
  const heroTouchStartXRef = useRef(null);
  const handleHeroTouchStart = (e) => {
    heroTouchStartXRef.current = e.touches[0].clientX;
  };
  const handleHeroTouchEnd = (e) => {
    const startX = heroTouchStartXRef.current;
    heroTouchStartXRef.current = null;
    if (startX == null || mural.length < 2) return;
    const deltaX = startX - e.changedTouches[0].clientX;
    const SWIPE_THRESHOLD = 40;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    const len = mural.length;
    setMuralIndex(i => deltaX > 0 ? (i + 1) % len : (i - 1 + len) % len);
  };

  return (
    <div
      ref={containerRef}
      className="container"
      style={{
        paddingBottom: 'var(--spacing-xl)',
        ...(introAtivo ? {
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--bg-color)', transformOrigin: 'top center',
          animation: `homeZoomIntro ${INTRO_ZOOM_DURACAO_MS}ms cubic-bezier(0.16, 1, 0.3, 1) ${INTRO_ZOOM_ATRASO_MS}ms both`,
        } : {}),
      }}
    >
      <Header />

      <main className={showEntrance ? 'home-entrance' : ''} style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Hero */}
        {(() => {
          const fotoMural = mural.length > 0 ? mural[muralIndex % mural.length] : null;
          const fotoCulto = !aoVivo && !(terminouHoje?.diaSemana === 0) && proximoInfo?.foto;
          const heroBgAtual = fotoMural ? fotoMural.foto : (fotoCulto ? proximoInfo.foto : heroBg);
          const overlayOpacity = 0.15;
          return (
        <section
          className="glass-card hero-card image-bg"
          style={{ marginBottom: 'var(--spacing-lg)', position: 'relative', overflow: 'hidden', borderRadius: 'var(--radius-lg)', minHeight: '260px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', touchAction: 'pan-y' }}
          onTouchStart={handleHeroTouchStart}
          onTouchEnd={handleHeroTouchEnd}
        >
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
            ) : (() => {
              /* ── Legenda da imagem em exibição: legenda do mural, ou nome do culto quando a foto é dele ── */
              const label = fotoMural ? fotoMural.legenda : (fotoCulto ? proximoInfo.nome : null);
              if (label) {
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#fff', textShadow: '0 1px 6px rgba(0,0,0,0.9)', background: 'rgba(0,0,0,0.45)', padding: '6px 13px', borderRadius: 'var(--radius-full)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.14)' }}>
                    <i className="ph ph-image" style={{ fontSize: '0.85rem' }}></i>
                    {label}
                  </span>
                );
              }
              if (!proximoInfo) {
                return (
                  <h1 className="hero-title font-heading" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.2, textTransform: 'uppercase' }}>
                    {config.nomeIgreja}
                  </h1>
                );
              }
              return null;
            })()}

          </div>

          {mural.length > 1 && (
            <div style={{ position: 'absolute', bottom: '10px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '5px', zIndex: 3 }}>
              {mural.map((_, i) => (
                <span
                  key={i}
                  style={{
                    width: i === muralIndex % mural.length ? '16px' : '6px', height: '6px', borderRadius: 'var(--radius-full)',
                    background: i === muralIndex % mural.length ? '#fff' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.25s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                  }}
                />
              ))}
            </div>
          )}
        </section>
          );
        })()}

        <style>{`
          @keyframes homeZoomIntro {
            0%   { transform: scale(${introEscala}); }
            100% { transform: scale(1); }
          }
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
          .aviso-ticker-mask {
            display: block;
            width: 100%;
            overflow: hidden;
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
          }
          .aviso-ticker-track {
            display: inline-block;
            white-space: nowrap;
            font-size: 0.9rem;
            color: var(--text-primary);
            animation-name: avisoTickerScroll;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
          }
          @keyframes avisoTickerScroll {
            0% { transform: translateX(${avisoTickerMedidas.largura}px); }
            ${avisoTickerScrollPct}% { transform: translateX(-${avisoTickerMedidas.texto}px); }
            100% { transform: translateX(-${avisoTickerMedidas.texto}px); }
          }
          .aviso-tipo-piscando {
            animation: avisoTipoPiscar 1s ease-in-out infinite;
          }
          @keyframes avisoTipoPiscar {
            0%, 100% { opacity: 1; }
            50%      { opacity: 0.35; }
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
            { to: '/admin',          icon: 'ph-shield-check',    label: 'Painel Admin',  delay: '0.63s', color: '#a3a3a3', bg: 'rgba(163,163,163,0.15)', apenasAdmin: true },
          ].filter(item => (!item.apenasLogado || logado) && (!item.apenasAdmin || admin)).map(item => (
            <Link key={item.to} to={item.to} className="quick-btn" style={{ animationDelay: item.delay }}>
              <div className="quick-icon" style={{ background: item.bg }}>
                <i className={`ph ${item.icon} quick-icon-glyph`} style={{ color: item.color }}></i>
              </div>
              <span className="quick-label">{item.label}</span>
            </Link>
          ))}
        </section>

        {/* Fade + seta indicando (e permitindo, no clique) rolar pros lados */}
        <div
          className="scroll-fade scroll-fade-left"
          onClick={() => scrollAcessoRapido(-1)}
          style={{ opacity: scrollFade.left ? 1 : 0, pointerEvents: scrollFade.left ? 'auto' : 'none', cursor: 'pointer' }}
        >
          <i className="ph ph-caret-left"></i>
        </div>
        <div
          className="scroll-fade scroll-fade-right"
          onClick={() => scrollAcessoRapido(1)}
          style={{ opacity: scrollFade.right ? 1 : 0, pointerEvents: scrollFade.right ? 'auto' : 'none', cursor: 'pointer' }}
        >
          <i className="ph ph-caret-right"></i>
        </div>
        </div>

        {/* Programação da Semana — cards verticais */}
        <h3 className="section-title">Programação da Semana</h3>
        {eventosFiltrados.length > 0 && (
          <div ref={programacaoRef} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', overflowX: 'auto', paddingTop: '6px', paddingRight: 'var(--spacing-md)', paddingBottom: '4px', paddingLeft: 'var(--spacing-md)', marginLeft: 'calc(-1 * var(--spacing-md))', marginRight: 'calc(-1 * var(--spacing-md))', marginBottom: 'var(--spacing-lg)', scrollbarWidth: 'none' }}>
            {eventosFiltrados.map((ev, i) => {
              const isLive = !ev.isEvangelismo && aoVivo?.id === ev.id;
              // Ensaio de sexta não tem transmissão — mostra "Agora" em vez de "Ao vivo"
              const liveComLink = isLive && tipoMsgCulto(ev).youtube;
              // Enquanto algum culto está ao vivo, ninguém é "Próximo" — o destaque
              // vai todo pro card que está acontecendo agora, não pro que vem depois.
              const isNext = !ev.isEvangelismo && !isLive && !aoVivo && !!proximoInfo && ev.id === proximoInfo.id;
              const destaque = isNext || isLive;
              const foto = ev.foto || CULTO_FOTO_PLACEHOLDERS[i % CULTO_FOTO_PLACEHOLDERS.length];
              const card = (
                <div data-proximo-culto={destaque ? 'true' : undefined} className={destaque ? 'evento-card evento-card-next' : 'evento-card'} style={{ width: '108px', aspectRatio: '9 / 16', borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', flexShrink: 0, backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 65%, rgba(0,0,0,0.95) 100%)' }} />
                  <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '10px' }}>
                    {isNext && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#fbbf24', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        <i className="ph ph-sparkle" style={{ fontSize: '0.7rem' }}></i>
                        Próximo
                      </span>
                    )}
                    {isLive && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: liveComLink ? 'rgba(220,38,38,0.9)' : 'rgba(146,64,14,0.9)', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff', animation: 'pulseAoVivo 1.2s ease-in-out infinite' }} />
                        {liveComLink ? 'Ao vivo' : 'Agora'}
                      </span>
                    )}
                    {ev.isEvangelismo && (
                      <span style={{ alignSelf: 'flex-start', fontSize: '0.55rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', background: 'rgba(22,101,52,0.85)', padding: '2px 7px', borderRadius: 'var(--radius-full)', marginBottom: '6px' }}>
                        Evangelismo
                      </span>
                    )}
                    <p style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 2px' }}>{ev.diaNome || ev.dia}</p>
                    <p style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', textTransform: 'uppercase', lineHeight: 1.15, margin: 0 }}>{ev.nome}</p>
                    {isNext && proximoInfo && (() => {
                      const { dias, horas, min, seg } = getCountdownParts(proximoInfo.proximaData);
                      const pad = n => String(n).padStart(2, '0');
                      const countdownStr = dias > 0 ? `${dias}d ${pad(horas)}h` : `${pad(horas)}:${pad(min)}:${pad(seg)}`;
                      return (
                        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums', margin: '3px 0 0' }}>
                          {countdownStr}
                        </p>
                      );
                    })()}
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
            return (
              <div key={pedido.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: i < pedidosPreview.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                  {pedido.foto ? (
                    <img src={pedido.foto} alt={pedido.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="ph ph-hands-praying" style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}></i>
                  )}
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
          {pedidosPreview.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
              <i className="ph ph-hands-praying" style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}></i>
              <p style={{ fontSize: '0.85rem', margin: 0 }}>Nenhum pedido público no momento.</p>
            </div>
          )}
        </section>

        {/* Aviso da Igreja — ticker com os avisos válidos no momento, puxados da mesma lista da tela /avisos */}
        {avisosAtivos.length > 0 && (
          <Link to="/avisos" className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', textDecoration: 'none', color: 'inherit' }}>
            <i className="ph ph-megaphone" style={{ fontSize: '1.5rem', color: 'var(--accent-color)', flexShrink: 0 }}></i>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>
                AVISOS DA IGREJA
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {avisoAtual && (
                  <span
                    className={avisoAtual.tipo === 'Urgente' ? 'aviso-tipo-piscando' : undefined}
                    style={{ flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: avisoTipoCor.text, background: avisoTipoCor.bg, border: `1px solid ${avisoTipoCor.border}`, borderRadius: 'var(--radius-full)', padding: '1px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    {avisoAtual.tipo}
                  </span>
                )}
                <div className="aviso-ticker-mask" ref={avisoTickerWrapRef} style={{ flex: 1, minWidth: 0 }}>
                  <div key={avisoIndex} ref={avisoTickerTrackRef} className="aviso-ticker-track" style={{ animationDuration: `${avisoTickerDuracaoTotal}s` }}>
                    {avisoTickerTexto}
                  </div>
                </div>
              </div>
            </div>
          </Link>
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
              { nome: 'YouTube',   Icon: FaYoutube,   gradient: 'linear-gradient(135deg,#c4302b,#ff6347)', url: config.youtubeLink },
              { nome: 'Instagram', Icon: FaInstagram, gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#f77737)', url: config.instagramLink },
              { nome: 'Facebook',  Icon: FaFacebook,  gradient: 'linear-gradient(135deg,#1877f2,#0c5ebf)', url: config.facebookLink },
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
                  <r.Icon size="1.4rem" color="#fff" />
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
