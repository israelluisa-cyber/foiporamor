import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { uploadFotoToStorage, saveCadastroToSupabase, updateCadastroSenhaSupabase, syncFromSupabase, verificarLoginSupabase, supabase } from '../data/supabase';
import { hashPassword, verifyPassword } from '../data/crypto';
import { loadConfig } from '../data/config';
import { PLANOS, loadPlanosConcluidos } from '../data/biblia';
import { loginOneSignalMembro, logoutOneSignalMembro, pedirPermissaoNotificacao, notificacaoPermitida, diagnosticoPushSubscription, forcarOptIn } from '../data/onesignal';

const CADASTROS_KEY      = 'cadastros_pendentes';
const USER_KEY           = 'user_cadastro';
const SESSION_KEY        = 'user_session';
const PROTECAO_LOGIN     = 'login_protecao';
const PROTECAO_RECUPERAR = 'recuperar_protecao';

const MAX_TENTATIVAS    = 3;
const BLOQUEIO_MS       = 5 * 60 * 1000;

function getProtecao(key) {
  try { return JSON.parse(localStorage.getItem(key)) || { tentativas: 0, bloqueadoAte: null }; }
  catch { return { tentativas: 0, bloqueadoAte: null }; }
}
function setProtecao(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadCadastros() {
  try { return JSON.parse(localStorage.getItem(CADASTROS_KEY)) || []; }
  catch { return []; }
}

const inputStyle = {
  width: '100%', padding: '12px 14px', background: 'var(--bg-surface)',
  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
  fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none',
};

function getInitials(nome) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?';
}

/* ── Modal de Cadastro ─────────────────────────────────────────────── */
function ModalCadastroMembro({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nome: '', email: '', celular: '', dataNascimento: '',
    bairro: '', celula: '',
    experiencia: '', password: '', confirmPassword: '',
  });
  const [previewFoto, setPreviewFoto] = useState(null);
  const [erro, setErro] = useState('');

  const set = (key) => (e) => setFormData(d => ({ ...d, [key]: e.target.value }));

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const url = await uploadFotoToStorage(compressed, 'perfil');
        setPreviewFoto(url);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.celular || !formData.password) {
      setErro('Preencha todos os campos obrigatórios.'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErro('As senhas não conferem.'); return;
    }

    const cadastros = loadCadastros();
    const emailNorm = formData.email.trim().toLowerCase();
    const celularNorm = formData.celular.replace(/\D/g, '');

    if (cadastros.some(c => c.email?.trim().toLowerCase() === emailNorm)) {
      setErro('Já existe um cadastro com este e-mail.'); return;
    }
    if (celularNorm.length >= 8 && cadastros.some(c => c.celular?.replace(/\D/g, '') === celularNorm)) {
      setErro('Já existe um cadastro com este celular.'); return;
    }

    const { hash: passwordHash, salt: passwordSalt } = await hashPassword(formData.password);

    const novoCadastro = {
      id: String(Date.now()), ...formData,
      password: undefined, confirmPassword: undefined,
      passwordHash, passwordSalt,
      foto: previewFoto || null,
      status: 'pendente',
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
      synced: false,
    };

    cadastros.push(novoCadastro);
    localStorage.setItem(CADASTROS_KEY, JSON.stringify(cadastros));
    localStorage.setItem(USER_KEY, JSON.stringify(novoCadastro));
    const enviado = await saveCadastroToSupabase(novoCadastro);

    if (enviado) {
      novoCadastro.synced = true;
      const atualizados = cadastros.map(c => c.id === novoCadastro.id ? novoCadastro : c);
      localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
      localStorage.setItem(USER_KEY, JSON.stringify(novoCadastro));
    }

    setFormData({ nome: '', email: '', celular: '', dataNascimento: '', bairro: '', celula: 'Geração de Fogo (Jovens)', experiencia: '', password: '', confirmPassword: '' });
    setPreviewFoto(null);
    setErro('');
    // Mesmo se o envio falhar aqui, o cadastro já está salvo no aparelho
    // com synced:false — a tela "Cadastro Pendente" assume dali pra frente
    // e continua tentando enviar em segundo plano até confirmar.
    onSuccess(enviado);
  };

  if (!isOpen) return null;

  const field = (label, key, type = 'text', placeholder = '') => (
    <div>
      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type} value={formData[key]} onChange={set(key)}
        placeholder={placeholder}
        style={{ ...inputStyle, padding: '10px' }}
        onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
      />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Cadastrar como Membro</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>

          {/* Foto de perfil */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: 'var(--spacing-md)', borderBottom: '1px solid var(--border-color)' }}>
            <label style={{ position: 'relative', cursor: 'pointer' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2px dashed var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {previewFoto ? (
                  <img src={previewFoto} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <i className="ph ph-camera" style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}></i>
                )}
              </div>
              {/* Botão de edição sobreposto */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', border: '2px solid var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph ph-pencil" style={{ fontSize: '0.8rem', color: 'var(--bg-color)' }}></i>
              </div>
              <input type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
            </label>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {previewFoto ? 'Toque para trocar a foto' : 'Adicionar foto de perfil (opcional)'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>Foto quadrada, ex: 500×500px</p>
            {previewFoto && (
              <button type="button" onClick={() => setPreviewFoto(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                Remover foto
              </button>
            )}
          </div>

          {field('Nome Completo *', 'nome', 'text', 'Seu nome completo')}
          {field('E-mail *', 'email', 'email', 'seu@email.com')}
          {field('Celular *', 'celular', 'tel', '(11) 99999-9999')}
          {/* Data de Nascimento — 3 selects para evitar problema de formato */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Data de Nascimento
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px', gap: '8px' }}>
              <select
                value={formData.dataNascimento ? (formData.dataNascimento.split('-')[2] || '') : ''}
                onChange={e => setFormData(fd => {
                  const p = (fd.dataNascimento || '--').split('-');
                  return { ...fd, dataNascimento: `${p[0]||''}-${p[1]||''}-${e.target.value}` };
                })}
                style={{ ...inputStyle, padding: '10px' }}
              >
                <option value="">Dia</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>
              <select
                value={formData.dataNascimento ? (formData.dataNascimento.split('-')[1] || '') : ''}
                onChange={e => setFormData(fd => {
                  const p = (fd.dataNascimento || '--').split('-');
                  return { ...fd, dataNascimento: `${p[0]||''}-${e.target.value}-${p[2]||''}` };
                })}
                style={{ ...inputStyle, padding: '10px' }}
              >
                <option value="">Mês</option>
                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <select
                value={formData.dataNascimento ? (formData.dataNascimento.split('-')[0] || '') : ''}
                onChange={e => setFormData(fd => {
                  const p = (fd.dataNascimento || '--').split('-');
                  return { ...fd, dataNascimento: `${e.target.value}-${p[1]||''}-${p[2]||''}` };
                })}
                style={{ ...inputStyle, padding: '10px' }}
              >
                <option value="">Ano</option>
                {Array.from({ length: new Date().getFullYear() - 1930 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>
          {field('Bairro', 'bairro', 'text', 'Seu bairro')}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Experiência com a Igreja</label>
            <textarea
              value={formData.experiencia} onChange={set('experiencia')}
              placeholder="Conte um pouco sobre você e sua experiência com Deus"
              style={{ ...inputStyle, padding: '10px', resize: 'none', minHeight: '80px' }}
            />
          </div>

          {field('Senha *', 'password', 'password', 'Escolha uma senha')}
          {field('Confirmar Senha *', 'confirmPassword', 'password', 'Confirme sua senha')}

          {erro && (
            <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.85rem' }}>
              {erro}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--spacing-sm)' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
            <button type="submit" style={{ flex: 1, padding: '11px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 600 }}>
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Componente principal ──────────────────────────────────────────── */
export default function Usuario() {
  const navigate = useNavigate();
  const config = loadConfig();

  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  });
  const [userCadastro, setUserCadastro] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });
  const [reenviando, setReenviando] = useState(false);

  const [tela, setTela] = useState('inicio'); // 'inicio' | 'login'
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [erro, setErro]     = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [toast, setToast]   = useState('');
  const [tempoRestante, setTempoRestante] = useState(0);
  const [tempoRestanteRec, setTempoRestanteRec] = useState(0);
  const [planosConcluidos] = useState(loadPlanosConcluidos);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    if (tempoRestante <= 0) return;
    const timer = setInterval(() => {
      const p = getProtecao(PROTECAO_LOGIN);
      const restante = p.bloqueadoAte ? Math.max(0, p.bloqueadoAte - Date.now()) : 0;
      setTempoRestante(restante);
      if (restante === 0) setErro('');
    }, 1000);
    return () => clearInterval(timer);
  }, [tempoRestante]);

  useEffect(() => {
    if (tempoRestanteRec <= 0) return;
    const timer = setInterval(() => {
      const p = getProtecao(PROTECAO_RECUPERAR);
      const restante = p.bloqueadoAte ? Math.max(0, p.bloqueadoAte - Date.now()) : 0;
      setTempoRestanteRec(restante);
      if (restante === 0) setErro('');
    }, 1000);
    return () => clearInterval(timer);
  }, [tempoRestanteRec]);

  // Só o setter é usado — força um re-render pra recalcular o status do cadastro
  // depois de cada sincronização, sem precisar ler o valor em si.
  const [, setStatusVersion] = useState(0);

  useEffect(() => {
    if (!userCadastro) return;
    let cancelado = false;
    const checarStatus = async () => {
      // Se o cadastro ainda não foi confirmado no servidor (ex.: falhou
      // por causa da internet no momento do envio), tenta reenviar antes
      // de puxar o status — assim ele se autocorrige sem o usuário precisar
      // refazer o cadastro.
      const cadastros = loadCadastros();
      const local = cadastros.find(c => String(c.id) === String(userCadastro.id));
      if (local && local.synced === false) {
        const enviado = await saveCadastroToSupabase(local, 1);
        if (cancelado) return;
        if (enviado) {
          const atualizado = { ...local, synced: true };
          const atualizados = cadastros.map(c => c.id === atualizado.id ? atualizado : c);
          localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
          localStorage.setItem(USER_KEY, JSON.stringify(atualizado));
        } else {
          // Ainda não sincronizado — não chama syncFromSupabase agora, pois ele
          // sobrescreve cadastros_pendentes inteiro com a lista do servidor e
          // apagaria esse registro local (que o servidor ainda não tem).
          setStatusVersion(v => v + 1);
          return;
        }
      }
      await syncFromSupabase();
      if (!cancelado) setStatusVersion(v => v + 1);
    };
    checarStatus();
    const intervalId = setInterval(checarStatus, 20000);
    window.addEventListener('online', checarStatus);
    return () => {
      cancelado = true;
      clearInterval(intervalId);
      window.removeEventListener('online', checarStatus);
    };
  }, [userCadastro]);

  const [fotoAtual, setFotoAtual] = useState(() => {
    try {
      const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!sess) return null;
      const cadastros = JSON.parse(localStorage.getItem(CADASTROS_KEY)) || [];
      return cadastros.find(c => String(c.id) === String(sess.id))?.foto || null;
    } catch { return null; }
  });

  /* Notificações push */
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(notificacaoPermitida);
  const handleAtivarNotificacoes = async () => {
    console.log('[onesignal] botão Ativar notificações clicado');
    try {
      await pedirPermissaoNotificacao();
      setNotificacoesAtivas(notificacaoPermitida());
      if (!notificacaoPermitida()) {
        setToast('Permissão de notificação não foi concedida.');
      }
    } catch (e) {
      console.error('[onesignal] handleAtivarNotificacoes capturou erro:', e);
      setToast(`Não deu pra ativar: ${e?.message || e}`);
    }
  };

  // Painel de depuração temporário — só aparece se o app foi aberto uma vez
  // com ?debug=1 (ver src/main.jsx). Existe pra investigar por que o push
  // cai em "not subscribed" na OneSignal direto na tela do celular, sem
  // depender do timing do console eruda nem de Mac com Safari remoto.
  const [debugAtivo] = useState(() => { try { return localStorage.getItem('debug_console') === '1'; } catch { return false; } });
  const [debugInfo, setDebugInfo] = useState(() => diagnosticoPushSubscription());
  const handleDebugRefresh = () => setDebugInfo(diagnosticoPushSubscription());
  const handleDebugOptIn = async () => {
    try {
      setDebugInfo(await forcarOptIn());
    } catch (e) {
      setDebugInfo({ erroOptIn: e?.message || String(e) });
    }
  };

  /* Login */
  const handleLogin = async (e) => {
    e.preventDefault();
    const protecao = getProtecao(PROTECAO_LOGIN);

    if (protecao.bloqueadoAte && Date.now() < protecao.bloqueadoAte) {
      const seg = Math.ceil((protecao.bloqueadoAte - Date.now()) / 1000);
      const min = Math.ceil(seg / 60);
      setErro(`Conta bloqueada. Tente novamente em ${min} minuto${min > 1 ? 's' : ''}.`);
      setTempoRestante(protecao.bloqueadoAte - Date.now());
      return;
    }

    let user = null;

    if (supabase) {
      // Senha verificada dentro do banco — o navegador nunca recebe o hash.
      const resultado = await verificarLoginSupabase(email, senha);
      if (resultado) {
        user = {
          id: resultado.id, nome: resultado.nome, email: resultado.email,
          celular: resultado.celular, celula: resultado.celula, bairro: resultado.bairro,
          dataNascimento: resultado.data_nascimento, status: resultado.status,
          foto: resultado.foto, isAdmin: resultado.is_admin,
        };
      }
    } else {
      // Sem Supabase configurado (modo local): comparação client-side, dados não saem do dispositivo.
      const cadastros = loadCadastros();
      const candidato = cadastros.find(c => c.email === email);
      if (candidato?.passwordHash) {
        if (await verifyPassword(senha, candidato.passwordHash, candidato.passwordSalt)) user = candidato;
      } else if (candidato?.password) {
        if (candidato.password === senha) {
          user = candidato;
          const { hash, salt } = await hashPassword(senha);
          const migrados = cadastros.map(c =>
            c.id === candidato.id ? { ...c, password: undefined, passwordHash: hash, passwordSalt: salt } : c
          );
          localStorage.setItem(CADASTROS_KEY, JSON.stringify(migrados));
        }
      }
    }

    if (!user) {
      const novasTentativas = (protecao.tentativas || 0) + 1;
      const restantes = MAX_TENTATIVAS - novasTentativas;
      if (novasTentativas >= MAX_TENTATIVAS) {
        const bloqueadoAte = Date.now() + BLOQUEIO_MS;
        setProtecao(PROTECAO_LOGIN, { tentativas: novasTentativas, bloqueadoAte });
        setTempoRestante(BLOQUEIO_MS);
        setErro('Muitas tentativas incorretas. Acesso bloqueado por 5 minutos.');
      } else {
        setProtecao(PROTECAO_LOGIN, { tentativas: novasTentativas, bloqueadoAte: null });
        setErro(`E-mail ou senha incorretos. ${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}.`);
      }
      setSenha('');
      return;
    }

    if (user.status === 'pendente') { setErro('Seu cadastro ainda está aguardando aprovação.'); return; }
    if (user.status === 'rejeitado') { setErro('Seu cadastro foi recusado. Fale com a secretaria.'); return; }

    setProtecao(PROTECAO_LOGIN, { tentativas: 0, bloqueadoAte: null });
    const sessionData = {
      id: user.id, nome: user.nome, email: user.email,
      celular: user.celular, celula: user.celula, bairro: user.bairro,
      dataNascimento: user.dataNascimento || null,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setFotoAtual(user.foto || null);
    setEmail(''); setSenha(''); setErro('');
    loginOneSignalMembro(sessionData.id);

    setSession(sessionData);
    if (user.isAdmin) {
      sessionStorage.setItem('adminAuth', 'true');
      navigate('/admin');
      return;
    }
    navigate('/');
  };

  /* Recuperar senha (confere e-mail + celular do cadastro aprovado) */
  const [recEmail, setRecEmail] = useState('');
  const [recCelular, setRecCelular] = useState('');
  const [recNovaSenha, setRecNovaSenha] = useState('');
  const [recConfirmSenha, setRecConfirmSenha] = useState('');

  const handleRecuperar = async (e) => {
    e.preventDefault();
    const protecao = getProtecao(PROTECAO_RECUPERAR);

    if (protecao.bloqueadoAte && Date.now() < protecao.bloqueadoAte) {
      const seg = Math.ceil((protecao.bloqueadoAte - Date.now()) / 1000);
      const min = Math.ceil(seg / 60);
      setErro(`Muitas tentativas. Tente novamente em ${min} minuto${min > 1 ? 's' : ''}.`);
      setTempoRestanteRec(protecao.bloqueadoAte - Date.now());
      return;
    }

    if (recNovaSenha.length < 4) { setErro('A nova senha deve ter pelo menos 4 caracteres.'); return; }
    if (recNovaSenha !== recConfirmSenha) { setErro('As senhas não conferem.'); return; }

    const celularNorm = recCelular.replace(/\D/g, '');
    const emailNorm = recEmail.trim().toLowerCase();
    const cadastros = loadCadastros();
    const user = cadastros.find(c =>
      c.email?.trim().toLowerCase() === emailNorm &&
      c.celular?.replace(/\D/g, '') === celularNorm &&
      c.status === 'aprovado'
    );

    if (!user) {
      const novasTentativas = (protecao.tentativas || 0) + 1;
      const restantes = MAX_TENTATIVAS - novasTentativas;
      if (novasTentativas >= MAX_TENTATIVAS) {
        const bloqueadoAte = Date.now() + BLOQUEIO_MS;
        setProtecao(PROTECAO_RECUPERAR, { tentativas: novasTentativas, bloqueadoAte });
        setTempoRestanteRec(BLOQUEIO_MS);
        setErro('Muitas tentativas incorretas. Tente novamente em 5 minutos.');
      } else {
        setProtecao(PROTECAO_RECUPERAR, { tentativas: novasTentativas, bloqueadoAte: null });
        setErro(`E-mail ou celular não conferem com nenhum cadastro aprovado. ${restantes} tentativa${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''}.`);
      }
      return;
    }

    setProtecao(PROTECAO_RECUPERAR, { tentativas: 0, bloqueadoAte: null });
    const { hash, salt } = await hashPassword(recNovaSenha);
    const atualizados = cadastros.map(c =>
      String(c.id) === String(user.id) ? { ...c, password: undefined, passwordHash: hash, passwordSalt: salt } : c
    );
    localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
    updateCadastroSenhaSupabase(user.id, hash, salt);

    setRecEmail(''); setRecCelular(''); setRecNovaSenha(''); setRecConfirmSenha(''); setErro('');
    setToast('Senha redefinida com sucesso! Você já pode entrar.');
    setTela('login');
  };

  /* Trocar foto de perfil */
  const handleTrocarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const novaFoto = await uploadFotoToStorage(compressed, 'perfil');
        setFotoAtual(novaFoto);
        const cadastros = loadCadastros();
        const atualizados = cadastros.map(c =>
          String(c.id) === String(session.id) ? { ...c, foto: novaFoto } : c
        );
        localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
        setToast('Foto atualizada com sucesso!');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  /* Logout */
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    logoutOneSignalMembro();
    setSession(null);
    setTela('inicio');
  };

  /* Cancelar cadastro pendente */
  const handleCancelCadastro = () => {
    localStorage.removeItem(USER_KEY);
    setUserCadastro(null);
  };

  /* ── Vista: Logado ─────────────────────────────────────── */
  if (session) {
    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Minha Conta" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-md)' }}>

          <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
            {/* Avatar clicável para trocar foto */}
            <label style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', marginBottom: '14px' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2px solid var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {fotoAtual ? (
                  <img src={fotoAtual} alt={session.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {getInitials(session.nome)}
                  </span>
                )}
              </div>
              {/* Botão de câmera sobreposto */}
              <div style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-color)', border: '2px solid var(--bg-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="ph ph-camera" style={{ fontSize: '0.85rem', color: 'var(--bg-color)' }}></i>
              </div>
              <input type="file" accept="image/*" onChange={handleTrocarFoto} style={{ display: 'none' }} />
            </label>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', margin: 0 }}>{session.nome}</h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600, background: 'rgba(255,255,255,0.06)', padding: '3px 10px', borderRadius: 'var(--radius-full)', display: 'inline-block', marginTop: '6px' }}>
              Membro
            </span>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>Toque na foto para alterar</p>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>Foto quadrada, ex: 500×500px</p>
          </div>

          <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            {[
              ['E-mail',  'ph-envelope',  session.email],
              ['Celular', 'ph-phone',     session.celular],
              ['Bairro',  'ph-map-pin',   session.bairro],
              ['Grupo',   'ph-users',     session.celula],
            ].filter(([,, val]) => val).map(([label, icon, val]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <i className={`ph ${icon}`} style={{ fontSize: '1.1rem', color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}></i>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>{label}</p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{val}</p>
                </div>
              </div>
            ))}
          </section>

          {/* Conquistas — planos de leitura da Bíblia concluídos */}
          <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: planosConcluidos.length ? 'var(--spacing-sm)' : 0 }}>
              <i className="ph ph-trophy" style={{ fontSize: '1.1rem', color: '#facc15' }}></i>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Conquistas de Leitura</p>
            </div>
            {planosConcluidos.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Nenhum plano de leitura concluído ainda. Que tal começar um na aba Bíblia?
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {PLANOS.filter(p => planosConcluidos.includes(p.id)).map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className="ph ph-trophy" style={{ fontSize: '0.9rem', color: '#facc15' }}></i>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{p.nome}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Plano de {p.dias.length} dias concluído</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <button
            onClick={notificacoesAtivas ? undefined : handleAtivarNotificacoes}
            disabled={notificacoesAtivas}
            style={{
              width: '100%', padding: '14px', marginBottom: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              background: notificacoesAtivas ? 'rgba(34,197,94,0.08)' : 'transparent',
              border: `1px solid ${notificacoesAtivas ? 'rgba(34,197,94,0.4)' : 'var(--border-color)'}`,
              color: notificacoesAtivas ? '#22c55e' : 'var(--text-primary)',
              cursor: notificacoesAtivas ? 'default' : 'pointer',
            }}
          >
            <i className={`ph ${notificacoesAtivas ? 'ph-bell-ringing' : 'ph-bell'}`}></i>
            {notificacoesAtivas ? 'Notificações ativadas' : 'Ativar notificações'}
          </button>

          {debugAtivo && (
            <section style={{ marginBottom: 'var(--spacing-sm)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px dashed #f59e0b', background: 'rgba(245,158,11,0.08)', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f59e0b' }}>DEBUG PUSH SUBSCRIPTION</p>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '0 0 8px' }}>{JSON.stringify(debugInfo, null, 2)}</pre>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleDebugRefresh} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>Atualizar</button>
                <button onClick={handleDebugOptIn} style={{ flex: 1, padding: '8px', fontSize: '0.7rem', cursor: 'pointer' }}>Forçar optIn()</button>
              </div>
            </section>
          )}

          <button
            onClick={handleLogout}
            style={{ width: '100%', padding: '14px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <i className="ph ph-sign-out"></i> Sair da Conta
          </button>

        </main>
      </div>
    );
  }

  /* ── Vista: Cadastro Pendente ──────────────────────────── */
  if (userCadastro) {
    const cadastros = loadCadastros();
    const cadastroAtualizado = cadastros.find(c => String(c.id) === String(userCadastro.id));
    const foiAprovado = cadastroAtualizado?.status === 'aprovado';
    const foiRejeitado = cadastroAtualizado?.status === 'rejeitado';
    const naoSincronizado = cadastroAtualizado?.synced === false;

    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Minha Conta" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-md)' }}>

          {foiAprovado && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '2.5rem', color: '#22c55e', display: 'block', marginBottom: '10px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '6px', color: '#22c55e' }}>Cadastro Aprovado! 🎉</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Bem-vindo(a) à família {config.nomeCurto}! Agora você pode entrar com seu e-mail e senha.
              </p>
              <button
                onClick={() => { localStorage.removeItem(USER_KEY); setUserCadastro(null); setTela('login'); }}
                style={{ padding: '12px 28px', background: '#22c55e', border: 'none', borderRadius: 'var(--radius-full)', color: '#000', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}
              >
                Fazer Login Agora
              </button>
            </div>
          )}

          {foiRejeitado && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <i className="ph ph-x-circle" style={{ fontSize: '2.5rem', color: '#ef4444', display: 'block', marginBottom: '10px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '6px', color: '#ef4444' }}>Cadastro não aprovado</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Entre em contato com a secretaria da igreja para mais informações.
              </p>
              <button onClick={handleCancelCadastro} style={{ padding: '10px 24px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 'var(--radius-full)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                Fechar
              </button>
            </div>
          )}

          {!foiAprovado && !foiRejeitado && (
            <div className="glass-card" style={{ textAlign: 'center' }}>
              <i className={naoSincronizado ? 'ph ph-cloud-arrow-up' : 'ph ph-clock-countdown'} style={{ fontSize: '2.5rem', color: naoSincronizado ? '#f59e0b' : 'var(--accent-color)', display: 'block', marginBottom: '12px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '8px' }}>
                {naoSincronizado ? 'Enviando seu cadastro...' : 'Cadastro Pendente'}
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                {naoSincronizado
                  ? 'Ainda não conseguimos confirmar o envio ao servidor — provavelmente por causa da internet. Deixe o app aberto que tentamos automaticamente; se preferir, toque em "Tentar agora".'
                  : 'Aguarde a aprovação do administrador. Quando aprovado, você poderá entrar com seu e-mail e senha.'}
              </p>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: 'var(--spacing-lg)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}><strong>Nome:</strong> {userCadastro.nome}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '8px 0 0 0' }}><strong>E-mail:</strong> {userCadastro.email}</p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0 0 0' }}>
                  <strong>Status: </strong>
                  {naoSincronizado
                    ? <span style={{ color: '#f59e0b', fontWeight: 600 }}>Não enviado ainda — tentando de novo</span>
                    : <span style={{ color: '#f59e0b', fontWeight: 600 }}>Aguardando aprovação</span>}
                </p>
              </div>
              {naoSincronizado && (
                <button
                  onClick={async () => {
                    setReenviando(true);
                    const enviado = await saveCadastroToSupabase(cadastroAtualizado, 1);
                    if (enviado) {
                      const atualizado = { ...cadastroAtualizado, synced: true };
                      const atualizados = cadastros.map(c => c.id === atualizado.id ? atualizado : c);
                      localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
                      localStorage.setItem(USER_KEY, JSON.stringify(atualizado));
                      setStatusVersion(v => v + 1);
                    }
                    setReenviando(false);
                  }}
                  disabled={reenviando}
                  style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: reenviando ? 'default' : 'pointer', fontWeight: 700, marginBottom: 'var(--spacing-sm)', opacity: reenviando ? 0.7 : 1 }}
                >
                  {reenviando ? 'Tentando...' : 'Tentar agora'}
                </button>
              )}
              <button onClick={handleCancelCadastro} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                Cancelar Cadastro
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  /* ── Vista: Início / Login ─────────────────────────────── */
  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Minha Conta" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Tela inicial + login, unificadas */}
        {(tela === 'inicio' || tela === 'login') && (
          <>
            <div className="login-card">
              {config.enderecoFoto && (
                <>
                  <img src={config.enderecoFoto} alt="" className="login-card-bg" />
                  <div className="login-card-overlay" />
                </>
              )}

              <div className="login-card-content">
                <img
                  src={config.logoUrl || '/logo-icon.png'}
                  alt={config.nomeIgreja}
                  className="login-logo login-anim-pop"
                  style={{ '--login-anim-delay': '0s' }}
                />
                <div className="login-brand login-anim" style={{ '--login-anim-delay': '0.15s' }}>
                  <span className="login-brand-kicker">Igreja</span>
                  <span className="login-brand-name">{config.nomeCurto}</span>
                </div>

                <h1 className="login-title login-anim" style={{ '--login-anim-delay': '0.3s' }}>Bem-vindo(a)!</h1>
                <p className="login-subtitle login-anim" style={{ '--login-anim-delay': '0.45s' }}>Faça login para acessar sua conta</p>

                <form onSubmit={handleLogin} className="login-form">
                  <div className="login-input login-anim" style={{ '--login-anim-delay': '0.6s' }}>
                    <i className="ph ph-envelope-simple"></i>
                    <input
                      type="email" value={email}
                      onChange={e => { setEmail(e.target.value); setErro(''); }}
                      placeholder="seu@email.com"
                      autoFocus required
                    />
                  </div>

                  <div className="login-input login-anim" style={{ '--login-anim-delay': '0.75s' }}>
                    <i className="ph ph-lock-simple"></i>
                    <input
                      type={mostrarSenha ? 'text' : 'password'} value={senha}
                      onChange={e => { setSenha(e.target.value); setErro(''); }}
                      placeholder="Digite sua senha"
                      required
                    />
                    <button
                      type="button"
                      className="login-eye"
                      onClick={() => setMostrarSenha(v => !v)}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      <i className={`ph ${mostrarSenha ? 'ph-eye-slash' : 'ph-eye'}`}></i>
                    </button>
                  </div>

                  {erro && (
                    <div className="login-error">
                      <i className="ph ph-warning-circle"></i> {erro}
                    </div>
                  )}

                  <button
                    type="button"
                    className="login-forgot login-anim"
                    style={{ '--login-anim-delay': '0.9s' }}
                    onClick={() => { setTela('recuperar'); setErro(''); setEmail(''); setSenha(''); }}
                  >
                    Esqueci minha senha
                  </button>

                  <button type="submit" className="login-submit login-anim" style={{ '--login-anim-delay': '1.05s' }} disabled={tempoRestante > 0}>
                    <i className="ph ph-sign-in"></i>
                    <span>{tempoRestante > 0 ? `Aguarde ${Math.ceil(tempoRestante / 1000)}s` : 'Entrar'}</span>
                  </button>
                </form>

                <div className="login-divider login-anim" style={{ '--login-anim-delay': '1.2s' }}><span>nossas redes</span></div>

                <div className="login-social-row">
                  <a href={config.youtubeLink} target="_blank" rel="noopener noreferrer" className="login-social-btn youtube login-anim" style={{ '--login-anim-delay': '1.35s' }}>
                    <i className="ph-fill ph-youtube-logo"></i>
                    <span>YouTube</span>
                  </a>
                  <a href={config.facebookLink} target="_blank" rel="noopener noreferrer" className="login-social-btn facebook login-anim" style={{ '--login-anim-delay': '1.5s' }}>
                    <i className="ph-fill ph-facebook-logo"></i>
                    <span>Facebook</span>
                  </a>
                  <a href={config.instagramLink} target="_blank" rel="noopener noreferrer" className="login-social-btn instagram login-anim" style={{ '--login-anim-delay': '1.65s' }}>
                    <i className="ph-fill ph-instagram-logo"></i>
                    <span>Instagram</span>
                  </a>
                </div>

                <p className="login-signup login-anim" style={{ '--login-anim-delay': '1.8s' }}>
                  <i className="ph ph-user-plus"></i>
                  Ainda não tem conta?{' '}
                  <button onClick={() => setModalCadastro(true)}>Cadastrar como membro</button>
                </p>
              </div>
            </div>

            <div className="login-badges">
              <div className="login-badge login-anim" style={{ '--login-anim-delay': '1.95s' }}>
                <i className="ph ph-shield-check"></i>
                <strong>Ambiente Seguro</strong>
                <span>Seus dados protegidos</span>
              </div>
              <div className="login-badge login-anim" style={{ '--login-anim-delay': '2.1s' }}>
                <i className="ph ph-users-three"></i>
                <strong>Comunidade</strong>
                <span>Conecte-se e participe</span>
              </div>
              <div className="login-badge login-anim" style={{ '--login-anim-delay': '2.25s' }}>
                <i className="ph ph-heart"></i>
                <strong>Propósito</strong>
                <span>Juntos por um só amor</span>
              </div>
            </div>
          </>
        )}

        {/* Tela de recuperação de senha */}
        {tela === 'recuperar' && (
          <>
            <button
              onClick={() => { setTela('login'); setErro(''); setRecEmail(''); setRecCelular(''); setRecNovaSenha(''); setRecConfirmSenha(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 'var(--spacing-lg)', padding: 0, fontSize: '0.9rem' }}
            >
              <i className="ph ph-arrow-left"></i> Voltar
            </button>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '4px' }}>Recuperar Senha</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              Confirme o e-mail e o celular do seu cadastro aprovado e defina uma nova senha.
            </p>

            <form onSubmit={handleRecuperar} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>E-mail do cadastro</label>
                <input
                  type="email" value={recEmail}
                  onChange={e => { setRecEmail(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="seu@email.com"
                  autoFocus required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Celular do cadastro</label>
                <input
                  type="tel" value={recCelular}
                  onChange={e => { setRecCelular(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="(00) 00000-0000"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Nova senha</label>
                <input
                  type="password" value={recNovaSenha}
                  onChange={e => { setRecNovaSenha(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="••••••"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Confirmar nova senha</label>
                <input
                  type="password" value={recConfirmSenha}
                  onChange={e => { setRecConfirmSenha(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="••••••"
                  required
                />
              </div>

              {erro && (
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-warning-circle"></i> {erro}
                </div>
              )}

              <button type="submit" className="primary-btn" disabled={tempoRestanteRec > 0} style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 'var(--spacing-sm)', opacity: tempoRestanteRec > 0 ? 0.5 : 1, cursor: tempoRestanteRec > 0 ? 'not-allowed' : 'pointer' }}>
                <i className="ph ph-key"></i>
                <span>{tempoRestanteRec > 0 ? `Aguarde ${Math.ceil(tempoRestanteRec / 1000)}s` : 'Redefinir senha'}</span>
              </button>
            </form>
          </>
        )}

      </main>

      <ModalCadastroMembro
        isOpen={modalCadastro}
        onClose={() => setModalCadastro(false)}
        onSuccess={(enviado) => {
          setModalCadastro(false);
          try { setUserCadastro(JSON.parse(localStorage.getItem(USER_KEY))); } catch { /* localStorage sem o cadastro recém-salvo — segue sem sessão local */ }
          setToast(enviado
            ? 'Cadastro enviado! Aguarde a aprovação do administrador.'
            : 'Cadastro salvo no aparelho. Não conseguimos confirmar o envio agora — vamos tentar de novo automaticamente.');
        }}
      />

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} duration={5000} />}
    </div>
  );
}
