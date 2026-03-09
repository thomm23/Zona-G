// server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const reparacionesRoutes = require('./routes/reparaciones');
const authMiddleware = require('./middleware/auth');
const { iniciarBackupAutomatico } = require('./utils/backup');
const { iniciarRecordatoriosAutomaticos } = require('./utils/recordatorios');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Iniciar sistemas automáticos
iniciarBackupAutomatico();
iniciarRecordatoriosAutomaticos();

// Rutas públicas (sin autenticación)
app.use('/auth', authRoutes);

// Middleware de autenticación para rutas protegidas
app.use(authMiddleware);

// Rutas protegidas
app.use('/clientes', clientesRoutes);
app.use('/reparaciones', reparacionesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en puerto ${PORT}`);
});
