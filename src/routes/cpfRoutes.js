const express = require('express');
const cpfController = require('../controllers/cpfController');

const router = express.Router();

router.get('/consultar-cpf', cpfController.consultarCPF);

module.exports = router;
