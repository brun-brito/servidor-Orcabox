const express = require('express');
const { verificarConselho } = require('../controllers/conselhoController');
const router = express.Router();

router.post('/consultar-conselho', verificarConselho);

module.exports = router;
