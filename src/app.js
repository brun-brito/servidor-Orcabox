const express = require('express');
const cors = require('cors');
const produtoRoutes = require('./routes/produtoRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const cpfRoutes = require('./routes/cpfRoutes');
const conselhoRoutes = require('./routes/conselhoRoutes');
const distribuidorRoutes = require('./routes/distribuidorRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());

app.use(express.json());
app.use('/v1', produtoRoutes);
app.use('/v1', profissionalRoutes);
app.use('/v1', cpfRoutes);
app.use('/v1', conselhoRoutes);
app.use('/v1', distribuidorRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});