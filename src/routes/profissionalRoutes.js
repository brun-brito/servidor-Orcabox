const express = require('express');
const { verificarCadastro } = require('../controllers/profissionalController');

const router = express.Router();

// Rota para buscar o CEP pelo telefone
router.post('/verificar-cadastro', verificarCadastro);

module.exports = router;
