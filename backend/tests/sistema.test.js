const request = require('supertest');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importa as rotas
const authRoutes = require('../routes/authRoutes');
const reservasRoutes = require('../routes/reservasRoutes');
const usersRoutes = require('../routes/usersRoutes');

// Cria a app para teste
const app = express();
app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/reservas', reservasRoutes);
app.use('/users', usersRoutes);

// Token JWT gerado no login para reuso nos testes
let tokenValido = '';

// -------------------------------------------------------
// TESTES DE AUTENTICAÇÃO
// -------------------------------------------------------
describe('POST /auth/login', () => {

    test('Login com credenciais válidas retorna 200 e token', async () => {
        const resposta = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });

        expect(resposta.statusCode).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(resposta.body.token).toBeDefined();
        expect(resposta.body.usuario).toBeDefined();
        expect(resposta.body.usuario.senha).toBeUndefined(); // senha não deve vazar

        // Salva o token para os próximos testes
        tokenValido = resposta.body.token;
    });

    test('Login com senha errada retorna 401', async () => {
        const resposta = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '000000' });

        expect(resposta.statusCode).toBe(401);
        expect(resposta.body.sucesso).toBe(false);
    });

    test('Login com CPF inexistente retorna 401', async () => {
        const resposta = await request(app)
            .post('/auth/login')
            .send({ cpf: '99999999999', senha: '112358' });

        expect(resposta.statusCode).toBe(401);
    });

    test('Login sem CPF ou senha retorna 400', async () => {
        const resposta = await request(app)
            .post('/auth/login')
            .send({});

        expect(resposta.statusCode).toBe(400);
    });

});

// -------------------------------------------------------
// TESTES DE ROTAS PROTEGIDAS (sem token)
// -------------------------------------------------------
describe('Rotas protegidas sem token', () => {

    test('GET /reservas/salas sem token retorna 401', async () => {
        const resposta = await request(app).get('/reservas/salas');
        expect(resposta.statusCode).toBe(401);
    });

    test('GET /reservas/horarios sem token retorna 401', async () => {
        const resposta = await request(app).get('/reservas/horarios');
        expect(resposta.statusCode).toBe(401);
    });

    test('GET /reservas/minhas sem token retorna 401', async () => {
        const resposta = await request(app).get('/reservas/minhas');
        expect(resposta.statusCode).toBe(401);
    });

    test('POST /reservas sem token retorna 401', async () => {
        const resposta = await request(app).post('/reservas');
        expect(resposta.statusCode).toBe(401);
    });

});

// -------------------------------------------------------
// TESTES DE SALAS (com token)
// -------------------------------------------------------
describe('GET /reservas/salas', () => {

    test('Retorna lista de salas com token válido', async () => {
        // Faz login primeiro para garantir o token
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .get('/reservas/salas')
            .set('Authorization', `Bearer ${token}`);

        expect(resposta.statusCode).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(Array.isArray(resposta.body.salas)).toBe(true);
        expect(resposta.body.salas.length).toBeGreaterThan(0);
        expect(resposta.body.salas[0]).toHaveProperty('id_sala');
        expect(resposta.body.salas[0]).toHaveProperty('nome');
        expect(resposta.body.salas[0]).toHaveProperty('localizacao');
        expect(resposta.body.salas[0]).toHaveProperty('capacidade');
    });

});

// -------------------------------------------------------
// TESTES DE HORÁRIOS (com token)
// -------------------------------------------------------
describe('GET /reservas/horarios', () => {

    test('Retorna horários de uma sala em uma data com token válido', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .get('/reservas/horarios?id_sala=1&data=2026-12-01')
            .set('Authorization', `Bearer ${token}`);

        expect(resposta.statusCode).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(Array.isArray(resposta.body.horarios)).toBe(true);
        expect(resposta.body.horarios.length).toBe(8); // 8 horários fixos
        expect(resposta.body.horarios[0]).toHaveProperty('tempo');
        expect(resposta.body.horarios[0]).toHaveProperty('vago');
    });

    test('Retorna 400 sem parâmetros obrigatórios', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .get('/reservas/horarios')
            .set('Authorization', `Bearer ${token}`);

        expect(resposta.statusCode).toBe(400);
    });

});

// -------------------------------------------------------
// TESTES DE RESERVA (com token)
// -------------------------------------------------------
describe('POST /reservas', () => {

    test('Cria reserva com dados válidos retorna 201', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .post('/reservas')
            .set('Authorization', `Bearer ${token}`)
            .send({
                id_sala: 1,
                data_reserva: '2026-12-15',
                hora_inicio: '14:00',
                hora_fim: '15:00'
            });

        expect(resposta.statusCode).toBe(201);
        expect(resposta.body.sucesso).toBe(true);
        expect(resposta.body.reserva).toBeDefined();
    });

    test('Não permite reserva duplicada no mesmo horário', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        // Tenta reservar o mesmo horário duas vezes
        await request(app)
            .post('/reservas')
            .set('Authorization', `Bearer ${token}`)
            .send({ id_sala: 1, data_reserva: '2026-12-20', hora_inicio: '10:00', hora_fim: '11:00' });

        const resposta = await request(app)
            .post('/reservas')
            .set('Authorization', `Bearer ${token}`)
            .send({ id_sala: 1, data_reserva: '2026-12-20', hora_inicio: '10:00', hora_fim: '11:00' });

        expect(resposta.statusCode).toBe(409); // Conflict
    });

    test('Retorna 400 sem campos obrigatórios', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .post('/reservas')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(resposta.statusCode).toBe(400);
    });

});

// -------------------------------------------------------
// TESTES DE MINHAS RESERVAS (com token)
// -------------------------------------------------------
describe('GET /reservas/minhas', () => {

    test('Retorna reservas do usuário logado', async () => {
        const login = await request(app)
            .post('/auth/login')
            .send({ cpf: '14867590880', senha: '112358' });
        const token = login.body.token;

        const resposta = await request(app)
            .get('/reservas/minhas')
            .set('Authorization', `Bearer ${token}`);

        expect(resposta.statusCode).toBe(200);
        expect(resposta.body.sucesso).toBe(true);
        expect(Array.isArray(resposta.body.reservas)).toBe(true);
    });

});