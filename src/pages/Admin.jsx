import { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadMembros, saveMembros, deleteMembroSupabase } from '../data/membros';
import {
  uploadFotoToStorage, saveConfigToSupabase, updateCadastroStatusSupabase, syncFromSupabase,
  saveAvisoToSupabase, deleteAvisoFromSupabase,
  deletePedidoOracaoFromSupabase, clearPedidosOracaoFromSupabase,
  updateAconselhamentoStatusSupabase, deleteAconselhamentoFromSupabase,
  updateCadastroSenhaSupabase,
} from '../data/supabase';
import { hashPassword } from '../data/crypto';
import { loadConfig, saveConfig, DIAS_SEMANA, formatHora } from '../data/config';
import { loadContribuicoes, clearContribuicoes, totalContribuicoes, totalPorObra } from '../data/contribuicoes';
import { MINISTERIOS, loadVagas, saveVagas, VAGAS_KEY } from '../data/vagas';
import { loadMinisterios, saveMinisterios, ICON_OPTIONS, COLOR_PRESETS } from '../data/ministeriosData';
import { EVANGELISMO_KEY, loadSaidas, saveSaidas, SAIDAS_DEFAULT } from '../data/evangelismo';
import { loadTeologia, saveTeologia, TEOLOGIA_DEFAULT } from '../data/teologia';

const CADASTROS_KEY = 'cadastros_pendentes';
const ADMIN_AVISOS_KEY = 'admin_avisos';

function loadCadastros() {
  try { return JSON.parse(localStorage.getItem(CADASTROS_KEY)) || []; }
  catch { return []; }
}

function saveCadastros(cadastros) {
  localStorage.setItem(CADASTROS_KEY, JSON.stringify(cadastros));
}

// Sem caracteres ambíguos (0/O, 1/I/l) pra facilitar ditar por telefone/WhatsApp
function gerarSenhaTemporaria() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let senha = '';
  for (let i = 0; i < 8; i++) senha += chars[Math.floor(Math.random() * chars.length)];
  return senha;
}

function ModalGerenciarCadastros({ isOpen, onClose, cadastros, setCadastros, membros, setMembros }) {
  const pendentes = cadastros.filter(c => c.status === 'pendente');
  const aprovados = cadastros.filter(c => c.status === 'aprovado');
  const [aprovadoNome, setAprovadoNome] = useState(null);
  const [atualizando, setAtualizando] = useState(false);
  const [aba, setAba] = useState('pendentes'); // 'pendentes' | 'contas'
  const [busca, setBusca] = useState('');
  const [senhaGerada, setSenhaGerada] = useState(null); // { id, nome, senha }
  const [copiado, setCopiado] = useState(false);

  const handleAtualizar = async () => {
    setAtualizando(true);
    await syncFromSupabase();
    setCadastros(loadCadastros());
    setAtualizando(false);
  };

  const handleResetSenha = async (cadastro) => {
    if (!confirm(`Gerar uma nova senha temporária para ${cadastro.nome}?\n\nA senha atual dele(a) deixará de funcionar.`)) return;

    const novaSenha = gerarSenhaTemporaria();
    const { hash, salt } = await hashPassword(novaSenha);

    const novosCadastros = cadastros.map(c =>
      c.id === cadastro.id ? { ...c, password: undefined, passwordHash: hash, passwordSalt: salt } : c
    );
    setCadastros(novosCadastros);
    saveCadastros(novosCadastros);
    updateCadastroSenhaSupabase(cadastro.id, hash, salt);

    setSenhaGerada({ id: cadastro.id, nome: cadastro.nome, senha: novaSenha });
    setCopiado(false);
  };

  const handleCopiarSenha = () => {
    if (!senhaGerada) return;
    navigator.clipboard?.writeText(senhaGerada.senha).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  const aprovadosFiltrados = aprovados.filter(c => {
    const q = busca.trim().toLowerCase();
    if (!q) return true;
    return c.nome?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (!aprovadoNome) return;
    const t = setTimeout(() => {
      setAprovadoNome(null);
      onClose();
    }, 3000);
    return () => clearTimeout(t);
  }, [aprovadoNome, onClose]);

  const handleAprovar = (id) => {
    const cadastro = cadastros.find(c => c.id === id);
    if (!cadastro) return;

    const novoMembro = {
      id: Math.max(...membros.map(m => m.id), 0) + 1,
      nome: cadastro.nome,
      cargo: 'Membro',
      celula: cadastro.celula,
      bairro: cadastro.bairro,
      dataNascimento: cadastro.dataNascimento || null,
      foto: cadastro.foto || null,
    };

    const novosMembros = [...membros, novoMembro];
    setMembros(novosMembros);
    saveMembros(novosMembros);

    const novosCadastros = cadastros.map(c =>
      c.id === id ? { ...c, status: 'aprovado' } : c
    );
    setCadastros(novosCadastros);
    saveCadastros(novosCadastros);
    updateCadastroStatusSupabase(id, 'aprovado');

    setAprovadoNome(cadastro.nome);
  };

  const handleRejeitar = (id) => {
    if (!confirm('Tem certeza que deseja rejeitar este cadastro?')) return;

    const novosCadastros = cadastros.map(c =>
      c.id === id ? { ...c, status: 'rejeitado' } : c
    );
    setCadastros(novosCadastros);
    saveCadastros(novosCadastros);
    updateCadastroStatusSupabase(id, 'rejeitado');
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
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Cadastros de Membros</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={handleAtualizar}
            disabled={atualizando}
            title="Buscar novos cadastros"
            style={{
              background: 'none', border: 'none', color: 'var(--text-secondary)',
              cursor: atualizando ? 'default' : 'pointer', fontSize: '1.1rem', padding: 0, width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className="ph ph-arrow-clockwise" style={atualizando ? { animation: 'spin 1s linear infinite', display: 'inline-block' } : undefined}></i>
          </button>
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
        </div>

        <div style={{ display: 'flex', gap: '8px', padding: 'var(--spacing-md) var(--spacing-lg) 0' }}>
          <button
            onClick={() => setAba('pendentes')}
            style={{
              flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: aba === 'pendentes' ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
              color: aba === 'pendentes' ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: '1px solid ' + (aba === 'pendentes' ? 'var(--accent-color)' : 'var(--border-color)'),
            }}
          >
            Pendentes {pendentes.length > 0 && `(${pendentes.length})`}
          </button>
          <button
            onClick={() => setAba('contas')}
            style={{
              flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600,
              background: aba === 'contas' ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
              color: aba === 'contas' ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: '1px solid ' + (aba === 'contas' ? 'var(--accent-color)' : 'var(--border-color)'),
            }}
          >
            Contas Aprovadas ({aprovados.length})
          </button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          {aba === 'pendentes' ? (aprovadoNome ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="ph ph-check" style={{ fontSize: '2rem', color: '#22c55e' }}></i>
              </div>
              <div>
                <h4 style={{ margin: 0, marginBottom: '6px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  Membro aprovado!
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--accent-color)' }}>{aprovadoNome}</strong> foi adicionado(a) como membro.
                </p>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Voltando ao painel em instantes...
              </p>
            </div>
          ) : pendentes.length === 0 ? (
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
          )) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text" value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou e-mail..."
                style={{
                  width: '100%', padding: '10px 12px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none',
                }}
              />

              {senhaGerada && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                }}>
                  <p style={{ margin: 0, marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Senha temporária para <strong style={{ color: 'var(--text-primary)' }}>{senhaGerada.nome}</strong>:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <code style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '2px', color: '#22c55e', background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: '4px' }}>
                      {senhaGerada.senha}
                    </code>
                    <button
                      onClick={handleCopiarSenha}
                      style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-primary)', cursor: 'pointer', padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className={`ph ${copiado ? 'ph-check' : 'ph-copy'}`}></i> {copiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Envie essa senha ao membro por um canal seguro (WhatsApp, telefone). Ele já pode usá-la para entrar e pode trocá-la depois em "Esqueci minha senha".
                  </p>
                  <button
                    onClick={() => setSenhaGerada(null)}
                    style={{ marginTop: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', padding: 0, textDecoration: 'underline' }}
                  >
                    Fechar
                  </button>
                </div>
              )}

              {aprovadosFiltrados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                  <i className="ph ph-magnifying-glass" style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}></i>
                  <p>Nenhuma conta encontrada</p>
                </div>
              ) : (
                aprovadosFiltrados.map(cadastro => (
                  <div key={cadastro.id} style={{
                    background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0, marginBottom: '4px' }}>
                        {cadastro.nome}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        <i className="ph ph-envelope"></i> {cadastro.email}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                        <i className="ph ph-phone"></i> {cadastro.celular}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResetSenha(cadastro)}
                      title="Gerar senha temporária"
                      style={{
                        flexShrink: 0, padding: '8px 12px', background: 'rgba(250,204,21,0.15)',
                        border: '1px solid rgba(250,204,21,0.4)', color: '#facc15',
                        borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                      }}
                    >
                      <i className="ph ph-key"></i> Senha temporária
                    </button>
                  </div>
                ))
              )}
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
      deleteMembroSupabase(id);
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
              <i className="ph ph-hand-coins" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}></i>
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


/* ── Modal Configurações da Igreja ─────────────────────────────── */
function ModalConfiguracoes({ onClose, onSaved }) {
  const [cfg, setCfg] = useState(loadConfig);
  const [heroBgPreview, setHeroBgPreview] = useState(loadConfig().heroBg);
  const [heroBgPosition, setHeroBgPosition] = useState(loadConfig().heroBgPosition || '50% 50%');
  const [isDraggingHero, setIsDraggingHero] = useState(false);
  const heroBgRef = useRef(null);

  function parseHeroPos(pos) {
    const KW = { left: 0, center: 50, right: 100, top: 0, bottom: 100 };
    const parts = (pos || '50% 50%').trim().split(/\s+/);
    if (parts.length === 1) return [50, 50];
    const x = parts[0].endsWith('%') ? parseFloat(parts[0]) : (KW[parts[0]] ?? 50);
    const y = parts[1].endsWith('%') ? parseFloat(parts[1]) : (KW[parts[1]] ?? 50);
    return [x, y];
  }

  function updateHeroPos(e) {
    const el = heroBgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.min(100, Math.max(0, Math.round(((clientX - rect.left) / rect.width) * 100)));
    const y = Math.min(100, Math.max(0, Math.round(((clientY - rect.top) / rect.height) * 100)));
    const pos = `${x}% ${y}%`;
    setHeroBgPosition(pos);
    setCfg(c => ({ ...c, heroBgPosition: pos }));
  }
  const [secao, setSecao] = useState('identidade');
  const [vagas, setVagas] = useState(loadVagas);
  const [novaVaga, setNovaVaga] = useState({ ministerio: MINISTERIOS[0].nome, data: '', horario: '', vagas: 4 });

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
      img.onload = async () => {
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        const url = await uploadFotoToStorage(compressed, 'obras');
        setCfg(c => ({ ...c, obras: c.obras.map(o => o.id === id ? { ...o, foto: url } : o) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeObraFoto = (id) => {
    setCfg(c => ({ ...c, obras: c.obras.map(o => o.id === id ? { ...o, foto: null } : o) }));
  };

  const handleCultoFotoUpload = (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 900;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.78);
        const url = await uploadFotoToStorage(compressed, 'cultos');
        setCfg(c => ({ ...c, cultos: c.cultos.map(cu => cu.id === id ? { ...cu, foto: url } : cu) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const removeCultoFoto = (id) => {
    setCfg(c => ({ ...c, cultos: c.cultos.map(cu => cu.id === id ? { ...cu, foto: null } : cu) }));
  };

  const handleHeroUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 1200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const url = await uploadFotoToStorage(compressed, 'hero');
        setHeroBgPreview(url);
        setCfg(c => ({ ...c, heroBg: url }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const adicionarVaga = () => {
    if (!novaVaga.data.trim() || !novaVaga.horario.trim()) return;
    const nova = { ...novaVaga, id: Date.now(), aberta: true, confirmados: 0 };
    setVagas(v => [...v, nova]);
    setNovaVaga(nv => ({ ...nv, data: '', horario: '' }));
  };

  const toggleVaga = (id) => setVagas(v => v.map(vg => vg.id === id ? { ...vg, aberta: !vg.aberta } : vg));

  const removerVaga = (id) => setVagas(v => v.filter(vg => vg.id !== id));

  const handleSalvar = async () => {
    saveConfig(cfg);
    saveVagas(vagas);
    saveConfigToSupabase(cfg);
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
    { key: 'pix',        label: 'PIX',        icon: 'ph-key' },
    { key: 'servir',     label: 'Servir',     icon: 'ph-heart' },
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

              {/* Preview interativo — arraste para posicionar */}
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Posição da imagem <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— clique ou arraste para ajustar</span>
                </label>
                <div
                  ref={heroBgRef}
                  onMouseDown={e => { setIsDraggingHero(true); updateHeroPos(e); }}
                  onMouseMove={e => { if (isDraggingHero) updateHeroPos(e); }}
                  onMouseUp={() => setIsDraggingHero(false)}
                  onMouseLeave={() => setIsDraggingHero(false)}
                  onTouchStart={e => { setIsDraggingHero(true); updateHeroPos(e); }}
                  onTouchMove={e => { e.preventDefault(); updateHeroPos(e); }}
                  onTouchEnd={() => setIsDraggingHero(false)}
                  style={{ width: '100%', height: '180px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: `2px solid ${isDraggingHero ? 'var(--accent-color)' : 'var(--border-color)'}`, position: 'relative', background: '#111', cursor: 'crosshair', userSelect: 'none', transition: 'border-color 0.2s' }}
                >
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroBgPreview || '/hero_bg.png'})`, backgroundSize: 'cover', backgroundPosition: heroBgPosition }} />

                  {/* Marcador do ponto focal */}
                  {(() => {
                    const [px, py] = parseHeroPos(heroBgPosition);
                    return (
                      <div style={{ position: 'absolute', left: `${px}%`, top: `${py}%`, transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 2 }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: '2.5px solid #fff', boxShadow: '0 0 0 1.5px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(2px)' }} />
                      </div>
                    );
                  })()}

                  {/* Dica */}
                  {!isDraggingHero && (
                    <div style={{ position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 'var(--radius-full)', pointerEvents: 'none' }}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', whiteSpace: 'nowrap' }}>Arraste para reposicionar</span>
                    </div>
                  )}
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
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Use o formato: 5511999999999 (DDI + DDD + número, sem espaços ou traços).</p>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  WhatsApp do Pastor <span style={{ color: '#25D366', fontSize: '0.75rem' }}>— para aconselhamento</span>
                </label>
                <input
                  type="tel"
                  value={cfg.whatsappPastor || ''}
                  onChange={e => set('whatsappPastor', e.target.value)}
                  style={inputSt}
                  placeholder="5511999999999"
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Exibido como botão de contato direto na página de aconselhamento.
                </p>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }} />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, fontWeight: 600 }}>Grupos de Célula</p>
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

                      {/* Foto */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Foto da Programação</label>
                        {cu.foto && (
                          <div style={{ width: '100%', height: '110px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px', border: '1px solid var(--border-color)' }}>
                            <img src={cu.foto} alt={cu.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <i className="ph ph-image"></i>
                            {cu.foto ? 'Trocar foto' : 'Adicionar foto'}
                            <input type="file" accept="image/*" onChange={e => handleCultoFotoUpload(cu.id, e)} style={{ display: 'none' }} />
                          </label>
                          {cu.foto && (
                            <button onClick={() => removeCultoFoto(cu.id)} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* PIX */}
          {secao === 'pix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Chave PIX exibida na aba de contribuição. Pode ser CPF, CNPJ, e-mail, telefone ou chave aleatória.
              </p>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={cfg.pixKey || ''}
                  onChange={e => set('pixKey', e.target.value)}
                  style={inputSt}
                  placeholder="Ex: igrejafoiporamor@email.com"
                />
              </div>

              {cfg.pixKey && (
                <div style={{ padding: '14px 16px', background: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="ph ph-check-circle" style={{ fontSize: '1.2rem', color: '#6d28d9', flexShrink: 0 }}></i>
                  <div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>Chave configurada</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, wordBreak: 'break-all' }}>{cfg.pixKey}</p>
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Esta chave será exibida para os contribuintes copiarem diretamente no app do banco.
              </p>
            </div>
          )}

          {/* SERVIR */}
          {secao === 'servir' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Crie e gerencie as vagas de voluntariado para cada ministério.
              </p>

              {/* Formulário nova vaga */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Nova Vaga</p>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Ministério</label>
                  <select value={novaVaga.ministerio} onChange={e => setNovaVaga(nv => ({ ...nv, ministerio: e.target.value }))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }}>
                    {MINISTERIOS.map(m => <option key={m.nome} value={m.nome}>{m.nome}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Data</label>
                    <input type="text" placeholder="Ex: Dom, 22 Jun" value={novaVaga.data} onChange={e => setNovaVaga(nv => ({ ...nv, data: e.target.value }))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Horário</label>
                    <input type="text" placeholder="Ex: 09:00 - 12:00" value={novaVaga.horario} onChange={e => setNovaVaga(nv => ({ ...nv, horario: e.target.value }))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Número de vagas</label>
                  <input type="number" min="1" max="50" value={novaVaga.vagas} onChange={e => setNovaVaga(nv => ({ ...nv, vagas: Number(e.target.value) }))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                </div>

                <button
                  onClick={adicionarVaga}
                  disabled={!novaVaga.data.trim() || !novaVaga.horario.trim()}
                  style={{ padding: '10px', background: '#6d28d9', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (!novaVaga.data.trim() || !novaVaga.horario.trim()) ? 0.5 : 1 }}
                >
                  <i className="ph ph-plus"></i> Adicionar Vaga
                </button>
              </div>

              {/* Lista de vagas */}
              {vagas.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>Nenhuma vaga criada ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Vagas criadas</p>
                  {vagas.map(vg => (
                    <div key={vg.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${vg.aberta ? 'rgba(109,40,217,0.4)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vg.ministerio}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{vg.data} · {vg.horario} · {vg.vagas} vagas</p>
                      </div>
                      <button
                        onClick={() => toggleVaga(vg.id)}
                        style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 'var(--radius-full)', border: 'none', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: vg.aberta ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)', color: vg.aberta ? '#22c55e' : '#ef4444' }}
                      >
                        {vg.aberta ? 'Aberta' : 'Fechada'}
                      </button>
                      <button
                        onClick={() => removerVaga(vg.id)}
                        style={{ flexShrink: 0, width: '30px', height: '30px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <i className="ph ph-trash" style={{ fontSize: '0.9rem' }}></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

const ACONSELHAMENTO_KEY = 'pedidos_aconselhamento';

function loadAconselhamentos() {
  try { return JSON.parse(localStorage.getItem(ACONSELHAMENTO_KEY)) || []; }
  catch { return []; }
}

function ModalAconselhamento({ onClose }) {
  const [pedidos, setPedidos] = useState(loadAconselhamentos);
  const [expandido, setExpandido] = useState(null);

  const toggleAtendido = (id) => {
    const novos = pedidos.map(p => p.id === id ? { ...p, atendido: !p.atendido } : p);
    setPedidos(novos);
    localStorage.setItem(ACONSELHAMENTO_KEY, JSON.stringify(novos));
    updateAconselhamentoStatusSupabase(id, novos.find(p => p.id === id).atendido);
  };

  const remover = (id) => {
    if (!confirm('Remover este pedido?')) return;
    const novos = pedidos.filter(p => p.id !== id);
    setPedidos(novos);
    localStorage.setItem(ACONSELHAMENTO_KEY, JSON.stringify(novos));
    deleteAconselhamentoFromSupabase(id);
  };

  const formatarWa = (tel) => {
    const digits = tel.replace(/\D/g, '');
    return digits.startsWith('55') ? digits : `55${digits}`;
  };

  const CONTATO_ICON = {
    'WhatsApp': 'ph-whatsapp-logo',
    'Ligação telefônica': 'ph-phone',
    'Presencial na Igreja': 'ph-church',
    'E-mail': 'ph-envelope',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-color)', borderRadius: '20px 20px 0 0', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '20px var(--spacing-lg) var(--spacing-md)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', margin: 0 }}>Pedidos de Aconselhamento</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{pedidos.filter(p => !p.atendido).length} pendente{pedidos.filter(p => !p.atendido).length !== 1 ? 's' : ''} · {pedidos.length} no total</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        {/* Lista */}
        <div style={{ overflowY: 'auto', padding: 'var(--spacing-md) var(--spacing-lg)', flex: 1 }}>
          {pedidos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <i className="ph ph-chat-circle-dots" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '10px' }}></i>
              <p style={{ fontSize: '0.9rem' }}>Nenhum pedido recebido ainda.</p>
            </div>
          ) : (
            pedidos.map(p => (
              <div key={p.id} style={{ background: 'var(--bg-surface)', border: `1px solid ${p.atendido ? 'var(--border-color)' : 'rgba(109,40,217,0.35)'}`, borderRadius: 'var(--radius-md)', marginBottom: '10px', overflow: 'hidden', opacity: p.atendido ? 0.65 : 1 }}>

                {/* Cabeçalho do pedido */}
                <button
                  onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: p.atendido ? 'var(--bg-surface-elevated)' : 'rgba(109,40,217,0.15)', border: `1px solid ${p.atendido ? 'var(--border-color)' : 'rgba(109,40,217,0.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className="ph ph-chat-circle-dots" style={{ fontSize: '1.1rem', color: p.atendido ? 'var(--text-muted)' : '#6d28d9' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.nome || 'Anônimo'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {p.tipo} · {p.data}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {p.atendido && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-full)', padding: '2px 8px' }}>Atendido</span>}
                    <i className={`ph ${expandido === p.id ? 'ph-caret-up' : 'ph-caret-down'}`} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
                  </div>
                </button>

                {/* Conteúdo expandido */}
                {expandido === p.id && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ paddingTop: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className={`ph ${CONTATO_ICON[p.contato] || 'ph-chat'}`} style={{ color: '#6d28d9', fontSize: '1rem' }}></i>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Prefere: {p.contato}</span>
                        {!p.membro && <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '1px 7px' }}>Visitante</span>}
                      </div>
                      {p.telefone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 'var(--radius-sm)' }}>
                          <i className="ph ph-phone" style={{ color: '#22c55e', fontSize: '1rem', flexShrink: 0 }}></i>
                          <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '0.5px', flex: 1 }}>{p.telefone}</span>
                          {p.contato === 'WhatsApp' && (
                            <a
                              href={`https://wa.me/${formatarWa(p.telefone)}?text=${encodeURIComponent(`Olá ${p.nome || ''}! Sou pastor(a) da Igreja Foi Por Amor. Recebi seu pedido de aconselhamento sobre "${p.tipo}" e gostaria de conversar com você. Quando teria um bom momento?`)}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#25D366', color: '#fff', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                            >
                              <i className="ph ph-whatsapp-logo"></i> Abrir WhatsApp
                            </a>
                          )}
                          {p.contato === 'Ligação telefônica' && (
                            <a
                              href={`tel:${p.telefone.replace(/\D/g, '')}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
                            >
                              <i className="ph ph-phone"></i> Ligar
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.65, background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', margin: '0 0 12px' }}>
                      {p.mensagem}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleAtendido(p.id)}
                        style={{ flex: 1, padding: '9px', borderRadius: 'var(--radius-md)', border: 'none', background: p.atendido ? 'rgba(255,255,255,0.06)' : '#22c55e', color: p.atendido ? 'var(--text-secondary)' : '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      >
                        <i className={`ph ${p.atendido ? 'ph-arrow-counter-clockwise' : 'ph-check'}`}></i>
                        {p.atendido ? 'Reabrir' : 'Marcar como Atendido'}
                      </button>
                      <button
                        onClick={() => remover(p.id)}
                        style={{ padding: '9px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem', fontWeight: 600 }}
                      >
                        <i className="ph ph-trash"></i> Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ModalComunicado({ onClose, onSent }) {
  const [form, setForm] = useState({ titulo: '', texto: '', tipo: 'Informativo' });
  const [avisos, setAvisos] = useState(() => JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]'));
  const [aba, setAba] = useState('novo');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inputSt = { width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' };

  const handleEnviar = (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim()) return;
    const novoAviso = {
      id: Date.now(), tipo: form.tipo, titulo: form.titulo, texto: form.texto,
      data: new Date().toLocaleDateString('pt-BR'), icone: 'ph-megaphone', admin: true,
    };
    const atualizados = [novoAviso, ...avisos];
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(atualizados));
    setAvisos(atualizados);
    saveAvisoToSupabase(novoAviso);
    setForm({ titulo: '', texto: '', tipo: 'Informativo' });
    setAba('gerenciar');
    onSent();
  };

  const handleExcluir = (id) => {
    const atualizados = avisos.filter(a => a.id !== id);
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(atualizados));
    setAvisos(atualizados);
    deleteAvisoFromSupabase(id);
  };

  const TIPO_COR = {
    Urgente:     '#ef4444',
    Evento:      'var(--accent-color)',
    Informativo: 'var(--text-muted)',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        {/* Header */}
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Comunicados</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}><i className="ph ph-x"></i></button>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          {[{ key: 'novo', label: 'Novo comunicado' }, { key: 'gerenciar', label: `Publicados (${avisos.length})` }].map(a => (
            <button key={a.key} onClick={() => setAba(a.key)} style={{ flex: 1, padding: '12px', background: 'none', border: 'none', borderBottom: `2px solid ${aba === a.key ? 'var(--accent-color)' : 'transparent'}`, color: aba === a.key ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: aba === a.key ? 700 : 400, fontSize: '0.85rem', transition: 'all 0.2s' }}>
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Aba: Novo */}
          {aba === 'novo' && (
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
                  <i className="ph ph-megaphone"></i> Publicar
                </button>
              </div>
            </form>
          )}

          {/* Aba: Gerenciar */}
          {aba === 'gerenciar' && (
            <div style={{ padding: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {avisos.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  <i className="ph ph-megaphone" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                  <p style={{ fontSize: '0.9rem' }}>Nenhum comunicado publicado.</p>
                </div>
              ) : (
                avisos.map(a => (
                  <div key={a.id} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: TIPO_COR[a.tipo] || 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{a.tipo}</span>
                      <p style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', margin: '2px 0' }}>{a.titulo}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{a.data}</p>
                    </div>
                    <button
                      onClick={() => handleExcluir(a.id)}
                      style={{ padding: '7px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', flexShrink: 0 }}
                    >
                      <i className="ph ph-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


/* ── Modal ITEAP ─────────────────────────────────────────────────── */
function ModalITEAP({ onClose, onSaved }) {
  const [data, setData] = useState(() => loadTeologia());
  const [novoModulo, setNovoModulo] = useState({ nome: '', totalAulas: '' });
  const inputSt = { width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' };

  const set = k => e => setData(d => ({ ...d, [k]: e.target.value }));

  const handleAddModulo = () => {
    const nome = novoModulo.nome.trim();
    const total = parseInt(novoModulo.totalAulas);
    if (!nome || isNaN(total) || total < 1) return;
    const mod = { id: Date.now(), nome, totalAulas: total };
    setData(d => ({ ...d, modulos: [...d.modulos, mod] }));
    setNovoModulo({ nome: '', totalAulas: '' });
  };

  const handleDeleteModulo = id => {
    setData(d => {
      const modulos = d.modulos.filter(m => m.id !== id);
      const idxAtual = Math.min(d.moduloAtualIdx, Math.max(0, modulos.length - 1));
      return { ...d, modulos, moduloAtualIdx: idxAtual };
    });
  };

  const handleSalvar = () => {
    saveTeologia(data);
    onSaved();
    onClose();
  };

  const moduloAtual = data.modulos[data.moduloAtualIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>

        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Gerenciar ITEAP</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.3rem', cursor: 'pointer' }}>
            <i className="ph ph-x"></i>
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Informações gerais */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Professor / Instrutor</label>
            <input style={inputSt} value={data.professor} onChange={set('professor')} placeholder="Nome do professor" />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Descrição</label>
            <input style={inputSt} value={data.descricao} onChange={set('descricao')} placeholder="Ex: Instituto Teológico Amor e Palavra" />
          </div>
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Alunos Matriculados</label>
            <input style={inputSt} type="number" min="0" value={data.alunosMatriculados} onChange={e => setData(d => ({ ...d, alunosMatriculados: parseInt(e.target.value) || 0 }))} placeholder="Ex: 128" />
          </div>

          {/* Módulo atual e progresso */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Módulo Atual</label>
              <select style={{ ...inputSt, appearance: 'none' }} value={data.moduloAtualIdx} onChange={e => setData(d => ({ ...d, moduloAtualIdx: parseInt(e.target.value), progressoAulas: 0 }))}>
                {data.modulos.map((m, i) => <option key={m.id} value={i}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Aulas Concluídas {moduloAtual ? `(de ${moduloAtual.totalAulas})` : ''}
              </label>
              <input style={inputSt} type="number" min="0" max={moduloAtual?.totalAulas || 99} value={data.progressoAulas} onChange={e => setData(d => ({ ...d, progressoAulas: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>

          {/* Lista de módulos */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>Módulos do Curso</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {data.modulos.map((m, i) => (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-surface-elevated)', border: `1px solid ${i === data.moduloAtualIdx ? 'var(--accent-color)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px', flexShrink: 0 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>{m.nome}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>{m.totalAulas} aulas</p>
                  </div>
                  <button onClick={() => handleDeleteModulo(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem', padding: '2px' }}>
                    <i className="ph ph-trash"></i>
                  </button>
                </div>
              ))}
            </div>

            {/* Adicionar módulo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 40px', gap: '8px', alignItems: 'flex-end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome do módulo</label>
                <input style={inputSt} placeholder="Ex: Cristologia" value={novoModulo.nome} onChange={e => setNovoModulo(n => ({ ...n, nome: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddModulo()} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nº aulas</label>
                <input style={inputSt} type="number" min="1" placeholder="10" value={novoModulo.totalAulas} onChange={e => setNovoModulo(n => ({ ...n, totalAulas: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleAddModulo()} />
              </div>
              <button onClick={handleAddModulo} style={{ height: '40px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', fontWeight: 700, cursor: 'pointer', fontSize: '1.1rem' }}>
                <i className="ph ph-plus"></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
            <button onClick={handleSalvar} style={{ flex: 1, padding: '11px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: 'pointer', fontWeight: 700 }}>Salvar</button>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── Modal Evangelismo ──────────────────────────────────────────── */
const DIAS_SEMANA_NOME = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function ModalEvangelismo({ onClose, onSaved }) {
  const [saidas, setSaidas] = useState(() => loadSaidas());
  const [form, setForm] = useState({ titulo: '', data: '', horario: '', pontoEncontro: '', local: '', lider: '', descricao: '', vagas: 20 });

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  const inputSt = {
    width: '100%', background: 'var(--bg-surface-elevated)',
    border: '1px solid var(--border-color)', color: 'var(--text-primary)',
    padding: '11px 14px', borderRadius: 'var(--radius-md)',
    fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none',
  };

  const handleAdicionar = () => {
    if (!form.titulo.trim() || !form.data || !form.horario) return;
    const [ano, mes, dia] = form.data.split('-');
    const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
    const nova = {
      ...form,
      id: Date.now(),
      diaSemana: DIAS_SEMANA_NOME[dataObj.getDay()],
      data: `${dia}/${mes}/${ano}`,
      vagas: Number(form.vagas),
    };
    setSaidas(s => [...s, nova]);
    setForm({ titulo: '', data: '', horario: '', pontoEncontro: '', local: '', lider: '', descricao: '', vagas: 20 });
  };

  const handleSalvar = () => {
    saveSaidas(saidas);
    onSaved();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 'var(--spacing-lg)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
          <h3 className="font-heading" style={{ fontSize: '1.1rem' }}>Saídas de Evangelismo</h3>
          <button onClick={onClose} className="icon-btn"><i className="ph ph-x"></i></button>
        </div>

        {/* Formulário nova saída */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Nova Saída</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={inputSt} placeholder="Título *" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="date" style={inputSt} value={form.data} onChange={e => set('data', e.target.value)} />
              <input type="time" style={inputSt} value={form.horario} onChange={e => set('horario', e.target.value)} />
            </div>
            <input style={inputSt} placeholder="Local" value={form.local} onChange={e => set('local', e.target.value)} />
            <input style={inputSt} placeholder="Ponto de encontro" value={form.pontoEncontro} onChange={e => set('pontoEncontro', e.target.value)} />
            <input style={inputSt} placeholder="Líder responsável" value={form.lider} onChange={e => set('lider', e.target.value)} />
            <textarea style={{ ...inputSt, minHeight: '72px', resize: 'vertical' }} placeholder="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)} />
            <input type="number" style={inputSt} placeholder="Vagas" min={1} value={form.vagas} onChange={e => set('vagas', e.target.value)} />
          </div>
          <button
            onClick={handleAdicionar}
            disabled={!form.titulo.trim() || !form.data || !form.horario}
            style={{ marginTop: '12px', width: '100%', padding: '11px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: (!form.titulo.trim() || !form.data || !form.horario) ? 0.5 : 1 }}
          >
            <i className="ph ph-plus"></i> Adicionar
          </button>
        </div>

        {/* Lista das saídas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
          {saidas.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--spacing-lg)' }}>Nenhuma saída cadastrada.</p>
          ) : saidas.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{s.titulo}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.data} · {s.horario} · {s.local || '—'}</p>
              </div>
              <button onClick={() => setSaidas(prev => prev.filter(x => x.id !== s.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0 }}>
                <i className="ph ph-trash"></i>
              </button>
            </div>
          ))}
        </div>

        <button onClick={handleSalvar} className="primary-btn" style={{ width: '100%', justifyContent: 'center', gap: '8px' }}>
          <i className="ph ph-floppy-disk"></i> Salvar Alterações
        </button>
      </div>
    </div>
  );
}

function ModalMinisteriosAdmin({ onClose, onSaved, membros }) {
  const [lista, setLista] = useState(loadMinisterios);
  const [tela, setTela] = useState('lista'); // lista | form
  const [editando, setEditando] = useState(null);
  const inputSt = { width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' };

  const FORM_EMPTY = { id: '', nome: '', descricao: '', tag: '', icon: 'ph-users-three', gradient: COLOR_PRESETS[0].gradient, glow: COLOR_PRESETS[0].glow, ring: COLOR_PRESETS[0].ring, membros: 0, sobreNos: { resumo: '', atividades: '', visao: '' }, lideres: [], ativo: true };
  const [form, setForm] = useState(FORM_EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSN = (k, v) => setForm(f => ({ ...f, sobreNos: { ...f.sobreNos, [k]: v } }));

  const abrirNovo = () => { setForm(FORM_EMPTY); setEditando(null); setTela('form'); };
  const abrirEditar = (m) => {
    setForm({ ...m, sobreNos: { resumo: m.sobreNos?.resumo || '', atividades: (m.sobreNos?.atividades || []).join('\n'), visao: m.sobreNos?.visao || '' }, lideres: m.lideres || [] });
    setEditando(m.id);
    setTela('form');
  };

  const salvarForm = () => {
    if (!form.nome.trim()) return;
    const atividadesArr = form.sobreNos.atividades.split('\n').map(a => a.trim()).filter(Boolean);
    const item = { ...form, id: editando || form.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''), sobreNos: { resumo: form.sobreNos.resumo, atividades: atividadesArr, visao: form.sobreNos.visao } };
    const novaLista = editando ? lista.map(m => m.id === editando ? item : m) : [...lista, item];
    setLista(novaLista);
    saveMinisterios(novaLista);
    setTela('lista');
  };

  const excluir = (id) => {
    if (!confirm('Excluir este ministério?')) return;
    const novaLista = lista.filter(m => m.id !== id);
    setLista(novaLista);
    saveMinisterios(novaLista);
  };

  const toggleLider = (membro) => {
    const jaEsta = form.lideres.some(l => l.id === membro.id);
    const novosLideres = jaEsta ? form.lideres.filter(l => l.id !== membro.id) : [...form.lideres, { id: membro.id, nome: membro.nome, foto: membro.foto || null }];
    set('lideres', novosLideres);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {tela === 'form' && (
            <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <i className="ph ph-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
          )}
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', flex: 1 }}>
            {tela === 'lista' ? 'Gerenciar Ministérios' : editando ? 'Editar Ministério' : 'Novo Ministério'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph ph-x" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {tela === 'lista' ? (
            <>
              <button onClick={abrirNovo} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <i className="ph ph-plus-circle"></i> Adicionar Ministério
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lista.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: m.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ph ${m.icon}`} style={{ fontSize: '1.1rem', color: '#fff' }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{m.nome}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{m.membros} membros · {m.lideres?.length || 0} líder(es)</p>
                    </div>
                    <button onClick={() => abrirEditar(m)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-pencil" style={{ fontSize: '1rem' }}></i>
                    </button>
                    <button onClick={() => excluir(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-trash" style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Nome */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome do ministério *</label>
                <input style={inputSt} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Ministério de Intercessão" />
              </div>
              {/* Tag */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoria / Tag</label>
                <input style={inputSt} value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="Ex: Oração, Música, Serviço..." />
              </div>
              {/* Descrição curta */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descrição curta</label>
                <input style={inputSt} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Uma linha descrevendo o ministério" />
              </div>
              {/* Membros */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quantidade de membros</label>
                <input type="number" min={0} style={{ ...inputSt, width: '120px' }} value={form.membros} onChange={e => set('membros', Number(e.target.value))} />
              </div>
              {/* Ícone */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Ícone</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ICON_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => set('icon', opt.value)} style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: form.icon === opt.value ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: `1px solid ${form.icon === opt.value ? 'var(--accent-color)' : 'var(--border-color)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.icon === opt.value ? 'var(--bg-color)' : 'var(--text-secondary)' }}>
                      <i className={`ph ${opt.value}`} style={{ fontSize: '1.2rem' }}></i>
                    </button>
                  ))}
                </div>
              </div>
              {/* Cor */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Cor do emblema</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {COLOR_PRESETS.map((c, i) => (
                    <button key={i} onClick={() => set('gradient', c.gradient) || set('glow', c.glow) || set('ring', c.ring) || setForm(f => ({ ...f, gradient: c.gradient, glow: c.glow, ring: c.ring }))} style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.gradient, border: form.gradient === c.gradient ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer', boxShadow: form.gradient === c.gradient ? '0 0 0 2px var(--accent-color)' : 'none', transition: 'all 0.15s' }} title={c.label} />
                  ))}
                </div>
              </div>

              {/* Sobre Nós — Resumo */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sobre Nós — Resumo</label>
                <textarea rows={3} style={{ ...inputSt, resize: 'vertical' }} value={form.sobreNos.resumo} onChange={e => setSN('resumo', e.target.value)} placeholder="Apresente o ministério em 2-3 frases..." />
              </div>
              {/* Atividades */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Atividades (uma por linha)</label>
                <textarea rows={4} style={{ ...inputSt, resize: 'vertical' }} value={form.sobreNos.atividades} onChange={e => setSN('atividades', e.target.value)} placeholder={'Exemplo:\nCultos semanais\nVisitas a hospitais\nDistribuição de alimentos'} />
              </div>
              {/* Visão */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Visão do ministério</label>
                <input style={inputSt} value={form.sobreNos.visao} onChange={e => setSN('visao', e.target.value)} placeholder="A visão que guia o ministério..." />
              </div>

              {/* Líderes */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Líderes do ministério</label>
                {form.lideres.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                    {form.lideres.map(l => (
                      <span key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {l.nome}
                        <button onClick={() => toggleLider(l)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)' }}>
                  {membros.map(m => {
                    const selecionado = form.lideres.some(l => l.id === m.id);
                    return (
                      <button key={m.id} onClick={() => toggleLider(m)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: selecionado ? 'rgba(255,255,255,0.06)' : 'none', border: 'none', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-primary)', textAlign: 'left' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>
                          {m.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span style={{ fontSize: '0.85rem', flex: 1 }}>{m.nome}</span>
                        {selecionado && <i className="ph ph-check-circle" style={{ color: 'var(--accent-color)', fontSize: '1rem' }}></i>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={salvarForm} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="ph ph-floppy-disk"></i> Salvar Ministério
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Pedidos de Oração ─────────────────────────────────────── */
function ModalPedidosOracao({ onClose }) {
  const [pedidos, setPedidos] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pedidos_oracao')) || []; }
    catch { return []; }
  });

  const handleExcluir = (id) => {
    const atualizados = pedidos.filter(p => p.id !== id && p.id !== String(id));
    setPedidos(atualizados);
    localStorage.setItem('pedidos_oracao', JSON.stringify(atualizados));
    deletePedidoOracaoFromSupabase(id);
  };

  const handleLimparTodos = () => {
    if (!confirm('Excluir todos os pedidos de oração?')) return;
    setPedidos([]);
    localStorage.setItem('pedidos_oracao', JSON.stringify([]));
    clearPedidosOracaoFromSupabase();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--spacing-lg)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)' }}>Pedidos de Oração</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {pedidos.length > 0 && (
              <button onClick={handleLimparTodos} style={{ fontSize: '0.78rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
                Limpar todos
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.4rem', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          {pedidos.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <i className="ph ph-hands-praying" style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}></i>
              Nenhum pedido de oração no momento.
            </div>
          ) : (
            pedidos.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{p.nome || 'Anônimo'}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>· {p.data}</span>
                    {p.privado && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '1px 7px', color: 'var(--text-muted)' }}>
                        Privado
                      </span>
                    )}
                  </div>
                  {p.celular && (
                    <a
                      href={`https://wa.me/55${p.celular.replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.75rem', color: '#22c55e', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px', textDecoration: 'none' }}
                    >
                      <i className="ph ph-whatsapp-logo"></i> {p.celular}
                    </a>
                  )}
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{p.texto}</p>
                </div>
                <button
                  onClick={() => handleExcluir(p.id)}
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                >
                  <i className="ph ph-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('adminAuth') === 'true'
  );
  const [membros, setMembros] = useState(loadMembros);
  const [teologia, setTeologia] = useState(loadTeologia);
  const [cadastros, setCadastros] = useState(loadCadastros);
  const [contribs, setContribs] = useState(loadContribuicoes);
  const [modalMembros, setModalMembros] = useState(false);
  const [modalCadastros, setModalCadastros] = useState(false);
  const [modalComunicado, setModalComunicado] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalContribs, setModalContribs] = useState(false);
  const [modalAconselhamento, setModalAconselhamento] = useState(false);
  const [modalEvangelismo, setModalEvangelismo]   = useState(false);
  const [modalITEAP, setModalITEAP]               = useState(false);
const [modalMinisterios, setModalMinisterios]   = useState(false);
  const [modalOracao, setModalOracao]             = useState(false);
  const [aconselhamentos] = useState(loadAconselhamentos);
  const [toast, setToast] = useState('');

  const totalNum = totalContribuicoes(contribs);
  const totalFmt = totalNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const pendentes = cadastros.filter(c => c.status === 'pendente').length;

  useEffect(() => {
    if (!isAuthenticated) return;
    syncFromSupabase().then(() => {
      setMembros(loadMembros());
      setCadastros(loadCadastros());
      setContribs(loadContribuicoes());
      setTeologia(loadTeologia());
    });
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/usuario" replace />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    sessionStorage.removeItem('user_session');
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
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-color)' }}>{teologia.alunosMatriculados}</span>
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
            onClick={() => setModalAconselhamento(true)}
            className="event-list-item"
            style={{ border: `1px solid ${aconselhamentos.filter(a => !a.atendido).length > 0 ? 'rgba(109,40,217,0.4)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%', position: 'relative' }}
          >
            <i className="ph ph-chat-circle-dots" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Pedidos de Aconselhamento</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{aconselhamentos.filter(a => !a.atendido).length} pendente{aconselhamentos.filter(a => !a.atendido).length !== 1 ? 's' : ''} · {aconselhamentos.length} no total</p>
            </div>
            {aconselhamentos.filter(a => !a.atendido).length > 0 && (
              <div style={{ background: '#6d28d9', color: '#fff', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                {aconselhamentos.filter(a => !a.atendido).length}
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
            onClick={() => setModalEvangelismo(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-megaphone" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Saídas de Evangelismo</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adicionar e remover saídas da agenda</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>

          <button
            onClick={() => setModalITEAP(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-graduation-cap" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>ITEAP — Teologia</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Professor, módulos e progresso do curso</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>

<button
            onClick={() => setModalOracao(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-hands-praying" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Pedidos de Oração</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visualizar e excluir pedidos inadequados</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>

          <button
            onClick={() => setModalMinisterios(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%' }}
          >
            <i className="ph ph-users-three" style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}></i>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontWeight: 500 }}>Ministérios da Igreja</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Adicionar, editar e definir líderes</p>
            </div>
            <i className="ph ph-caret-right"></i>
          </button>

          {/* QR Code do App */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', background: 'var(--bg-surface-elevated)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
              <i className="ph ph-qr-code" style={{ marginRight: '6px' }}></i>QR Code do App
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=ffffff&bgcolor=0d0d0d&data=${encodeURIComponent('https://foiporamor.vercel.app/instalar')}`}
              alt="QR Code"
              width={160} height={160}
              style={{ borderRadius: '8px', display: 'block', margin: '0 auto 10px' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>foiporamor.vercel.app</p>
            <a
              href="/instalar"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}
            >
              <i className="ph ph-arrow-square-out"></i> Ver página de instalação
            </a>
          </div>

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

      {modalAconselhamento && (
        <ModalAconselhamento onClose={() => setModalAconselhamento(false)} />
      )}

      {modalEvangelismo && (
        <ModalEvangelismo
          onClose={() => setModalEvangelismo(false)}
          onSaved={() => setToast('Saídas de evangelismo salvas!')}
        />
      )}

      {modalITEAP && (
        <ModalITEAP
          onClose={() => setModalITEAP(false)}
          onSaved={() => { setTeologia(loadTeologia()); setToast('ITEAP atualizado com sucesso!'); }}
        />
      )}

{modalMinisterios && (
        <ModalMinisteriosAdmin
          onClose={() => setModalMinisterios(false)}
          onSaved={() => setToast('Ministérios salvos com sucesso!')}
          membros={membros}
        />
      )}

      {modalOracao && <ModalPedidosOracao onClose={() => setModalOracao(false)} />}

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} duration={4000} />}
    </div>
  );
}
