const messages = {
  pt: {
    translations: {
      signup: {
        title: "Cadastre-se",
        toasts: {
          success: "Usuário criado com sucesso! Faça seu login!!!.",
          fail: "Erro ao criar usuário. Verifique os dados informados.",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
        },
        buttons: {
          submit: "Cadastrar",
          login: "Já tem uma conta? Entre!",
        },
      },
      login: {
        title: "Login",
        form: {
          email: "Email",
          password: "Senha",
        },
        buttons: {
          submit: "Entrar",
          register: "Registre-se, agora mesmo!",
        },
      },
      plans: {
        form: {
          name: "Nome",
          users: "Usuários",
          connections: "Conexões",
          campaigns: "Campanhas",
          schedules: "Agendamentos",
          enabled: "Habilitadas",
          disabled: "Desabilitadas",
          clear: "Cancelar",
          delete: "Excluir",
          save: "Salvar",
          yes: "Sim",
          no: "Não",
          money: "R$",
        },
      },
      companies: {
        title: "Cadastrar Empresa",
        form: {
          name: "Nome da Empresa",
          plan: "Plano",
          token: "Token",
          submit: "Cadastrar",
          success: "Empresa criada com sucesso!",
        },
      },
      auth: {
        toasts: {
          success: "Login efetuado com sucesso!",
        },
        token: "Token",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Atendimentos hoje: ",
          },
        },
      },
      connections: {
        title: "Conexões",
        subtitle:"Todos os WhatsApp's",
        toasts: {
          deleted: "Conexão com o WhatsApp excluída com sucesso!",
        },
        confirmationModal: {
          deleteTitle: "Deletar",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida.",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "Tem certeza? Você precisará ler o QR Code novamente.",
        },
        buttons: {
          add: "Adicionar WhatsApp",
          disconnect: "desconectar",
          tryAgain: "Tentar novamente",
          qrcode: "QR CODE",
          newQr: "Novo QR CODE",
          connecting: "Conectando",
          restart:"Restart",
        },
        toolTips: {
          disconnected: {
            title: "Falha ao iniciar sessão do WhatsApp",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e tente novamente, ou solicite um novo QR Code",
          },
          qrcode: {
            title: "Esperando leitura do QR Code",
            content:
              "Clique no botão 'QR CODE' e leia o QR Code com o seu celular para iniciar a sessão",
          },
          connected: {
            title: "Conexão estabelecida!",
          },
          timeout: {
            title: "A conexão com o celular foi perdida",
            content:
              "Certifique-se de que seu celular esteja conectado à internet e o WhatsApp esteja aberto, ou clique no botão 'Desconectar' para obter um novo QR Code",
          },
        },
        table: {
          name: "Nome",
		  number: "Número",
          status: "Status",
          lastUpdate: "Última atualização",
          default: "Padrão",
          actions: "Ações",
          session: "Sessão",
        },
      },
      whatsappModal: {
        title: {
          add: "Adicionar WhatsApp",
          edit: "Editar WhatsApp",
        },		
		 tabs: {
          general: "Geral",
          messages: "Mensagens",
          assessments: "Avaliações",
          integrations: "Integrações",
          schedules: "Horário de expediente",
		 },
        form: {
          name: "Nome",
          default: "Padrão",
          sendIdQueue: "Fila",
          timeSendQueue: "Redirecionar para fila em X minutos",
          queueRedirection: "Redirecionamento de Fila",
		  outOfHoursMessage: "Mensagem de fora de expediente",
          queueRedirectionDesc: "Selecione uma fila para os contatos que não possuem fila serem redirecionados",
          prompt: "Prompt",
          //maxUseBotQueues: "Enviar bot x vezes",
          //timeUseBotQueues: "Intervalo em minutos entre envio de bot",
          expiresTicket: "Encerrar chats abertos após x minutos",
          expiresInactiveMessage: "Mensagem de encerramento por inatividade",
		  greetingMessage: "Mensagem de saudação",
          complationMessage: "Mensagem de conclusão",
		  sendIdQueue: "Fila",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "WhatsApp salvo com sucesso.",
      },
      qrCode: {
        message: "Leia o QrCode para iniciar a sessão",
      },
      contacts: {
        title: "Contatos",
        toasts: {
          deleted: "Contato excluído com sucesso!",
		      deletedAll: "Todos contatos excluídos com sucesso!",
        },
		  searchPlaceholder: "Pesquisar...",
          confirmationModal: {
          deleteTitle: "Deletar ",
          deleteAllTitle: "Deletar Todos",
          importTitle: "Importar contatos",
          deleteMessage: "Tem certeza que deseja deletar este contato? Todos os tickets relacionados serão perdidos.",
          deleteAllMessage: "Tem certeza que deseja deletar todos os contatos? Todos os tickets relacionados serão perdidos.",
          importMessage: "Deseja importar todos os contatos do telefone?",
        },
		confirmationModal:{
			importTitlte: "Importar contatos",
			importMessage: "Esta ação irá importar os contatos salvos na agenda do WhatsApp. Alguns modelos podem não permitir essa funcionalidade ou de acordo com sua configuração de privacidade! Verifique em até 1 hora o resultado.",
			deleteTitle:"Deletar",
			deleteMessage:"Tem certeza que deseja deletar este contato? Todos os atendimentos relacionados serão perdidos.",
		},
        buttons: {
          import: "Importar Contatos",
		  importSheet: "Import. Excel",
          add: "Adicionar Contato",
          export: "Exportar Contatos",
          delete: "Excluir Todos Contatos"
        },
        table: {
          name: "Nome",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Ações",
        },
      },
      queueIntegrationModal: {
        title: {
          add: "Adicionar projeto",
          edit: "Editar projeto",
        },
        form: {
          id: "ID",
          type: "Tipo",
          name: "Nome",
          projectName: "Nome do Projeto",
          language: "Linguagem",
          jsonContent: "JsonContent",
          urlN8N: "URL",
          typebotSlug: "Typebot - Slug",
          typebotExpires: "Tempo em minutos para expirar uma conversa",
          typebotKeywordFinish: "Palavra para finalizar o ticket",
          typebotKeywordRestart: "Palavra para reiniciar o fluxo",
          typebotRestartMessage: "Mensagem ao reiniciar a conversa",
          typebotUnknownMessage: "Mensagem de opção inválida",
          typebotDelayMessage: "Intervalo (ms) entre mensagens",   
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
          test: "Testar Bot",
        },
        messages: {
          testSuccess: "Integração testada com sucesso!",
          addSuccess: "Integração adicionada com sucesso.",
          editSuccess: "Integração editada com sucesso.",
        },
      },
	  sideMenu: {
            name: "Menu Lateral Inicial",
            note: "Se habilitado, o menu lateral irá iniciar fechado",
            options: {
              enabled: "Aberto",
              disabled: "Fechado",
            },
          },
      promptModal: {
        form: {
          name: "Nome",
          prompt: "Prompt",
          voice: "Voz",
          max_tokens: "Máximo de Tokens na resposta",
          temperature: "Temperatura",
          apikey: "API Key",
          max_messages: "Máximo de mensagens no Histórico",
          voiceKey: "Chave da API de Voz",
          voiceRegion: "Região de Voz",
        },
        success: "Prompt salvo com sucesso!",
        title: {
          add: "Adicionar Prompt",
          edit: "Editar Prompt",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
      },
      prompts: {
        title: "Prompts",
        table: {
          name: "Nome",
          queue: "Setor/Fila",
          max_tokens: "Máximo Tokens Resposta",
          actions: "Ações",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Você tem certeza? Essa ação não pode ser revertida!",
        },
        buttons: {
          add: "Adicionar Prompt",
        },
      },
      contactModal: {
        title: {
          add: "Adicionar contato",
          edit: "Editar contato",
        },
        form: {
          mainInfo: "Dados do contato",
          extraInfo: "Informações adicionais",
          name: "Nome",
          number: "Número do Whatsapp",
          email: "Email",
          extraName: "Nome do campo",
          extraValue: "Valor",
		  disableBot: "Desabilitar chatbot",
          whatsapp: "Conexão Origem: "
        },
        buttons: {
          addExtraInfo: "Adicionar informação",
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Contato salvo com sucesso.",
      },
      queueModal: {
        title: {
          add: "Adicionar fila",
          edit: "Editar fila",
        },
	toasts: {
          deleted: "Registro excluído",
        },      
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        form: {
          name: "Nome",
          color: "Cor",
          greetingMessage: "Mensagem de saudação",
          complationMessage: "Mensagem de conclusão",
          outOfHoursMessage: "Mensagem de fora de expediente",
          ratingMessage: "Mensagem de avaliação",
          token: "Token",
          orderQueue: "Ordem da fila (Bot)",
          integrationId: "Integração",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
		  attach: "Anexar Arquivo",
        },
		 serviceHours: {
          dayWeek: "Dia da semana",
          startTimeA: "Hora Inicial - 1",
          endTimeA: "Hora Final - 1",
          startTimeB: "Hora Inicial - 2",
          endTimeB: "Hora Final - 2",
          monday: "Segunda-feira",
          tuesday: "Terça-feira",
          wednesday: "Quarta-feira",
          thursday: "Quinta-feira",
          friday: "Sexta-feira",
          saturday: "Sábado",
          sunday: "Domingo",
        },
      },
      qrCodeModal:{
        title:"QrCode",
      },
      userModal: {
        title: {
          add: "Adicionar usuário",
          edit: "Editar usuário",
        },
        form: {
          name: "Nome",
          email: "Email",
          password: "Senha",
          profile: "Perfil",
          whatsapp: "Conexão Padrão",
          SuperIs: 'DEFINIR SUPERUSER (Somente Admin)',
          allTicket: "Ticket Sem Fila [Invisível]",
          allTicketEnabled: "Habilitado",
          allTicketDesabled: "Desabilitado",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Usuário salvo com sucesso.",
      },
      scheduleModal: {
        title: {
          add: "Novo Agendamento",
          edit: "Editar Agendamento",
        },
        form: {
          body: 'Mensagem',
          contact: 'Contato',
          sendAt: 'Data de Agendamento',
          sentAt: 'Data de Envio',
          geral: 'Abrir Ticket?',
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Agendamento salvo com sucesso.",
      },
      tagModal: {
        title: {
          add: "Nova Tag",
          edit: "Editar Tag",
        },
        form: {
          name: "Nome",
          color: "Cor",
        },
        buttons: {
          okAdd: "Adicionar",
          okEdit: "Salvar",
          cancel: "Cancelar",
        },
        success: "Tag salvo com sucesso.",
      },
      chat: {
        noTicketMessage: "Selecione um ticket para começar a conversar.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTE E SOLTE ARQUIVOS NO CAMPO ABAIXO",
          titleFileList: "Lista de arquivo(s)"
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Novo",
          closeallTicket: "Fechar"
        },
      },
      ticketsQueueSelect: {
        placeholder: "Filas",
      },
      tickets: {
        inbox: {
          closedAllTickets: "Fechar todos os tickets?",
          closedAll: "Fechar Todos",
          newTicket: "Novo Ticket",
          yes: "SIM",
          no: "NÃO",
          open: "Abertos",
          resolverd: "Resolvidos",
        },
        toasts: {
          deleted: "O atendimento que você estava foi deletado.",
        },
        notification: {
          message: "Mensagem de",
        },
        tabs: {
          open: { title: "Abertas" },
          closed: { title: "Resolvidos" },
          search: { title: "Busca" },
        },
        search: {
          placeholder: "Buscar atendimento e mensagens",
          filterConnections: "Filtro por conexões",
          filterContacts: "Filtro por contato",
          filterConections: "Filtro por Conexão",
          filterConectionsOptions: {
            open: "Aberto",
            closed: "Fechado",
            pending: "Pendente",
          },
          filterUsers: "Filtro por Usuarios",
          ticketsPerPage: "Tickets por página"
        },
        buttons: {
          showAll: "Todos",
        },
      },
      transferTicketModal: {
        title: "Transferir Ticket",
        fieldLabel: "Digite para buscar usuários",
        fieldQueueLabel: "Transferir para fila",
        fieldQueuePlaceholder: "Selecione uma fila",
        noOptions: "Nenhum usuário encontrado com esse nome",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar",
        },
      },
      ticketsList: {
        called: "Chamado",
        pendingHeader: "Aguardando",
        assignedHeader: "Atendendo",
        noTicketsTitle: "Nada aqui!",
        noTicketsMessage:
          "Nenhum atendimento encontrado com esse status ou termo pesquisado",
        buttons: {
          accept: "Aceitar",
          closed: "Finalizar",
		  transfer: "Transferir",
          reopen: "Reabrir",
		  exportAsPDF: "Exportar em PDF"
        },
      },
      newTicketModal: {
        title: "Criar Ticket",
        fieldLabel: "Digite para pesquisar o contato",
        add: "Adicionar",
        buttons: {
          ok: "Salvar",
          cancel: "Cancelar",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Dashboard",
          connections: "Conexões",
          tickets: "Atendimentos",
          quickMessages: "Respostas Rápidas",
          contacts: "Contatos",
          queues: "Filas & Chatbot",
          tags: "Tags",
          administration: "Administração",
          users: "Usuários",
          settings: "Configurações",
          helps: "Ajuda",
          messagesAPI: "API",
          schedules: "Agendamentos",
          campaigns: "Campanhas",
          annoucements: "Informativos",
          loglauncher:"Atualizações",
          chats: "Chat Interno",
          financeiro: "Financeiro",
          files: "Lista de arquivos",
          prompts: "Open.Ai",
		  reports: "Relatórios",
          queueIntegration: "Integrações",
        },
        appBar: {
          notRegister:"Sem notificações",
          user: {
            profile: "Perfil",
            logout: "Sair",
          },
        },
      },
      queueIntegration: {
        title: "Integrações",
        table: {
          id: "ID",
          type: "Tipo",
          name: "Nome",
          projectName: "Nome do Projeto",
          language: "Linguagem",
          lastUpdate: "Ultima atualização",
          actions: "Ações",
        },
        buttons: {
          add: "Adicionar Projeto",
        },
        searchPlaceholder: "Pesquisar...",
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Você tem certeza? Essa ação não pode ser revertida! e será removida das filas e conexões vinculadas",
        },
      },
	reports: {
        title: "Relatórios de Atendimentos",
        table: {
          id: "Ticket",
          user: "Usuário",
          dateOpen: "Data Abertura",
          dateClose: "Data Fechamento",
          NPS: "NPS",
          status: "Status",
          whatsapp: "Conexão",
          queue: "Fila",
          actions: "Ações",
          lastMessage: "Últ. Mensagem",
          contact: "Cliente",
          supportTime: "Tempo de Atendimento"
        },
        buttons: {
          filter: "Aplicar Filtro",
        },
        searchPlaceholder: "Pesquisar...",
      },	  
      files: {
        title: "Lista de arquivos",
        table: {
          name: "Nome",
          contacts: "Contatos",
          actions: "Ação",
        },
        toasts: {
          deleted: "Lista excluída com sucesso!",
          deletedAll: "Todas as listas foram excluídas com sucesso!",
        },
        buttons: {
          add: "Adicionar",
          deleteAll: "Deletar Todos",
        },
        confirmationModal: {
          deleteTitle: "Deletar",
          deleteAllTitle: "Deletar Todos",
          deleteMessage: "Tem certeza que deseja deletar esta lista?",
          deleteAllMessage: "Tem certeza que deseja deletar todas as listas?",
        },
      },
      languages: {
        undefined: "Idioma",
        "pt-BR": "Português",
        es: "Español",
        en: "English",
        tr: "Türkçe",
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensagem",
          token: "Token cadastrado",
        },
        mediaMessage: {
          number: "Número",
          body: "Nome do arquivo",
          media: "Arquivo",
          token: "Token cadastrado",
        },
      },
      notifications: {
        noTickets: "Nenhuma notificação.",
      },
      quickMessages: {
        title: "Respostas Rápidas",
        searchPlaceholder: "Pesquisar...",
        noAttachment: "Sem anexo",
        confirmationModal: {
          deleteTitle: "Exclusão",
          deleteMessage: "Esta ação é irreversível! Deseja prosseguir?",
        },
        buttons: {
          add: "Adicionar",
          attach: "Anexar Arquivo",
          cancel: "Cancelar",
          edit: "Editar",
        },
        toasts: {
          success: "Atalho adicionado com sucesso!",
          deleted: "Atalho removido com sucesso!",
        },
        dialog: {
          title: "Mensagem Rápida",
          shortcode: "Atalho",
          message: "Resposta",
          save: "Salvar",
          cancel: "Cancelar",
          geral: "Permitir editar",
          add: "Adicionar",
          edit: "Editar",
          visao: "Permitir visão",
		  geral: 'Global',
        },
        table: {
          shortcode: "Atalho",
          message: "Mensagem",
          actions: "Ações",
          mediaName: "Nome do Arquivo",
          status: 'Global',
        },
      },
      messageVariablesPicker: {
        label: "Variavéis disponíveis",
        vars: {
          contactFirstName: "Primeiro Nome",
          contactName: "Nome",
          greeting: "Saudação",
          protocolNumber: "Protocolo",
          date: "Data",
          hour: "Hora",
        },
      },
      contactLists: {
        title: "Listas de Contatos",
        table: {
          name: "Nome",
          contacts: "Contatos",
          actions: "Ações",
        },
        buttons: {
          add: "Nova Lista",
        },
        dialog: {
          name: "Nome",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        toasts: {
          deleted: "Registro excluído",
        },
      },
      contactListItems: {
        title: "Contatos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo",
          lists: "Listas",
          import: "Importar",
        },
        dialog: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          okEdit: "Editar",
          okAdd: "Adicionar",
          add: "Adicionar",
          edit: "Editar",
          cancel: "Cancelar",
        },
        table: {
          name: "Nome",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          actions: "Ações",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
          importMessage: "Deseja importar os contatos desta planilha? ",
          importTitlte: "Importar",
        },
        toasts: {
          deleted: "Registro excluído",
        },
      },
      campaigns: {
        title: "Campanhas",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Nova Campanha",
          contactLists: "Listas de Contatos",
        },
        table: {
          name: "Nome",
          whatsapp: "Conexão",
          contactList: "Lista de Contatos",
          status: "Status",
          scheduledAt: "Agendamento",
          completedAt: "Concluída",
          confirmation: "Confirmação",
          actions: "Ações",
        },
        dialog: {
          new: "Nova Campanha",
          update: "Editar Campanha",
          readonly: "Apenas Visualização",
          form: {
            name: "Nome",
            message1: "Mensagem 1",
            message2: "Mensagem 2",
            message3: "Mensagem 3",
            message4: "Mensagem 4",
            message5: "Mensagem 5",
            confirmationMessage1: "Mensagem de Confirmação 1",
            confirmationMessage2: "Mensagem de Confirmação 2",
            confirmationMessage3: "Mensagem de Confirmação 3",
            confirmationMessage4: "Mensagem de Confirmação 4",
            confirmationMessage5: "Mensagem de Confirmação 5",
            messagePlaceholder: "Conteúdo da mensagem",
            whatsapp: "Conexão",
            status: "Status",
            scheduledAt: "Agendamento",
            confirmation: "Confirmação",
            contactList: "Lista de Contato",
            tagList: "Lista de Tags",
            fileList: "Lista de Arquivos"
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar Disparos",
            restart: "Reiniciar Disparos",
            close: "Fechar",
            attach: "Anexar Arquivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        toasts: {
          success: "Operação realizada com sucesso",
          cancel: "Campanha cancelada",
          restart: "Campanha reiniciada",
          deleted: "Registro excluído",
        },
      },
      announcements: {
        active: 'Ativo',
        inactive: 'Inativo',
        title: "Informativos",
        searchPlaceholder: "Pesquisa",
        buttons: {
          add: "Novo Informativo",
          contactLists: "Listas de Informativos",
        },
        table: {
          priority: "Prioridade",
          title: "Title",
          text: "Texto",
          mediaName: "Arquivo",
          status: "Status",
          actions: "Ações",
        },
        dialog: {
          edit: "Edição de Informativo",
          add: "Novo Informativo",
          update: "Editar Informativo",
          readonly: "Apenas Visualização",
          form: {
            priority: "Prioridade",
            title: "Title",
            text: "Texto",
            mediaPath: "Arquivo",
            status: "Status",
          },
          buttons: {
            add: "Adicionar",
            edit: "Atualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Fechar",
            attach: "Anexar Arquivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        toasts: {
          success: "Operação realizada com sucesso",
          deleted: "Registro excluído",
        },
      },
      campaignsConfig: {
        title: "Configurações de Campanhas",
      },
      queues: {
        title: "Filas & Chatbot",
        table: {
		  id:"ID",
          name: "Nome",
          color: "Cor",
          greeting: "Mensagem de saudação",
          actions: "Ações",
          orderQueue: "Ordenação da fila (bot)",
        },
        buttons: {
          add: "Adicionar fila",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Você tem certeza? Essa ação não pode ser revertida! Os atendimentos dessa fila continuarão existindo, mas não terão mais nenhuma fila atribuída.",
        },
      },
      queueSelect: {
        inputLabel: "Filas",
      },
      users: {
        title: "Usuários",
        table: {
		  id: "ID",
          name: "Nome",
		  status: "Status",
          email: "Email",
          profile: "Perfil",
          actions: "Ações",
        },
		status: {
          online: "Usuários online",
          offline: "Usuários offline",
        },
        buttons: {
          add: "Adicionar usuário",
        },
        toasts: {
          deleted: "Usuário excluído com sucesso.",
        },
        confirmationModal: {
          deleteTitle: "Excluir",
          deleteMessage:
            "Todos os dados do usuário serão perdidos. Os atendimento abertos deste usuário serão movidos para a fila.",
        },
      },
      helps: {
        title: "Central de Ajuda",
      },
      schedules: {
        title: "Agendamentos",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir este Agendamento?",
          deleteMessage: "Esta ação não pode ser revertida.",
        },
        table: {
          contact: "Contato",
          body: "Mensagem",
          sendAt: "Data de Agendamento",
          sentAt: "Data de Envio",
          status: "Status",
          actions: "Ações",
        },
        buttons: {
          add: "Novo Agendamento",
        },
        toasts: {
          deleted: "Agendamento excluído com sucesso.",
        },
      },
      tags: {
        title: "Tags",
        confirmationModal: {
          deleteTitle: "Você tem certeza que quer excluir esta Tag?",
          deleteMessage: "Esta ação não pode ser revertida.",
		  deleteAllMessage: "Tem certeza que deseja deletar todas as Tags?",
		  deleteAllTitle: "Deletar Todos",
        },
        table: {
          name: "Nome",
          color: "Cor",
          tickets: "Registros Tagdos",
          actions: "Ações",
        },
        buttons: {
          add: "Nova Tag",
		  deleteAll: "Deletar Todas",
        },
        toasts: {
		  deletedAll: "Todas Tags excluídas com sucesso!",
          deleted: "Tag excluído com sucesso.",
        },
      },
      settings: {
        success: "Configurações salvas com sucesso.",
        title: "Configurações",
        settings: {
          userCreation: {
            name: "Criação de usuário",
            options: {
              enabled: "Ativado",
              disabled: "Desativado",
            },
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Atribuído à:",
          buttons: {
            return: "Retornar",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceitar",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Digite uma mensagem",
        placeholderClosed:
          "Reabra ou aceite esse ticket para enviar uma mensagem.",
        signMessage: "Assinar",
      },
      mediaModal: {
        title: "Enviar Mídia",
        caption: "Legenda (opcional)",
        captionPlaceholder: "Digite uma legenda para o arquivo...",
        addMore: "Adicionar mais",
        dragDropText: "Solte os arquivos aqui para enviar",
        buttons: {
          cancel: "Cancelar",
          send: "Enviar",
        },
        maxFiles: "Máximo de 10 arquivos permitidos",
      },
      messageSearch: {
        placeholder: "Buscar mensagens...",
        noResults: "Nenhuma mensagem encontrada",
        searchButton: "Buscar mensagens",
      },
      contactDrawer: {
        header: "Dados do contato",
        buttons: {
          edit: "Editar contato",
        },
        extraInfo: "Outras informações",
      },
      fileModal: {
        title: {
          add: "Adicionar lista de arquivos",
          edit: "Editar lista de arquivos",
        },
        buttons: {
          okAdd: "Salvar",
          okEdit: "Editar",
          cancel: "Cancelar",
          fileOptions: "Adicionar arquivo",
        },
        form: {
          name: "Nome da lista de arquivos",
          message: "Detalhes da lista",
          fileOptions: "Lista de arquivos",
          extraName: "Mensagem para enviar com arquivo",
          extraValue: "Valor da opção",
        },
        success: "Lista de arquivos salva com sucesso!",
      },
      ticketOptionsMenu: {
        schedule: "Agendamento",
        delete: "Deletar",
        transfer: "Transferir",
        registerAppointment: "Observações do Contato",
        appointmentsModal: {
          title: "Observações do Contato",
          textarea: "Observação",
          placeholder: "Insira aqui a informação que deseja registrar",
        },
        confirmationModal: {
          title: "Deletar o ticket",
		  titleFrom: "do contato ",
          message:
            "Atenção! Todas as mensagens relacionadas ao ticket serão perdidas.",
        },
        buttons: {
          delete: "Excluir",
          cancel: "Cancelar",
        },
      },
      confirmationModal: {
        buttons: {
          confirm: "Ok",
          cancel: "Cancelar",
        },
      },
      messageOptionsMenu: {
        delete: "Deletar",
		reactionSuccess: "Reação add",
        reply: "Responder",
		edit: 'Editar Mensagem',
		forward: "Encaminhar",
        toForward: "Encaminhar",
		react: "Reagir",
        confirmationModal: {
          title: "Apagar mensagem?",
          message: "Esta ação não pode ser revertida.",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Deve haver pelo menos um WhatsApp padrão.",
        ERR_NO_DEF_WAPP_FOUND:
          "Nenhum WhatsApp padrão encontrado. Verifique a página de conexões.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sessão do WhatsApp não foi inicializada. Verifique a página de conexões.",
        ERR_WAPP_CHECK_CONTACT:
          "Não foi possível verificar o contato do WhatsApp. Verifique a página de conexões",
        ERR_WAPP_INVALID_CONTACT: "Este não é um número de Whatsapp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "Não foi possível baixar mídia do WhatsApp. Verifique a página de conexões.",
        ERR_INVALID_CREDENTIALS:
          "Erro de autenticação. Por favor, tente novamente.",
        ERR_SENDING_WAPP_MSG:
          "Erro ao enviar mensagem do WhatsApp. Verifique a página de conexões.",
        ERR_DELETE_WAPP_MSG: "Não foi possível excluir a mensagem do WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Já existe um tíquete aberto para este contato.",
        ERR_SESSION_EXPIRED: "Sessão expirada. Por favor entre.",
        ERR_USER_CREATION_DISABLED:
          "A criação do usuário foi desabilitada pelo administrador.",
        ERR_NO_PERMISSION: "Você não tem permissão para acessar este recurso.",
        ERR_DUPLICATED_CONTACT: "Já existe um contato com este número.",
        ERR_NO_SETTING_FOUND: "Nenhuma configuração encontrada com este ID.",
        ERR_NO_CONTACT_FOUND: "Nenhum contato encontrado com este ID.",
        ERR_NO_TICKET_FOUND: "Nenhum tíquete encontrado com este ID.",
        ERR_NO_USER_FOUND: "Nenhum usuário encontrado com este ID.",
        ERR_NO_WAPP_FOUND: "Nenhum WhatsApp encontrado com este ID.",
        ERR_CREATING_MESSAGE: "Erro ao criar mensagem no banco de dados.",
        ERR_CREATING_TICKET: "Erro ao criar tíquete no banco de dados.",
        ERR_FETCH_WAPP_MSG:
          "Erro ao buscar a mensagem no WhtasApp, talvez ela seja muito antiga.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Esta cor já está em uso, escolha outra.",
        ERR_WAPP_GREETING_REQUIRED:
          "A mensagem de saudação é obrigatório quando há mais de uma fila.",
        ERR_CHECK_NUMBER: "Número inválido. Verifique o número e tente novamente.",
      },
    },
  },
};

export { messages };