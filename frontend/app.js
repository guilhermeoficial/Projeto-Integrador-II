const { createApp, ref, computed, watch } = Vue;

const validarCPF = (cpf) => {
    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    return cpf.length === 11;
};

createApp({
    setup() {
        const tela = ref('login');
        const usuarioLogado = ref(null);
        const abaAtiva = ref('salas');

        const salasDisponiveis = ref([]);
        const salaEscolhida = ref(null);
        const minhasReservas = ref([]);

        const formLogin = ref({ cpf: '', senha: '' });
        const formReg = ref({ nome: '', email: '', confirmacaoEmail: '', setor: '', cpf: '', senha: '', confirmacaoSenha: '' });

        const mes = ref(new Date().getMonth());
        const ano = ref(new Date().getFullYear());
        const diaEscolhido = ref(null);
        const horarios = ref([]);
        const diasLotados = ref([]);

        // Olhinho
        const mostrarSenhaLogin = ref(false);
        const mostrarSenhaReg = ref(false);
        const mostrarSenhaRegConf = ref(false);

        // -------------------------------------------------------
        // LOADING
        // -------------------------------------------------------
        const carregando = ref(false);
        const carregandoHorarios = ref(false);

        // -------------------------------------------------------
        // TOAST
        // -------------------------------------------------------
        const toasts = ref([]);

        const mostrarToast = (mensagem, tipo = 'sucesso') => {
            const id = Date.now();
            toasts.value.push({ id, mensagem, tipo });
            setTimeout(() => {
                toasts.value = toasts.value.filter(t => t.id !== id);
            }, 3500);
        };

        const fecharToast = (id) => {
            toasts.value = toasts.value.filter(t => t.id !== id);
        };

        // -------------------------------------------------------
        // MODAL DE CONFIRMAÇÃO
        // -------------------------------------------------------
        const modal = ref({ visivel: false, mensagem: '', reserva: null });

        const abrirModal = (reserva) => {
            modal.value = { visivel: true, reserva };
        };

        const fecharModal = () => {
            modal.value = { visivel: false, mensagem: '', reserva: null };
        };

        const confirmarCancelamento = async () => {
            const reserva = modal.value.reserva;
            fecharModal();
            const resposta = await apiServico.cancelarReserva(reserva.id_reserva);
            if (resposta.sucesso) {
                mostrarToast('Reserva cancelada com sucesso.');
                await atualizarMinhasReservas();
                if (abaAtiva.value === 'salas' && diaEscolhido.value) {
                    await selecionarDia(diaEscolhido.value);
                }
                await carregarOcupacaoCalendario();
            } else {
                mostrarToast(resposta.erro || 'Erro ao cancelar reserva.', 'erro');
            }
        };

        // -------------------------------------------------------
        // PERSISTÊNCIA DE LOGIN
        // -------------------------------------------------------
        const usuarioSalvo = localStorage.getItem('usuario');
        if (usuarioSalvo && localStorage.getItem('token')) {
            usuarioLogado.value = JSON.parse(usuarioSalvo);
            tela.value = 'painel';
        }

        // -------------------------------------------------------
        // CARREGAR SALAS
        // -------------------------------------------------------
        const carregarSalas = async () => {
            const dados = await apiServico.listarSalas();
            salasDisponiveis.value = dados;
        };

        // -------------------------------------------------------
        // MINHAS RESERVAS
        // -------------------------------------------------------
        const atualizarMinhasReservas = async () => {
            if (usuarioLogado.value) {
                minhasReservas.value = await apiServico.buscarMinhasReservas();
            }
        };

        // -------------------------------------------------------
        // OCUPAÇÃO DO CALENDÁRIO
        // -------------------------------------------------------
        const carregarOcupacaoCalendario = async () => {
            if (salaEscolhida.value) {
                diasLotados.value = await apiServico.buscarOcupacaoMes(
                    salaEscolhida.value.id_sala,
                    mes.value,
                    ano.value
                );
            }
        };

        watch([mes, ano, salaEscolhida], async () => {
            await carregarOcupacaoCalendario();
        });

        watch(abaAtiva, async (novaAba) => {
            if (novaAba === 'reservas') {
                await atualizarMinhasReservas();
            } else if (novaAba === 'salas' && salaEscolhida.value) {
                await carregarOcupacaoCalendario();
            }
        });

        if (usuarioLogado.value) {
            carregarSalas();
            atualizarMinhasReservas();
        }

        // -------------------------------------------------------
        // LOGIN
        // -------------------------------------------------------
        const acaoLogin = async () => {
            if (!validarCPF(formLogin.value.cpf)) return mostrarToast('CPF inválido.', 'erro');

            carregando.value = true;
            const resposta = await apiServico.autenticar(formLogin.value.cpf, formLogin.value.senha);
            carregando.value = false;

            if (resposta.sucesso) {
                usuarioLogado.value = resposta.usuario;
                localStorage.setItem('usuario', JSON.stringify(resposta.usuario));
                tela.value = 'painel';
                abaAtiva.value = 'salas';
                await carregarSalas();
                await atualizarMinhasReservas();
            } else {
                mostrarToast(resposta.erro || 'Erro ao fazer login.', 'erro');
            }
        };

        // -------------------------------------------------------
        // REGISTRO
        // -------------------------------------------------------
        const acaoRegistro = async () => {
            if (!validarCPF(formReg.value.cpf)) return mostrarToast('CPF inválido.', 'erro');
            if (formReg.value.email !== formReg.value.confirmacaoEmail) return mostrarToast('Os e-mails não coincidem.', 'erro');
            if (!/^\d{6}$/.test(formReg.value.senha)) return mostrarToast('A senha deve ser numérica e ter 6 dígitos.', 'erro');
            if (formReg.value.senha !== formReg.value.confirmacaoSenha) return mostrarToast('As senhas não coincidem.', 'erro');
            if (!formReg.value.setor) return mostrarToast('O setor é obrigatório.', 'erro');

            carregando.value = true;
            const resposta = await apiServico.registrar(formReg.value);
            carregando.value = false;

            if (resposta.sucesso) {
                mostrarToast('Cadastro realizado! Faça o login.');
                tela.value = 'login';
            } else {
                mostrarToast(resposta.erro || 'Erro ao realizar cadastro.', 'erro');
            }
        };

        // -------------------------------------------------------
        // LOGOUT
        // -------------------------------------------------------
        const sairSistema = () => {
            apiServico.sair();
            localStorage.removeItem('usuario');
            usuarioLogado.value = null;
            salaEscolhida.value = null;
            diaEscolhido.value = null;
            horarios.value = [];
            diasLotados.value = [];
            tela.value = 'login';
        };

        // -------------------------------------------------------
        // CALENDÁRIO
        // -------------------------------------------------------
        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const nomeMesAtual = computed(() => mesesNomes[mes.value]);
        const totalDias = computed(() => new Date(ano.value, mes.value + 1, 0).getDate());
        const offsetDias = computed(() => new Date(ano.value, mes.value, 1).getDay());

        const mudarMes = (direcao) => {
            mes.value += direcao;
            if (mes.value > 11) { mes.value = 0; ano.value++; }
            if (mes.value < 0) { mes.value = 11; ano.value--; }
            diaEscolhido.value = null;
            horarios.value = [];
        };

        const verificarPassado = (dia) => {
            const dataAlvo = new Date(ano.value, mes.value, dia);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);
            return dataAlvo < hoje;
        };

        // -------------------------------------------------------
        // SELECIONAR DIA — com loading
        // -------------------------------------------------------
        const selecionarDia = async (dia) => {
            if (!verificarPassado(dia)) {
                diaEscolhido.value = dia;
                const dataIso = `${ano.value}-${String(mes.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                carregandoHorarios.value = true;
                horarios.value = await apiServico.buscarHorarios(
                    salaEscolhida.value.id_sala,
                    dataIso
                );
                carregandoHorarios.value = false;
            }
        };

        // -------------------------------------------------------
        // RESERVAR — com loading e toast
        // -------------------------------------------------------
        const acaoReservar = async (h) => {
            if (h.minhaReserva) return;

            const dataFormatada = `${String(diaEscolhido.value).padStart(2, '0')}/${String(mes.value + 1).padStart(2, '0')}/${ano.value}`;
            const dataIso = `${ano.value}-${String(mes.value + 1).padStart(2, '0')}-${String(diaEscolhido.value).padStart(2, '0')}`;

            if (h.vago) {
                const [hora_inicio, hora_fim] = h.tempo.split(' - ');
                carregandoHorarios.value = true;
                const resposta = await apiServico.salvarReserva(
                    salaEscolhida.value.id_sala,
                    dataIso,
                    hora_inicio,
                    hora_fim
                );
                carregandoHorarios.value = false;

                if (resposta.sucesso) {
                    mostrarToast(`Reserva confirmada: ${salaEscolhida.value.nome} - ${dataFormatada} às ${h.tempo}`);
                    await selecionarDia(diaEscolhido.value);
                    await carregarOcupacaoCalendario();
                } else {
                    mostrarToast(resposta.erro || 'Erro ao confirmar reserva.', 'erro');
                }
            }
        };

        // -------------------------------------------------------
        // CANCELAR RESERVA — abre modal
        // -------------------------------------------------------
        const acaoCancelarReserva = (reserva) => {
            abrirModal(reserva);
        };

        return {
            tela, usuarioLogado, formLogin, formReg, acaoLogin, acaoRegistro, sairSistema,
            abaAtiva, salasDisponiveis, salaEscolhida, minhasReservas,
            mes, ano, nomeMesAtual, totalDias, offsetDias, mudarMes,
            verificarPassado, diaEscolhido, selecionarDia, horarios, acaoReservar, acaoCancelarReserva, diasLotados,
            mostrarSenhaLogin, mostrarSenhaReg, mostrarSenhaRegConf,
            carregando, carregandoHorarios,
            toasts, fecharToast,
            modal, fecharModal, confirmarCancelamento
        };
    }
}).mount('#app');