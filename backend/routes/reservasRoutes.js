const express = require('express');
const router = express.Router();
const reservasController = require('../controllers/reservasController');
const { autenticarToken } = require('../middleware/auth');

router.use(autenticarToken);

router.get('/salas', reservasController.listarSalas);
router.get('/horarios', reservasController.buscarHorarios);
router.get('/ocupacao', reservasController.buscarOcupacaoMes);
router.get('/minhas', reservasController.minhasReservas);
router.post('/', reservasController.criarReserva);
router.patch('/:id/cancelar', reservasController.cancelarReserva);

module.exports = router;