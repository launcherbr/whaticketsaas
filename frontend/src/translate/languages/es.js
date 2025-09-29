const messages = {
  es: {
    translations: {
      signup: {
        title: "Registro",
        toasts: {
          success: "¡Usuario creado con éxito! Por favor, inicie sesión.",
          fail: "Error al crear el usuario. Verifique los datos proporcionados.",
        },
        form: {
          name: "Nombre",
          email: "Email",
          password: "Contraseña",
        },
        buttons: {
          submit: "Registrarse",
          login: "¿Ya tienes una cuenta? ¡Inicia sesión!",
        },
      },
      login: {
        title: "Iniciar Sesión",
        form: {
          email: "Email",
          password: "Contraseña",
        },
        buttons: {
          submit: "Iniciar Sesión",
          register: "¡Regístrate ahora!",
        },
      },
      plans: {
        form: {
          name: "Nombre",
          users: "Usuarios",
          connections: "Conexiones",
          campaigns: "Campañas",
          schedules: "Agendamientos",
          enabled: "Habilitado",
          disabled: "Deshabilitado",
          clear: "Cancelar",
          delete: "Eliminar",
          save: "Guardar",
          yes: "Sí",
          no: "No",
          money: "$",
        },
      },
      companies: {
        title: "Registrar Empresa",
        form: {
          name: "Nombre de la Empresa",
          plan: "Plan",
          token: "Token",
          submit: "Registrar",
          success: "¡Empresa creada con éxito!",
        },
      },
      auth: {
        toasts: {
          success: "¡Inicio de sesión exitoso!",
        },
        token: "Token",
      },
      dashboard: {
        charts: {
          perDay: {
            title: "Tickets hoy: ",
          },
        },
      },
      connections: {
        title: "Conexiones",
        subtitle: "Todos los WhatsApp",
        toasts: {
          deleted: "¡Conexión de WhatsApp eliminada con éxito!",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede revertir. ¿Estás seguro?",
          disconnectTitle: "Desconectar",
          disconnectMessage:
            "¿Estás seguro? Tendrás que escanear el código QR de nuevo.",
        },
        buttons: {
          add: "Añadir WhatsApp",
          disconnect: "Desconectar",
          tryAgain: "Intentar de nuevo",
          qrcode: "CÓDIGO QR",
          newQr: "Nuevo CÓDIGO QR",
          connecting: "Conectando",
          restart: "Reiniciar",
        },
        toolTips: {
          disconnected: {
            title: "Error al iniciar la sesión de WhatsApp",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet e inténtalo de nuevo, o solicita un nuevo código QR",
          },
          qrcode: {
            title: "Esperando la lectura del código QR",
            content:
              "Haz clic en el botón 'CÓDIGO QR' y escanea el código QR con tu teléfono para iniciar la sesión",
          },
          connected: {
            title: "¡Conexión establecida!",
          },
          timeout: {
            title: "Se perdió la conexión con el teléfono",
            content:
              "Asegúrate de que tu teléfono esté conectado a internet y WhatsApp esté abierto, o haz clic en el botón 'Desconectar' para obtener un nuevo código QR",
          },
        },
        table: {
          name: "Nombre",
          number: "Número",
          status: "Estado",
          lastUpdate: "Última actualización",
          default: "Predeterminado",
          actions: "Acciones",
          session: "Sesión",
        },
      },
      whatsappModal: {
        title: {
          add: "Añadir WhatsApp",
          edit: "Editar WhatsApp",
        },
        tabs: {
          general: "General",
          messages: "Mensajes",
          assessments: "Evaluaciones",
          integrations: "Integraciones",
          schedules: "Horario de atención",
        },
        form: {
          name: "Nombre",
          default: "Predeterminado",
          sendIdQueue: "Cola",
          timeSendQueue: "Redirigir a la cola en X minutos",
          queueRedirection: "Redirección de Cola",
          outOfHoursMessage: "Mensaje fuera de horario",
          queueRedirectionDesc: "Selecciona una cola a la que se redirigirán los contactos que no tienen cola",
          prompt: "Prompt",
          expiresTicket: "Cerrar chats abiertos después de X minutos",
          expiresInactiveMessage: "Mensaje de cierre por inactividad",
          greetingMessage: "Mensaje de bienvenida",
          complationMessage: "Mensaje de finalización",
          sendIdQueue: "Cola",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "WhatsApp guardado con éxito.",
      },
      qrCode: {
        message: "Escanea el código QR para iniciar la sesión",
      },
      contacts: {
        title: "Contactos",
        toasts: {
          deleted: "¡Contacto eliminado con éxito!",
          deletedAll: "¡Todos los contactos eliminados con éxito!",
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar ",
          deleteAllTitle: "Eliminar Todos",
          importTitle: "Importar contactos",
          deleteMessage: "¿Estás seguro de que deseas eliminar este contacto? Todos los tickets relacionados se perderán.",
          deleteAllMessage: "¿Estás seguro de que deseas eliminar todos los contactos? Todos los tickets relacionados se perderán.",
          importMessage: "¿Quieres importar todos los contactos de tu teléfono?",
        },
        confirmationModal: {
          importTitlte: "Importar contactos",
          importMessage: "Esta acción importará los contactos guardados en la agenda de WhatsApp. Algunos modelos pueden no permitir esta funcionalidad o según tu configuración de privacidad. ¡Verifica el resultado en 1 hora!",
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro de que deseas eliminar este contacto? Todos los tickets relacionados se perderán.",
        },
        buttons: {
          import: "Importar Contactos",
          importSheet: "Importar Excel",
          add: "Añadir Contacto",
          export: "Exportar Contactos",
          delete: "Eliminar Todos los Contactos"
        },
        table: {
          name: "Nombre",
          whatsapp: "WhatsApp",
          email: "Email",
          actions: "Acciones",
        },
      },
      queueIntegrationModal: {
        title: {
          add: "Añadir proyecto",
          edit: "Editar proyecto",
        },
        form: {
          id: "ID",
          type: "Tipo",
          name: "Nombre",
          projectName: "Nombre del Proyecto",
          language: "Idioma",
          jsonContent: "JsonContent",
          urlN8N: "URL",
          typebotSlug: "Typebot - Slug",
          typebotExpires: "Tiempo en minutos para que expire una conversación",
          typebotKeywordFinish: "Palabra clave para finalizar el ticket",
          typebotKeywordRestart: "Palabra clave para reiniciar el flujo",
          typebotRestartMessage: "Mensaje al reiniciar la conversación",
          typebotUnknownMessage: "Mensaje de opción inválida",
          typebotDelayMessage: "Intervalo (ms) entre mensajes",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
          test: "Probar Bot",
        },
        messages: {
          testSuccess: "¡Integración probada con éxito!",
          addSuccess: "Integración añadida con éxito.",
          editSuccess: "Integración editada con éxito.",
        },
      },
      sideMenu: {
        name: "Menú lateral inicial",
        note: "Si está habilitado, el menú lateral se iniciará cerrado",
        options: {
          enabled: "Abierto",
          disabled: "Cerrado",
        },
      },
      promptModal: {
        form: {
          name: "Nombre",
          prompt: "Prompt",
          voice: "Voz",
          max_tokens: "Máximo de tokens en la respuesta",
          temperature: "Temperatura",
          apikey: "Clave de API",
          max_messages: "Máximo de mensajes en el historial",
          voiceKey: "Clave de API de voz",
          voiceRegion: "Región de voz",
        },
        success: "¡Prompt guardado con éxito!",
        title: {
          add: "Añadir Prompt",
          edit: "Editar Prompt",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
      },
      prompts: {
        title: "Prompts",
        table: {
          name: "Nombre",
          queue: "Departamento/Cola",
          max_tokens: "Máximo de tokens en la respuesta",
          actions: "Acciones",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "¿Estás seguro? Esta acción no se puede revertir.",
        },
        buttons: {
          add: "Añadir Prompt",
        },
      },
      contactModal: {
        title: {
          add: "Añadir contacto",
          edit: "Editar contacto",
        },
        form: {
          mainInfo: "Datos del contacto",
          extraInfo: "Información adicional",
          name: "Nombre",
          number: "Número de Whatsapp",
          email: "Email",
          extraName: "Nombre del campo",
          extraValue: "Valor",
          disableBot: "Deshabilitar chatbot",
          whatsapp: "Conexión de Origen:",
        },
        buttons: {
          addExtraInfo: "Añadir información",
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Contacto guardado con éxito.",
      },
      queueModal: {
        title: {
          add: "Añadir cola",
          edit: "Editar cola",
        },
        toasts: {
          deleted: "Registro eliminado",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        form: {
          name: "Nombre",
          color: "Color",
          greetingMessage: "Mensaje de bienvenida",
          complationMessage: "Mensaje de finalización",
          outOfHoursMessage: "Mensaje fuera de horario",
          ratingMessage: "Mensaje de calificación",
          token: "Token",
          orderQueue: "Orden de la cola (Bot)",
          integrationId: "Integración",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
          attach: "Adjuntar Archivo",
        },
        serviceHours: {
          dayWeek: "Día de la semana",
          startTimeA: "Hora de inicio - 1",
          endTimeA: "Hora de finalización - 1",
          startTimeB: "Hora de inicio - 2",
          endTimeB: "Hora de finalización - 2",
          monday: "Lunes",
          tuesday: "Martes",
          wednesday: "Miércoles",
          thursday: "Jueves",
          friday: "Viernes",
          saturday: "Sábado",
          sunday: "Domingo",
        },
      },
      qrCodeModal: {
        title: "Código QR",
      },
      userModal: {
        title: {
          add: "Añadir usuario",
          edit: "Editar usuario",
        },
        form: {
          name: "Nombre",
          email: "Email",
          password: "Contraseña",
          profile: "Perfil",
          whatsapp: "Conexión por defecto",
          SuperIs: "DEFINIR SUPERUSUARIO (Solo Admin)",
          allTicket: "Tickets sin cola [Invisible]",
          allTicketEnabled: "Habilitado",
          allTicketDesabled: "Deshabilitado",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Usuario guardado con éxito.",
      },
      scheduleModal: {
        title: {
          add: "Nuevo agendamiento",
          edit: "Editar agendamiento",
        },
        form: {
          body: "Mensaje",
          contact: "Contacto",
          sendAt: "Fecha de agendamiento",
          sentAt: "Fecha de envío",
          geral: "¿Abrir Ticket?",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Agendamiento guardado con éxito.",
      },
      tagModal: {
        title: {
          add: "Nueva Etiqueta",
          edit: "Editar Etiqueta",
        },
        form: {
          name: "Nombre",
          color: "Color",
        },
        buttons: {
          okAdd: "Añadir",
          okEdit: "Guardar",
          cancel: "Cancelar",
        },
        success: "Etiqueta guardada con éxito.",
      },
      chat: {
        noTicketMessage: "Selecciona un ticket para empezar a chatear.",
      },
      uploads: {
        titles: {
          titleUploadMsgDragDrop: "ARRASTRA Y SUELTA LOS ARCHIVOS EN EL CAMPO DE ABAJO",
          titleFileList: "Lista de archivos"
        },
      },
      ticketsManager: {
        buttons: {
          newTicket: "Nuevo",
          closeallTicket: "Cerrar"
        },
      },
      ticketsQueueSelect: {
        placeholder: "Colas",
      },
      tickets: {
        inbox: {
          closedAllTickets: "¿Cerrar todos los tickets?",
          closedAll: "Cerrar Todos",
          newTicket: "Nuevo Ticket",
          yes: "SÍ",
          no: "NO",
          open: "Abiertos",
          resolverd: "Resueltos",
        },
        toasts: {
          deleted: "El ticket que estabas viendo ha sido eliminado.",
        },
        notification: {
          message: "Mensaje de",
        },
        tabs: {
          open: {
            title: "Abiertas"
          },
          closed: {
            title: "Cerradas"
          },
          search: {
            title: "Buscar"
          },
        },
        search: {
          placeholder: "Buscar tickets y mensajes",
          filterConnections: "Filtro por conexiones",
          filterContacts: "Filtro por contacto",
          filterConections: "Filtro por Conexión",
          filterConectionsOptions: {
            open: "Abierto",
            closed: "Cerrado",
            pending: "Pendiente",
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
        fieldLabel: "Escribe para buscar usuarios",
        fieldQueueLabel: "Transferir a la cola",
        fieldQueuePlaceholder: "Selecciona una cola",
        noOptions: "No se encontró ningún usuario con ese nombre",
        buttons: {
          ok: "Transferir",
          cancel: "Cancelar",
        },
      },
      ticketsList: {
        called: "Llamado",
        pendingHeader: "Esperando",
        assignedHeader: "Atendiendo",
        noTicketsTitle: "¡Nada aquí!",
        noTicketsMessage:
          "No se encontraron tickets con este estado o término de búsqueda",
        buttons: {
          accept: "Aceptar",
          closed: "Finalizar",
          transfer: "Transferir",
          reopen: "Reabrir",
          exportAsPDF: "Exportar como PDF"
        },
      },
      newTicketModal: {
        title: "Crear Ticket",
        fieldLabel: "Escribe para buscar el contacto",
        add: "Añadir",
        buttons: {
          ok: "Guardar",
          cancel: "Cancelar",
        },
      },
      mainDrawer: {
        listItems: {
          dashboard: "Panel de control",
          connections: "Conexiones",
          tickets: "Atendimientos",
          quickMessages: "Respuestas rápidas",
          contacts: "Contactos",
          queues: "Colas y Chatbot",
          tags: "Etiquetas",
          administration: "Administración",
          users: "Usuarios",
          settings: "Configuraciones",
          helps: "Ayuda",
          messagesAPI: "API",
          schedules: "Agendamientos",
          campaigns: "Campañas",
          annoucements: "Anuncios",
          loglauncher: "Actualizaciones",
          chats: "Chat Interno",
          financeiro: "Financiero",
          files: "Lista de archivos",
          prompts: "Open.Ai",
          reports: "Informes",
          queueIntegration: "Integraciones",
        },
        appBar: {
          notRegister: "Sin notificaciones",
          user: {
            profile: "Perfil",
            logout: "Cerrar sesión",
          },
        },
      },
      queueIntegration: {
        title: "Integraciones",
        table: {
          id: "ID",
          type: "Tipo",
          name: "Nombre",
          projectName: "Nombre del Proyecto",
          language: "Idioma",
          lastUpdate: "Última actualización",
          actions: "Acciones",
        },
        buttons: {
          add: "Añadir Proyecto",
        },
        searchPlaceholder: "Buscar...",
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Estás seguro? ¡Esta acción no se puede revertir y se eliminará de las colas y conexiones vinculadas!",
        },
      },
      reports: {
        title: "Informes de Tickets",
        table: {
          id: "Ticket",
          user: "Usuario",
          dateOpen: "Fecha de Apertura",
          dateClose: "Fecha de Cierre",
          NPS: "NPS",
          status: "Estado",
          whatsapp: "Conexión",
          queue: "Cola",
          actions: "Acciones",
          lastMessage: "Últ. Mensaje",
          contact: "Cliente",
          supportTime: "Tiempo de Atención"
        },
        buttons: {
          filter: "Aplicar Filtro",
        },
        searchPlaceholder: "Buscar...",
      },
      files: {
        title: "Lista de archivos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acción",
        },
        toasts: {
          deleted: "¡Lista eliminada con éxito!",
          deletedAll: "¡Todas las listas eliminadas con éxito!",
        },
        buttons: {
          add: "Añadir",
          deleteAll: "Eliminar Todos",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteAllTitle: "Eliminar Todos",
          deleteMessage: "¿Estás seguro de que deseas eliminar esta lista?",
          deleteAllMessage: "¿Estás seguro de que deseas eliminar todas las listas?",
        },
      },
      languages: {
        undefined: "Idioma",
        "pt-BR": "Portugués",
        es: "Español",
        en: "Inglés",
        tr: "Turco",
      },
      messagesAPI: {
        title: "API",
        textMessage: {
          number: "Número",
          body: "Mensaje",
          token: "Token registrado",
        },
        mediaMessage: {
          number: "Número",
          body: "Nombre del archivo",
          media: "Archivo",
          token: "Token registrado",
        },
      },
      notifications: {
        noTickets: "No hay notificaciones.",
      },
      quickMessages: {
        title: "Respuestas Rápidas",
        searchPlaceholder: "Buscar...",
        noAttachment: "Sin adjunto",
        confirmationModal: {
          deleteTitle: "Eliminación",
          deleteMessage: "¡Esta acción es irreversible! ¿Deseas continuar?",
        },
        buttons: {
          add: "Añadir",
          attach: "Adjuntar Archivo",
          cancel: "Cancelar",
          edit: "Editar",
        },
        toasts: {
          success: "¡Atajo añadido con éxito!",
          deleted: "¡Atajo eliminado con éxito!",
        },
        dialog: {
          title: "Mensaje Rápido",
          shortcode: "Atajo",
          message: "Respuesta",
          save: "Guardar",
          cancel: "Cancelar",
          geral: "Permitir edición",
          add: "Añadir",
          edit: "Editar",
          visao: "Permitir ver",
          geral: 'Global',
        },
        table: {
          shortcode: "Atajo",
          message: "Mensaje",
          actions: "Acciones",
          mediaName: "Nombre del Archivo",
          status: 'Global',
        },
      },
      messageVariablesPicker: {
        label: "Variables disponibles",
        vars: {
          contactFirstName: "Primer Nombre",
          contactName: "Nombre",
          greeting: "Saludo",
          protocolNumber: "Protocolo",
          date: "Fecha",
          hour: "Hora",
        },
      },
      contactLists: {
        title: "Listas de Contactos",
        table: {
          name: "Nombre",
          contacts: "Contactos",
          actions: "Acciones",
        },
        buttons: {
          add: "Nueva Lista",
        },
        dialog: {
          name: "Nombre",
          company: "Empresa",
          okEdit: "Editar",
          okAdd: "Añadir",
          add: "Añadir",
          edit: "Editar",
          cancel: "Cancelar",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          deleted: "Registro eliminado",
        },
      },
      contactListItems: {
        title: "Contactos",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo",
          lists: "Listas",
          import: "Importar",
        },
        dialog: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          okEdit: "Editar",
          okAdd: "Añadir",
          add: "Añadir",
          edit: "Editar",
          cancel: "Cancelar",
        },
        table: {
          name: "Nombre",
          number: "Número",
          whatsapp: "Whatsapp",
          email: "E-mail",
          actions: "Acciones",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
          importMessage: "¿Deseas importar los contactos de esta hoja de cálculo?",
          importTitlte: "Importar",
        },
        toasts: {
          deleted: "Registro eliminado",
        },
      },
      campaigns: {
        title: "Campañas",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nueva Campaña",
          contactLists: "Listas de Contactos",
        },
        table: {
          name: "Nombre",
          whatsapp: "Conexión",
          contactList: "Lista de Contactos",
          status: "Estado",
          scheduledAt: "Agendado",
          completedAt: "Completado",
          confirmation: "Confirmación",
          actions: "Acciones",
        },
        dialog: {
          new: "Nueva Campaña",
          update: "Editar Campaña",
          readonly: "Solo Lectura",
          form: {
            name: "Nombre",
            message1: "Mensaje 1",
            message2: "Mensaje 2",
            message3: "Mensaje 3",
            message4: "Mensaje 4",
            message5: "Mensaje 5",
            confirmationMessage1: "Mensaje de Confirmación 1",
            confirmationMessage2: "Mensaje de Confirmación 2",
            confirmationMessage3: "Mensaje de Confirmación 3",
            confirmationMessage4: "Mensaje de Confirmación 4",
            confirmationMessage5: "Mensaje de Confirmación 5",
            messagePlaceholder: "Contenido del mensaje",
            whatsapp: "Conexión",
            status: "Estado",
            scheduledAt: "Agendado",
            confirmation: "Confirmación",
            contactList: "Lista de Contacto",
            tagList: "Lista de Etiquetas",
            fileList: "Lista de Archivos"
          },
          buttons: {
            add: "Añadir",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar Envíos",
            restart: "Reiniciar Envíos",
            close: "Cerrar",
            attach: "Adjuntar Archivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          success: "Operación realizada con éxito",
          cancel: "Campaña cancelada",
          restart: "Campaña reiniciada",
          deleted: "Registro eliminado",
        },
      },
      announcements: {
        active: "Activo",
        inactive: "Inactivo",
        title: "Anuncios",
        searchPlaceholder: "Buscar",
        buttons: {
          add: "Nuevo Anuncio",
          contactLists: "Listas de Anuncios",
        },
        table: {
          priority: "Prioridad",
          title: "Título",
          text: "Texto",
          mediaName: "Archivo",
          status: "Estado",
          actions: "Acciones",
        },
        dialog: {
          edit: "Edición de Anuncio",
          add: "Nuevo Anuncio",
          update: "Editar Anuncio",
          readonly: "Solo Lectura",
          form: {
            priority: "Prioridad",
            title: "Título",
            text: "Texto",
            mediaPath: "Archivo",
            status: "Estado",
          },
          buttons: {
            add: "Añadir",
            edit: "Actualizar",
            okadd: "Ok",
            cancel: "Cancelar",
            close: "Cerrar",
            attach: "Adjuntar Archivo",
          },
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        toasts: {
          success: "Operación realizada con éxito",
          deleted: "Registro eliminado",
        },
      },
      campaignsConfig: {
        title: "Configuraciones de Campañas",
      },
      queues: {
        title: "Colas y Chatbot",
        table: {
          id: "ID",
          name: "Nombre",
          color: "Color",
          greeting: "Mensaje de bienvenida",
          actions: "Acciones",
          orderQueue: "Orden de la cola (bot)",
        },
        buttons: {
          add: "Añadir cola",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "¿Estás seguro? ¡Esta acción no se puede revertir! Los tickets en esta cola seguirán existiendo, pero ya no tendrán ninguna cola asignada.",
        },
      },
      queueSelect: {
        inputLabel: "Colas",
      },
      users: {
        title: "Usuarios",
        table: {
          id: "ID",
          name: "Nombre",
          status: "Estado",
          email: "Email",
          profile: "Perfil",
          actions: "Acciones",
        },
        status: {
          online: "Usuarios en línea",
          offline: "Usuarios fuera de línea",
        },
        buttons: {
          add: "Añadir usuario",
        },
        toasts: {
          deleted: "Usuario eliminado con éxito.",
        },
        confirmationModal: {
          deleteTitle: "Eliminar",
          deleteMessage:
            "Todos los datos del usuario se perderán. Los tickets abiertos de este usuario se moverán a la cola.",
        },
      },
      helps: {
        title: "Centro de Ayuda",
      },
      schedules: {
        title: "Agendamientos",
        confirmationModal: {
          deleteTitle: "¿Estás seguro de que deseas eliminar este agendamiento?",
          deleteMessage: "Esta acción no se puede deshacer.",
        },
        table: {
          contact: "Contacto",
          body: "Mensaje",
          sendAt: "Fecha de agendamiento",
          sentAt: "Fecha de envío",
          status: "Estado",
          actions: "Acciones",
        },
        buttons: {
          add: "Nuevo agendamiento",
        },
        toasts: {
          deleted: "Agendamiento eliminado con éxito.",
        },
      },
      tags: {
        title: "Etiquetas",
        confirmationModal: {
          deleteTitle: "¿Estás seguro de que deseas eliminar esta etiqueta?",
          deleteMessage: "Esta acción no se puede deshacer.",
          deleteAllMessage: "¿Estás seguro de que deseas eliminar todas las etiquetas?",
          deleteAllTitle: "Eliminar Todas",
        },
        table: {
          name: "Nombre",
          color: "Color",
          tickets: "Registros Etiquetados",
          actions: "Acciones",
        },
        buttons: {
          add: "Nueva Etiqueta",
          deleteAll: "Eliminar Todas",
        },
        toasts: {
          deletedAll: "¡Todas las etiquetas eliminadas con éxito!",
          deleted: "Etiqueta eliminada con éxito.",
        },
      },
      settings: {
        success: "Configuraciones guardadas con éxito.",
        title: "Configuraciones",
        settings: {
          userCreation: {
            name: "Creación de usuario",
            options: {
              enabled: "Habilitado",
              disabled: "Deshabilitado",
            },
          },
        },
      },
      messagesList: {
        header: {
          assignedTo: "Asignado a:",
          buttons: {
            return: "Volver",
            resolve: "Resolver",
            reopen: "Reabrir",
            accept: "Aceptar",
          },
        },
      },
      messagesInput: {
        placeholderOpen: "Escribe un mensaje",
        placeholderClosed:
          "Reabre o acepta este ticket para enviar un mensaje.",
        signMessage: "Firmar",
      },
      mediaModal: {
        title: "Enviar multimedia",
        caption: "Leyenda (opcional)",
        captionPlaceholder: "Escribe una leyenda para el archivo...",
        addMore: "Añadir más",
        dragDropText: "Suelta los archivos aquí para enviar",
        buttons: {
          cancel: "Cancelar",
          send: "Enviar",
        },
        maxFiles: "Se permiten un máximo de 10 archivos",
      },
      messageSearch: {
        placeholder: "Buscar mensajes...",
        noResults: "No se encontraron mensajes",
        searchButton: "Buscar mensajes",
      },
      contactDrawer: {
        header: "Detalles del contacto",
        buttons: {
          edit: "Editar contacto",
        },
        extraInfo: "Información adicional",
      },
      fileModal: {
        title: {
          add: "Añadir lista de archivos",
          edit: "Editar lista de archivos",
        },
        buttons: {
          okAdd: "Guardar",
          okEdit: "Editar",
          cancel: "Cancelar",
          fileOptions: "Añadir archivo",
        },
        form: {
          name: "Nombre de la lista de archivos",
          message: "Detalles de la lista",
          fileOptions: "Lista de archivos",
          extraName: "Mensaje para enviar con el archivo",
          extraValue: "Valor de la opción",
        },
        success: "¡Lista de archivos guardada con éxito!",
      },
      ticketOptionsMenu: {
        schedule: "Agendar",
        delete: "Eliminar",
        transfer: "Transferir",
        registerAppointment: "Notas del contacto",
        appointmentsModal: {
          title: "Notas del contacto",
          textarea: "Nota",
          placeholder: "Introduce aquí la información que deseas registrar",
        },
        confirmationModal: {
          title: "Eliminar el ticket",
          titleFrom: "del contacto ",
          message:
            "¡Atención! Todos los mensajes relacionados con el ticket se perderán.",
        },
        buttons: {
          delete: "Eliminar",
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
        delete: "Eliminar",
        reactionSuccess: "Reacción añadida",
        reply: "Responder",
        edit: 'Editar Mensaje',
        forward: "Reenviar",
        toForward: "Reenviar",
        react: "Reaccionar",
        confirmationModal: {
          title: "¿Eliminar mensaje?",
          message: "Esta acción no se puede deshacer.",
        },
      },
      backendErrors: {
        ERR_NO_OTHER_WHATSAPP: "Debe haber al menos un WhatsApp predeterminado.",
        ERR_NO_DEF_WAPP_FOUND:
          "No se encontró ningún WhatsApp predeterminado. Verifique la página de conexiones.",
        ERR_WAPP_NOT_INITIALIZED:
          "Esta sesión de WhatsApp no se ha inicializado. Verifique la página de conexiones.",
        ERR_WAPP_CHECK_CONTACT:
          "No se pudo verificar el contacto de WhatsApp. Verifique la página de conexiones",
        ERR_WAPP_INVALID_CONTACT: "Este no es un número de WhatsApp válido.",
        ERR_WAPP_DOWNLOAD_MEDIA:
          "No se pudo descargar el archivo multimedia de WhatsApp. Verifique la página de conexiones.",
        ERR_INVALID_CREDENTIALS:
          "Error de autenticación. Por favor, inténtelo de nuevo.",
        ERR_SENDING_WAPP_MSG:
          "Error al enviar el mensaje de WhatsApp. Verifique la página de conexiones.",
        ERR_DELETE_WAPP_MSG: "No se pudo eliminar el mensaje de WhatsApp.",
        ERR_OTHER_OPEN_TICKET: "Ya existe un ticket abierto para este contacto.",
        ERR_SESSION_EXPIRED: "Sesión caducada. Por favor, inicie sesión.",
        ERR_USER_CREATION_DISABLED:
          "La creación de usuarios ha sido deshabilitada por el administrador.",
        ERR_NO_PERMISSION: "No tienes permiso para acceder a este recurso.",
        ERR_DUPLICATED_CONTACT: "Ya existe un contacto con este número.",
        ERR_NO_SETTING_FOUND: "No se encontró ninguna configuración con este ID.",
        ERR_NO_CONTACT_FOUND: "No se encontró ningún contacto con este ID.",
        ERR_NO_TICKET_FOUND: "No se encontró ningún ticket con este ID.",
        ERR_NO_USER_FOUND: "No se encontró ningún usuario con este ID.",
        ERR_NO_WAPP_FOUND: "No se encontró ningún WhatsApp con este ID.",
        ERR_CREATING_MESSAGE: "Error al crear el mensaje en la base de datos.",
        ERR_CREATING_TICKET: "Error al crear el ticket en la base de datos.",
        ERR_FETCH_WAPP_MSG:
          "Error al buscar el mensaje en WhatsApp, tal vez sea demasiado antiguo.",
        ERR_QUEUE_COLOR_ALREADY_EXISTS:
          "Este color ya está en uso, elija otro.",
        ERR_WAPP_GREETING_REQUIRED:
          "El mensaje de bienvenida es obligatorio cuando hay más de una cola.",
        ERR_CHECK_NUMBER: "Número inválido. Verifique el número e inténtelo de nuevo.",
      },
    },
  },
};

export {
  messages
};