// db/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos SQLite');
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reparaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      clienteId INTEGER NOT NULL,
      dispositivo TEXT,
      servicio TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT,
      FOREIGN KEY (clienteId) REFERENCES clientes(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `, (err) => {
    if (!err) {
      // Inicializar usuario por defecto si no existe
      db.get('SELECT * FROM usuarios WHERE usuario = ?', ['admin'], (err, row) => {
        if (!row) {
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run(
            'INSERT INTO usuarios (usuario, password, createdAt) VALUES (?, ?, ?)',
            ['admin', hashedPassword, new Date().toISOString()],
            (err) => {
              if (err) {
                console.error('Error al crear usuario admin:', err);
              } else {
                console.log('✅ Usuario admin creado. Credenciales: admin / admin123');
              }
            }
          );
        }
      });
    }
  });

  // Tabla para historial de cambios
  db.run(`
    CREATE TABLE IF NOT EXISTS historial (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuarioId INTEGER NOT NULL,
      entidad TEXT NOT NULL,
      entidadId INTEGER NOT NULL,
      accion TEXT NOT NULL,
      cambiosAnteriores TEXT,
      cambiosNuevos TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (usuarioId) REFERENCES usuarios(id)
    )
  `);

  // Tabla para recordatorios enviados
  db.run(`
    CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reparacionId INTEGER NOT NULL,
      clienteId INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      enviado INTEGER DEFAULT 0,
      fechaEnviado TEXT,
      FOREIGN KEY (reparacionId) REFERENCES reparaciones(id),
      FOREIGN KEY (clienteId) REFERENCES clientes(id)
    )
  `);
});

module.exports = db;
