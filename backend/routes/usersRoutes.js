const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

router.post('/registrar', usersController.registrar);

module.exports = router;