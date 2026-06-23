import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'membro_perfil';

const defaultPerfil = {
  nome: 'Membro IFPA',
  dataNascimento: '',
  telefone: '',
  email: '',
  bairro: '',
  celula: '',
  dataBatismo: '',
  cargo: 'Membro',
  membroDesde: '2024',
};

function loadPerfil() {
  try { return { ...defaultPerfil, ...JSON.parse(localStorage.getItem(KEY)) }; }
  catch { return defaultPerfil; }
}

function getInitials(nome) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || 'M';
}

const CARGOS = ['Membro', 'Diácono/Diaconisa', 'Presbítero', 'Pastor', 'Missionário', 'Líder de Célula', 'Músico', 'Voluntário'];
const CELULAS = ['Geração de Fogo (Jovens)', 'Lar de Paz (Famílias)', 'Sem grupo definido'];

export default function Perfil() {
  const [perfil, setPerfil] = useState(loadPerfil);
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState(perfil);
  const [toast, setToast] = useState('');

  const handleSave = () => {
    localStorage.setItem(KEY, JSON.stringify(draft));
    setPerfil(draft);
    setEditando(false);
    setToast('Perfil atualizado com sucesso!');
  };

  const handleCancel = () => {
    setDraft(perfil);
    setEditando(false);
  };

  const field = (label, key, type = 'text', options = null) => (
    <div style={{ marginBottom: 'var(--spacing-md)' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>{label}</label>
      {editando ? (
        options ? (
          <select
            value={draft[key]}
            onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
            style={{ width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '11px 14px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}
          >
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type}
            value={draft[key]}
            onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
            style={{ width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '11px 14px', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
        )
      ) : (
        <p style={{ fontSize: '0.95rem', color: draft[key] ? 'var(--text-primary)' : 'var(--text-muted)', padding: '11px 0', borderBottom: '1px solid var(--border-color)' }}>
          {draft[key] || '—'}
        </p>
      )}
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Meu Perfil" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Cartão de membro */}
        <div style={{
          background: 'linear-gradient(135deg, #1c1c1c 0%, #0d0d0d 100%)',
          border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)',
          padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)',
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-40%', right: '-10%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>{getInitials(perfil.nome)}</span>
          </div>
          <div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px' }}>Igreja Foi Por Amor</p>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: 'var(--text-primary)', margin: 0 }}>{perfil.nome}</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{perfil.cargo} • Desde {perfil.membroDesde}</p>
          </div>
        </div>

        {/* Formulário */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)' }}>Informações Pessoais</h3>
          {!editando ? (
            <button onClick={() => { setDraft(perfil); setEditando(true); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>
              <i className="ph ph-pencil-simple"></i> Editar
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCancel} style={{ fontSize: '0.85rem', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '6px 14px' }}>Cancelar</button>
              <button onClick={handleSave} style={{ fontSize: '0.85rem', color: 'var(--bg-color)', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-full)', padding: '6px 14px', fontWeight: 700 }}>Salvar</button>
            </div>
          )}
        </div>

        <section className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          {field('Nome Completo', 'nome')}
          {field('Data de Nascimento', 'dataNascimento', 'date')}
          {field('Telefone / WhatsApp', 'telefone', 'tel')}
          {field('E-mail', 'email', 'email')}
          {field('Bairro', 'bairro')}
        </section>

        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }}>Informações na Igreja</h3>
        <section className="glass-card" style={{ padding: 'var(--spacing-lg)' }}>
          {field('Grupo / Célula', 'celula', 'text', CELULAS)}
          {field('Cargo / Função', 'cargo', 'text', CARGOS)}
          {field('Data do Batismo', 'dataBatismo', 'date')}
          {field('Membro desde (ano)', 'membroDesde')}
        </section>

      </main>

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
