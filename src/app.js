const express = require('express');
const produtoRoutes = require('./routes/produtoRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');  // Importe as rotas de profissionais

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/v1', produtoRoutes);
app.use('/v1', profissionalRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
