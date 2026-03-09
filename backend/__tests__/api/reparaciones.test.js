const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../db/database', () => global.testDb);
jest.mock('../../utils/historial', () => ({
  registrarCambio: jest.fn()
}));

const reparacionesRoutes = require('../../routes/reparaciones');
const authMiddleware = require('../../middleware/auth');

const JWT_SECRET = 'tu_clave_secreta_super_segura_123';

const app = express();
app.use(express.json());
app.use('/reparaciones', authMiddleware, reparacionesRoutes);

function generateToken(usuario = 'admin') {
  return jwt.sign({ id: 1, usuario }, JWT_SECRET, { expiresIn: '1h' });
}

describe('GET /reparaciones', () => {
  it('should return all reparaciones', (done) => {
    request(app)
      .get('/reparaciones')
      .set('Authorization', `Bearer ${generateToken()}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        done();
      });
  });

  it('should reject request without token', (done) => {
    request(app)
      .get('/reparaciones')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe('GET /reparaciones/:id', () => {
  it('should return reparacion by id', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client Test', '1234567890', 'client@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        global.testDb.run(
          'INSERT INTO reparaciones (clienteId, dispositivo, servicio, createdAt) VALUES (?, ?, ?, ?)',
          [clienteId, '{"modelo":"iPhone 12"}', '{"estado":"pendiente"}', new Date().toISOString()],
          function(err) {
            if (err) return done(err);

            request(app)
              .get(`/reparaciones/${this.lastID}`)
              .set('Authorization', `Bearer ${generateToken()}`)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.status).toBe(200);
                expect(res.body.clienteId).toBe(clienteId);
                done();
              });
          }
        );
      }
    );
  });

  it('should return 404 for non-existent reparacion', (done) => {
    request(app)
      .get('/reparaciones/99999')
      .set('Authorization', `Bearer ${generateToken()}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Reparación no encontrada');
        done();
      });
  });
});

describe('POST /reparaciones', () => {
  it('should create new reparacion', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client for Repair', '1234567890', 'repair@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        request(app)
          .post('/reparaciones')
          .set('Authorization', `Bearer ${generateToken()}`)
          .send({
            clienteId: clienteId,
            dispositivo: { modelo: 'Samsung S21' },
            servicio: { estado: 'en_revision' }
          })
          .end((err, res) => {
            if (err) return done(err);
            expect(res.status).toBe(201);
            expect(res.body.clienteId).toBe(clienteId);
            done();
          });
      }
    );
  });

  it('should create reparacion using clientId alias', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client Alias', '1234567890', 'alias@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        request(app)
          .post('/reparaciones')
          .set('Authorization', `Bearer ${generateToken()}`)
          .send({
            clientId: clienteId,
            dispositivo: { modelo: 'iPad' },
            servicio: { estado: 'nuevo' }
          })
          .end((err, res) => {
            if (err) return done(err);
            expect(res.status).toBe(201);
            done();
          });
      }
    );
  });
});

describe('PUT /reparaciones/:id', () => {
  it('should update reparacion estado', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client Update', '1234567890', 'update@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        global.testDb.run(
          'INSERT INTO reparaciones (clienteId, dispositivo, servicio, createdAt) VALUES (?, ?, ?, ?)',
          [clienteId, '{"modelo":"MacBook"}', '{"estado":"pendiente"}', new Date().toISOString()],
          function(err) {
            if (err) return done(err);
            const reparacionId = this.lastID;

            global.testDb.get('SELECT * FROM reparaciones WHERE id = ?', [reparacionId], (err, row) => {
              if (err || !row) return done(err || new Error('Reparacion not found'));

              request(app)
                .put(`/reparaciones/${reparacionId}`)
                .set('Authorization', `Bearer ${generateToken()}`)
                .send({
                  estado: 'completado'
                })
                .end((err, res) => {
                  if (err) return done(err);
                  expect(res.status).toBe(200);
                  done();
                });
            });
          }
        );
      }
    );
  });

  it('should return 404 when updating non-existent reparacion', (done) => {
    request(app)
      .put('/reparaciones/99999')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({ estado: 'completado' })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(404);
        done();
      });
  });
});

describe('DELETE /reparaciones/:id', () => {
  it('should delete reparacion', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client Delete', '1234567890', 'delete@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        global.testDb.run(
          'INSERT INTO reparaciones (clienteId, dispositivo, servicio, createdAt) VALUES (?, ?, ?, ?)',
          [clienteId, '{}', '{}', new Date().toISOString()],
          function(err) {
            if (err) return done(err);
            const reparacionId = this.lastID;

            request(app)
              .delete(`/reparaciones/${reparacionId}`)
              .set('Authorization', `Bearer ${generateToken()}`)
              .end((err, res) => {
                if (err) return done(err);
                expect(res.status).toBe(200);
                expect(res.body.deleted).toBe(1);
                done();
              });
          }
        );
      }
    );
  });
});

describe('POST /reparaciones/send-whatsapp-message', () => {
  it('should generate WhatsApp token', (done) => {
    request(app)
      .post('/reparaciones/send-whatsapp-message')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({
        phone: '1234567890',
        clienteName: 'Juan Perez',
        repairStatus: 'Listo para retirar'
      })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.redirectUrl).toContain('/reparaciones/whatsapp-redirect/');
        done();
      });
  });

  it('should reject incomplete data', (done) => {
    request(app)
      .post('/reparaciones/send-whatsapp-message')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({
        phone: '1234567890'
      })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Datos incompletos');
        done();
      });
  });
});

describe('GET /reparaciones/whatsapp-redirect/:token', () => {
  it('should redirect to WhatsApp with valid token', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Client WhatsApp', '1234567890', 'wa@test.com'],
      function(err) {
        if (err) return done(err);
        const clienteId = this.lastID;

        global.testDb.run(
          'INSERT INTO reparaciones (clienteId, dispositivo, servicio, createdAt) VALUES (?, ?, ?, ?)',
          [clienteId, '{}', '{}', new Date().toISOString()],
          function(err) {
            if (err) return done(err);
            const reparacionId = this.lastID;

            request(app)
              .post('/reparaciones/send-whatsapp-message')
              .set('Authorization', `Bearer ${generateToken()}`)
              .send({
                phone: '1234567890',
                clienteName: 'Juan Perez',
                repairStatus: 'Listo'
              })
              .end((err, res) => {
                if (err) return done(err);
                const token = res.body.redirectUrl.split('/').pop();

                request(app)
                  .get(`/reparaciones/whatsapp-redirect/${token}`)
                  .set('Authorization', `Bearer ${generateToken()}`)
                  .end((err, res) => {
                    if (err) return done(err);
                    expect(res.status).toBe(302);
                    expect(res.headers.location).toContain('wa.me');
                    expect(res.headers.location).toContain('Juan%20Perez');
                    done();
                  });
              });
          }
        );
      }
    );
  });

  it('should return 404 for invalid token', (done) => {
    request(app)
      .get('/reparaciones/whatsapp-redirect/invalid-token')
      .set('Authorization', `Bearer ${generateToken()}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(404);
        done();
      });
  });
});

describe('GET /reparaciones/historial/todos', () => {
  it('should return historial', (done) => {
    request(app)
      .get('/reparaciones/historial/todos')
      .set('Authorization', `Bearer ${generateToken()}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        done();
      });
  });
});
