-- =============================================
-- BANCO DE DADOS - SISTEMA DE RESERVAS
-- ATENÇÃO: senhas estão em bcrypt hash (rounds=10)
-- Senha original de cada usuário está nos comentários
-- =============================================

DROP TABLE IF EXISTS notificacoes CASCADE;
DROP TABLE IF EXISTS fila_espera CASCADE;
DROP TABLE IF EXISTS reservas CASCADE;
DROP TABLE IF EXISTS salas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
  id_usuario   SERIAL PRIMARY KEY,
  nome         VARCHAR(150) NOT NULL,
  cpf          VARCHAR(11)  NOT NULL UNIQUE,  -- apenas dígitos, limpeza feita no backend
  email        VARCHAR(120) NOT NULL UNIQUE,
  senha        VARCHAR(60)  NOT NULL,          -- bcrypt hash sempre tem 60 chars
  tipo_usuario VARCHAR(20)  DEFAULT 'USUARIO',
  CHECK (tipo_usuario IN ('USUARIO', 'ADMINISTRADOR'))
);

CREATE TABLE salas (
  id_sala     SERIAL PRIMARY KEY,
  nome        VARCHAR(80)  NOT NULL,
  localizacao VARCHAR(150) NOT NULL,
  capacidade  INTEGER      NOT NULL
);

CREATE TABLE reservas (
  id_reserva   SERIAL PRIMARY KEY,
  id_usuario   INTEGER   NOT NULL,
  id_sala      INTEGER   NOT NULL,
  data_reserva DATE      NOT NULL,
  hora_inicio  TIME      NOT NULL,
  hora_fim     TIME      NOT NULL,
  status       VARCHAR(20) DEFAULT 'CONFIRMADA',
  data_criacao TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_sala)    REFERENCES salas(id_sala),
  CHECK (hora_fim > hora_inicio),
  CHECK (status IN ('CONFIRMADA', 'CANCELADA'))
);

CREATE TABLE fila_espera (
  id_fila              SERIAL PRIMARY KEY,
  id_usuario           INTEGER NOT NULL,
  id_sala              INTEGER NOT NULL,
  data_desejada        DATE    NOT NULL,
  hora_inicio_desejada TIME    NOT NULL,
  hora_fim_desejada    TIME    NOT NULL,
  status               VARCHAR(20) DEFAULT 'AGUARDANDO',
  data_registro        TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_sala)    REFERENCES salas(id_sala),
  CHECK (hora_fim_desejada > hora_inicio_desejada),
  CHECK (status IN ('AGUARDANDO', 'NOTIFICADO', 'CANCELADO'))
);

CREATE TABLE notificacoes (
  id_notificacao  SERIAL PRIMARY KEY,
  id_usuario      INTEGER NOT NULL,
  id_reserva      INTEGER,
  id_fila         INTEGER,
  destinatario_email VARCHAR(120) NOT NULL,
  assunto_email   VARCHAR(150) NOT NULL,
  mensagem_email  TEXT        NOT NULL,
  status_envio    VARCHAR(20) DEFAULT 'PENDENTE',
  data_registro   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_usuario)  REFERENCES usuarios(id_usuario),
  FOREIGN KEY (id_reserva)  REFERENCES reservas(id_reserva),
  FOREIGN KEY (id_fila)     REFERENCES fila_espera(id_fila),
  CHECK (status_envio IN ('PENDENTE', 'ENVIADO', 'ERRO'))
);

-- =============================================
-- DADOS INICIAIS
-- Senhas em bcrypt hash (rounds=10)
-- Para gerar novos hashes: node -e "const b=require('bcrypt'); b.hash('123456',10).then(console.log)"
--
-- paulo@email.com     → senha: 123456
-- ana@email.com       → senha: 654321
-- victor@email.com    → senha: 111222
-- guilherme@email.com → senha: 112358
-- =============================================

INSERT INTO usuarios (nome, cpf, email, senha, tipo_usuario) VALUES
(
  'Paulo Junior',
  '00000000000',
  'paulo@email.com',
  '$2b$10$bUoadFydrjLPsrT/JkFe2O.VajDERweySq9vL3.YKcFYXtCsEWQc2',
  'ADMINISTRADOR'
),
(
  'Ana Santos',
  '11111111111',
  'ana@email.com',
  '$2b$10$toSbsk2VByEKWOBCsEM8.O1jgOmKqT7oV2BVeoAG/wf5Vi3a1wXLW',
  'USUARIO'
),
(
  'Victor Pereira',
  '22222222222',
  'victor@email.com',
  '$2b$10$r/cNURRD/9KlM89F7LGRne224GXPwXSXiEXPx6spPQDnKTYBtQbQK',
  'USUARIO'
),
(
  'Guilherme Oliveira',
  '14867590880',
  'guilhermeoliveiraifrn@email.com',
  '$2b$10$cX9x9yl68Ng4jZ4ll3zt7ukf1CIOBlLZgxoFmixnqH4qdFu75YR2O',
  'USUARIO'
);

INSERT INTO salas (nome, localizacao, capacidade) VALUES
('Sala Outorga', 'Diretoria de Licenciamento e Outorga', 20),
('Sala NGI',     'Núcleo de Inteligência Geográfica e da Informação', 15);

INSERT INTO reservas (id_usuario, id_sala, data_reserva, hora_inicio, hora_fim, status) VALUES
(2, 1, '2026-04-25', '09:00', '10:00', 'CONFIRMADA'),
(3, 2, '2026-04-25', '10:00', '11:00', 'CONFIRMADA');

INSERT INTO fila_espera (id_usuario, id_sala, data_desejada, hora_inicio_desejada, hora_fim_desejada) VALUES
(1, 1, '2026-04-25', '09:00', '10:00');

INSERT INTO notificacoes (id_usuario, id_reserva, destinatario_email, assunto_email, mensagem_email, status_envio) VALUES
(2, 1, 'ana@email.com', 'Reserva confirmada', 'Sua reserva da Sala Outorga foi confirmada.', 'ENVIADO');

-- Verificação
SELECT 'USUÁRIOS'     AS tabela, COUNT(*) AS total FROM usuarios
UNION ALL
SELECT 'SALAS',        COUNT(*) FROM salas
UNION ALL
SELECT 'RESERVAS',     COUNT(*) FROM reservas
UNION ALL
SELECT 'FILA',         COUNT(*) FROM fila_espera
UNION ALL
SELECT 'NOTIFICAÇÕES', COUNT(*) FROM notificacoes;