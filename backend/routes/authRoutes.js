const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Mude de .get para .post e aponte para o login
router.post('/login', authController.login);

// Rota de teste para ver se o arquivo de rotas está carregado
router.get('/test', (req, res) => {
    res.json({ mensagem: 'O arquivo authRoutes foi encontrado!' });
});

module.exports = router;