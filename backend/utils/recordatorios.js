// utils/recordatorios.js
const db = require('../db/database');
const axios = require('axios');

const whatsappTokens = new Map();

function generateToken() {
  return Math.random().toString(36).substr(2, 9);
}

const enviarRecordatorio = async (reparacion, cliente) => {
  try {
    // Generar token temporal para envío seguro
    const token = generateToken();
    whatsappTokens.set(token, {
      phone: cliente.telefono,
      clienteName: cliente.nombre,
      repairStatus: `próxima a vencer el ${new Date(reparacion.servicio.fechaEntregaEstimada).toLocaleDateString()}`,
      timestamp: Date.now()
    });

    // Crear mensaje
    const message = `Recordatorio: Tu reparación está ${reparacion.servicio.estado} y será entregada el ${new Date(reparacion.servicio.fechaEntregaEstimada).toLocaleDateString()}. ¿Alguna duda?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${cliente.telefono}?text=${encodedMessage}`;

    // Registrar que se envió
    db.run(
      'INSERT INTO recordatorios (reparacionId, clienteId, tipo, enviado, fechaEnviado) VALUES (?, ?, ?, 1, ?)',
      [reparacion.id, cliente.id, 'proximaAVencer', new Date().toISOString()],
      (err) => {
        if (err) {
          console.error('Error al registrar recordatorio:', err);
        } else {
          console.log(`✅ Recordatorio enviado a ${cliente.nombre} (${cliente.telefono})`);
        }
      }
    );

    // Eliminar token después de 5 minutos
    setTimeout(() => whatsappTokens.delete(token), 5 * 60 * 1000);

    return { success: true, url: whatsappUrl };
  } catch (error) {
    console.error('Error al enviar recordatorio:', error);
    return { success: false, error: error.message };
  }
};

const verificarReparacionesPorVencer = () => {
  db.all(
    `SELECT r.*, c.nombre, c.telefono, c.email
     FROM reparaciones r
     LEFT JOIN clientes c ON r.clienteId = c.id
     WHERE r.servicio LIKE '%estado%'
     AND r.servicio NOT LIKE '%cancelada%'`,
    [],
    async (err, rows) => {
      if (err) {
        console.error('Error al verificar reparaciones:', err);
        return;
      }

      if (!rows) return;

      for (const row of rows) {
        try {
          const reparacion = {
            id: row.id,
            servicio: JSON.parse(row.servicio || '{}')
          };

          const cliente = {
            id: row.clienteId,
            nombre: row.nombre,
            telefono: row.telefono,
            email: row.email
          };

          // Verificar si ya se envió recordatorio hoy
          db.get(
            'SELECT * FROM recordatorios WHERE reparacionId = ? AND DATE(fechaEnviado) = DATE(?) LIMIT 1',
            [reparacion.id, new Date().toISOString()],
            async (err, exists) => {
              if (!exists && reparacion.servicio.fechaEntregaEstimada) {
                const fechaEntrega = new Date(reparacion.servicio.fechaEntregaEstimada);
                const hoy = new Date();
                const diasFaltantes = Math.floor((fechaEntrega - hoy) / (1000 * 60 * 60 * 24));

                // Enviar recordatorio si faltan 1 o 2 días
                if (diasFaltantes > 0 && diasFaltantes <= 2) {
                  await enviarRecordatorio(reparacion, cliente);
                }
              }
            }
          );
        } catch (error) {
          console.error('Error procesando reparación:', error);
        }
      }
    }
  );
};

const iniciarRecordatoriosAutomaticos = () => {
  // Verificar cada día a las 9 AM
  const ahora = new Date();
  const proximaEjecucion = new Date(ahora);
  proximaEjecucion.setHours(9, 0, 0, 0);

  if (proximaEjecucion <= ahora) {
    proximaEjecucion.setDate(proximaEjecucion.getDate() + 1);
  }

  const tiempoHastaProxima = proximaEjecucion - ahora;
  
  setTimeout(() => {
    verificarReparacionesPorVencer();
    // Luego ejecutar cada 24 horas
    setInterval(verificarReparacionesPorVencer, 24 * 60 * 60 * 1000);
  }, tiempoHastaProxima);

  console.log(`🔔 Sistema de recordatorios automáticos iniciado (próxima ejecución en ${proximaEjecucion.toLocaleString()})`);
};

module.exports = { iniciarRecordatoriosAutomaticos, enviarRecordatorio, whatsappTokens };
