// ===============================
// SERVIÇO DE API
// ===============================

const BASE_URL = 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');

const headersAuth = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});


const apiServico = {

    // LOGIN
    async autenticar(cpf, senha) {

        try {

            const resposta = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf, senha })
            });

            const dados = await resposta.json();

            if (dados.sucesso && dados.token) {
                localStorage.setItem('token', dados.token);
            }

            return dados;

        } catch (erro) {

            return {
                sucesso: false,
                erro: 'Erro ao conectar com servidor'
            };

        }
    },


    // REGISTRO
    async registrar(dados) {

        try {

            const resposta = await fetch(`${BASE_URL}/users/registrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dados)
            });

            return await resposta.json();

        } catch (erro) {

            return {
                sucesso: false,
                erro: 'Erro ao conectar com servidor'
            };

        }
    },


    // OCUPAÇÃO DO MÊS
    async buscarOcupacaoMes(id_sala, mes, ano) {

        try {

            // mes chega 0-based do Vue, a API espera 1-based
            const params = new URLSearchParams({ id_sala, mes: mes + 1, ano });

            const resposta = await fetch(`${BASE_URL}/reservas/ocupacao?${params}`, {
                headers: headersAuth()
            });

            const dados = await resposta.json();

            return dados.diasLotados || [];

        } catch (erro) {

            return [];

        }
    },


    // BUSCAR HORÁRIOS
    async buscarHorarios(id_sala, dataIso) {

        try {

            const params = new URLSearchParams({ id_sala, data: dataIso });

            const resposta = await fetch(`${BASE_URL}/reservas/horarios?${params}`, {
                headers: headersAuth()
            });

            const dados = await resposta.json();

            return dados.horarios || [];

        } catch (erro) {

            return [];

        }
    },


    // SALVAR RESERVA
    async salvarReserva(id_sala, dataIso, hora_inicio, hora_fim) {

        try {

            const resposta = await fetch(`${BASE_URL}/reservas`, {
                method: 'POST',
                headers: headersAuth(),
                body: JSON.stringify({ id_sala, data_reserva: dataIso, hora_inicio, hora_fim })
            });

            return await resposta.json();

        } catch (erro) {

            return {
                sucesso: false,
                erro: 'Erro ao salvar reserva'
            };

        }
    },


    // CANCELAR RESERVA
    async cancelarReserva(idReserva) {

        try {

            const resposta = await fetch(`${BASE_URL}/reservas/${idReserva}/cancelar`, {
                method: 'PATCH',
                headers: headersAuth()
            });

            return await resposta.json();

        } catch (erro) {

            return {
                sucesso: false,
                erro: 'Erro ao cancelar reserva'
            };

        }
    },


    // MINHAS RESERVAS
    async buscarMinhasReservas() {

        try {

            const resposta = await fetch(`${BASE_URL}/reservas/minhas`, {
                headers: headersAuth()
            });

            const dados = await resposta.json();

            return dados.reservas || [];

        } catch (erro) {

            return [];

        }
    },


    // LISTAR SALAS
    async listarSalas() {

        try {

            const resposta = await fetch(`${BASE_URL}/reservas/salas`, {
                headers: headersAuth()
            });

            const dados = await resposta.json();

            return dados.salas || [];

        } catch (erro) {

            return [];

        }
    },


    // LOGOUT
    sair() {
        localStorage.removeItem('token');
    }

};


// EXPORTAR
window.apiServico = apiServico;