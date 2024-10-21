const express = require('express');
const conselhoController = require('../controllers/conselhoController');

const router = express.Router();

// Rota para consultar conselhos
router.post('/consultar-conselho', conselhoController.consultarConselho);

module.exports = router;
