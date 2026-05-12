require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const reservasRoutes = require('./routes/reservasRoutes');
const usersRoutes = require('./routes/usersRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/users', usersRoutes);

app.get('/', (req, res) => {
  res.json({ mensagem: 'API Sistema de Reservas funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});