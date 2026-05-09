const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { cpf, senha } = req.body;

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE cpf = $1 AND senha = $2',
            [cpf, senha]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                erro: 'CPF ou senha inválidos'
            });
        }

        const usuario = resultado.rows[0];

        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                tipo: usuario.tipo_usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        );

        res.json({
            mensagem: 'Login realizado com sucesso',
            token,
            usuario
        });

    } catch (erro) {
        res.status(500).json({
            erro: 'Erro interno do servidor'
        });
    }
};

module.exports = {
    login
};
