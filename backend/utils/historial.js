// utils/historial.js
const db = require('../db/database');

const registrarCambio = (usuarioId, entidad, entidadId, accion, cambiosAnteriores, cambiosNuevos) => {
  db.run(
    'INSERT INTO historial (usuarioId, entidad, entidadId, accion, cambiosAnteriores, cambiosNuevos, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      usuarioId,
      entidad,
      entidadId,
      accion,
      JSON.stringify(cambiosAnteriores),
      JSON.stringify(cambiosNuevos),
      new Date().toISOString()
    ],
    (err) => {
      if (err) {
        console.error('Error al registrar cambio:', err);
      }
    }
  );
};

module.exports = { registrarCambio };
