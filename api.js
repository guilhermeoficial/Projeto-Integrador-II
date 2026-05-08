// mock db (substituir por api rest)
const hoje = new Date();
const dataIsoCheia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate() + 2).padStart(2, '0')}`;
const dataFormatadaCheia = `17/${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;

// setup inicial para teste de dias lotados
let mockBancoDeDados = [
    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', 
    '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'
].map((h, i) => ({
    id: 1000 + i,
    usuarioId: 2,
    nomeUsuario: 'usuario_teste2',
    setorUsuario: 'TI',         
    sala: 'Sala A',
    data: dataFormatadaCheia,
    dataIso: dataIsoCheia, // data padrao ISO para ordenacao
    horario: h,
    status: 'Confirmada'
}));

const apiServico = {
    async autenticar(cpf, senha) {
        // TODO: integrar endpoint /auth/login
        return new Promise((resolve) => {
            setTimeout(() => {
                if (cpf === '00000000000' && senha === '000000') {
                    resolve({ sucesso: true, usuario: { id: 1, nome: 'usuario_teste1', cpf: cpf, setor: 'Administração' } });
                } else if (cpf === '11111111111' && senha === '111111') {
                    resolve({ sucesso: true, usuario: { id: 2, nome: 'usuario_3', cpf: cpf, setor: 'TI' } });
                } else if (cpf === '22222222222' && senha === '222222') {
                    resolve({ sucesso: true, usuario: { id: 3, nome: 'Sentinela', cpf: cpf, role: 'sentinela', setor: 'Diretoria' } });
                } else {
                    resolve({ sucesso: false, erro: 'Credenciais inválidas.' });
                }
            }, 500);
        });
    },
    
    async registrar(dados) {
        // TODO: integrar endpoint /users
        return new Promise((resolve) => setTimeout(() => resolve({ sucesso: true }), 800));
    },

    async buscarOcupacaoMes(sala, mes, ano) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const diasLotados = [];
                const diasNoMes = new Date(ano, mes + 1, 0).getDate();
                
                for(let dia = 1; dia <= diasNoMes; dia++) {
                    const dataIso = `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                    const reservasConfirmadas = mockBancoDeDados.filter(r => r.sala === sala && r.dataIso === dataIso && r.status === 'Confirmada');
                    
                    if (reservasConfirmadas.length >= 8) { 
                        diasLotados.push(dia); 
                    }
                }
                resolve(diasLotados);
            }, 100);
        });
    },
    
    async buscarHorarios(sala, dataIso, usuarioId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const horariosDoDia = [
                    '08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', 
                    '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'
                ];
                
                const resultado = horariosDoDia.map(tempo => {
                    const confirmada = mockBancoDeDados.find(r => r.sala === sala && r.dataIso === dataIso && r.horario === tempo && r.status === 'Confirmada');
                    // const minhaFila = mockBancoDeDados.find(r => r.sala === sala && r.dataIso === dataIso && r.horario === tempo && r.usuarioId === usuarioId && r.status === 'Fila de Espera');

                    let h = { tempo: tempo, vago: true, minhaReserva: false, detalhesReserva: null };

                    if (confirmada) {
                        h.vago = false; 
                        h.detalhesReserva = { nome: confirmada.nomeUsuario, setor: confirmada.setorUsuario };
                        if (confirmada.usuarioId === usuarioId) h.minhaReserva = true; 
                    }
                    /* if (minhaFila) {
                        h.naFila = true; 
                    } */
                    return h;
                });
                resolve(resultado);
            }, 200);
        });
    },
    
    async salvarReserva(usuarioId, nome, setor, sala, dataFormatada, dataIso, horario, tipoStatus) {
        return new Promise((resolve) => {
            setTimeout(() => {
                mockBancoDeDados.push({
                    id: Date.now() + Math.floor(Math.random() * 1000), 
                    usuarioId: usuarioId,
                    nomeUsuario: nome,  // Agora o nome é gravado na reserva
                    setorUsuario: setor, // Agora o setor é gravado na reserva
                    sala: sala,
                    data: dataFormatada,
                    dataIso: dataIso,
                    horario: horario,
                    status: tipoStatus 
                });
                resolve({ sucesso: true });
            }, 300);
        });
    },
    async cancelarReserva(idReserva) {
        return new Promise((resolve) => {
            setTimeout(() => {
                mockBancoDeDados = mockBancoDeDados.filter(r => r.id !== idReserva);
                resolve({ sucesso: true });
            }, 300);
        });
    },
    
    async buscarMinhasReservas(usuarioId) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const reservasDoUsuario = mockBancoDeDados.filter(r => r.usuarioId === usuarioId).reverse();
                resolve(reservasDoUsuario);
            }, 200);
        });
    }
};