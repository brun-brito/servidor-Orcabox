const express = require('express');
const { buscarProduto } = require('../controllers/produtoController');

const router = express.Router();

router.get('/buscar-produto', buscarProduto);

module.exports = router;
