const pool = require('../config/db');

// Buscar todas as salas
const listarSalas = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM salas ORDER BY nome');
    res.json({ sucesso: true, salas: resultado.rows });
  } catch (erro) {
    console.error('Erro ao listar salas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar horários disponíveis de uma sala em uma data
const buscarHorarios = async (req, res) => {
  try {
    const { id_sala, data } = req.query;

    if (!id_sala || !data) {
      return res.status(400).json({ erro: 'id_sala e data são obrigatórios.' });
    }

    const horariosFixos = [
      { inicio: '08:00', fim: '09:00' },
      { inicio: '09:00', fim: '10:00' },
      { inicio: '10:00', fim: '11:00' },
      { inicio: '11:00', fim: '12:00' },
      { inicio: '13:00', fim: '14:00' },
      { inicio: '14:00', fim: '15:00' },
      { inicio: '15:00', fim: '16:00' },
      { inicio: '16:00', fim: '17:00' },
    ];

    const reservasNoDia = await pool.query(
      `SELECT r.hora_inicio, r.hora_fim, r.id_usuario, u.nome AS nome_usuario, u.email
       FROM reservas r
       JOIN usuarios u ON u.id_usuario = r.id_usuario
       WHERE r.id_sala = $1 AND r.data_reserva = $2 AND r.status = 'CONFIRMADA'`,
      [id_sala, data]
    );

    const resultado = horariosFixos.map((h) => {
      const reserva = reservasNoDia.rows.find(
        (r) =>
          r.hora_inicio.substring(0, 5) === h.inicio &&
          r.hora_fim.substring(0, 5) === h.fim
      );

      return {
        tempo: `${h.inicio} - ${h.fim}`,
        hora_inicio: h.inicio,
        hora_fim: h.fim,
        vago: !reserva,
        minhaReserva: reserva ? reserva.id_usuario === req.usuario.id : false,
        detalhesReserva: reserva
          ? { nome: reserva.nome_usuario, email: reserva.email }
          : null,
      };
    });

    res.json({ sucesso: true, horarios: resultado });
  } catch (erro) {
    console.error('Erro ao buscar horários:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Buscar dias lotados de um mês (todos os 8 horários ocupados)
const buscarOcupacaoMes = async (req, res) => {
  try {
    const { id_sala, mes, ano } = req.query;

    if (!id_sala || !mes || !ano) {
      return res.status(400).json({ erro: 'id_sala, mes e ano são obrigatórios.' });
    }

    const resultado = await pool.query(
      `SELECT data_reserva, COUNT(*) as total
       FROM reservas
       WHERE id_sala = $1
         AND EXTRACT(MONTH FROM data_reserva) = $2
         AND EXTRACT(YEAR FROM data_reserva) = $3
         AND status = 'CONFIRMADA'
       GROUP BY data_reserva
       HAVING COUNT(*) >= 8`,
      [id_sala, mes, ano]
    );

    const diasLotados = resultado.rows.map((r) =>
      new Date(r.data_reserva).getUTCDate()
    );

    res.json({ sucesso: true, diasLotados });
  } catch (erro) {
    console.error('Erro ao buscar ocupação:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Criar reserva
const criarReserva = async (req, res) => {
  try {
    const { id_sala, data_reserva, hora_inicio, hora_fim } = req.body;
    const id_usuario = req.usuario.id;

    if (!id_sala || !data_reserva || !hora_inicio || !hora_fim) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    // Verifica se o horário já está ocupado
    const conflito = await pool.query(
      `SELECT id_reserva FROM reservas
       WHERE id_sala = $1 AND data_reserva = $2
         AND hora_inicio = $3 AND hora_fim = $4
         AND status = 'CONFIRMADA'`,
      [id_sala, data_reserva, hora_inicio, hora_fim]
    );

    if (conflito.rows.length > 0) {
      return res.status(409).json({ sucesso: false, erro: 'Horário já reservado.' });
    }

    const resultado = await pool.query(
      `INSERT INTO reservas (id_usuario, id_sala, data_reserva, hora_inicio, hora_fim, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMADA') RETURNING *`,
      [id_usuario, id_sala, data_reserva, hora_inicio, hora_fim]
    );

    res.status(201).json({ sucesso: true, reserva: resultado.rows[0] });
  } catch (erro) {
    console.error('Erro ao criar reserva:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Cancelar reserva
const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.usuario.id;
    const tipo = req.usuario.tipo;

    // Busca a reserva
    const reserva = await pool.query(
      'SELECT * FROM reservas WHERE id_reserva = $1',
      [id]
    );

    if (reserva.rows.length === 0) {
      return res.status(404).json({ erro: 'Reserva não encontrada.' });
    }

    // Só o dono ou admin pode cancelar
    if (reserva.rows[0].id_usuario !== id_usuario && tipo !== 'ADMINISTRADOR') {
      return res.status(403).json({ erro: 'Sem permissão para cancelar esta reserva.' });
    }

    await pool.query(
      `UPDATE reservas SET status = 'CANCELADA' WHERE id_reserva = $1`,
      [id]
    );

    res.json({ sucesso: true, mensagem: 'Reserva cancelada com sucesso.' });
  } catch (erro) {
    console.error('Erro ao cancelar reserva:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

// Minhas reservas
const minhasReservas = async (req, res) => {
  try {
    const id_usuario = req.usuario.id;

    const resultado = await pool.query(
      `SELECT r.id_reserva, s.nome AS sala, s.localizacao, r.data_reserva,
              r.hora_inicio, r.hora_fim, r.status, r.data_criacao
       FROM reservas r
       JOIN salas s ON s.id_sala = r.id_sala
       WHERE r.id_usuario = $1
       ORDER BY r.data_reserva DESC, r.hora_inicio DESC`,
      [id_usuario]
    );

    res.json({ sucesso: true, reservas: resultado.rows });
  } catch (erro) {
    console.error('Erro ao buscar reservas:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = {
  listarSalas,
  buscarHorarios,
  buscarOcupacaoMes,
  criarReserva,
  cancelarReserva,
  minhasReservas,
};