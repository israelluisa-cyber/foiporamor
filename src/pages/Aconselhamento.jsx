import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'pedidos_aconselhamento';
const TIPOS = ['Casamento / Família', 'Saúde / Luto', 'Ansiedade / Depressão', 'Finanças', 'Vocação / Propósito', 'Outro'];
const CONTATOS = ['WhatsApp', 'Ligação telefônica', 'Presencial na Igreja', 'E-mail'];

function loadPedidos() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

function getNome() {
  try {
    const p = JSON.parse(localStorage.getItem('membro_perfil'));
    return p?.nome || '';
  } catch { return ''; }
}

export default function Aconselhamento() {
  const [pedidos] = useState(loadPedidos);
  const [enviado, setEnviado] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ nome: getNome(), tipo: TIPOS[0], contato: CONTATOS[0], mensagem: '' });

  const handleEnviar = () => {
    if (!form.mensagem.trim()) return;
    const novo = { ...form, data: new Date().toLocaleDateString('pt-BR'), id: Date.now() };
    const todos = [novo, ...pedidos];
    localStorage.setItem(KEY, JSON.stringify(todos));
    setEnviado(true);
    setToast('Pedido enviado. Um pastor entrará em contato em breve.');
  };

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
              Um pastor da Igreja Foi Por Amor entrará em contato pelo meio escolhido em até 48 horas. Você não está sozinho(a).
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

  const inputStyle = {
    width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
    color: 'var(--text-primary)', padding: '12px 14px', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none', transition: 'border-color 0.2s',
  };

  const label = (txt) => (
    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{txt}</label>
  );

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

        <section className="glass-card">
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Seu Nome')}
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Área de Necessidade')}
            <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Como Prefere ser Contactado')}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {CONTATOS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, contato: c }))} style={{
                  padding: '10px', borderRadius: 'var(--radius-md)', fontSize: '0.82rem',
                  background: form.contato === c ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                  color: form.contato === c ? 'var(--bg-color)' : 'var(--text-secondary)',
                  border: `1px solid ${form.contato === c ? 'var(--accent-color)' : 'var(--border-color)'}`,
                  fontWeight: form.contato === c ? 700 : 400, transition: 'all 0.2s',
                }}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            {label('Conte um pouco mais')}
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
            disabled={!form.mensagem.trim()}
            style={{ width: '100%', justifyContent: 'center', opacity: form.mensagem.trim() ? 1 : 0.5 }}
          >
            <i className="ph ph-paper-plane-tilt"></i> Enviar Pedido
          </button>
        </section>

      </main>
    </div>
  );
}
