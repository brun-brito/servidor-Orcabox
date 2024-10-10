const express = require('express');
const { buscarCep } = require('../controllers/profissionalController');

const router = express.Router();

// Rota para buscar o CEP pelo telefone
router.post('/buscar-cep', buscarCep);

module.exports = router;
