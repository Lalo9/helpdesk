# 🎫 Helpdesk — Sistema de Chamados

> API REST para abertura e acompanhamento de chamados de suporte, com login, perfis de acesso e conversa dentro de cada chamado.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

Clientes abrem chamados e acompanham a conversa; atendentes assumem, respondem e encerram. A autenticação usa tokens JWT, as senhas são guardadas com hash (scrypt) e o banco é criado por migrations em SQL.

---

## 📦 Estrutura do Projeto

```
helpdesk/
├── docker-compose.yml              ← PostgreSQL em container
├── README.md
└── api/
    ├── .env.example                ← Modelo das variáveis de ambiente
    ├── package.json
    ├── tsconfig.json
    ├── migrations/
    │   └── 001_criar_tabelas.sql   ← Tabelas, índices e categorias iniciais
    └── src/
        ├── server.ts               ← Entrada da API
        ├── config.ts               ← Leitura e validação das variáveis de ambiente
        ├── db.ts                   ← Conexão com o banco e transações
        ├── migrate.ts              ← Executor das migrations
        ├── senha.ts                ← Hash e conferência de senhas (scrypt)
        ├── middlewares/
        │   ├── autenticacao.ts     ← Valida o token JWT
        │   └── perfil.ts           ← Restringe rotas por perfil
        └── rotas/
            ├── auth.ts             ← Registro, login e /eu
            ├── categorias.ts       ← Lista de categorias
            └── chamados.ts         ← Chamados e comentários
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 22 ou superior
- [Docker](https://www.docker.com/) com o Docker Compose

### 1. Clone o repositório

```
git clone https://github.com/Lalo9/helpdesk.git
cd helpdesk
```

### 2. Suba o banco de dados

```
docker compose up -d
```

> 💡 O PostgreSQL fica disponível na porta **5433** do seu computador (usuário, senha e banco: `helpdesk` / `helpdesk123` / `helpdesk`, apenas para desenvolvimento).

### 3. Configure e instale a API

```
cd api
npm install
cp .env.example .env
```

Abra o arquivo `.env` e troque o valor de `JWT_SECRET` por um segredo próprio. Para gerar um:

```
openssl rand -hex 32
```

### 4. Crie as tabelas e inicie

```
npm run migrate
npm run dev
```

Quando aparecer `API rodando em http://localhost:3000`, teste em outro terminal:

```
curl http://localhost:3000/status
```

---

## 🔌 Endpoints

| Método | Rota                          | Quem acessa   | Descrição                                   |
|--------|-------------------------------|---------------|---------------------------------------------|
| GET    | `/status`                     | público       | Verifica a API e a conexão com o banco      |
| POST   | `/auth/registro`              | público       | Cria uma conta de cliente                   |
| POST   | `/auth/login`                 | público       | Devolve o token JWT                         |
| GET    | `/auth/eu`                    | logado        | Dados do usuário logado                     |
| GET    | `/categorias`                 | logado        | Lista as categorias                         |
| POST   | `/chamados`                   | cliente       | Abre um chamado                             |
| GET    | `/chamados`                   | logado        | Lista (filtros: `status`, `prioridade`, `categoriaId`, `pagina`, `limite`) |
| GET    | `/chamados/:id`               | logado        | Detalhes de um chamado                      |
| POST   | `/chamados/:id/assumir`       | atendente     | Assume o chamado                            |
| PATCH  | `/chamados/:id`               | atendente     | Altera status e/ou prioridade               |
| GET    | `/chamados/:id/comentarios`   | logado        | Lista a conversa do chamado                 |
| POST   | `/chamados/:id/comentarios`   | logado        | Adiciona um comentário                      |

As rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

---

## 📋 Regras de Negócio

| Regra                                                                  | Resposta quando violada |
|------------------------------------------------------------------------|-------------------------|
| Cliente só enxerga e comenta nos **próprios** chamados                 | 404                     |
| Só **cliente** abre chamados; só **atendente** assume e altera status  | 403                     |
| Um chamado só pode ser assumido por **um** atendente                   | 409                     |
| Chamado **fechado** não pode ser alterado nem receber comentários      | 409                     |
| Cliente comenta em chamado **resolvido** → ele volta para `em_andamento` | —                     |
| Contas criadas pelo registro são sempre de **cliente**                 | —                       |

---

## 🗄️ Banco de Dados

| Tabela        | Descrição                                                         |
|---------------|-------------------------------------------------------------------|
| `usuarios`    | Clientes e atendentes (e-mail único, senha com hash, perfil)      |
| `categorias`  | Tipos de chamado (Suporte técnico, Financeiro, Dúvida, Sugestão)  |
| `chamados`    | Título, descrição, status, prioridade, cliente e atendente        |
| `comentarios` | Mensagens de cada chamado, com o autor                            |

### Criar um atendente (ambiente de teste)

Todo cadastro vira cliente. Para promover uma conta a atendente:

```
docker exec -it helpdesk-postgres psql -U helpdesk -d helpdesk \
  -c "UPDATE usuarios SET perfil = 'atendente' WHERE email = 'atendente@teste.com';"
```

> O perfil vai dentro do token, então é preciso fazer login de novo depois da promoção.

---

## 🏗️ Arquitetura do Sistema

```
┌────────────┐   JSON/HTTP   ┌──────────────────────────────┐    SQL    ┌────────────┐
│  Cliente   │──────────────▶│  API Express (TypeScript)    │──────────▶│ PostgreSQL │
│ (web/app)  │◀──────────────│  JWT → perfil → regras       │◀──────────│  (Docker)  │
└────────────┘               └──────────────────────────────┘           └────────────┘
```

> **Status:** a API está completa. Em desenvolvimento: front-end em React e aplicativo de celular consumindo esta mesma API.