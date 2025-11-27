/**
 * Spanish (Español) Translations
 * 
 * Complete translation file for the device provisioning wizard
 * and connection code flows.
 */

export const es = {
  // Common
  common: {
    next: 'Siguiente',
    back: 'Atrás',
    cancel: 'Cancelar',
    continue: 'Continuar',
    complete: 'Completar',
    save: 'Guardar',
    edit: 'Editar',
    retry: 'Reintentar',
    close: 'Cerrar',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    loading: 'Cargando...',
    saving: 'Guardando...',
    testing: 'Probando...',
    validating: 'Validando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
  },

  // Diagnostics
  diagnostics: {
    title: 'Diagnósticos',
    subtitle: 'Resumen rápido de problemas y pasos de remediación',
    tabs: {
      devices: 'Dispositivos',
      connection: 'Conexión',
      medication: 'Medicación',
      accessibility: 'Accesibilidad',
    },
    search: {
      placeholder: 'Buscar problemas, mensajes o acciones',
      accessibilityLabel: 'Buscar en diagnósticos',
    },
    badge: {
      retry: 'Reintentar',
      attention: 'Atención',
      validate: 'Validar',
      newCode: 'Nuevo código',
    },
  },

  // Device Provisioning Wizard
  wizard: {
    title: 'Configurar Dispositivo',
    progressLabel: 'Paso {{current}} de {{total}}: {{step}}',
    
    // Step labels
    steps: {
      welcome: 'Bienvenido',
      deviceId: 'ID del Dispositivo',
      verification: 'Verificación',
      wifi: 'WiFi',
      preferences: 'Preferencias',
      completion: 'Completado',
    },

    // Navigation
    navigation: {
      nextStep: 'Siguiente paso: {{step}}',
      previousStep: 'Paso anterior: {{step}}',
      cancelSetup: 'Cancelar configuración',
      completeSetup: 'Completar configuración del dispositivo',
      navigationControls: 'Controles de navegación del asistente',
    },

    // Keyboard shortcuts
    keyboard: {
      shortcuts: 'Atajos de teclado disponibles: Flecha derecha o Page Down para siguiente paso, Flecha izquierda o Page Up para paso anterior, Escape para cancelar',
    },

    // Exit confirmation
    exit: {
      title: '¿Salir de la configuración?',
      message: 'Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?',
      confirm: 'Sí, salir',
      cancel: 'Continuar configuración',
    },

    // Continue setup prompt
    continueSetup: {
      title: 'Continuar Configuración',
      message: 'Tienes una configuración en progreso desde hace {{time}}',
      continue: 'Continuar donde lo dejé',
      startFresh: 'Comenzar de nuevo',
      step: 'Paso {{current}} de {{total}}',
    },
  },

  // Welcome Step
  welcomeStep: {
    title: '¡Bienvenido!',
    subtitle: 'Configuremos tu dispositivo dispensador de medicamentos',
    whatWeDo: '¿Qué haremos?',
    description: 'Este asistente te guiará paso a paso para configurar tu dispositivo. El proceso tomará aproximadamente 5 minutos.',
    
    stepsTitle: 'Pasos de configuración',
    steps: {
      deviceId: {
        title: 'Ingresar ID del dispositivo',
        description: 'Ingresa el código único de tu dispositivo',
      },
      verification: {
        title: 'Verificar dispositivo',
        description: 'Confirmaremos que tu dispositivo está disponible',
      },
      wifi: {
        title: 'Configurar WiFi',
        description: 'Conecta tu dispositivo a tu red WiFi',
      },
      preferences: {
        title: 'Personalizar preferencias',
        description: 'Ajusta alarmas, LED y volumen',
      },
    },

    deviceIdLocation: '¿Dónde encuentro el ID del dispositivo?',
    deviceIdGuide: 'El ID del dispositivo es un código alfanumérico de 5-100 caracteres ubicado en:',
    locations: {
      bottom: '• Parte inferior del dispositivo',
      box: '• Etiqueta en la caja del producto',
      manual: '• Manual de usuario',
    },

    tipsTitle: 'Consejos útiles',
    tips: {
      deviceNearby: 'Asegúrate de tener tu dispositivo cerca y encendido',
      wifiPassword: 'Ten a mano tu contraseña de WiFi',
      pauseResume: 'El proceso puede pausarse y reanudarse en cualquier momento',
    },

    helpButton: '¿Necesitas ayuda adicional?',
    accessibility: {
      announcement: 'Bienvenido al asistente de configuración del dispositivo',
      helpButton: 'Obtener ayuda adicional',
      helpButtonHint: 'Abre la página de soporte en tu navegador',
    },
  },

  // Device ID Step
  deviceIdStep: {
    title: 'ID del Dispositivo',
    subtitle: 'Ingresa el código único de tu dispositivo dispensador',
    
    label: 'ID del Dispositivo',
    placeholder: 'Ej: DEVICE-12345',
    
    validation: {
      required: 'El ID del dispositivo es requerido',
      tooShort: 'El ID debe tener al menos 5 caracteres',
      tooLong: 'El ID no puede tener más de 100 caracteres',
      invalidChars: 'El ID solo puede contener letras, números, guiones y guiones bajos',
      checking: 'Verificando disponibilidad...',
      valid: 'ID válido y disponible',
    },

    helpTitle: '¿Dónde encuentro el ID?',
    helpText: 'El ID del dispositivo está ubicado en:',
    locations: {
      bottom: '• Parte inferior del dispositivo',
      box: '• Etiqueta en la caja',
      manual: '• Manual de usuario',
    },

    formatInfo: 'El ID debe tener entre 5 y 100 caracteres alfanuméricos',

    troubleshooting: '¿Tienes algún problema?',
    tips: {
      checkSpelling: 'Verifica que el ID esté escrito correctamente, sin espacios',
      alreadyClaimed: 'Si el dispositivo ya está registrado, contacta al soporte',
    },

    accessibility: {
      announcement: 'Paso 2: Ingresa el ID de tu dispositivo',
      fieldLabel: 'Campo de ID del dispositivo',
      fieldHint: 'Ingresa el código alfanumérico de 5 a 100 caracteres ubicado en tu dispositivo',
    },
  },

  // Verification Step
  verificationStep: {
    title: {
      verifying: 'Verificando Dispositivo',
      success: '¡Verificación Exitosa!',
      error: 'Error de Verificación',
    },
    subtitle: {
      verifying: 'Por favor espera mientras verificamos tu dispositivo',
      success: 'Tu dispositivo ha sido registrado correctamente',
      error: 'No pudimos verificar tu dispositivo',
    },

    steps: {
      checkingAvailability: 'Verificando disponibilidad del dispositivo...',
      registering: 'Registrando dispositivo...',
      linking: 'Vinculando dispositivo a tu cuenta...',
      syncing: 'Sincronizando con el servidor...',
      complete: '¡Dispositivo verificado exitosamente!',
      checkingLinks: 'Verificando vínculos existentes...',
    },

    progressSteps: {
      checkAvailability: 'Verificar disponibilidad',
      registerDevice: 'Registrar dispositivo',
      linkAccount: 'Vincular a tu cuenta',
      sync: 'Sincronizar',
    },

    success: {
      device: 'Dispositivo: {{deviceId}}',
      status: 'Estado: Activo y listo para configurar',
      nextInfo: 'A continuación, configuraremos la conexión WiFi y las preferencias de tu dispositivo',
    },

    accessibility: {
      announcement: 'Paso 3: Verificando tu dispositivo',
      successAnnouncement: 'Dispositivo verificado y vinculado exitosamente',
    },
  },

  // WiFi Config Step
  wifiConfigStep: {
    title: 'Configuración WiFi',
    subtitle: 'Conecta tu dispositivo a tu red WiFi para sincronización automática',

    ssidLabel: 'Nombre de la red WiFi (SSID)',
    ssidPlaceholder: 'Mi Red WiFi',
    passwordLabel: 'Contraseña WiFi',
    passwordPlaceholder: 'Mínimo 8 caracteres',

    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',

    status: {
      testing: 'Probando conexión...',
      success: 'Configuración guardada exitosamente',
      connectionSuccess: 'Conexión exitosa',
    },

    buttons: {
      save: 'Guardar Configuración',
      saving: 'Guardando...',
      test: 'Probar Conexión',
      testing: 'Probando...',
      edit: 'Editar Configuración',
    },

    infoCards: {
      security: {
        title: 'Seguridad',
        text: 'Tu contraseña WiFi se transmite de forma segura y se almacena encriptada',
      },
      autoSync: {
        title: 'Sincronización automática',
        text: 'Una vez conectado, tu dispositivo sincronizará medicamentos y eventos automáticamente',
      },
    },

    tips: {
      title: 'Consejos',
      connectedNetwork: 'Asegúrate de estar conectado a la red WiFi que deseas configurar',
      passwordLength: 'La contraseña debe tener al menos 8 caracteres',
      deviceNearRouter: 'El dispositivo debe estar encendido y cerca del router WiFi',
    },

    accessibility: {
      announcement: 'Paso 4: Configura la conexión WiFi de tu dispositivo',
      ssidField: 'Campo de nombre de red WiFi',
      ssidHint: 'Ingresa el nombre de tu red WiFi',
      passwordField: 'Campo de contraseña WiFi',
      passwordHint: 'Ingresa la contraseña de tu red WiFi, mínimo 8 caracteres',
      saveButton: 'Guardar configuración WiFi',
      saveButtonHint: 'Guarda la configuración WiFi en el dispositivo',
      testButton: 'Probar conexión WiFi',
      testButtonHint: 'Verifica que el dispositivo se conecte a la red WiFi',
      editButton: 'Editar configuración',
      editButtonHint: 'Modifica la configuración WiFi',
    },
  },

  // Preferences Step
  preferencesStep: {
    title: 'Preferencias del Dispositivo',
    subtitle: 'Personaliza cómo tu dispositivo te notificará sobre tus medicamentos',

    alarmMode: {
      title: 'Modo de Alarma',
      options: {
        sound: 'Sonido',
        vibrate: 'Vibración',
        both: 'Ambos',
        silent: 'Silencioso',
      },
    },

    ledIntensity: {
      title: 'Intensidad del LED',
      value: '{{intensity}}%',
    },

    ledColor: {
      title: 'Color del LED',
      description: 'Selecciona el color del indicador LED',
      buttonText: 'Abrir selector de color',
      preview: 'Vista previa del LED',
    },

    volume: {
      title: 'Volumen',
      value: '{{volume}}%',
    },

    buttons: {
      test: 'Probar Alarma',
      testing: 'Probando...',
      save: 'Guardar Preferencias',
      saving: 'Guardando...',
      saved: 'Preferencias Guardadas',
    },

    status: {
      saved: 'Preferencias guardadas exitosamente',
      testActivated: 'Alarma de prueba activada',
    },

    infoText: 'Puedes probar la alarma antes de guardar para asegurarte de que las configuraciones sean de tu agrado',

    accessibility: {
      announcement: 'Paso 5: Configura las preferencias de tu dispositivo',
      alarmModeRadio: 'Modo de alarma: {{mode}}',
      ledIntensitySlider: 'Control deslizante de intensidad del LED',
      volumeSlider: 'Control deslizante de volumen',
      colorPickerButton: 'Abrir selector de color',
      colorPickerHint: 'Abre un selector para elegir el color del LED',
      testButton: 'Probar alarma',
      testButtonHint: 'Activa una alarma de prueba con la configuración actual',
      saveButton: 'Guardar preferencias',
      saveButtonHint: 'Guarda la configuración de preferencias en el dispositivo',
    },
  },

  // Completion Step
  completionStep: {
    title: '¡Configuración Completada!',
    subtitle: 'Tu dispositivo está listo para ayudarte a gestionar tus medicamentos',

    summary: {
      title: 'Resumen de Configuración',
      device: 'Dispositivo',
      wifi: 'Red WiFi',
      wifiNotConfigured: 'No configurada',
      alarmMode: 'Modo de Alarma',
      led: 'LED',
      ledIntensity: '{{intensity}}% intensidad',
      volume: 'Volumen',
      volumeValue: '{{volume}}%',
    },

    alarmModes: {
      sound: 'Solo Sonido',
      vibrate: 'Solo Vibración',
      both: 'Sonido y Vibración',
      silent: 'Silencioso',
    },

    nextSteps: {
      title: 'Próximos Pasos',
      step1: {
        title: 'Agregar Medicamentos',
        description: 'Comienza agregando tus medicamentos y horarios',
      },
      step2: {
        title: 'Configurar Horarios',
        description: 'Establece los horarios para cada medicamento',
      },
      step3: {
        title: 'Recibir Recordatorios',
        description: 'Tu dispositivo te notificará cuando sea hora de tomar tus medicamentos',
      },
    },

    tip: {
      title: 'Consejo',
      text: 'Puedes modificar la configuración de tu dispositivo en cualquier momento desde el menú de ajustes',
    },

    button: 'Ir al Inicio',

    accessibility: {
      announcement: 'Paso 6: Configuración completada exitosamente',
      successAnnouncement: 'Configuración completada. Tu dispositivo está listo para usar',
      goHomeButton: 'Ir al inicio',
      goHomeButtonHint: 'Navega a la pantalla principal de paciente',
    },
  },

  // Device Provisioning Errors
  deviceErrors: {
    DEVICE_NOT_FOUND: {
      title: 'Dispositivo No Encontrado',
      message: 'No pudimos encontrar el dispositivo con el ID proporcionado',
      action: 'Verifica el ID del dispositivo e intenta nuevamente',
      steps: [
        'Verifica que el ID esté escrito correctamente',
        'Asegúrate de no incluir espacios antes o después del ID',
        'Revisa que el ID coincida con el que aparece en tu dispositivo',
        'El ID debe estar en la parte inferior del dispositivo o en la caja',
        'Si el problema persiste, contacta al soporte técnico',
      ],
    },
    DEVICE_ALREADY_CLAIMED: {
      title: 'Dispositivo Ya Registrado',
      message: 'Este dispositivo ya está registrado a otro usuario',
      action: 'Verifica el ID del dispositivo o contacta al soporte',
      steps: [
        'Confirma que el ID del dispositivo sea correcto',
        'Si compraste un dispositivo usado, el propietario anterior debe desvincularlo primero',
        'Si eres el propietario legítimo, contacta al soporte técnico con tu comprobante de compra',
        'Proporciona el ID del dispositivo y tu información de cuenta al soporte',
      ],
    },
    INVALID_DEVICE_ID: {
      title: 'ID Inválido',
      message: 'El formato del ID del dispositivo no es válido',
      action: 'Ingresa un ID válido de 5 a 100 caracteres alfanuméricos',
      steps: [
        'El ID debe tener entre 5 y 100 caracteres',
        'Solo se permiten letras, números, guiones (-) y guiones bajos (_)',
        'No incluyas espacios ni caracteres especiales',
        'Verifica que estés copiando el ID completo',
        'Ejemplo de formato válido: DEVICE-12345 o DEV_ABC123',
      ],
    },
    WIFI_CONFIG_FAILED: {
      title: 'Error de Configuración WiFi',
      message: 'No pudimos configurar la conexión WiFi del dispositivo',
      action: 'Verifica las credenciales WiFi e intenta nuevamente',
      steps: [
        'Verifica que el nombre de la red WiFi (SSID) sea correcto',
        'Asegúrate de que la contraseña WiFi esté escrita correctamente',
        'Confirma que tu red WiFi esté activa y funcionando',
        'El dispositivo solo soporta redes WiFi de 2.4 GHz (no 5 GHz)',
        'Verifica que tu router no tenga restricciones de dispositivos',
        'Intenta reiniciar tu router y el dispositivo',
        'Si usas caracteres especiales en la contraseña, verifica que sean compatibles',
      ],
    },
    DEVICE_OFFLINE: {
      title: 'Dispositivo Desconectado',
      message: 'El dispositivo no está conectado o no responde',
      action: 'Verifica que el dispositivo esté encendido y conectado',
      steps: [
        'Verifica que el dispositivo esté encendido (luz LED encendida)',
        'Asegúrate de que el dispositivo tenga batería o esté conectado a la corriente',
        'Confirma que el dispositivo esté dentro del alcance de tu red WiFi',
        'Intenta reiniciar el dispositivo (apagar y encender)',
        'Espera 1-2 minutos después de encender el dispositivo antes de continuar',
        'Verifica que tu red WiFi esté funcionando correctamente',
        'Si el problema persiste, intenta configurar el WiFi nuevamente',
      ],
    },
    PERMISSION_DENIED: {
      title: 'Permiso Denegado',
      message: 'No tienes permiso para registrar este dispositivo',
      action: 'Verifica tu cuenta y conexión, o contacta al soporte',
      steps: [
        'Verifica que hayas iniciado sesión correctamente',
        'Asegúrate de tener una conexión a internet estable',
        'Cierra sesión y vuelve a iniciar sesión',
        'Verifica que tu cuenta esté activa y no tenga restricciones',
        'Si el problema persiste, contacta al soporte técnico',
      ],
    },
    UNKNOWN: {
      title: 'Error Inesperado',
      message: 'Ocurrió un error inesperado durante la configuración',
      action: 'Intenta nuevamente o contacta al soporte',
      steps: [
        'Verifica tu conexión a internet',
        'Intenta cerrar y volver a abrir la aplicación',
        'Asegúrate de tener la última versión de la aplicación',
        'Si el problema persiste, contacta al soporte técnico',
      ],
    },
    retryButton: 'Reintentar',
    contactSupport: 'Contactar Soporte',
    supportInfo: {
      email: 'soporte@pillhub.com',
      phone: '+1-800-PILLHUB',
      hours: 'Lunes a Viernes, 9:00 AM - 6:00 PM',
    },
  },

  // Connection Code Errors
  connectionErrors: {
    CODE_NOT_FOUND: {
      title: 'Código No Encontrado',
      message: 'No pudimos encontrar el código de conexión ingresado',
      action: 'Verifica el código e intenta nuevamente',
      steps: [
        'Verifica que el código esté escrito correctamente',
        'Asegúrate de no incluir espacios antes o después del código',
        'Los códigos distinguen entre mayúsculas y minúsculas',
        'Confirma con el paciente que el código sea el correcto',
        'Si el código fue enviado por mensaje, cópialo y pégalo directamente',
      ],
    },
    CODE_EXPIRED: {
      title: 'Código Expirado',
      message: 'Este código de conexión ha expirado',
      action: 'Solicita un nuevo código al paciente',
      steps: [
        'Los códigos de conexión expiran después de 24 horas por seguridad',
        'Contacta al paciente y pídele que genere un nuevo código',
        'El paciente puede generar un nuevo código desde su configuración de dispositivo',
        'Una vez que tengas el nuevo código, ingrésalo aquí',
      ],
    },
    CODE_ALREADY_USED: {
      title: 'Código Ya Utilizado',
      message: 'Este código de conexión ya ha sido utilizado',
      action: 'Solicita un nuevo código al paciente',
      steps: [
        'Los códigos de conexión solo pueden usarse una vez por seguridad',
        'Si ya usaste este código, deberías tener acceso al dispositivo del paciente',
        'Verifica en tu lista de pacientes si ya estás conectado',
        'Si necesitas conectarte nuevamente, solicita un nuevo código al paciente',
        'El paciente puede generar múltiples códigos si es necesario',
      ],
    },
    INVALID_CODE_FORMAT: {
      title: 'Formato Inválido',
      message: 'El formato del código de conexión no es válido',
      action: 'Ingresa un código válido de 6 a 8 caracteres',
      steps: [
        'El código debe tener entre 6 y 8 caracteres',
        'Solo se permiten letras mayúsculas y números',
        'No incluyas espacios ni caracteres especiales',
        'Ejemplo de formato válido: ABC123 o XYZ789AB',
        'Si copiaste el código, asegúrate de no incluir espacios adicionales',
      ],
    },
    DEVICE_NOT_FOUND: {
      title: 'Dispositivo No Encontrado',
      message: 'No pudimos encontrar el dispositivo asociado a este código',
      action: 'Contacta al paciente para verificar el estado del dispositivo',
      steps: [
        'El dispositivo asociado a este código no existe o fue eliminado',
        'Contacta al paciente para confirmar que su dispositivo esté registrado',
        'El paciente debe verificar su dispositivo en la configuración',
        'Si el problema persiste, el paciente debe contactar al soporte técnico',
      ],
    },
    UNKNOWN: {
      title: 'Error Inesperado',
      message: 'Ocurrió un error inesperado al procesar el código',
      action: 'Intenta nuevamente o contacta al soporte',
      steps: [
        'Verifica tu conexión a internet',
        'Intenta cerrar y volver a abrir la aplicación',
        'Asegúrate de tener la última versión de la aplicación',
        'Si el problema persiste, contacta al soporte técnico',
      ],
    },
  },

  // Device Connection Screen
  deviceConnection: {
    title: 'Conectar Dispositivo',
    subtitle: 'Ingresa el código de conexión proporcionado por el paciente para vincular su dispositivo',

    form: {
      title: 'Código de Conexión',
      description: 'El código debe tener entre 6 y 8 caracteres alfanuméricos',
      label: 'Código',
      placeholder: 'Ej: ABC123',
      hint: '{{length}}/8 caracteres',
    },

    validation: {
      required: 'Por favor ingresa un código de conexión',
      tooShort: 'El código debe tener al menos 6 caracteres',
      tooLong: 'El código no puede tener más de 8 caracteres',
      invalidChars: 'El código solo puede contener letras y números',
      authError: 'Error de autenticación. Por favor, inicia sesión nuevamente.',
      invalidOrExpired: 'Código no válido o expirado',
      genericError: 'Error al validar el código. Por favor, intenta nuevamente.',
    },

    buttons: {
      continue: 'Continuar',
      validating: 'Validando...',
      back: '← Atrás',
    },

    help: {
      title: '¿Necesitas ayuda?',
      items: [
        'El paciente debe generar un código desde su aplicación',
        'Los códigos expiran después de 24 horas',
        'Cada código solo puede usarse una vez',
      ],
    },

    accessibility: {
      codeField: 'Código de conexión',
      codeFieldHint: 'Ingresa el código de 6 a 8 caracteres proporcionado por el paciente',
      validateButton: 'Validar código',
      validateButtonHint: 'Valida el código de conexión e inicia el proceso de vinculación',
      backButton: 'Volver',
      backButtonHint: 'Regresa a la pantalla anterior',
    },
  },
};

export type TranslationKeys = typeof es;
