const { createApp, ref, computed, watch } = Vue;

const validarCPF = (cpf) => {
    // bypass mock
    if (cpf === '00000000000') return true;
    if (cpf === '11111111111') return true;
    if (cpf === '22222222222') return true;

    if (!cpf) return false;
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
    let cpfs = cpf.split('').map(el => +el);
    const rest = (count) => (cpfs.slice(0, count-12).reduce((soma, el, i) => soma + el * (count - i), 0) * 10) % 11 % 10;
    return rest(10) === cpfs[9] && rest(11) === cpfs[10];
};

createApp({
    setup() {
        const tela = ref('login');
        const usuarioLogado = ref(null);
        const abaAtiva = ref('salas'); 
        
        const salasDisponiveis = ref(['Sala A', 'Sala B']);
        const salaEscolhida = ref(null);
        const minhasReservas = ref([]);

        const formLogin = ref({ cpf: '', senha: '' });
        const formReg = ref({ nome: '', email: '', confirmacaoEmail: '', setor: '', cpf: '', senha: '', confirmacaoSenha: '' });
        
        const mes = ref(new Date().getMonth());
        const ano = ref(new Date().getFullYear());
        const diaEscolhido = ref(null);
        const horarios = ref([]);
        const diasLotados = ref([]); 

        const atualizarMinhasReservas = async () => {
            if (usuarioLogado.value) {
                minhasReservas.value = await apiServico.buscarMinhasReservas(usuarioLogado.value.id);
            }
        };

        const carregarOcupacaoCalendario = async () => {
            if (salaEscolhida.value) {
                diasLotados.value = await apiServico.buscarOcupacaoMes(salaEscolhida.value, mes.value, ano.value);
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

        const acaoLogin = async () => {
            if (!validarCPF(formLogin.value.cpf)) return alert("CPF inválido.");
            
            const resposta = await apiServico.autenticar(formLogin.value.cpf, formLogin.value.senha);
            if (resposta.sucesso) {
                usuarioLogado.value = resposta.usuario;
                tela.value = 'painel';
                abaAtiva.value = 'salas';
                await atualizarMinhasReservas();
            } else {
                alert(resposta.erro);
            }
        };

        const acaoRegistro = async () => {
            if (!validarCPF(formReg.value.cpf)) return alert("CPF inválido.");
            
            if (formReg.value.email !== formReg.value.confirmacaoEmail) return alert("Os e-mails não coincidem.");
            if (!/^\d{6}$/.test(formReg.value.senha)) return alert("A senha deve ser numérica e ter 6 dígitos.");
            if (formReg.value.senha !== formReg.value.confirmacaoSenha) return alert("As senhas não coincidem.");
            if (!formReg.value.setor) return alert("O setor é obrigatório.");

            await apiServico.registrar(formReg.value);
            alert("Cadastro realizado. Faça o login.");
            tela.value = 'login';
        };

        const sairSistema = () => {
            usuarioLogado.value = null;
            salaEscolhida.value = null;
            diaEscolhido.value = null;
            tela.value = 'login';
        };

        const mesesNomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        const nomeMesAtual = computed(() => mesesNomes[mes.value]);
        const totalDias = computed(() => new Date(ano.value, mes.value + 1, 0).getDate());
        const offsetDias = computed(() => new Date(ano.value, mes.value, 1).getDay());

        const mudarMes = (direcao) => {
            mes.value += direcao;
            if (mes.value > 11) { mes.value = 0; ano.value++; }
            if (mes.value < 0) { mes.value = 11; ano.value--; }
            diaEscolhido.value = null;
        };

        const verificarPassado = (dia) => {
            const dataAlvo = new Date(ano.value, mes.value, dia);
            const hoje = new Date();
            hoje.setHours(0,0,0,0);
            return dataAlvo < hoje;
        };

        const selecionarDia = async (dia) => {
            if (!verificarPassado(dia)) {
                diaEscolhido.value = dia;
                const dataIso = `${ano.value}-${String(mes.value + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
                horarios.value = await apiServico.buscarHorarios(salaEscolhida.value, dataIso, usuarioLogado.value.id);
            }
        };

        const acaoReservar = async (h) => {
            // if (h.minhaReserva || h.naFila) return;
            if (h.minhaReserva) return;

            const dataFormatada = `${String(diaEscolhido.value).padStart(2, '0')}/${String(mes.value + 1).padStart(2, '0')}/${ano.value}`;
            const dataIso = `${ano.value}-${String(mes.value + 1).padStart(2, '0')}-${String(diaEscolhido.value).padStart(2, '0')}`;

            if (h.vago) {
                if (confirm(`Confirmar agendamento: ${salaEscolhida.value} - ${dataFormatada} às ${h.tempo}?`)) {
                    await apiServico.salvarReserva(usuarioLogado.value.id, usuarioLogado.value.nome, usuarioLogado.value.setor, salaEscolhida.value, dataFormatada, dataIso, h.tempo,  'Confirmada');

                    alert("Reserva confirmada.");
                    await selecionarDia(diaEscolhido.value);
                    await carregarOcupacaoCalendario(); 
                }
            }
            /* else {
                if (confirm(`Horário ocupado. Entrar na fila de espera?`)) {
                    await apiServico.salvarReserva(usuarioLogado.value.id, salaEscolhida.value, dataFormatada, dataIso, h.tempo, 'Fila de Espera');
                    alert("Fila de espera confirmada.");
                    await selecionarDia(diaEscolhido.value);
                }
            } */
        };

        const acaoCancelarReserva = async (reserva) => {
            if (confirm(`Cancelar ${reserva.status.toUpperCase()} para ${reserva.sala} no dia ${reserva.data} às ${reserva.horario}?`)) {
                await apiServico.cancelarReserva(reserva.id);
                await atualizarMinhasReservas(); 
                if (abaAtiva.value === 'salas') await carregarOcupacaoCalendario();
            }
        };

        return {
            tela, usuarioLogado, formLogin, formReg, acaoLogin, acaoRegistro, sairSistema,
            abaAtiva, salasDisponiveis, salaEscolhida, minhasReservas,
            mes, ano, nomeMesAtual, totalDias, offsetDias, mudarMes, 
            verificarPassado, diaEscolhido, selecionarDia, horarios, acaoReservar, acaoCancelarReserva, diasLotados
        };
    }
}).mount('#app');