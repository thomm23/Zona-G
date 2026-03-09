const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

jest.mock('../../db/database', () => global.testDb);

const authRoutes = require('../../routes/auth');

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

const JWT_SECRET = 'tu_clave_secreta_super_segura_123';

describe('POST /auth/login', () => {
  it('should login successfully with valid credentials', (done) => {
    request(app)
      .post('/auth/login')
      .send({ usuario: 'admin', password: 'admin123' })
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.usuario).toBe('admin');
        expect(res.body.expiresIn).toBe('24h');
        done();
      });
  });

  it('should login with rememberMe set to 30d expiry', (done) => {
    request(app)
      .post('/auth/login')
      .send({ usuario: 'admin', password: 'admin123', rememberMe: true })
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.expiresIn).toBe('30d');
        done();
      });
  });

  it('should reject login with invalid password', (done) => {
    request(app)
      .post('/auth/login')
      .send({ usuario: 'admin', password: 'wrongpassword' })
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Usuario o contraseña incorrectos');
        done();
      });
  });

  it('should reject login with non-existent user', (done) => {
    request(app)
      .post('/auth/login')
      .send({ usuario: 'nonexistent', password: 'admin123' })
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Usuario o contraseña incorrectos');
        done();
      });
  });

  it('should reject login without usuario', (done) => {
    request(app)
      .post('/auth/login')
      .send({ password: 'admin123' })
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Usuario y contraseña son requeridos');
        done();
      });
  });

  it('should reject login without password', (done) => {
    request(app)
      .post('/auth/login')
      .send({ usuario: 'admin' })
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Usuario y contraseña son requeridos');
        done();
      });
  });

  it('should reject login with empty credentials', (done) => {
    request(app)
      .post('/auth/login')
      .send({})
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Usuario y contraseña son requeridos');
        done();
      });
  });
});

describe('GET /auth/verify', () => {
  it('should verify valid token', (done) => {
    const token = jwt.sign({ id: 1, usuario: 'admin' }, JWT_SECRET, { expiresIn: '1h' });

    request(app)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.valid).toBe(true);
        expect(res.body.usuario).toBe('admin');
        done();
      });
  });

  it('should reject request without token', (done) => {
    request(app)
      .get('/auth/verify')
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Token no proporcionado');
        done();
      });
  });

  it('should reject invalid token', (done) => {
    request(app)
      .get('/auth/verify')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Token inválido o expirado');
        done();
      });
  });

  it('should reject expired token', (done) => {
    const expiredToken = jwt.sign({ id: 1, usuario: 'admin' }, JWT_SECRET, { expiresIn: '-1h' });

    request(app)
      .get('/auth/verify')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
      .end((err, res) => {
        if (err) return done(err);
        expect(res.body.error).toBe('Token inválido o expirado');
        done();
      });
  });
});
