import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'pedidos_aconselhamento';
const TIPOS = ['Casamento / Família', 'Saúde / Luto', 'Ansiedade / Depressão', 'Finanças', 'Vocação / Propósito', 'Outro'];

const CONTATOS_MEMBRO   = ['WhatsApp', 'Ligação telefônica', 'Presencial na Igreja', 'E-mail'];
const CONTATOS_VISITANTE = ['Presencial na Igreja'];

const EXIGE_TELEFONE = ['WhatsApp', 'Ligação telefônica'];

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); } catch { return null; }
}

function getNome() {
  try { return JSON.parse(localStorage.getItem('membro_perfil'))?.nome || ''; }
  catch { return ''; }
}

function loadPedidos() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Aconselhamento() {
  const logado = !!getSession();
  const contatos = logado ? CONTATOS_MEMBRO : CONTATOS_VISITANTE;

  const [pedidos] = useState(loadPedidos);
  const [enviado, setEnviado] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    nome: getNome(),
    tipo: TIPOS[0],
    contato: contatos[0],
    telefone: '',
    mensagem: '',
  });

  const precisaTelefone = EXIGE_TELEFONE.includes(form.contato);

  const podeSalvar = form.mensagem.trim() &&
    (!precisaTelefone || form.telefone.trim().length >= 8);

  const handleEnviar = () => {
    if (!podeSalvar) return;
    const novo = {
      ...form,
      telefone: precisaTelefone ? form.telefone.trim() : '',
      membro: logado,
      data: new Date().toLocaleDateString('pt-BR'),
      id: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify([novo, ...pedidos]));
    setEnviado(true);
    setToast('Pedido enviado. Um pastor entrará em contato em breve.');
  };

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
    color: 'var(--text-primary)', padding: '12px 14px', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const focusStyle = e => e.target.style.borderColor = 'rgba(255,255,255,0.3)';
  const blurStyle  = e => e.target.style.borderColor = 'var(--border-color)';

  const Label = ({ txt }) => (
    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
      {txt}
    </label>
  );

  if (enviado) {
    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Aconselhamento" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-md)' }}>
          <section className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}></i>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>Pedido Enviado</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
              {form.contato === 'Presencial na Igreja'
                ? 'Passe na secretaria da igreja para agendar seu atendimento com um dos pastores. Você não está sozinho(a).'
                : 'Um pastor da Igreja Foi Por Amor entrará em contato pelo meio escolhido em até 48 horas. Você não está sozinho(a).'}
            </p>
            <button onClick={() => setEnviado(false)} className="primary-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Fazer Novo Pedido
            </button>
          </section>
        </main>
        {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} />}
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Aconselhamento" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <section className="glass-card word-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            "Carregai as cargas uns dos outros e assim cumprireis a lei de Cristo."
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 600 }}>Gálatas 6:2</p>
        </section>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
          Nossa equipe pastoral está disponível para te ouvir e caminhar com você. Todas as conversas são sigilosas.
        </p>

        {/* Aviso para visitantes */}
        {!logado && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '12px 14px', background: 'rgba(109,40,217,0.08)', border: '1px solid rgba(109,40,217,0.25)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-md)' }}>
            <i className="ph ph-info" style={{ color: '#6d28d9', fontSize: '1.1rem', flexShrink: 0, marginTop: '1px' }}></i>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              O atendimento presencial é feito na sede da Igreja Foi Por Amor. Membros cadastrados têm acesso a mais formas de contato.
            </p>
          </div>
        )}

        <section className="glass-card">

          {/* Nome */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Label txt="Seu Nome" />
            <input
              type="text"
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              style={inputStyle}
              onFocus={focusStyle}
              onBlur={blurStyle}
              placeholder="Como podemos te chamar?"
            />
          </div>

          {/* Área */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Label txt="Área de Necessidade" />
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Forma de contato */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Label txt="Como Prefere ser Contactado" />
            <div style={{ display: 'grid', gridTemplateColumns: contatos.length > 1 ? '1fr 1fr' : '1fr', gap: '8px' }}>
              {contatos.map(c => (
                <button
                  key={c}
                  onClick={() => setForm(f => ({ ...f, contato: c, telefone: '' }))}
                  style={{
                    padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                    background: form.contato === c ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                    color: form.contato === c ? 'var(--bg-color)' : 'var(--text-secondary)',
                    border: `1px solid ${form.contato === c ? 'var(--accent-color)' : 'var(--border-color)'}`,
                    fontWeight: form.contato === c ? 700 : 400, transition: 'all 0.2s', cursor: 'pointer',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Telefone — aparece apenas quando necessário */}
          {precisaTelefone && (
            <div style={{ marginBottom: 'var(--spacing-md)', animation: 'fadeIn 0.2s ease' }}>
              <Label txt={`Seu ${form.contato === 'WhatsApp' ? 'WhatsApp' : 'Telefone'} para contato`} />
              <input
                type="tel"
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="(11) 99999-9999"
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Usado apenas pelo pastor para retornar seu contato.
              </p>
            </div>
          )}

          {/* Mensagem */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <Label txt="Conte um pouco mais" />
            <textarea
              className="notes-area"
              placeholder="Descreva brevemente o que está sentindo ou passando. Não há julgamentos aqui..."
              value={form.mensagem}
              onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))}
              style={{ marginTop: 0 }}
            />
          </div>

          <button
            className="primary-btn"
            onClick={handleEnviar}
            disabled={!podeSalvar}
            style={{ width: '100%', justifyContent: 'center', opacity: podeSalvar ? 1 : 0.5 }}
          >
            <i className="ph ph-paper-plane-tilt"></i> Enviar Pedido
          </button>

        </section>
      </main>
    </div>
  );
}
