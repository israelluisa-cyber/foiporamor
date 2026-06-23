import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadMembros, saveMembros } from '../data/membros';
import { loadConfig, saveConfig, DIAS_SEMANA, formatHora } from '../data/config';
import { loadContribuicoes, clearContribuicoes, totalContribuicoes, totalPorObra } from '../data/contribuicoes';

const ADMIN_PIN = '1234';
const CADASTROS_KEY = 'cadastros_pendentes';
const ADMIN_AVISOS_KEY = 'admin_avisos';

function loadCadastros() {
  try { return JSON.parse(localStorage.getItem(CADASTROS_KEY)) || []; }
  catch { return []; }
}

function saveCadastros(cadastros) {
  localStorage.setItem(CADASTROS_KEY, JSON.stringify(cadastros));
}

function ModalGerenciarCadastros({ isOpen, onClose, cadastros, setCadastros, membros, setMembros }) {
  const pendentes = cadastros.filter(c => c.status === 'pendente');

  const handleAprovar = (id) => {
    const cadastro = cadastros.find(c => c.id === id);
    if (!cadastro) return;

    // Adicionar como membro
    const novoMembro = {
      id: Math.max(...membros.map(m => m.id), 0) + 1,
      nome: cadastro.nome,
      cargo: 'Membro',
      celula: cadastro.celula,
      bairro: cadastro.bairro,
      foto: null,
    };

    const novosMembros = [...membros, novoMembro];
    setMembros(novosMembros);
    saveMembros(novosMembros);

    // Atualizar status do cadastro
    const novosCadastros = cadastros.map(c =>
      c.id === id ? { ...c, status: 'aprovado' } : c
    );
    setCadastros(novosCadastros);
    saveCadastros(novosCadastros);

    alert(`${cadastro.nome} aprovado como membro!`);
  };

  const handleRejeitar = (id) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) return;

    const novosCadastros = cadastros.map(c =>
      c.id === id ? { ...c, status: 'rejeitado' } : c
    );
    setCadastros(novosCadastros);
    saveCadastros(novosCadastros);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Aprovar Cadastros ({pendentes.length})</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '1.2rem', padding: 0, width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ph ph-x"></i>
          </button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          {pendentes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <i className="ph ph-check-circle" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
              <p>Nenhum cadastro pendente</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendentes.map(cadastro => (
                <div key={cadastro.id} style={{
                  background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                }}>
                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                    <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
                      {cadastro.nome}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '8px' }}>
                      <i className="ph ph-envelope"></i> {cadastro.email}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, marginBottom: '8px' }}>
                      <i className="ph ph-phone"></i> {cadastro.celular}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0 }}>
                        <i className="ph ph-map-pin"></i> {cadastro.bairro || 'Não informado'}
                      </p>
                      <p style={{ margin: 0 }}>
                        <i className="ph ph-users-three"></i> {cadastro.celula}
                      </p>
                    </div>
                    {cadastro.experiencia && (
                      <div style={{ marginTop: '8px', padding: '8px', background: 'var(--bg-surface)', borderRadius: '4px', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '2px solid var(--accent-color)' }}>
                        "{cadastro.experiencia}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleAprovar(cadastro.id)}
                      style={{
                        flex: 1, padding: '8px', background: 'rgba(34,197,94,0.2)',
                        border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem',
                        fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      <i className="ph ph-check"></i> Aprovar
                    </button>
                    <button
                      onClick={() => handleRejeitar(cadastro.id)}
                      style={{
                        flex: 1, padding: '8px', background: 'rgba(239,68,68,0.2)',
                        border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem',
                        fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      }}
                    >
                      <i className="ph ph-x"></i> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalGerenciarMembros({ onClose, membros, setMembros }) {
  const [modo, setModo] = useState('lista'); // lista, editar, adicionar
  const [membroSelecionado, setMembroSelecionado] = useState(null);
  const [formData, setFormData] = useState({});
  const [previewFoto, setPreviewFoto] = useState(null);

  const handleAddMembro = () => {
    setFormData({ nome: '', cargo: 'Membro', celula: 'Lar de Paz', bairro: '', foto: null });
    setPreviewFoto(null);
    setMembroSelecionado(null);
    setModo('adicionar');
  };

  const handleEditMembro = (membro) => {
    setFormData({ ...membro });
    setPreviewFoto(membro.foto);
    setMembroSelecionado(membro.id);
    setModo('editar');
  };

  const handleDeleteMembro = (id) => {
    if (confirm('Tem certeza que deseja remover este membro?')) {
      setMembros(membros.filter(m => m.id !== id));
      saveMembros(membros.filter(m => m.id !== id));
    }
  };

  const handleSalvarMembro = () => {
    if (!formData.nome.trim() || !formData.bairro.trim()) {
      alert('Preencha nome e bairro');
      return;
    }

    if (modo === 'adicionar') {
      const novoMembro = { ...formData, id: Math.max(...membros.map(m => m.id), 0) + 1, foto: previewFoto };
      const novosMembros = [...membros, novoMembro];
      setMembros(novosMembros);
      saveMembros(novosMembros);
    } else {
      const novosMembros = membros.map(m => m.id === membroSelecionado ? { ...formData, foto: previewFoto } : m);
      setMembros(novosMembros);
      saveMembros(novosMembros);
    }
    setModo('lista');
  };

  const handleImagemChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 400;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setPreviewFoto(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)',
        width: '100%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>
            {modo === 'lista' ? 'Gerenciar Membros' : modo === 'adicionar' ? 'Adicionar Membro' : 'Editar Membro'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: 'pointer', fontSize: '1.2rem', padding: 0, width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ph ph-x"></i>
          </button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          {modo === 'lista' && (
            <>
              <button
                onClick={handleAddMembro}
                style={{
                  width: '100%', padding: 'var(--spacing-md)', background: 'var(--accent-color)',
                  color: 'var(--bg-color)', border: 'none', borderRadius: 'var(--radius-md)',
                  fontWeight: 600, cursor: 'pointer', marginBottom: 'var(--spacing-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}
              >
                <i className="ph ph-plus"></i> Adicionar Novo Membro
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                {membros.map(membro => (
                  <div key={membro.id} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-sm)', background: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  }}>
                    {membro.foto ? (
                      <img src={membro.foto} alt={membro.nome} style={{
                        width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover',
                      }} />
                    ) : (
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: 'var(--bg-surface)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
                      }}>
                        {membro.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{membro.nome}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{membro.cargo}</p>
                    </div>
                    <button
                      onClick={() => handleEditMembro(membro)}
                      style={{
                        background: 'var(--accent-color)', border: 'none',
                        color: 'var(--bg-color)', borderRadius: '4px', padding: '6px 12px',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMembro(membro.id)}
                      style={{
                        background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                        color: '#ef4444', borderRadius: '4px', padding: '6px 12px',
                        cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {(modo === 'editar' || modo === 'adicionar') && (
            <>
              <div style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
                <div style={{
                  width: '100px', height: '100px', borderRadius: '50%',
                  background: previewFoto ? 'transparent' : 'var(--bg-surface-elevated)',
                  border: '2px dashed var(--border-color)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                }}>
                  {previewFoto ? (
                    <img src={previewFoto} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <i className="ph ph-camera" style={{ fontSize: '1.8rem', color: 'var(--text-secondary)' }}></i>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImagemChange}
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Clique para ajustar foto</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Nome</label>
                  <input
                    type="text"
                    value={formData.nome || ''}
                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                    placeholder="Nome completo"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Cargo</label>
                  <select
                    value={formData.cargo || 'Membro'}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    <option>Membro</option>
                    <option>Diácono</option>
                    <option>Diaconisa</option>
                    <option>Presbítero</option>
                    <option>Líder de Célula</option>
                    <option>Músico</option>
                    <option>Voluntária</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Célula</label>
                  <select
                    value={formData.celula || 'Lar de Paz'}
                    onChange={e => setFormData({ ...formData, celula: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    <option>Lar de Paz</option>
                    <option>Geração de Fogo</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Bairro</label>
                  <input
                    type="text"
                    value={formData.bairro || ''}
                    onChange={e => setFormData({ ...formData, bairro: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                    placeholder="Bairro"
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--spacing-lg)' }}>
                  <button
                    onClick={() => setModo('lista')}
                    style={{
                      flex: 1, padding: '10px', background: 'transparent',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSalvarMembro}
                    style={{
                      flex: 1, padding: '10px', background: 'var(--accent-color)',
                      border: 'none', borderRadius: 'var(--radius-md)',
                      color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ModalContribuicoes({ onClose, contribs, onLimpar }) {
  const total = totalContribuicoes(contribs);
  const porObra = totalPorObra(contribs);
  const totalFmt = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleLimpar = () => {
    if (!confirm('Limpar todos os registros? Faça isso após conferir os dados.')) return;
    clearContribuicoes();
    onLimpar();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>

        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Intenções de Contribuição</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Registros do app — intenção de pagamento via PIX</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-lg)' }}>

          {/* Total geral */}
          <div style={{ background: 'linear-gradient(135deg, #1a0533, #3b0764)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: '0 0 4px' }}>Total Estimado</p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700, color: '#fff', margin: 0 }}>{totalFmt}</p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', margin: '4px 0 0' }}>{contribs.length} intenção{contribs.length !== 1 ? 'ões' : ''} registrada{contribs.length !== 1 ? 's' : ''}</p>
          </div>

          {/* Por obra */}
          {Object.keys(porObra).length > 0 && (
            <>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-sm)' }}>Por Destinação</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
                {Object.entries(porObra).sort((a, b) => b[1] - a[1]).map(([nome, val]) => (
                  <div key={nome} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>{nome}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-color)' }}>{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Lista de registros */}
          {contribs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="ph ph-hands-coins" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}></i>
              <p>Nenhuma intenção registrada ainda.</p>
            </div>
          ) : (
            <>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 'var(--spacing-sm)' }}>Histórico</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {contribs.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0, fontWeight: 500 }}>{c.tipo}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{c.data}</p>
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{c.valorFormatado}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Fechar</button>
          {contribs.length > 0 && (
            <button onClick={handleLimpar} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
              <i className="ph ph-trash"></i> Limpar Registros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PinGate({ onAuthenticated }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('adminAuth', 'true');
      onAuthenticated();
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '80px' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '360px', textAlign: 'center' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--spacing-md)' }}>
          <i className="ph ph-lock" style={{ fontSize: '1.8rem', color: 'var(--accent-color)' }}></i>
        </div>
        <h2 className="font-heading" style={{ marginBottom: '4px' }}>Área Restrita</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
          Insira o PIN de acesso da liderança.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••"
            value={pin}
            onChange={e => { setPin(e.target.value); setError(false); }}
            autoFocus
            style={{
              width: '100%', background: 'var(--bg-surface-elevated)',
              border: `1px solid ${error ? '#ef4444' : 'var(--border-color)'}`,
              color: 'var(--text-primary)', padding: '14px', borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)', fontSize: '1.5rem', fontWeight: '600',
              letterSpacing: '8px', textAlign: 'center', outline: 'none',
              marginBottom: 'var(--spacing-sm)',
            }}
          />
          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 'var(--spacing-sm)' }}>
              PIN incorreto. Tente novamente.
            </p>
          )}
          <button type="submit" className="primary-btn" style={{ width: '100%', marginTop: 'var(--spacing-sm)', justifyContent: 'center' }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Modal Configurações da Igreja ─────────────────────────────── */
function ModalConfiguracoes({ onClose, onSaved }) {
  const [cfg, setCfg] = useState(loadConfig);
  const [heroBgPreview, setHeroBgPreview] = useState(loadConfig().heroBg);
  const [secao, setSecao] = useState('identidade'); // identidade | hero | aviso | whatsapp | cultos

  const set = (campo, valor) => setCfg(c => ({ ...c, [campo]: valor }));
  const setWa = (campo, valor) => setCfg(c => ({ ...c, whatsapp: { ...c.whatsapp, [campo]: valor } }));

  const setCulto = (id, campo, valor) =>
    setCfg(c => ({ ...c, cultos: c.cultos.map(cu => cu.id === id ? { ...cu, [campo]: valor } : cu) }));

  const handleObraUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        setCfg(c => ({ ...c, obras: c.obras.map(o => o.id === id ? { ...o, foto: compressed } : o) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeObraFoto = (id) => {
    setCfg(c => ({ ...c, obras: c.obras.map(o => o.id === id ? { ...o, foto: null } : o) }));
  };

  const handleHeroUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setHeroBgPreview(compressed);
        setCfg(c => ({ ...c, heroBg: compressed }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSalvar = () => {
    saveConfig(cfg);
    onSaved();
    onClose();
  };

  const inputSt = {
    width: '100%', padding: '10px', background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
    fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
  };

  const secoes = [
    { key: 'identidade', label: 'Identidade', icon: 'ph-church' },
    { key: 'hero',       label: 'Imagem',     icon: 'ph-image' },
    { key: 'aviso',      label: 'Aviso',      icon: 'ph-megaphone' },
    { key: 'whatsapp',   label: 'WhatsApp',   icon: 'ph-whatsapp-logo' },
    { key: 'cultos',     label: 'Cultos',     icon: 'ph-calendar' },
    { key: 'obras',      label: 'Obras',      icon: 'ph-hands-heart' },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>

        {/* Header */}
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Configurações da Igreja</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>Personalize o conteúdo do app</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
          {secoes.map(s => (
            <button key={s.key} onClick={() => setSecao(s.key)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: secao === s.key ? 'var(--accent-color)' : 'var(--bg-surface)', color: secao === s.key ? 'var(--bg-color)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.72rem', fontWeight: 600, minWidth: '60px' }}>
              <i className={`ph ${s.icon}`} style={{ fontSize: '1rem' }}></i>
              {s.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-lg)' }}>

          {/* IDENTIDADE */}
          {secao === 'identidade' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Informações básicas da Igreja visíveis no app.</p>
              {[
                ['Nome da Igreja',   'nomeIgreja',   'text', 'Igreja Foi Por Amor'],
                ['Endereço',         'endereco',     'text', 'Rua, número — Bairro'],
                ['Cidade — UF',      'cidade',       'text', 'Cidade — SP'],
                ['Link do Maps',     'mapsLink',     'url',  'https://maps.google.com/...'],
                ['Link YouTube (Ao Vivo)', 'youtubeLink', 'url', 'https://youtube.com/@SuaIgreja/live'],
              ].map(([label, campo, type, placeholder]) => (
                <div key={campo}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input type={type} value={cfg[campo] || ''} onChange={e => set(campo, e.target.value)} style={inputSt} placeholder={placeholder} />
                </div>
              ))}
            </div>
          )}

          {/* HERO */}
          {secao === 'hero' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Imagem de fundo do card principal da Home.</p>

              {/* Preview */}
              <div style={{ width: '100%', height: '160px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative', background: '#111' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroBgPreview || '/hero_bg.png'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Preview do Hero</span>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <i className="ph ph-upload-simple" style={{ fontSize: '1.2rem' }}></i>
                Escolher imagem da galeria
                <input type="file" accept="image/*" onChange={handleHeroUpload} style={{ display: 'none' }} />
              </label>

              {heroBgPreview && heroBgPreview !== '/hero_bg.png' && (
                <button onClick={() => { setHeroBgPreview(null); setCfg(c => ({ ...c, heroBg: null })); }} style={{ padding: '9px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                  Remover imagem personalizada
                </button>
              )}
            </div>
          )}

          {/* AVISO */}
          {secao === 'aviso' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Texto exibido no banner de aviso na parte inferior da Home.</p>
              <textarea
                value={cfg.avisoHome || ''}
                onChange={e => set('avisoHome', e.target.value)}
                style={{ ...inputSt, resize: 'none', minHeight: '120px', lineHeight: 1.6 }}
                placeholder="Reunião de líderes na próxima segunda-feira às 19h30."
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deixe vazio para ocultar o aviso na Home.</p>
            </div>
          )}

          {/* WHATSAPP */}
          {secao === 'whatsapp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Números de WhatsApp dos grupos de célula. Use o formato: 5511999999999 (com DDI e DDD, sem espaços).</p>
              {[
                ['Geração de Fogo (Jovens)', 'geracaoFogo'],
                ['Lar de Paz (Famílias)',    'larDePaz'],
              ].map(([label, campo]) => (
                <div key={campo}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input type="tel" value={cfg.whatsapp?.[campo] || ''} onChange={e => setWa(campo, e.target.value)} style={inputSt} placeholder="5511999999999" />
                </div>
              ))}
            </div>
          )}

          {/* OBRAS SOCIAIS */}
          {secao === 'obras' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Atualize as fotos de cada obra social exibida na página de Contribuições.</p>

              {(cfg.obras || []).map(obra => (
                <div key={obra.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  {/* Banner preview */}
                  <div style={{ position: 'relative', width: '100%', height: '130px' }}>
                    {obra.foto ? (
                      <img src={obra.foto} alt={obra.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: obra.gradiente, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <i className={`ph ${obra.icone}`} style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.8)' }}></i>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, textTransform: 'uppercase' }}>sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Info + botões */}
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>{obra.nome}</p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'var(--accent-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--bg-color)' }}>
                        <i className="ph ph-upload-simple"></i>
                        {obra.foto ? 'Trocar Foto' : 'Adicionar Foto'}
                        <input type="file" accept="image/*" onChange={e => handleObraUpload(obra.id, e)} style={{ display: 'none' }} />
                      </label>
                      {obra.foto && (
                        <button onClick={() => removeObraFoto(obra.id)} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CULTOS */}
          {secao === 'cultos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Configure os dias e horários de cada culto. Desative para ocultar do app.</p>

              {cfg.cultos.map(cu => (
                <div key={cu.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${cu.ativo ? 'var(--border-color)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', opacity: cu.ativo ? 1 : 0.5, transition: 'opacity 0.2s' }}>

                  {/* Header do culto */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cu.ativo ? 'var(--spacing-md)' : 0 }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{cu.nome}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {DIAS_SEMANA[cu.diaSemana]} · {formatHora(cu.hora, cu.min)} às {formatHora(cu.horaFim, cu.minFim)}
                      </p>
                    </div>
                    {/* Toggle ativo */}
                    <button onClick={() => setCulto(cu.id, 'ativo', !cu.ativo)} style={{ width: '44px', height: '24px', borderRadius: 'var(--radius-full)', background: cu.ativo ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: `1px solid ${cu.ativo ? 'var(--accent-color)' : 'var(--border-color)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s', padding: 0, flexShrink: 0 }}>
                      <span style={{ position: 'absolute', top: '2px', width: '18px', height: '18px', borderRadius: '50%', background: cu.ativo ? 'var(--bg-color)' : 'var(--text-muted)', transition: 'left 0.2s', left: cu.ativo ? '22px' : '2px' }} />
                    </button>
                  </div>

                  {cu.ativo && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Nome */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome do culto</label>
                        <input type="text" value={cu.nome} onChange={e => setCulto(cu.id, 'nome', e.target.value)} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                      </div>

                      {/* Dia */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Dia da semana</label>
                        <select value={cu.diaSemana} onChange={e => setCulto(cu.id, 'diaSemana', Number(e.target.value))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }}>
                          {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </div>

                      {/* Horários */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Início</label>
                          <input type="time" value={`${String(cu.hora).padStart(2,'0')}:${String(cu.min).padStart(2,'0')}`} onChange={e => { const [h, m] = e.target.value.split(':').map(Number); setCulto(cu.id, 'hora', h); setCulto(cu.id, 'min', m); }} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fim</label>
                          <input type="time" value={`${String(cu.horaFim).padStart(2,'0')}:${String(cu.minFim).padStart(2,'0')}`} onChange={e => { const [h, m] = e.target.value.split(':').map(Number); setCulto(cu.id, 'horaFim', h); setCulto(cu.id, 'minFim', m); }} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                        </div>
                      </div>

                      {/* Restrito */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={cu.restrito || false} onChange={e => setCulto(cu.id, 'restrito', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)' }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Visível apenas para membros logados</span>
                      </label>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: 'var(--spacing-md) var(--spacing-lg)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
          <button onClick={handleSalvar} style={{ flex: 2, padding: '12px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <i className="ph ph-floppy-disk"></i> Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalComunicado({ onClose, onSent }) {
  const [form, setForm] = useState({ titulo: '', texto: '', tipo: 'Informativo' });
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inputSt = { width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' };

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) return;
    const avisos = JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]');
    const novoAviso = {
      id: Date.now(), tipo: form.tipo, titulo: form.titulo, texto: form.texto,
      data: new Date().toLocaleDateString('pt-BR'), icone: 'ph-megaphone', admin: true,
    };
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify([novoAviso, ...avisos]));
    onSent();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Enviar Comunicado</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="ph ph-x"></i></button>
        </div>
        <form onSubmit={handleEnviar} style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Tipo</label>
            <select value={form.tipo} onChange={set('tipo')} style={inputSt}>
              <option>Informativo</option>
              <option>Evento</option>
              <option>Urgente</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Título *</label>
            <input type="text" value={form.titulo} onChange={set('titulo')} style={inputSt} placeholder="Título do comunicado" required />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Mensagem *</label>
            <textarea value={form.texto} onChange={set('texto')} style={{ ...inputSt, resize: 'none', minHeight: '100px' }} placeholder="Escreva o comunicado aqui..." required />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
            <button type="submit" style={{ flex: 1, padding: '11px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700 }}>
              <i className="ph ph-megaphone"></i> Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('adminAuth') === 'true'
  );
  const [membros, setMembros] = useState(loadMembros);
  const [cadastros, setCadastros] = useState(loadCadastros);
  const [contribs, setContribs] = useState(loadContribuicoes);
  const [modalMembros, setModalMembros] = useState(false);
  const [modalCadastros, setModalCadastros] = useState(false);
  const [modalComunicado, setModalComunicado] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalContribs, setModalContribs] = useState(false);
  const [toast, setToast] = useState('');

  const totalNum = totalContribuicoes(contribs);
  const totalFmt = totalNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const pendentes = cadastros.filter(c => c.status === 'pendente').length;

  if (!isAuthenticated) {
    return <PinGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)', backgroundColor: '#050505', minHeight: '100vh' }}>
      <Header admin={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Visão Geral (Este Mês)</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <i className="ph ph-users" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}></i>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>{membros.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Membros</span>
          </div>
          <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <i className="ph ph-student" style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}></i>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>128</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Alunos (Teologia)</span>
          </div>
        </div>

        <h3 className="section-title">Intenções de Contribuição</h3>
        <section className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-md)' }}>
            <div>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.5rem' }}>{totalFmt}</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Valor estimado registrado no app</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: 'var(--accent-color)', fontWeight: 700, fontSize: '1.5rem' }}>{contribs.length}</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Intenção{contribs.length !== 1 ? 'ões' : ''}</p>
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--border-color)' }}>
            <i className="ph ph-info"></i> Estes dados refletem intenções de pagamento via PIX geradas no app — não confirmações bancárias.
          </p>
          <button
            onClick={() => setModalContribs(true)}
            className="primary-btn"
            style={{ padding: '10px', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            <i className="ph ph-list-magnifying-glass"></i> Ver Detalhes e Histórico
          </button>
        </section>

        <h3 className="section-title">Ações Administrativas</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => setModalMembros(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-user-gear" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Gerenciar Membros</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adicionar, editar e ajustar fotos</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>
          <button
            onClick={() => setModalComunicado(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-megaphone" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Enviar Comunicado</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Publicar aviso para todos os membros</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>
          <button
            onClick={() => setModalCadastros(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%', position: 'relative' }}
          >
            <i className="ph ph-user-plus" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Aprovar Novos Cadastros</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{pendentes} pendente{pendentes !== 1 ? 's' : ''}</p>
            </div>
            {pendentes > 0 && (
              <div style={{
                background: 'var(--accent-color)', color: 'var(--bg-color)',
                borderRadius: '50%', width: '24px', height: '24px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
              }}>
                {pendentes}
              </div>
            )}
            <i className="ph ph-caret-right"></i>
          </button>
          <button
            onClick={() => setModalConfig(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-gear" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Configurações da Igreja</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Imagem, cultos, horários, endereço</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>

          <button
            onClick={handleLogout}
            style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: '#ef4444', width: '100%' }}
          >
            <i className="ph ph-sign-out" style={{ fontSize: '1.5rem' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Sair do Painel Admin</h4>
              <p style={{ fontSize: '0.8rem', color: 'rgba(239,68,68,0.7)' }}>Encerrar sessão de liderança</p>
            </div>
          </button>
        </div>
      </main>

      {modalMembros && (
        <ModalGerenciarMembros
          onClose={() => setModalMembros(false)}
          membros={membros}
          setMembros={setMembros}
        />
      )}

      {modalCadastros && (
        <ModalGerenciarCadastros
          isOpen={modalCadastros}
          onClose={() => setModalCadastros(false)}
          cadastros={cadastros}
          setCadastros={setCadastros}
          membros={membros}
          setMembros={setMembros}
        />
      )}

      {modalComunicado && (
        <ModalComunicado
          onClose={() => setModalComunicado(false)}
          onSent={() => setToast('Comunicado publicado com sucesso!')}
        />
      )}

      {modalConfig && (
        <ModalConfiguracoes
          onClose={() => setModalConfig(false)}
          onSaved={() => setToast('Configurações salvas! Volte à Home para ver as mudanças.')}
        />
      )}

      {modalContribs && (
        <ModalContribuicoes
          onClose={() => setModalContribs(false)}
          contribs={contribs}
          onLimpar={() => setContribs([])}
        />
      )}

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} duration={4000} />}
    </div>
  );
}
