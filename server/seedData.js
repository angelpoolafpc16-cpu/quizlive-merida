export const seedQuiz = {
  title: 'Ciberseguridad: ¿Qué harías tú?',
  questions: [
    {
      text: "Te llega un SMS: 'Paga para recibir tu paquete'. ¿Qué haces?",
      options: [
        'Pago desde el enlace del SMS',
        'Llamo al número del mensaje',
        'Abro la app oficial de la paquetería',
        'Reenvío el SMS a mis contactos',
      ],
      correctIndex: 2,
      duration: 25,
    },
    {
      text: 'Ves un código QR en un anuncio de la calle. ¿Qué haces?',
      options: [
        'Lo escaneo de inmediato',
        'Escribo la URL oficial yo mismo',
        'Lo escaneo y lo comparto',
        'Lo escaneo y acepto todos los permisos',
      ],
      correctIndex: 1,
      duration: 25,
    },
    {
      text: '¿Cuál es la mejor forma de proteger tus cuentas?',
      options: [
        '2FA + contraseñas únicas',
        'Una sola contraseña para todo',
        'Dejar la sesión siempre abierta',
        'Compartir una cuenta genérica',
      ],
      correctIndex: 0,
      duration: 25,
    },
    {
      text: 'Encuentras una USB tirada en el piso. ¿Qué haces?',
      options: [
        'La conecto para ver de quién es',
        'Le pido a un compañero que la revise',
        'No la conecto y la reporto o desecho',
        'La reviso con el antivirus de mi compu',
      ],
      correctIndex: 2,
      duration: 25,
    },
    {
      text: "Te llega un .zip inesperado 'de un amigo' por correo. ¿Qué haces?",
      options: [
        'Lo abro por curiosidad',
        'Respondo pidiendo un emoji de confirmación',
        'Confirmo con él por otro medio antes de abrir',
        'Le cambio el nombre a .pdf y lo abro',
      ],
      correctIndex: 2,
      duration: 25,
    },
    {
      text: "Te llaman 'del banco' pidiendo tu código CVV. ¿Qué haces?",
      options: [
        'Doy el código para evitar el cargo',
        'Doy solo los primeros dígitos',
        'Cuelgo y llamo al número oficial del banco',
        "Doy mi número de cuenta para 'verificar'",
      ],
      correctIndex: 2,
      duration: 25,
    },
    {
      text: '¿Cómo descargas una app de forma segura?',
      options: [
        'Desde cualquier sitio que aparezca en Google',
        'Desde la tienda oficial (Play Store / App Store)',
        'Desde un link en un foro',
        'Instalando un .apk que me reenviaron',
      ],
      correctIndex: 1,
      duration: 25,
    },
    {
      text: '¿Cómo usar bien la IA con información del trabajo?',
      options: [
        'No subir datos sensibles o confidenciales',
        'Pegar documentos internos completos',
        'Compartir mis contraseñas para automatizar',
        'Resumir correos con datos de clientes',
      ],
      correctIndex: 0,
      duration: 25,
    },
    {
      text: 'Google te avisa que una contraseña fue filtrada. ¿Qué haces?',
      options: ['Lo ignoro', 'Me quejo en redes', 'Cambio la contraseña de inmediato', 'Reutilizo una contraseña vieja'],
      correctIndex: 2,
      duration: 25,
    },
  ],
};
