const pool = require('../config/db');
const bcrypt = require('bcrypt');

const registrar = async (req, res) => {
  try {
    let { nome, email, cpf, senha, tipo_usuario } = req.body;

    if (!nome || !email || !cpf || !senha) {
      return res.status(400).json({ erro: 'Todos os campos são obrigatórios.' });
    }

    // Limpa o CPF
    cpf = cpf.replace(/\D/g, '');

    if (cpf.length !== 11) {
      return res.status(400).json({ erro: 'CPF inválido.' });
    }

    if (!/^\d{6}$/.test(senha)) {
      return res.status(400).json({ erro: 'A senha deve ter exatamente 6 dígitos numéricos.' });
    }

    // Verifica se CPF ou e-mail já existem
    const existente = await pool.query(
      'SELECT id_usuario FROM usuarios WHERE cpf = $1 OR email = $2',
      [cpf, email]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ erro: 'CPF ou e-mail já cadastrado.' });
    }

    // Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    const tipo = tipo_usuario === 'ADMINISTRADOR' ? 'ADMINISTRADOR' : 'USUARIO';

    const resultado = await pool.query(
      `INSERT INTO usuarios (nome, cpf, email, senha, tipo_usuario)
       VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario, nome, email, cpf, tipo_usuario`,
      [nome, cpf, email, senhaHash, tipo]
    );

    res.status(201).json({ sucesso: true, usuario: resultado.rows[0] });
  } catch (erro) {
    console.error('Erro ao registrar usuário:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};

module.exports = { registrar };