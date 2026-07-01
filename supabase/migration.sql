-- ============================================================
-- Igreja Foi Por Amor — Supabase Migration
-- Cole este SQL no SQL Editor do seu projeto Supabase e execute
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- MEMBROS
CREATE TABLE IF NOT EXISTS membros (
  id              TEXT PRIMARY KEY,
  nome            TEXT NOT NULL,
  cargo           TEXT,
  celula          TEXT,
  bairro          TEXT,
  foto            TEXT,
  data_nascimento TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CONTRIBUIÇÕES
CREATE TABLE IF NOT EXISTS contribuicoes (
  id              TEXT PRIMARY KEY,
  tipo            TEXT NOT NULL DEFAULT 'Contribuição Geral',
  valor_num       NUMERIC(10,2),
  valor_formatado TEXT,
  data            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- CADASTROS (solicitações de membresia)
CREATE TABLE IF NOT EXISTS cadastros (
  id              TEXT PRIMARY KEY,
  nome            TEXT NOT NULL,
  email           TEXT,
  celular         TEXT,
  data_nascimento TEXT,
  bairro          TEXT,
  celula          TEXT,
  experiencia     TEXT,
  foto            TEXT,
  status          TEXT DEFAULT 'pendente',
  data_cadastro   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- AVISOS
CREATE TABLE IF NOT EXISTS avisos (
  id         TEXT PRIMARY KEY,
  tipo       TEXT DEFAULT 'info',
  titulo     TEXT,
  texto      TEXT NOT NULL,
  data       TEXT,
  icone      TEXT DEFAULT 'ph-bell',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS DE ORAÇÃO
CREATE TABLE IF NOT EXISTS pedidos_oracao (
  id         TEXT PRIMARY KEY,
  texto      TEXT NOT NULL,
  privado    BOOLEAN DEFAULT FALSE,
  data       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TESTEMUNHOS
CREATE TABLE IF NOT EXISTS testemunhos (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  texto      TEXT NOT NULL,
  data       TEXT,
  amens      INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VISITANTES
CREATE TABLE IF NOT EXISTS visitantes (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  telefone   TEXT,
  como       TEXT,
  data       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHECKIN INFANTIL
CREATE TABLE IF NOT EXISTS checkin_infantil (
  id          TEXT PRIMARY KEY,
  crianca     TEXT NOT NULL,
  turma       TEXT,
  responsavel TEXT,
  telefone    TEXT,
  codigo      TEXT,
  hora        TEXT,
  data        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PEDIDOS DE ACONSELHAMENTO
CREATE TABLE IF NOT EXISTS pedidos_aconselhamento (
  id         TEXT PRIMARY KEY,
  nome       TEXT NOT NULL,
  tipo       TEXT,
  contato    TEXT,
  telefone   TEXT,
  mensagem   TEXT,
  membro     BOOLEAN DEFAULT FALSE,
  atendido   BOOLEAN DEFAULT FALSE,
  data       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------
-- Storage: bucket público para fotos
-- Crie via Dashboard: Storage → New bucket → nome "fotos" → Public
-- OU execute via SQL Editor do Supabase:
-- -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_fotos_select"
  ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "allow_all_fotos_insert"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "allow_all_fotos_delete"
  ON storage.objects FOR DELETE USING (bucket_id = 'fotos');

-- -------------------------------------------------------
-- Row Level Security — acesso público (sem autenticação)
-- -------------------------------------------------------
ALTER TABLE membros                ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribuicoes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cadastros              ENABLE ROW LEVEL SECURITY;
ALTER TABLE avisos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_oracao         ENABLE ROW LEVEL SECURITY;
ALTER TABLE testemunhos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitantes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_infantil       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos_aconselhamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_membros"    ON membros                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_contrib"    ON contribuicoes          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_cadastros"  ON cadastros              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_avisos"     ON avisos                 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_oracao"     ON pedidos_oracao         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_testemu"    ON testemunhos            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_visitantes" ON visitantes             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_checkin"    ON checkin_infantil       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_aconselh"   ON pedidos_aconselhamento FOR ALL USING (true) WITH CHECK (true);
