# The Game Center

Plataforma gamer web que combina **biblioteca pessoal de jogos**, **histórico individual de jornada** e **identidade social com Player Code exclusivo**.

## Funcionalidades Implementadas (Etapas 1 e 2)

- **Identidade & Autenticação (Supabase Auth)**:
  - Landing page, página de cadastro (`/cadastro`) e página de login (`/login`).
  - Sessão persistente, logout seguro e proteção de todas as rotas privadas.
  - Perfil de jogador (`/perfil`) com `@username` único verificado em tempo real e geração automática de **ID/Código Único** (`TGC-XXXX-XXXX`).
- **Sistema Principal de Biblioteca de Jogos (`/biblioteca` e `/biblioteca/[id]`)**:
  - Pesquisa integrada no catálogo base (`catalog_games`) com seleção imediata.
  - Cadastro manual completo sem depender de APIs externas.
  - Suporte a Nome, Capa (URL, upload local comprimido ou capa holográfica automática), Gênero, Plataforma, Status (`Jogando`, `Zerei`, `Quero Jogar`, `Abandonei`), Nota (`0–10`), Horas Jogadas e Data em que Zerou.
  - Validação estritamente técnica (sem filtros ou censura semântica sobre títulos de obras).
  - Isolamento total por usuário via Row Level Security (`FORCE ROW LEVEL SECURITY`) no PostgreSQL/Supabase.
  - Página individual de cada jogo com ficha completa e **Histórico Pessoal Cronológico** automático (`user_game_events`).
- **Dashboard Gamer (`/dashboard`)**:
  - Jogos em andamento (`Jogando`), adicionados recentemente, jogos zerados, estatísticas consolidadas e atalhos para biblioteca, perfil e futuras áreas sociais.

## Scripts

```bash
npm install
npm run dev
npm run build
```
