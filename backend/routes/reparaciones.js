// routes/reparaciones.js
const express = require('express');
const router = express.Router();
const Reparacion = require('../models/Reparacion');
const { registrarCambio } = require('../utils/historial');
const db = require('../db/database');

// Almacenamiento temporal de mensajes (se limpia después de 5 minutos)
const whatsappTokens = new Map();

// Limpiar tokens expirados cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of whatsappTokens.entries()) {
    if (now - data.timestamp > 5 * 60 * 1000) { // 5 minutos
      whatsappTokens.delete(token);
    }
  }
}, 60000);

// Generar ID único para el token
function generateToken() {
  return Math.random().toString(36).substr(2, 9);
}

// Paso 1: Frontend envía datos al backend (POST seguro)
router.post('/send-whatsapp-message', async (req, res) => {
  try {
    const { phone, clienteName, repairStatus } = req.body;

    // Validar datos
    if (!phone || !clienteName || !repairStatus) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Generar token temporal
    const token = generateToken();
    whatsappTokens.set(token, {
      phone,
      clienteName,
      repairStatus,
      timestamp: Date.now()
    });

    // Log de auditoría
    console.log(`[WhatsApp] Solicitud de mensaje para ${phone} - Estado: ${repairStatus}`);

    // Devolver URL corta con solo el token (sin datos sensibles)
    res.json({ 
      success: true, 
      redirectUrl: `/reparaciones/whatsapp-redirect/${token}`
    });
  } catch (error) {
    console.error('Error al generar enlace WhatsApp:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});

// Paso 2: Redirigir a WhatsApp usando el token
router.get('/whatsapp-redirect/:token', (req, res) => {
  try {
    const { token } = req.params;
    const data = whatsappTokens.get(token);

    if (!data) {
      return res.status(404).send('Token inválido o expirado');
    }

    // Construir mensaje
    const message = `Hola ${data.clienteName}, tu reparación está ${data.repairStatus}. ¡Gracias por tu confianza!`;
    const encodedMessage = encodeURIComponent(message);
    
    // Redirigir a WhatsApp
    const whatsappUrl = `https://wa.me/${data.phone}?text=${encodedMessage}`;
    
    // Eliminar token después de usarlo
    whatsappTokens.delete(token);

    res.redirect(whatsappUrl);
  } catch (error) {
    console.error('Error en redirección WhatsApp:', error);
    res.status(500).send('Error al procesar la solicitud');
  }
});

// Obtener todas las reparaciones
router.get('/', async (req, res) => {
  try {
    const reparaciones = await Reparacion.getAll();
    res.json(reparaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una reparación por ID
router.get('/:id', async (req, res) => {
  try {
    const reparacion = await Reparacion.getById(req.params.id);
    if (!reparacion) {
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }
    res.json(reparacion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear una nueva reparación
router.post('/', async (req, res) => {
  try {
    const nueva = await Reparacion.create(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Actualizar una reparación
router.put('/:id', async (req, res) => {
  try {
    const reparacionAnterior = await Reparacion.getById(req.params.id);
    if (!reparacionAnterior) {
      return res.status(404).json({ error: 'Reparación no encontrada' });
    }

    const resultado = await Reparacion.update(req.params.id, req.body);
    
    // Registrar cambio en historial
    registrarCambio(
      req.usuario.id,
      'reparacion',
      req.params.id,
      'actualizar',
      reparacionAnterior,
      resultado
    );

    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener historial de cambios
router.get('/historial/todos', (req, res) => {
  try {
    db.all(
      `SELECT h.*, u.usuario FROM historial h
       LEFT JOIN usuarios u ON h.usuarioId = u.id
       ORDER BY h.timestamp DESC LIMIT 100`,
      [],
      (err, rows) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          const historial = rows?.map(row => ({
            ...row,
            cambiosAnteriores: JSON.parse(row.cambiosAnteriores || '{}'),
            cambiosNuevos: JSON.parse(row.cambiosNuevos || '{}')
          })) || [];
          res.json(historial);
        }
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Eliminar una reparación
router.delete('/:id', async (req, res) => {
  try {
    const resultado = await Reparacion.delete(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
