// backend/tests/setup-banco.js
// Script para criar as tabelas e dados de teste no CI

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setup() {
  console.log('Criando tabelas...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id_usuario SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      cpf VARCHAR(11) NOT NULL UNIQUE,
      email VARCHAR(120) NOT NULL UNIQUE,
      senha VARCHAR(60) NOT NULL,
      tipo_usuario VARCHAR(20) DEFAULT 'USUARIO',
      CHECK (tipo_usuario IN ('USUARIO', 'ADMINISTRADOR'))
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS salas (
      id_sala SERIAL PRIMARY KEY,
      nome VARCHAR(80) NOT NULL,
      localizacao VARCHAR(150) NOT NULL,
      capacidade INTEGER NOT NULL
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
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
  `);

  await pool.query(`
    INSERT INTO usuarios (nome, cpf, email, senha, tipo_usuario) VALUES
    ('Guilherme Oliveira', '14867590880', 'guilhermeoliveiraifrn@email.com', '$2b$10$cX9x9yl68Ng4jZ4ll3zt7ukf1CIOBlLZgxoFmixnqH4qdFu75YR2O', 'USUARIO'),
    ('Paulo Junior', '00000000000', 'paulo@email.com', '$2b$10$bUoadFydrjLPsrT/JkFe2O.VajDERweySq9vL3.YKcFYXtCsEWQc2', 'ADMINISTRADOR')
    ON CONFLICT DO NOTHING;
  `);

  await pool.query(`
    INSERT INTO salas (nome, localizacao, capacidade) VALUES
    ('Sala Outorga', 'Diretoria de Licenciamento e Outorga', 20),
    ('Sala NGI', 'Nucleo de Inteligencia Geografica', 15)
    ON CONFLICT DO NOTHING;
  `);

  console.log('Banco de teste configurado com sucesso!');
  await pool.end();
}

setup().catch(err => {
  console.error('Erro ao configurar banco:', err.message);
  process.exit(1);
});