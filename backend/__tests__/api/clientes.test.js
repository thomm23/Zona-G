const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../db/database', () => global.testDb);
jest.mock('../../utils/historial', () => ({
  registrarCambio: jest.fn()
}));

const clientesRoutes = require('../../routes/clientes');
const authMiddleware = require('../../middleware/auth');

const JWT_SECRET = 'tu_clave_secreta_super_segura_123';

const app = express();
app.use(express.json());
app.use('/clientes', authMiddleware, clientesRoutes);

function generateToken(usuario = 'admin') {
  return jwt.sign({ id: 1, usuario }, JWT_SECRET, { expiresIn: '1h' });
}

describe('GET /clientes', () => {
  it('should return all clientes', (done) => {
    request(app)
      .get('/clientes')
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
      .get('/clientes')
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(401);
        done();
      });
  });
});

describe('GET /clientes/:id', () => {
  it('should return cliente by id', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Test Client', '1234567890', 'test@test.com'],
      function(err) {
        if (err) return done(err);
        const insertedId = this.lastID;
        
        global.testDb.get('SELECT * FROM clientes WHERE id = ?', [insertedId], (err, row) => {
          if (err || !row) return done(err);
          
          request(app)
            .get(`/clientes/${insertedId}`)
            .set('Authorization', `Bearer ${generateToken()}`)
            .end((err, res) => {
              if (err) return done(err);
              expect(res.status).toBe(200);
              expect(res.body.nombre).toBe('Test Client');
              done();
            });
        });
      }
    );
  });

  it('should return 404 for non-existent cliente', (done) => {
    request(app)
      .get('/clientes/99999')
      .set('Authorization', `Bearer ${generateToken()}`)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
        done();
      });
  });
});

describe('POST /clientes', () => {
  it('should create new cliente', (done) => {
    request(app)
      .post('/clientes')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({
        nombre: 'Nuevo Cliente',
        telefono: '9876543210',
        email: 'nuevo@test.com'
      })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(201);
        expect(res.body.nombre).toBe('Nuevo Cliente');
        expect(res.body.id).toBeDefined();
        done();
      });
  });
});

describe('PUT /clientes/:id', () => {
  it('should update cliente', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Original', '1111111111', 'original@test.com'],
      function(err) {
        if (err) return done(err);
        const id = this.lastID;
        
        global.testDb.get('SELECT * FROM clientes WHERE id = ?', [id], (err, row) => {
          if (err || !row) return done(err);

          request(app)
            .put(`/clientes/${id}`)
            .set('Authorization', `Bearer ${generateToken()}`)
            .send({
              nombre: 'Actualizado',
              telefono: '2222222222',
              email: 'actualizado@test.com'
            })
            .end((err, res) => {
              if (err) return done(err);
              expect(res.status).toBe(200);
              expect(res.body.nombre).toBe('Actualizado');
              done();
            });
        });
      }
    );
  });

  it('should return 404 when updating non-existent cliente', (done) => {
    request(app)
      .put('/clientes/99999')
      .set('Authorization', `Bearer ${generateToken()}`)
      .send({
        nombre: 'Test',
        telefono: '123',
        email: 'test@test.com'
      })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Cliente no encontrado');
        done();
      });
  });
});

describe('DELETE /clientes/:id', () => {
  it('should delete cliente', (done) => {
    global.testDb.run(
      'INSERT INTO clientes (nombre, telefono, email) VALUES (?, ?, ?)',
      ['Delete Me', '3333333333', 'delete@test.com'],
      function(err) {
        if (err) return done(err);
        const id = this.lastID;

        request(app)
          .delete(`/clientes/${id}`)
          .set('Authorization', `Bearer ${generateToken()}`)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.status).toBe(200);
            expect(res.body.deleted).toBe(1);
            done();
          });
      }
    );
  });
});
