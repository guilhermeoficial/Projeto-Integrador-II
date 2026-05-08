# Sistema de Gestão de Reservas

Este projeto foi desenvolvido para a disciplina de Projeto Integrador. Consiste em uma aplicação web para a gestão de reservas de salas de reunião.

## Tecnologias Utilizadas
* **Vue.js:** Utilizado para a gestão da reatividade e dos estados da aplicação.
* **Tailwind CSS:** Utilizado para garantir uma interface moderna e responsiva.
* **JavaScript:** Aplicado na manipulação de datas e na lógica do calendário.
* **HTML5:** Base para a estruturação semântica da aplicação.

## Estrutura de Arquivos
* `index.html`: Arquivo principal com a estrutura da página.
* `app.js`: Contém a lógica do front-end e os estados do Vue.
* `api.js`: Implementa a simulação do banco de dados (Mock API) através de Promises.
* `style.css`: Contém as personalizações visuais adicionais.

## Instruções de Execução
A aplicação utiliza bibliotecas via CDN, o que dispensa a instalação de dependências locais.
1. Baixe ou clone os arquivos deste repositório.
2. Abra o arquivo `index.html` em um navegador moderno.

## Credenciais de Teste
O sistema utiliza dados simulados definidos no arquivo `api.js`. Utilize as contas abaixo para testar as funcionalidades:

**Usuário Comum**
* **CPF:** `00000000000` | **Senha:** `000000`
* **CPF:** `11111111111` | **Senha:** `111111`

**Usuário Sentinela (Acesso Especial)**
* **CPF:** `22222222222` | **Senha:** `222222`

## Funcionalidades Implementadas
* Registro e login de usuários com validação de CPF.
* Calendário reativo com identificação de disponibilidade.
* Seleção de horários em tempo real.
* Gestão de reservas com opção de cancelamento.
* Visualização de nomes e setores restrita ao perfil Sentinela.
* Interface adaptável para desktop e dispositivos móveis.