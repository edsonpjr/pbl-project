# 🧠 PBLLearn — Plataforma de Ensino Problem Based Learning

> Plataforma de ensino interativa com filosofia **PBL (Problem Based Learning)**, similar ao Brilliant e CoddyTech. Backend em **C++**, frontend em **React/TypeScript**, banco de dados **SQLite** com persistência via Docker volume.

---

## ⚡ Início Rápido — GitHub Codespaces (Recomendado)

### Passo 1 — Abrir no Codespaces

1. Acesse o repositório no GitHub
2. Clique em **`< > Code`** → aba **`Codespaces`** → **`Create codespace on main`**
3. Recomendado: selecione máquina **4-core** para compilar mais rápido
4. Aguarde o ambiente iniciar (~2 minutos na primeira vez)

> O Codespaces detecta o `.devcontainer/` e instala todas as dependências automaticamente.

---

### Passo 2 — Escolha como rodar

Você tem **duas opções** dentro do Codespace:

---

#### Opção A — Docker Compose (produção-like, recomendada)

```bash
docker compose up --build -d
```

Aguarde o build (~3–5 min na primeira vez). Quando terminar:

```bash
docker compose ps
# Deve mostrar pbl_backend e pbl_frontend como "healthy" / "running"
```

**Acessar o frontend:**
- Na aba **`Ports`** do VSCode (painel inferior), localize a **porta 3000**
- Clique no 🌐 ícone de globo — o browser abrirá com a URL do Codespace

**Acessar o backend diretamente:**
- Na aba **`Ports`**, localize a **porta 8080**
- Clique no globo para ver o health check: `{"status":"ok"}`

> ⚠️ **Importante:** Após abrir pela primeira vez, se a tela aparecer em branco, aguarde 10s e recarregue. O nginx pode levar alguns segundos para servir os assets.

---

#### Opção B — Modo Dev (sem Docker, mais rápido para desenvolver)

```bash
bash .devcontainer/run-dev.sh
```

Isso sobe:
- Backend C++ na porta **8080**
- Frontend Vite (hot reload) na porta **5173**

**Acessar:**
- Aba **`Ports`** → porta **5173** → clique no globo

> ✅ No modo dev, edições no frontend são refletidas automaticamente (hot reload). Para o backend, é necessário recompilar manualmente.

---

### Passo 3 — Fazer login

Acesse a plataforma pela URL do Codespace e use as credenciais de demo:

| Role | Email | Senha |
|---|---|---|
| 👨‍🏫 Professor | `professor@pbl.com` | `professor123` |
| 🎓 Aluno | `aluno@pbl.com` | `aluno123` |

> As contas são criadas automaticamente na primeira execução (seed automático).

---

## 🔧 Comandos úteis no Codespace

```bash
# Ver logs em tempo real
docker compose logs -f

# Ver apenas logs do backend
docker compose logs -f backend

# Parar tudo (dados preservados)
docker compose down

# Parar e apagar banco (reset completo)
docker compose down -v

# Recompilar apenas o backend (sem Docker)
cd backend
gcc -std=c99 -O2 -DSQLITE_THREADSAFE=1 -c third_party/sqlite3.c -o third_party/sqlite3.o
g++ -std=c++17 -O2 -Wall -I./third_party -I./src \
    src/main.cpp third_party/sqlite3.o \
    -lpthread -lcrypto -lssl \
    -o pbl-backend

# Testar a API diretamente
curl http://localhost:8080/api/health
```

---

## 🖥️ Rodar Localmente (sem Codespaces)

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) >= 24.0
- [Docker Compose](https://docs.docker.com/compose/) >= 2.0

```bash
git clone <url-do-repo>
cd pbl-platform

# (Opcional) configurar JWT_SECRET
cp .env.example .env
# edite .env se quiser trocar o JWT_SECRET

docker compose up --build
```

Acesse: **http://localhost:3000**

---

## 🗂️ Estrutura do Projeto

```
pbl-platform/
├── .devcontainer/
│   ├── devcontainer.json   ← Configuração do GitHub Codespaces
│   ├── setup.sh            ← Instalação automática de dependências
│   └── run-dev.sh          ← Rodar backend+frontend sem Docker
│
├── docker-compose.yml      ← Orquestração: backend (8080) + frontend (3000)
├── .env.example            ← Template de variáveis de ambiente
├── README.md
│
├── backend/                ← C++17, cpp-httplib, SQLite, OpenSSL
│   ├── Dockerfile
│   ├── src/
│   │   ├── main.cpp               ← Entry point + rotas + seed de dados
│   │   ├── db/Database.hpp        ← RAII SQLite wrapper + schema
│   │   ├── models/                ← User, Module, Topic, Exercise, Progress, Submission
│   │   ├── repositories/          ← IRepository<T> + 5 implementações SQLite
│   │   ├── controllers/           ← Auth, User, Module, Topic, Exercise, Submission
│   │   ├── middleware/            ← JWT Bearer (requireAuth / requireProfessor)
│   │   └── utils/                 ← JwtUtil (HS256), PasswordUtil (SHA-256+salt), ResponseHelper
│   └── third_party/
│       ├── sqlite3.h / sqlite3.c  ← SQLite amalgamation (sem dependência externa)
│       ├── httplib.h              ← cpp-httplib (header-only)
│       └── json.hpp               ← nlohmann/json (header-only)
│
└── frontend/               ← React 18 + TypeScript + Vite
    ├── Dockerfile
    ├── src/
    │   ├── main.tsx               ← Entry point
    │   ├── App.tsx                ← Rotas + guards por role
    │   ├── api/index.ts           ← Axios + detecção automática de URL (Codespaces)
    │   ├── store/authStore.ts     ← Zustand (auth persistido no localStorage)
    │   ├── types/index.ts         ← Tipos TypeScript
    │   ├── styles/global.css      ← Design tokens GitHub light/dark
    │   ├── components/
    │   │   ├── ui/                ← Button, Input, Card, Badge, Modal, ProgressBar...
    │   │   └── layout/Navbar.tsx  ← Nav + dark mode toggle + menu do usuário
    │   └── pages/
    │       ├── auth/              ← Login, Register
    │       ├── student/           ← LearnPage, TopicPage (teoria+exercícios), Ranking, Progresso
    │       └── professor/         ← CRUD módulos, tópicos, exercícios, usuários
    └── package.json
```

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub Codespaces                           │
│                                                                   │
│  ┌──────────────────┐   HTTPS proxy    ┌───────────────────┐    │
│  │  React Frontend  │  ─────────────►  │   C++ Backend     │    │
│  │  (porta 3000)    │  (nginx interno) │   (porta 8080)    │    │
│  │                  │                  │                    │    │
│  │  - Vite build    │                  │  - cpp-httplib    │    │
│  │  - Zustand auth  │                  │  - JWT HS256      │    │
│  │  - KaTeX LaTeX   │                  │  - SHA-256+salt   │    │
│  └──────────────────┘                  └────────┬──────────┘    │
│                                                  │               │
│                                        ┌─────────▼──────────┐   │
│                                        │  SQLite (.db)       │   │
│                                        │  Docker Volume      │   │
│                                        │  (persistente)      │   │
│                                        └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📡 API Reference

Todas as rotas retornam JSON no formato:
```json
{ "success": true, "message": "...", "data": { ... } }
```

### Autenticação

| Método | Rota | Auth | Body |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{name, email, password, role}` |
| POST | `/api/auth/login` | — | `{email, password}` |
| GET | `/api/auth/me` | ✅ | — |

### Usuários

| Método | Rota | Auth |
|---|---|---|
| GET | `/api/users` | professor |
| GET | `/api/users/ranking` | — |
| GET | `/api/users/:id` | ✅ |
| PUT | `/api/users/:id` | ✅ |
| DELETE | `/api/users/:id` | professor |

### Módulos / Tópicos / Exercícios

| Método | Rota | Auth |
|---|---|---|
| GET/POST | `/api/modules` | ✅ |
| GET/PUT/DELETE | `/api/modules/:id` | ✅ |
| GET/POST | `/api/modules/:id/topics` | ✅ |
| GET/PUT/DELETE | `/api/topics/:id` | ✅ |
| GET/POST | `/api/topics/:id/exercises` | ✅ |
| GET/PUT/DELETE | `/api/exercises/:id` | ✅ |
| POST | `/api/exercises/:id/submit` | aluno |

### Progresso

| Método | Rota | Auth |
|---|---|---|
| GET | `/api/progress/me` | ✅ |
| GET | `/api/progress/me/:topicId` | ✅ |
| GET | `/api/submissions/me` | ✅ |

---

## 🎮 Conteúdo Inicial (seed automático)

Na primeira execução, o banco é populado com:

**Módulo: Cálculo 1**

| Tópico | Tipo dos exercícios | Exercícios |
|---|---|---|
| Limites | MC + Numérico | 4 |
| Derivadas | MC + Numérico | 3 |

**Tipos de exercício:**
- **Múltipla escolha (MC)** — 4 alternativas (A/B/C/D)
- **Input numérico** — resposta numérica com tolerância (ex: ±0.001)

**Teoria:** renderizada com Markdown + fórmulas LaTeX (ex: `$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$`)

---

## 🧩 Design Orientado a Objetos

### Padrões aplicados

| Padrão | Onde |
|---|---|
| **Repository Pattern** | `IRepository<T>` → 5 repositórios SQLite |
| **RAII** | `Database` — abre no construtor, fecha no destrutor |
| **Template Method** | `IRepository<T, ID>` parametrizado |
| **Strategy** | `Exercise::checkAnswer()` — lógica por tipo |
| **Dependency Injection** | Controllers recebem repositórios por referência |
| **Middleware Chain** | `AuthMiddleware::requireAuth / requireProfessor` |

### Namespaces C++

```
pbl::models        → User, Module, Topic, Exercise, Progress, Submission
pbl::repositories  → IRepository<T>, UserRepository, ModuleRepository...
pbl::controllers   → AuthController, ModuleController, ExerciseController...
pbl::middleware    → AuthMiddleware, AuthClaims
pbl::utils         → JwtUtil, PasswordUtil, ResponseHelper
pbl::db            → Database
```

---

## 🚀 Como Expandir

### Adicionar nova disciplina

No frontend (como professor):
1. Criar módulo → Álgebra Linear
2. Criar tópicos com teoria em Markdown/LaTeX
3. Criar exercícios (MC ou numérico)
4. Publicar — alunos já visualizam

### Adicionar novo tipo de exercício

1. `Exercise.hpp` — adicionar valor ao enum `ExerciseType`
2. `Exercise::checkAnswer()` — implementar verificação
3. `TopicPage.tsx` — criar componente de UI para o tipo
4. `ExercisesPage.tsx` — adicionar ao formulário do professor

### Trocar banco de dados

O padrão Repository isola toda lógica SQL. Para migrar para PostgreSQL:
1. Criar `PostgresDatabase` com mesma interface de `Database`
2. Reimplementar os repositórios com `libpq` ou similar
3. Controllers e models permanecem inalterados

---

## 🔐 Segurança

- Senhas com hash **SHA-256 + salt aleatório de 128 bits**
- Tokens **JWT HS256** com expiração de 24h
- Gabarito dos exercícios **nunca enviado** ao aluno (apenas ao professor)
- XP por exercício computado **apenas na primeira resposta correta**
- Todas as rotas protegidas verificam o JWT em cada request

---

## 📦 Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `JWT_SECRET` | `pbl-super-secret-...` | Chave de assinatura JWT — **mude em produção** |
| `PORT` | `8080` | Porta do backend |
| `VITE_API_URL` | `auto` | URL do backend (auto = detecta Codespaces) |

---

## 🛠️ Troubleshooting

### Porta 3000 não aparece na aba Ports

```bash
# Verifique se os containers estão rodando
docker compose ps

# Se o frontend ainda está buildando
docker compose logs frontend
```

### Tela branca no browser

```bash
# Aguarde o frontend terminar o build e recarregue
docker compose logs frontend --tail 20
```

### Backend não responde

```bash
# Checar logs de erro
docker compose logs backend

# Testar diretamente
curl http://localhost:8080/api/health
```

### Erro "connection refused" na API

No Codespaces, o frontend detecta automaticamente a URL do backend. Se algo der errado:

```bash
# Verifique se a porta 8080 está pública na aba Ports
# (clique com botão direito → Port Visibility → Public)
```

### Recompilar do zero

```bash
docker compose down -v
docker compose up --build
```

---

## 📄 Licença

MIT — livre para uso educacional e comercial.
