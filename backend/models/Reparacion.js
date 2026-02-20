// models/Reparacion.js
const db = require('../db/database');

class Reparacion {
  // Obtener todas las reparaciones con datos del cliente
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT r.*, c.nombre, c.telefono, c.email 
         FROM reparaciones r
         LEFT JOIN clientes c ON r.clienteId = c.id
         ORDER BY r.id DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else {
            const formatted = rows?.map(row => ({
              id: row.id,
              clienteId: row.clienteId,
              cliente: {
                nombre: row.nombre,
                telefono: row.telefono,
                email: row.email
              },
              dispositivo: JSON.parse(row.dispositivo || '{}'),
              servicio: JSON.parse(row.servicio || '{}'),
              createdAt: row.createdAt
            })) || [];
            resolve(formatted);
          }
        }
      );
    });
  }

  // Obtener una reparación por ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT r.*, c.nombre, c.telefono, c.email 
         FROM reparaciones r
         LEFT JOIN clientes c ON r.clienteId = c.id
         WHERE r.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          else if (!row) resolve(null);
          else {
            resolve({
              id: row.id,
              clienteId: row.clienteId,
              cliente: {
                nombre: row.nombre,
                telefono: row.telefono,
                email: row.email
              },
              dispositivo: JSON.parse(row.dispositivo || '{}'),
              servicio: JSON.parse(row.servicio || '{}'),
              createdAt: row.createdAt
            });
          }
        }
      );
    });
  }

  // Crear una nueva reparación
  static create(data) {
    const { clienteId, clientId, cliente_id, dispositivo, servicio } = data;
    const id = clienteId || clientId || cliente_id;

    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO reparaciones (clienteId, dispositivo, servicio, createdAt) 
         VALUES (?, ?, ?, ?)`,
        [
          id,
          JSON.stringify(dispositivo),
          JSON.stringify(servicio),
          new Date().toISOString()
        ],
        function (err) {
          if (err) reject(err);
          else resolve({
            id: this.lastID,
            clienteId: id,
            dispositivo,
            servicio,
            createdAt: new Date().toISOString()
          });
        }
      );
    });
  }

  // Actualizar una reparación
  static update(id, data) {
    return new Promise((resolve, reject) => {
      console.log(`📝 Actualizando reparación ID: ${id}`, data);
      
      // Primero obtener la reparación actual
      this.getById(id).then(reparacion => {
        if (!reparacion) {
          return reject(new Error('Reparación no encontrada'));
        }

        let dispositivo = reparacion.dispositivo;
        let servicio = reparacion.servicio;

        // Actualizar parcialmente los datos
        if (data.dispositivo) {
          dispositivo = { ...dispositivo, ...data.dispositivo };
        }
        if (data.servicio) {
          servicio = { ...servicio, ...data.servicio };
        }
        if (data.estado) {
          console.log(`✅ Cambiando estado a: ${data.estado}`);
          servicio = { ...servicio, estado: data.estado };
        }

        const updates = [];
        const params = [];

        if (dispositivo || data.dispositivo) {
          updates.push('dispositivo = ?');
          params.push(JSON.stringify(dispositivo));
        }
        if (servicio || data.servicio || data.estado) {
          updates.push('servicio = ?');
          params.push(JSON.stringify(servicio));
        }

        if (updates.length === 0) {
          console.log(`⚠️ No hay cambios que actualizar`);
          resolve({ updated: 0 });
          return;
        }

        params.push(id);

        db.run(
          `UPDATE reparaciones SET ${updates.join(', ')} WHERE id = ?`,
          params,
          function (err) {
            if (err) {
              console.error(`❌ Error al actualizar: ${err.message}`);
              reject(err);
            }
            else {
              console.log(`🎯 Reparación ${id} actualizada exitosamente`);
              resolve({ updated: this.changes });
            }
          }
        );
      }).catch(reject);
    });
  }

  // Eliminar una reparación
  static delete(id) {
    return new Promise((resolve, reject) => {
      db.run(
        `DELETE FROM reparaciones WHERE id = ?`,
        [id],
        function (err) {
          if (err) reject(err);
          else resolve({ deleted: this.changes });
        }
      );
    });
  }
}

module.exports = Reparacion;
