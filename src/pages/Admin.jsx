import { useState, useEffect } from 'react';
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
import { loadConfig, saveConfig, applyBranding, DIAS_SEMANA, formatHora } from '../data/config';
import { MINISTERIOS, loadVagas, saveVagas } from '../data/vagas';
import { loadMinisterios, saveMinisterios, ICON_OPTIONS, COLOR_PRESETS } from '../data/ministeriosData';
import { loadGrupos, saveGrupos, GRUPO_COLOR_PRESETS } from '../data/gruposData';
import { loadMural, saveMural } from '../data/muralData';
import { loadSaidas, saveSaidas } from '../data/evangelismo';
import { enviarNotificacaoPush } from '../data/onesignal';
import { loadTeologia, saveTeologia } from '../data/teologia';

const CADASTROS_KEY = 'cadastros_pendentes';
const ADMIN_AVISOS_KEY = 'admin_avisos';
const PEDIDOS_ORACAO_KEY = 'pedidos_oracao';
const PEDIDOS_ORACAO_LIDOS_KEY = 'pedidos_oracao_lidos_admin';

// Monta o número pro link do WhatsApp — só adiciona o DDI do Brasil (55) se o
// número digitado ainda não tiver um código de país (evita duplicar "5555...").
function formatarWhatsApp(tel) {
  const digits = (tel || '').replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function loadPedidosOracao() {
  try { return JSON.parse(localStorage.getItem(PEDIDOS_ORACAO_KEY)) || []; }
  catch { return []; }
}

function contarPedidosOracaoNovos(pedidos) {
  try {
    const lidos = (JSON.parse(localStorage.getItem(PEDIDOS_ORACAO_LIDOS_KEY)) || []).map(String);
    return pedidos.filter(p => !lidos.includes(String(p.id))).length;
  } catch { return pedidos.length; }
}

function marcarPedidosOracaoComoLidos(pedidos) {
  localStorage.setItem(PEDIDOS_ORACAO_LIDOS_KEY, JSON.stringify(pedidos.map(p => String(p.id))));
}

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
  const grupos = loadGrupos();

  const handleAddMembro = () => {
    setFormData({ nome: '', cargo: 'Membro', celula: grupos[0]?.nome || '', bairro: '', foto: null });
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
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>Foto quadrada, ex: 500×500px</p>
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
                    <option>Pastor</option>
                    <option>Diácono</option>
                    <option>Presbítero</option>
                    <option>Líder de Grupo</option>
                    <option>Músico</option>
                    <option>Voluntária</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Grupo</label>
                  <select
                    value={formData.celula || grupos[0]?.nome || ''}
                    onChange={e => setFormData({ ...formData, celula: e.target.value })}
                    style={{
                      width: '100%', padding: '10px', background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
                      boxSizing: 'border-box', outline: 'none',
                    }}
                  >
                    {grupos.map(g => <option key={g.id} value={g.nome}>{g.nome}</option>)}
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



/* ── Seletor de horário (Hora/Minuto) — evita o formato AM/PM do <input type="time"> */
function SeletorHorario({ value, onChange, small }) {
  const [hStr, mStr] = (value || '00:00').split(':');
  const selectSt = {
    flex: 1, background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
    color: 'var(--text-primary)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
    outline: 'none', padding: small ? '8px' : '11px 14px', fontSize: small ? '0.85rem' : '0.9rem',
  };
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      <select value={hStr} onChange={e => onChange(`${e.target.value}:${mStr}`)} style={selectSt}>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => <option key={h} value={h}>{h}h</option>)}
      </select>
      <select value={mStr} onChange={e => onChange(`${hStr}:${e.target.value}`)} style={selectSt}>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}min</option>)}
      </select>
    </div>
  );
}

/* ── Modal Configurações da Igreja ─────────────────────────────── */
function ModalConfiguracoes({ onClose, onSaved }) {
  const [cfg, setCfg] = useState(loadConfig);
  const [secao, setSecao] = useState('identidade');
  const [vagas, setVagas] = useState(loadVagas);
  const [novaVaga, setNovaVaga] = useState({ ministerio: MINISTERIOS[0].nome, vagas: 4, avisar: true });

  const set = (campo, valor) => setCfg(c => ({ ...c, [campo]: valor }));

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

  const setObra = (id, campo, valor) =>
    setCfg(c => ({ ...c, obras: c.obras.map(o => o.id === id ? { ...o, [campo]: valor } : o) }));

  const addObra = () => {
    const preset = COLOR_PRESETS[(cfg.obras || []).length % COLOR_PRESETS.length];
    const nova = { id: `obra_${Date.now()}`, nome: 'Nova Obra Social', descricao: '', icone: 'ph-heart', gradiente: preset.gradient, foto: null };
    setCfg(c => ({ ...c, obras: [...(c.obras || []), nova] }));
  };

  const removeObra = (id) => {
    if (!confirm('Excluir esta obra social?')) return;
    setCfg(c => ({ ...c, obras: c.obras.filter(o => o.id !== id) }));
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

  const handleEnderecoFotoUpload = (e) => {
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
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const url = await uploadFotoToStorage(compressed, 'endereco');
        setCfg(c => ({ ...c, enderecoFoto: url }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePalavraDiaFotoUpload = (e) => {
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
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        const url = await uploadFotoToStorage(compressed, 'palavra-dia');
        setCfg(c => ({ ...c, palavraDiaFoto: url }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = async () => {
        const MAX = 500;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        const url = await uploadFotoToStorage(compressed, 'logo');
        setCfg(c => ({ ...c, logoUrl: url }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const dataMaisDias = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const criarAvisoVaga = (vaga) => {
    const novoAviso = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      tipo: 'Informativo',
      titulo: `Vaga de Voluntariado: ${vaga.ministerio}`,
      texto: `O setor de ${vaga.ministerio} está com ${vaga.vagas} vaga${vaga.vagas > 1 ? 's' : ''} aberta${vaga.vagas > 1 ? 's' : ''} para voluntariado. Vá até a igreja e procure a equipe para se inscrever!`,
      data: dataMaisDias(30), // some sozinho em 1 mês (regra padrão de expiração dos avisos)
      icone: 'ph-hand-heart',
      admin: true,
    };
    const atuais = JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]');
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify([novoAviso, ...atuais]));
    saveAvisoToSupabase(novoAviso);
    return novoAviso.id;
  };

  const removerAvisoVaga = (avisoId) => {
    if (!avisoId) return;
    const atuais = JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]');
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(atuais.filter(a => a.id !== avisoId)));
    deleteAvisoFromSupabase(avisoId);
  };

  const adicionarVaga = () => {
    const avisoId = novaVaga.avisar ? criarAvisoVaga(novaVaga) : null;
    const nova = { ministerio: novaVaga.ministerio, vagas: novaVaga.vagas, id: Date.now(), aberta: true, confirmados: 0, avisoId };
    setVagas(v => [...v, nova]);
    setNovaVaga({ ministerio: MINISTERIOS[0].nome, vagas: 4, avisar: true });
  };

  const toggleVaga = (id) => setVagas(v => v.map(vg => {
    if (vg.id !== id) return vg;
    const novaAberta = !vg.aberta;
    if (!novaAberta && vg.avisoId) removerAvisoVaga(vg.avisoId);
    return { ...vg, aberta: novaAberta, avisoId: novaAberta ? vg.avisoId : null };
  }));

  const removerVaga = (id) => {
    const vaga = vagas.find(vg => vg.id === id);
    if (vaga?.avisoId) removerAvisoVaga(vaga.avisoId);
    setVagas(v => v.filter(vg => vg.id !== id));
  };

  const handleSalvar = async () => {
    saveConfig(cfg);
    saveVagas(vagas);
    saveConfigToSupabase(cfg);
    applyBranding(cfg);
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
    { key: 'visual',     label: 'Visual',     icon: 'ph-palette' },
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
                ['Nome curto / sigla', 'nomeCurto',  'text', 'Ex: IFPA'],
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

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Chave da API do YouTube (YouTube Data API v3)
                </label>
                <input
                  type="text"
                  value={cfg.youtubeApiKey || ''}
                  onChange={e => set('youtubeApiKey', e.target.value)}
                  style={inputSt}
                  placeholder="AIzaSy..."
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                  Preenchendo isso, a Home busca sozinha o último vídeo do canal do YouTube (link acima) e mostra na seção "Última Pregação" — atualiza automaticamente assim que a igreja sobe um vídeo novo. Gere a chave no Google Cloud Console, ativando a "YouTube Data API v3". Deixe em branco pra desativar essa seção.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Foto do local <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— aparece no card "Onde nos encontrar" (proporção recomendada 16:9, ex: 1200×675px)</span>
                </label>
                {cfg.enderecoFoto && (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                    <img src={cfg.enderecoFoto} alt="Foto do local" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="ph ph-upload-simple"></i>
                    {cfg.enderecoFoto ? 'Trocar foto' : 'Escolher foto'}
                    <input type="file" accept="image/*" onChange={handleEnderecoFotoUpload} style={{ display: 'none' }} />
                  </label>
                  {cfg.enderecoFoto && (
                    <button onClick={() => set('enderecoFoto', null)} style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer' }}>
                      <i className="ph ph-trash"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Foto de fundo — Palavra do Dia <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— aparece atrás do card "Palavra do Dia" na Home (proporção recomendada 16:9, ex: 1200×675px)</span>
                </label>
                {cfg.palavraDiaFoto && (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                    <img src={cfg.palavraDiaFoto} alt="Foto de fundo da Palavra do Dia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <i className="ph ph-upload-simple"></i>
                    {cfg.palavraDiaFoto ? 'Trocar foto' : 'Escolher foto'}
                    <input type="file" accept="image/*" onChange={handlePalavraDiaFotoUpload} style={{ display: 'none' }} />
                  </label>
                  {cfg.palavraDiaFoto && (
                    <button onClick={() => set('palavraDiaFoto', null)} style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer' }}>
                      <i className="ph ph-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VISUAL */}
          {secao === 'visual' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Logo, cor de destaque e redes sociais exibidas no app.</p>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Logo do App <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>— foto quadrada, ex: 500×500px</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={cfg.logoUrl || '/logo-icon.png'} alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', flex: 1, justifyContent: 'center' }}>
                    <i className="ph ph-upload-simple"></i>
                    Trocar logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                  </label>
                  {cfg.logoUrl && (
                    <button onClick={() => set('logoUrl', null)} style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer' }}>
                      <i className="ph ph-trash"></i>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Cor de destaque</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={cfg.corDestaque || '#ffffff'} onChange={e => set('corDestaque', e.target.value)} style={{ width: '48px', height: '40px', padding: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'none', cursor: 'pointer' }} />
                  <input type="text" value={cfg.corDestaque || '#ffffff'} onChange={e => set('corDestaque', e.target.value)} style={{ ...inputSt, flex: 1 }} placeholder="#ffffff" />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Instagram</label>
                <input type="url" value={cfg.instagramLink || ''} onChange={e => set('instagramLink', e.target.value)} style={inputSt} placeholder="https://www.instagram.com/suaigreja/" />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Facebook</label>
                <input type="url" value={cfg.facebookLink || ''} onChange={e => set('facebookLink', e.target.value)} style={inputSt} placeholder="https://www.facebook.com/suaigreja" />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deixe os links de rede social vazios para ocultar o ícone na Home.</p>
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
            </div>
          )}

          {/* OBRAS SOCIAIS */}
          {secao === 'obras' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Crie, edite ou remova as obras sociais exibidas na página de Contribuições. Foto paisagem, ex: 1200×675px (16:9).
              </p>

              <button onClick={addObra} style={{ width: '100%', padding: '11px', background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="ph ph-plus-circle"></i> Adicionar Obra Social
              </button>

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

                  {/* Info + edição */}
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome</label>
                      <input type="text" value={obra.nome} onChange={e => setObra(obra.id, 'nome', e.target.value)} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} placeholder="Ex: Casa de Apoio" />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descrição</label>
                      <textarea value={obra.descricao} onChange={e => setObra(obra.id, 'descricao', e.target.value)} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem', minHeight: '60px', resize: 'vertical' }} placeholder="Uma ou duas frases sobre essa obra social" />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Ícone</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {ICON_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => setObra(obra.id, 'icone', opt.value)} style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: obra.icone === opt.value ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: `1px solid ${obra.icone === opt.value ? 'var(--accent-color)' : 'var(--border-color)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: obra.icone === opt.value ? 'var(--bg-color)' : 'var(--text-secondary)' }}>
                            <i className={`ph ${opt.value}`} style={{ fontSize: '1rem' }}></i>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Cor</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {COLOR_PRESETS.map((c, i) => (
                          <button key={i} onClick={() => setObra(obra.id, 'gradiente', c.gradient)} title={c.label} style={{ width: '30px', height: '30px', borderRadius: '50%', background: c.gradient, border: obra.gradiente === c.gradient ? '2px solid #fff' : '2px solid transparent', boxShadow: obra.gradiente === c.gradient ? '0 0 0 2px var(--accent-color)' : 'none', cursor: 'pointer', transition: 'all 0.15s' }} />
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'var(--accent-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--bg-color)' }}>
                        <i className="ph ph-upload-simple"></i>
                        {obra.foto ? 'Trocar Foto' : 'Adicionar Foto'}
                        <input type="file" accept="image/*" onChange={e => handleObraUpload(obra.id, e)} style={{ display: 'none' }} />
                      </label>
                      {obra.foto && (
                        <button onClick={() => removeObraFoto(obra.id)} style={{ padding: '8px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                          Remover foto
                        </button>
                      )}
                    </div>
                    <button onClick={() => removeObra(obra.id)} style={{ width: '100%', padding: '8px', background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <i className="ph ph-trash"></i> Excluir esta obra social
                    </button>
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
                          <SeletorHorario value={`${String(cu.hora).padStart(2,'0')}:${String(cu.min).padStart(2,'0')}`} onChange={v => { const [h, m] = v.split(':').map(Number); setCulto(cu.id, 'hora', h); setCulto(cu.id, 'min', m); }} small />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fim</label>
                          <SeletorHorario value={`${String(cu.horaFim).padStart(2,'0')}:${String(cu.minFim).padStart(2,'0')}`} onChange={v => { const [h, m] = v.split(':').map(Number); setCulto(cu.id, 'horaFim', h); setCulto(cu.id, 'minFim', m); }} small />
                        </div>
                      </div>

                      {/* Restrito */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={cu.restrito || false} onChange={e => setCulto(cu.id, 'restrito', e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-color)' }} />
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Visível apenas para membros logados</span>
                      </label>

                      {/* Foto */}
                      <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                          Foto da Programação <span style={{ fontWeight: 400 }}>— foto vertical, ex: 1000×1400px (aparece em card vertical na Home e pode virar capa do topo)</span>
                        </label>
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

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Nome do favorecido (razão social)
                </label>
                <input
                  type="text"
                  value={cfg.pixNome || ''}
                  onChange={e => set('pixNome', e.target.value)}
                  style={inputSt}
                  placeholder="Ex: Igreja Evangélica Foi Por Amor"
                />
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Mostrado junto com a chave, pra pessoa conferir que é o favorecido certo antes de pagar.
                </p>
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  CNPJ
                </label>
                <input
                  type="text"
                  value={cfg.pixCnpj || ''}
                  onChange={e => set('pixCnpj', e.target.value)}
                  style={inputSt}
                  placeholder="Ex: 40.058.046/0001-86"
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

              <div style={{ height: '1px', background: 'var(--border-color)' }} />

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  Chave PIX do Curso de Teologia (opcional)
                </label>
                <input
                  type="text"
                  value={cfg.pixKeyTeologia || ''}
                  onChange={e => set('pixKeyTeologia', e.target.value)}
                  style={inputSt}
                  placeholder="Deixe vazio para usar a chave PIX acima"
                />
              </div>

              {cfg.pixKeyTeologia && (
                <>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Nome do favorecido (chave da Teologia)
                    </label>
                    <input
                      type="text"
                      value={cfg.pixNomeTeologia || ''}
                      onChange={e => set('pixNomeTeologia', e.target.value)}
                      style={inputSt}
                      placeholder="Ex: Instituto Teológico Amor e Palavra"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      CNPJ (chave da Teologia)
                    </label>
                    <input
                      type="text"
                      value={cfg.pixCnpjTeologia || ''}
                      onChange={e => set('pixCnpjTeologia', e.target.value)}
                      style={inputSt}
                      placeholder="Deixe vazio para usar o mesmo CNPJ acima"
                    />
                  </div>
                </>
              )}

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6 }}>
                Se preenchida, essa chave substitui a chave PIX geral apenas na tela do Curso de Teologia (ITEAP).
              </p>
            </div>
          )}

          {/* SERVIR */}
          {secao === 'servir' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Crie e gerencie as vagas de voluntariado para cada ministério. A pessoa interessada deve ir até a igreja e procurar a equipe do setor.
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

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Número de vagas</label>
                  <input type="number" min="1" max="50" value={novaVaga.vagas} onChange={e => setNovaVaga(nv => ({ ...nv, vagas: Number(e.target.value) }))} style={{ ...inputSt, padding: '8px', fontSize: '0.85rem' }} />
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={novaVaga.avisar} onChange={e => setNovaVaga(nv => ({ ...nv, avisar: e.target.checked }))} />
                  Avisar todos os membros (fica em Avisos por 1 mês, ou até fechar/excluir a vaga)
                </label>

                <button
                  onClick={adicionarVaga}
                  style={{ padding: '10px', background: '#6d28d9', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
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
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{vg.vagas} vaga{vg.vagas > 1 ? 's' : ''}{vg.avisoId ? ' · avisado' : ''}</p>
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

function ModalAconselhamento({ onClose, pedidos, setPedidos }) {
  const [expandido, setExpandido] = useState(null);
  const config = loadConfig();

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
                              href={`https://wa.me/${formatarWhatsApp(p.telefone)}?text=${encodeURIComponent(`Olá ${p.nome || ''}! Sou pastor(a) da ${config.nomeIgreja}. Recebi seu pedido de aconselhamento sobre "${p.tipo}" e gostaria de conversar com você. Quando teria um bom momento?`)}`}
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

function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function isoParaBR(iso) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function ModalComunicado({ onClose, onSent }) {
  const [form, setForm] = useState({ titulo: '', texto: '', tipo: 'Informativo', data: hojeISO() });
  const [avisos, setAvisos] = useState(() => JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]'));
  const [aba, setAba] = useState('novo');
  const [enviarPush, setEnviarPush] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inputSt = { width: '100%', padding: '10px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', boxSizing: 'border-box', outline: 'none' };

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.texto.trim() || !form.data) return;
    const novoAviso = {
      id: String(Date.now()), tipo: form.tipo, titulo: form.titulo, texto: form.texto,
      data: isoParaBR(form.data), icone: 'ph-megaphone', admin: true,
    };
    const atualizados = [novoAviso, ...avisos];
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(atualizados));
    setAvisos(atualizados);
    saveAvisoToSupabase(novoAviso);
    setForm({ titulo: '', texto: '', tipo: 'Informativo', data: hojeISO() });
    setAba('gerenciar');
    let pushOk = null;
    if (enviarPush) {
      setEnviando(true);
      pushOk = await enviarNotificacaoPush({ titulo: novoAviso.titulo, texto: novoAviso.texto });
      setEnviando(false);
    }
    onSent(pushOk);
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
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Válido até *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px', gap: '8px' }}>
                  <select
                    value={form.data ? (form.data.split('-')[2] || '') : ''}
                    onChange={e => setForm(f => {
                      const p = (f.data || '--').split('-');
                      return { ...f, data: `${p[0] || ''}-${p[1] || ''}-${e.target.value}` };
                    })}
                    style={inputSt}
                  >
                    <option value="">Dia</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>
                    ))}
                  </select>
                  <select
                    value={form.data ? (form.data.split('-')[1] || '') : ''}
                    onChange={e => setForm(f => {
                      const p = (f.data || '--').split('-');
                      return { ...f, data: `${p[0] || ''}-${e.target.value}-${p[2] || ''}` };
                    })}
                    style={inputSt}
                  >
                    <option value="">Mês</option>
                    {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                      <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={form.data ? (form.data.split('-')[0] || '') : ''}
                    onChange={e => setForm(f => {
                      const p = (f.data || '--').split('-');
                      return { ...f, data: `${e.target.value}-${p[1] || ''}-${p[2] || ''}` };
                    })}
                    style={inputSt}
                  >
                    <option value="">Ano</option>
                    {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(y => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))}
                  </select>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  O comunicado some sozinho no dia seguinte a essa data.
                </p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input type="checkbox" checked={enviarPush} onChange={e => setEnviarPush(e.target.checked)} />
                Enviar notificação push pra quem tiver ativado
              </label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button type="button" onClick={onClose} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
                <button type="submit" disabled={enviando} style={{ flex: 1, padding: '11px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', cursor: enviando ? 'default' : 'pointer', fontWeight: 700, opacity: enviando ? 0.7 : 1 }}>
                  <i className={`ph ${enviando ? 'ph-spinner' : 'ph-megaphone'}`}></i> {enviando ? 'Enviando...' : 'Publicar'}
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
  const [saidasOriginais] = useState(() => loadSaidas());
  const [saidas, setSaidas] = useState(() => loadSaidas());
  const [form, setForm] = useState({ titulo: '', data: '', horario: '', pontoEncontro: '', local: '', lider: '', descricao: '', vagas: 20, avisar: true });

  const set = (campo, valor) => setForm(f => ({ ...f, [campo]: valor }));

  const criarAvisoSaida = (saida) => {
    const novoAviso = {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      tipo: 'Evento',
      titulo: `Saída de Evangelismo: ${saida.titulo}`,
      texto: `${saida.diaSemana}, ${saida.data} às ${saida.horario}${saida.local ? ` — ${saida.local}` : ''}.${saida.descricao ? ` ${saida.descricao}` : ''}`,
      data: saida.data, // já em DD/MM/AAAA — o aviso some sozinho no dia seguinte à saída
      icone: 'ph-megaphone',
      admin: true,
    };
    const atuais = JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY) || '[]');
    const atualizados = [novoAviso, ...atuais];
    localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(atualizados));
    saveAvisoToSupabase(novoAviso);
  };

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
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    if (isNaN(dataObj.getTime()) || dataObj < hoje) {
      alert('A data da saída parece inválida ou está no passado. Confira o dia digitado.');
      return;
    }
    const nova = {
      ...form,
      id: Date.now(),
      diaSemana: DIAS_SEMANA_NOME[dataObj.getDay()],
      data: `${dia}/${mes}/${ano}`,
      vagas: Number(form.vagas),
    };
    setSaidas(s => [...s, nova]);
    setForm({ titulo: '', data: '', horario: '', pontoEncontro: '', local: '', lider: '', descricao: '', vagas: 20, avisar: true });
  };

  const handleSalvar = () => {
    const idsOriginais = new Set(saidasOriginais.map(s => s.id));
    const novasSaidas = saidas.filter(s => !idsOriginais.has(s.id));
    novasSaidas.filter(s => s.avisar).forEach(criarAvisoSaida);
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

            {/* Data — 3 selects em vez de <input type="date"> (difícil de digitar no PC) */}
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 90px', gap: '8px' }}>
              <select
                value={form.data ? (form.data.split('-')[2] || '') : ''}
                onChange={e => setForm(f => {
                  const p = (f.data || '--').split('-');
                  return { ...f, data: `${p[0] || ''}-${p[1] || ''}-${e.target.value}` };
                })}
                style={inputSt}
              >
                <option value="">Dia</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                  <option key={d} value={String(d).padStart(2, '0')}>{String(d).padStart(2, '0')}</option>
                ))}
              </select>
              <select
                value={form.data ? (form.data.split('-')[1] || '') : ''}
                onChange={e => setForm(f => {
                  const p = (f.data || '--').split('-');
                  return { ...f, data: `${p[0] || ''}-${e.target.value}-${p[2] || ''}` };
                })}
                style={inputSt}
              >
                <option value="">Mês</option>
                {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'].map((m, i) => (
                  <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
              <select
                value={form.data ? (form.data.split('-')[0] || '') : ''}
                onChange={e => setForm(f => {
                  const p = (f.data || '--').split('-');
                  return { ...f, data: `${e.target.value}-${p[1] || ''}-${p[2] || ''}` };
                })}
                style={inputSt}
              >
                <option value="">Ano</option>
                {Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i).map(y => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            <SeletorHorario value={form.horario} onChange={v => set('horario', v)} />
            <input style={inputSt} placeholder="Local" value={form.local} onChange={e => set('local', e.target.value)} />
            <input style={inputSt} placeholder="Ponto de encontro" value={form.pontoEncontro} onChange={e => set('pontoEncontro', e.target.value)} />
            <input style={inputSt} placeholder="Líder responsável" value={form.lider} onChange={e => set('lider', e.target.value)} />
            <textarea style={{ ...inputSt, minHeight: '72px', resize: 'vertical' }} placeholder="Descrição" value={form.descricao} onChange={e => set('descricao', e.target.value)} />
            <input type="number" style={inputSt} placeholder="Vagas" min={1} value={form.vagas} onChange={e => set('vagas', e.target.value)} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.avisar} onChange={e => set('avisar', e.target.checked)} />
              Avisar todos os membros (cria um comunicado sobre essa saída)
            </label>
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
    onSaved();
    setTela('lista');
  };

  const excluir = (id) => {
    if (!confirm('Excluir este ministério?')) return;
    const novaLista = lista.filter(m => m.id !== id);
    setLista(novaLista);
    saveMinisterios(novaLista);
    onSaved();
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

/* ── Modal Grupos & Ministérios ────────────────────────────────── */
function ModalGruposAdmin({ onClose, onSaved }) {
  const [lista, setLista] = useState(loadGrupos);
  const [tela, setTela] = useState('lista'); // lista | form
  const [editando, setEditando] = useState(null);
  const inputSt = { width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' };

  const FORM_EMPTY = { id: '', nome: '', descricao: '', icone: 'ph-users-three', categoria: 'principal', ...GRUPO_COLOR_PRESETS[0] };
  const [form, setForm] = useState(FORM_EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNovo = () => { setForm(FORM_EMPTY); setEditando(null); setTela('form'); };
  const abrirEditar = (g) => { setForm({ ...g }); setEditando(g.id); setTela('form'); };

  const salvarForm = () => {
    if (!form.nome.trim()) return;
    const item = { ...form, id: editando || form.nome.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') };
    const novaLista = editando ? lista.map(g => g.id === editando ? item : g) : [...lista, item];
    setLista(novaLista);
    saveGrupos(novaLista);
    onSaved();
    setTela('lista');
  };

  const excluir = (id) => {
    if (!confirm('Excluir este grupo?')) return;
    const novaLista = lista.filter(g => g.id !== id);
    setLista(novaLista);
    saveGrupos(novaLista);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {tela === 'form' && (
            <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <i className="ph ph-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
          )}
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', flex: 1 }}>
            {tela === 'lista' ? 'Gerenciar Grupos' : editando ? 'Editar Grupo' : 'Novo Grupo'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph ph-x" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {tela === 'lista' ? (
            <>
              <button onClick={abrirNovo} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                <i className="ph ph-plus-circle"></i> Adicionar Grupo
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lista.map(g => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: g.cor, border: `1px solid ${g.corBorda}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ph ${g.icone}`} style={{ fontSize: '1.1rem', color: g.corTexto }}></i>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0 }}>{g.nome}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{g.categoria === 'principal' ? 'Grupo da Igreja' : 'Ministério'}</p>
                    </div>
                    <button onClick={() => abrirEditar(g)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-pencil" style={{ fontSize: '1rem' }}></i>
                    </button>
                    <button onClick={() => excluir(g.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-trash" style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nome do grupo *</label>
                <input style={inputSt} value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Ex: Ministério de Intercessão" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descrição</label>
                <input style={inputSt} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="Uma linha descrevendo o grupo" />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Seção</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[['principal', 'Grupos da Igreja'], ['aberto', 'Ministérios']].map(([val, label]) => (
                    <button key={val} onClick={() => set('categoria', val)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-sm)', background: form.categoria === val ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', color: form.categoria === val ? 'var(--bg-color)' : 'var(--text-secondary)', border: `1px solid ${form.categoria === val ? 'var(--accent-color)' : 'var(--border-color)'}`, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Ícone</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {ICON_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => set('icone', opt.value)} style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-sm)', background: form.icone === opt.value ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: `1px solid ${form.icone === opt.value ? 'var(--accent-color)' : 'var(--border-color)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: form.icone === opt.value ? 'var(--bg-color)' : 'var(--text-secondary)' }}>
                      <i className={`ph ${opt.value}`} style={{ fontSize: '1.2rem' }}></i>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Cor</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {GRUPO_COLOR_PRESETS.map((c, i) => (
                    <button key={i} onClick={() => setForm(f => ({ ...f, cor: c.cor, corBorda: c.corBorda, corTexto: c.corTexto }))} style={{ width: '36px', height: '36px', borderRadius: '50%', background: c.corTexto, border: form.corTexto === c.corTexto ? '3px solid #fff' : '3px solid transparent', cursor: 'pointer', boxShadow: form.corTexto === c.corTexto ? '0 0 0 2px var(--accent-color)' : 'none', transition: 'all 0.15s' }} title={c.label} />
                  ))}
                </div>
              </div>

              <button onClick={salvarForm} style={{ width: '100%', padding: '12px', background: 'var(--accent-color)', border: 'none', borderRadius: 'var(--radius-md)', color: 'var(--bg-color)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="ph ph-floppy-disk"></i> Salvar Grupo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Mural de Fotos ──────────────────────────────────────── */
const MURAL_MAX = 10;

function ModalMuralAdmin({ onClose, onSaved }) {
  const [lista, setLista] = useState(loadMural);
  const [tela, setTela] = useState('lista'); // lista | form
  const [editando, setEditando] = useState(null);
  const inputSt = { width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '10px 12px', fontSize: '0.9rem', boxSizing: 'border-box' };

  const FORM_EMPTY = { id: '', foto: null, legenda: '' };
  const [form, setForm] = useState(FORM_EMPTY);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const abrirNovo = () => { setForm(FORM_EMPTY); setEditando(null); setTela('form'); };
  const abrirEditar = (m) => { setForm({ ...m }); setEditando(m.id); setTela('form'); };

  const handleFotoUpload = (e) => {
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
        const url = await uploadFotoToStorage(compressed, 'mural');
        set('foto', url);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const salvarForm = () => {
    if (!form.foto) return;
    const item = { ...form, id: editando || String(Date.now()) };
    const novaLista = editando ? lista.map(m => m.id === editando ? item : m) : [...lista, item];
    setLista(novaLista);
    saveMural(novaLista);
    onSaved();
    setTela('lista');
  };

  const excluir = (id) => {
    if (!confirm('Excluir esta foto do mural?')) return;
    const novaLista = lista.filter(m => m.id !== id);
    setLista(novaLista);
    saveMural(novaLista);
    onSaved();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'var(--bg-color)', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {tela === 'form' && (
            <button onClick={() => setTela('lista')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <i className="ph ph-arrow-left" style={{ fontSize: '1.2rem' }}></i>
            </button>
          )}
          <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', flex: 1 }}>
            {tela === 'lista' ? 'Mural de Fotos' : editando ? 'Editar Foto' : 'Nova Foto'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph ph-x" style={{ fontSize: '1.2rem' }}></i>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {tela === 'lista' ? (
            <>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                Fotos de eventos do ministério (evangelismo, congressos, cultos especiais...) exibidas em carrossel na Home. {lista.length}/{MURAL_MAX} fotos.
              </p>
              {lista.length < MURAL_MAX ? (
                <button onClick={abrirNovo} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.06)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--accent-color)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                  <i className="ph ph-plus-circle"></i> Adicionar Foto
                </button>
              ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                  Limite de {MURAL_MAX} fotos atingido. Exclua uma foto para adicionar outra.
                </p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lista.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ width: '56px', height: '32px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', flexShrink: 0, background: '#111' }}>
                      <img src={m.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.legenda || '(sem legenda)'}</p>
                    </div>
                    <button onClick={() => abrirEditar(m)} style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-pencil" style={{ fontSize: '1rem' }}></i>
                    </button>
                    <button onClick={() => excluir(m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center' }}>
                      <i className="ph ph-trash" style={{ fontSize: '1rem' }}></i>
                    </button>
                  </div>
                ))}
                {lista.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>Nenhuma foto cadastrada ainda.</p>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Foto (proporção 16:9 recomendada, ex: 1200×675px)</label>
                {form.foto && (
                  <div style={{ width: '100%', aspectRatio: '16 / 9', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '10px', border: '1px solid var(--border-color)' }}>
                    <img src={form.foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', background: 'var(--bg-surface)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>
                  <i className="ph ph-upload-simple" style={{ fontSize: '1.2rem' }}></i>
                  {form.foto ? 'Trocar foto' : 'Escolher foto da galeria'}
                  <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} />
                </label>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Legenda</label>
                <input style={inputSt} value={form.legenda} onChange={e => set('legenda', e.target.value)} placeholder="Ex: Evangelismo no Centro de SP" />
              </div>

              <button onClick={salvarForm} disabled={!form.foto} style={{ width: '100%', padding: '12px', background: form.foto ? 'var(--accent-color)' : 'var(--bg-surface-elevated)', border: 'none', borderRadius: 'var(--radius-md)', color: form.foto ? 'var(--bg-color)' : 'var(--text-muted)', fontWeight: 700, fontSize: '0.9rem', cursor: form.foto ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <i className="ph ph-floppy-disk"></i> Salvar Foto
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal Pedidos de Oração ─────────────────────────────────────── */
function ModalPedidosOracao({ onClose, onLido }) {
  const [pedidos, setPedidos] = useState(loadPedidosOracao);

  // Roda só uma vez, ao abrir o modal: marca os pedidos carregados nesse momento
  // como lidos. Não deve repetir a cada re-render, por isso a lista fica vazia.
  useEffect(() => {
    marcarPedidosOracaoComoLidos(pedidos);
    onLido();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExcluir = (id) => {
    const atualizados = pedidos.filter(p => p.id !== id && p.id !== String(id));
    setPedidos(atualizados);
    localStorage.setItem(PEDIDOS_ORACAO_KEY, JSON.stringify(atualizados));
    deletePedidoOracaoFromSupabase(id);
  };

  const handleLimparTodos = () => {
    if (!confirm('Excluir todos os pedidos de oração?')) return;
    setPedidos([]);
    localStorage.setItem(PEDIDOS_ORACAO_KEY, JSON.stringify([]));
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
                      <span className="badge-privado" style={{ fontSize: '0.65rem', border: '1px solid', borderRadius: 'var(--radius-full)', padding: '1px 7px', fontWeight: 600 }}>
                        Privado
                      </span>
                    )}
                  </div>
                  {p.celular && (
                    <a
                      href={`https://wa.me/${formatarWhatsApp(p.celular)}`}
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

function AdminActionTile({ icon, label, badge, badgeColor, activeBorderColor, danger, onClick }) {
  const hasBadge = badge > 0;
  return (
    <button
      onClick={onClick}
      className="event-list-item"
      style={{
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : (hasBadge && activeBorderColor) ? activeBorderColor : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md) var(--spacing-xs)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        background: 'none',
        cursor: 'pointer',
        color: danger ? '#ef4444' : 'var(--text-primary)',
        width: '100%',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {hasBadge && (
        <div style={{
          position: 'absolute', top: '6px', right: '6px',
          background: badgeColor || 'var(--accent-color)', color: badgeColor ? '#fff' : 'var(--bg-color)',
          borderRadius: '50%', minWidth: '20px', height: '20px', padding: '0 4px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '0.72rem',
        }}>
          {badge}
        </div>
      )}
      <i className={`ph ${icon}`} style={{ fontSize: '1.6rem', color: danger ? '#ef4444' : 'var(--accent-color)' }}></i>
      <span style={{ fontSize: '0.72rem', fontWeight: 500, lineHeight: 1.2 }}>{label}</span>
    </button>
  );
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('adminAuth') === 'true'
  );
  const [membros, setMembros] = useState(loadMembros);
  const [cadastros, setCadastros] = useState(loadCadastros);
  const [modalMembros, setModalMembros] = useState(false);
  const [modalCadastros, setModalCadastros] = useState(false);
  const [modalComunicado, setModalComunicado] = useState(false);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalAconselhamento, setModalAconselhamento] = useState(false);
  const [modalEvangelismo, setModalEvangelismo]   = useState(false);
  const [modalITEAP, setModalITEAP]               = useState(false);
const [modalMinisterios, setModalMinisterios]   = useState(false);
  const [modalGrupos, setModalGrupos]             = useState(false);
  const [modalMural, setModalMural]               = useState(false);
  const [modalOracao, setModalOracao]             = useState(false);
  const [aconselhamentos, setAconselhamentos] = useState(loadAconselhamentos);
  const [pedidosOracao, setPedidosOracao] = useState(loadPedidosOracao);
  const [toast, setToast] = useState('');

  const pendentes = cadastros.filter(c => c.status === 'pendente').length;
  // O segundo item (setLidosVersion) força um re-render quando marcarPedidosOracaoComoLidos
  // atualiza o localStorage — o array pedidosOracao em si não muda nesse momento.
  const [, setLidosVersion] = useState(0);
  const pedidosOracaoNovos = contarPedidosOracaoNovos(pedidosOracao);

  useEffect(() => {
    if (!isAuthenticated) return;
    let emAndamento = false;
    const atualizar = () => {
      if (emAndamento) return; // evita empilhar sincronizações se a anterior ainda não terminou
      emAndamento = true;
      let liberado = false;
      const liberar = () => { if (!liberado) { liberado = true; emAndamento = false; } };
      const travaDeSeguranca = setTimeout(liberar, 15000); // nunca trava pra sempre, mesmo se a rede cair no meio
      syncFromSupabase().then(() => {
        setMembros(loadMembros());
        setCadastros(loadCadastros());
        setAconselhamentos(loadAconselhamentos());
        setPedidosOracao(loadPedidosOracao());
      }).finally(() => { clearTimeout(travaDeSeguranca); liberar(); });
    };
    atualizar();
    const intervalId = setInterval(atualizar, 4000);
    return () => clearInterval(intervalId);
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
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)', minHeight: '100vh' }}>
      <Header admin={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <h3 className="section-title" style={{ marginTop: 0 }}>Ações Administrativas</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
          <AdminActionTile icon="ph-user-gear" label="Membros" onClick={() => setModalMembros(true)} />
          <AdminActionTile icon="ph-megaphone" label="Comunicado" onClick={() => setModalComunicado(true)} />
          <AdminActionTile icon="ph-user-plus" label="Cadastros" badge={pendentes} onClick={() => setModalCadastros(true)} />
          <AdminActionTile
            icon="ph-chat-circle-dots"
            label="Aconselhamento"
            badge={aconselhamentos.filter(a => !a.atendido).length}
            badgeColor="#6d28d9"
            activeBorderColor="rgba(109,40,217,0.4)"
            onClick={() => setModalAconselhamento(true)}
          />
          <AdminActionTile icon="ph-gear" label="Configurações" onClick={() => setModalConfig(true)} />
          <AdminActionTile icon="ph-footprints" label="Evangelismo" onClick={() => setModalEvangelismo(true)} />
          <AdminActionTile icon="ph-graduation-cap" label="ITEAP" onClick={() => setModalITEAP(true)} />
          <AdminActionTile icon="ph-hands-praying" label="Oração" badge={pedidosOracaoNovos} onClick={() => setModalOracao(true)} />
          <AdminActionTile icon="ph-users-three" label="Ministérios" onClick={() => setModalMinisterios(true)} />
          <AdminActionTile icon="ph-user-circle-gear" label="Grupos" onClick={() => setModalGrupos(true)} />
          <AdminActionTile icon="ph-images-square" label="Mural" onClick={() => setModalMural(true)} />
          <button
            onClick={() => setModalMembros(true)}
            className="event-list-item"
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md) var(--spacing-xs)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', cursor: 'pointer', color: 'var(--text-primary)', width: '100%', textAlign: 'center' }}
          >
            <i className="ph ph-users" style={{ fontSize: '1.4rem', color: 'var(--accent-color)' }}></i>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{membros.length}</span>
            <span style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Membros</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* QR Code do App */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', background: 'var(--bg-surface-elevated)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
              <i className="ph ph-qr-code" style={{ marginRight: '6px' }}></i>QR Code do App
            </p>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&color=ffffff&bgcolor=0d0d0d&data=${encodeURIComponent(`${window.location.origin}/instalar`)}`}
              alt="QR Code"
              width={160} height={160}
              style={{ borderRadius: '8px', display: 'block', margin: '0 auto 10px' }}
            />
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{window.location.host}</p>
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
          onSent={(pushOk) => setToast(
            pushOk === false ? 'Comunicado publicado, mas a notificação push falhou.' :
            pushOk === true ? 'Comunicado publicado e notificação enviada!' :
            'Comunicado publicado com sucesso!'
          )}
        />
      )}

      {modalConfig && (
        <ModalConfiguracoes
          onClose={() => setModalConfig(false)}
          onSaved={() => setToast('Configurações salvas! Volte à Home para ver as mudanças.')}
        />
      )}


      {modalAconselhamento && (
        <ModalAconselhamento onClose={() => setModalAconselhamento(false)} pedidos={aconselhamentos} setPedidos={setAconselhamentos} />
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
          onSaved={() => setToast('ITEAP atualizado com sucesso!')}
        />
      )}

{modalMinisterios && (
        <ModalMinisteriosAdmin
          onClose={() => setModalMinisterios(false)}
          onSaved={() => setToast('Ministérios salvos com sucesso!')}
          membros={membros}
        />
      )}

      {modalGrupos && (
        <ModalGruposAdmin
          onClose={() => setModalGrupos(false)}
          onSaved={() => setToast('Grupos salvos com sucesso!')}
        />
      )}

      {modalMural && (
        <ModalMuralAdmin
          onClose={() => setModalMural(false)}
          onSaved={() => setToast('Mural de fotos salvo com sucesso!')}
        />
      )}

      {modalOracao && <ModalPedidosOracao onClose={() => setModalOracao(false)} onLido={() => setLidosVersion(v => v + 1)} />}

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} duration={4000} />}
    </div>
  );
}
