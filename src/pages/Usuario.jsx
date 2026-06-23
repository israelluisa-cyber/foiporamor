import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';

const CADASTROS_KEY = 'cadastros_pendentes';
const USER_KEY     = 'user_cadastro';
const SESSION_KEY  = 'user_session';

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
    bairro: '', celula: 'Geração de Fogo (Jovens)',
    experiencia: '', password: '', confirmPassword: '',
  });
  const [previewFoto, setPreviewFoto] = useState(null);
  const [erro, setErro] = useState('');

  const set = (key) => (e) => setFormData(d => ({ ...d, [key]: e.target.value }));

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewFoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nome || !formData.email || !formData.celular || !formData.password) {
      setErro('Preencha todos os campos obrigatórios.'); return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErro('As senhas não conferem.'); return;
    }

    const novoCadastro = {
      id: Date.now(), ...formData,
      foto: previewFoto || null,
      status: 'pendente',
      dataCadastro: new Date().toLocaleDateString('pt-BR'),
    };

    const cadastros = loadCadastros();
    cadastros.push(novoCadastro);
    localStorage.setItem(CADASTROS_KEY, JSON.stringify(cadastros));
    localStorage.setItem(USER_KEY, JSON.stringify(novoCadastro));

    setFormData({ nome: '', email: '', celular: '', dataNascimento: '', bairro: '', celula: 'Geração de Fogo (Jovens)', experiencia: '', password: '', confirmPassword: '' });
    setPreviewFoto(null);
    setErro('');
    onSuccess();
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
            {previewFoto && (
              <button type="button" onClick={() => setPreviewFoto(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
                Remover foto
              </button>
            )}
          </div>

          {field('Nome Completo *', 'nome', 'text', 'Seu nome completo')}
          {field('E-mail *', 'email', 'email', 'seu@email.com')}
          {field('Celular *', 'celular', 'tel', '(11) 99999-9999')}
          {field('Data de Nascimento', 'dataNascimento', 'date')}
          {field('Bairro', 'bairro', 'text', 'Seu bairro')}

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Célula</label>
            <select value={formData.celula} onChange={set('celula')} style={{ ...inputStyle, padding: '10px' }}>
              <option>Geração de Fogo (Jovens)</option>
              <option>Lar de Paz (Famílias)</option>
              <option>Ainda não escolhi</option>
            </select>
          </div>

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

  const [session, setSession] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
  });
  const [userCadastro, setUserCadastro] = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)) || null; } catch { return null; }
  });

  const [tela, setTela] = useState('inicio'); // 'inicio' | 'login'
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [erro, setErro]     = useState('');
  const [modalCadastro, setModalCadastro] = useState(false);
  const [toast, setToast]   = useState('');

  const [fotoAtual, setFotoAtual] = useState(() => {
    try {
      const sess = JSON.parse(sessionStorage.getItem(SESSION_KEY));
      if (!sess) return null;
      const cadastros = JSON.parse(localStorage.getItem(CADASTROS_KEY)) || [];
      return cadastros.find(c => c.id === sess.id)?.foto || null;
    } catch { return null; }
  });

  /* Login */
  const handleLogin = (e) => {
    e.preventDefault();
    const cadastros = loadCadastros();
    const user = cadastros.find(c => c.email === email && c.password === senha);

    if (!user) { setErro('E-mail ou senha incorretos.'); return; }
    if (user.status === 'pendente') { setErro('Seu cadastro ainda está aguardando aprovação.'); return; }
    if (user.status === 'rejeitado') { setErro('Seu cadastro foi recusado. Fale com a secretaria.'); return; }

    const sessionData = {
      id: user.id, nome: user.nome, email: user.email,
      celular: user.celular, celula: user.celula, bairro: user.bairro,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setFotoAtual(user.foto || null);
    setSession(sessionData);
    setEmail(''); setSenha(''); setErro('');
    navigate('/');
  };

  /* Trocar foto de perfil */
  const handleTrocarFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const novaFoto = ev.target.result;
      setFotoAtual(novaFoto);
      // Salva no cadastro em localStorage
      const cadastros = loadCadastros();
      const atualizados = cadastros.map(c =>
        c.id === session.id ? { ...c, foto: novaFoto } : c
      );
      localStorage.setItem(CADASTROS_KEY, JSON.stringify(atualizados));
      setToast('Foto atualizada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  /* Logout */
  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY);
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
          </div>

          <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
            {[
              ['E-mail',  'ph-envelope',  session.email],
              ['Celular', 'ph-phone',     session.celular],
              ['Bairro',  'ph-map-pin',   session.bairro],
              ['Célula',  'ph-users',     session.celula],
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
    const cadastroAtualizado = cadastros.find(c => c.id === userCadastro.id);
    const foiAprovado = cadastroAtualizado?.status === 'aprovado';
    const foiRejeitado = cadastroAtualizado?.status === 'rejeitado';

    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Minha Conta" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-md)' }}>

          {foiAprovado && (
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)', textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '2.5rem', color: '#22c55e', display: 'block', marginBottom: '10px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '6px', color: '#22c55e' }}>Cadastro Aprovado! 🎉</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Bem-vindo(a) à família IFPA! Agora você pode entrar com seu e-mail e senha.
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
              <i className="ph ph-clock-countdown" style={{ fontSize: '2.5rem', color: 'var(--accent-color)', display: 'block', marginBottom: '12px' }}></i>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', marginBottom: '8px' }}>Cadastro Pendente</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                Aguarde a aprovação do administrador. Quando aprovado, você poderá entrar com seu e-mail e senha.
              </p>
              <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', textAlign: 'left', marginBottom: 'var(--spacing-lg)' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}><strong>Nome:</strong> {userCadastro.nome}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: '8px 0 0 0' }}><strong>E-mail:</strong> {userCadastro.email}</p>
                <p style={{ fontSize: '0.9rem', margin: '8px 0 0 0' }}>
                  <strong>Status: </strong>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>Aguardando aprovação</span>
                </p>
              </div>
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

        {/* Tela inicial */}
        {tela === 'inicio' && (
          <>
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '48px 20px', textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <i className="ph ph-user-circle" style={{ fontSize: '4rem', color: 'var(--accent-color)', display: 'block', marginBottom: '16px' }}></i>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', margin: 0, marginBottom: '8px' }}>Bem-vindo(a)!</h1>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0 }}>Faça parte da comunidade IFPA</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setTela('login')}
                className="primary-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
              >
                <i className="ph ph-sign-in"></i>
                <span>Entrar na minha conta</span>
              </button>

              <button
                onClick={() => setModalCadastro(true)}
                style={{ width: '100%', padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.95rem' }}
              >
                <i className="ph ph-user-plus"></i>
                <span>Cadastrar como Membro</span>
              </button>
            </div>
          </>
        )}

        {/* Tela de login */}
        {tela === 'login' && (
          <>
            <button
              onClick={() => { setTela('inicio'); setErro(''); setEmail(''); setSenha(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: 'var(--spacing-lg)', padding: 0, fontSize: '0.9rem' }}
            >
              <i className="ph ph-arrow-left"></i> Voltar
            </button>

            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', marginBottom: '4px' }}>Entrar</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              Use o e-mail e senha do seu cadastro aprovado.
            </p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>E-mail</label>
                <input
                  type="email" value={email}
                  onChange={e => { setEmail(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="seu@email.com"
                  autoFocus required
                  onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Senha</label>
                <input
                  type="password" value={senha}
                  onChange={e => { setSenha(e.target.value); setErro(''); }}
                  style={inputStyle} placeholder="••••••"
                  required
                  onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>

              {erro && (
                <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <i className="ph ph-warning-circle"></i> {erro}
                </div>
              )}

              <button type="submit" className="primary-btn" style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: 'var(--spacing-sm)' }}>
                <i className="ph ph-sign-in"></i>
                <span>Entrar</span>
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Ainda não tem conta?{' '}
              <button
                onClick={() => setModalCadastro(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', padding: 0 }}
              >
                Cadastrar
              </button>
            </p>
          </>
        )}

      </main>

      <ModalCadastroMembro
        isOpen={modalCadastro}
        onClose={() => setModalCadastro(false)}
        onSuccess={() => {
          setModalCadastro(false);
          try { setUserCadastro(JSON.parse(localStorage.getItem(USER_KEY))); } catch {}
          setToast('Cadastro enviado! Aguarde a aprovação do administrador.');
        }}
      />

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} duration={5000} />}
    </div>
  );
}
