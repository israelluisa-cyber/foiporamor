import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadConfig } from '../data/config';
import { supabase } from '../data/supabase';

const KEY = 'pedidos_aconselhamento';
const TIPOS = ['Casamento / Família', 'Saúde / Luto', 'Ansiedade / Depressão', 'Finanças', 'Vocação / Propósito', 'Outro'];
const CONTATOS = ['WhatsApp', 'Ligação telefônica', 'Presencial na Igreja'];

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); } catch { return null; }
}

function getNome() {
  try { return JSON.parse(sessionStorage.getItem('user_session'))?.nome || ''; }
  catch { return ''; }
}

function loadPedidos() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Aconselhamento() {
  const logado = !!getSession();
  const cfg = loadConfig();
  const whatsappPastor = cfg.whatsappPastor?.replace(/\D/g, '') || '';

  const [pedidos] = useState(loadPedidos);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    nome: getNome(),
    tipo: TIPOS[0],
    contato: CONTATOS[0],
    telefone: '',
    mensagem: '',
  });

  const podeSalvar = !!form.mensagem.trim() && (form.contato === 'Presencial na Igreja' || !!form.telefone.trim());

  const buildMsgPastor = (f) => [
    '📋 *Pedido de Aconselhamento*',
    '',
    `👤 *Nome:* ${f.nome || 'Não informado'}`,
    `📌 *Área:* ${f.tipo}`,
    `📞 *Contato preferido:* ${f.contato}${f.telefone ? ` — ${f.telefone}` : ''}`,
    '',
    '💬 *Mensagem:*',
    f.mensagem,
  ].filter(l => l !== undefined).join('\n');

  const handleEnviar = async () => {
    if (!podeSalvar || enviando) return;
    setEnviando(true);
    const novo = {
      ...form,
      membro: logado,
      data: new Date().toLocaleDateString('pt-BR'),
      id: Date.now(),
    };
    localStorage.setItem(KEY, JSON.stringify([novo, ...pedidos]));
    if (supabase) {
      try {
        await supabase.from('pedidos_aconselhamento').insert({
          id: String(novo.id),
          nome: novo.nome,
          tipo: novo.tipo,
          contato: novo.contato,
          telefone: novo.telefone || null,
          mensagem: novo.mensagem,
          membro: novo.membro,
          data: novo.data,
          atendido: false,
        });
      } catch (e) {
        console.warn('[Supabase] Erro ao salvar aconselhamento:', e.message);
      }
    }
    if (whatsappPastor) {
      const url = `https://wa.me/${whatsappPastor}?text=${encodeURIComponent(buildMsgPastor(novo))}`;
      window.open(url, '_blank');
    }
    setEnviando(false);
    setEnviado(true);
    setToast(whatsappPastor ? 'WhatsApp do pastor aberto!' : 'Pedido enviado com sucesso!');
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
    const msgWa = encodeURIComponent(
      `Olá! Acabei de enviar um pedido de aconselhamento sobre "${form.tipo}" pelo app da ${cfg.nomeIgreja}. Podemos conversar?`
    );
    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Aconselhamento" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-md)' }}>
          <section className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '2rem', color: '#22c55e' }}></i>
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', marginBottom: '8px' }}>Pedido Enviado</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)' }}>
              {form.contato === 'Presencial na Igreja'
                ? 'Passe na secretaria da igreja para agendar seu atendimento com um dos pastores. Você não está sozinho(a).'
                : `Um pastor da ${cfg.nomeIgreja} entrará em contato pelo meio escolhido em breve. Você não está sozinho(a).`}
            </p>

            {/* Botão WhatsApp do pastor (se configurado) */}
            {whatsappPastor && (
              <div style={{ marginBottom: 'var(--spacing-md)', padding: '16px', background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.2)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Prefere falar agora? Abra uma conversa diretamente com o pastor:
                </p>
                <a
                  href={`https://wa.me/${whatsappPastor}?text=${msgWa}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: '#25D366', color: '#fff', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}
                >
                  <i className="ph ph-whatsapp-logo" style={{ fontSize: '1.2rem' }}></i>
                  Falar com o Pastor pelo WhatsApp
                </a>
              </div>
            )}

            <button onClick={() => setEnviado(false)} className="primary-btn" style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-surface-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
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

          {/* Forma de contato preferida */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <Label txt="Como prefere ser contatado?" />
            <select
              value={form.contato}
              onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
              style={{ ...inputStyle, appearance: 'none' }}
            >
              {CONTATOS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {form.contato !== 'Presencial na Igreja' && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <Label txt="Seu telefone" />
              <input
                type="tel"
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
                placeholder="(11) 99999-9999"
              />
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

          {whatsappPastor ? (
            <button
              onClick={handleEnviar}
              disabled={!podeSalvar || enviando}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '14px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                background: podeSalvar && !enviando ? '#25D366' : 'rgba(37,211,102,0.3)',
                color: '#fff', fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-body)',
                transition: 'opacity 0.2s',
              }}
            >
              <i className={`ph ${enviando ? 'ph-circle-notch' : 'ph-whatsapp-logo'}`} style={{ fontSize: '1.2rem', ...(enviando ? { animation: 'spin 1s linear infinite' } : {}) }}></i>
              {enviando ? 'Abrindo WhatsApp...' : 'Enviar mensagem ao Pastor'}
            </button>
          ) : (
            <button
              className="primary-btn"
              onClick={handleEnviar}
              disabled={!podeSalvar || enviando}
              style={{ width: '100%', justifyContent: 'center', opacity: podeSalvar && !enviando ? 1 : 0.5 }}
            >
              <i className={`ph ${enviando ? 'ph-circle-notch' : 'ph-paper-plane-tilt'}`} style={enviando ? { animation: 'spin 1s linear infinite' } : {}}></i>
              {enviando ? 'Enviando...' : 'Enviar Pedido'}
            </button>
          )}

        </section>
      </main>
    </div>
  );
}
