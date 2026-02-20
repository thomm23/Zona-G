// models/Cliente.js
const db = require('../db/database');

class Cliente {
  static create({ nombre, telefono, email }) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)`,
        [nombre.trim(), telefono.trim(), email.trim()],
        function (err) {
          if (err) reject(err);
          else resolve({ 
            id: this.lastID, 
            nombre, 
            telefono, 
            email 
          });
        }
      );
    });
  }

  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM clientes`, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM clientes WHERE id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }

  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(`DELETE FROM clientes WHERE id = ?`, [id], function (err) {
        if (err) reject(err);
        else resolve({ deleted: this.changes });
      });
    });
  }

  static update(id, { nombre, telefono, email }) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE clientes SET nombre = ?, telefono = ?, email = ?, updatedAt = ? WHERE id = ?`,
        [nombre.trim(), telefono.trim(), email.trim(), new Date().toISOString(), id],
        function (err) {
          if (err) reject(err);
          else resolve({ 
            id,
            nombre, 
            telefono, 
            email,
            updatedAt: new Date().toISOString()
          });
        }
      );
    });
  }
}

module.exports = Cliente;
