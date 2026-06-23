import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'checkin_infantil';
const TURMAS = ['Maternal (0-3 anos)', 'Jardim (4-5 anos)', 'Primários (6-8 anos)', 'Juniores (9-11 anos)'];

function loadCheckins() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Checkin() {
  const [checkins, setCheckins] = useState(loadCheckins);
  const [form, setForm] = useState({ crianca: '', turma: TURMAS[0], responsavel: '', telefone: '' });
  const [toast, setToast] = useState('');
  const [ticket, setTicket] = useState(null);

  const handleCheckin = () => {
    if (!form.crianca.trim() || !form.responsavel.trim()) return;
    const codigo = `IFPA-${Date.now().toString().slice(-5)}`;
    const novo = { ...form, codigo, hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), data: new Date().toLocaleDateString('pt-BR'), id: Date.now() };
    const atualizados = [novo, ...checkins];
    setCheckins(atualizados);
    localStorage.setItem(KEY, JSON.stringify(atualizados));
    setTicket(novo);
    setForm({ crianca: '', turma: TURMAS[0], responsavel: '', telefone: '' });
    setToast('Check-in realizado com sucesso!');
  };

  const handleCheckout = (id) => {
    const atualizados = checkins.filter(c => c.id !== id);
    setCheckins(atualizados);
    localStorage.setItem(KEY, JSON.stringify(atualizados));
    if (ticket?.id === id) setTicket(null);
  };

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
      <Header title="Check-in Infantil" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Ticket gerado */}
        {ticket && (
          <section style={{
            background: 'linear-gradient(135deg, #1c1c1c 0%, #0d0d0d 100%)',
            border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)', textAlign: 'center',
            animation: 'fadeIn 0.3s ease',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Ticket de Retirada</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', color: 'var(--text-primary)', letterSpacing: '4px', margin: '12px 0' }}>{ticket.codigo}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>{ticket.crianca}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>{ticket.turma}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '8px' }}>Check-in às {ticket.hora} · Responsável: {ticket.responsavel}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px', fontStyle: 'italic' }}>Guarde este código para retirar a criança após o culto.</p>
          </section>
        )}

        {/* Formulário */}
        <section className="glass-card">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', marginBottom: 'var(--spacing-md)' }}>
            <i className="ph ph-baby"></i> Novo Check-in
          </h3>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Nome da Criança')}
            <input type="text" value={form.crianca} onChange={e => setForm(f => ({ ...f, crianca: e.target.value }))} style={inputStyle} placeholder="Nome completo"
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Turma')}
            <select value={form.turma} onChange={e => setForm(f => ({ ...f, turma: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
              {TURMAS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            {label('Nome do Responsável')}
            <input type="text" value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} style={inputStyle} placeholder="Nome completo"
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
          </div>

          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            {label('Telefone do Responsável')}
            <input type="tel" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} style={inputStyle} placeholder="(00) 00000-0000"
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
          </div>

          <button
            className="primary-btn"
            onClick={handleCheckin}
            disabled={!form.crianca.trim() || !form.responsavel.trim()}
            style={{ width: '100%', justifyContent: 'center', opacity: (form.crianca.trim() && form.responsavel.trim()) ? 1 : 0.5 }}
          >
            <i className="ph ph-check-circle"></i> Fazer Check-in
          </button>
        </section>

        {/* Crianças no momento */}
        {checkins.length > 0 && (
          <>
            <h3 className="section-title">Crianças Presentes ({checkins.length})</h3>
            {checkins.map(c => (
              <div key={c.id} className="glass-card" style={{ padding: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: '8px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ph ph-star" style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.crianca}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {c.turma} · {c.codigo} · {c.hora}
                  </p>
                </div>
                <button
                  onClick={() => handleCheckout(c.id)}
                  style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  Check-out
                </button>
              </div>
            ))}
          </>
        )}

      </main>

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
