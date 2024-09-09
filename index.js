/*const venom = require('venom-bot');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;

mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Esquema de midatabase
const midatabaseSchema = new mongoose.Schema({
  doc: String,
  nombre: String,
  tipo_contacto: String,
  numero: Number,
  estado: { type: String, default: 'activo' },
  ultima_respuesta: { type: Date, default: null },
  respuesta: { type: String, default: null }
});

const Midatabase = mongoose.model('midatabase', midatabaseSchema, 'midatabase');

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60000; // 60 segundos

// Función para normalizar números de teléfono
function normalizePhoneNumber(number) {
  // Convertir a string si es un número
  let numberStr = number.toString();
  // Eliminar todos los caracteres no numéricos
  let normalized = numberStr.replace(/\D/g, '');
  // Si el número comienza con '51' (código de país de Perú) y tiene más de 11 dígitos, eliminar el '51'
  if (normalized.startsWith('51') && normalized.length > 11) {
    normalized = normalized.slice(2);
  }
  // Tomar los últimos 9 dígitos
  return normalized.slice(-9);
}

// Iniciar el cliente de Venom
venom
  .create({
    session: 'session-name',
    multidevice: true
  })
  .then((client) => {
    console.log('Cliente iniciado correctamente');
    start(client);
  })
  .catch((erro) => {
    console.error('Error al iniciar Venom:', erro);
  });

async function start(client) {
  try {
    const clientes = await Midatabase.find({});
    for (const cliente of clientes) {
      const mensaje = generarMensajePersonalizado(cliente);
      const numeroNormalizado = normalizePhoneNumber(cliente.numero);
      await sendMessageWithRateLimit(client, numeroNormalizado, mensaje);
    }

    // Esperar respuestas durante un período de tiempo (por ejemplo, 24 horas)
    setTimeout(async () => {
      await actualizarEstadosInactivos();
    }, 3 * 1000); // 24 horas24*60*60

    client.onMessage(async (message) => {
      if (!message.isGroupMsg) {
        await handleResponse(client, message);
      }
    });

  } catch (error) {
    console.error('Error en el proceso principal:', error);
  }
}

async function sendMessageWithRateLimit(client, numero, mensaje) {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(numero) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 0;
    userRateLimit.timestamp = now;
  }

  if (userRateLimit.count < RATE_LIMIT) {
    try {
      const whatsappNumber = `${numero}@c.us`;
      console.log(`Intentando enviar mensaje a ${whatsappNumber}`);
      await client.sendText(whatsappNumber, mensaje);
      console.log(`Mensaje enviado a ${numero}`);
      userRateLimit.count++;
      rateLimitMap.set(numero, userRateLimit);
    } catch (error) {
      console.error(`Error al enviar mensaje a ${numero}:`, error.message);
    }
  } else {
    console.log(`Rate limit excedido para ${numero}. Intentando más tarde.`);
  }
}

function generarMensajePersonalizado(cliente) {
  return `Hola ${cliente.nombre}, ¿este sigue siendo tu número de contacto? Por favor, responde 'Sí' para confirmar o 'No' si ha cambiado. Gracias.`;
}

async function handleResponse(client, message) {
  const numeroEntrante = normalizePhoneNumber(message.from.split('@')[0]);
  const respuesta = message.body.trim().toLowerCase();

  console.log(`Buscando cliente con número normalizado: ${numeroEntrante}`);

  const cliente = await Midatabase.findOne({ numero: parseInt(numeroEntrante) });

  if (!cliente) {
    console.log(`No se encontró cliente para el número: ${numeroEntrante}`);
    await client.sendText(message.from, 'No encontramos tu número en nuestra base de datos. Por favor, contáctanos para más información.');
    return;
  }

  console.log(`Cliente encontrado: ${JSON.stringify(cliente)}`);

  // Verificar si el cliente ya ha respondido
  if (cliente.ultima_respuesta) {
    const tiempoTranscurrido = Date.now() - cliente.ultima_respuesta.getTime();
    const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);

    if (horasTranscurridas < 24) {
      await client.sendText(message.from, `Gracias, ${cliente.nombre}. Ya has confirmado tu número. No es necesario que respondas de nuevo.`);
      return;
    }
  }

  if (respuesta === 'si' || respuesta === 'sí') {
    await client.sendText(message.from, `Gracias por confirmar, ${cliente.nombre}. Mantendremos tu número actualizado.`);
    await Midatabase.updateOne(
      { _id: cliente._id },
      {
        estado: 'activo',
        ultima_respuesta: new Date(),
        respuesta: 'si'
      }
    );
  } else if (respuesta === 'no') {
    await client.sendText(message.from, 'Gracias por informarnos. Nos pondremos en contacto contigo por otros medios para actualizar tu información.');
    await Midatabase.updateOne(
      { _id: cliente._id },
      {
        estado: 'no activo',
        ultima_respuesta: new Date(),
        respuesta: 'no'
      }
    );
  } else {
    await client.sendText(message.from, 'Por favor, responde con "Sí" si este sigue siendo tu número o "No" si ha cambiado.');
  }
}

async function actualizarEstadosInactivos() {
  const fechaLimite = new Date(Date.now() - 6 * 1000); // 24 horas atrás
  await Midatabase.updateMany(
    { 
      estado: 'activo', 
      $or: [
        { ultima_respuesta: { $lt: fechaLimite } },
        { ultima_respuesta: null }
      ]
    },
    { $set: { estado: 'no activo' } }
  );
  console.log('Estados actualizados a "no activo" para clientes sin respuesta reciente');
}

// Manejo de errores y cierre de conexiones
process.on('SIGINT', async () => {
  console.log('Cerrando conexiones...');
  await mongoose.connection.close();
  process.exit(0);
});

*/

/*
const venom = require('venom-bot');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

const midatabaseSchema = new mongoose.Schema({
  doc: String,
  nombre: String,
  tipo_contacto: String,
  numero: Number,
  estado: { type: String, default: 'no_confirmado' }
});

const Midatabase = mongoose.model('midatabase', midatabaseSchema, 'midatabase');

const LOTE_DIARIO = 10000;
const INTERVALO_ENTRE_MENSAJES = 3000;
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60000; // 60 segundos

let mensajesEnviadosHoy = 0;
let respuestasRecibidas = 0;
const rateLimitMap = new Map();

function normalizePhoneNumber(number) {
  let numberStr = number.toString();
  let normalized = numberStr.replace(/\D/g, '');
  if (normalized.startsWith('51') && normalized.length > 11) {
    normalized = normalized.slice(2);
  }
  return normalized.slice(-9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarAlertaAdmin(client, mensaje) {
  try {
    await client.sendText(`${ADMIN_NUMBER}@c.us`, mensaje);
    console.log('Alerta enviada al administrador');
  } catch (error) {
    console.error('Error al enviar alerta al administrador:', error);
  }
}

async function sendMessageWithRateLimit(client, numero, mensaje) {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(numero) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 0;
    userRateLimit.timestamp = now;
  }

  if (userRateLimit.count < RATE_LIMIT) {
    try {
      const whatsappNumber = `${numero}@c.us`;
      console.log(`Intentando enviar mensaje a ${whatsappNumber}`);
      await client.sendText(whatsappNumber, mensaje);
      console.log(`Mensaje enviado a ${numero}`);
      userRateLimit.count++;
      rateLimitMap.set(numero, userRateLimit);
    } catch (error) {
      console.error(`Error al enviar mensaje a ${numero}:`, error.message);
      throw error;
    }
  } else {
    console.log(`Rate limit excedido para ${numero}. Intentando más tarde.`);
    throw new Error('Rate limit excedido');
  }
}

venom
  .create({
    session: 'session-name',
    multidevice: true,
    disableWelcome: true
  })
  .then((client) => {
    console.log('Cliente iniciado correctamente');
    start(client);
  })
  .catch((erro) => {
    console.error('Error al iniciar Venom:', erro);
  });

async function start(client) {
  try {
    console.log('Iniciando proceso de envío de mensajes');
    
    async function enviarLoteDiario() {
      const clientes = await Midatabase.find({
        $or: [
          { estado: 'no_confirmado' },
          { estado: { $exists: false } },
          { estado: null }
        ]
      }).limit(LOTE_DIARIO);
      
      console.log(`Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);
      await enviarAlertaAdmin(client, `Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);

      if (clientes.length === 0) {
        console.log('No se encontraron clientes para procesar');
        await enviarAlertaAdmin(client, 'No se encontraron clientes para procesar');
        return;
      }

      mensajesEnviadosHoy = 0;
      respuestasRecibidas = 0;

      for (const cliente of clientes) {
        const mensaje = generarMensajePersonalizado(cliente);
        const numeroNormalizado = normalizePhoneNumber(cliente.numero);
        
        try {
          await sendMessageWithRateLimit(client, numeroNormalizado, mensaje);
          mensajesEnviadosHoy++;
          console.log(`Mensaje enviado a ${numeroNormalizado}`);
          
          await Midatabase.updateOne(
            { _id: cliente._id },
            { $set: { estado: 'pendiente_respuesta' } }
          );
        } catch (error) {
          console.error(`Error al enviar mensaje a ${numeroNormalizado}:`, error.message);
        }

        await sleep(INTERVALO_ENTRE_MENSAJES);
      }

      const reporteFinal = `Reporte final del lote:\n` +
                           `- Mensajes enviados: ${mensajesEnviadosHoy}\n` +
                           `- Respuestas recibidas: ${respuestasRecibidas}`;
      await enviarAlertaAdmin(client, reporteFinal);

      console.log('Lote diario completado');
    }

    // Iniciar el envío del lote diario
    await enviarLoteDiario();

    // Programar el envío diario
    setInterval(enviarLoteDiario, 24 * 60 * 60 * 1000);

    // Manejar respuestas
    client.onMessage(async (message) => {
      if (!message.isGroupMsg) {
        await handleResponse(client, message);
      }
    });

  } catch (error) {
    console.error('Error en el proceso principal:', error);
    await enviarAlertaAdmin(client, `Error en el proceso principal: ${error.message}`);
  }
}

function generarMensajePersonalizado(cliente) {
  const mensajes = [
    `Hola ${cliente.nombre}, tu cooperativa te saluda. ¿Podemos confirmar que este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, queremos asegurarnos de tener tus datos actualizados. ¿Este número sigue siendo el correcto?`,
    `Saludos desde tu cooperativa, ${cliente.nombre}. ¿Nos confirmas si este es tu número actual?`,
    `${cliente.nombre}, para brindarte un mejor servicio, ¿podrías confirmar si este sigue siendo tu número?`,
    `Hola ${cliente.nombre}, es importante mantener nuestros registros al día. ¿Este número sigue siendo tuyo?`,
    `${cliente.nombre}, tu cooperativa se preocupa por mantenerse en contacto. ¿Es este tu número actual?`,
    `Estimado/a ${cliente.nombre}, ¿podemos verificar si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir ofreciéndote nuestros servicios, ¿nos confirmas si este es tu número vigente?`,
    `Hola ${cliente.nombre}, queremos asegurarnos de poder contactarte. ¿Este número sigue siendo el correcto?`,
    `${cliente.nombre}, tu cooperativa quiere mantenerse cerca. ¿Nos confirmas si este es tu número actual?`,
    `Saludos ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para mantener nuestros canales de comunicación abiertos, ¿este número sigue siendo tuyo?`,
    `Hola desde tu cooperativa, ${cliente.nombre}. ¿Podemos verificar si este es tu número actual?`,
    `${cliente.nombre}, es importante para nosotros poder contactarte. ¿Este sigue siendo tu número?`,
    `Estimado/a ${cliente.nombre}, ¿nos ayudas confirmando si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, tu cooperativa quiere asegurarse de tener tus datos correctos. ¿Este es tu número actual?`,
    `Hola ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo el número para contactarte?`,
    `${cliente.nombre}, para mantenerte informado/a, ¿nos confirmas si este es tu número vigente?`,
    `Saludos ${cliente.nombre}, tu cooperativa quiere verificar: ¿este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir brindándote el mejor servicio, ¿este número sigue siendo el correcto?`
  ];
  
  return mensajes[Math.floor(Math.random() * mensajes.length)];
}

async function handleResponse(client, message) {
  const numeroEntrante = normalizePhoneNumber(message.from.split('@')[0]);
  const cliente = await Midatabase.findOne({ numero: parseInt(numeroEntrante) });

  if (!cliente) {
    console.log(`No se encontró cliente para el número: ${numeroEntrante}`);
    return;
  }

  const respuesta = message.body.toLowerCase().trim();

  if (respuesta === 'sí' || respuesta === 'si' || respuesta === 'no') {
    await Midatabase.updateOne(
      { _id: cliente._id },
      {
        $set: {
          estado: respuesta === 'si' || respuesta === 'sí' ? 'activo' : 'no_activo'
        }
      }
    );
    respuestasRecibidas++;
    const mensajeRespuesta = 'Gracias por su respuesta. Hemos actualizado nuestros registros.';
    await client.sendText(message.from, mensajeRespuesta);
  } else {
    await client.sendText(message.from, 'Por favor, responde "Sí" o "No" para confirmar tu número.');
  }
}

process.on('SIGINT', async () => {
  console.log('Cerrando conexiones...');
  await mongoose.connection.close();
  process.exit(0);
});*/

/*const venom = require('venom-bot');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    enviarAlertaAdmin(null, `Error al conectar a MongoDB: ${err.message}`);
  });

const midatabaseSchema = new mongoose.Schema({
  doc: String,
  nombre: String,
  tipo_contacto: String,
  numero: Number,
  estado: { type: String, default: 'no_confirmado' }
});

const Midatabase = mongoose.model('midatabase', midatabaseSchema, 'midatabase');

const LOTE_DIARIO = 10000;
const INTERVALO_ENTRE_MENSAJES = 3000;
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60000; // 60 segundos

let mensajesEnviadosHoy = 0;
let respuestasRecibidas = 0;
const rateLimitMap = new Map();

// Configuración de Winston para manejar logs
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

function normalizePhoneNumber(number) {
  let numberStr = number.toString();
  let normalized = numberStr.replace(/\D/g, '');
  if (normalized.startsWith('51') && normalized.length > 11) {
    normalized = normalized.slice(2);
  }
  return normalized.slice(-9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarAlertaAdmin(client, mensaje) {
  try {
    if (client) {
      await client.sendText(`${ADMIN_NUMBER}@c.us`, mensaje);
    }
    logger.info(`Alerta enviada al administrador: ${mensaje}`);
  } catch (error) {
    logger.error('Error al enviar alerta al administrador:', error);
  }
}

async function sendMessageWithRateLimit(client, numero, mensaje) {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(numero) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 0;
    userRateLimit.timestamp = now;
  }

  if (userRateLimit.count < RATE_LIMIT) {
    try {
      const whatsappNumber = `${numero}@c.us`;
      logger.info(`Intentando enviar mensaje a ${whatsappNumber}`);
      await client.sendText(whatsappNumber, mensaje);
      logger.info(`Mensaje enviado a ${numero}`);
      userRateLimit.count++;
      rateLimitMap.set(numero, userRateLimit);
    } catch (error) {
      logger.error(`Error al enviar mensaje a ${numero}:`, error.message);
      throw error;
    }
  } else {
    logger.warn(`Rate limit excedido para ${numero}. Intentando más tarde.`);
    throw new Error('Rate limit excedido');
  }
}

venom
  .create({
    session: 'session-name',
    multidevice: true,
    disableWelcome: true
  })
  .then((client) => {
    logger.info('Cliente iniciado correctamente');
    start(client);
  })
  .catch((erro) => {
    logger.error('Error al iniciar Venom:', erro);
  });

async function start(client) {
  try {
    logger.info('Iniciando proceso de envío de mensajes');
    
    async function enviarLoteDiario() {
      const clientes = await Midatabase.find({
        $or: [
          { estado: 'no_confirmado' },
          { estado: { $exists: false } },
          { estado: null }
        ]
      }).limit(LOTE_DIARIO);
      
      logger.info(`Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);
      await enviarAlertaAdmin(client, `Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);

      if (clientes.length === 0) {
        logger.info('No se encontraron clientes para procesar');
        await enviarAlertaAdmin(client, 'No se encontraron clientes para procesar');
        return;
      }

      mensajesEnviadosHoy = 0;
      respuestasRecibidas = 0;

      for (const cliente of clientes) {
        const mensaje = generarMensajePersonalizado(cliente);
        const numeroNormalizado = normalizePhoneNumber(cliente.numero);
        
        try {
          await sendMessageWithRateLimit(client, numeroNormalizado, mensaje);
          mensajesEnviadosHoy++;
          logger.info(`Mensaje enviado a ${numeroNormalizado}`);
          
          await Midatabase.updateOne(
            { _id: cliente._id },
            { $set: { estado: 'pendiente_respuesta' } }
          );
        } catch (error) {
          logger.error(`Error al enviar mensaje a ${numeroNormalizado}:`, error.message);
        }

        await sleep(INTERVALO_ENTRE_MENSAJES);
      }

      const reporteFinal = `Reporte final del lote:\n` +
                           `- Mensajes enviados: ${mensajesEnviadosHoy}\n` +
                           `- Respuestas recibidas: ${respuestasRecibidas}`;
      await enviarAlertaAdmin(client, reporteFinal);

      logger.info('Lote diario completado');
    }

    // Iniciar el envío del lote diario
    await enviarLoteDiario();

    // Programar el envío diario
    setInterval(enviarLoteDiario, 24 * 60 * 60 * 1000);

    // Manejar respuestas
    client.onMessage(async (message) => {
      if (!message.isGroupMsg) {
        await handleResponse(client, message);
      }
    });

  } catch (error) {
    logger.error('Error en el proceso principal:', error);
    await enviarAlertaAdmin(client, `Error en el proceso principal: ${error.message}`);
  }
}

function generarMensajePersonalizado(cliente) {
  const mensajes = [
    `Hola ${cliente.nombre}, tu cooperativa te saluda. ¿Podemos confirmar que este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, queremos asegurarnos de tener tus datos actualizados. ¿Este número sigue siendo el correcto?`,
    `Saludos desde tu cooperativa, ${cliente.nombre}. ¿Nos confirmas si este es tu número actual?`,
    `${cliente.nombre}, para brindarte un mejor servicio, ¿podrías confirmar si este sigue siendo tu número?`,
    `Hola ${cliente.nombre}, es importante mantener nuestros registros al día. ¿Este número sigue siendo tuyo?`,
    `${cliente.nombre}, tu cooperativa se preocupa por mantenerse en contacto. ¿Es este tu número actual?`,
    `Estimado/a ${cliente.nombre}, ¿podemos verificar si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir ofreciéndote nuestros servicios, ¿nos confirmas si este es tu número vigente?`,
    `Hola ${cliente.nombre}, queremos asegurarnos de poder contactarte. ¿Este número sigue siendo el correcto?`,
    `${cliente.nombre}, tu cooperativa quiere mantenerse cerca. ¿Nos confirmas si este es tu número actual?`,
    `Saludos ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para mantener nuestros canales de comunicación abiertos, ¿este número sigue siendo tuyo?`,
    `Hola desde tu cooperativa, ${cliente.nombre}. ¿Podemos verificar si este es tu número actual?`,
    `${cliente.nombre}, es importante para nosotros poder contactarte. ¿Este sigue siendo tu número?`,
    `Estimado/a ${cliente.nombre}, ¿nos ayudas confirmando si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, tu cooperativa quiere asegurarse de tener tus datos correctos. ¿Este es tu número actual?`,
    `Hola ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo el número para contactarte?`,
    `${cliente.nombre}, para mantenerte informado/a, ¿nos confirmas si este es tu número vigente?`,
    `Saludos ${cliente.nombre}, tu cooperativa quiere verificar: ¿este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir brindándote el mejor servicio, ¿este número sigue siendo el correcto?`
  ];
  
  return mensajes[Math.floor(Math.random() * mensajes.length)];
}

async function handleResponse(client, message) {
  const numeroEntrante = normalizePhoneNumber(message.from.split('@')[0]);
  const cliente = await Midatabase.findOne({ numero: parseInt(numeroEntrante) });

  if (!cliente) {
    logger.info(`No se encontró cliente para el número: ${numeroEntrante}`);
    return;
  }

  const respuesta = message.body.toLowerCase().trim();

  if (respuesta === 'sí' || respuesta === 'si' || respuesta === 'no') {
    await Midatabase.updateOne(
      { _id: cliente._id },
      {
        $set: {
          estado: respuesta === 'si' || respuesta === 'sí' ? 'activo' : 'no_activo'
        }
      }
    );
    respuestasRecibidas++;
    const mensajeRespuesta = 'Gracias por su respuesta. Hemos actualizado nuestros registros.';
    await client.sendText(message.from, mensajeRespuesta);
  } else {
    await client.sendText(message.from, 'Por favor, responda con "sí" o "no".');
  }
}
*/
/*// librerias 
const venom = require('venom-bot');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    enviarAlertaAdmin(null, `Error al conectar a MongoDB: ${err.message}`);
  });

const midatabaseSchema = new mongoose.Schema({
  doc: String,
  nombre: String,
  tipo_contacto: String,
  numero: Number,
  estado: { type: String, default: 'no_confirmado' }
});

const Midatabase = mongoose.model('midatabase', midatabaseSchema, 'midatabase');

const LOTE_DIARIO = 10000;
const INTERVALO_ENTRE_MENSAJES = 5000;
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60000; // 60 segundos

let mensajesEnviadosHoy = 0;
let respuestasRecibidas = 0;
const rateLimitMap = new Map();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

function normalizePhoneNumber(number) {
  let numberStr = number.toString();
  let normalized = numberStr.replace(/\D/g, '');
  if (normalized.startsWith('51') && normalized.length > 11) {
    normalized = normalized.slice(2);
  }
  return normalized.slice(-9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarAlertaAdmin(client, mensaje) {
  try {
    if (client) {
      await client.sendText(`${ADMIN_NUMBER}@c.us`, mensaje);
    }
    logger.info(`Alerta enviada al administrador: ${mensaje}`);
  } catch (error) {
    logger.error('Error al enviar alerta al administrador:', error);
  }
}

async function sendMessageWithRateLimit(client, numero, mensaje, cliente) {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(numero) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 0;
    userRateLimit.timestamp = now;
  }

  if (userRateLimit.count < RATE_LIMIT) {
    try {
      const whatsappNumber = `${numero}@c.us`;
      logger.info(`Intentando enviar mensaje a ${whatsappNumber}`);
      await client.sendText(whatsappNumber, mensaje);
      logger.info(`Mensaje enviado a ${numero}`);
      userRateLimit.count++;
      rateLimitMap.set(numero, userRateLimit);
    } catch (error) {
      logger.error(`Error al enviar mensaje a ${numero}:`, error.message);

      // Actualiza el estado del cliente a 'no_activo' si no se pudo enviar el mensaje
      await Midatabase.updateOne(
        { _id: cliente._id },
        { $set: { estado: 'no_activo' } }
      );
      logger.info(`Estado actualizado a 'no_activo' para el número: ${numero}`);

      throw error;
    }
  } else {
    logger.warn(`Rate limit excedido para ${numero}. Intentando más tarde.`);
    throw new Error('Rate limit excedido');
  }
}

venom
  .create({
    session: 'session-name',
    multidevice: true,
    disableWelcome: true
  })
  .then((client) => {
    logger.info('Cliente iniciado correctamente');
    start(client);
  })
  .catch((erro) => {
    logger.error('Error al iniciar Venom:', erro);
  });

async function start(client) {
  try {
    logger.info('Iniciando proceso de envío de mensajes');
    
    async function enviarLoteDiario() {
      const clientes = await Midatabase.find({
        $or: [
          { estado: 'no_confirmado' },
          { estado: { $exists: false } },
          { estado: null }
        ]
      }).limit(LOTE_DIARIO);
      
      logger.info(`Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);
      await enviarAlertaAdmin(client, `Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);

      if (clientes.length === 0) {
        logger.info('No se encontraron clientes para procesar');
        await enviarAlertaAdmin(client, 'No se encontraron clientes para procesar');
        return;
      }

      mensajesEnviadosHoy = 0;
      respuestasRecibidas = 0;

      for (const cliente of clientes) {
        const mensaje = generarMensajePersonalizado(cliente);
        const numeroNormalizado = normalizePhoneNumber(cliente.numero);
        
        try {
          await sendMessageWithRateLimit(client, numeroNormalizado, mensaje, cliente);
          mensajesEnviadosHoy++;
          logger.info(`Mensaje enviado a ${numeroNormalizado}`);
          
          await Midatabase.updateOne(
            { _id: cliente._id },
            { $set: { estado: 'pendiente_respuesta' } }
          );
        } catch (error) {
          logger.error(`Error al enviar mensaje a ${numeroNormalizado}:`, error.message);
        }

        await sleep(INTERVALO_ENTRE_MENSAJES);
      }

      const reporteFinal = `Reporte final del lote:\n` +
                           `- Mensajes enviados: ${mensajesEnviadosHoy}\n` +
                           `- Respuestas recibidas: ${respuestasRecibidas}`;
      await enviarAlertaAdmin(client, reporteFinal);

      logger.info('Lote diario completado');
    }

    await enviarLoteDiario();

    setInterval(enviarLoteDiario, 24 * 60 * 60 * 1000);

    client.onMessage(async (message) => {
      if (!message.isGroupMsg) {
        await handleResponse(client, message);
      }
    });

  } catch (error) {
    logger.error('Error en el proceso principal:', error);
    await enviarAlertaAdmin(client, `Error en el proceso principal: ${error.message}`);
  }
}

function generarMensajePersonalizado(cliente) {
  const mensajes = [
    `Hola ${cliente.nombre}, tu cooperativa te saluda. ¿Podemos confirmar que este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, queremos asegurarnos de tener tus datos actualizados. ¿Este número sigue siendo el correcto?`,
    `Saludos desde tu cooperativa, ${cliente.nombre}. ¿Nos confirmas si este es tu número actual?`,
    `${cliente.nombre}, para brindarte un mejor servicio, ¿podrías confirmar si este sigue siendo tu número?`,
    `Hola ${cliente.nombre}, es importante mantener nuestros registros al día. ¿Este número sigue siendo tuyo?`,
    `${cliente.nombre}, tu cooperativa se preocupa por mantenerse en contacto. ¿Es este tu número actual?`,
    `Estimado/a ${cliente.nombre}, ¿podemos verificar si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir ofreciéndote nuestros servicios, ¿nos confirmas si este es tu número vigente?`,
    `Hola ${cliente.nombre}, queremos asegurarnos de poder contactarte. ¿Este número sigue siendo el correcto?`,
    `${cliente.nombre}, tu cooperativa quiere mantenerse cerca. ¿Nos confirmas si este es tu número actual?`,
    `Saludos ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para mantener nuestros canales de comunicación abiertos, ¿este número sigue siendo tuyo?`,
    `Hola desde tu cooperativa, ${cliente.nombre}. ¿Podemos verificar si este es tu número actual?`,
    `${cliente.nombre}, es importante para nosotros poder contactarte. ¿Este sigue siendo tu número?`,
    `Estimado/a ${cliente.nombre}, ¿nos ayudas confirmando si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, tu cooperativa quiere asegurarse de tener tus datos correctos. ¿Este es tu número actual?`,
    `Hola ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo el número para contactarte?`,
    `${cliente.nombre}, para mantenerte informado/a, ¿nos confirmas si este es tu número vigente?`,
    `Saludos ${cliente.nombre}, tu cooperativa quiere verificar: ¿este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir brindándote el mejor servicio, ¿este número sigue siendo el correcto?`
  ];
  
  return mensajes[Math.floor(Math.random() * mensajes.length)];
}

async function handleResponse(client, message) {
  const numeroEntrante = normalizePhoneNumber(message.from.split('@')[0]);
  const cliente = await Midatabase.findOne({ numero: parseInt(numeroEntrante) });

  if (!cliente) {
    logger.info(`No se encontró cliente para el número: ${numeroEntrante}`);
    return;
  }

  const respuesta = message.body.toLowerCase().trim();

  if (respuesta === 'sí' || respuesta === 'si' || respuesta === 'no') {
    if (cliente.estado === 'confirmado') {
      await client.sendText(message.from, 'Usted ya ha respondido anteriormente. Si necesita hacer cambios, por favor comuníquese con nuestra central de atención al cliente.');
      return;
    }

    const nuevoEstado = respuesta === 'si' || respuesta === 'sí' ? 'confirmado' : 'no_activo';

    try {
      await Midatabase.updateOne(
        { _id: cliente._id },
        { $set: { estado: nuevoEstado } }
      );
      respuestasRecibidas++;
      const mensajeRespuesta = 'Gracias por su respuesta. Si necesita hacer cambios en el futuro, por favor comuníquese con nuestra central de atención al cliente.';
      await client.sendText(message.from, mensajeRespuesta);
    } catch (error) {
      logger.error(`Error al actualizar el cliente en la base de datos: ${error.message}`);
      await client.sendText(message.from, 'Hubo un problema al procesar su respuesta. Por favor, intente nuevamente más tarde.');
    }
  } else {
    await client.sendText(message.from, 'Por favor, responda con "SÍ" o "NO".');
  }
}
*/

// librerias 
const venom = require('venom-bot');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;
const ADMIN_NUMBER = process.env.ADMIN_NUMBER;

mongoose.connect(`${url}/${dbName}`)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    enviarAlertaAdmin(null, `Error al conectar a MongoDB: ${err.message}`);
  });

const midatabaseSchema = new mongoose.Schema({
  doc: String,
  nombre: String,
  tipo_contacto: String,
  numero: String, // Cambiado a String para manejar mejor los números de teléfono
  estado: { type: String, default: 'no_confirmado' }
});

const Midatabase = mongoose.model('midatabase', midatabaseSchema, 'midatabase');

const LOTE_DIARIO = 10000;
const INTERVALO_ENTRE_MENSAJES = 5000;
const RATE_LIMIT = 20;
const RATE_LIMIT_WINDOW = 60000; // 60 segundos

let mensajesEnviadosHoy = 0;
let respuestasRecibidas = 0;
const rateLimitMap = new Map();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/app.log' })
  ]
});

function normalizePhoneNumber(number) {
  let numberStr = number.toString();
  let normalized = numberStr.replace(/\D/g, '');
  if (normalized.startsWith('51') && normalized.length > 11) {
    normalized = normalized.slice(2);
  }
  return normalized.slice(-9);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function enviarAlertaAdmin(client, mensaje) {
  try {
    if (client) {
      await client.sendText(`${ADMIN_NUMBER}@c.us`, mensaje);
    }
    logger.info(`Alerta enviada al administrador: ${mensaje}`);
  } catch (error) {
    logger.error('Error al enviar alerta al administrador:', error);
  }
}

async function sendMessageWithRateLimit(client, numero, mensaje, cliente) {
  const now = Date.now();
  const userRateLimit = rateLimitMap.get(numero) || { count: 0, timestamp: now };

  if (now - userRateLimit.timestamp > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 0;
    userRateLimit.timestamp = now;
  }

  if (userRateLimit.count < RATE_LIMIT) {
    try {
      const whatsappNumber = `${numero}@c.us`;
      logger.info(`Intentando enviar mensaje a ${whatsappNumber}`);
      await client.sendText(whatsappNumber, mensaje);
      logger.info(`Mensaje enviado a ${numero}`);
      userRateLimit.count++;
      rateLimitMap.set(numero, userRateLimit);
    } catch (error) {
      logger.error(`Error al enviar mensaje a ${numero}:`, error.message);

      // Actualiza el estado del cliente a 'no_activo' si no se pudo enviar el mensaje
      await Midatabase.updateOne(
        { _id: cliente._id },
        { $set: { estado: 'no_activo' } }
      );
      logger.info(`Estado actualizado a 'no_activo' para el número: ${numero}`);

      throw error;
    }
  } else {
    logger.warn(`Rate limit excedido para ${numero}. Intentando más tarde.`);
    throw new Error('Rate limit excedido');
  }
}

venom
  .create({
    session: 'session-name',
    multidevice: true,
    disableWelcome: true
  })
  .then((client) => {
    logger.info('Cliente iniciado correctamente');
    start(client);
  })
  .catch((erro) => {
    logger.error('Error al iniciar Venom:', erro);
  });

async function start(client) {
  try {
    logger.info('Iniciando proceso de envío de mensajes');
    
    async function enviarLoteDiario() {
      const clientes = await Midatabase.find({
        $or: [
          { estado: 'no_confirmado' },
          { estado: { $exists: false } },
          { estado: null }
        ]
      }).limit(LOTE_DIARIO);
      
      logger.info(`Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);
      await enviarAlertaAdmin(client, `Iniciando envío de lote diario. Clientes a procesar: ${clientes.length}`);

      if (clientes.length === 0) {
        logger.info('No se encontraron clientes para procesar');
        await enviarAlertaAdmin(client, 'No se encontraron clientes para procesar');
        return;
      }

      mensajesEnviadosHoy = 0;
      respuestasRecibidas = 0;

      for (const cliente of clientes) {
        const mensaje = generarMensajePersonalizado(cliente);
        const numeroNormalizado = normalizePhoneNumber(cliente.numero);
        
        try {
          await sendMessageWithRateLimit(client, numeroNormalizado, mensaje, cliente);
          mensajesEnviadosHoy++;
          logger.info(`Mensaje enviado a ${numeroNormalizado}`);
          
          await Midatabase.updateOne(
            { _id: cliente._id },
            { $set: { estado: 'pendiente_respuesta' } }
          );
        } catch (error) {
          logger.error(`Error al enviar mensaje a ${numeroNormalizado}:`, error.message);
        }

        await sleep(INTERVALO_ENTRE_MENSAJES);
      }

      const reporteFinal = `Reporte final del lote:\n` +
                           `- Mensajes enviados: ${mensajesEnviadosHoy}\n` +
                           `- Respuestas recibidas: ${respuestasRecibidas}`;
      await enviarAlertaAdmin(client, reporteFinal);

      logger.info('Lote diario completado');
    }

    await enviarLoteDiario();

    setInterval(enviarLoteDiario, 24 * 60 * 60 * 1000);

    client.onMessage(async (message) => {
      if (!message.isGroupMsg) {
        await handleResponse(client, message);
      }
    });

  } catch (error) {
    logger.error('Error en el proceso principal:', error);
    await enviarAlertaAdmin(client, `Error en el proceso principal: ${error.message}`);
  }
}

function generarMensajePersonalizado(cliente) {
  const mensajes = [
    `Hola ${cliente.nombre}, tu cooperativa te saluda. ¿Podemos confirmar que este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, queremos asegurarnos de tener tus datos actualizados. ¿Este número sigue siendo el correcto?`,
    `Saludos desde tu cooperativa, ${cliente.nombre}. ¿Nos confirmas si este es tu número actual?`,
    `${cliente.nombre}, para brindarte un mejor servicio, ¿podrías confirmar si este sigue siendo tu número?`,
    `Hola ${cliente.nombre}, es importante mantener nuestros registros al día. ¿Este número sigue siendo tuyo?`,
    `${cliente.nombre}, tu cooperativa se preocupa por mantenerse en contacto. ¿Es este tu número actual?`,
    `Estimado/a ${cliente.nombre}, ¿podemos verificar si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir ofreciéndote nuestros servicios, ¿nos confirmas si este es tu número vigente?`,
    `Hola ${cliente.nombre}, queremos asegurarnos de poder contactarte. ¿Este número sigue siendo el correcto?`,
    `${cliente.nombre}, tu cooperativa quiere mantenerse cerca. ¿Nos confirmas si este es tu número actual?`,
    `Saludos ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para mantener nuestros canales de comunicación abiertos, ¿este número sigue siendo tuyo?`,
    `Hola desde tu cooperativa, ${cliente.nombre}. ¿Podemos verificar si este es tu número actual?`,
    `${cliente.nombre}, es importante para nosotros poder contactarte. ¿Este sigue siendo tu número?`,
    `Estimado/a ${cliente.nombre}, ¿nos ayudas confirmando si este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, tu cooperativa quiere asegurarse de tener tus datos correctos. ¿Este es tu número actual?`,
    `Hola ${cliente.nombre}, ¿podrías confirmarnos si este sigue siendo el número para contactarte?`,
    `${cliente.nombre}, para mantenerte informado/a, ¿nos confirmas si este es tu número vigente?`,
    `Saludos ${cliente.nombre}, tu cooperativa quiere verificar: ¿este sigue siendo tu número de contacto?`,
    `${cliente.nombre}, para seguir brindándote el mejor servicio, ¿este número sigue siendo el correcto?`
  ];
  
  return mensajes[Math.floor(Math.random() * mensajes.length)];
}

async function handleResponse(client, message) {
  const numeroEntrante = normalizePhoneNumber(message.from.split('@')[0]);
  logger.info(`Número entrante normalizado: ${numeroEntrante}`);
  
  const cliente = await Midatabase.findOne({ numero: numeroEntrante });

  if (!cliente) {
    logger.info(`No se encontró cliente para el número: ${numeroEntrante}`);
    return;
  }

  const respuesta = message.body.toLowerCase().trim();

  if (respuesta === 'sí' || respuesta === 'si' || respuesta === 'no') {
    if (cliente.estado === 'confirmado') {
      await client.sendText(message.from, 'Usted ya ha respondido anteriormente. Si necesita hacer cambios, por favor comuníquese con nuestra central de atención al cliente.');
      return;
    }

    const nuevoEstado = respuesta === 'si' || respuesta === 'sí' ? 'confirmado' : 'no_activo';

    try {
      await Midatabase.updateOne(
        { _id: cliente._id },
        { $set: { estado: nuevoEstado } }
      );
      respuestasRecibidas++;
      const mensajeRespuesta = 'Gracias por su respuesta. Si necesita hacer cambios en el futuro, por favor comuníquese con nuestra central de atención al cliente.';
      await client.sendText(message.from, mensajeRespuesta);
    } catch (error) {
      logger.error(`Error al actualizar el cliente en la base de datos: ${error.message}`);
      await client.sendText(message.from, 'Hubo un problema al procesar su respuesta. Por favor, intente nuevamente más tarde.');
    }
  } else {
    await client.sendText(message.from, 'Por favor, responda con "SÍ" o "NO".');
  }
}