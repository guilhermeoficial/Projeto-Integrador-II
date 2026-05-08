CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    senha VARCHAR(6) NOT NULL,
    tipo_usuario VARCHAR(20) DEFAULT 'USUARIO',
    CHECK (senha ~ '^[0-9]{6}$'),
    CHECK (tipo_usuario IN ('USUARIO', 'ADMINISTRADOR'))
);

CREATE TABLE salas (
    id_sala SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    localizacao VARCHAR(150) NOT NULL,
    capacidade INTEGER NOT NULL
);

CREATE TABLE reservas (
    id_reserva SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_sala INTEGER NOT NULL,
    data_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMADA',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala),

    CHECK (hora_fim > hora_inicio),
    CHECK (status IN ('CONFIRMADA', 'CANCELADA'))
);

CREATE TABLE fila_espera (
    id_fila SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_sala INTEGER NOT NULL,
    data_desejada DATE NOT NULL,
    hora_inicio_desejada TIME NOT NULL,
    hora_fim_desejada TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'AGUARDANDO',
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_sala) REFERENCES salas(id_sala),

    CHECK (hora_fim_desejada > hora_inicio_desejada),
    CHECK (status IN ('AGUARDANDO', 'NOTIFICADO', 'CANCELADO'))
);

CREATE TABLE notificacoes (
    id_notificacao SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    id_reserva INTEGER,
    id_fila INTEGER,
    destinatario_email VARCHAR(120) NOT NULL,
    assunto_email VARCHAR(150) NOT NULL,
    mensagem_email TEXT NOT NULL,
    status_envio VARCHAR(20) DEFAULT 'PENDENTE',
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_reserva) REFERENCES reservas(id_reserva),
    FOREIGN KEY (id_fila) REFERENCES fila_espera(id_fila),

    CHECK (status_envio IN ('PENDENTE', 'ENVIADO', 'ERRO'))
);

INSERT INTO usuarios (nome, cpf, email, senha, tipo_usuario) VALUES
('Paulo Junior', '000.000.000-00', 'paulo@email.com', '123456', 'ADMINISTRADOR'),
('Ana Santos', '111.111.111-11', 'ana@email.com', '654321', 'USUARIO'),
('Victor Pereira', '222.222.222-22', 'victor@email.com', '111222', 'USUARIO');

INSERT INTO salas (nome, localizacao, capacidade) VALUES
('Sala Outorga', 'Diretoria de Licenciamento e Outorga', 20),
('Sala NGI', 'Núcleo de Inteligência Geográfica e da Informação', 15);

INSERT INTO reservas (id_usuario, id_sala, data_reserva, hora_inicio, hora_fim, status) VALUES
(2, 1, '2026-04-25', '09:00', '10:00', 'CONFIRMADA'),
(3, 2, '2026-04-25', '10:00', '11:00', 'CONFIRMADA');

INSERT INTO fila_espera (id_usuario, id_sala, data_desejada, hora_inicio_desejada, hora_fim_desejada) VALUES
(1, 1, '2026-04-25', '09:00', '10:00');

INSERT INTO notificacoes 
(id_usuario, id_reserva, destinatario_email, assunto_email, mensagem_email, status_envio) VALUES
(2, 1, 'ana@email.com', 'Reserva confirmada', 'Sua reserva da Sala Outorga foi confirmada.', 'ENVIADO');

SELECT 
    r.id_reserva,
    u.nome AS usuario,
    s.nome AS sala,
    s.localizacao,
    r.data_reserva,
    r.hora_inicio,
    r.hora_fim,
    r.status
FROM reservas r
JOIN usuarios u ON r.id_usuario = u.id_usuario
JOIN salas s ON r.id_sala = s.id_sala;