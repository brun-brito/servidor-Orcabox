const express = require('express');
const { buscarProdutos } = require('../controllers/produtoController');
const { redirecionarLink } = require('../utils/linkCurto');

const router = express.Router();

router.post('/buscar-produtos', buscarProdutos);
router.get('/send/:shortId', redirecionarLink);

module.exports = router;
