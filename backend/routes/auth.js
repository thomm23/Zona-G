// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const JWT_SECRET = 'tu_clave_secreta_super_segura_123'; // Cambiar en producción

// Login
router.post('/login', (req, res) => {
  const { usuario, password, rememberMe } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  db.get('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error en la base de datos' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Validar contraseña
    const passwordValida = bcrypt.compareSync(password, user.password);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar token con expiración según rememberMe
    const expiresIn = rememberMe ? '30d' : '24h';
    const token = jwt.sign({ id: user.id, usuario: user.usuario }, JWT_SECRET, {
      expiresIn: expiresIn
    });

    res.json({ 
      success: true, 
      token: token,
      usuario: user.usuario,
      expiresIn: expiresIn
    });
  });
});

// Verificar token (para testing)
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, usuario: decoded.usuario });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

module.exports = router;
