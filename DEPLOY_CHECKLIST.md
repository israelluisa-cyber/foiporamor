# Checklist — implantar o app para uma nova igreja

A maior parte da identidade da igreja (nome, logo, cor de destaque, endereço, redes sociais,
cultos, obras sociais, PIX, grupos/ministérios, etc.) é configurada depois do deploy, direto
pelo painel **Admin** do app. Só os itens abaixo precisam ser editados no código, porque são
lidos pelo navegador/SO **antes** do app carregar (não dá pra trocar em runtime).

## 1. Banco de dados (Supabase)

1. Criar um novo projeto no Supabase.
2. Rodar o script `supabase/migration.sql` no SQL Editor do projeto novo.
3. Criar o bucket de Storage `fotos` (público) para upload de imagens.
4. Copiar a **Project URL** e a **anon public key**.

## 2. Variáveis de ambiente

No `.env.local` (dev) e nas variáveis de ambiente do Vercel/host (produção):

```
VITE_SUPABASE_URL=<url do novo projeto>
VITE_SUPABASE_ANON_KEY=<anon key do novo projeto>
```

## 3. Arquivos estáticos (editar uma única vez, por deploy)

- `public/logo.jpeg` — logo usada no ícone do app e na tela de splash.
- `public/favicon.svg` — ícone da aba do navegador.
- `index.html`:
  - `<title>` (linha 15)
  - `<meta name="description">` (linha 10) — texto inicial; o app já ajusta isso em runtime
    a partir do nome configurado no Admin, mas o valor no HTML é o que aparece antes do app
    carregar (compartilhamento em redes sociais, por exemplo).
  - `<meta name="apple-mobile-web-app-title">` (linha 14)
- `public/manifest.json` — `name`, `short_name`, `description`, `background_color`,
  `theme_color`, `icons` (troque os dois `src` para o novo `logo.jpeg`/PNG).

## 4. Depois do deploy — configurar pelo Admin

Logar como admin (`/admin`) → **Configurações da Igreja**:

- **Identidade**: nome da igreja, nome curto/sigla, endereço, cidade, link do Maps, YouTube.
- **Visual**: logo do app, cor de destaque, Instagram, Facebook.
- **Imagem**: foto de fundo da Home.
- **Aviso, WhatsApp, Cultos, Obras, PIX, Servir**: conteúdo específico da igreja.

E no dashboard do Admin:
- **Ministérios da Igreja** e **Grupos & Ministérios**: substituir a lista padrão (que vem
  com conteúdo de exemplo) pelos grupos/ministérios reais da nova igreja.
- **ITEAP — Teologia** e **Saídas de Evangelismo**: se a igreja não tiver essas áreas, deixar
  vazio/desativado.

Pronto — a partir daqui, tudo é autoatendimento pelo painel, sem precisar mexer em código.
