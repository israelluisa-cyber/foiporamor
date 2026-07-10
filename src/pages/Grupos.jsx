import Header from '../components/Header';
import { loadGrupos } from '../data/gruposData';
import { loadConfig } from '../data/config';

function GrupoCard({ grupo }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 16px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      marginBottom: '8px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: grupo.cor, border: `1px solid ${grupo.corBorda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`ph ${grupo.icone}`} style={{ fontSize: '1.3rem', color: grupo.corTexto }}></i>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 2px' }}>
          {grupo.nome}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          {grupo.descricao}
        </p>
      </div>
    </div>
  );
}

export default function Grupos() {
  const config = loadConfig();
  const grupos = loadGrupos();
  const principais = grupos.filter(g => g.categoria === 'principal');
  const abertos = grupos.filter(g => g.categoria === 'aberto');

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Grupos & Ministérios" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
          Conheça os grupos e ministérios que fazem parte da família {config.nomeCurto}.
        </p>

        {principais.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 0 }}>Grupos da Igreja</h3>
            {principais.map(g => <GrupoCard key={g.id} grupo={g} />)}
          </>
        )}

        {abertos.length > 0 && (
          <>
            <h3 className="section-title" style={{ marginTop: 'var(--spacing-lg)' }}>Ministérios</h3>
            {abertos.map(g => <GrupoCard key={g.id} grupo={g} />)}
          </>
        )}
      </main>
    </div>
  );
}
