const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const testDbPath = path.resolve(__dirname, '../test-database.sqlite');

global.testDb = new sqlite3.Database(testDbPath);

global.testDb.serialize(() => {
  global.testDb.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      telefono TEXT NOT NULL,
      email TEXT NOT NULL,
      updatedAt TEXT
    )
  `);

  global.testDb.run(`
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

  global.testDb.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  global.testDb.run(`
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

  global.testDb.run(`
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

function resetDatabase() {
  return new Promise((resolve) => {
    global.testDb.run('DELETE FROM recordatorios', () => {
      global.testDb.run('DELETE FROM historial', () => {
        global.testDb.run('DELETE FROM reparaciones', () => {
          global.testDb.run('DELETE FROM clientes', () => {
            global.testDb.run('DELETE FROM usuarios', () => {
              const hashedPassword = bcrypt.hashSync('admin123', 10);
              global.testDb.run(
                'INSERT OR IGNORE INTO usuarios (usuario, password, createdAt) VALUES (?, ?, ?)',
                ['admin', hashedPassword, new Date().toISOString()],
                () => resolve()
              );
            });
          });
        });
      });
    });
  });
}

beforeAll(async () => {
  await new Promise(resolve => setTimeout(resolve, 100));
  await resetDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll((done) => {
  global.testDb.close((err) => {
    if (err) {
      console.error('Error closing test database:', err);
    }
    done();
  });
});
