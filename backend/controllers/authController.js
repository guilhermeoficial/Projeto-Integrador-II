const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const login = async (req, res) => {
  try {
    let { cpf, senha } = req.body;

    if (!cpf || !senha) {
      return res.status(400).json({ sucesso: false, erro: 'CPF e senha são obrigatórios.' });
    }

    // Remove pontos e traços do CPF
    cpf = cpf.replace(/\D/g, '');

    const resultado = await pool.query(
      'SELECT * FROM usuarios WHERE cpf = $1',
      [cpf]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ sucesso: false, erro: 'CPF ou senha inválidos.' });
    }

    const usuario = resultado.rows[0];

    // Compara senha informada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ sucesso: false, erro: 'CPF ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id_usuario, tipo: usuario.tipo_usuario },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Remove a senha antes de retornar o usuário
    const { senha: _, ...usuarioSemSenha } = usuario;

    return res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: usuarioSemSenha,
    });

  } catch (erro) {
    console.error('ERRO DETALHADO NO LOGIN:', erro);
    res.status(500).json({ erro: 'Erro interno do servidor', detalhe: erro.message });
  }
};

module.exports = { login };