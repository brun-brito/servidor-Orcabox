const express = require('express');
const { buscarProduto } = require('../controllers/produtoController');
const { redirecionarLink } = require('../services/linkCurto');

const router = express.Router();

router.get('/buscar-produto', buscarProduto);
router.get('/:shortId', redirecionarLink);

module.exports = router;
