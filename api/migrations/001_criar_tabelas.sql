CREATE TABLE usuarios (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    senha_hash  VARCHAR(255) NOT NULL,
    perfil      VARCHAR(20)  NOT NULL DEFAULT 'cliente'
                CHECK (perfil IN ('cliente', 'atendente')),
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias (
    id    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome  VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE chamados (
    id             INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo         VARCHAR(150) NOT NULL,
    descricao      TEXT NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'aberto'
                   CHECK (status IN ('aberto', 'em_andamento', 'resolvido', 'fechado')),
    prioridade     VARCHAR(20) NOT NULL DEFAULT 'media'
                   CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    categoria_id   INTEGER NOT NULL REFERENCES categorias(id),
    cliente_id     INTEGER NOT NULL REFERENCES usuarios(id),
    atendente_id   INTEGER REFERENCES usuarios(id),
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comentarios (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    chamado_id  INTEGER NOT NULL REFERENCES chamados(id) ON DELETE CASCADE,
    autor_id    INTEGER NOT NULL REFERENCES usuarios(id),
    texto       TEXT NOT NULL,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chamados_cliente    ON chamados(cliente_id);
CREATE INDEX idx_chamados_atendente  ON chamados(atendente_id);
CREATE INDEX idx_chamados_status     ON chamados(status);
CREATE INDEX idx_comentarios_chamado ON comentarios(chamado_id);

INSERT INTO categorias (nome) VALUES
    ('Suporte técnico'),
    ('Financeiro'),
    ('Dúvida'),
    ('Sugestão');