// routes/clientes.js
const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');
const { registrarCambio } = require('../utils/historial');

router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.getAll();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const cliente = await Cliente.getById(req.params.id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(cliente);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const nuevo = await Cliente.create(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const clienteAnterior = await Cliente.getById(req.params.id);
    if (!clienteAnterior) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const clienteActualizado = await Cliente.update(req.params.id, req.body);
    
    // Registrar cambio en historial
    registrarCambio(
      req.usuario.id,
      'cliente',
      req.params.id,
      'actualizar',
      clienteAnterior,
      clienteActualizado
    );

    res.json(clienteActualizado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const resultado = await Cliente.delete(req.params.id);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
