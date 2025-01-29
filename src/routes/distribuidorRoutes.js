const express = require('express');
const distribuidorController = require('../controllers/distribuidorController');

const router = express.Router();

router.post('/cadastrar-produto', distribuidorController.cadastrarProduto);
router.put('/editar-produto', distribuidorController.editarProduto);
router.delete('/excluir-produto', distribuidorController.excluirProduto);
router.get('/buscar-produto', distribuidorController.buscarProduto);
router.get('/consultar-fatura', distribuidorController.consultarFatura);

module.exports = router;
