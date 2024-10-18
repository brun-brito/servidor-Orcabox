const express = require('express');
const router = express.Router();
const conselhoController = require('../controllers/conselhoController');

// Rota para verificar o CPF
router.get('/consultar-cpf', conselhoController.consultarCPF);

module.exports = router;
