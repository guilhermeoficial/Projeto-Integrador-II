const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {

    try {

        const { cpf, senha } = req.body;

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE cpf = $1',
            [cpf]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                erro: 'Usuário não encontrado'
            });
        }

        const usuario = result.rows[0];

        const senhaValida = await bcrypt.compare(
            senha,
            usuario.senha
        );

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                erro: 'Senha inválida'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.id_usuario,
                tipo: usuario.tipo_usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '8h'
            }
        );

        res.json({
            sucesso: true,
            token,
            usuario: {
                id: usuario.id_usuario,
                nome: usuario.nome,
                cpf: usuario.cpf,
                role: usuario.tipo_usuario
            }
        });

    } catch (error) {

        res.status(500).json({
            sucesso: false,
            erro: error.message
        });

    }
};
