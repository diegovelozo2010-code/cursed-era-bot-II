const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, userMention } = require('discord.js');
const fs = require('fs');

const config = require('./config.json');

const dbFile = './db.json';

console.log("Iniciando Cursed Era II Bot...");
console.log("Leyendo config.json...");
console.log("Token encontrado:", config.token ? "SÍ (oculto)" : "NO → ERROR");
console.log("Nombre del bot:", config.bot_name);

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
const botStartTime = Date.now();

const prefix = '-';
let db = {};
// ✅ ESTRUCTURA GLOBAL DE CLANES
let clanes = {}; // { "nombreClan": { lider: userId, miembros: [userIds], puntos: 0, fecha_creacion: timestamp } }

if (fs.existsSync(dbFile)) {
  const data = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
  db = data.users ? data : { users: data }; // Compatibilidad con formato antiguo
  clanes = data.clanes || {}; // ✅ Cargar clanes
} else {
  db = { users: {} };
  clanes = {}; // ✅ Inicializar clanes
  fs.writeFileSync(dbFile, JSON.stringify({ users: db.users, clanes }, null, 2));
}

function saveDB() {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

const raceColors = {
  'Humano': 0x0000FF,
  'Espíritu Maldito': 0xFF4500,
  'Híbrido': 0x800080,
};
// ✨ TEMAS VISUALES PARA PERFILES
const temasVisuales = {
  default: {
    nombre: "Default",
    color: 0x2F3136,
    separador: "────────────────────",
    descripcion: "Tema clásico del servidor"
  },
  oscuro: {
    nombre: "Oscuridad Absoluta",
    color: 0x000000,
    separador: "━━━━━━━━━━━━━━━━━━━━",
    descripcion: "Perfil en sombras profundas"
  },
  neon: {
    nombre: "Neón Cibernético",
    color: 0x00FFFF,
    separador: "▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬",
    descripcion: "Brillo futurista y vibrante"
  },
  fuego: {
    nombre: "Llamas Ardientes",
    color: 0xFF4500,
    separador: "🔥━━━━━━━━━━━━━━━━━🔥",
    descripcion: "Poder ardiente e imparable"
  },
  hielo: {
    nombre: "Escarcha Eterna",
    color: 0x00CED1,
    separador: "❄️━━━━━━━━━━━━━━━━━❄️",
    descripcion: "Frialdad calculadora"
  },
  sangre: {
    nombre: "Carmesí Maldito",
    color: 0x8B0000,
    separador: "⚔️━━━━━━━━━━━━━━━━━⚔️",
    descripcion: "Sed de batalla infinita"
  },
  dorado: {
    nombre: "Prestigio Dorado",
    color: 0xFFD700,
    separador: "✧･ﾟ: *✧･ﾟ:*✧･ﾟ: *✧･ﾟ:*",
    descripcion: "Elegancia y poder supremo"
  },
  veneno: {
    nombre: "Toxina Mortal",
    color: 0x9932CC,
    separador: "☠️━━━━━━━━━━━━━━━━━☠️",
    descripcion: "Peligro letal en cada palabra"
  },
  rayo: {
    nombre: "Tormenta Eléctrica",
    color: 0xFFFF00,
    separador: "⚡━━━━━━━━━━━━━━━━━⚡",
    descripcion: "Velocidad y poder devastador"
  },
  espectral: {
    nombre: "Fantasma Etéreo",
    color: 0x9370DB,
    separador: "👻━━━━━━━━━━━━━━━━━👻",
    descripcion: "Presencia sobrenatural"
  },
  naturaleza: {
    nombre: "Bosque Primordial",
    color: 0x228B22,
    separador: "🌿━━━━━━━━━━━━━━━━━🌿",
    descripcion: "Conexión con la naturaleza"
  },
  cosmos: {
    nombre: "Vacío Cósmico",
    color: 0x191970,
    separador: "⭐━━━━━━━━━━━━━━━━━⭐",
    descripcion: "Misterios del universo"
  },
  sakura: {
    nombre: "Cerezo en Flor",
    color: 0xFFB7C5,
    separador: "🌸━━━━━━━━━━━━━━━━━🌸",
    descripcion: "Belleza efímera japonesa"
  },
  dragon: {
    nombre: "Furia del Dragón",
    color: 0xB22222,
    separador: "🐉━━━━━━━━━━━━━━━━━🐉",
    descripcion: "Poder ancestral dracónico"
  },
  oceano: {
    nombre: "Profundidades Marinas",
    color: 0x006994,
    separador: "🌊━━━━━━━━━━━━━━━━━🌊",
    descripcion: "Calma y furia del océano"
  }
};

// ✨ EFECTOS VISUALES DISPONIBLES
const efectosVisuales = {
  ninguno: {
    nombre: "Sin Efecto",
    particulas: "",
    descripcion: "Perfil limpio sin efectos"
  },
  estrellas: {
    nombre: "Lluvia de Estrellas",
    particulas: "✨ ⭐ 🌟 ✨ ⭐ 🌟 ✨",
    descripcion: "Partículas estelares brillantes"
  },
  fuego: {
    nombre: "Aura de Fuego",
    particulas: "🔥 🔥 🔥 🔥 🔥 🔥 🔥",
    descripcion: "Llamas danzantes ardientes"
  },
  rayo: {
    nombre: "Chispas Eléctricas",
    particulas: "⚡ ⚡ ⚡ ⚡ ⚡ ⚡ ⚡",
    descripcion: "Energía eléctrica pura"
  },
  sakura: {
    nombre: "Pétalos de Cerezo",
    particulas: "🌸 🌸 🌸 🌸 🌸 🌸 🌸",
    descripcion: "Pétalos flotando suavemente"
  },
  oscuro: {
    nombre: "Aura Maldita",
    particulas: "💀 👻 💀 👻 💀 👻 💀",
    descripcion: "Energía maldita oscura"
  },
  luz: {
    nombre: "Resplandor Divino",
    particulas: "✨ 💫 ✨ 💫 ✨ 💫 ✨",
    descripcion: "Luz celestial brillante"
  },
  hielo: {
    nombre: "Cristales de Hielo",
    particulas: "❄️ ❄️ ❄️ ❄️ ❄️ ❄️ ❄️",
    descripcion: "Escarcha congelada"
  },
  veneno: {
    nombre: "Niebla Tóxica",
    particulas: "☠️ 🧪 ☠️ 🧪 ☠️ 🧪 ☠️",
    descripcion: "Vapores venenosos"
  },
  sangre: {
    nombre: "Gotas Carmesí",
    particulas: "🩸 ⚔️ 🩸 ⚔️ 🩸 ⚔️ 🩸",
    descripcion: "Sed de batalla"
  },
  dragon: {
    nombre: "Aliento de Dragón",
    particulas: "🐉 🔥 🐉 🔥 🐉 🔥 🐉",
    descripcion: "Poder dracónico ancestral"
  },
  cosmos: {
    nombre: "Polvo Estelar",
    particulas: "🌌 ⭐ 🌌 ⭐ 🌌 ⭐ 🌌",
    descripcion: "Partículas del cosmos"
  }
};

// 🎨 COLORES ANSI PARA TEXTO
const coloresTexto = {
  default: {
    nombre: "Blanco Default",
    codigo: "\u001b[0m",
    preview: "Texto normal"
  },
  cyan: {
    nombre: "Cian Brillante",
    codigo: "\u001b[1;36m",
    preview: "Texto cian brillante"
  },
  amarillo: {
    nombre: "Amarillo Intenso",
    codigo: "\u001b[1;33m",
    preview: "Texto amarillo"
  },
  rojo: {
    nombre: "Rojo Carmesí",
    codigo: "\u001b[1;31m",
    preview: "Texto rojo brillante"
  },
  verde: {
    nombre: "Verde Esmeralda",
    codigo: "\u001b[1;32m",
    preview: "Texto verde brillante"
  },
  azul: {
    nombre: "Azul Profundo",
    codigo: "\u001b[1;34m",
    preview: "Texto azul brillante"
  },
  magenta: {
    nombre: "Magenta Místico",
    codigo: "\u001b[1;35m",
    preview: "Texto magenta"
  },
  blanco: {
    nombre: "Blanco Puro",
    codigo: "\u001b[1;37m",
    preview: "Texto blanco brillante"
  },
  gris: {
    nombre: "Gris Oscuro",
    codigo: "\u001b[0;90m",
    preview: "Texto gris"
  },
  naranja: {
    nombre: "Naranja Fuego",
    codigo: "\u001b[0;33m",
    preview: "Texto naranja"
  }
};
function aplicarPersonalizacion(embed, profile, member) {
  const perso = profile.personalizacion || {
    color_embed: null,
    tema: "default",
    efecto_visual: "ninguno",
    separador: "default",
    color_texto: "default",
  };
  
  // Aplicar color del embed (modo normal)
  let colorEmbed = perso.color_embed;
  
  if (!colorEmbed && perso.tema && temasVisuales[perso.tema]) {
    colorEmbed = temasVisuales[perso.tema].color;
  }
  
  if (!colorEmbed) {
    colorEmbed = raceColors[profile.race] || 0x2F3136;
  }
  
  embed.setColor(colorEmbed);
  
  // Aplicar efecto visual
  const efecto = efectosVisuales[perso.efecto_visual] || efectosVisuales.ninguno;
  
  // Obtener separador del tema
  let separador = "────────────────────";
  if (perso.tema && temasVisuales[perso.tema]) {
    separador = temasVisuales[perso.tema].separador;
  }
  
  return {
    
    efecto,
    separador,
    colorTexto: coloresTexto[perso.color_texto] || coloresTexto.default,
    elementos: null
  };
}


// ← FALTABA LA FUNCIÓN getProfile - AHORA AGREGADA
function getProfile(userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      race: "Sin tirar",
      clan: "Sin tirar",
      sub_raza: null,
      energia_inicial: null, 
      escuela: "Sin tirar",
      ubicacion: '📍 Tokyo, Japón',
      potencial: "Sin tirar",
      especial: 'Sin tirar',  // Agregar esta línea junto a race, clan, potencial, etc.
      ritual_hereditario: "Sin tirar",
      ritual: "Sin tirar",
      atadura: null,
      rr: 5,
      bando: null,
      cantidad_prodigios: null,
      tipos_prodigio: [],
      rr_prodigio_usados: 0,
      grado_social: "Sin grado",
      grado_general: "Sin grado",
      grado_general: "Sin grado",
      // ✅ NUEVOS CAMPOS PARA HÍBRIDOS
      grado_hechicero: "Sin grado",      // Grado como hechicero
      grado_maldicion: "Sin grado",      // Grado como maldición
      tecnica: "Sin definir",
      xp_total: 0,
      quote: null,
      icon: null,
      banner: null,
      // ✨ SISTEMA DE PERSONALIZACIÓN VISUAL
      personalizacion: {
        color_embed: null,
        tema: "default",
        efecto_visual: "ninguno",
        separador: "default",
        color_texto: "default",
        modo_oscuro: false  // ✅ AGREGAR ESTA LÍNEA
      },
      raza_craft: "Sin definir",
      clan_craft: "Sin definir",
      especial_1: "Ninguno",
      especial_2: "Ninguno",
      ritual_craft: "Ninguno",
      amigos: [],
      rivales: [],
      solicitudes_amistad: [],
      clan_guild: null,
      cooldowns: {
        trabajar: 0,
        apostar: 0
      },
      prestamos_dados: [],
      prestamos_recibidos: [],
      ventas_activas: [],
      historial_xp: [],
      historial_yenes: [],
      misiones: { "4": 0, "3": 0, "semi2": 0, "2": 0, "semi1": 0, "1": 0, "semiespecial": 0, "especial": 0 },
      stats: {
        fuerza: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        velocidad: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        resistencia: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        "Energía Maldita": 0,
        Objetos: "Ninguno",
        Personaje: "Ninguno"
      },
      rct: false,
      rct_tier: null, // Nuevo: Tier de RCT (D, C, B, A, S, Z)
      maestria: 0, // Nuevo: Porcentaje de maestría (0-200%)
      // ✅ NUEVO: Buffos de prodigio aplicados
      buffos_prodigio: {
        fisico: false,
        energetico: false,
        inverso: false
      },
      // ✅ SISTEMA DE FAMA
      fama_nivel: 0,
      fama_xp: 0,
      fama_xp_total: 0,
      fama_hazanas: []
    };
    saveDB();
    console.log(`Perfil creado para ${userId}`);
  }
  
  // ✅ ASEGURAR QUE PERFILES ANTIGUOS TENGAN PERSONALIZACIÓN
  if (!db.users[userId].personalizacion) {
    db.users[userId].personalizacion = {
      color_embed: null,
      tema: "default",
      efecto_visual: "ninguno",
      separador: "default",
      color_texto: "default",
      modo_oscuro: false
    };
    saveDB();
  }
  
  return db.users[userId];
}
function getXpRequeridaFama(nivel) {
  if (nivel >= 0 && nivel <= 9) return 400;
  if (nivel >= 10 && nivel <= 19) return 800;
  if (nivel >= 20 && nivel <= 39) return 1200;
  if (nivel >= 40 && nivel <= 49) return 1600;
  if (nivel >= 50 && nivel <= 99) return 2000;
  if (nivel >= 100 && nivel <= 149) return 2500;
  if (nivel >= 150 && nivel <= 200) return 3000;
  return 4000;
}

function getNombreNivelFama(nivel) {
  if (nivel >= 0 && nivel <= 9) return "Persona Corriente";
  if (nivel >= 10 && nivel <= 19) return "Persona Levemente Importante";
  if (nivel >= 20 && nivel <= 39) return "Conocedor del Mundo Jujutsu";
  if (nivel >= 40 && nivel <= 49) return "Personas Importantes";
  if (nivel >= 50 && nivel <= 99) return "Personas Famosas";
  if (nivel >= 100 && nivel <= 149) return "Figura de la Hechicería";
  if (nivel >= 150 && nivel <= 200) return "Figuras Mundiales";
  return "Hechiceros de Grado Mundial";
}

function getColorNivelFama(nivel) {
  if (nivel >= 0 && nivel <= 9) return 0x808080;
  if (nivel >= 10 && nivel <= 19) return 0xFFFFFF;
  if (nivel >= 20 && nivel <= 39) return 0x00FF00;
  if (nivel >= 40 && nivel <= 49) return 0x0080FF;
  if (nivel >= 50 && nivel <= 99) return 0x8000FF;
  if (nivel >= 100 && nivel <= 149) return 0xFF8000;
  if (nivel >= 150 && nivel <= 200) return 0xFF0000;
  return 0xFFD700;
}

function agregarXpFama(userId, cantidad, razon = "Sin especificar") {
  const profile = getProfile(userId);
  
  if (!profile.fama_xp) profile.fama_xp = 0;
  if (!profile.fama_nivel) profile.fama_nivel = 0;
  if (!profile.fama_xp_total) profile.fama_xp_total = 0;
  if (!profile.fama_hazanas) profile.fama_hazanas = [];
  
  profile.fama_xp += cantidad;
  profile.fama_xp_total += cantidad;
  
  profile.fama_hazanas.push({
    fecha: Date.now(),
    razon: razon,
    xp: cantidad
  });
  
  let subiDeNivel = false;
  let nivelesSubidos = 0;
  
  while (profile.fama_xp >= getXpRequeridaFama(profile.fama_nivel)) {
    profile.fama_xp -= getXpRequeridaFama(profile.fama_nivel);
    profile.fama_nivel++;
    subiDeNivel = true;
    nivelesSubidos++;
  }
  
  saveDB();
  
  return {
    subiDeNivel,
    nivelesSubidos,
    nivelActual: profile.fama_nivel,
    xpActual: profile.fama_xp,
    xpRequerida: getXpRequeridaFama(profile.fama_nivel),
    nombreNivel: getNombreNivelFama(profile.fama_nivel)
  };
}

function obtenerTierAleatorioRCT() {
  const tiers = [
    { tier: 'D', peso: 5 },   // Muy raro
    { tier: 'C', peso: 25 },  // Común
    { tier: 'B', peso: 30 },  // Común
    { tier: 'A', peso: 25 },  // Común
    { tier: 'S', peso: 10 },  // Raro
    { tier: 'Z', peso: 5 }    // Muy raro
  ];
  
  const totalPeso = tiers.reduce((sum, t) => sum + t.peso, 0);
  let random = Math.random() * totalPeso;
  
  for (const t of tiers) {
    if (random < t.peso) return t.tier;
    random -= t.peso;
  }
  
  return 'C'; // Fallback
}

function getMaestriaRequeridaTier(tier) {
  const requisitos = {
    'D': 75,
    'C': 90,
    'B': 105,
    'A': 120,
    'S': 135,
    'Z': 165
  };
  return requisitos[tier] || 75;
}

function actualizarTierPorMaestria(profile) {
  if (!profile.rct || !profile.rct_tier) return;
  
  const maestria = profile.maestria || 0;
  const tierActual = profile.rct_tier;
  
  // Orden de tiers
  const tierOrden = ['D', 'C', 'B', 'A', 'S', 'Z'];
  const indexActual = tierOrden.indexOf(tierActual);
  
  // Verificar si puede subir de tier
  for (let i = tierOrden.length - 1; i > indexActual; i--) {
    const tier = tierOrden[i];
    const requerido = getMaestriaRequeridaTier(tier);
    
    if (maestria >= requerido) {
      profile.rct_tier = tier;
      return tier; // Retorna el nuevo tier
    }
  }
  
  return null; // No subió
}

function getCapacidadesRCT(tier) {
  const capacidades = {
    'D': {
      nombre: 'Tier D - Principiante',
      color: 0x808080,
      capacidades: [
        '🩹 Cortes superficiales: 2 turnos | EP: 5%',
        '🩹 Hemorragias leves: 3 turnos | EP: 7%',
        '❌ Fisuras óseas: No posible',
        '❌ Órganos: No posible'
      ]
    },
    'C': {
      nombre: 'Tier C - Hanezoki',
      color: 0x4A90E2,
      capacidades: [
        '🩹 Cortes profundos: 2 turnos | EP: 8%',
        '🦴 Fracturas simples: 4 turnos | EP: 12%',
        '🩸 Hemorragias graves: 3 turnos | EP: 10%',
        '🫀 Daño interno leve: 5 turnos | EP: 15%',
        '❌ Órganos destruidos: No posible'
      ]
    },
    'B': {
      nombre: 'Tier B - Choso',
      color: 0x9B59B6,
      capacidades: [
        '🦴 Fracturas complejas: 3 turnos | EP: 15%',
        '🫀 Órgano perforado: 5 turnos | EP: 20%',
        '💪 Reconstrucción muscular: 4 turnos | EP: 18%',
        '❌ Cerebro: No posible',
        '❌ Extremidades completas: No posible'
      ]
    },
    'A': {
      nombre: 'Tier A - Yuji/Higuruma',
      color: 0xE67E22,
      capacidades: [
        '🫀 Órgano gravemente dañado: 3 turnos | EP: 20%',
        '🦾 Extremidad amputada: 6 turnos | EP: 30%',
        '💥 Daño masivo corporal: 5 turnos | EP: 25%',
        '👥 Curar a otros: Doble coste EP'
      ]
    },
    'S': {
      nombre: 'Tier S - Kenjaku/Yuta',
      color: 0xF39C12,
      capacidades: [
        '❤️ Órganos críticos: 2 turnos | EP: 25%',
        '🦾 Extremidad amputada: 4 turnos | EP: 35%',
        '💥 Múltiples daños graves: 3 turnos | EP: 30%',
        '☠️ Neutralizar veneno',
        '🧠 Regenerar daño cerebral'
      ]
    },
    'Z': {
      nombre: 'Tier Z - Gojo/Sukuna',
      color: 0xFF0000,
      capacidades: [
        '❤️ Órganos críticos: 1 turno | EP: 20%',
        '🦾 Extremidades: 2 turnos | EP: 25%',
        '💥 Daño masivo general: 2 turnos | EP: 30%',
        '☠️ Neutralizar cualquier veneno',
        '🧠 Regenerar cerebro completo',
        '⚡ Mantener cuerpo activo mientras regenera'
      ]
    }
  };
  
  return capacidades[tier] || capacidades['D'];
}

const raceProbs = [
  { race: 'Humano', prob: 0.4995 },
  { race: 'Espíritu Maldito', prob: 0.4995 },
  { race: 'Híbrido', prob: 0.05 },
];

const clanProbs = [
  { clan: 'Gojo', prob: 0.025 },
  { clan: 'Itadori', prob: 0.03 },
  { clan: 'Zenin', prob: 0.025 },
  { clan: 'Kamo', prob: 0.04 },
  { clan: 'Inumaki', prob: 0.02 },
  { clan: 'Ashiya', prob: 0.05 },
  { clan: 'Kugisaki', prob: 0.10 },
  { clan: 'Okkotsu', prob: 0.015 },      // 1.5% - Muy raro
  { clan: 'Geto', prob: 0.015 },         // 1.5% - Muy raro
  { clan: 'Kashimo', prob: 0.015 },      // 1.5% - Muy raro  
  { clan: 'Abe', prob: 0.015 },          // 1.5% - Muy raro
  { clan: 'Normal', prob: 0.60 },        // 60% - Ajustado
  {clan: 'Ryomen', prob: 0.005 },          // 0.5% - Muy raro
];

const potencialProbs = [
  { potencial: 'Nulo', prob: 0.01 },
  { potencial: 'Común', prob: 0.70 },
  { potencial: 'Superior', prob: 0.25 },
  { potencial: 'Prodigio', prob: 0.04 }
];

const potencialData = {
  'Nulo': { message: '# ¡Perdon!\n\nSin potencial especial, pero puedes intentarlo de nuevo con rr.' },
  'Común': {
    message: `▂▃▅▇█👀Potencial👀█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *_Potencial común_*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`Donde todos ven un gran esfuerzo, tú también lo ves, donde para todos algo es fácil, para tí también, no sobresales por nada en general, pero algo es mejor que simplemente ser un inútil... Verdad?\`***
:・・──────────・・✦・・────
> https://cdn.discordapp.com/attachments/1410591423488856165/1412184489324449894/8e94855eb50345603849e1252d9bfa84.gif?ex=68b75ecb&is=68b60d4b&hm=9926e42d3d9ef1e900a8402f1ed58f81409d03676f53eb69a531d89a410afb8a&
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Superior': {
    message: `▂▃▅▇█👀Potencial👀█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *_Potencial superior_*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`Dificultades? Apenas ves, todo en tu camino tiene una ficha significativa para llegar a ser el mejor, todo lo que sea inútil que se aparte de tu camino, tú no eres un simple usuario maldito común, tú eres alguien sobresaliente\`***
:・・──────────・・✦・・────
> https://cdn.discordapp.com/attachments/1410591423488856165/1412191671411806218/ba1e6d65641fd9bbea7b1c5f617cbc91.gif?ex=68b7657b&is=68b613fb&hm=ac312588b50b061d9ae7a3a3426f6ddbd1df71c12a6d815c3d45b905e713e8e2&
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Prodigio': {
    message: `▂▃▅▇█👀Potencial👀█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *_Prodigio_*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`Temed todos los que estéis en mi camino, a partir de ahora no habrá tanta piedad... Efectivamente, en el mundo del jujutsu tú fuiste bendecido, naciendo prodigio, sea de los rituales inversos o de extensión de em, tú realmente vales la pena\`***
:・・──────────・・✦・・────
> https://cdn.discordapp.com/attachments/1410591423488856165/1412225816502472785/cd1c6df83fd117ae81fe85cf0395343d.gif?ex=68b78548&is=68b633c8&hm=e2025ae5dac7fc17fc4759aaaec57dd52afb3b7065a552f790b680c424755c5c&
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  }
};

const escuelaData = {
  'Tokyo': {
    message: `▂▃▅▇█🏫Escuelas🏫█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *_Escuela de Tokyo_*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`Felicidades, dentro de las dos escuelas a ti te toca la mejor. Con profesores de la más alta calidad dy un hambiente escolar 10/10, disfruta!!!\`***
:・・──────────・・✦・・────
> https://tenor.com/view/tokyo-jujutsu-kaisen-jujustu-tech-high-noroi-curses-gif-20880289
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Kyoto': {
    message: `▂▃▅▇█🏫Escuelas🏫█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *_Escuela de Kyoto_*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`Yupi! Te han aceptado en una escuela de hechicería, aunque no sea la mejor ten en cuenta que sigue siendo un logro haber llegado hasta aquí, disfruta!!\`***
:・・──────────・・✦・・────
> https://tenor.com/view/jujutsu-kaisen-aoi-todo-jjk-gif-13039181741092275866
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  }
};

const ritualProbsByClan = {
  'Gojo': [
    { ritual: 'Ninguno', prob: 0.9 },
    { ritual: 'Limitless', prob: 0.1 }
  ],
  'Zenin': [
    { ritual: 'Ninguno', prob: 0.35 },
    { ritual: 'Atadura Física', prob: 0.35 },
    { ritual: 'Proyección', prob: 0.2 },
    { ritual: '10 Sombras', prob: 0.1 }
  ],
  'Kamo': [
    { ritual: 'Ninguno', prob: 0.65 },
    { ritual: 'Manipulación de Sangre', prob: 0.35 }
  ],
  'Inumaki': [
    { ritual: 'Ninguno', prob: 0.65 },
    { ritual: 'Palabra Maldita', prob: 0.35 }
  ],
  'Kugisaki': [
    { ritual: 'Ninguno', prob: 0.65 },
    { ritual: 'Muñeco vudu', prob: 0.35 }
  ],
  'Itadori': [
    { ritual: 'Ninguno', prob: 0.85 },
    { ritual: 'Santuario moderno', prob: 0.15 }
  ],
  'Ashiya': [{ ritual: 'Ninguno', prob: 1.0 }],
  'Normal': [{ ritual: 'Ninguno', prob: 1.0 }],
  'Okkotsu': [
  { ritual: 'Ninguno', prob: 0.85 },
  { ritual: 'Mimetismo', prob: 0.15 }
],
'Geto': [
  { ritual: 'Ninguno', prob: 0.85 },
  { ritual: 'Manipulación de Maldiciones', prob: 0.15 }
],
'Kashimo': [
  { ritual: 'Ninguno', prob: 0.85 },
  { ritual: 'Bestia Ámbar', prob: 0.15 }
],
'Abe': [
  { ritual: 'Ninguno', prob: 1.00},
],
'Ryomen': [
  { ritual: 'Ninguno', prob: 0.90 },
  { ritual: 'Relicario', prob: 0.05 }
],
};
// ════════════════════════════════════════════════════════════════
// 🃏 SISTEMA DE BLACKJACK MEJORADO - CURSED ERA II
// ════════════════════════════════════════════════════════════════

// Agrega esto después de tus arrays de probabilidades (línea ~220)

// 🎴 REPRESENTACIÓN DE CARTAS
const cardSymbols = {
  '♠️': 'Picas',
  '♥️': 'Corazones', 
  '♦️': 'Diamantes',
  '♣️': 'Tréboles'
};

const cardValues = {
  'A': 11, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 10, 'Q': 10, 'K': 10
};

// 🎲 Crear una baraja completa
function crearBaraja() {
  const palos = ['♠️', '♥️', '♦️', '♣️'];
  const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const baraja = [];
  
  for (let palo of palos) {
    for (let valor of valores) {
      baraja.push({ valor, palo });
    }
  }
  
  // Mezclar baraja
  for (let i = baraja.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [baraja[i], baraja[j]] = [baraja[j], baraja[i]];
  }
  
  return baraja;
}

// 🎯 Calcular valor de mano (considera Ases)
function calcularMano(cartas) {
  let valor = 0;
  let ases = 0;
  
  for (let carta of cartas) {
    if (carta.valor === 'A') {
      ases++;
      valor += 11;
    } else {
      valor += cardValues[carta.valor];
    }
  }
  
  // Ajustar Ases si es necesario
  while (valor > 21 && ases > 0) {
    valor -= 10;
    ases--;
  }
  
  return valor;
}

// 🎨 Formatear cartas para mostrar
function mostrarCartas(cartas, ocultar = false) {
  if (ocultar) {
    // Mostrar solo la primera carta del dealer
    return `┌─────┐ ┌─────┐\n│ ${cartas[0].valor.padEnd(2)} ${cartas[0].palo} │ │ ??? │\n└─────┘ └─────┘`;
  }
  
  let top = '';
  let middle = '';
  let bottom = '';
  
  for (let carta of cartas) {
    top += '┌─────┐ ';
    middle += `│ ${carta.valor.padEnd(2)} ${carta.palo} │ `;
    bottom += '└─────┘ ';
  }
  
  return `${top}\n${middle}\n${bottom}`;
}

// 🎰 Guardar partidas activas
const partidasBlackjack = new Map();
const ritualMessages = {
  'Limitless': '¡Obtuviste el ritual hereditario **Limitless**! (Raro, solo 10% en Gojo)',
  'Atadura Física': '¡Obtuviste el ritual hereditario **Atadura Física**!',
  'Proyección': '¡Obtuviste el ritual hereditario **Proyección**!',
  '10 Sombras': '¡Obtuviste el ritual hereditario **10 Sombras**! (Muy raro)',
  'Manipulación de Sangre': '¡Obtuviste el ritual hereditario **Manipulación de Sangre**!',
  'Palabra Maldita': '¡Obtuviste el ritual hereditario **Palabra Maldita**!',
  'Muñeco vudu': '¡Obtuviste el ritual hereditario **Muñeco vudu**!',
  'Santuario moderno': '¡Obtuviste el ritual hereditario **Santuario moderno**!',
  'Ninguno': 'No obtuviste ritual hereditario esta vez. ¡Mala suerte!',
  'Mimetismo': {
  message: `# - 💍 - Mimetismo - 💍 -
> ***___\`\`\`Técnica hereditaria del Clan Okkotsu que permite copiar temporalmente técnicas de otros hechiceros mediante la observación directa. El usuario puede replicar movimientos, patrones de energía maldita y hasta fragmentos de técnicas ajenas, convirtiéndose en un espejo letal de sus oponentes. Requiere alta concentración y una conexión profunda con la energía maldita del objetivo.\`\`\`___***
# [_\`Espejo de almas, ladrón de esencias malditas\`__](https://tenor.com/view/yuta-okkotsu-jujutsu-kaisen-jjk-anime-gif-1157024409004607167)
───────────────`,
  color: 0x9B30FF
},
'Manipulación de Maldiciones': {
  message: `# - 🍥 - Manipulación de Maldiciones - 🍥 -
> ***___\`\`\`Ritual hereditario del Clan Geto que otorga control absoluto sobre espíritus malditos derrotados. El usuario puede absorber, almacenar y desplegar maldiciones como armas vivientes, construyendo un ejército personal de criaturas sobrenaturales. Cada maldición absorbida incrementa el arsenal del hechicero, convirtiéndolo en un general de pesadillas.\`\`\`___***
# [_\`Coleccionista de almas, comandante de la oscuridad\`__](https://tenor.com/view/suguru-geto-jujutsu-kaisen-geto-gif-22435751)
───────────────`,
  color: 0x4B0082
},
'Bestia Ámbar': {
  message: `# - ⚡️ - Bestia Ámbar - ⚡️ -
> ***___\`\`\`Transformación hereditaria del Clan Kashimo que convierte al usuario en una forma electrificada primordial. La técnica inunda el cuerpo con voltaje extremo, otorgando velocidad sobrehumana, golpes eléctricos devastadores y regeneración acelerada. Una vez activada, el usuario se vuelve una tormenta viviente de destrucción pura.\`\`\`___***
# [_\`Trueno ancestral, forma que desintegra al contacto\`__](https://tenor.com/view/kashimo-hajime-kashimo-jujutsu-kaisen-jjk-gif-3180011158649716223)
───────────────`,
  color: 0xFFFF00
},
'Relicario': {
  message: `# - 💎 - Relicario - 💎 -
> ***___\`\`\`Ritual hereditario del Clan Ryomen que otorga acceso a un ritual milenario de la Era Heian, puedes generar cortes invisibles al ojo humano\`\`\`___***
# [_\`Guardián de antigüedades, portador de poder eterno\`__](https://tenor.com/view/ryomen-sukehiro-jujutsu-kaisen-ryomen-jjk-gif-3944668121426528312)
───────────────`,
  color: 0x00FF00
},
};

function weightedRandom(options) {
  let sum = options.reduce((acc, o) => acc + o.prob, 0);
  let r = Math.random() * sum;
  let current = 0;
  for (const o of options) {
    current += o.prob;
    if (r <= current) return o;
  }
  return options[0];
}

const raceData = {
  'Humano': {
    emoji: '🧑⚡',
    color: 0x0000FF,
    title: '🧑 ¡HUMANO! ⚡',
    desc: '**# Humanos 🔥** Los Humanos son individuos que generalmente poseen Energía Maldita, pero muy pocos la controlan. Suelen trabajar como **Brujos o Chamanes**, pero también pueden trabajar de forma personal sin necesidad de hacer parte de algún Bando. ¡Tienes el POTENCIAL para dominar la energía maldita... o ser devorado por ella! ¿Serás el próximo Gojo Satoru? 🔵✨',
    footer: "Controla tu energía o serás comida de maldiciones!",
    image: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/8/84/Satoru_Gojo.png/revision/latest"
  },
  'Espíritu Maldito': {
    emoji: '👹🔥',
    color: 0xFF4500,
    title: '👹 ¡ESPÍRITU MALDITO! 👹',
    desc: '**# Espíritus Malditos 🔥** Los Espíritus Malditos son una especie de seres espirituales que nacen de la energía maldita como producto de las emociones intensas que manifiestan los humanos. Son espíritus con habilidades sobrenaturales que existen para destruir a la humanidad. Las emociones negativas como el odio, el miedo, los celos, la vergüenza y arrepentimiento hacen que la energía maldita se escape de los cuerpos de los humanos y el flujo que producen, termina por dar forma a un espíritu maldito. Suelen nacer en zonas pobladas como escuelas y hospitales donde muchas personas tienden a tener emociones negativas. Sin embargo, si un humano o grupo de humanos comparte sentimientos negativos hacia lo mismo, es muy probable que la maldición se forme en dicho lugar, por ejemplo, si se muestra repudio al océano, la maldición comenzará su formación allí.',
    footer: "¡El odio humano te dio vida! 🔥",
    image: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/6/6b/Mahito_profile.png/revision/latest"
  },
  'Híbrido': {
    emoji: '🧬💀',
    color: 0x9B30FF,
    title: '🧬 ¡Híbrido! ANOMALÍA ABSOLUTA 🧬',
    desc: '**# Híbridos 🔥** Son Espíritus Malditos mitad humano, mitad espíritu maldito. No está claro cómo se forman exactamente. En la era Meiji, Noritoshi Kamo experimentó con los nueve fetos abortados de una mujer que podía dar a luz a niños que eran mitad maldición. Los primeros tres, Choso, Esou y Kechizu, eran lo suficientemente fuertes como para convertirse en maldiciones de grado especial. ¡ERES UNA RAREZA 0.1%! El mundo te temerá... o te cazará. 👑💀',
    footer: "¡Mitad humano, mitad destrucción! Solo 1 de cada 1000...",
    image: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/3/3f/Yuji_Itadori.png/revision/latest"
  }
};

const clanData = {
  'Gojo': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan Gojo**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Felicidades, estás dentro del clan con más poder dentro del mundo del jujutsu, se les conoce por ser gente arrogante y creerse superior... Por eso mismo ten cuidado... Hay rumores de que a Tenmy le caen muy mal los Gojo... Duerme con un ojo abierto\`***
:・・──────────・・✦・・────
https://tenor.com/view/jujutsu-kaisen-gojo-satoru-gojo-anime-gif-20545554
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Zenin': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan Zen'in**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Felicidades? Estás dentro del segundo clan con más poder en el jujutsu, podrian ser los primeros pero... son machistas misogenis y clasistas, el clan Zenin es poca broma, solo si tienes proyección tendrás una vida decente\`***
:・・──────────・・✦・・────
https://tenor.com/view/naoya-zenin-naoya-fight-naoya-vs-maki-maki-vs-naoya-jjk-gif-9229815447310097644
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Ashiya': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan Ashiya**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Definitivamente premio, tienes la suerte de compartir clan con las goat, kukasabe el primer grado más fuerte y miwa, la jujutsu kaisen, adáptate al clan y desarrolla el NSS para ser más fuerte aún\`***
:・・──────────・・✦・・────
https://tenor.com/view/miwa-jujutsu-kaisen-miwa-jujutsu-kaisen-gif-21550140
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Kamo': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan Kamo**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`El clan Kamo es uno de los tres grandes clanes, hablando de comparaciones es el más sano entre los tres, si naces con el ritual hereditario serás alguien importante, pero si no.... Tampoco importa mucho, solamente no te tratarán como a un rey\`***
:・・──────────・・✦・・────
https://tenor.com/view/choso-vs-yuji-jujutsu-kaisen-bathroom-standoff-bloodfist-gif-11374211764368239807
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Inumaki': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan inumaki**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Un clan bastante nuevo y desconocido, la información que se tiene sobre ellos es de su ritual, uno bastante poderoso si tienes en cuenta sus bases, disfruta de tu vida en posiblemente el único clan sano del todo\`***
:・・──────────・・✦・・────
https://tenor.com/view/toge-inumaki-jujutsu-kaisen-anime-gif-20440927
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Kugisaki': {
    message: `▂▃▅▇█🏠Familia🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Familia Kugisaki**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Definitivamente es algo normal ni tan malo, tienes suerte supongo, su ritual hereditario es de mucha ayuda.\`***
:・・──────────・・✦・・────
https://tenor.com/view/nobara-nobara-kugisaki-jujutsu-kaisen-anime-jjk-gif-17915797889295222143
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Itadori': {
    message: `▂▃▅▇█🏠Familia🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Familia Itadori**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Nada mal, una familia muy escasa y que fue uso de los planes de Kenjaku, eres alguien muy fuerte fisicamente...\`***
:・・──────────・・✦・・────
https://tenor.com/view/jujutsu-kaisen-jjk-itadori-yuji-gif-17158737572179233528
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Ryomen': {
    message: `▂▃▅▇█🏠Clanes🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
**Clan Ryomen**
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Eres descendiente del ser más poderoso que jamás existió en el mundo del Jujutsu. El Clan Ryomen no es un clan cualquiera... es un linaje maldito y glorioso al mismo tiempo. Pocos lo obtienen, menos aún lo merecen. Carga ese nombre con todo lo que implica.\`***
:・・──────────・・✦・・────
https://tenor.com/view/sukuna-sukuna-talking-gif-9280383831709550420
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
  'Normal': {
    message: `▂▃▅▇█🏠Familia🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Perdón por no haberte dado un clan épico esta vez... no salió nada "bueno", pero no te preocupes! Tienes todo el potencial para crear tu propio legado y ser más fuerte que cualquiera de los grandes clanes. ¡Te deseo mucha suerte en tu camino, vas a romperla igual! \`***
:・・──────────・・✦・・────
#  ¡Lo siento! No obtuviste clan...
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  },
'Okkotsu': {
  message: `# -  💍 - Clan Okkotsu - 💍 - 
> ***___\`\`\`El Clan Okkotsu es un linaje poco numeroso y casi desconocido dentro del mundo del Jujutsu, pero con una herencia espiritual que lo vincula directamente a uno de los grandes hechiceros de la historia. Sus miembros destacan por una afinidad anormalmente alta con la energía maldita y una capacidad única para crear, portar o sostener maldiciones de nivel especial sin colapsar, lo que los convierte en "contenedores" y combatientes con un potencial que puede escalar hasta el rango especial.\`\`\`___***  
# [_\`Herederos de un monstruo, corazones que cargan maldiciones imposibles\`__](https://tenor.com/view/jujutsu-kaisen-jjk-yuta-okkotsu-pose-gif-11426266631782289733)
───────────────`,
  color: 0x9B30FF
},
'Geto': {
  message: `# -  🍥 - Clan Geto - 🍥 - 
> ***___\`\`\`Una familia altamente desconocida, llena de prodigios inexplicables que garantizan reconocimiento inmediato por capacidades elevadas en combate y gran intelecto táctico. Sus miembros dominan el cuerpo a cuerpo con maestría innata, convirtiendo cada enfrentamiento en demostración de superioridad absoluta.\`\`\`___***  
# [_\`Prodigios ocultos, amos de maldiciones y mentes\`__](https://tenor.com/view/suguru-geto-suguru-geto-geto-suguru-despair-gif-17298411925671335656)
───────────────`,
  color: 0x4B0082
},
'Kashimo': {
  message: `# -  ⚡️ - Clan Kashimo - ⚡️ - 
> ***___\`\`\`Los miembros del Clan Kashimo son luchadores excepcionales en todos los sentidos, dominando artes marciales con maestría absoluta. Su energía maldita posee propiedades eléctricas, manteniendo el cuerpo en constante electrificación que hace casi imposible defender golpes físicos reforzados, mientras otorga resistencia natural a la electricidad.\`\`\`***  
# [_\`Relámpagos marciales, puños que queman al tocar\`__](https://tenor.com/view/kashimo-hajime-jujutsu-kaisen-season-3-introduction-gif-10372464555723862258)
───────────────`,
  color: 0xFFFF00

},
'Abe': {
  message: `- 😇 - Clan Abe - 😇 - 
> ***___\`\`\`El Clan Abe es un linaje originario de Medio Oriente, lejos del epicentro del Jujutsu en Japón. Son vistos como símbolos de esperanza: verdaderos "ángeles de la guarda" para hechiceros que han sido consumidos por la oscuridad, ofreciendo guía, consuelo y una luz al final del túnel que es el mundo de la hechicería. No destacan por fuerza bruta, sino por su rol de apoyo, fe inquebrantable y presencia casi celestial en el campo de batalla.\`\`\`___***  
# [_\`Alas de esperanza, voces que levantan a los caídos\`__](https://tenor.com/view/hana-hana-kurusu-jujutsu-kaisen-culling-game-jjk-gif-3762186717798910089) 
───────────────`,
  color: 0xFFD700
},
};

function createBuildEmbed(member) {
  const profile = getProfile(member.id);
  
  let fraseDisplay = profile.quote ? `__*"${profile.quote}"*__` : "__*Sin frase personalizada*__";
  
  // Calcular maestría y técnicas desbloqueadas
  const maestria = profile.maestria || 0;
  const tecnicasDesbloqueadas = [];
  if (maestria >= 10) tecnicasDesbloqueadas.push('G4');
  if (maestria >= 30) tecnicasDesbloqueadas.push('G3');
  if (maestria >= 50) tecnicasDesbloqueadas.push('G2');
  if (maestria >= 70) tecnicasDesbloqueadas.push('G1');
  if (maestria >= 90) tecnicasDesbloqueadas.push('Semi-Especial');
  if (maestria >= 125) tecnicasDesbloqueadas.push('Especial');
  
  // Determinar el próximo grado
  let proximoGrado = 'Máximo alcanzado';
  if (maestria < 10) proximoGrado = `G4 (${10 - maestria}% restante)`;
  else if (maestria < 30) proximoGrado = `G3 (${30 - maestria}% restante)`;
  else if (maestria < 50) proximoGrado = `G2 (${50 - maestria}% restante)`;
  else if (maestria < 70) proximoGrado = `G1 (${70 - maestria}% restante)`;
  else if (maestria < 90) proximoGrado = `Semi-Especial (${90 - maestria}% restante)`;
  else if (maestria < 125) proximoGrado = `Especial (${125 - maestria}% restante)`;
  
  // Barra de progreso visual
  const barraTotal = 10;
  const progreso = Math.min(Math.floor((maestria / 125) * barraTotal), barraTotal);
  const barra = '▰'.repeat(progreso) + '▱'.repeat(barraTotal - progreso);
  
  // Color según maestría
  let colorMaestria = '⚪';
  if (maestria >= 125) colorMaestria = '🔴';
  else if (maestria >= 90) colorMaestria = '🟣';
  else if (maestria >= 70) colorMaestria = '🔵';
  else if (maestria >= 50) colorMaestria = '🟢';
  else if (maestria >= 30) colorMaestria = '🟡';
  else if (maestria >= 10) colorMaestria = '🟠';
  
  const maestriaDisplay = 
    `╔═══════════════════════════╗\n` +
    `║    ${colorMaestria} MAESTRÍA EN EM ${colorMaestria}    ║\n` +
    `╚═══════════════════════════╝\n` +
    `\`\`\`ansi\n` +
    `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
    `\u001b[1;37mNivel:\u001b[0m \u001b[1;36m${maestria}%\u001b[0m / 200%\n` +
    `\u001b[1;37mBarra:\u001b[0m ${barra} \u001b[1;33m${maestria}%\u001b[0m\n` +
    `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
    `\u001b[1;37mTécnicas:\u001b[0m \u001b[1;32m${tecnicasDesbloqueadas.length}/6\u001b[0m desbloqueadas\n` +
    `\u001b[1;37mProximo:\u001b[0m \u001b[1;35m${proximoGrado}\u001b[0m\n` +
    `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
    `\`\`\`\n` +
    `**Grados Desbloqueados:**\n` +
    `${maestria >= 10 ? '✅' : '🔒'} Cuarto Grado (10%)\n` +
    `${maestria >= 30 ? '✅' : '🔒'} Tercer Grado (30%)\n` +
    `${maestria >= 50 ? '✅' : '🔒'} Segundo Grado (50%)\n` +
    `${maestria >= 70 ? '✅' : '🔒'} Primer Grado (70%)\n` +
    `${maestria >= 90 ? '✅' : '🔒'} Semi-Especial (90%)\n` +
    `${maestria >= 125 ? '✅' : '🔒'} Grado Especial (125%)`;
  
    const embed = new EmbedBuilder()
    .setTitle(`📖 Perfil de ${member.displayName || member.user.username} ✴ ⛓ 🧬`)
    .setThumbnail(profile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg");
  
  // ✅ APLICAR PERSONALIZACIÓN VISUAL
  const customization = aplicarPersonalizacion(embed, profile, member);
  const separador = customization.separador;
  const efectoParticulas = customization.efecto.particulas;
  
  // ✅ DESCRIPCIÓN CON PERSONALIZACIÓN
  embed.setDescription(
    `${efectoParticulas ? efectoParticulas + '\n' : ''}` +
    `${separador}\n` +
    `**Perfil de ${member.displayName || member.user.username}**\n` +
    `${separador}` +
    `${efectoParticulas ? '\n' + efectoParticulas : ''}`
  )
    .addFields(
      { name: "💰 Yenes", value: `¥ ${profile.yen || 0}`, inline: false },
      { name: "📍 Ubicación", value: profile.ubicacion || '📍 Tokyo, Japón', inline: false },  // ← AGREGÁ ESTA LÍNEA
      { name: "🌟 Fama", value: `Nivel ${profile.fama_nivel || 0} - ${getNombreNivelFama(profile.fama_nivel || 0)}`, inline: false },
      { name: "💭 Frase", value: fraseDisplay, inline: false },
      { name: "⚡ Maestría", value: maestriaDisplay, inline: false },
      { name: "🧬 Raza", value: profile.race || "Sin definir", inline: false },
      { name: "👥 Clan", value: profile.clan || "Sin definir", inline: false },
      { name: "🏫 Escuela", value: profile.escuela || "Sin definir", inline: false },
      { name: "⚖️ Bando", value: profile.bando || "no definido", inline: false },
      { name: "🔮 Potencial", value: profile.potencial || "Sin tirar", inline: false },
      { name: "✨ Especial", value: profile.especial || "Sin tirar", inline: false },
      { name: "🌟 Tipo de Prodigio", value: Array.isArray(profile.tipos_prodigio) && profile.tipos_prodigio.length > 0 ? profile.tipos_prodigio.join(', ') : "Ninguno", inline: false },
      { name: "🧿 Ritual", value: profile.ritual || "Ninguno", inline: false },
      { name: "🧬 Hereditario", value: profile.ritual_hereditario || "Ninguno", inline: false },
      { name: "⚠️ Atadura", value: profile.atadura || "Ninguna", inline: false }
    )
    .setFooter({ text: "Cursed Era II • Navega con botones" });
  
  // Agregar banner si existe
  if (profile.banner) {
    embed.setImage(profile.banner);
  }
  
  const userId = member.id;
  
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`build_${userId}`).setLabel("Build").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`misiones_${userId}`).setLabel("Misiones").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`grado_${userId}`).setLabel("Grado").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rr_${userId}`).setLabel("Rerolls").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`stats_${userId}`).setLabel("Stats").setStyle(ButtonStyle.Secondary)
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`inventario_${userId}`).setLabel("Inventario").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`logros_${userId}`).setLabel("Logros").setEmoji("🏅").setStyle(ButtonStyle.Success)
  );
  
  return { embeds: [embed], components: [row, row2] };
}



async function updateEmbed(interaction, customId) {
  // ✅ CAMBIO CLAVE: Extraer el userId del customId
  const parts = customId.split('_');
  const action = parts[0];
  const targetUserId = parts[1]; // El ID del perfil que se está viendo
  
  // Si no hay userId en el customId (compatibilidad con botones viejos), usar el del usuario que hizo clic
  const profileUserId = targetUserId || interaction.user.id;
  
  const profile = getProfile(profileUserId);
  
  // Obtener el member para mostrar su nombre
  let targetMember;
  try {
    targetMember = await interaction.guild.members.fetch(profileUserId);
  } catch {
    targetMember = { displayName: 'Usuario', user: { username: 'Desconocido' } };
  }
  
  let embed = new EmbedBuilder()
  .setTitle(`📖 Perfil de ${targetMember.displayName || targetMember.user.username} ✴ ⛓ 🧬`)
  .setThumbnail(profile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg");

// ✅ APLICAR PERSONALIZACIÓN VISUAL
const customization = aplicarPersonalizacion(embed, profile, targetMember);
const separador = customization.separador;
const efectoParticulas = customization.efecto.particulas;
    
    if (action === "build") {
      let fraseDisplay = profile.quote ? `__*"${profile.quote}"*__` : "__*Sin frase personalizada*__";
      
      // Calcular maestría y técnicas desbloqueadas
      const maestria = profile.maestria || 0;
      const tecnicasDesbloqueadas = [];
      if (maestria >= 10) tecnicasDesbloqueadas.push('G4');
      if (maestria >= 20) tecnicasDesbloqueadas.push('G3');
      if (maestria >= 25) tecnicasDesbloqueadas.push('G2');
      if (maestria >= 30) tecnicasDesbloqueadas.push('G1');
      if (maestria >= 40) tecnicasDesbloqueadas.push('Semi-Especial');
      if (maestria >= 75) tecnicasDesbloqueadas.push('Especial');
      
      // Determinar el próximo grado
      let proximoGrado = 'Máximo alcanzado';
      if (maestria < 10) proximoGrado = `G4 (${10 - maestria}% restante)`;
      else if (maestria < 20) proximoGrado = `G3 (${20 - maestria}% restante)`;
      else if (maestria < 25) proximoGrado = `G2 (${25 - maestria}% restante)`;
      else if (maestria < 30) proximoGrado = `G1 (${30 - maestria}% restante)`;
      else if (maestria < 40) proximoGrado = `Semi-Especial (${40 - maestria}% restante)`;
      else if (maestria < 75) proximoGrado = `Especial (${75 - maestria}% restante)`;
      
      // Barra de progreso visual
      const barraTotal = 10;
      const progreso = Math.min(Math.floor((maestria / 125) * barraTotal), barraTotal);
      const barra = '▰'.repeat(progreso) + '▱'.repeat(barraTotal - progreso);
      
      // Color según maestría
      let colorMaestria = '⚪'; // Blanco por defecto
      if (maestria >= 75) colorMaestria = '🔴'; // Rojo para Especial
      else if (maestria >= 40) colorMaestria = '🟣'; // Morado para Semi-Especial
      else if (maestria >= 30) colorMaestria = '🔵'; // Azul para G1
      else if (maestria >= 25) colorMaestria = '🟢'; // Verde para G2
      else if (maestria >= 20) colorMaestria = '🟡'; // Amarillo para G3
      else if (maestria >= 10) colorMaestria = '🟠'; // Naranja para G4
      
      const maestriaDisplay = 
        `╔═══════════════════════════╗\n` +
        `║    ${colorMaestria} MAESTRÍA EN EM ${colorMaestria}    ║\n` +
        `╚═══════════════════════════╝\n` +
        `\`\`\`ansi\n` +
        `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
        `\u001b[1;37mNivel:\u001b[0m \u001b[1;36m${maestria}%\u001b[0m / 200%\n` +
        `\u001b[1;37mBarra:\u001b[0m ${barra} \u001b[1;33m${maestria}%\u001b[0m\n` +
        `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
        `\u001b[1;37mTécnicas:\u001b[0m \u001b[1;32m${tecnicasDesbloqueadas.length}/6\u001b[0m desbloqueadas\n` +
        `\u001b[1;37mProximo:\u001b[0m \u001b[1;35m${proximoGrado}\u001b[0m\n` +
        `\u001b[0;34m━━━━━━━━━━━━━━━━━━━━━━━━━━\u001b[0m\n` +
        `\`\`\`\n` +
        `**Grados Desbloqueados:**\n` +
        `${maestria >= 10 ? '✅' : '🔒'} Cuarto Grado (10%)\n` +
        `${maestria >= 20 ? '✅' : '🔒'} Tercer Grado (20%)\n` +
        `${maestria >= 25 ? '✅' : '🔒'} Segundo Grado (25%)\n` +
        `${maestria >= 30 ? '✅' : '🔒'} Primer Grado (30%)\n` +
        `${maestria >= 40 ? '✅' : '🔒'} Semi-Especial (40%)\n` +
        `${maestria >= 75 ? '✅' : '🔒'} Grado Especial (75%)`;
      
        embed.setDescription(
          `${efectoParticulas ? efectoParticulas + '\n' : ''}` +
          `${separador}\n` +
          `${separador}` +
          `${efectoParticulas ? '\n' + efectoParticulas : ''}`
        )
          .addFields(
          { name: "💰 Yenes", value: `¥ ${profile.yen || 0}`, inline: false },
          { name: "💭 Frase", value: fraseDisplay, inline: false },
          { name: "⚡ Maestría", value: maestriaDisplay, inline: false },
          { name: "🧬 Raza", value: profile.race || "Sin definir", inline: false },
          { name: "👥 Clan", value: profile.clan || "Sin definir", inline: false },
          { name: "🏫 Escuela", value: profile.escuela || "Sin definir", inline: false },
          { name: "⚖️ Bando", value: profile.bando || "no definido", inline: false },
          { name: "🔮 Potencial", value: profile.potencial || "Sin definir", inline: false },
          { name: "🌟 Tipo de Prodigio", value: Array.isArray(profile.tipos_prodigio) && profile.tipos_prodigio.length > 0 ? profile.tipos_prodigio.join(', ') : "Ninguno", inline: false },
          { name: "🧿 Ritual", value: profile.ritual || "Ninguno", inline: false },
          { name: "🧬 Hereditario", value: profile.ritual_hereditario || "Ninguno", inline: false },
          { name: "⚠️ Atadura", value: profile.atadura || "Ninguna", inline: false }
        );
  } else if (action === "misiones") {
    embed.setDescription("📜 Registro de Misiones\n────────────────────")
      .addFields(
        { name: "📜 Misión Grado 4", value: (profile.misiones["4"] || 0).toString(), inline: true },
{ name: "📜 Misión Grado 3", value: (profile.misiones["3"] || 0).toString(), inline: true },
{ name: "📜 Misión Semi-Grado 2", value: (profile.misiones["semi2"] || 0).toString(), inline: true },
{ name: "📜 Misión Grado 2", value: (profile.misiones["2"] || 0).toString(), inline: true },
{ name: "📜 Misión Semi-Grado 1", value: (profile.misiones["semi1"] || 0).toString(), inline: true },
{ name: "📜 Misión Grado 1", value: (profile.misiones["1"] || 0).toString(), inline: true },
{ name: "📜 Misión Semi-Especial", value: (profile.misiones["semiespecial"] || 0).toString(), inline: true },
{ name: "📜 Misión Grado Especial", value: (profile.misiones["especial"] || 0).toString(), inline: true }
      );
    } else if (action === "grado") {
      // Verificar si es Híbrido
      if (profile.race === 'Híbrido') {
        embed.setDescription(
          "🎖️ **Información de Grado - HÍBRIDO** 🎖️\n" +
          "────────────────────────────────\n\n" +
          "**╔═══ 🧑‍⚖️ COMO HECHICERO ═══╗**\n" +
          "```\n" +
          "👤 Grado Social: " + (profile.grado_social || "Sin grado") + "\n" +
          "⚔️ Grado General: " + (profile.grado_hechicero || profile.grado_general || "Sin grado") + "\n" +
          "```\n" +
          "**╔═══ 👹 COMO MALDICIÓN ═══╗**\n" +
          "```\n" +
          "💀 Grado de Maldición: " + (profile.grado_maldicion || "Sin grado") + "\n" +
          "```\n" +
          "────────────────────────────────"
        );
      } else if (profile.race === 'Espíritu Maldito') {
        // Para Espíritus Malditos
        embed.setDescription(
          "🎖️ **Información de Grado** 🎖️\n" +
          "────────────────────────────────\n\n" +
          "**╔═══ 👹 MALDICIÓN ═══╗**\n" +
          "```\n" +
          "💀 Grado de Maldición: " + (profile.grado_maldicion || profile.grado_general || "Sin grado") + "\n" +
          "```\n" +
          "────────────────────────────────"
        );
      } else {
        // Para Humanos
        embed.setDescription(
          "🎖️ **Información de Grado** 🎖️\n" +
          "────────────────────────────────\n\n" +
          "**╔═══ 🧑‍⚖️ HECHICERO ═══╗**\n" +
          "```\n" +
          "👤 Grado Social: " + (profile.grado_social || "Sin grado") + "\n" +
          "⚔️ Grado General: " + (profile.grado_hechicero || profile.grado_general || "Sin grado") + "\n" +
          "```\n" +
          "────────────────────────────────"
        );
      }
  } else if (action === "rr") {
    embed.setDescription("🎲 Rerolls Disponibles\n────────────────────")
    .addFields(
      { 
        name: "🎲 Rerolls", 
        value: `${profile.rr || 5}${(profile.rr || 0) < 0 ? ' ⚠️ (Castigo activo)' : ''}`, 
        inline: false 
      }
    );
  } else if (action === "stats") {
    const stats = profile.stats || {
      fuerza: { grado: "Sin grado", sub: "", nivel: 1, xp: 0 },
      velocidad: { grado: "Sin grado", sub: "", nivel: 1, xp: 0 },
      resistencia: { grado: "Sin grado", sub: "", nivel: 1, xp: 0 },
      "Energía Maldita": 0,
      Objetos: "Ninguno",
      Personaje: "Ninguno"
    };
 // ✅ INFORMACIÓN DE DOMINIO
 const dominioInfo = profile.dominio || null;
 let dominioDisplay = "❌ Sin Dominio";
 
 if (dominioInfo) {
   const nivelEmoji = {
     "simple": "🌑",
     "1": "🌀",
     "2": "🔵",
     "3": "🟣",
     "0.2": "⚡",
     "sin barreras": "👹"
   };
   
   const emoji = nivelEmoji[dominioInfo.nivel] || "⚫";
   const refinamiento = dominioInfo.refinamiento || 0;
   
   dominioDisplay = 
     `${emoji} **${dominioInfo.nombre || "Dominio"}**\n` +
     `├─ Nivel: **${dominioInfo.nivel.toUpperCase()}**\n` +
     `└─ Refinamiento: **${refinamiento} pts**`;
 }
    const fuerzaText = `${stats.fuerza.grado}${stats.fuerza.sub ? ' ' + stats.fuerza.sub : ''} (LVL ${stats.fuerza.nivel})`;
    const velocidadText = `${stats.velocidad.grado}${stats.velocidad.sub ? ' ' + stats.velocidad.sub : ''} (LVL ${stats.velocidad.nivel})`;
    const resistenciaText = `${stats.resistencia.grado}${stats.resistencia.sub ? ' ' + stats.resistencia.sub : ''} (LVL ${stats.resistencia.nivel})`;

    embed.setDescription(
      "╔────── 「Ficha De Stats」 ─────╗\n" +
      "『💪』Fuerza: " + fuerzaText + "\n" +
      "『☄️』Velocidad: " + velocidadText + "\n" +
      "『🛡️』Resistencia: " + resistenciaText + "\n" +
      "『🌀』Energía Maldita: " + (stats["Energía Maldita"] || 0) + "\n" +
      (profile.rct ? "『✨』RCT: Sí\n" : "") +
      "╠─────────────╣\n" +
      "『🏛️』Dominio:\n" + dominioDisplay + "\n" +
      "╠─────────────╣\n" +
      "『🎀』Objetos: " + (stats.Objetos || "Ninguno") + "\n" +
      "╠─────────────╣\n" +
      "『🎫』Personaje: " + (stats.Personaje || "Ninguno") + "\n" +
      "╚─────────────╝\n\n" +
      "*Edita con: -stats <stat> <valor>*\n" +
      "Ej: `-stats Fuerza Lvl 5`"
    );
  }
  else if (action === "logros") {
    const logros = profile.logros || [];
    let logrosText = "";
    
    if (logros.length === 0) {
      logrosText = "⊹・・──────────・・✦・・────────・・⊹\n\n" +
                   "Aún no tiene logros.\n\n" +
                   "⊹・・──────────・・✦・・────────・・⊹";
    } else {
      logrosText = "⊹・・──────────・・✦・・────────・・⊹\n\n";
      logros.forEach((logro, index) => {
        const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "🏅";
        logrosText += `${emoji} **${index + 1}.** ${logro}\n`;
      });
      logrosText += "\n⊹・・──────────・・✦・・────────・・⊹";
    }
    
    embed.setTitle("▂▃▅▇█ LOGROS █▇▅▃▂")
      .setDescription(logrosText)
      .setColor(0xFFD700)
      .setThumbnail("https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
      .setFooter({ text: "Cursed Era II • Logros" });
  }
  else if (action === "inventario") {
    const objetos = profile.stats.Objetos || "Ninguno";
    let inventarioText = "══✿══╡°˖✧INVENTARIO✧˖°╞══✿══\n\n";
    if (objetos === "Ninguno" || objetos.trim() === "") {
      inventarioText += "No tiene ítems comprados.";
    } else {
      const itemsList = objetos.split(',').map(item => item.trim());
      itemsList.forEach((item, index) => {
        inventarioText += `${index + 1} - ${item}\n`;
      });
    }
    embed.setTitle(`🎒 Inventario de ${targetMember.displayName}`)
      .setDescription(inventarioText)
      .setColor(0xFFD700)
      .setFooter({ text: "Cursed Era II • Inventario" });
  }

  // ✅ CAMBIO CLAVE: Mantener el userId en los botones
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`build_${profileUserId}`).setLabel("Build").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId(`misiones_${profileUserId}`).setLabel("Misiones").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`grado_${profileUserId}`).setLabel("Grado").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`rr_${profileUserId}`).setLabel("Rerolls").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`stats_${profileUserId}`).setLabel("Stats").setStyle(ButtonStyle.Secondary),
  );
  
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`inventario_${profileUserId}`).setLabel("Inventario").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`logros_${profileUserId}`).setLabel("Logros").setEmoji("🏅").setStyle(ButtonStyle.Success)
  );
  
  await interaction.editReply({ embeds: [embed], components: [row, row2] });
}

const rerollCategories = ['raza', 'clan', 'potencial', 'escuela', 'ritual', 'ritual_maldicion', 'ritual_especial', 'hereditario', 'atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio', 'especial'];

client.on(Events.ClientReady, () => {
  console.log(`Conectado como ${client.user.tag}`);
});

client.on(Events.GuildMemberAdd, (member) => {
  getProfile(member.id);
  console.log(`Perfil creado para ${member.user.tag}`);
});
// ✅ FUNCIÓN PARA APLICAR BUFFOS DE PRODIGIO
function aplicarBuffosProdigio(profile, nombreProdigio) {
  // Inicializar el objeto de buffos si no existe
  if (!profile.buffos_prodigio) {
    profile.buffos_prodigio = {
      fisico: false,
      energetico: false,
      inverso: false
    };
  }

  // Prodigio Físico: +1 grado en Fuerza (saltando sub-grados)
  if (nombreProdigio === "Prodigio Físico" && !profile.buffos_prodigio.fisico) {
    // Inicializar stats si no existen
    if (!profile.stats) {
      profile.stats = {
        fuerza: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        velocidad: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        resistencia: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        "Energía Maldita": 0,
        Objetos: "Ninguno",
        Personaje: "Ninguno"
      };
    }
    
   // Dar +1 grado en fuerza, velocidad y resistencia
   if (profile.stats.fuerza.grado === "Sin grado") {
    profile.stats.fuerza.grado = "Grado 3";
    profile.stats.fuerza.nivel = 1;
    profile.stats.fuerza.sub = "";
  }
  if (profile.stats.velocidad.grado === "Sin grado") {
    profile.stats.velocidad.grado = "Grado 3";
    profile.stats.velocidad.nivel = 1;
    profile.stats.velocidad.sub = "";
  }
  if (profile.stats.resistencia.grado === "Sin grado") {
    profile.stats.resistencia.grado = "Grado 3";
    profile.stats.resistencia.nivel = 1;
    profile.stats.resistencia.sub = "";
  }

  profile.buffos_prodigio.fisico = true;
    console.log(`Buffo Físico aplicado a ${profile}`);
  }
  
  // Prodigio Energético: x2 Energía Maldita
  else if (nombreProdigio === "Prodigio Energético" && !profile.buffos_prodigio.energetico) {
    const emActual = profile.stats["Energía Maldita"] || 0;
    if (emActual > 0) {
      profile.stats["Energía Maldita"] = emActual * 2;
    }
    profile.buffos_prodigio.energetico = true;
    console.log(`Buffo Energético aplicado: ${emActual} → ${profile.stats["Energía Maldita"]}`);
  }
  
  // Prodigio Inverso: Desbloquear RCT automáticamente
  else if (nombreProdigio === "Prodigio Inverso" && !profile.buffos_prodigio.inverso) {
    profile.rct = true;
    profile.buffos_prodigio.inverso = true;
    console.log(`Buffo Inverso aplicado: RCT desbloqueado`);
  }
}
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const profile = getProfile(message.author.id);

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  console.log(`Comando ejecutado: ${command} por ${message.author.tag}`);

  try {
  // Comando -perfil (muestra perfil propio o de otro usuario)
  if (command === "perfil") {
    try {
      // Definimos explícitamente el perfil del usuario que ejecuta el comando
      const perfil = getProfile(message.author.id);
  
      // Si mencionó a alguien, cambiamos al perfil del mencionado
      const mentioned = message.mentions.members.first();
      if (mentioned) {
        const perfilMencionado = getProfile(mentioned.id);
        const embedContent = createBuildEmbed(mentioned);
        await message.channel.send(embedContent);
      } else {
        const embedContent = createBuildEmbed(message.member);
        await message.channel.send(embedContent);
      }
    } catch (innerErr) {
      console.error('Error en -perfil:', innerErr.message);
      await message.reply('Error al generar el perfil. Intenta de nuevo más tarde.');
    }
    return;
  }
  
  if (command === 'mc') {
    const mentioned = message.mentions.members.first();
    const targetMember = mentioned || message.member;
    const targetProfile = getProfile(targetMember.id);
  
    const embed = new EmbedBuilder()
      .setTitle(`▂▃▅▇█ MINECRAFT PROFILE █▇▅▃▂`)
      .setColor(0x00FF88)
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `**Perfil de ${targetMember.displayName}**\n` +
        `_Datos de Jujutsu Craft + Sistema Social_\n\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setThumbnail(targetProfile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
      .setFooter({ text: 'Cursed Era II • Navega con botones' })
      .setTimestamp();
  
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`mc_craft_${targetMember.id}`)
        .setLabel("Jujutsu Craft")
        .setEmoji("🎮")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`mc_social_${targetMember.id}`)
        .setLabel("Amigos & Rivales")
        .setEmoji("👥")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`mc_clan_${targetMember.id}`)
        .setLabel("Clan Guild")
        .setEmoji("🏰")
        .setStyle(ButtonStyle.Danger)
    );
  
    return message.channel.send({ embeds: [embed], components: [row] });
  }
  
  if (command === 'energia_inicial') {
    if (profile.energia_inicial) {
      return message.reply('Ya obtuviste tu energía inicial. Usa `-rr energia` para rerollear.');
    }
    
    if (profile.race === 'Sin tirar') {
      return message.reply(
        `╔════════════════════════════════════╗\n` +
        `║   ❌ ACCIÓN NO DISPONIBLE ❌     ║\n` +
        `╚════════════════════════════════════╝\n\n` +
        `⚠️ Primero debes tirar tu raza\n\n` +
        `Usa: \`-raza\``
      );
    }
    if (profile.race === 'Espíritu Maldito' && command === 'clan') {
      return message.reply(
        `╔════════════════════════════════════╗\n` +
        `║   🔮 ESPÍRITU MALDITO 🔮        ║\n` +
        `╚════════════════════════════════════╝\n\n` +
        `❌ Las maldiciones no tienen clanes\n\n` +
        `En su lugar usa: \`-sub_razas\``
      );
    }
  
    // Si es Espíritu Maldito, asignar automáticamente 1000 EM
    if (profile.race === 'Espíritu Maldito') {
      profile.stats["Energía Maldita"] = 1000;
      profile.energia_inicial = "FIJA (Espíritu Maldito)";
      saveDB();
      
      return message.reply(
        `▂▃▅▇█ ENERGÍA MALDITA INICIAL █▇▅▃▂\n\n` +
        `Como **Espíritu Maldito**, tu energía es fija:\n` +
        `**1000 EM**\n\n` +
        `Ahora usa \`-sub_razas\` para elegir tu tipo de maldición.`
      );
    }
  
    // Para Humanos e Híbridos: sistema de probabilidades
    const energiaProbs = [
      { nivel: "BAJA", em: 4000, prob: 0.30, imagen: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/b/be/Kento_Nanami_%28Anime%29.png" },
      { nivel: "PROMEDIO", em: 5000, prob: 0.40, imagen: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/5/57/Megumi_Fushiguro_%28Anime%29.png" },
      { nivel: "ALTA", em: 6000, prob: 0.20, imagen: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/8/88/Yuji_Itadori_%28Anime%29.png" },
      { nivel: "MUY ALTA", em: 7500, prob: 0.08, imagen: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/d/d5/Yuta_Okkotsu_%28Anime%29.png" },
      { nivel: "ABISMAL", em: 9000, prob: 0.02, imagen: "https://static.wikia.nocookie.net/jujutsu-kaisen/images/8/84/Satoru_Gojo.png" }
    ];
  
    const result = weightedRandom(energiaProbs);
    profile.stats["Energía Maldita"] = result.em;
    profile.energia_inicial = result.nivel;
    saveDB();
  
    const mensajes = {
      "BAJA": "Tu energía maldita es limitada, pero con esfuerzo podés llegar lejos.",
      "PROMEDIO": "Tenés un nivel decente de energía maldita. La mayoría empieza así.",
      "ALTA": "¡Impresionante! Tu energía maldita está por encima del promedio.",
      "MUY ALTA": "¡Wow! Tenés un potencial excepcional. Muy pocos llegan a este nivel.",
      "ABISMAL": "**¡INCREÍBLE!** Tu energía maldita es descomunal. Sos un monstruo nato."
    };
  
    return message.reply(
      `▂▃▅▇█ ENERGÍA MALDITA INICIAL █▇▅▃▂\n\n` +
      `**${result.nivel}** (${result.prob * 100}% probabilidad)\n` +
      `**Energía Maldita:** ${result.em}\n\n` +
      `${mensajes[result.nivel]}\n\n` +
      `${result.imagen}`
    );
  }
  
  if (command === 'sub_razas' || command === 'sub_raza') {
    if (profile.race !== 'Espíritu Maldito') {
      return message.reply(
        `╔════════════════════════════════════╗\n` +
        `║   ❌ ACCESO DENEGADO ❌          ║\n` +
        `╚════════════════════════════════════╝\n\n` +
        `⚠️ Solo los **Espíritus Malditos** pueden usar este comando.\n\n` +
        `Tu raza actual: **${profile.race}**`
      );
    }
  
    if (profile.sub_raza && profile.sub_raza !== 'Sin tirar') {
      return message.reply(
        `╔════════════════════════════════════╗\n` +
        `║   ✅ SUB-RAZA ACTIVA ✅          ║\n` +
        `╚════════════════════════════════════╝\n\n` +
        `Ya obtuviste tu sub-raza: **${profile.sub_raza}**\n\n` +
        `💡 **¿Querés cambiarla?**\n` +
        `Usa \`-rr subraza\` para rerollear.`
      );
    }
  
    const subRazaProbs = [
      { nombre: "Maldición Anormal", prob: 0.35, buff: 0.15 },
      { nombre: "Maldición Natural", prob: 0.15, buff: 0.30 },
      { nombre: "Maldición Divina", prob: 0.10, buff: 0.45 },
      { nombre: "Maldición Monstruosa", prob: 0.25, buff: 0.20 },
      { nombre: "Espíritu Vengativo", prob: 0.15, buff: 0.25 }
    ];
  
    const result = weightedRandom(subRazaProbs);
    
    // Calcular energía con buff
    const emBase = 1000;
    const emFinal = Math.floor(emBase * (1 + result.buff));
    
    profile.sub_raza = result.nombre;
    profile.stats["Energía Maldita"] = emFinal;
    profile.race = result.nombre; // CAMBIAR RAZA VISIBLE
    saveDB();
  
    const descripciones = {
      "Espíritu Vengativo": "Humanos que renacen por rencor. Matan a cualquiera pero mantienen su inteligencia.",
      "Maldición Monstruosa": "Forma aberrante con gran musculatura. Su físico es intimidante.",
      "Maldición Divina": "Encarnan conceptos divinos o enfermedades sin solución. Extremadamente raros.",
      "Maldición Natural": "Representan desastres naturales. Verdaderos 'humanos' en su origen.",
      "Maldición Anormal": "Deformes y asquerosos, pero con potencial más allá de lo común."
    };
  
    return message.reply(
      `▂▃▅▇█ SUB-RAZA OBTENIDA █▇▅▃▂\n\n` +
      `**${result.nombre}**\n\n` +
      `${descripciones[result.nombre]}\n\n` +
      `**Buff:** +${result.buff * 100}% EM\n` +
      `**Energía Maldita Final:** ${emFinal} (1000 base + ${result.buff * 100}%)`
    );
  }
  // ═══════════════════════════════════════════════════════════
// SISTEMA DE CLANES
// ═══════════════════════════════════════════════════════════

// Comando -crear_clan
if (command === 'crear_clan') {
  if (args.length === 0) {
    return message.reply('Uso: `-crear_clan "Nombre del Clan"`\nEjemplo: `-crear_clan "Los Invencibles"`');
  }
  
  const nombreClan = args.join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (nombreClan.length < 3 || nombreClan.length > 30) {
    return message.reply('El nombre del clan debe tener entre 3 y 30 caracteres.');
  }
  
  // Verificar si ya pertenece a un clan
  if (profile.clan_guild) {
    return message.reply(`Ya pertenecés al clan **${profile.clan_guild}**. Primero salí con \`-salir_clan\``);
  }
  
  // Verificar si el nombre ya existe
  if (clanes[nombreClan]) {
    return message.reply(`El clan **${nombreClan}** ya existe. Elegí otro nombre.`);
  }
  // Crear clan
  clanes[nombreClan] = {
    lider: message.author.id,
    miembros: [message.author.id],
    puntos: 0,
    fecha_creacion: Date.now()
  };
  
  profile.clan_guild = nombreClan;
  saveDB();
  
  const response = 
  `▂▃▅▇█ CLAN FUNDADO 🏰 █▇▅▃▂
  
  ⊹・・──────────・・✦・・────────・・⊹
  
  ¡Felicitaciones! Fundaste el clan:
  **${nombreClan}**
  
  **🎖️ Líder:** ${message.author.tag}
  **👥 Miembros:** 1
  **⭐ Puntos:** 0
  
  Invitá miembros con \`-invitar_clan @usuario\`
  
  ⊹・・──────────・・✦・・────────・・⊹`;
  
  return message.reply(response);
}

// Comando -invitar_clan
if (command === 'invitar_clan') {
  if (args.length === 0) {
    return message.reply('Uso: `-invitar_clan @usuario`');
  }
  
  if (!profile.clan_guild) {
    return message.reply('No pertenecés a ningún clan. Creá uno con `-crear_clan` o unite a uno existente.');
  }
  
  const clan = clanes[profile.clan_guild];
  if (!clan) {
    return message.reply('Error: El clan no existe. Contactá a un admin.');
  }
  
  // Solo el líder puede invitar
  if (clan.lider !== message.author.id) {
    return message.reply('Solo el líder del clan puede invitar miembros.');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  if (target.bot) return message.reply('No podés invitar bots al clan.');
  
  const targetProfile = getProfile(target.id);
  
  if (targetProfile.clan_guild) {
    return message.reply(`**${target.tag}** ya pertenece al clan **${targetProfile.clan_guild}**.`);
  }
  
  // Inicializar invitaciones si no existe
  if (!targetProfile.invitaciones_clan) targetProfile.invitaciones_clan = [];
  
  if (targetProfile.invitaciones_clan.includes(profile.clan_guild)) {
    return message.reply(`Ya invitaste a **${target.tag}** a tu clan. Esperá a que acepte.`);
  }
  
  // Enviar invitación
  targetProfile.invitaciones_clan.push(profile.clan_guild);
  saveDB();
  
  return message.reply(`📩 Invitación enviada a **${target.tag}** para unirse a **${profile.clan_guild}**.\nElla/él puede aceptar con \`-unirse_clan "${profile.clan_guild}"\``);
}

// Comando -unirse_clan
if (command === 'unirse_clan') {
  if (args.length === 0) {
    return message.reply('Uso: `-unirse_clan "Nombre del Clan"`');
  }
  
  const nombreClan = args.join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (profile.clan_guild) {
    return message.reply(`Ya pertenecés al clan **${profile.clan_guild}**. Primero salí con \`-salir_clan\``);
  }
  
  if (!clanes[nombreClan]) {
    return message.reply(`El clan **${nombreClan}** no existe.`);
  }
  
  // Verificar invitación
  if (!profile.invitaciones_clan || !profile.invitaciones_clan.includes(nombreClan)) {
    return message.reply(`No tenés una invitación para unirte a **${nombreClan}**.`);
  }
  
  // Unirse al clan
  clanes[nombreClan].miembros.push(message.author.id);
  profile.clan_guild = nombreClan;
  profile.invitaciones_clan = profile.invitaciones_clan.filter(c => c !== nombreClan);
  saveDB();
  
  const response = 
`▂▃▅▇█ TE UNISTE AL CLAN 🏰 █▇▅▃▂

¡Bienvenido a **${nombreClan}**!

**👥 Miembros:** ${clanes[nombreClan].miembros.length}
**⭐ Puntos del clan:** ${clanes[nombreClan].puntos}

¡Ayudá a tu clan a crecer completando misiones! 💪`;
  
  return message.reply(response);
}

// Comando -salir_clan
if (command === 'salir_clan') {
  if (!profile.clan_guild) {
    return message.reply('No pertenecés a ningún clan.');
  }
  
  const nombreClan = profile.clan_guild;
  const clan = clanes[nombreClan];
  
  if (!clan) {
    return message.reply('Error: El clan no existe. Contactá a un admin.');
  }
  
  // Si es el líder, preguntar confirmación
  if (clan.lider === message.author.id) {
    if (clan.miembros.length > 1) {
      return message.reply(
        `⚠️ Sos el líder de **${nombreClan}**. Si salís, el clan se DISUELVE y todos los miembros serán expulsados.\n\n` +
        `**¿Estás seguro?** Confirmá con: \`-disolver_clan\``
      );
    } else {
      // Último miembro (el líder), disolver automáticamente
      delete clanes[nombreClan];
      profile.clan_guild = null;
      saveDB();
      return message.reply(`🏚️ Saliste del clan **${nombreClan}**. El clan fue disuelto porque eras el único miembro.`);
    }
  }
  
  // Miembro normal saliendo
  clan.miembros = clan.miembros.filter(id => id !== message.author.id);
  profile.clan_guild = null;
  saveDB();
  
  return message.reply(`❌ Saliste del clan **${nombreClan}**.`);
}

// Comando -disolver_clan
if (command === 'disolver_clan') {
  if (!profile.clan_guild) {
    return message.reply('No pertenecés a ningún clan.');
  }
  
  const nombreClan = profile.clan_guild;
  const clan = clanes[nombreClan];
  
  if (!clan) {
    return message.reply('Error: El clan no existe.');
  }
  
  if (clan.lider !== message.author.id) {
    return message.reply('Solo el líder puede disolver el clan.');
  }
  
  // Expulsar a todos los miembros
  for (const miembroId of clan.miembros) {
    const miembroProfile = getProfile(miembroId);
    miembroProfile.clan_guild = null;
  }
  
  // Eliminar clan
  delete clanes[nombreClan];
  saveDB();
  
  return message.reply(`🏚️ El clan **${nombreClan}** fue disuelto. Todos los miembros fueron expulsados.`);
}

// Comando -info_clan
if (command === 'info_clan') {
  const nombreClan = args.length > 0 ? args.join(' ').trim().replace(/^["']|["']$/g, '') : profile.clan_guild;
  
  if (!nombreClan) {
    return message.reply('Uso: `-info_clan "Nombre del Clan"` o simplemente `-info_clan` si pertenecés a uno.');
  }
  
  const clan = clanes[nombreClan];
  if (!clan) {
    return message.reply(`El clan **${nombreClan}** no existe.`);
  }
  
  // Obtener líder
  let liderTag = 'Desconocido';
  try {
    const lider = await client.users.fetch(clan.lider);
    liderTag = lider.tag;
  } catch {}
  
  // Lista de miembros (primeros 10)
  let miembrosText = '';
  for (let i = 0; i < Math.min(clan.miembros.length, 10); i++) {
    try {
      const miembro = await client.users.fetch(clan.miembros[i]);
      miembrosText += `${i + 1}. ${miembro.tag}\n`;
    } catch {
      miembrosText += `${i + 1}. Usuario desconocido\n`;
    }
  }
  if (clan.miembros.length > 10) {
    miembrosText += `_...y ${clan.miembros.length - 10} más_`;
  }
  
  const embed = new EmbedBuilder()
    .setTitle(`▂▃▅▇█ ${nombreClan.toUpperCase()} 🏰 █▇▅▃▂`)
    .setDescription(
      "⊹・・──────────・・✦・・────────・・⊹\n\n" +
      `**🎖️ Líder:** ${liderTag}\n` +
      `**👥 Miembros:** ${clan.miembros.length}\n` +
      `**⭐ Puntos:** ${clan.puntos.toLocaleString()}\n` +
      `**📅 Fundado:** <t:${Math.floor(clan.fecha_creacion / 1000)}:R>\n\n` +
      "**MIEMBROS:**\n" +
      miembrosText + "\n" +
      "⊹・・──────────・・✦・・────────・・⊹"
    )
    .setColor(0x9B59B6)
    .setThumbnail("https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
    .setFooter({ text: "Cursed Era II • Sistema de Clanes" });
  
  return message.channel.send({ embeds: [embed] });
}

// Comando -top_clanes
if (command === 'top_clanes') {
  const clanArray = Object.entries(clanes)
    .map(([nombre, data]) => ({ nombre, puntos: data.puntos, miembros: data.miembros.length }))
    .sort((a, b) => b.puntos - a.puntos)
    .slice(0, 10);
  
  if (clanArray.length === 0) {
    return message.reply('Aún no hay clanes creados. ¡Sé el primero con `-crear_clan`!');
  }
  
  const embed = new EmbedBuilder()
    .setTitle('▂▃▅▇█ TOP CLANES 🏆 █▇▅▃▂')
    .setDescription('⊹・・──────────・・✦・・────────・・⊹\n**Los clanes más poderosos del reino**\n⊹・・──────────・・✦・・────────・・⊹')
    .setColor(0xFFD700)
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg');
  
  for (let i = 0; i < clanArray.length; i++) {
    const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`;
    embed.addFields({
      name: `${medalla} ${clanArray[i].nombre}`,
      value: `⭐ Puntos: **${clanArray[i].puntos.toLocaleString()}** | 👥 Miembros: **${clanArray[i].miembros}**`,
      inline: false
    });
  }
  
  embed.setFooter({ text: 'Cursed Era II • Ranking de Clanes' })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}
// ╔═══════════════════════════════════════════════════════════════════════════════╗
// ║                                                                               ║
// ║                 📊 COMANDO -grafico DEFINITIVO CON BOTONES 📊                ║
// ║                  VERSION ULTRA MEJORADA + NAVEGACIÓN INTERACTIVA             ║
// ║                                                                               ║
// ╚═══════════════════════════════════════════════════════════════════════════════╝

if (command === 'grafico') {
  try {
    const { AttachmentBuilder } = require('discord.js');
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
    
    const profile = getProfile(message.author.id);

    // ═══════════════════════════════════════════════════════════════════════════
    // 🧠 SISTEMA DE DETECCIÓN INTELIGENTE DE DATOS
    // ═══════════════════════════════════════════════════════════════════════════

    // 📊 CALCULAR PROMEDIOS DEL SERVIDOR (para comparación)
    const allUsers = Object.values(db.users);
    const promedios = {
      xp: Math.floor(allUsers.reduce((sum, u) => sum + (u.xp_total || 0), 0) / allUsers.length),
      fama: Math.floor(allUsers.reduce((sum, u) => sum + (u.fama_nivel || 0), 0) / allUsers.length),
      misiones: Math.floor(allUsers.reduce((sum, u) => {
        const total = Object.values(u.misiones || {}).reduce((s, n) => s + n, 0);
        return sum + total;
      }, 0) / allUsers.length)
    };

    // 🎯 RANKING DEL USUARIO
    const rankingXP = allUsers
      .sort((a, b) => (b.xp_total || 0) - (a.xp_total || 0))
      .findIndex(u => u === profile) + 1;
    
    const rankingFama = allUsers
      .sort((a, b) => (b.fama_nivel || 0) - (a.fama_nivel || 0))
      .findIndex(u => u === profile) + 1;

    // 📈 DATOS DE XP CON DETECCIÓN INTELIGENTE
    let xpData = [];
    let xpLabels = [];
    
    if (profile.historial_xp && profile.historial_xp.length > 0) {
      const ultimos = profile.historial_xp.slice(-10);
      xpData = ultimos.map(h => h.xp_total || 0);
      xpLabels = ultimos.map((h, i) => {
        const fecha = new Date(h.fecha || Date.now());
        return `${fecha.getDate()}/${fecha.getMonth() + 1}`;
      });
    } else {
      const xpActual = profile.xp_total || 0;
      const pasos = 10;
      xpData = Array.from({ length: pasos }, (_, i) => {
        const progreso = (i + 1) / pasos;
        return Math.floor(xpActual * progreso + (Math.random() * 100 - 50));
      });
      xpLabels = xpData.map((_, i) => `Sesión ${i + 1}`);
    }

    // 🔮 PROYECCIÓN DE XP
    const tendenciaXP = xpData.length > 1 
      ? (xpData[xpData.length - 1] - xpData[xpData.length - 2])
      : 100;
    
    const xpProyeccion = Array.from({ length: 5 }, (_, i) => {
      return xpData[xpData.length - 1] + tendenciaXP * (i + 1);
    });

    // 🌟 DATOS DE FAMA
    let famaData = [];
    let famaLabels = [];
    
    if (profile.fama_hazanas && profile.fama_hazanas.length > 0) {
      const hazanas = profile.fama_hazanas.slice(-8);
      let nivelAcumulado = 0;
      
      famaData = hazanas.map(h => {
        nivelAcumulado += (h.xp || 0);
        const nivelEquivalente = Math.floor(nivelAcumulado / 400);
        return nivelEquivalente;
      });
      
      famaLabels = hazanas.map(h => {
        const razon = (h.razon || 'Hazaña').substring(0, 15);
        return razon;
      });
    } else {
      const nivelActual = profile.fama_nivel || 0;
      famaData = Array.from({ length: 8 }, (_, i) => {
        const progreso = (i + 1) / 8;
        return Math.floor(nivelActual * progreso);
      });
      famaLabels = famaData.map((_, i) => `Fase ${i + 1}`);
    }

    // 💰 ANÁLISIS DE YENES
    const yenesAnalisis = {
      rerolls: 0,
      items: 0,
      misiones: 0,
      prestamos: 0,
      apuestas: 0,
      otros: 0,
      total: 0
    };

    if (profile.historial_yenes && profile.historial_yenes.length > 0) {
      profile.historial_yenes.forEach(h => {
        const cantidad = Math.abs(h.cantidad || 0);
        yenesAnalisis.total += cantidad;
        
        if (h.tipo) {
          if (h.tipo.includes('reroll') || h.tipo.includes('rr')) yenesAnalisis.rerolls += cantidad;
          else if (h.tipo.includes('compra') || h.tipo.includes('buy')) yenesAnalisis.items += cantidad;
          else if (h.tipo.includes('mision')) yenesAnalisis.misiones += cantidad;
          else if (h.tipo.includes('prestamo')) yenesAnalisis.prestamos += cantidad;
          else if (h.tipo.includes('apostar') || h.tipo.includes('apuesta')) yenesAnalisis.apuestas += cantidad;
          else yenesAnalisis.otros += cantidad;
        }
      });
    } else {
      const nivelActividad = (profile.xp_total || 0) / 1000;
      yenesAnalisis.rerolls = Math.floor(3000 * nivelActividad);
      yenesAnalisis.items = Math.floor(5000 * nivelActividad);
      yenesAnalisis.misiones = Math.floor(2000 * nivelActividad);
      yenesAnalisis.apuestas = Math.floor(1500 * nivelActividad);
      yenesAnalisis.prestamos = Math.floor(1000 * nivelActividad);
      yenesAnalisis.otros = Math.floor(500 * nivelActividad);
      yenesAnalisis.total = Object.values(yenesAnalisis).reduce((a, b) => a + b, 0);
    }

    const yenesData = [
      yenesAnalisis.rerolls,
      yenesAnalisis.items,
      yenesAnalisis.misiones,
      yenesAnalisis.apuestas,
      yenesAnalisis.prestamos,
      yenesAnalisis.otros
    ];

    // ⚡ STATS COMPLETO
    const statsCompleto = {
      fuerza: {
        nivel: profile.stats?.fuerza?.nivel || 1,
        grado: profile.stats?.fuerza?.grado || "Sin grado",
        xp: profile.stats?.fuerza?.xp || 0
      },
      velocidad: {
        nivel: profile.stats?.velocidad?.nivel || 1,
        grado: profile.stats?.velocidad?.grado || "Sin grado",
        xp: profile.stats?.velocidad?.xp || 0
      },
      resistencia: {
        nivel: profile.stats?.resistencia?.nivel || 1,
        grado: profile.stats?.resistencia?.grado || "Sin grado",
        xp: profile.stats?.resistencia?.xp || 0
      },
      em: Math.floor((profile.stats?.["Energía Maldita"] || 0) / 1000),
      rct: profile.rct ? 5 : 0
    };

    const statsBalanceScore = (() => {
      const valores = [
        statsCompleto.fuerza.nivel,
        statsCompleto.velocidad.nivel,
        statsCompleto.resistencia.nivel
      ];
      const promedio = valores.reduce((a, b) => a + b, 0) / 3;
      const desviacion = Math.sqrt(
        valores.reduce((sum, val) => sum + Math.pow(val - promedio, 2), 0) / 3
      );
      return 100 - (desviacion * 10);
    })();

    const statsData = [
      statsCompleto.fuerza.nivel,
      statsCompleto.velocidad.nivel,
      statsCompleto.resistencia.nivel,
      statsCompleto.em,
      statsCompleto.rct
    ];

    // 📜 MISIONES
    const misionesCompleto = {
      "4": profile.misiones?.["4"] || 0,
      "3": profile.misiones?.["3"] || 0,
      "2": profile.misiones?.["2"] || 0,
      "1": profile.misiones?.["1"] || 0,
      "especial": profile.misiones?.["especial"] || 0
    };

    const misionesTotal = Object.values(misionesCompleto).reduce((a, b) => a + b, 0);
    const distribucionIdeal = [40, 30, 20, 8, 2];
    const misionesData = Object.values(misionesCompleto);

    // 🎖️ GRADOS
    const gradoToNumber = (grado) => {
      if (!grado || grado === "Sin grado") return 0;
      if (grado.includes("4")) return 1;
      if (grado.includes("3")) return 2;
      if (grado.includes("semi 2") || grado.includes("Semi 2")) return 3;
      if (grado.includes("2")) return 4;
      if (grado.includes("semi 1") || grado.includes("Semi 1")) return 5;
      if (grado.includes("1")) return 6;
      if (grado.includes("especial") || grado.includes("Especial")) return 7;
      return 0;
    };

    const gradosData = {
      social: {
        nivel: gradoToNumber(profile.grado_social),
        nombre: profile.grado_social || "Sin grado"
      },
      general: {
        nivel: gradoToNumber(profile.grado_general),
        nombre: profile.grado_general || "Sin grado"
      }
    };

    if (profile.race === "Híbrido") {
      gradosData.hechicero = {
        nivel: gradoToNumber(profile.grado_hechicero),
        nombre: profile.grado_hechicero || "Sin grado"
      };
      gradosData.maldicion = {
        nivel: gradoToNumber(profile.grado_maldicion),
        nombre: profile.grado_maldicion || "Sin grado"
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 CANVAS ULTRA HD
    // ═══════════════════════════════════════════════════════════════════════════

    const canvasRenderService = new ChartJSNodeCanvas({ 
      width: 1200, 
      height: 700,
      backgroundColour: '#0a0a0a'
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // 📈 GRÁFICO 1: XP
    // ═══════════════════════════════════════════════════════════════════════════

    const xpConfig = {
      type: 'line',
      data: {
        labels: [...xpLabels, ...Array(5).fill('').map((_, i) => `+${i+1}`)],
        datasets: [
          {
            label: '📈 XP Real',
            data: [...xpData, ...Array(5).fill(null)],
            borderColor: '#00ffff',
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            tension: 0.4,
            fill: true,
            borderWidth: 4,
            pointRadius: 6,
            pointHoverRadius: 10,
            pointBackgroundColor: '#00ffff',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 3
          },
          {
            label: '🔮 Proyección',
            data: [...Array(xpData.length).fill(null), ...xpProyeccion],
            borderColor: '#ff00ff',
            backgroundColor: 'rgba(255, 0, 255, 0.1)',
            borderDash: [10, 5],
            tension: 0.4,
            fill: false,
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#ff00ff',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: `📊 Promedio (${promedios.xp})`,
            data: Array(xpLabels.length + 5).fill(promedios.xp),
            borderColor: '#ffff00',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `📈 EVOLUCIÓN DE XP | Ranking: #${rankingXP} de ${allUsers.length}`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { 
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              font: { size: 14 },
              padding: 20,
              usePointStyle: true
            }
          }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { color: '#ffffff', font: { size: 14 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: { 
            ticks: { color: '#ffffff', font: { size: 12 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🌟 GRÁFICO 2: FAMA
    // ═══════════════════════════════════════════════════════════════════════════

    const nivelFamaActual = profile.fama_nivel || 0;
    const nombreNivelFama = getNombreNivelFama(nivelFamaActual);
    const colorNivelFama = getColorNivelFama(nivelFamaActual);

    const famaConfig = {
      type: 'bar',
      data: {
        labels: famaLabels,
        datasets: [{
          label: '🌟 Nivel de Fama',
          data: famaData,
          backgroundColor: famaData.map((_, i) => {
            const colores = [
              'rgba(255, 99, 132, 0.9)',
              'rgba(255, 159, 64, 0.9)',
              'rgba(255, 205, 86, 0.9)',
              'rgba(75, 192, 192, 0.9)',
              'rgba(54, 162, 235, 0.9)',
              'rgba(153, 102, 255, 0.9)',
              'rgba(201, 203, 207, 0.9)',
              'rgba(255, 215, 0, 0.9)'
            ];
            return colores[i % colores.length];
          }),
          borderColor: famaData.map((_, i) => {
            const colores = [
              'rgb(255, 99, 132)',
              'rgb(255, 159, 64)',
              'rgb(255, 205, 86)',
              'rgb(75, 192, 192)',
              'rgb(54, 162, 235)',
              'rgb(153, 102, 255)',
              'rgb(201, 203, 207)',
              'rgb(255, 215, 0)'
            ];
            return colores[i % colores.length];
          }),
          borderWidth: 3,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `🌟 PROGRESO DE FAMA | ${nombreNivelFama} (Nivel ${nivelFamaActual})`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { display: false }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { color: '#ffffff', font: { size: 14 }, stepSize: Math.ceil(Math.max(...famaData) / 10) },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: { 
            ticks: { color: '#ffffff', font: { size: 12 }, maxRotation: 45, minRotation: 45 },
            grid: { display: false }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 💰 GRÁFICO 3: YENES
    // ═══════════════════════════════════════════════════════════════════════════

    const yenesConfig = {
      type: 'doughnut',
      data: {
        labels: ['🎲 Rerolls', '🛒 Items', '📜 Misiones', '🎰 Apuestas', '💸 Préstamos', '🔹 Otros'],
        datasets: [{
          data: yenesData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.9)',
            'rgba(54, 162, 235, 0.9)',
            'rgba(255, 206, 86, 0.9)',
            'rgba(153, 102, 255, 0.9)',
            'rgba(75, 192, 192, 0.9)',
            'rgba(255, 159, 64, 0.9)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(153, 102, 255)',
            'rgb(75, 192, 192)',
            'rgb(255, 159, 64)'
          ],
          borderWidth: 4,
          hoverOffset: 15
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `💰 ANÁLISIS ECONÓMICO | Total: ¥${yenesAnalisis.total.toLocaleString()}`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { 
            position: 'bottom',
            labels: { 
              color: '#ffffff',
              font: { size: 14 },
              padding: 20,
              generateLabels: (chart) => {
                const data = chart.data;
                return data.labels.map((label, i) => ({
                  text: `${label}: ¥${yenesData[i].toLocaleString()} (${Math.round((yenesData[i]/yenesAnalisis.total)*100)}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                }));
              }
            }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ⚡ GRÁFICO 4: STATS
    // ═══════════════════════════════════════════════════════════════════════════

    const radarConfig = {
      type: 'radar',
      data: {
        labels: [
          `💪 Fuerza (Lvl ${statsCompleto.fuerza.nivel})`,
          `⚡ Velocidad (Lvl ${statsCompleto.velocidad.nivel})`,
          `🛡️ Resistencia (Lvl ${statsCompleto.resistencia.nivel})`,
          `🌀 EM (${statsCompleto.em}k)`,
          `RCT: ${profile.rct ? `Sí (Tier ${profile.rct_tier})` : 'No'}`,
          `Maestría: ${profile.maestria || 0}%`,
        ],
        datasets: [{
          label: '⚡ Tus Stats',
          data: statsData,
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.3)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)',
          borderWidth: 4,
          pointRadius: 7,
          pointHoverRadius: 10,
          pointBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `⚡ STATS | Balance: ${statsBalanceScore.toFixed(1)}%`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { labels: { color: '#ffffff', font: { size: 16 } } }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: Math.max(...statsData) + 2,
            ticks: { 
              stepSize: 1,
              color: '#ffffff',
              font: { size: 13 },
              backdropColor: 'rgba(0, 0, 0, 0.7)',
              backdropPadding: 5
            },
            grid: { color: 'rgba(255, 255, 255, 0.15)', circular: true },
            angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
            pointLabels: { color: '#ffffff', font: { size: 13 } }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 📜 GRÁFICO 5: MISIONES
    // ═══════════════════════════════════════════════════════════════════════════

    const misionesConfig = {
      type: 'bar',
      data: {
        labels: ['Grado 4', 'Grado 3', 'Grado 2', 'Grado 1', 'Especial'],
        datasets: [
          {
            label: '📜 Completadas',
            data: misionesData,
            backgroundColor: [
              'rgba(139, 195, 74, 0.9)',
              'rgba(33, 150, 243, 0.9)',
              'rgba(255, 152, 0, 0.9)',
              'rgba(244, 67, 54, 0.9)',
              'rgba(156, 39, 176, 0.9)'
            ],
            borderColor: [
              'rgb(139, 195, 74)',
              'rgb(33, 150, 243)',
              'rgb(255, 152, 0)',
              'rgb(244, 67, 54)',
              'rgb(156, 39, 176)'
            ],
            borderWidth: 3,
            borderRadius: 8,
            borderSkipped: false
          },
          {
            label: '📊 Ideal',
            data: distribucionIdeal.map(p => Math.floor((misionesTotal * p) / 100)),
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderColor: 'rgba(255, 255, 255, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            type: 'line'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `📜 MISIONES | Total: ${misionesTotal} | Promedio: ${promedios.misiones}`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { display: true, labels: { color: '#ffffff', font: { size: 14 }, padding: 15 } }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { color: '#ffffff', font: { size: 14 }, stepSize: Math.ceil(Math.max(...misionesData) / 10) },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: { 
            ticks: { color: '#ffffff', font: { size: 14 } },
            grid: { display: false }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎖️ GRÁFICO 6: GRADOS
    // ═══════════════════════════════════════════════════════════════════════════

    const gradosLabels = profile.race === "Híbrido" 
      ? ['🎭 Social', '⚔️ General', '✨ Hechicero', '👹 Maldición']
      : ['🎭 Social', '⚔️ General'];

    const gradosValues = profile.race === "Híbrido"
      ? [gradosData.social.nivel, gradosData.general.nivel, gradosData.hechicero.nivel, gradosData.maldicion.nivel]
      : [gradosData.social.nivel, gradosData.general.nivel];

    const gradosConfig = {
      type: 'polarArea',
      data: {
        labels: gradosLabels,
        datasets: [{
          data: gradosValues,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: `🎖️ GRADOS ${profile.race === "Híbrido" ? '(HÍBRIDO)' : ''}`,
            font: { size: 28, weight: 'bold' },
            color: '#ffffff',
            padding: 25
          },
          legend: { 
            position: 'bottom',
            labels: {
              color: '#ffffff',
              font: { size: 14 },
              padding: 15,
              generateLabels: (chart) => {
                const nombres = profile.race === "Híbrido"
                  ? [gradosData.social.nombre, gradosData.general.nombre, gradosData.hechicero.nombre, gradosData.maldicion.nombre]
                  : [gradosData.social.nombre, gradosData.general.nombre];
                  
                return chart.data.labels.map((label, i) => ({
                  text: `${label}: ${nombres[i]}`,
                  fillStyle: chart.data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i
                }));
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            max: 7,
            ticks: { display: false, backdropColor: 'rgba(0, 0, 0, 0)' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 🎨 RENDERIZAR EN PARALELO
    // ═══════════════════════════════════════════════════════════════════════════

    console.log('🎨 Generando gráficos en Ultra HD...');
    
    const [xpBuffer, famaBuffer, yenesBuffer, radarBuffer, misionesBuffer, gradosBuffer] = await Promise.all([
      canvasRenderService.renderToBuffer(xpConfig),
      canvasRenderService.renderToBuffer(famaConfig),
      canvasRenderService.renderToBuffer(yenesConfig),
      canvasRenderService.renderToBuffer(radarConfig),
      canvasRenderService.renderToBuffer(misionesConfig),
      canvasRenderService.renderToBuffer(gradosConfig)
    ]);

    console.log('✅ Gráficos generados');

    // ═══════════════════════════════════════════════════════════════════════════
    // 📎 ATTACHMENTS
    // ═══════════════════════════════════════════════════════════════════════════

    const attachments = [
      new AttachmentBuilder(xpBuffer, { name: 'xp_evolution.png' }),
      new AttachmentBuilder(famaBuffer, { name: 'fama_progress.png' }),
      new AttachmentBuilder(yenesBuffer, { name: 'yenes_analysis.png' }),
      new AttachmentBuilder(radarBuffer, { name: 'stats_radar.png' }),
      new AttachmentBuilder(misionesBuffer, { name: 'misiones_analysis.png' }),
      new AttachmentBuilder(gradosBuffer, { name: 'grados_comparison.png' })
    ];

    // ═══════════════════════════════════════════════════════════════════════════
    // 📊 MÉTRICAS FINALES
    // ═══════════════════════════════════════════════════════════════════════════

    const metricas = {
      xp_total: profile.xp_total || 0,
      fama: `Nivel ${nivelFamaActual} - ${nombreNivelFama}`,
      yenes_gastados: yenesAnalisis.total,
      misiones_total: misionesTotal,
      stats_balance: `${statsBalanceScore.toFixed(1)}%`,
      ranking_xp: `#${rankingXP} de ${allUsers.length}`,
      ranking_fama: `#${rankingFama} de ${allUsers.length}`,
      tendencia: tendenciaXP > 0 ? '📈 Creciendo' : '→ Estable'
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // 💬 EMBED PRINCIPAL
    // ═══════════════════════════════════════════════════════════════════════════

    const embed = new EmbedBuilder()
      .setTitle('╔═══════════════════════════════════════════╗\n║     📊 ANÁLISIS COMPLETO DE PROGRESO 📊    ║\n╚═══════════════════════════════════════════╝')
      .setColor(colorNivelFama)
      .setDescription(
        `⊱ ────────── {⋅. ✯ .⋅} ────────── ⊰\n\n` +
        `**🎯 Perfil de ${message.member.displayName}**\n` +
        `${profile.quote ? `*"${profile.quote}"*\n` : ''}\n` +
        `\`\`\`yaml\n` +
        `═════════════════════════════════════\n` +
        `        ESTADÍSTICAS GENERALES\n` +
        `═════════════════════════════════════\n` +
        `📈 XP Total:        ${metricas.xp_total.toLocaleString()}\n` +
        `🌟 Fama:            ${metricas.fama}\n` +
        `💰 Yenes Gastados:  ¥${metricas.yenes_gastados.toLocaleString()}\n` +
        `📜 Misiones:        ${metricas.misiones_total}\n` +
        `⚖️ Balance Stats:   ${metricas.stats_balance}\n` +
        `\n` +
        `═════════════════════════════════════\n` +
        `           RANKINGS GLOBALES\n` +
        `═════════════════════════════════════\n` +
        `🏆 Ranking XP:      ${metricas.ranking_xp}\n` +
        `⭐ Ranking Fama:    ${metricas.ranking_fama}\n` +
        `📊 Tendencia:       ${metricas.tendencia}\n` +
        `\`\`\`\n\n` +
        `**🔍 Análisis:**\n` +
        `• ${misionesTotal > promedios.misiones ? '🔥 Más activo que el promedio' : '💤 Menos activo'}\n` +
        `• ${statsBalanceScore > 80 ? '✅ Build balanceada' : statsBalanceScore > 50 ? '⚠️ Build moderada' : '❌ Build desbalanceada'}\n` +
        `• ${tendenciaXP > 0 ? '📈 Crecimiento positivo' : '→ Tendencia estable'}\n\n` +
        `⊱ ────────── {⋅. ✯ .⋅} ────────── ⊰`
      )
      .setImage('attachment://xp_evolution.png')
      .setThumbnail(profile.icon || 'https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
      .setFooter({ text: `✨ Cursed Era II • Análisis Ultra HD ✨` })
      .setTimestamp();

    // ═══════════════════════════════════════════════════════════════════════════
    // 🔘 BOTONES DE NAVEGACIÓN
    // ═══════════════════════════════════════════════════════════════════════════

    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('grafico_xp')
        .setLabel('XP')
        .setEmoji('📈')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('grafico_fama')
        .setLabel('Fama')
        .setEmoji('🌟')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('grafico_yenes')
        .setLabel('Yenes')
        .setEmoji('💰')
        .setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('grafico_stats')
        .setLabel('Stats')
        .setEmoji('⚡')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('grafico_misiones')
        .setLabel('Misiones')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('grafico_grados')
        .setLabel('Grados')
        .setEmoji('🎖️')
        .setStyle(ButtonStyle.Success)
    );

    // ═══════════════════════════════════════════════════════════════════════════
    // 📤 ENVIAR CON BOTONES
    // ═══════════════════════════════════════════════════════════════════════════

    await message.channel.send({ 
      embeds: [embed], 
      files: attachments,
      components: [row1, row2]
    });

    console.log(`✅ Comando -grafico ejecutado para ${message.author.tag}`);

  } catch (err) {
    console.error('❌ Error en -grafico:', err);
    await message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║     ❌ ERROR EN GRÁFICOS ❌          ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ Error al generar los gráficos.\n\n` +
      `**📦 Requisitos:**\n` +
      `\`\`\`bash\n` +
      `npm install chartjs-node-canvas chart.js\n` +
      `\`\`\`\n\n` +
      `**🔍 Error:**\n` +
      `\`\`\`${err.message}\`\`\``
    );
  }
  return;
}
    
// ═══════════════════════════════════════════════════════════
// SISTEMA DE ECONOMÍA - TRABAJO Y FARMEO
// ═══════════════════════════════════════════════════════════

// Comando -trabajar
if (command === 'trabajar') {
  const ahora = Date.now();
  const cooldownTiempo = 60 * 60 * 1000; // 1 hora en milisegundos
  
  // Verificar cooldown
  if (profile.cooldowns && profile.cooldowns.trabajar) {
    const tiempoRestante = profile.cooldowns.trabajar + cooldownTiempo - ahora;
    if (tiempoRestante > 0) {
      const minutos = Math.ceil(tiempoRestante / 60000);
      return message.reply(
        `╔════════════════════════════════════╗\n` +
        `║   ⏰ COOLDOWN ACTIVO ⏰          ║\n` +
        `╚════════════════════════════════════╝\n\n` +
        `⚠️ Ya trabajaste recientemente.\n\n` +
        `🕐 **Tiempo restante:** ${minutos} minutos\n\n` +
        `💡 Mientras esperás podés:\n` +
        `• Apostar con \`-apostar\`\n` +
        `• Ver tu perfil con \`-perfil\`\n` +
        `• Comprar items con \`-tienda\``
      );
      
    }
  }
  
  // Inicializar cooldowns si no existe
  if (!profile.cooldowns) profile.cooldowns = {};
  
  // Elegir tipo de trabajo aleatorio
  const trabajos = [
    { tipo: 'trivia', nombre: 'Trivia JJK' },
    { tipo: 'adivina', nombre: 'Adivina el Número' },
    { tipo: 'reaccion', nombre: 'Test de Reflejos' }
  ];
  
  const trabajoElegido = trabajos[Math.floor(Math.random() * trabajos.length)];
  
  // TRIVIA JJK
  if (trabajoElegido.tipo === 'trivia') {
    const preguntas = [
      { pregunta: '¿Quién es el usuario más fuerte? (responde: gojo)', respuesta: 'gojo', recompensa: 5000 },
      { pregunta: '¿Cuál es la técnica de Yuji Itadori? (responde: divergent fist)', respuesta: 'divergent fist', recompensa: 4000 },
      { pregunta: '¿Qué clan tiene el ritual "10 Sombras"? (responde: zenin)', respuesta: 'zenin', recompensa: 4500 },
      { pregunta: '¿Cuál es el nombre del dominio de Gojo? (responde: infinite void)', respuesta: 'infinite void', recompensa: 6000 },
      { pregunta: '¿Quién es el rey de las maldiciones? (responde: sukuna)', respuesta: 'sukuna', recompensa: 3500 },
      { pregunta: '¿Qué significa RCT? (responde: reverse cursed technique)', respuesta: 'reverse cursed technique', recompensa: 7000 },
      { pregunta: '¿Cuántos dedos de Sukuna existen? (responde: 20)', respuesta: '20', recompensa: 5500 },
      { pregunta: '¿Cómo se llama la técnica de Megumi? (responde: ten shadows)', respuesta: 'ten shadows', recompensa: 4800 }
    ];
    
    const preguntaObj = preguntas[Math.floor(Math.random() * preguntas.length)];
    
    const embed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ TRIVIA JUJUTSU KAISEN 📚 █▇▅▃▂')
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `**Pregunta:**\n${preguntaObj.pregunta}\n\n` +
        `**Recompensa:** ¥${preguntaObj.recompensa.toLocaleString()}\n` +
        `**Tiempo límite:** 30 segundos\n\n` +
        `Respondé en el chat para ganar los yenes!\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setColor(0x00FFFF)
      .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
      .setFooter({ text: 'Cursed Era II • Sistema de Trabajo' });
    
    await message.channel.send({ embeds: [embed] });
    
    // Esperar respuesta
    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', respuesta => {
      const respuestaLimpia = respuesta.content.toLowerCase().trim();
      
      if (respuestaLimpia === preguntaObj.respuesta.toLowerCase()) {
        // Respuesta correcta
        profile.yen = (profile.yen || 0) + preguntaObj.recompensa;
        profile.cooldowns.trabajar = ahora;
        
        // Registrar en historial
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_trivia',
          cantidad: preguntaObj.recompensa
        });
        
        saveDB();
        
        message.reply(
          `✅ **¡CORRECTO!** 🎉\n\n` +
          `Ganaste **¥${preguntaObj.recompensa.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      } else {
        // Respuesta incorrecta
        const consolacion = Math.floor(preguntaObj.recompensa * 0.2);
        profile.yen = (profile.yen || 0) + consolacion;
        profile.cooldowns.trabajar = ahora;
        
        // Registrar en historial
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_trivia_fallido',
          cantidad: consolacion
        });
        
        saveDB();
        
        message.reply(
          `❌ **Incorrecto.** La respuesta era: **${preguntaObj.respuesta}**\n\n` +
          `Premio de consolación: **¥${consolacion.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        const consolacion = Math.floor(preguntaObj.recompensa * 0.1);
        profile.yen = (profile.yen || 0) + consolacion;
        profile.cooldowns.trabajar = ahora;
        
        // Registrar en historial
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_timeout',
          cantidad: consolacion
        });
        
        saveDB();
        
        message.reply(
          `⏰ **Tiempo agotado!** La respuesta era: **${preguntaObj.respuesta}**\n\n` +
          `Premio de consolación: **¥${consolacion.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      }
    });
    
    return;
  }
  
  // ADIVINA EL NÚMERO
  if (trabajoElegido.tipo === 'adivina') {
    const numeroSecreto = Math.floor(Math.random() * 10) + 1; // 1-10
    const recompensaBase = 8000;
    
    const embed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ ADIVINA EL NÚMERO 🎲 █▇▅▃▂')
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `Adiviná un número entre **1 y 10**\n\n` +
        `**Recompensa:** ¥${recompensaBase.toLocaleString()} (si acertás)\n` +
        `**Tiempo límite:** 20 segundos\n\n` +
        `Escribí solo el número en el chat!\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setColor(0xFF6B6B)
      .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
      .setFooter({ text: 'Cursed Era II • Sistema de Trabajo' });
    
    await message.channel.send({ embeds: [embed] });
    
    const filter = m => m.author.id === message.author.id && !isNaN(m.content);
    const collector = message.channel.createMessageCollector({ filter, time: 20000, max: 1 });
    
    collector.on('collect', respuesta => {
      const numero = parseInt(respuesta.content);
      
      if (numero === numeroSecreto) {
        // Acertó
        profile.yen = (profile.yen || 0) + recompensaBase;
        profile.cooldowns.trabajar = ahora;
        
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_adivina',
          cantidad: recompensaBase
        });
        
        saveDB();
        
        message.reply(
          `🎉 **¡ACERTASTE!** El número era **${numeroSecreto}**\n\n` +
          `Ganaste **¥${recompensaBase.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      } else {
        // Falló
        const consolacion = Math.floor(recompensaBase * 0.15);
        profile.yen = (profile.yen || 0) + consolacion;
        profile.cooldowns.trabajar = ahora;
        
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_adivina_fallido',
          cantidad: consolacion
        });
        
        saveDB();
        
        message.reply(
          `❌ **No acertaste.** El número era **${numeroSecreto}**\n\n` +
          `Premio de consolación: **¥${consolacion.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        profile.cooldowns.trabajar = ahora;
        saveDB();
        message.reply(`⏰ **Tiempo agotado!** El número era **${numeroSecreto}**. ¡Intentá de nuevo en 1 hora!`);
      }
    });
    
    return;
  }
  
  // TEST DE REFLEJOS
  if (trabajoElegido.tipo === 'reaccion') {
    const recompensaBase = 6000;
    const tiempoEspera = Math.floor(Math.random() * 3000) + 2000; // 2-5 segundos
    
    const embedInicio = new EmbedBuilder()
      .setTitle('▂▃▅▇█ TEST DE REFLEJOS ⚡ █▇▅▃▂')
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `¡Esperá a que aparezca el emoji! 👀\n` +
        `Cuando lo veas, escribí **AHORA** lo más rápido posible!\n\n` +
        `**Recompensa:** Hasta ¥${recompensaBase.toLocaleString()} (según tu velocidad)\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setColor(0xFFFF00)
      .setFooter({ text: 'Cursed Era II • Sistema de Trabajo' });
    
    const msg = await message.channel.send({ embeds: [embedInicio] });
    
    setTimeout(async () => {
      const embedReaccion = new EmbedBuilder()
        .setTitle('▂▃▅▇█ ⚡ ¡AHORA! ⚡ █▇▅▃▂')
        .setDescription('**¡ESCRIBÍ "AHORA"!** ⚡⚡⚡')
        .setColor(0x00FF00);
      
      await msg.edit({ embeds: [embedReaccion] });
      
      const inicio = Date.now();
      const filter = m => m.author.id === message.author.id && m.content.toLowerCase() === 'ahora';
      const collector = message.channel.createMessageCollector({ filter, time: 5000, max: 1 });
      
      collector.on('collect', () => {
        const tiempoReaccion = Date.now() - inicio;
        let multiplicador = 1;
        
        if (tiempoReaccion < 500) multiplicador = 1.5;
        else if (tiempoReaccion < 1000) multiplicador = 1.3;
        else if (tiempoReaccion < 2000) multiplicador = 1.1;
        else if (tiempoReaccion < 3000) multiplicador = 0.8;
        else multiplicador = 0.5;
        
        const ganancia = Math.floor(recompensaBase * multiplicador);
        profile.yen = (profile.yen || 0) + ganancia;
        profile.cooldowns.trabajar = ahora;
        
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: ahora,
          tipo: 'trabajo_reflejos',
          cantidad: ganancia
        });
        
        saveDB();
        
        message.reply(
          `⚡ **Tiempo de reacción:** ${tiempoReaccion}ms\n\n` +
          `Ganaste **¥${ganancia.toLocaleString()}**\n` +
          `Saldo actual: **¥${profile.yen.toLocaleString()}**`
        );
      });
      
      collector.on('end', collected => {
        if (collected.size === 0) {
          profile.cooldowns.trabajar = ahora;
          saveDB();
          message.reply(`⏰ **Muy lento!** No ganaste nada. ¡Intentá de nuevo en 1 hora!`);
        }
      });
      
    }, tiempoEspera);
    
    return;
  }
}
// ═══════════════════════════════════════════════════════════════════════════
// COMANDO -tema: Cambiar el tema visual del perfil
// ═══════════════════════════════════════════════════════════════════════════
if (command === 'tema') {
  const userProfile = getProfile(message.author.id);
  
  if (!userProfile.personalizacion) {
    userProfile.personalizacion = {
      color_embed: null,
      tema: "default",
      efecto_visual: "ninguno",
      separador: "default",
      color_texto: "default"
    };
  }
  
  // Sin argumentos: mostrar temas disponibles
  if (args.length === 0) {
    let temasList = "**🎨 TEMAS DISPONIBLES:**\n\n";
    
    for (const [key, tema] of Object.entries(temasVisuales)) {
      const emoji = userProfile.personalizacion.tema === key ? "✅" : "⚪";
      temasList += `${emoji} \`${key}\` - **${tema.nombre}**\n`;
      temasList += `   └─ ${tema.descripcion}\n`;
      temasList += `   └─ Vista: ${tema.separador}\n\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('╔════════════════════════════════════════╗\n║   🎨 TEMAS VISUALES 🎨              ║\n╚════════════════════════════════════════╝')
      .setColor(temasVisuales[userProfile.personalizacion.tema]?.color || 0x2F3136)
      .setDescription(
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
        `**Tu tema actual:** \`${userProfile.personalizacion.tema}\`\n` +
        `**Nombre:** ${temasVisuales[userProfile.personalizacion.tema]?.nombre || "Default"}\n\n` +
        temasList +
        `**💡 Uso:** \`-tema <nombre>\`\n` +
        `**Ejemplo:** \`-tema neon\`\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: '🎨 Cursed Era II • Personalización' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  }

  
  // Cambiar tema
  const temaSeleccionado = args[0].toLowerCase();
  
  if (!temasVisuales[temaSeleccionado]) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ TEMA NO ENCONTRADO ❌           ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ El tema \`${temaSeleccionado}\` no existe.\n\n` +
      `Usa \`-tema\` sin argumentos para ver la lista de temas disponibles.`
    );
  }
  
  const temaAnterior = userProfile.personalizacion.tema;
  userProfile.personalizacion.tema = temaSeleccionado;
  saveDB();
  
  const tema = temasVisuales[temaSeleccionado];
  
  const confirmEmbed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   ✅ TEMA ACTUALIZADO ✅             ║\n╚════════════════════════════════════════╝')
    .setColor(tema.color)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `✅ **Tu tema ha sido cambiado exitosamente!**\n\n` +
      `\`\`\`diff\n` +
      `- Tema anterior: ${temasVisuales[temaAnterior]?.nombre || "Default"}\n` +
      `+ Tema nuevo: ${tema.nombre}\n` +
      `\`\`\`\n\n` +
      `**📋 Información del tema:**\n` +
      `• Nombre: ${tema.nombre}\n` +
      `• Descripción: ${tema.descripcion}\n` +
      `• Vista previa:\n${tema.separador}\n\n` +
      `Usa \`-perfil\` para ver tu nuevo tema aplicado.\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: '🎨 Cursed Era II • Tema Actualizado' })
    .setTimestamp();
  
  return message.reply({ embeds: [confirmEmbed] });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMANDO -efecto: Agregar efectos visuales al perfil
// ═══════════════════════════════════════════════════════════════════════════
if (command === 'efecto') {
  const userProfile = getProfile(message.author.id);
  
  if (!userProfile.personalizacion) {
    userProfile.personalizacion = {
      color_embed: null,
      tema: "default",
      efecto_visual: "ninguno",
      separador: "default",
      color_texto: "default"
    };
  }
  
  // Sin argumentos: mostrar efectos disponibles
  if (args.length === 0) {
    let efectosList = "**✨ EFECTOS DISPONIBLES:**\n\n";
    
    for (const [key, efecto] of Object.entries(efectosVisuales)) {
      const emoji = userProfile.personalizacion.efecto_visual === key ? "✅" : "⚪";
      efectosList += `${emoji} \`${key}\` - **${efecto.nombre}**\n`;
      efectosList += `   └─ ${efecto.descripcion}\n`;
      if (efecto.particulas) {
        efectosList += `   └─ Vista: ${efecto.particulas}\n`;
      }
      efectosList += `\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('╔════════════════════════════════════════╗\n║   ✨ EFECTOS VISUALES ✨            ║\n╚════════════════════════════════════════╝')
      .setColor(0xFF1493)
      .setDescription(
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
        `**Tu efecto actual:** \`${userProfile.personalizacion.efecto_visual}\`\n` +
        `**Nombre:** ${efectosVisuales[userProfile.personalizacion.efecto_visual]?.nombre || "Sin Efecto"}\n\n` +
        efectosList +
        `**💡 Uso:** \`-efecto <nombre>\`\n` +
        `**Ejemplo:** \`-efecto estrellas\`\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: '✨ Cursed Era II • Efectos Visuales' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  }
  
  // Cambiar efecto
  const efectoSeleccionado = args[0].toLowerCase();
  
  if (!efectosVisuales[efectoSeleccionado]) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ EFECTO NO ENCONTRADO ❌         ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ El efecto \`${efectoSeleccionado}\` no existe.\n\n` +
      `Usa \`-efecto\` sin argumentos para ver la lista de efectos disponibles.`
    );
  }
  
  const efectoAnterior = userProfile.personalizacion.efecto_visual;
  userProfile.personalizacion.efecto_visual = efectoSeleccionado;
  saveDB();
  
  const efecto = efectosVisuales[efectoSeleccionado];
  
  const confirmEmbed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   ✅ EFECTO ACTUALIZADO ✅           ║\n╚════════════════════════════════════════╝')
    .setColor(0x00FF00)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `${efecto.particulas ? efecto.particulas + '\n\n' : ''}` +
      `✅ **Tu efecto visual ha sido cambiado!**\n\n` +
      `\`\`\`diff\n` +
      `- Efecto anterior: ${efectosVisuales[efectoAnterior]?.nombre || "Sin Efecto"}\n` +
      `+ Efecto nuevo: ${efecto.nombre}\n` +
      `\`\`\`\n\n` +
      `**📋 Información del efecto:**\n` +
      `• Nombre: ${efecto.nombre}\n` +
      `• Descripción: ${efecto.descripcion}\n\n` +
      `Usa \`-perfil\` para ver tu nuevo efecto en acción.\n\n` +
      `${efecto.particulas ? efecto.particulas + '\n\n' : ''}` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: '✨ Cursed Era II • Efecto Actualizado' })
    .setTimestamp();
  
  return message.reply({ embeds: [confirmEmbed] });
}

// ═══════════════════════════════════════════════════════════════════════════
// COMANDO -colorperfil: Cambiar el color del borde del embed
// ═══════════════════════════════════════════════════════════════════════════
if (command === 'colorperfil' || command === 'colorembed') {
  const userProfile = getProfile(message.author.id);
  
  if (!userProfile.personalizacion) {
    userProfile.personalizacion = {
      color_embed: null,
      tema: "default",
      efecto_visual: "ninguno",
      separador: "default",
      color_texto: "default"
    };
  }
  
  // Sin argumentos: mostrar ayuda
  if (args.length === 0) {
    const colorActual = userProfile.personalizacion.color_embed || "Usando color del tema";
    
    const embed = new EmbedBuilder()
      .setTitle('╔════════════════════════════════════════╗\n║   🎨 COLOR DEL PERFIL 🎨            ║\n╚════════════════════════════════════════╝')
      .setColor(userProfile.personalizacion.color_embed || temasVisuales[userProfile.personalizacion.tema]?.color || 0x2F3136)
      .setDescription(
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
        `**Tu color actual:** \`${colorActual}\`\n\n` +
        `**📋 Cómo usar:**\n` +
        `\`-colorperfil <código>\` - Establecer color personalizado\n` +
        `\`-colorperfil reset\` - Volver al color del tema\n\n` +
        `**🎨 Formatos aceptados:**\n` +
        `• Hexadecimal: \`#FF0000\` o \`0xFF0000\`\n` +
        `• Decimal: \`16711680\`\n\n` +
        `**💡 Ejemplos:**\n` +
        `\`-colorperfil #FF0000\` → Rojo\n` +
        `\`-colorperfil 0x00FF00\` → Verde\n` +
        `\`-colorperfil 255\` → Azul oscuro\n` +
        `\`-colorperfil #FFD700\` → Dorado\n\n` +
        `**🌐 Recursos útiles:**\n` +
        `[Color Picker](https://htmlcolorcodes.com/)\n` +
        `[Discord Color Tool](https://discordjs.guide/popular-topics/embeds.html#embed-preview)\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: '🎨 Cursed Era II • Color Personalizado' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  }
  
  // Reset color
  if (args[0].toLowerCase() === 'reset' || args[0].toLowerCase() === 'resetear') {
    userProfile.personalizacion.color_embed = null;
    saveDB();
    
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ✅ COLOR RESETEADO ✅              ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `✅ Tu perfil ahora usará el color de tu tema actual.\n\n` +
      `**Tema:** ${temasVisuales[userProfile.personalizacion.tema]?.nombre || "Default"}\n\n` +
      `Usa \`-perfil\` para verificar.`
    );
  }
  
  // Parsear color
  let colorInput = args[0].trim();
  let colorValue;
  
  try {
    // Si empieza con #, convertir hex a decimal
    if (colorInput.startsWith('#')) {
      colorValue = parseInt(colorInput.substring(1), 16);
    }
    // Si empieza con 0x, ya es formato correcto
    else if (colorInput.startsWith('0x')) {
      colorValue = parseInt(colorInput, 16);
    }
    // Si es solo número
    else {
      colorValue = parseInt(colorInput);
    }
    
    // Validar que sea un número válido
    if (isNaN(colorValue) || colorValue < 0 || colorValue > 0xFFFFFF) {
      return message.reply(
        `╔════════════════════════════════════════╗\n` +
        `║   ❌ COLOR NO VÁLIDO ❌              ║\n` +
        `╚════════════════════════════════════════╝\n\n` +
        `⚠️ El color debe ser un valor entre 0 y 16777215.\n\n` +
        `**Formatos válidos:**\n` +
        `• \`#FF0000\` (hexadecimal)\n` +
        `• \`0xFF0000\` (hex con prefijo)\n` +
        `• \`16711680\` (decimal)\n\n` +
        `Usa \`-colorperfil\` para ver ejemplos.`
      );
    }
    
    // Guardar color
    userProfile.personalizacion.color_embed = colorValue;
    saveDB();
    
    const confirmEmbed = new EmbedBuilder()
      .setTitle('╔════════════════════════════════════════╗\n║   ✅ COLOR ACTUALIZADO ✅            ║\n╚════════════════════════════════════════╝')
      .setColor(colorValue)
      .setDescription(
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
        `✅ **El color de tu perfil ha sido cambiado!**\n\n` +
        `**📋 Información del color:**\n` +
        `• Input: \`${colorInput}\`\n` +
        `• Valor: \`${colorValue}\`\n` +
        `• Hexadecimal: \`#${colorValue.toString(16).toUpperCase().padStart(6, '0')}\`\n\n` +
        `**Este embed tiene tu nuevo color aplicado.**\n\n` +
        `Usa \`-perfil\` para verlo en tu perfil completo.\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: '🎨 Cursed Era II • Color Personalizado' })
      .setTimestamp();
    
    return message.reply({ embeds: [confirmEmbed] });
    
  } catch (error) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ ERROR AL PROCESAR ❌            ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ No se pudo procesar el color: \`${colorInput}\`\n\n` +
      `Usa \`-colorperfil\` para ver el formato correcto.`
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COMANDO -colortexto: Cambiar color del texto en el perfil (ANSI)
// ═══════════════════════════════════════════════════════════════════════════
if (command === 'colortexto' || command === 'textcolor') {
  const userProfile = getProfile(message.author.id);
  
  if (!userProfile.personalizacion) {
    userProfile.personalizacion = {
      color_embed: null,
      tema: "default",
      efecto_visual: "ninguno",
      separador: "default",
      color_texto: "default"
    };
  }
  
  // Sin argumentos: mostrar colores disponibles
  if (args.length === 0) {
    let coloresList = "**🎨 COLORES DE TEXTO DISPONIBLES:**\n\n";
    
    for (const [key, color] of Object.entries(coloresTexto)) {
      const emoji = userProfile.personalizacion.color_texto === key ? "✅" : "⚪";
      coloresList += `${emoji} \`${key}\` - **${color.nombre}**\n`;
      coloresList += `\`\`\`ansi\n${color.codigo}${color.preview}\u001b[0m\n\`\`\`\n`;
    }
    
    const embed = new EmbedBuilder()
      .setTitle('╔════════════════════════════════════════╗\n║   💬 COLORES DE TEXTO 💬            ║\n╚════════════════════════════════════════╝')
      .setColor(0x00CED1)
      .setDescription(
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
        `**Tu color actual:** \`${userProfile.personalizacion.color_texto}\`\n` +
        `**Nombre:** ${coloresTexto[userProfile.personalizacion.color_texto]?.nombre || "Blanco Default"}\n\n` +
        coloresList +
        `**💡 Uso:** \`-colortexto <nombre>\`\n` +
        `**Ejemplo:** \`-colortexto cyan\`\n\n` +
        `**📝 Nota:** Los colores se aplican con códigos ANSI\n` +
        `en bloques de código de tu perfil.\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setFooter({ text: '💬 Cursed Era II • Color de Texto' })
      .setTimestamp();
    
    return message.reply({ embeds: [embed] });
  }
  
  // Cambiar color de texto
  const colorSeleccionado = args[0].toLowerCase();
  
  if (!coloresTexto[colorSeleccionado]) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ COLOR NO ENCONTRADO ❌          ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ El color \`${colorSeleccionado}\` no existe.\n\n` +
      `Usa \`-colortexto\` sin argumentos para ver los colores disponibles.`
    );
  }
  
  const colorAnterior = userProfile.personalizacion.color_texto;
  userProfile.personalizacion.color_texto = colorSeleccionado;
  saveDB();
  
  const color = coloresTexto[colorSeleccionado];
  
  const confirmEmbed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   ✅ COLOR DE TEXTO ACTUALIZADO ✅   ║\n╚════════════════════════════════════════╝')
    .setColor(0x00FF00)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `✅ **El color de texto ha sido cambiado!**\n\n` +
      `\`\`\`diff\n` +
      `- Color anterior: ${coloresTexto[colorAnterior]?.nombre || "Blanco Default"}\n` +
      `+ Color nuevo: ${color.nombre}\n` +
      `\`\`\`\n\n` +
      `**Vista previa:**\n` +
      `\`\`\`ansi\n` +
      `${color.codigo}${color.preview}\u001b[0m\n` +
      `\`\`\`\n\n` +
      `Este color se aplicará en secciones con\n` +
      `formato de texto especial en tu perfil.\n\n` +
      `Usa \`-perfil\` para ver el resultado.\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: '💬 Cursed Era II • Color de Texto' })
    .setTimestamp();
  
  return message.reply({ embeds: [confirmEmbed] });
}
// ═══════════════════════════════════════════════════════════════════════════
// COMANDO -resetperfil: Resetear toda la personalización
// ═══════════════════════════════════════════════════════════════════════════
if (command === 'resetperfil' || command === 'resetpersonalizacion') {
  const userProfile = getProfile(message.author.id);
  
  if (!userProfile.personalizacion) {
    return message.reply('⚠️ No tienes ninguna personalización activa.');
  }
  
  const persoAnterior = { ...userProfile.personalizacion };
  
  userProfile.personalizacion = {
    color_embed: null,
    tema: "default",
    efecto_visual: "ninguno",
    separador: "default",
    color_texto: "default"
  };
  
  saveDB();
  
  const embed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   🔄 PERFIL RESETEADO 🔄            ║\n╚════════════════════════════════════════╝')
    .setColor(0x2F3136)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `✅ **Toda tu personalización ha sido reseteada.**\n\n` +
      `\`\`\`diff\n` +
      `- Tema: ${temasVisuales[persoAnterior.tema]?.nombre || "Default"}\n` +
      `+ Tema: Default\n` +
      `\n` +
      `- Efecto: ${efectosVisuales[persoAnterior.efecto_visual]?.nombre || "Ninguno"}\n` +
      `+ Efecto: Ninguno\n` +
      `\n` +
      `- Color personalizado: ${persoAnterior.color_embed ? 'Sí' : 'No'}\n` +
      `+ Color personalizado: No\n` +
      `\n` +
      `- Color de texto: ${coloresTexto[persoAnterior.color_texto]?.nombre || "Default"}\n` +
      `+ Color de texto: Default\n` +
      `\`\`\`\n\n` +
      `**Tu perfil ahora usa la configuración por defecto.**\n\n` +
      `Usa los comandos de personalización para configurarlo de nuevo:\n` +
      `• \`-tema\` - Cambiar tema\n` +
      `• \`-efecto\` - Agregar efectos\n` +
      `• \`-colorperfil\` - Color del embed\n` +
      `• \`-colortexto\` - Color del texto\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: '🔄 Cursed Era II • Perfil Reseteado' })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}

// ──────────────────────────────────────────────────────────────
// COMANDO: -set_grado_social
// ──────────────────────────────────────────────────────────────

if (command === 'set_grado_social' || command === 'grado_social') {
  // Verificar permisos de administrador
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo los administradores pueden usar este comando.');
  }
  
  const targetMember = message.mentions.members.first();
  const grado = args.slice(1).join(' ');
  
  if (!targetMember) {
    return message.reply(
      '❌ Debes mencionar a un usuario.\n\n' +
      '**Uso:** `-set_grado_social @usuario [grado]`\n\n' +
      '**Grados disponibles:**\n' +
      '• Grado 4\n' +
      '• Grado 3\n' +
      '• Grado 2\n' +
      '• Grado 1\n' +
      '• Grado Especial\n' +
      '• Sin grado\n\n' +
      '**Ejemplo:** `-set_grado_social @usuario Grado 2`'
    );
  }
  
  if (!grado) {
    return message.reply('❌ Debes especificar el grado.\n**Ejemplo:** `-set_grado_social @usuario Grado 2`');
  }
  
  const targetProfile = getProfile(targetMember.id);
  targetProfile.grado_social = grado;
  saveDB();
  
  const embed = new EmbedBuilder()
    .setTitle('🎖️ Grado Social Actualizado')
    .setColor(0x00FF00)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `**Usuario:** ${targetMember.displayName}\n` +
      `**Nuevo Grado Social:** ${grado}\n\n` +
      `⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setFooter({ text: `Actualizado por ${message.author.username}` })
    .setTimestamp();
    // 🎮 CREAR BOTONES INTERACTIVOS
const botonesNavegacion = new ActionRowBuilder()
.addComponents(
  new ButtonBuilder()
    .setCustomId('ver_fama')
    .setLabel('⭐ Ver Fama')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('⭐'),
  new ButtonBuilder()
    .setCustomId('ver_economia')
    .setLabel('💰 Ver Economía')
    .setStyle(ButtonStyle.Success)
    .setEmoji('💰'),
  new ButtonBuilder()
    .setCustomId('ver_stats')
    .setLabel('⚡ Ver Stats')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('⚡'),
  new ButtonBuilder()
    .setCustomId('ver_misiones')
    .setLabel('📜 Ver Misiones')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('📜')
);
const botonesExtras = new ActionRowBuilder()
.addComponents(
  new ButtonBuilder()
    .setCustomId('ver_grados')
    .setLabel('🎖️ Ver Grados')
    .setStyle(ButtonStyle.Primary)
    .setEmoji('🎖️'),
  new ButtonBuilder()
    .setCustomId('compartir')
    .setLabel('📤 Compartir')
    .setStyle(ButtonStyle.Success)
    .setEmoji('📤'),
  new ButtonBuilder()
    .setCustomId('exportar_pdf')
    .setLabel('📄 Exportar PDF')
    .setStyle(ButtonStyle.Secondary)
    .setEmoji('📄'),
  new ButtonBuilder()
    .setCustomId('cerrar')
    .setLabel('❌ Cerrar')
    .setStyle(ButtonStyle.Danger)
    .setEmoji('❌')
);
  
  return message.channel.send({ embeds: [embed] });
}

// ──────────────────────────────────────────────────────────────
// COMANDO: -set_grado_general (Hechiceros e Híbridos)
// ──────────────────────────────────────────────────────────────

if (command === 'set_grado_general' || command === 'grado_general' || command === 'set_grado_hechicero') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo los administradores pueden usar este comando.');
  }
  
  const targetMember = message.mentions.members.first();
  const grado = args.slice(1).join(' ');
  
  if (!targetMember) {
    return message.reply(
      '❌ Debes mencionar a un usuario.\n\n' +
      '**Uso:** `-set_grado_general @usuario [grado]`\n\n' +
      '**Grados disponibles:**\n' +
      '• Grado 4\n' +
      '• Grado 3\n' +
      '• Grado 2\n' +
      '• Grado 1\n' +
      '• Grado Especial\n' +
      '• Sin grado\n\n' +
      '**Ejemplo:** `-set_grado_general @usuario Grado Especial`'
    );
  }
  
  if (!grado) {
    return message.reply('❌ Debes especificar el grado.\n**Ejemplo:** `-set_grado_general @usuario Grado 1`');
  }
  
  const targetProfile = getProfile(targetMember.id);
  targetProfile.grado_general = grado;
  targetProfile.grado_hechicero = grado; // También actualizar el campo específico
  saveDB();
  
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Grado General (Hechicero) Actualizado')
    .setColor(0x0080FF)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `**Usuario:** ${targetMember.displayName}\n` +
      `**Nuevo Grado General:** ${grado}\n\n` +
      `⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setFooter({ text: `Actualizado por ${message.author.username}` })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}

// ──────────────────────────────────────────────────────────────
// COMANDO: -set_grado_maldicion (Maldiciones e Híbridos)
// ──────────────────────────────────────────────────────────────

if (command === 'set_grado_maldicion' || command === 'grado_maldicion') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo los administradores pueden usar este comando.');
  }
  
  const targetMember = message.mentions.members.first();
  const grado = args.slice(1).join(' ');
  
  if (!targetMember) {
    return message.reply(
      '❌ Debes mencionar a un usuario.\n\n' +
      '**Uso:** `-set_grado_maldicion @usuario [grado]`\n\n' +
      '**Grados disponibles:**\n' +
      '• Grado 4\n' +
      '• Grado 3\n' +
      '• Grado 2\n' +
      '• Grado 1\n' +
      '• Grado Especial\n' +
      '• Sin grado\n\n' +
      '**Ejemplo:** `-set_grado_maldicion @usuario Grado Especial`'
    );
  }
  
  if (!grado) {
    return message.reply('❌ Debes especificar el grado.\n**Ejemplo:** `-set_grado_maldicion @usuario Grado 2`');
  }
  
  const targetProfile = getProfile(targetMember.id);
  const raza = targetProfile.race;
  
  // Verificar que sea Espíritu Maldito o Híbrido
  if (raza !== 'Espíritu Maldito' && raza !== 'Híbrido') {
    return message.reply(
      `❌ ${targetMember.displayName} no es una Maldición o Híbrido.\n` +
      `Raza actual: **${raza}**\n\n` +
      `Este comando solo funciona para Espíritus Malditos e Híbridos.`
    );
  }
  
  targetProfile.grado_maldicion = grado;
  saveDB();
  
  const embed = new EmbedBuilder()
    .setTitle('👹 Grado de Maldición Actualizado')
    .setColor(0xFF0000)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `**Usuario:** ${targetMember.displayName}\n` +
      `**Raza:** ${raza}\n` +
      `**Nuevo Grado de Maldición:** ${grado}\n\n` +
      `⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setFooter({ text: `Actualizado por ${message.author.username}` })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}

// ──────────────────────────────────────────────────────────────
// COMANDO: -grados (Ver todos los comandos de grados)
// ──────────────────────────────────────────────────────────────

if (command === 'grados' || command === 'ayuda_grados') {
  const embed = new EmbedBuilder()
    .setTitle('🎖️ Sistema de Grados - Ayuda')
    .setColor(0xFFD700)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `**COMANDOS DE GRADOS (Solo Admin)**\n\n` +
      
      `**👤 Grado Social:**\n` +
      `\`-set_grado_social @usuario [grado]\`\n` +
      `Define el grado social del hechicero\n` +
      `_Ejemplo: -set_grado_social @user Grado 2_\n\n` +
      
      `**⚔️ Grado General (Hechicero):**\n` +
      `\`-set_grado_general @usuario [grado]\`\n` +
      `Define el grado como hechicero\n` +
      `_Ejemplo: -set_grado_general @user Grado 1_\n\n` +
      
      `**👹 Grado de Maldición:**\n` +
      `\`-set_grado_maldicion @usuario [grado]\`\n` +
      `Define el grado como maldición (solo Espíritus/Híbridos)\n` +
      `_Ejemplo: -set_grado_maldicion @user Grado Especial_\n\n` +
      
      `**📋 GRADOS DISPONIBLES:**\n` +
      `• Grado 4\n` +
      `• Grado 3\n` +
      `• Grado 2\n` +
      `• Grado 1\n` +
      `• Grado Especial\n` +
      `• Sin grado\n\n` +
      
      `**🧬 NOTA PARA HÍBRIDOS:**\n` +
      `Los Híbridos tienen tanto grado de hechicero como de maldición.\n` +
      `Ambos deben ser configurados independientemente.\n\n` +
      
      `⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
    .setFooter({ text: 'Cursed Era II • Sistema de Grados' })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}
// ═══════════════════════════════════════════════════════════
// SISTEMA DE PRODIGIOS
// ═══════════════════════════════════════════════════════════

// Comando -prodigio
if (command === 'prodigio') {
  if (profile.potencial !== 'Prodigio') {
    return message.reply('❌ Solo quienes obtuvieron **Prodigio** en `-potencial` pueden usar este comando.');
  }
  
  if (profile.cantidad_prodigios !== null && profile.rr_prodigio_usados >= 2) {
    return message.reply('Ya usaste los 2 rerolls permitidos para este spin. Tu cantidad final es: **' + profile.cantidad_prodigios + '** tipo(s) de prodigio.');
  }
  
  // Probabilidades: 0 = 60%, 1 = 35%, 2 = 5%
  const prodigioProbabilidades = [
    { cantidad: 0, prob: 0.60 },
    { cantidad: 1, prob: 0.35 },
    { cantidad: 2, prob: 0.05 }
  ];
  
  const result = weightedRandom(prodigioProbabilidades);
  profile.cantidad_prodigios = result.cantidad;
  
  if (!profile.rr_prodigio_usados) {
    profile.rr_prodigio_usados = 0;
  }
  
  saveDB();
  
  let mensajeRespuesta = '';
  
  if (result.cantidad === 0) {
    mensajeRespuesta = 
`*\`\`Al nacer, las Maldiciones no tuvieron reacción alguna y tus padres planearon un falso secuestro para tirarte de un puente cuándo se enteraron que...\`\`*
***No poseías un tipo de Prodigio.***
-# _¡Sólo puedes usar dos RR en éste spin! ¡No queremos que el server se llené de Prodigios!_
[***A Total Nobody!***](https://tenor.com/view/okkotsu-yuta-okkotsu-jujutsu-kaisen-jjk-gif-13901989739660073482)

**Rerolls usados:** ${profile.rr_prodigio_usados}/2
**Rerolls generales restantes:** ${profile.rr}

Usa \`-rr prodigio\` para intentar de nuevo (máximo 2 veces).`;
  } 
  else if (result.cantidad === 1) {
    mensajeRespuesta = 
`*\`\`Al Nacer, las Maldiciones temblaron al verte alrededor de tú propio hogar, poseías...\`\`*
***Un Tipo de Prodigio.***
[***A Beast...***](https://tenor.com/view/yuta-okkotsu-yuta-okkotsu-jjk-yuta-jjk-gif-11187786945653568048)

**¡Felicitaciones!** Ahora usa \`-tipo_prodigio\` para elegir tu especialización.

**Rerolls usados:** ${profile.rr_prodigio_usados}/2`;
  } 
  else {
    mensajeRespuesta = 
`*\`\`Al Nacer, las Maldiciones fueron ahuyentadas de tú hogar por el temor qué sentían... Tenías un talento innato para la Hechicería, poseías...\`\`*
__***¿¡¡DOS***__ ***Tipos de Prodigio!!?***
[***An Unmatched Beast...***](https://tenor.com/view/yuta-gif-25166706)

**¡INCREÍBLE!** Sos uno de los elegidos. Usa \`-tipo_prodigio\` **DOS VECES** para elegir tus especializaciones.

**Rerolls usados:** ${profile.rr_prodigio_usados}/2`;
  }
  
  return message.reply(mensajeRespuesta);
}

// Comando -tipo_prodigio
if (command === 'tipo_prodigio') {
  if (profile.cantidad_prodigios === null) {
    return message.reply('Primero usa `-prodigio` para ver cuántos tipos podés obtener.');
  }
  
  if (profile.cantidad_prodigios === 0) {
    return message.reply('No obtuviste ningún tipo de prodigio. Lo siento. 😔');
  }
  
  if (!profile.tipos_prodigio) profile.tipos_prodigio = [];
  
  if (profile.tipos_prodigio.length >= profile.cantidad_prodigios) {
    return message.reply(`Ya elegiste tus ${profile.cantidad_prodigios} tipo(s) de prodigio: **${profile.tipos_prodigio.join(', ')}**`);
  }
  
  // Tipos de prodigio con probabilidades
  const tiposProdigio = [
    { 
      nombre: "Prodigio Físico", 
      emoji: "🦖",
      prob: 0.20,
      desc: "Aquellos que no necesitan ni siquiera aprender a luchar, los prodigios físicos son personas que nacen con un cuerpo perfecto qué manipula en sí mismo todo el combate cercano, sean ya el uso de armas blancas para apenas sujetar un cuchillo usarlo como si fuese un maestro del arma, si van con sus manos un prodigio físico va a demolerte y es que por si mismo un prodigio físico nace qué por un cuerpo hecho para incluso instintivamente combatir en cualquier medio físico."
    },
    { 
      nombre: "Prodigio Energético", 
      emoji: "🐊",
      prob: 0.20,
      desc: "Un Prodigio Energético es una persona que a nivel de la hechicería es capaz de exponer una cantidad de energía maldita base increíble la cual proyectaba una potencia increíble al no tener que temer por quedarse sin energía maldita pues su producción, su cantidad y su salida es simplemente inmensa."
    },
    { 
      nombre: "Prodigio en Dominios", 
      emoji: "🦎",
      prob: 0.20,
      desc: "La expansión de dominio se conoce como el pinaculo de la hechicería como la última enseñanza a dominar para un hechicero pero para un prodigio en expansiones directamente estos manejan un control en aquellas expansiones para a partir del primer grado poder controlar un dominio de manera inmediata. Las expansiones del dominio poseen las habilidades para exponer sobre todo lo que están dentro de ella un golpe seguro más sin embargo un prodigio en expansiones puede manipular su barrera para desarrollar algo como lo es una expansión con una barrera abierta, osea, que un prodigio de dominios es un maldito moustro."
    },
    { 
      nombre: "Prodigio en Técnicas", 
      emoji: "🐢",
      prob: 0.20,
      desc: "Los prodigios en técnicas son aquellos capaces de encontrar al capacidad del dominio de una técnica cuanto antes pudiendo diseccionar tecnicas enemigas en el instante que las visualizan pues así como un pródigio físico son capaces de dominar cualquier estilo de combate cercano como ninguna otra persona, estos prodigios son capaces de dominar en su terreno qué es el técnico, desde la teoría crear su propio sistema combativo en contra cualquier situación a raíz del dominio de su técnica maldita."
    },
    { 
      nombre: "Prodigio Total", 
      emoji: "🪲",
      prob: 0.10,
      desc: "Un Prodigio Total es practicamente el pródigio base y quien presenta el mejor talento y esto se debe a que un hechicero prodigio posee una excelente cantidad de energía maldita como un excelente manejo técnico lo cual amplifica su crecimiento personal hasta establecerlo como uno abiertamente increíble pues un prodigio no es más que un Genio en la hechicería."
    },
    { 
      nombre: "Prodigio Inverso", 
      emoji: "🐍",
      prob: 0.10,
      desc: "Los prodigios del ritual Inverso son personas que fueron asociados de manera directa a la energía positiva pudiendo manipularla de manera inicial sobre ellos mismos. Esto se debe a que un prodigio Inverso carece de afinidad base con la energía maldita normal más sin embargo controla la positiva lo cual les permite directamente iniciar con el conjuro Inverso pero no poder manipular correctamente la energía maldita."
    }
  ];
  
  // Filtrar los que ya tiene
  const disponibles = tiposProdigio.filter(t => !profile.tipos_prodigio.includes(t.nombre));
  
  if (disponibles.length === 0) {
    return message.reply('Ya obtuviste todos los tipos disponibles.');
  }
  
  const result = weightedRandom(disponibles);
  profile.tipos_prodigio.push(result.nombre);

  // ✅ APLICAR BUFFOS INMEDIATAMENTE AL OBTENER EL TIPO
  aplicarBuffosProdigio(profile, result.nombre);
  
  saveDB();
  
  const response = 
`˖# ═══════ __⭒⊹𐔌ꉂ ⃝__\`${result.emoji}\`__⭒一緒૮ ˶︶${result.nombre}︶˶ ___
︶. ⏝. ︶ ୨\`${result.emoji}\`୧ ︶. ⏝. ︶
一緒 \`${result.emoji}\`『Descripción』
* 一緒 『¿Qué es?』
︶⏝︶୨\`${result.emoji}\`୧︶⏝︶
︶⏝︶୨\`${result.emoji}\`୧︶⏝︶
一緒 \`${result.emoji}\`『${result.desc}』

**Progreso:** ${profile.tipos_prodigio.length}/${profile.cantidad_prodigios} tipos obtenidos${profile.tipos_prodigio.length < profile.cantidad_prodigios ? '\n\nUsa `-tipo_prodigio` de nuevo para obtener el siguiente.' : '\n\n✅ **¡Completado!** Ya tenés todos tus tipos de prodigio.'}`;
  
  return message.reply(response);
}
if (command === 'fama' || command === 'fame') {
  const targetMember = message.mentions.members.first() || message.member;
  const targetProfile = getProfile(targetMember.id);
  
  if (!targetProfile.fama_nivel) targetProfile.fama_nivel = 0;
  if (!targetProfile.fama_xp) targetProfile.fama_xp = 0;
  if (!targetProfile.fama_xp_total) targetProfile.fama_xp_total = 0;
  
  const nivelActual = targetProfile.fama_nivel;
  const xpActual = targetProfile.fama_xp;
  const xpRequerida = getXpRequeridaFama(nivelActual);
  const nombreNivel = getNombreNivelFama(nivelActual);
  const colorNivel = getColorNivelFama(nivelActual);
  
  const porcentaje = Math.floor((xpActual / xpRequerida) * 100);
  const barraLlena = Math.floor(porcentaje / 10);
  const barraVacia = 10 - barraLlena;
  const barra = '█'.repeat(barraLlena) + '░'.repeat(barraVacia);
  
  const todosLosJugadores = Object.keys(db.users).map(userId => ({
    userId,
    nivel: db.users[userId].fama_nivel || 0,
    xp_total: db.users[userId].fama_xp_total || 0
  }));
  
  todosLosJugadores.sort((a, b) => {
    if (b.nivel !== a.nivel) return b.nivel - a.nivel;
    return b.xp_total - a.xp_total;
  });
  
  const posicion = todosLosJugadores.findIndex(p => p.userId === targetMember.id) + 1;
  
  const embed = new EmbedBuilder()
    .setTitle(`🌟 ═══ NIVEL DE FAMA ═══ 🌟`)
    .setColor(colorNivel)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `**${targetMember.displayName}**\n\n` +
      `**Nivel:** ${nivelActual}\n` +
      `**Categoría:** ${nombreNivel}\n` +
      `**Ranking:** #${posicion} de ${todosLosJugadores.length}\n\n` +
      `**Progreso al siguiente nivel:**\n` +
      `[${barra}] ${porcentaje}%\n` +
      `${xpActual.toLocaleString()} / ${xpRequerida.toLocaleString()} XP\n\n` +
      `**XP Total Acumulada:** ${targetProfile.fama_xp_total.toLocaleString()} XP\n\n` +
      `⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail(targetMember.user.displayAvatarURL())
    .setFooter({ text: 'Cursed Era II • Sistema de Fama' })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}
if (command === 'crear_roles' || command === 'crear_colores') {
  try {
    console.log('✅ Comando crear_roles/crear_colores iniciado');
    
    if (!message.member.permissions.has("ManageRoles")) {
      console.log('❌ Usuario sin permisos:', message.author.tag);
      return message.reply("❌ No tienes permiso para usar este comando (se requiere Manage Roles).");
    }

    console.log('✅ Permisos verificados');

    const rolesNotificaciones = [
      "🎉 Eventos",
      "🤝 Alianzas",
      "📣 Anuncios",
      "👀 Sneak Peeks",
      "😂 Fuera de Contexto",
      "🎁 Sorteos",
      "🆕 Actualizaciones",
      "💬 Revivir Chat",
      "💀 Muertes"
    ];

    let creados = 0;
    let omitidos = 0;
    let errores = [];

    console.log(`📋 Intentando crear ${rolesNotificaciones.length} roles...`);
    
    const msgProgreso = await message.reply('⏳ Creando roles de notificaciones...');

    for (const nombre of rolesNotificaciones) {
      try {
        const existe = message.guild.roles.cache.find(r => r.name === nombre);

        if (!existe) {
          await message.guild.roles.create({
            name: nombre,
            mentionable: true,
            reason: "Creación automática de roles de notificaciones"
          });
          creados++;
          console.log(`✅ Rol creado: ${nombre}`);
        } else {
          omitidos++;
          console.log(`⚠️ Rol ya existe: ${nombre}`);
        }
      } catch (error) {
        errores.push(nombre);
        console.error(`❌ Error creando rol "${nombre}":`, error.message);
      }
    }

    let respuesta = `▂▃▅▇█ ROLES DE NOTIFICACIONES █▇▅▃▂\n\n` +
      `✅ Roles creados: **${creados}**\n` +
      `⚠️ Ya existentes: **${omitidos}**\n`;
    
    if (errores.length > 0) {
      respuesta += `❌ Errores: **${errores.length}**\n` +
        `Roles con error: ${errores.join(', ')}\n\n`;
    }
    
    respuesta += `\n📊 Total: ${rolesNotificaciones.length} roles`;

    await msgProgreso.edit(respuesta);
    console.log('✅ Comando crear_roles completado');
    return;
    
  } catch (error) {
    console.error('❌ Error crítico en comando crear_roles:', error);
    return message.reply(`❌ Error al crear roles: ${error.message}\n\nVerifica que el bot tenga:\n• Permiso "Manage Roles"\n• Su rol por encima de los roles a crear`);
  }
}
if (command === 'maestria') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ ACCESO DENEGADO ❌              ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ Solo administradores.`
    );
  }

  if (args.length < 2) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   📝 USO DEL COMANDO 📝              ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `**Sintaxis:**\n` +
      `\`-maestria @usuario <cantidad>\`\n\n` +
      `**Ejemplos:**\n` +
      `\`-maestria @Gabi 50\` → Agrega 50%\n` +
      `\`-maestria @Gabi -20\` → Quita 20%`
    );
  }

  const target = message.mentions.users.first();
  if (!target) {
    return message.reply('⚠️ Menciona un usuario válido.');
  }

  const profile = getProfile(target.id);
  const cantidad = parseInt(args[1]);
  
  if (isNaN(cantidad)) {
    return message.reply('⚠️ La cantidad debe ser un número.');
  }

  const maestriaAntes = profile.maestria || 0;
  profile.maestria = Math.max(0, Math.min(200, maestriaAntes + cantidad));
  
  const nuevoTier = actualizarTierPorMaestria(profile);
  saveDB();

  const embed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   ⚡ MAESTRÍA ACTUALIZADA ⚡         ║\n╚════════════════════════════════════════╝')
    .setColor(0x00FF00)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `**Usuario:** ${target.tag}\n\n` +
      `\`\`\`diff\n` +
      `${cantidad >= 0 ? '+' : ''}${cantidad}% de maestría\n` +
      `\n` +
      `- Antes: ${maestriaAntes}%\n` +
      `+ Ahora: ${profile.maestria}%\n` +
      `\`\`\`\n\n` +
      `${nuevoTier ? `🎉 **¡TIER SUBIÓ!** RCT → **Tier ${nuevoTier}**\n\n` : ''}` +
      `**Técnicas desbloqueadas:**\n` +
      `${profile.maestria >= 10 ? '✅' : '🔒'} Cuarto Grado (10%)\n` +
      `${profile.maestria >= 30 ? '✅' : '🔒'} Tercer Grado (30%)\n` +
      `${profile.maestria >= 50 ? '✅' : '🔒'} Segundo Grado (50%)\n` +
      `${profile.maestria >= 70 ? '✅' : '🔒'} Primer Grado (70%)\n` +
      `${profile.maestria >= 90 ? '✅' : '🔒'} Semi-Especial (90%)\n` +
      `${profile.maestria >= 125 ? '✅' : '🔒'} Grado Especial (125%)\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setImage('https://cdn.discordapp.com/attachments/1469433821182296218/1472672995578220767/descarga.jpg')
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: '⚡ Cursed Era II • Sistema de Maestría' })
    .setTimestamp();

  await message.channel.send({ embeds: [embed] });
  return;
}
if (command === 'banner') {
  const userProfile = getProfile(message.author.id);

  // Verificar si hay imagen adjunta
  if (message.attachments.size === 0) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   🖼️ BANNER PERSONALIZADO 🖼️         ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `**📋 Uso:** \`-banner\` + adjunta una imagen\n\n` +
      `**🎨 Características:**\n` +
      `• Aparecerá en la parte inferior de tu perfil\n` +
      `• Solo imágenes (JPG, PNG, GIF, WEBP)\n` +
      `• Se mostrará en formato grande/banner\n\n` +
      `**💡 Ejemplos:**\n` +
      `• Escena favorita de anime/manga\n` +
      `• Arte de tu personaje\n` +
      `• Wallpaper épico\n` +
      `• Banner de clan/equipo\n\n` +
      `**❌ Para quitar tu banner:**\n` +
      `\`-banner quitar\` o \`-banner remove\`\n\n` +
      `${userProfile.banner ? `**Tu banner actual:**\n${userProfile.banner}` : '**Estado:** Sin banner establecido'}`
    );
  }

  // Verificar si quiere quitar el banner
  if (args[0] === 'quitar' || args[0] === 'remove' || args[0] === 'eliminar') {
    const teniaBanner = userProfile.banner ? true : false;
    userProfile.banner = null;
    saveDB();
    
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   🗑️ BANNER ELIMINADO 🗑️             ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `${teniaBanner ? '✅ Tu banner ha sido eliminado exitosamente.' : '⚠️ No tenías ningún banner establecido.'}\n\n` +
      `Usa \`-perfil\` para verificar.`
    );
  }

  // Obtener la imagen adjunta
  const attachment = message.attachments.first();
  
  // Verificar que sea una imagen
  if (!attachment.contentType?.startsWith('image/')) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   ❌ ARCHIVO NO VÁLIDO ❌            ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `⚠️ Solo se permiten imágenes como banner.\n\n` +
      `**Formatos aceptados:**\n` +
      `• JPG/JPEG\n` +
      `• PNG\n` +
      `• GIF (animado)\n` +
      `• WEBP\n\n` +
      `**Archivo enviado:** ${attachment.contentType || 'Desconocido'}`
    );
  }

  // Guardar el banner
  const bannerUrl = attachment.url;
  userProfile.banner = bannerUrl;
  saveDB();

  // Crear embed de confirmación con preview del banner
  const confirmEmbed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   🎨 BANNER ACTUALIZADO 🎨          ║\n╚════════════════════════════════════════╝')
    .setColor(0x00FF00)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `✅ **¡Tu banner ha sido establecido exitosamente!**\n\n` +
      `**📋 Información:**\n` +
      `• Aparecerá al final de tu perfil\n` +
      `• Visible para todos los usuarios\n` +
      `• Formato: ${attachment.contentType}\n` +
      `• Tamaño: ${(attachment.size / 1024).toFixed(2)} KB\n\n` +
      `**💡 Vista previa abajo:**\n` +
      `Usa \`-perfil\` para verlo en tu perfil completo.\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setImage(bannerUrl)
    .setThumbnail(message.author.displayAvatarURL())
    .setFooter({ text: '🎨 Cursed Era II • Banner Personalizado' })
    .setTimestamp();

  return message.reply({ embeds: [confirmEmbed] });
}
// ═══════════════════════════════════════════════════════════
// COMANDO -CLIMA (Sistema de Clima y Hora del Día)
// ═══════════════════════════════════════════════════════════

if (command === 'clima' || command === 'weather') {
  // 🌤️ CLIMAS CON TUS GIFS Y MENSAJES MEJORADOS
  const climas = [
    {
      nombre: "☀️ ¡Soleado!",
      descripcion: "El pronóstico indica que hoy será un día **soleado y despejado**. Las temperaturas estarán entre **15-20°C**, así que no te abrigues demasiado o terminarás con un golpe de calor. ¡Perfecto para misiones al aire libre!",
      emoji: "☀️",
      color: 0xFFD700,
      gif: "https://tenor.com/view/ngan-pham-kitten-anime-sleeping-gif-17403032",
      efectos: ["☀️ +10% yenes por trabajar al aire libre", "🌡️ Perfecto para entrenar"],
      prob: 0.35
    },
    {
      nombre: "🌤️ ¡Templado!",
      descripcion: "El pronóstico declara que hoy será un día **templado y agradable**. Las temperaturas rondarán entre **15-17°C**. Clima ideal para cualquier actividad sin preocuparte por el calor o el frío.",
      emoji: "🌤️",
      color: 0x87CEEB,
      gif: "https://tenor.com/view/anime-movies-scenery-mixed-gif-10237887888012078936",
      efectos: ["🌤️ Clima perfecto para todo", "😌 Sin efectos especiales"],
      prob: 0.35
    },
    {
      nombre: "☁️ ¡Nublado!",
      descripcion: "El pronóstico declara que hoy será un día **nublado con posibilidad de lluvia**. Las temperaturas bajarán a **10-13°C**. No olvides llevar un paraguas por si acaso.",
      emoji: "☁️",
      color: 0x708090,
      gif: "https://tenor.com/view/gloomy-weather-anime-clouds-nature-gif-16860171",
      efectos: ["☁️ Ambiente melancólico", "🌧️ 50% probabilidad de lluvia"],
      prob: 0.30
    }
  ];

  // 🕐 HORAS DEL DÍA CON TUS GIFS Y MENSAJES MEJORADOS
  const horas = [
    {
      nombre: "🌅 ¡Es la Mañana!",
      descripcion: "**¡Despierten!** El profesor Yaga no perdona tardanzas. Si llegas tarde, prepárate para correr 50 vueltas al campo de entrenamiento.",
      emoji: "🌅",
      color: 0xFFD700,
      gif: "https://tenor.com/view/momo-momo-ayase-dandadan-waving-bye-bye-gif-4589154781699700947",
      efectos: ["🌅 Energía renovada", "💼 +15% yenes por trabajar"],
      prob: 0.20
    },
    {
      nombre: "☀️ ¡Es Media Tarde!",
      descripcion: "**Los estudiantes empiezan a retirarse...** Cuidado con lo que haces, no queremos que el profesor Yaga se entere de travesuras.",
      emoji: "☀️",
      color: 0xFFA500,
      gif: "https://tenor.com/view/bang-dream-bandori-anime-its-mygo-mygo-gif-10574064392514226410",
      efectos: ["☀️ Momento de descanso", "📚 +10% efectividad en estudio"],
      prob: 0.20
    },
    {
      nombre: "🌆 ¡Es la Tarde!",
      descripción: "**Los del turno tarde entran a la escuela de hechicería.** No toca clase con Yaga, sino con el viejo rockero. Más relajado, pero igual exigente.",
      emoji: "🌆",
      color: 0xFF8C00,
      gif: "https://tenor.com/view/hairi-takahara-summer-pockets-summer-pockets-gif-8959780484311892130",
      efectos: ["🌆 Ambiente tranquilo", "🎸 +5% creatividad"],
      prob: 0.20
    },
    {
      nombre: "🌃 ¡Es la Noche!",
      descripcion: "**Duerman, mal paridos.** Ya casi son las 12 de la noche. Si Yaga los encuentra despiertos sin razón, tendrán entrenamiento doble mañana.",
      emoji: "🌃",
      color: 0x191970,
      gif: "https://tenor.com/view/night-time-anime-stars-gif-12723220",
      efectos: ["🌃 Maldiciones más activas", "👻 +20% encuentros con espíritus"],
      prob: 0.20
    },
    {
      nombre: "🌙 ¡Es la Media Noche!",
      descripcion: "**Váyanse del colegio, los del turno tarde.** Duerman si quieren. Aunque algunos prefieren quedarse practicando en secreto...",
      emoji: "🌙",
      color: 0x000080,
      gif: "https://tenor.com/view/night-sky-stars-sparkles-sky-night-gif-21103462",
      efectos: ["🌙 Hora del silencio", "⭐ +50% poder en rituales nocturnos", "😴 -20% efectividad por cansancio"],
      prob: 0.20
    }
  ];

  // 🌧️ PROBABILIDAD DE LLUVIA (Neko Choose)
  const opcionesLluvia = [
    { tipo: "Lluvia", emoji: "🌧️", texto: "**Está lloviendo moderadamente.** Mejor lleva un paraguas si piensas salir.", prob: 3 },
    { tipo: "No llueve", emoji: "☀️", texto: "**No hay lluvia.** El día está seco y despejado.", prob: 2 },
    { tipo: "Tormenta", emoji: "⛈️", texto: "**¡HAY TORMENTA ELÉCTRICA!** Rayos y truenos por todas partes. Mejor quédate dentro.", prob: 1 }
  ];

  // 🌫️ PROBABILIDAD DE NIEBLA (Neko Choose)
  const opcionesNiebla = [
    { tipo: "Nebuloso", emoji: "🌫️", texto: "**Hay niebla densa cubriendo el área.** La visibilidad está reducida significativamente.", prob: 1 },
    { tipo: "No", emoji: "✨", texto: null, prob: 4 }
  ];

  // 🎲 FUNCIÓN PARA NEKO CHOOSE
  function nekoChoose(opciones) {
    const todas = [];
    opciones.forEach(opcion => {
      for (let i = 0; i < opcion.prob; i++) {
        todas.push(opcion);
      }
    });
    return todas[Math.floor(Math.random() * todas.length)];
  }

  // 🎯 SELECCIÓN ALEATORIA
  const climaElegido = weightedRandom(climas);
  const horaElegida = weightedRandom(horas);
  const lluviaElegida = nekoChoose(opcionesLluvia);
  const nieblaElegida = nekoChoose(opcionesNiebla);

  // 📅 FECHA Y HORA REAL
  const fecha = new Date();
  const opciones = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Argentina/Buenos_Aires'
  };
  const fechaFormateada = fecha.toLocaleDateString('es-ES', opciones);

  // 🎨 CREAR EMBED VISUAL
  const embed = new EmbedBuilder()
    .setTitle(`${climaElegido.emoji} PRONÓSTICO DEL CLIMA ${climaElegido.emoji}`)
    .setColor(climaElegido.color)
    .setDescription(
      `⊹・・──────────・・✦・・────────・・⊹\n\n` +
      `📅 **${fechaFormateada}**\n\n` +
      `## ***\`Y el pronóstico del clima es...\`***\n` +
      `## [**\`${climaElegido.nombre}\`**](${climaElegido.gif})\n\n` +
      `${climaElegido.descripcion}\n\n` +
      `**Efectos del clima:**\n` +
      climaElegido.efectos.map(e => `• ${e}`).join('\n') +
      `\n\n⊹・・──────────・・✦・・────────・・⊹`
    )
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
    .setFooter({ text: 'Cursed Era II • Pronóstico actualizado' })
    .setTimestamp();

  // Agregar condición de lluvia
  if (lluviaElegida.texto) {
    embed.addFields({
      name: `${lluviaElegida.emoji} Condición de Lluvia`,
      value: lluviaElegida.texto,
      inline: false
    });
  }

  // Agregar condición de niebla
  if (nieblaElegida.texto) {
    embed.addFields({
      name: `${nieblaElegida.emoji} Condición de Niebla`,
      value: nieblaElegida.texto,
      inline: false
    });
  }

  // Agregar hora del día
  embed.addFields({
    name: `${horaElegida.emoji} Hora del Día`,
    value: 
      `# *\`Y la hora es...\`*\n` +
      `## [**\`${horaElegida.nombre}\`**](${horaElegida.gif})\n\n` +
      `${horaElegida.descripcion}\n\n` +
      `**Efectos:**\n` +
      horaElegida.efectos.map(e => `• ${e}`).join('\n'),
    inline: false
  });

  return message.channel.send({ embeds: [embed] });
}

// ════════════════════════════════════════════════════════════════
// 📋 COMANDO ALTERNATIVO: -clima_simple (Formato original)
// ════════════════════════════════════════════════════════════════
// Por si prefieres el formato de texto simple sin embeds

if (command === 'clima_simple' || command === 'clima_original') {
  // 🌤️ CLIMAS
  const climas = [
    {
      nombre: "¡Soleado!",
      descripcion: "El pronóstico indica que hoy será un día **soleado y despejado**. Las temperaturas estarán entre **15-20°C**, así que no te abrigues demasiado o terminarás con un golpe de calor. ¡Perfecto para misiones al aire libre!",
      gif: "https://tenor.com/view/ngan-pham-kitten-anime-sleeping-gif-17403032",
      prob: 0.35
    },
    {
      nombre: "¡Templado!",
      descripcion: "El pronóstico declara que hoy será un día **templado y agradable**. Las temperaturas rondarán entre **15-17°C**. Clima ideal para cualquier actividad sin preocuparte por el calor o el frío.",
      gif: "https://tenor.com/view/anime-movies-scenery-mixed-gif-10237887888012078936",
      prob: 0.35
    },
    {
      nombre: "¡Nublado!",
      descripcion: "El pronóstico declara que hoy será un día **nublado con posibilidad de lluvia**. Las temperaturas bajarán a **10-13°C**. No olvides llevar un paraguas por si acaso.",
      gif: "https://tenor.com/view/gloomy-weather-anime-clouds-nature-gif-16860171",
      prob: 0.30
    }
  ];

  // 🕐 HORAS
  const horas = [
    {
      nombre: "¡Es la Mañana!",
      descripcion: "**¡Despierten!** El profesor Yaga no perdona tardanzas. Si llegas tarde, prepárate para correr 50 vueltas al campo de entrenamiento.",
      gif: "https://tenor.com/view/momo-momo-ayase-dandadan-waving-bye-bye-gif-4589154781699700947",
      prob: 0.20
    },
    {
      nombre: "¡Es Media Tarde!",
      descripcion: "**Los estudiantes empiezan a retirarse...** Cuidado con lo que haces, no queremos que el profesor Yaga se entere de travesuras.",
      gif: "https://tenor.com/view/bang-dream-bandori-anime-its-mygo-mygo-gif-10574064392514226410",
      prob: 0.20
    },
    {
      nombre: "¡Es la Tarde!",
      descripcion: "**Los del turno tarde entran a la escuela de hechicería.** No toca clase con Yaga, sino con el viejo rockero. Más relajado, pero igual exigente.",
      gif: "https://tenor.com/view/hairi-takahara-summer-pockets-summer-pockets-gif-8959780484311892130",
      prob: 0.20
    },
    {
      nombre: "¡Es la Noche!",
      descripcion: "**Duerman, mal paridos.** Ya casi son las 12 de la noche. Si Yaga los encuentra despiertos sin razón, tendrán entrenamiento doble mañana.",
      gif: "https://tenor.com/view/night-time-anime-stars-gif-12723220",
      prob: 0.20
    },
    {
      nombre: "¡Es la Media Noche!",
      descripcion: "**Váyanse del colegio, los del turno tarde.** Duerman si quieren. Aunque algunos prefieren quedarse practicando en secreto...",
      gif: "https://tenor.com/view/night-sky-stars-sparkles-sky-night-gif-21103462",
      prob: 0.20
    }
  ];

  // 🌧️ LLUVIA (Neko Choose)
  const opcionesLluvia = ["Lluvia", "Lluvia", "Lluvia", "No llueve", "No llueve", "Tormenta"];
  const lluviaElegida = opcionesLluvia[Math.floor(Math.random() * opcionesLluvia.length)];

  // 🌫️ NIEBLA (Neko Choose)
  const opcionesNiebla = ["Nebuloso", "No", "No", "No", "No"];
  const nieblaElegida = opcionesNiebla[Math.floor(Math.random() * opcionesNiebla.length)];

  // Selección
  const climaElegido = weightedRandom(climas);
  const horaElegida = weightedRandom(horas);

  // Construir mensaje
  let mensaje = `# ***\`Y el pronóstico del clima es...\`***\n`;
  mensaje += `## [*\`${climaElegido.nombre}\`**](${climaElegido.gif})\n`;
  mensaje += `* *${climaElegido.descripcion}*\n\n`;

  // Lluvia
  if (lluviaElegida === "Lluvia") {
    mensaje += `🌧️ **Está lloviendo moderadamente.** Mejor lleva un paraguas.\n\n`;
  } else if (lluviaElegida === "Tormenta") {
    mensaje += `⛈️ **¡HAY TORMENTA ELÉCTRICA!** Rayos y truenos. Mejor quédate dentro.\n\n`;
  } else {
    mensaje += `☀️ **No hay lluvia.** El día está seco.\n\n`;
  }

  // Niebla
  if (nieblaElegida === "Nebuloso") {
    mensaje += `🌫️ **Hay niebla densa.** Visibilidad reducida.\n\n`;
  }

  mensaje += `# *\`Y la hora es...\`**\n`;
  mensaje += `## [**\`${horaElegida.nombre}\`***](${horaElegida.gif})\n`;
  mensaje += `* *${horaElegida.descripcion}*\n`;

  return message.channel.send(mensaje);
}
if (command === 'exp_fama' || command === 'xp_fama') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo los administradores pueden usar este comando.');
  }
  
  const targetMember = message.mentions.members.first();
  const cantidad = parseInt(args[1]);
  const razon = args.slice(2).join(' ') || 'Otorgado por staff';
  
  if (!targetMember) {
    return message.reply('❌ Debes mencionar a un usuario.\nUso: `-exp_fama @usuario [cantidad] [razón]`');
  }
  
  if (!cantidad || isNaN(cantidad) || cantidad <= 0) {
    return message.reply('❌ La cantidad debe ser un número positivo.\nUso: `-exp_fama @usuario [cantidad] [razón]`');
  }
  
  const resultado = agregarXpFama(targetMember.id, cantidad, razon);
  
  if (resultado.subiDeNivel) {
    const embed = new EmbedBuilder()
      .setTitle('🎉 ¡SUBIDA DE NIVEL DE FAMA! 🎉')
      .setColor(0xFFD700)
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `**${targetMember.displayName}** ha recibido **+${cantidad.toLocaleString()} XP de Fama**\n\n` +
        `**Razón:** ${razon}\n\n` +
        `🎊 **¡SUBIÓ ${resultado.nivelesSubidos} NIVEL(ES)!** 🎊\n` +
        `**Nuevo nivel:** ${resultado.nivelActual}\n` +
        `**Categoría:** ${resultado.nombreNivel}\n\n` +
        `**Progreso:** ${resultado.xpActual.toLocaleString()} / ${resultado.xpRequerida.toLocaleString()} XP\n\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setThumbnail(targetMember.user.displayAvatarURL())
      .setFooter({ text: 'Cursed Era II • Sistema de Fama' })
      .setTimestamp();
    
    return message.channel.send({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('✨ XP de Fama Otorgada')
      .setColor(0x00CED1)
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `**${targetMember.displayName}** ha recibido **+${cantidad.toLocaleString()} XP de Fama**\n\n` +
        `**Razón:** ${razon}\n\n` +
        `**Nivel actual:** ${resultado.nivelActual}\n` +
        `**Progreso:** ${resultado.xpActual.toLocaleString()} / ${resultado.xpRequerida.toLocaleString()} XP\n\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setFooter({ text: 'Cursed Era II • Sistema de Fama' })
      .setTimestamp();
    
    return message.channel.send({ embeds: [embed] });
  }
}
if (command === 'top_fama' || command === 'ranking_fama') {
  const todosLosJugadores = Object.keys(db.users).map(userId => ({
    userId,
    nivel: db.users[userId].fama_nivel || 0,
    xp_total: db.users[userId].fama_xp_total || 0
  }));
  
  todosLosJugadores.sort((a, b) => {
    if (b.nivel !== a.nivel) return b.nivel - a.nivel;
    return b.xp_total - a.xp_total;
  });
  
  const top10 = todosLosJugadores.slice(0, 10);
  
  let descripcion = `⊹・・──────────・・✦・・────────・・⊹\n\n`;
  
  for (let i = 0; i < top10.length; i++) {
    const jugador = top10[i];
    const member = await message.guild.members.fetch(jugador.userId).catch(() => null);
    const nombre = member ? member.displayName : 'Usuario Desconocido';
    const nombreNivel = getNombreNivelFama(jugador.nivel);
    
    let emoji = '';
    if (i === 0) emoji = '🥇';
    else if (i === 1) emoji = '🥈';
    else if (i === 2) emoji = '🥉';
    else emoji = `**${i + 1}.**`;
    
    descripcion += `${emoji} **${nombre}**\n`;
    descripcion += `   └ Nivel ${jugador.nivel} • ${nombreNivel}\n`;
    descripcion += `   └ ${jugador.xp_total.toLocaleString()} XP Total\n\n`;
  }
  
  descripcion += `⊹・・──────────・・✦・・────────・・⊹`;
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 ═══ TOP 10 FAMA ═══ 🏆')
    .setColor(0xFFD700)
    .setDescription(descripcion)
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
    .setFooter({ text: `Cursed Era II • Top de ${todosLosJugadores.length} jugadores` })
    .setTimestamp();
  
  return message.channel.send({ embeds: [embed] });
}
// ═══════════════════════════════════════════════════════════
// SISTEMA DE APUESTAS
// ═══════════════════════════════════════════════════════════

if (command === 'apostar') {
  if (args.length < 2) {
    return message.reply(
      'Uso: `-apostar <cantidad> <juego>`\n\n' +
      '**Juegos disponibles:**\n' +
      '• `coinflip <cara|cruz>` - Cara o cruz\n' +
      '• `dados` - Tira 2 dados\n' +
      '• `blackjack <hit|stand>` - Blackjack\n\n' +
      'Ejemplo: `-apostar 1000 coinflip cara`\n' +
      'Ejemplo: `-apostar 5000 blackjack hit`'
    );
  }
  
  const cantidad = parseInt(args[0]);
  const juego = args[1].toLowerCase();
  const opcion = args[2]?.toLowerCase();
  
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('La cantidad debe ser un número positivo.');
  }
  
  const limiteApuesta = 100000;
  if (cantidad > limiteApuesta) {
    return message.reply(`La apuesta máxima es **¥${limiteApuesta.toLocaleString()}**.`);
  }
  
  if ((profile.yen || 0) < cantidad) {
    return message.reply(`No tenés suficientes yenes. Tenés **¥${(profile.yen || 0).toLocaleString()}**.`);
  }
  
  // ✅ COINFLIP CON CHAT
  if (juego === 'coinflip' || juego === 'moneda') {
    if (!opcion || (opcion !== 'cara' && opcion !== 'cruz')) {
      return message.reply('Uso: `-apostar <cantidad> coinflip <cara|cruz>`\nEjemplo: `-apostar 1000 coinflip cara`');
    }
    
    const eleccion = opcion;
    const resultado = Math.random() < 0.5 ? 'cara' : 'cruz';
    
    const resultEmbed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ COINFLIP 🪙 █▇▅▃▂');
    
    if (eleccion === resultado) {
      const ganancia = cantidad;
      profile.yen += ganancia;
      
      if (!profile.historial_yenes) profile.historial_yenes = [];
      profile.historial_yenes.push({
        fecha: Date.now(),
        tipo: 'apuesta_coinflip_ganada',
        cantidad: ganancia
      });
      
      saveDB();
      
      resultEmbed
        .setDescription(
          `⊹・・──────────・・✦・・────────・・⊹\n\n` +
          `🎉 **¡GANASTE!**\n\n` +
          `**Tu elección:** ${eleccion === 'cara' ? '🟡 Cara' : '⚪ Cruz'}\n` +
          `**Resultado:** ${resultado === 'cara' ? '🟡 Cara' : '⚪ Cruz'}\n\n` +
          `**Ganancia:** +¥${ganancia.toLocaleString()}\n` +
          `**Nuevo saldo:** ¥${profile.yen.toLocaleString()}\n\n` +
          `⊹・・──────────・・✦・・────────・・⊹`
        )
        .setColor(0x00FF00)
        .setFooter({ text: 'Cursed Era II • Sistema de Apuestas' });
    } else {
      profile.yen -= cantidad;
      
      if (!profile.historial_yenes) profile.historial_yenes = [];
      profile.historial_yenes.push({
        fecha: Date.now(),
        tipo: 'apuesta_coinflip_perdida',
        cantidad: -cantidad
      });
      
      saveDB();
      
      resultEmbed
        .setDescription(
          `⊹・・──────────・・✦・・────────・・⊹\n\n` +
          `❌ **PERDISTE.**\n\n` +
          `**Tu elección:** ${eleccion === 'cara' ? '🟡 Cara' : '⚪ Cruz'}\n` +
          `**Resultado:** ${resultado === 'cara' ? '🟡 Cara' : '⚪ Cruz'}\n\n` +
          `**Pérdida:** -¥${cantidad.toLocaleString()}\n` +
          `**Nuevo saldo:** ¥${profile.yen.toLocaleString()}\n\n` +
          `⊹・・──────────・・✦・・────────・・⊹`
        )
        .setColor(0xFF0000)
        .setFooter({ text: 'Cursed Era II • Sistema de Apuestas' });
    }
    
    return message.reply({ embeds: [resultEmbed] });
  }
  
  // ✅ DADOS
  if (juego === 'dados') {
    const dado1 = Math.floor(Math.random() * 6) + 1;
    const dado2 = Math.floor(Math.random() * 6) + 1;
    const suma = dado1 + dado2;
    
    let multiplicador = 0;
    let mensaje = '';
    
    if (suma === 2 || suma === 12) {
      multiplicador = 5;
      mensaje = '🎰 **JACKPOT!** x5';
    } else if (suma === 7) {
      multiplicador = 2;
      mensaje = '🎲 **Lucky Seven!** x2';
    } else if (suma >= 10) {
      multiplicador = 1.5;
      mensaje = '✨ **¡Buena tirada!** x1.5';
    } else {
      multiplicador = 0;
      mensaje = '❌ **Mala suerte...**';
    }
    
    const ganancia = Math.floor(cantidad * multiplicador) - cantidad;
    profile.yen += ganancia;
    
    if (!profile.historial_yenes) profile.historial_yenes = [];
    profile.historial_yenes.push({
      fecha: Date.now(),
      tipo: ganancia >= 0 ? 'apuesta_dados_ganada' : 'apuesta_dados_perdida',
      cantidad: ganancia
    });
    
    saveDB();
    
    const embed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ DADOS 🎲 █▇▅▃▂')
      .setDescription(
        `⊹・・──────────・・✦・・────────・・⊹\n\n` +
        `🎲 **Dado 1:** ${dado1}\n` +
        `🎲 **Dado 2:** ${dado2}\n` +
        `**Suma:** ${suma}\n\n` +
        `${mensaje}\n\n` +
        `**Apuesta:** ¥${cantidad.toLocaleString()}\n` +
        `**Resultado:** ${ganancia >= 0 ? '+' : ''}¥${ganancia.toLocaleString()}\n` +
        `**Saldo:** ¥${profile.yen.toLocaleString()}\n\n` +
        `⊹・・──────────・・✦・・────────・・⊹`
      )
      .setColor(ganancia >= 0 ? 0x00FF00 : 0xFF0000)
      .setFooter({ text: 'Cursed Era II • Sistema de Apuestas' });
    
    return message.channel.send({ embeds: [embed] });
  }
  
  if (juego === 'blackjack' || juego === 'bj') {
    // Verificar si ya hay una partida activa
    if (partidasBlackjack.has(message.author.id)) {
      return message.reply('❌ Ya tienes una partida de Blackjack activa. Termínala primero escribiendo `hit` o `stand`.');
    }
    
    if (cantidad < 100) {
      return message.reply('❌ La apuesta mínima para Blackjack es **100 yenes**.');
    }
    
    // Descontar apuesta
    profile.yen -= cantidad;
    
    // Crear la baraja y repartir cartas
    const baraja = crearBaraja();
    const manoJugador = [baraja.pop(), baraja.pop()];
    const manoDealer = [baraja.pop(), baraja.pop()];
    
    const valorJugador = calcularMano(manoJugador);
    const valorDealer = calcularMano(manoDealer);
    
    // Verificar Blackjack natural
    if (valorJugador === 21) {
      const ganancia = Math.floor(cantidad * 2.5);
      profile.yen += ganancia;
      
      if (!profile.historial_yenes) profile.historial_yenes = [];
      profile.historial_yenes.push({
        fecha: Date.now(),
        tipo: 'blackjack_natural',
        cantidad: ganancia - cantidad
      });
      
      saveDB();
      
      const embedWin = new EmbedBuilder()
        .setTitle('🃏 ═══ BLACKJACK NATURAL ═══ 🃏')
        .setColor(0xFFD700)
        .setDescription(
          '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
          '**¡BLACKJACK! 🎰**\n\n' +
          `**Tus cartas:**\n${mostrarCartas(manoJugador)}\n**Valor:** ${valorJugador}\n\n` +
          `**Dealer:**\n${mostrarCartas(manoDealer)}\n**Valor:** ${valorDealer}\n\n` +
          `💰 **Apuesta:** ¥${cantidad.toLocaleString()}\n` +
          `💰 **Has ganado:** +¥${(ganancia - cantidad).toLocaleString()} (1.5x)\n` +
          `💎 **Nuevo balance:** ¥${profile.yen.toLocaleString()}\n\n` +
          '⊹・・──────────・・✦・・──────────・・⊹'
        )
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
        .setFooter({ text: 'Cursed Era II • Blackjack' })
        .setTimestamp();
      
      return message.reply({ embeds: [embedWin] });
    }
    
    saveDB();
    
    // Mostrar estado inicial
    const embedInicio = new EmbedBuilder()
      .setTitle('🃏 ═══════ BLACKJACK ═══════ 🃏')
      .setColor(0x00CED1)
      .setDescription(
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        `**💰 Apuesta:** ¥${cantidad.toLocaleString()}\n\n` +
        `**🎴 Tus cartas:**\n${mostrarCartas(manoJugador)}\n**Valor:** ${valorJugador}\n\n` +
        `**🎴 Dealer:**\n${mostrarCartas(manoDealer, true)}\n**Valor:** ${manoDealer[0].valor === 'A' ? 11 : cardValues[manoDealer[0].valor]} + ???\n\n` +
        '**¿Qué querés hacer?**\n' +
        '`hit` → Pedir otra carta 🎴\n' +
        '`stand` → Plantarse ✋\n\n' +
        '**⏰ Tenés 60 segundos para decidir**\n' +
        '⊹・・──────────・・✦・・──────────・・⊹'
      )
      .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
      .setFooter({ text: 'Cursed Era II • Escribí "hit" o "stand" en el chat' })
      .setTimestamp();
    
    const msgInicial = await message.channel.send({ embeds: [embedInicio] });
    
    // ✅ CREAR COLLECTOR PARA DETECTAR "HIT" O "STAND"
    const filter = m => {
      if (m.author.id !== message.author.id) return false;
      const contenido = m.content.toLowerCase().trim();
      return contenido === 'hit' || contenido === 'h' || contenido === 'stand' || contenido === 's';
    };
    
    const collector = message.channel.createMessageCollector({ 
      filter, 
      time: 60000 // 60 segundos
    });
    
    // Guardar datos de la partida
    const partidaData = {
      baraja,
      manoJugador,
      manoDealer,
      apuesta: cantidad,
      userId: message.author.id,
      collector,
      msgInicial
    };
    
    partidasBlackjack.set(message.author.id, partidaData);
    
    // ✅ CUANDO SE RECIBE UN MENSAJE
    collector.on('collect', async (m) => {
      const accion = m.content.toLowerCase().trim();
      const partida = partidasBlackjack.get(message.author.id);
      
      if (!partida) {
        collector.stop();
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // HIT - PEDIR CARTA
      // ══════════════════════════════════════════════════════════
      if (accion === 'hit' || accion === 'hit') {
        const nuevaCarta = partida.baraja.pop();
        partida.manoJugador.push(nuevaCarta);
        const valorJugador = calcularMano(partida.manoJugador);
        
        // ¿Se pasó de 21?
        if (valorJugador > 21) {
          collector.stop();
          partidasBlackjack.delete(message.author.id);
          
          if (!profile.historial_yenes) profile.historial_yenes = [];
          profile.historial_yenes.push({
            fecha: Date.now(),
            tipo: 'blackjack_perdido',
            cantidad: -partida.apuesta
          });
          
          saveDB();
          
          const embedBust = new EmbedBuilder()
            .setTitle('🃏 ═══ TE PASASTE - BUST ═══ 🃏')
            .setColor(0xFF0000)
            .setDescription(
              '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
              '**💥 ¡TE PASASTE DE 21! 💥**\n\n' +
              `**Tus cartas:**\n${mostrarCartas(partida.manoJugador)}\n**Valor:** ${valorJugador}\n\n` +
              `**Dealer:**\n${mostrarCartas(partida.manoDealer)}\n**Valor:** ${calcularMano(partida.manoDealer)}\n\n` +
              `💸 **Has perdido:** -¥${partida.apuesta.toLocaleString()}\n` +
              `💎 **Nuevo balance:** ¥${profile.yen.toLocaleString()}\n\n` +
              '⊹・・──────────・・✦・・──────────・・⊹'
            )
            .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
            .setFooter({ text: 'Cursed Era II • Mejor suerte la próxima' })
            .setTimestamp();
          
          return m.reply({ embeds: [embedBust] });
        }
        
        // Actualizar embed con la nueva carta
        const embedHit = new EmbedBuilder()
          .setTitle('🃏 ═══════ BLACKJACK ═══════ 🃏')
          .setColor(0x00CED1)
          .setDescription(
            '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
            `**💰 Apuesta:** ¥${partida.apuesta.toLocaleString()}\n\n` +
            `**🎴 Tus cartas:**\n${mostrarCartas(partida.manoJugador)}\n**Valor:** ${valorJugador}\n\n` +
            `**🎴 Dealer:**\n${mostrarCartas(partida.manoDealer, true)}\n**Valor:** ${partida.manoDealer[0].valor === 'A' ? 11 : cardValues[partida.manoDealer[0].valor]} + ???\n\n` +
            '**¿Qué querés hacer?**\n' +
            '`hit` → Pedir otra carta 🎴\n' +
            '`stand` → Plantarse ✋\n\n' +
            '⊹・・──────────・・✦・・──────────・・⊹'
          )
          .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
          .setFooter({ text: 'Cursed Era II • Escribí "hit" o "stand"' })
          .setTimestamp();
        
        await partida.msgInicial.edit({ embeds: [embedHit] });
        return;
      }
      
      // ══════════════════════════════════════════════════════════
      // STAND - PLANTARSE
      // ══════════════════════════════════════════════════════════
      if (accion === 'stand' || accion === 'stand') {
        collector.stop();
        partidasBlackjack.delete(message.author.id);
        
        const valorJugador = calcularMano(partida.manoJugador);
        let valorDealer = calcularMano(partida.manoDealer);
        
        // El dealer juega (debe sacar hasta 17 o más)
        while (valorDealer < 17) {
          const nuevaCarta = partida.baraja.pop();
          partida.manoDealer.push(nuevaCarta);
          valorDealer = calcularMano(partida.manoDealer);
        }
        
        let resultado = '';
        let ganancia = 0;
        let color = 0xFFFFFF;
        let tipoHistorial = '';
        
        if (valorDealer > 21) {
          resultado = '🎉 **¡EL DEALER SE PASÓ! ¡GANASTE!** 🎉';
          ganancia = partida.apuesta * 2;
          color = 0x00FF00;
          tipoHistorial = 'blackjack_ganado';
        } else if (valorJugador > valorDealer) {
          resultado = '🎉 **¡GANASTE!** 🎉';
          ganancia = partida.apuesta * 2;
          color = 0x00FF00;
          tipoHistorial = 'blackjack_ganado';
        } else if (valorJugador === valorDealer) {
          resultado = '🤝 **EMPATE - RECUPERÁS TU APUESTA** 🤝';
          ganancia = partida.apuesta;
          color = 0xFFFF00;
          tipoHistorial = 'blackjack_empate';
        } else {
          resultado = '💀 **EL DEALER GANÓ** 💀';
          ganancia = 0;
          color = 0xFF0000;
          tipoHistorial = 'blackjack_perdido';
        }
        
        profile.yen += ganancia;
        
        if (!profile.historial_yenes) profile.historial_yenes = [];
        profile.historial_yenes.push({
          fecha: Date.now(),
          tipo: tipoHistorial,
          cantidad: ganancia - partida.apuesta
        });
        
        saveDB();
        
        const beneficioNeto = ganancia - partida.apuesta;
        
        const embedFinal = new EmbedBuilder()
          .setTitle('🃏 ═══ RESULTADO FINAL ═══ 🃏')
          .setColor(color)
          .setDescription(
            '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
            `${resultado}\n\n` +
            `**🎴 Tus cartas:**\n${mostrarCartas(partida.manoJugador)}\n**Valor:** ${valorJugador}\n\n` +
            `**🎴 Dealer:**\n${mostrarCartas(partida.manoDealer)}\n**Valor:** ${valorDealer}\n\n` +
            `💰 **Apuesta:** ¥${partida.apuesta.toLocaleString()}\n` +
            `💵 **Resultado:** ${beneficioNeto >= 0 ? '+' : ''}¥${beneficioNeto.toLocaleString()}\n` +
            `💎 **Nuevo balance:** ¥${profile.yen.toLocaleString()}\n\n` +
            '⊹・・──────────・・✦・・──────────・・⊹'
          )
          .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
          .setFooter({ text: 'Cursed Era II • ¡Jugá de nuevo!' })
          .setTimestamp();
        
        return m.reply({ embeds: [embedFinal] });
      }
    });
    
    // ✅ CUANDO SE ACABA EL TIEMPO
    collector.on('end', (collected, reason) => {
      if (reason === 'time') {
        partidasBlackjack.delete(message.author.id);
        
        const embedTimeout = new EmbedBuilder()
          .setTitle('🃏 ═══ TIEMPO AGOTADO ═══ 🃏')
          .setColor(0xFF0000)
          .setDescription(
            '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
            '⏰ **Se acabó el tiempo!**\n\n' +
            'No respondiste a tiempo.\n' +
            `Perdiste tu apuesta de **¥${cantidad.toLocaleString()}**\n\n` +
            '⊹・・──────────・・✦・・──────────・・⊹'
          )
          .setFooter({ text: 'Cursed Era II • Sé más rápido la próxima' })
          .setTimestamp();
        
        message.channel.send({ embeds: [embedTimeout] });
      }
    });
    
    return; // Importante para que no ejecute más código
  }
  
  // Si llegamos acá, juego no reconocido
  return message.reply(
    '❌ Juego no reconocido.\n\n' +
    '**Juegos disponibles:**\n' +
    '• `coinflip <cara|cruz>` - Cara o cruz\n' +
    '• `dados` - Tira 2 dados\n' +
    '• `blackjack` - Juego de cartas\n\n' +
    'Ejemplo: `-apostar 1000 blackjack`'
  );
}
// ═══════════════════════════════════════════════════════════
// MERCADO ENTRE JUGADORES
// ═══════════════════════════════════════════════════════════

// Comando -vender
if (command === 'vender') {
  if (args.length < 2) {
    return message.reply('Uso: `-vender "Nombre del Item" <precio>`\nEjemplo: `-vender "Espada Maldita" 50000`');
  }
  
  const precio = parseInt(args[args.length - 1]);
  if (isNaN(precio) || precio <= 0) {
    return message.reply('El precio debe ser un número positivo.');
  }
  
  const nombreItem = args.slice(0, -1).join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (nombreItem.length === 0) {
    return message.reply('Debes especificar el nombre del item.');
  }
  
  // Verificar que el usuario tenga el item en su inventario
  const objetos = profile.stats.Objetos || "Ninguno";
  if (objetos === "Ninguno" || !objetos.includes(nombreItem)) {
    return message.reply(`No tenés **${nombreItem}** en tu inventario.`);
  }
  
  // Inicializar ventas si no existe
  if (!profile.ventas_activas) profile.ventas_activas = [];
  
  // Verificar si ya está en venta
  if (profile.ventas_activas.some(v => v.item === nombreItem)) {
    return message.reply(`**${nombreItem}** ya está en venta. Cancelá la venta anterior primero con \`-cancelar_venta "${nombreItem}"\``);
  }
  
  // Quitar del inventario
  const listaObjetos = objetos.split(',').map(i => i.trim()).filter(i => i !== nombreItem);
  profile.stats.Objetos = listaObjetos.length > 0 ? listaObjetos.join(', ') : "Ninguno";
  
  // Agregar a ventas activas
  profile.ventas_activas.push({
    item: nombreItem,
    precio: precio,
    fecha: Date.now()
  });
  
  saveDB();
  
  const response = 
`▂▃▅▇█ ITEM EN VENTA 🏪 █▇▅▃▂

📦 **Item:** ${nombreItem}
💰 **Precio:** ¥${precio.toLocaleString()}
👤 **Vendedor:** ${message.author.tag}

Otros pueden comprarlo con:
\`-comprar_jugador @${message.author.tag} "${nombreItem}"\`

**Comisión del servidor:** 5% (¥${Math.floor(precio * 0.05).toLocaleString()})`;
  
  return message.reply(response);
}


// Comando -cancelar_venta
if (command === 'cancelar_venta') {
  if (args.length === 0) {
    return message.reply('Uso: `-cancelar_venta "Nombre del Item"`');
  }
  
  const nombreItem = args.join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (!profile.ventas_activas) profile.ventas_activas = [];
  
  const venta = profile.ventas_activas.find(v => v.item === nombreItem);
  if (!venta) {
    return message.reply(`No tenés **${nombreItem}** en venta.`);
  }
  
  // Devolver al inventario
  const objetos = profile.stats.Objetos || "Ninguno";
  if (objetos === "Ninguno") {
    profile.stats.Objetos = nombreItem;
  } else {
    profile.stats.Objetos += `, ${nombreItem}`;
  }
  
  // Quitar de ventas
  profile.ventas_activas = profile.ventas_activas.filter(v => v.item !== nombreItem);
  saveDB();
  
  return message.reply(`✅ Cancelaste la venta de **${nombreItem}**. El item volvió a tu inventario.`);
}

// Comando -comprar_jugador
if (command === 'comprar_jugador') {
  if (args.length < 2) {
    return message.reply('Uso: `-comprar_jugador @usuario "Nombre del Item"`');
  }
  
  const vendedor = message.mentions.users.first();
  if (!vendedor) return message.reply('Menciona al vendedor.');
  if (vendedor.id === message.author.id) return message.reply('No podés comprarte a vos mismo.');
  
  const vendedorProfile = getProfile(vendedor.id);
  const nombreItem = args.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (!vendedorProfile.ventas_activas) vendedorProfile.ventas_activas = [];
  
  const venta = vendedorProfile.ventas_activas.find(v => v.item === nombreItem);
  if (!venta) {
    return message.reply(`**${vendedor.tag}** no tiene **${nombreItem}** en venta.`);
  }
  
  const precio = venta.precio;
  if ((profile.yen || 0) < precio) {
    return message.reply(`No tenés suficientes yenes. El item cuesta **¥${precio.toLocaleString()}** y tenés **¥${(profile.yen || 0).toLocaleString()}**.`);
  }
  
  // Calcular comisión
  const comision = Math.floor(precio * 0.05);
  const gananciaNeta = precio - comision;
  
  // Realizar transacción
  profile.yen -= precio;
  vendedorProfile.yen = (vendedorProfile.yen || 0) + gananciaNeta;
  
  // Transferir item
  const objetos = profile.stats.Objetos || "Ninguno";
  if (objetos === "Ninguno") {
    profile.stats.Objetos = nombreItem;
  } else {
    profile.stats.Objetos += `, ${nombreItem}`;
  }
  
  // Quitar de ventas del vendedor
  vendedorProfile.ventas_activas = vendedorProfile.ventas_activas.filter(v => v.item !== nombreItem);
  
  // Registrar en historial
  if (!profile.historial_yenes) profile.historial_yenes = [];
  profile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'compra_jugador',
    cantidad: -precio
  });
  
  if (!vendedorProfile.historial_yenes) vendedorProfile.historial_yenes = [];
  vendedorProfile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'venta_jugador',
    cantidad: gananciaNeta
  });
  
  saveDB();
  
  const response = 
`▂▃▅▇█ COMPRA EXITOSA 🛒 █▇▅▃▂

✅ Compraste **${nombreItem}** a **${vendedor.tag}**

**💰 Precio:** ¥${precio.toLocaleString()}
**🏪 Comisión (5%):** ¥${comision.toLocaleString()}

**Tu saldo:** ¥${profile.yen.toLocaleString()}
**Ganancia del vendedor:** ¥${gananciaNeta.toLocaleString()}

¡Disfruta tu nuevo item! 🎉`;
  
  return message.reply(response);
}

// Comando -mercado
if (command === 'mercado') {
  const todasVentas = [];
  
  for (const userId in db.users) {
    const userProfile = db.users[userId];
    if (userProfile.ventas_activas && userProfile.ventas_activas.length > 0) {
      for (const venta of userProfile.ventas_activas) {
        todasVentas.push({
          vendedor: userId,
          item: venta.item,
          precio: venta.precio,
          fecha: venta.fecha
        });
      }
    }
  }
  
  if (todasVentas.length === 0) {
    return message.reply('🏪 El mercado está vacío. Sé el primero en vender algo con `-vender`!');
  }
  
  // Ordenar por fecha (más recientes primero)
  todasVentas.sort((a, b) => b.fecha - a.fecha);
  
  const embed = new EmbedBuilder()
    .setTitle('▂▃▅▇█ MERCADO DE JUGADORES 🏪 █▇▅▃▂')
    .setDescription('⊹・・──────────・・✦・・────────・・⊹\n**Items en venta:**\n')
    .setColor(0xFFD700)
    .setFooter({ text: 'Cursed Era II • Mercado' });
  
  for (let i = 0; i < Math.min(todasVentas.length, 10); i++) {
    const venta = todasVentas[i];
    let vendedorTag = 'Usuario desconocido';
    try {
      const vendedor = await client.users.fetch(venta.vendedor);
      vendedorTag = vendedor.tag;
    } catch {}
    
    embed.addFields({
      name: `📦 ${venta.item}`,
      value: `💰 Precio: ¥${venta.precio.toLocaleString()}\n👤 Vendedor: ${vendedorTag}\n\`-comprar_jugador @${vendedorTag} "${venta.item}"\``,
      inline: false
    });
  }
  
  if (todasVentas.length > 10) {
    embed.setDescription(embed.data.description + `\n_...y ${todasVentas.length - 10} items más_`);
  }
  
  return message.channel.send({ embeds: [embed] });
}
// ═══════════════════════════════════════════════════════════
// SISTEMA DE PRÉSTAMOS
// ═══════════════════════════════════════════════════════════

// Comando -prestar
if (command === 'prestar') {
  if (args.length < 2) {
    return message.reply('Uso: `-prestar @usuario <cantidad>`\nEjemplo: `-prestar @Gabi 10000`');
  }
  
  const prestatario = message.mentions.users.first();
  if (!prestatario) return message.reply('Menciona a un usuario válido.');
  if (prestatario.id === message.author.id) return message.reply('No podés prestarte a vos mismo.');
  if (prestatario.bot) return message.reply('No podés prestar a bots.');
  
  const cantidad = parseInt(args[1]);
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('La cantidad debe ser un número positivo.');
  }
  
  if ((profile.yen || 0) < cantidad) {
    return message.reply(`No tenés suficientes yenes. Tenés **¥${(profile.yen || 0).toLocaleString()}**.`);
  }
  
  const prestatarioProfile = getProfile(prestatario.id);
  
  // Inicializar arrays si no existen
  if (!profile.prestamos_dados) profile.prestamos_dados = [];
  if (!prestatarioProfile.prestamos_recibidos) prestatarioProfile.prestamos_recibidos = [];
  
  // Realizar préstamo
  profile.yen -= cantidad;
  prestatarioProfile.yen = (prestatarioProfile.yen || 0) + cantidad;
  
  // Registrar préstamo
  const prestamo = {
    userId: prestatario.id,
    cantidad: cantidad,
    fecha: Date.now()
  };
  
  profile.prestamos_dados.push(prestamo);
  prestatarioProfile.prestamos_recibidos.push({
    userId: message.author.id,
    cantidad: cantidad,
    fecha: Date.now()
  });
  
  // Registrar en historial
  if (!profile.historial_yenes) profile.historial_yenes = [];
  profile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'prestamo_dado',
    cantidad: -cantidad
  });
  
  if (!prestatarioProfile.historial_yenes) prestatarioProfile.historial_yenes = [];
  prestatarioProfile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'prestamo_recibido',
    cantidad: cantidad
  });
  
  saveDB();
  
  const response = 
`▂▃▅▇█ PRÉSTAMO OTORGADO 💸 █▇▅▃▂

✅ Prestaste **¥${cantidad.toLocaleString()}** a **${prestatario.tag}**

**Tu saldo:** ¥${profile.yen.toLocaleString()}
**Saldo de ${prestatario.tag}:** ¥${prestatarioProfile.yen.toLocaleString()}

Podés recordarle que te pague con:
\`-cobrar @${prestatario.tag}\`

⚠️ **Nota:** Los préstamos son responsabilidad de los jugadores. El bot solo registra la transacción.`;
  
  return message.reply(response);
}

// Comando -cobrar
if (command === 'cobrar') {
  if (args.length === 0) {
    return message.reply('Uso: `-cobrar @usuario`');
  }
  
  const deudor = message.mentions.users.first();
  if (!deudor) return message.reply('Menciona a un usuario válido.');
  
  if (!profile.prestamos_dados) profile.prestamos_dados = [];
  
  const prestamo = profile.prestamos_dados.find(p => p.userId === deudor.id);
  if (!prestamo) {
    return message.reply(`**${deudor.tag}** no te debe yenes.`);
  }
  
  const diasTranscurridos = Math.floor((Date.now() - prestamo.fecha) / (1000 * 60 * 60 * 24));
  
  const response = 
`▂▃▅▇█ RECORDATORIO DE DEUDA 💸 █▇▅▃▂

${deudor}, **${message.author.tag}** te recuerda que le debés:

**💰 Cantidad:** ¥${prestamo.cantidad.toLocaleString()}
**📅 Prestado hace:** ${diasTranscurridos} días

Por favor, devolvé el dinero cuando puedas con:
\`-devolver @${message.author.tag} ${prestamo.cantidad}\``;
  
  return message.reply(response);
}

// Comando -devolver
if (command === 'devolver') {
  if (args.length < 2) {
    return message.reply('Uso: `-devolver @usuario <cantidad>`\nEjemplo: `-devolver @Agus 10000`');
  }
  
  const prestamista = message.mentions.users.first();
  if (!prestamista) return message.reply('Menciona a un usuario válido.');
  
  const cantidad = parseInt(args[1]);
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('La cantidad debe ser un número positivo.');
  }
  
  if ((profile.yen || 0) < cantidad) {
    return message.reply(`No tenés suficientes yenes. Tenés **¥${(profile.yen || 0).toLocaleString()}**.`);
  }
  
  const prestamistaProfile = getProfile(prestamista.id);
  
  if (!profile.prestamos_recibidos) profile.prestamos_recibidos = [];
  
  const prestamo = profile.prestamos_recibidos.find(p => p.userId === prestamista.id);
  if (!prestamo) {
    return message.reply(`No le debés yenes a **${prestamista.tag}**.`);
  }
  
  if (cantidad > prestamo.cantidad) {
    return message.reply(`Solo le debés **¥${prestamo.cantidad.toLocaleString()}** a **${prestamista.tag}**.`);
  }
  
  // Realizar devolución
  profile.yen -= cantidad;
  prestamistaProfile.yen = (prestamistaProfile.yen || 0) + cantidad;
  
  // Actualizar préstamo
  prestamo.cantidad -= cantidad;
  
  // Si pagó todo, eliminar registro
  if (prestamo.cantidad === 0) {
    profile.prestamos_recibidos = profile.prestamos_recibidos.filter(p => p.userId !== prestamista.id);
    prestamistaProfile.prestamos_dados = prestamistaProfile.prestamos_dados.filter(p => p.userId !== message.author.id);
  }
  
  // Registrar en historial
  if (!profile.historial_yenes) profile.historial_yenes = [];
  profile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'devolucion_prestamo',
    cantidad: -cantidad
  });
  
  if (!prestamistaProfile.historial_yenes) prestamistaProfile.historial_yenes = [];
  prestamistaProfile.historial_yenes.push({
    fecha: Date.now(),
    tipo: 'cobro_prestamo',
    cantidad: cantidad
  });
  
  saveDB();
  
  const response = 
`▂▃▅▇█ DEVOLUCIÓN REALIZADA 💰 █▇▅▃▂

✅ Devolviste **¥${cantidad.toLocaleString()}** a **${prestamista.tag}**

**Tu saldo:** ¥${profile.yen.toLocaleString()}
**Deuda restante:** ¥${prestamo.cantidad.toLocaleString()}

${prestamo.cantidad === 0 ? '🎉 ¡Pagaste toda la deuda!' : ''}`;
  
  return message.reply(response);
}
if (command === 'sacarxp' || command === 'quitarxp') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('Solo admins pueden usar este comando.');
  }
  
  if (args.length < 3) {
    return message.reply(
      `╔════════════════════════════════════════╗\n` +
      `║   📝 USO DEL COMANDO 📝              ║\n` +
      `╚════════════════════════════════════════╝\n\n` +
      `**Sintaxis:**\n` +
      `\`-sacarxp @usuario <stat> <cantidad>\`\n\n` +
      `**Stats válidos:**\n` +
      `• fuerza\n` +
      `• velocidad\n` +
      `• resistencia\n\n` +
      `**Ejemplos:**\n` +
      `\`-sacarxp @Gabi fuerza 500\`\n` +
      `\`-sacarxp @Gabi velocidad 200\`\n` +
      `\`-sacarxp @Gabi resistencia 300\``
    );
  }
  
  const target = message.mentions.users.first();
  if (!target) {
    return message.reply('⚠️ Menciona un usuario válido.');
  }
  
  const statInput = args[1].toLowerCase();
  const cantidad = parseInt(args[2]);
  
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('⚠️ La cantidad debe ser un número positivo.');
  }
  
  const validStats = {
    'fuerza': 'fuerza',
    'velocidad': 'velocidad',
    'resistencia': 'resistencia'
  };
  
  const statName = validStats[statInput];
  if (!statName) {
    return message.reply('⚠️ Stat inválido. Usa: fuerza, velocidad o resistencia.');
  }
  
  const profile = getProfile(target.id);
  
  if (!profile.stats[statName]) {
    profile.stats[statName] = { grado: "Sin grado", nivel: 1, sub: "", xp: 0 };
  }
  
  const xpAnterior = profile.stats[statName].xp || 0;
  const nivelAnterior = profile.stats[statName].nivel || 1;
  const gradoAnterior = profile.stats[statName].grado || "Sin grado";
  
  // Quitar XP
  profile.stats[statName].xp = Math.max(0, profile.stats[statName].xp - cantidad);
  
  // Recalcular nivel y grado después de quitar XP
  const xpActual = profile.stats[statName].xp;
  let nuevoNivel = 1;
  let xpAcumulado = 0;
  
  // Calcular nuevo nivel basado en XP restante
  while (xpAcumulado + (nuevoNivel * 100) <= xpActual) {
    xpAcumulado += nuevoNivel * 100;
    nuevoNivel++;
  }
  
  profile.stats[statName].nivel = nuevoNivel;
  
  // Asignar nuevo grado según nivel
  if (nuevoNivel >= 75) profile.stats[statName].grado = "Especial";
  else if (nuevoNivel >= 40) profile.stats[statName].grado = "Semi-Especial";
  else if (nuevoNivel >= 30) profile.stats[statName].grado = "Primer Grado";
  else if (nuevoNivel >= 25) profile.stats[statName].grado = "Segundo Grado";
  else if (nuevoNivel >= 20) profile.stats[statName].grado = "Tercer Grado";
  else if (nuevoNivel >= 10) profile.stats[statName].grado = "Cuarto Grado";
  else profile.stats[statName].grado = "Sin grado";
  
  saveDB();
  
  const embed = new EmbedBuilder()
    .setTitle('╔════════════════════════════════════════╗\n║   ⚠️ XP REMOVIDA ⚠️                  ║\n╚════════════════════════════════════════╝')
    .setColor(0xFF0000)
    .setDescription(
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
      `**Usuario:** ${target.tag}\n` +
      `**Stat:** ${statName.charAt(0).toUpperCase() + statName.slice(1)}\n\n` +
      `**Cambios:**\n` +
      `• XP removida: **-${cantidad.toLocaleString()} XP**\n` +
      `• XP anterior: **${xpAnterior.toLocaleString()} XP**\n` +
      `• XP actual: **${xpActual.toLocaleString()} XP**\n\n` +
      `**Nivel anterior:** ${nivelAnterior}\n` +
      `**Nivel actual:** ${profile.stats[statName].nivel}\n\n` +
      `**Grado anterior:** ${gradoAnterior}\n` +
      `**Grado actual:** ${profile.stats[statName].grado}\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .setThumbnail(target.displayAvatarURL())
    .setFooter({ text: 'Cursed Era II • Comando de Administrador' })
    .setTimestamp();
  
  return message.reply({ embeds: [embed] });
}
// Comando -mis_deudas
if (command === 'mis_deudas' || command === 'deudas') {
  const deudasRecibidas = profile.prestamos_recibidos || [];
  const prestamosOtorgados = profile.prestamos_dados || [];
  
  let textoDeudas = '';
  let textoPrestamos = '';
  
  // Deudas que debe pagar
  if (deudasRecibidas.length === 0) {
    textoDeudas = '_No debés yenes a nadie_';
  } else {
    for (let i = 0; i < deudasRecibidas.length; i++) {
      try {
        const prestamista = await client.users.fetch(deudasRecibidas[i].userId);
        const dias = Math.floor((Date.now() - deudasRecibidas[i].fecha) / (1000 * 60 * 60 * 24));
        textoDeudas += `${i + 1}. ${prestamista.tag}: **¥${deudasRecibidas[i].cantidad.toLocaleString()}** (hace ${dias} días)\n`;
      } catch {
        textoDeudas += `${i + 1}. Usuario desconocido: **¥${deudasRecibidas[i].cantidad.toLocaleString()}**\n`;
      }
    }
  }
  
  // Préstamos que le deben
  if (prestamosOtorgados.length === 0) {
    textoPrestamos = '_Nadie te debe yenes_';
  } else {
    for (let i = 0; i < prestamosOtorgados.length; i++) {
      try {
        const deudor = await client.users.fetch(prestamosOtorgados[i].userId);
        const dias = Math.floor((Date.now() - prestamosOtorgados[i].fecha) / (1000 * 60 * 60 * 24));
        textoPrestamos += `${i + 1}. ${deudor.tag}: **¥${prestamosOtorgados[i].cantidad.toLocaleString()}** (hace ${dias} días)\n`;
      } catch {
        textoPrestamos += `${i + 1}. Usuario desconocido: **¥${prestamosOtorgados[i].cantidad.toLocaleString()}**\n`;
      }
    }
  }
  
  const embed = new EmbedBuilder()
    .setTitle('▂▃▅▇█ ESTADO DE DEUDAS 💸 █▇▅▃▂')
    .setDescription(
      '⊹・・──────────・・✦・・────────・・⊹\n\n' +
      '**💳 TE DEBEN:**\n' + textoPrestamos + '\n\n' +
      '**💸 DEBÉS:**\n' + textoDeudas + '\n\n' +
      '⊹・・──────────・・✦・・────────・・⊹'
    )
    .setColor(0xFF6B6B)
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
    .setFooter({ text: 'Cursed Era II • Sistema de Préstamos' });
  
  return message.channel.send({ embeds: [embed] });
}


  // ═══════════════════════════════════════════════════════════
// SISTEMA DE AMISTADES Y RIVALES
// ═══════════════════════════════════════════════════════════

// Comando -agregar_amigo
if (command === 'agregar_amigo') {
  if (args.length === 0) {
    return message.reply('Uso: `-agregar_amigo @usuario`');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  if (target.id === message.author.id) return message.reply('No podés agregarte a vos mismo como amigo.');
  if (target.bot) return message.reply('No podés agregar bots como amigos.');
  
  const targetProfile = getProfile(target.id);
  
  // Verificar si ya son amigos
  if (profile.amigos && profile.amigos.includes(target.id)) {
    return message.reply(`Ya sos amigo de **${target.tag}**.`);
  }
  
  // Verificar si ya hay solicitud pendiente
  if (targetProfile.solicitudes_amistad && targetProfile.solicitudes_amistad.includes(message.author.id)) {
    return message.reply(`Ya enviaste una solicitud de amistad a **${target.tag}**. ¡Esperá a que la acepte!`);
  }
  
  // Inicializar arrays si no existen
  if (!targetProfile.solicitudes_amistad) targetProfile.solicitudes_amistad = [];
  
  // Agregar solicitud
  targetProfile.solicitudes_amistad.push(message.author.id);
  saveDB();
  
  const response = 
`▂▃▅▇█ SOLICITUD ENVIADA █▇▅▃▂

📩 Enviaste una solicitud de amistad a **${target.tag}**

Esperá a que la acepte con:
\`-aceptar_amigo @${message.author.tag}\`

¡Buena suerte! 👥`;
  
  return message.reply(response);
}

// Comando -aceptar_amigo
if (command === 'aceptar_amigo') {
  if (args.length === 0) {
    return message.reply('Uso: `-aceptar_amigo @usuario`');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  
  // Verificar si hay solicitud pendiente
  if (!profile.solicitudes_amistad || !profile.solicitudes_amistad.includes(target.id)) {
    return message.reply(`**${target.tag}** no te envió una solicitud de amistad.`);
  }
  
  const targetProfile = getProfile(target.id);
  
  // Inicializar arrays si no existen
  if (!profile.amigos) profile.amigos = [];
  if (!targetProfile.amigos) targetProfile.amigos = [];
  
  // Agregar a ambos como amigos
  profile.amigos.push(target.id);
  targetProfile.amigos.push(message.author.id);
  
  // Eliminar solicitud
  profile.solicitudes_amistad = profile.solicitudes_amistad.filter(id => id !== target.id);
  
  saveDB();
  
  const response = 
`▂▃▅▇█ NUEVA AMISTAD █▇▅▃▂

👥 ¡Ahora sos amigo de **${target.tag}**!

**Beneficios:**
- +${profile.amigos.length * 5}% XP cuando hacen misiones juntos
- Aparecen en tu sección "Amigos & Rivales"

¡Que comience la aventura! 🎉`;
  
  return message.reply(response);
}

// Comando -eliminar_amigo
if (command === 'eliminar_amigo') {
  if (args.length === 0) {
    return message.reply('Uso: `-eliminar_amigo @usuario`');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  
  if (!profile.amigos || !profile.amigos.includes(target.id)) {
    return message.reply(`**${target.tag}** no está en tu lista de amigos.`);
  }
  
  const targetProfile = getProfile(target.id);
  
  // Eliminar de ambos
  profile.amigos = profile.amigos.filter(id => id !== target.id);
  if (targetProfile.amigos) {
    targetProfile.amigos = targetProfile.amigos.filter(id => id !== message.author.id);
  }
  
  saveDB();
  
  return message.reply(`❌ Eliminaste a **${target.tag}** de tu lista de amigos.`);
}

// Comando -rival
if (command === 'rival') {
  if (args.length === 0) {
    return message.reply('Uso: `-rival @usuario`');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  if (target.id === message.author.id) return message.reply('No podés ser tu propio rival.');
  if (target.bot) return message.reply('No podés rivalizar con bots.');
  
  // Inicializar array si no existe
  if (!profile.rivales) profile.rivales = [];
  
  // Verificar si ya es rival
  if (profile.rivales.includes(target.id)) {
    return message.reply(`**${target.tag}** ya es tu rival.`);
  }
  
  // Verificar si es amigo
  if (profile.amigos && profile.amigos.includes(target.id)) {
    return message.reply(`No podés declarar rival a un amigo. Primero eliminalo de amigos con \`-eliminar_amigo @${target.tag}\``);
  }
  
  // Agregar rival
  profile.rivales.push(target.id);
  saveDB();
  
  const response = 
`▂▃▅▇█ NUEVA RIVALIDAD ⚔️ █▇▅▃▂

⚡ ¡Declaraste a **${target.tag}** como tu RIVAL!

**Efectos:**
- Los enfrentamientos con esta persona serán más intensos
- Aparece en tu sección "Amigos & Rivales"
- ¿Podrás superarlo? Solo el tiempo lo dirá...

**"La rivalidad es el motor del crecimiento."** 🔥`;
  
  return message.reply(response);
}

// Comando -quitar_rival
if (command === 'quitar_rival') {
  if (args.length === 0) {
    return message.reply('Uso: `-quitar_rival @usuario`');
  }
  
  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido.');
  
  if (!profile.rivales || !profile.rivales.includes(target.id)) {
    return message.reply(`**${target.tag}** no está en tu lista de rivales.`);
  }
  
  // Eliminar rival
  profile.rivales = profile.rivales.filter(id => id !== target.id);
  saveDB();
  
  return message.reply(`❌ Eliminaste a **${target.tag}** de tu lista de rivales.`);
}

  // 2. Comando -estado (agregalo dentro del try del MessageCreate, junto con tus otros comandos)
if (command === "estado") {
  const uptimeMs = Date.now() - botStartTime;

  const segundos = Math.floor(uptimeMs / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  const uptimeStr = 
    `${dias > 0 ? dias + " días " : ""}` +
    `${horas % 24 > 0 ? (horas % 24) + " horas " : ""}` +
    `${minutos % 60 > 0 ? (minutos % 60) + " minutos " : ""}` +
    `${segundos % 60} segundos`;

  const embed = new EmbedBuilder()
    .setTitle('▂▃▅▇█ ESTADO DEL BOT █▇▅▃▂')
    .setColor(0x00FF00)
    .setDescription(
      '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
      '**Estado:** Online 🔥\n' +
      '**Tiempo activo:** ' + uptimeStr + '\n\n' +
      'La maldición sigue viva en el servidor...\n' +
      'Cursed Era II no descansa. Que el caos continúe.\n\n' +
      '⊹・・──────────・・✦・・──────────・・⊹'
    )
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
    .setImage('https://cdn.discordapp.com/attachments/1465647525766631585/1467237897181724673/descarga_5.jpg?ex=697fa746&is=697e55c6&hm=e5dbb9f392b94952661bf2bd7c827010b6f7399556e418c362adc8c7b49ace0e&')
    .setFooter({ text: 'Cursed Era II • Estado actualizado' })
    .setTimestamp();

  return message.channel.send({ embeds: [embed] });
}
if (command === 'ubicacion') {
  const ubicaciones = {
    'tokyo': '📍 Tokyo, Japón',
    'kyoto': '📍 Kyoto, Japón',
    'nigeria': '🌍 Nigeria, África',
    'etiopia': '🌍 Etiopía, África',
    'congo': '🌍 Congo, África',
    'sudafrica': '🌍 Sudáfrica, África',
    'egipto': '🌍 Egipto, África',
    'españa': '🏰 España, Europa',
    'francia': '🏰 Francia, Europa',
    'alemania': '🏰 Alemania, Europa',
    'italia': '🏰 Italia, Europa',
    'reinounido': '🏰 Reino Unido, Europa',
    'rusia': '🏰 Rusia, Europa',
    'argentina': '🌎 Argentina, América',
    'brasil': '🌎 Brasil, América',
    'mexico': '🌎 México, América',
    'colombia': '🌎 Colombia, América',
    'peru': '🌎 Perú, América',
    'estadosunidos': '🌎 Estados Unidos, América',
    'china': '🏯 China, Asia',
    'corea': '🏯 Corea del Sur, Asia',
    'india': '🏯 India, Asia',
    'tailandia': '🏯 Tailandia, Asia',
    'filipinas': '🏯 Filipinas, Asia',
    'malvinas': '🏝️ Islas Malvinas',
  };

  const input = args[0]?.toLowerCase().replace(/\s/g, '');

  if (!input) {
    return message.reply(
      `📍 **Tu ubicación actual:** ${profile.ubicacion || '📍 Tokyo, Japón'}\n\n` +
      `**Ubicaciones disponibles:**\n` +
      `🗾 \`tokyo\` \`kyoto\`\n` +
      `🌍 \`nigeria\` \`etiopia\` \`congo\` \`sudafrica\` \`egipto\`\n` +
      `🏰 \`españa\` \`francia\` \`alemania\` \`italia\` \`reinounido\` \`rusia\`\n` +
      `🌎 \`argentina\` \`brasil\` \`mexico\` \`colombia\` \`peru\` \`estadosunidos\`\n` +
      `🏯 \`china\` \`corea\` \`india\` \`tailandia\` \`filipinas\`\n` +
      `🏝️ \`malvinas\`\n\n` +
      `Usá \`-ubicacion [lugar]\` para moverte.`
    );
  }

  if (!ubicaciones[input]) {
    return message.reply(`❌ Ubicación no válida. Usá \`-ubicacion\` sin argumentos para ver la lista completa.`);
  }

  profile.ubicacion = ubicaciones[input];
  saveDB();

  return message.reply(`✅ Te trasladaste a **${ubicaciones[input]}**`);
}
if (command === 'publicar') {
  const foro_id = '1473582006234251326';
  const canal = await client.channels.fetch(foro_id);

  if (!canal) return message.reply('❌ No se encontró el canal del foro.');

  const tipo = args[0]?.toLowerCase();
  if (!tipo || (tipo !== 'facebook' && tipo !== 'instagram')) {
    return message.reply(
      `❌ Debes especificar la red social.\n` +
      `**Uso:**\n` +
      `\`-publicar facebook nombre / titulo / descripcion / url opcional\`\n` +
      `\`-publicar instagram nombre / descripcion / url opcional\``
    );
  }

  function esURL(texto) {
    try {
      const url = new URL(texto);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  const adjunto = message.attachments.first();
  const urlAdjunta = adjunto ? adjunto.url : null;
  const contenidoOriginal = message.content.slice(message.content.indexOf(args[0]) + args[0].length).trim();

  if (tipo === 'facebook') {
    const partes = contenidoOriginal.split('/').map(p => p.trim());
    if (partes.length < 3) {
      return message.reply(
        `❌ Formato incorrecto.\n` +
        `**Uso:** \`-publicar facebook nombre / titulo / descripcion / url opcional\``
      );
    }

    const nombre = partes[0];
    const titulo = partes[1];
    const descripcion = partes[2] || '\u200b';
    const urlEscrita = partes[3] && esURL(partes[3]) ? partes[3] : null;
    const mediaFinal = urlAdjunta || urlEscrita || null;

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
    const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

    const embed = new EmbedBuilder()
      .setColor(0x1877F2)
      .setAuthor({ name: nombre, iconURL: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' })
      .setTitle(titulo)
      .setDescription(descripcion)
      .setFooter({ text: `📘 Facebook • ${fechaStr} a las ${horaStr}` })
      .setTimestamp();

    // Crear el hilo con solo el embed
    const hilo = await canal.threads.create({
      name: `📘 ${nombre} — ${titulo}`.slice(0, 100),
      message: { embeds: [embed] }
    });

    // Mandar la imagen como mensaje separado adentro del hilo
    if (mediaFinal) {
      await hilo.send(mediaFinal);
    }

    return message.reply(`✅ Publicación subida a Facebook.`);
  }

  if (tipo === 'instagram') {
    const partes = contenidoOriginal.split('/').map(p => p.trim());
    if (partes.length < 2) {
      return message.reply(
        `❌ Formato incorrecto.\n` +
        `**Uso:** \`-publicar instagram nombre / descripcion / url opcional\``
      );
    }

    const nombre = partes[0];
    const descripcion = partes[1] || '\u200b';
    const urlEscrita = partes[2] && esURL(partes[2]) ? partes[2] : null;
    const mediaFinal = urlAdjunta || urlEscrita || null;

    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });

    const embed = new EmbedBuilder()
      .setColor(0xE1306C)
      .setAuthor({ name: nombre, iconURL: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png' })
      .setDescription(descripcion)
      .setFooter({ text: `📸 Instagram • ${fechaStr}` })
      .setTimestamp();

    // Crear el hilo con solo el embed
    const hilo = await canal.threads.create({
      name: `📸 ${nombre}`.slice(0, 100),
      message: { embeds: [embed] }
    });

    // Mandar la imagen como mensaje separado adentro del hilo
    if (mediaFinal) {
      await hilo.send(mediaFinal);
    }

    return message.reply(`✅ Publicación subida a Instagram.`);
  }
}
// Comando -quote (frase + icono opcional)
if (command === 'quote') {
  // ✅ CORRECCIÓN: Cambiar "perfil" por "profile"
  const userProfile = getProfile(message.author.id);

  // Si no hay texto ni imagen adjunta
  if (args.length === 0 && message.attachments.size === 0) {
    return message.reply('Uso: `-quote "tu frase aquí"` o adjunta una imagen.\nEjemplo: `-quote "Nah, I\'d win"`');
  }

  let frase = userProfile.quote || ''; // mantener frase anterior si no cambia
  let iconUrl = userProfile.icon; // mantener icono anterior

  // Cambiar frase si hay texto
  if (args.length > 0) {
    frase = args.join(' ').trim();
    userProfile.quote = frase;
  }

  // Cambiar icono si hay imagen adjunta
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    if (attachment.contentType?.startsWith('image/')) {
      iconUrl = attachment.url;
      userProfile.icon = iconUrl;
    } else {
      return message.reply('Solo se permiten imágenes como icono.');
    }
  }

  saveDB();

  const response = 
`▂▃▅▇█ PERFIL ACTUALIZADO █▇▅▃▂

**Frase nueva:** "${frase || 'Sin frase aún.'}"
**Icono:** ${iconUrl ? '[Imagen actualizada]' : 'Ninguno'}

Aparecerá en tu \`-perfil\`!`;

  return message.reply(response);
}

    // Comando -tienda (muestra la tienda del usuario o página general)
    if (command === 'tienda') {
      if (args.length === 0) {
        // Versión paginada general (sin nombre de tienda)
        const page = parseInt(args[0]) || 1;
        const itemsPerPage = 5;

        const shopItems = [
          { name: "Spins extra (x3)", desc: "Consigues 3 rerolls extra", price: 8000 },
          { name: "Aumenta un grado", desc: "Sube un grado (máx Semi 1)", price: 25000 },
          { name: "Herramienta maldita Custom", desc: "Elige una entre Grado Especial ~ 2do grado", price: 15000 },
          { name: "Herramienta maldita no canon", desc: "Elige una con choose entre S ~ 3 (no canon)", price: 10000 },
          { name: "Herramienta maldita Custom Special Grade", desc: "Asegurada Grado Especial custom", price: 35000 },
          { name: "Herramienta maldita Grado Especial", desc: "Elige una Grado Especial no canon", price: 20000 },
          { name: "Subida de talento", desc: "Aumenta talento (inferior → prodigio, solo 1 vez)", price: 40000 },
          { name: "Ritual custom", desc: "Cupo para ritual custom", price: 18000 },
          { name: "EM especial custom", desc: "Crea tu propia Energía Maldita especial", price: 50000 },
          { name: "Reliquia maldita", desc: "Reliquia antigua + ritual + efecto (5 turnos)", price: 30000 }
        ];

        const totalPages = Math.ceil(shopItems.length / itemsPerPage);
        const start = (page - 1) * itemsPerPage;
        const currentItems = shopItems.slice(start, start + itemsPerPage);

        const embed = new EmbedBuilder()
          .setTitle(`🛒 Tienda - ${message.member.displayName}`)
          .setDescription(`**Saldo: ¥ ${profile.yen || 0}**\n\nElige con -comprar <número>`)
          .setColor(0xFFD700)
          .setFooter({ text: `Página ${page}/${totalPages} • Usa -tienda <página>` });

        currentItems.forEach((item, i) => {
          embed.addFields({ name: `${start + i + 1}. ${item.name} - ¥${item.price.toLocaleString()}`, value: item.desc, inline: false });
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`tienda_prev_${page}`).setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 1),
          new ButtonBuilder().setCustomId(`tienda_next_${page}`).setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page === totalPages)
        );

        message.channel.send({ embeds: [embed], components: [row] });
        return;
      }

      // Versión con nombre de tienda específica
      const tiendaName = args.join(' ');
      if (!profile.tienda || profile.tienda.nombre !== tiendaName) {
        return message.reply(`No se encontró la tienda "${tiendaName}".`);
      }

      const items = profile.tienda.items || [];
      const embed = new EmbedBuilder()
        .setTitle(`🛒 ${tiendaName}`)
        .setDescription(items.length > 0 ? 'Ítems disponibles:' : 'Sin ítems aún.')
        .setColor(0xFFD700);

      items.forEach((item, i) => {
        embed.addFields({ name: `${i + 1}. ${item.objeto}`, value: `¥${item.valor.toLocaleString()}`, inline: false });
      });

      message.channel.send({ embeds: [embed] });
      return;
    }

    if (command === 'buy') {
      if (args.length === 0) {
        return message.reply('Uso: `-buy <número>` (mirá los números con -tienda)`');
      }

      const numero = parseInt(args[0]);
      if (isNaN(numero) || numero < 1 || numero > 10) {
        return message.reply('Número inválido. Usa `-tienda` para ver los objetos disponibles.');
      }

      const shopItems = [
        { name: "Spins extra (x3)", price: 8000 },
        { name: "Aumenta un grado", price: 25000 },
        { name: "Herramienta maldita Custom", price: 15000 },
        { name: "Herramienta maldita no canon", price: 10000 },
        { name: "Herramienta maldita Custom Special Grade", price: 35000 },
        { name: "Herramienta maldita Grado Especial", price: 20000 },
        { name: "Subida de talento", price: 40000 },
        { name: "Ritual custom", price: 18000 },
        { name: "EM especial custom", price: 50000 },
        { name: "Reliquia maldita", price: 30000 }
      ];

      const item = shopItems[numero - 1];
      if (!item) return message.reply('Objeto no encontrado.');

      const costo = item.price;
      const saldoActual = profile.yen || 0;

      if (saldoActual < costo) {
        return message.reply(`No tenés suficiente. Cuesta ¥${costo.toLocaleString()} y tenés ¥${saldoActual.toLocaleString()}`);
      }

      // Descontar yenes ANTES de cualquier cosa
      profile.yen = saldoActual - costo;

      if (numero === 1) {
        profile.rr += 3;
        message.reply(`¡Comprado! **${item.name}** → +3 rerolls agregados.\nTe quedan ¥${profile.yen.toLocaleString()} y ahora tenés **${profile.rr} rerolls**.`);
      } else {
        let objetosActuales = profile.stats.Objetos || "Ninguno";
        if (objetosActuales === "Ninguno") {
          objetosActuales = item.name;
        } else if (!objetosActuales.includes(item.name)) {
          objetosActuales += `, ${item.name}`;
        } else {
          message.reply(`¡Ya tenés **${item.name}** en tu inventario!`);
          profile.yen += costo;
          saveDB();
          return;
        }
        profile.stats.Objetos = objetosActuales;
        message.reply(`¡Comprado! **${item.name}** agregado a tu inventario.\nTe quedan ¥${profile.yen.toLocaleString()}`);
      }

      saveDB();
      return;
    }

    if (command === 'comprar') {
      if (args.length < 2) {
        return message.reply('Uso para negocio: `-comprar "Nombre del Negocio" "Nombre del Objeto"`\nUso para tienda general: `-buy <número>` (mirá los números con -tienda)');
      }

      // Si empieza con número → es compra de tienda general
      if (!isNaN(parseInt(args[0]))) {
        return;
      }

      // Compra en negocio custom
      let negocioName = args[0].replace(/^"|"$/g, '').trim();
      let objetoBuscado = args.slice(1).join(' ').replace(/^"|"$/g, '').trim();

      // Normalizar para comparación SUPER flexible
      const buscadoLimpio = objetoBuscado
        .toLowerCase()
        .replace(/["']/g, '')
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Buscar el negocio (insensible a mayúsculas y espacios extras)
      let negocioEncontrado = null;
      let jefeId = null;

      for (const userId in db.users) {
        const userProfile = db.users[userId];
        const nombreNegocioAlmacenado = userProfile.tienda?.nombre?.trim().toLowerCase();
        if (nombreNegocioAlmacenado === negocioName.toLowerCase()) {
          negocioEncontrado = userProfile.tienda;
          jefeId = userProfile.tienda.jefe;
          break;
        }
      }

      if (!negocioEncontrado) {
        return message.reply(`No se encontró el negocio "${negocioName}". Verificá el nombre exacto con -negocio.`);
      }

      // Buscar el objeto con normalización flexible
      const item = negocioEncontrado.items.find(i => {
        const itemLimpio = i.objeto
          .toLowerCase()
          .replace(/["']/g, '')
          .replace(/[_-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return itemLimpio === buscadoLimpio || itemLimpio.includes(buscadoLimpio);
      });

      if (!item) {
        const listaObjetos = negocioEncontrado.items
          .map(i => i.objeto.trim())
          .join('\n- ') || 'Ninguno';

        return message.reply(
          `El objeto **"${objetoBuscado}"** no está disponible en **"${negocioName}"**.\n\n` +
          `Objetos disponibles:\n- ${listaObjetos}\n\n` +
          `Consejo: copiá y pegá el nombre **exacto** tal como aparece arriba (incluyendo mayúsculas, guiones y underscores).\n` +
          `Ejemplo: -comprar "Hola" "Culo_de_Fuku"`
        );
      }

      // Si llegó acá, encontró el item
      const costo = item.valor;
      const saldoActual = profile.yen || 0;

      if (saldoActual < costo) {
        return message.reply(`No tenés suficiente. Cuesta ¥${costo.toLocaleString()}, tenés ¥${saldoActual.toLocaleString()}`);
      }

      // Descontar yenes
      profile.yen = saldoActual - costo;

      // Agregar al inventario
      let objetosActuales = profile.stats.Objetos || "Ninguno";
      if (objetosActuales === "Ninguno") {
        objetosActuales = item.objeto;
      } else if (!objetosActuales.includes(item.objeto)) {
        objetosActuales += `, ${item.objeto}`;
      }
      profile.stats.Objetos = objetosActuales;

      saveDB();

      message.reply(
        `¡Comprado en **${negocioName}**! **${item.objeto}** agregado a tu inventario.\n` +
        `Pagaste ¥${costo.toLocaleString()}. Te quedan ¥${profile.yen.toLocaleString()}`
      );
      return;
    }

    if (command === 'crear_negocio') {
      if (args.length < 1) return message.reply('Uso: `-crear_negocio "Nombre del Negocio" (opcional @jefe)`');

      const nombreNegocio = args.shift();
      let jefeId = message.author.id;

      const mencionado = message.mentions.users.first();
      if (mencionado) jefeId = mencionado.id;

      const gradoSocial = (profile.grado_social || "").toLowerCase();
      const esValido = gradoSocial.includes('1') || gradoSocial.includes('semi 1') || gradoSocial.includes('especial');

      if (!esValido) return message.reply('Solo Primer Grado, Semi 1 o Especial pueden crear negocios.');

      if ((profile.yen || 0) < 1000000) {
        return message.reply(`Necesitás al menos ¥1.000.000 para crear un negocio. Tenés ¥${(profile.yen || 0).toLocaleString()}`);
      }

      if (profile.tienda) return message.reply('Ya tenés un negocio creado.');

      profile.tienda = {
        nombre: nombreNegocio,
        jefe: jefeId,
        items: []
      };
      saveDB();

      message.reply(`¡Negocio **${nombreNegocio}** creado! Jefe: <@${jefeId}>\nAgregá ítems con: -agregar_item_negocio "${nombreNegocio}" "Objeto" 25000`);
      return;
    }

    if (command === 'agregar_item_negocio') {
      if (args.length < 3) return message.reply('Uso: `-agregar_item_negocio "Nombre Negocio" "Objeto" valor`');

      const negocioName = args.shift();
      const objeto = args.shift();
      const valor = parseFloat(args.join(' ').replace(/[^0-9.-]+/g, ''));

      if (isNaN(valor) || valor <= 0) return message.reply('Valor inválido (debe ser número positivo).');

      if (!profile.tienda || profile.tienda.nombre !== negocioName || profile.tienda.jefe !== message.author.id) {
        return message.reply('No sos jefe de ese negocio o no existe.');
      }

      profile.tienda.items.push({ objeto, valor });
      saveDB();

      message.reply(`Ítem **${objeto}** agregado a **${negocioName}** por ¥${valor.toLocaleString()}.`);
      return;
    }

    if (command === 'negocio') {
      if (args.length < 1) return message.reply('Uso: `-negocio "Nombre del Negocio"`');

      const nombreNegocio = args.join(' ');

      let negocioEncontrado = null;
      let jefeTag = null;

      for (const userId in db.users) {
        const userProfile = db.users[userId];
        if (userProfile.tienda && userProfile.tienda.nombre === nombreNegocio) {
          negocioEncontrado = userProfile.tienda;
          jefeTag = (await client.users.fetch(userId)).tag;
          break;
        }
      }

      if (!negocioEncontrado) return message.reply(`Negocio "${nombreNegocio}" no encontrado.`);

      const items = negocioEncontrado.items || [];

      const embed = new EmbedBuilder()
        .setTitle(`🛒 ${negocioEncontrado.nombre}`)
        .setColor(0x00FF88)
        .setDescription(`**Jefe:** <@${negocioEncontrado.jefe}> (${jefeTag})\n\n**Ítems:**`);

      if (items.length === 0) {
        embed.addFields({ name: "Vacío", value: "Agregá ítems con -agregar_item_negocio" });
      } else {
        items.forEach((item, i) => {
          embed.addFields({ name: `${i+1}. ${item.objeto}`, value: `¥${item.valor.toLocaleString()}`, inline: true });
        });
      }

      message.channel.send({ embeds: [embed] });
      return;
    }

    if (command === 'dar_yenes' || command === 'dar_yen') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-dar_yenes @usuario cantidad`');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const cantidad = parseInt(args[1]);
      if (isNaN(cantidad) || cantidad <= 0) return message.reply('Cantidad inválida.');
      const targetProfile = getProfile(target.id);
      targetProfile.yen = (targetProfile.yen || 0) + cantidad;
      saveDB();
      message.reply(`¡Yenes entregados! Le diste **¥${cantidad.toLocaleString()}** a ${target.tag}.\nAhora tiene **¥${targetProfile.yen.toLocaleString()}**.`);
      return;
    }

    if (command === 'quitar_yenes' || command === 'quitar_yen') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-quitar_yenes @usuario cantidad`');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const cantidad = parseInt(args[1]);
      if (isNaN(cantidad) || cantidad <= 0) return message.reply('Cantidad inválida.');
      const targetProfile = getProfile(target.id);
      if ((targetProfile.yen || 0) < cantidad) return message.reply('No tiene suficientes yenes.');
      targetProfile.yen -= cantidad;
      saveDB();
      message.reply(`Se quitaron **¥${cantidad.toLocaleString()}** a ${target.tag}. Ahora tiene **¥${targetProfile.yen.toLocaleString()}**.`);
      return;
    }

    if (command === 'raza') {
      if (profile.race !== 'Sin tirar') {
        return message.reply('Ya tiraste raza. Usa `-rr raza` para rerollear (gasta 1 rr).');
      }
      const result = weightedRandom(raceProbs);
      profile.race = result.race;
      saveDB();
      const data = raceData[result.race];
      const embed = new EmbedBuilder()
        .setTitle(data.title)
        .setDescription(data.desc)
        .setColor(data.color)
        .setThumbnail("https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
        .setImage(data.image)
        .addFields(
          { name: `${data.emoji} Raza obtenida`, value: `**${result.race}**`, inline: true },
          { name: "🎲 Rerolls restantes", value: profile.rr.toString(), inline: true }
        )
        .setFooter({ text: data.footer })
        .setTimestamp();
      if (result.race === 'Híbrido') {
        embed.setColor(0xFF1493);
      }
      message.channel.send({ embeds: [embed] });
      return;
    }
  
    if (command === 'clan') {
      // ✅ BLOQUEO PARA ESPÍRITUS MALDITOS
      if (profile.race === 'Espíritu Maldito') {
        return message.reply('Los **Espíritus Malditos** no tienen clan. Usa `-sub_razas` en su lugar.');
      }
    
      if (profile.clan !== 'Sin tirar') {
        return message.reply('Ya tiraste clan. Usa `-rr clan` para rerollear (gasta 1 rr).');
      }
      const result = weightedRandom(clanProbs);
      profile.clan = result.clan;
      saveDB();
      const data = clanData[result.clan] || clanData['Normal'];
      message.channel.send(data.message);
      return;
    }

    if (command === 'potencial') {
      if (profile.potencial !== 'Sin tirar') {
        message.reply('Ya tiraste potencial. Usa `-rr potencial` para rerollear (gasta 1 rr).');
        return;
      }
      const result = weightedRandom(potencialProbs);
      profile.potencial = result.potencial;
      saveDB();
      const data = potencialData[result.potencial];
      message.channel.send(data.message);
      return;
    }

    if (command === 'escuela') {
      if (profile.escuela !== 'Sin tirar') {
        return message.reply('Ya tiraste escuela. Usa `-rr escuela` para rerollear (gasta 1 rr).');
      }
      const escuelas = ['Tokyo', 'Kyoto'];
      const result = escuelas[Math.floor(Math.random() * 2)];
      profile.escuela = result;
      saveDB();
      const data = escuelaData[result];
      message.channel.send(data.message);
      return;
    }

    if (command === 'ritual_hereditario') {
      if (profile.ritual_hereditario !== 'Sin tirar') {
        return message.reply('Ya tiraste ritual hereditario. Usa `-rr hereditario` para rerollear (gasta 1 rr).');
      }
      if (profile.clan === 'Sin tirar') {
        return message.reply('Primero tira tu clan con `-clan` antes de intentar el ritual hereditario.');
      }

      const clan = profile.clan;
      const probs = ritualProbsByClan[clan] || [{ ritual: 'Ninguno', prob: 1.0 }];
      const result = weightedRandom(probs);
      profile.ritual_hereditario = result.ritual;

      // Regla especial: SOLO si es Zenin y sale Atadura Física → poner SOLO en Atadura
      if (profile.clan === 'Zenin' && result.ritual === 'Atadura Física') {
        profile.atadura = 'Atadura Física';
      }

      saveDB();

      const ritualData = ritualMessages[result.ritual] || ritualMessages['Ninguno'];
const msg = typeof ritualData === 'object' ? ritualData.message : ritualData;
      message.reply(msg);
      return;
    }
    // ─── COMANDO -ritual (rituales tipo boogie woogie, etc.) ───
    if (command === 'ritual') {
      if (profile.ritual !== 'Sin tirar') {
        return message.reply('Ya tiraste tu ritual. Usa `-rr ritual` para rerollear (gasta 1 rr).');
      }
      const ritualesDisponibles = [
        { ritual: 'Sin Ritual', prob: 0.265 },
        { ritual: 'Boogie Woogie', prob: 0.05 },
        { ritual: 'Milagros', prob: 0.05 },
        { ritual: 'Sugar Manipulation', prob: 0.05 },
        { ritual: 'Hakuna Laana', prob: 0.05 },
        { ritual: 'Love Rendezvous', prob: 0.05 },
        { ritual: 'Pure Love Train', prob: 0.05 },
        { ritual: 'Strawdoll', prob: 0.05 },
        { ritual: 'Ratio', prob: 0.05 },
        { ritual: 'Pain Killer', prob: 0.05 },
        { ritual: 'Solo Forbidden Area', prob: 0.05 },
        { ritual: 'Bestias Protectoras', prob: 0.05 },
        { ritual: 'Inversion', prob: 0.05 },
        { ritual: 'Traslado Espacial', prob: 0.05 },
        { ritual: 'Clonacion', prob: 0.05 },
        { ritual: 'Construccion', prob: 0.045 },
        { ritual: 'Sistema Anti Gravedad', prob: 0.045 },
        { ritual: 'Paralyzing Gaze', prob: 0.045 },
      ];
      const result = weightedRandom(ritualesDisponibles);
      profile.ritual = result.ritual;
      saveDB();
      return message.reply(
        `▂▃▅▇█🧿 Ritual 🧿█▇▅▃▂\n` +
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `> **¡Obtuviste el ritual:** ***${result.ritual}***!\n` +
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `**Rerolls restantes:** ${profile.rr}`
      );
    }
    // ─── COMANDO -ritual_maldicion (solo para raza Espíritu Maldito) ───
    if (command === 'ritual_maldicion') {
      if (profile.race !== 'Espíritu Maldito') {
        return message.reply('❌ Este ritual solo está disponible para la raza **Espíritu Maldito**.');
      }
      if (profile.ritual !== 'Sin tirar') {
        return message.reply('Ya tiraste tu ritual. Usa `-rr ritual` para rerollear (gasta 1 rr).');
      }
      const ritualesMaldicion = [
        { ritual: 'Sin Ritual', prob: 0.35 },
        { ritual: 'Disaster Plants', prob: 0.12 },
        { ritual: 'Fire Disaster', prob: 0.12 },
        { ritual: 'Water Disaster', prob: 0.12 },
        { ritual: 'Manipulacion Energetica', prob: 0.10 },
        { ritual: 'Cuestionario Maldito', prob: 0.10 },
        { ritual: 'Despeje de Camino', prob: 0.05 },
        { ritual: 'Idle Transfiguration', prob: 0.04 },
      ];
      const result = weightedRandom(ritualesMaldicion);
      profile.ritual = result.ritual;
      saveDB();
      return message.reply(
        `▂▃▅▇█💀 Ritual Maldición 💀█▇▅▃▂\n` +
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `> **¡Obtuviste el ritual:** ***${result.ritual}***!\n` +
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `**Rerolls restantes:** ${profile.rr}`
      );
    }
// ─── COMANDO -ritual_especial ───
if (command === 'ritual_especial') {
  if (profile.ritual !== 'Sin tirar') {
    return message.reply('Ya tiraste tu ritual. Usa `-rr ritual_especial` para rerollear (gasta 1 rr).');
  }
  const ritualesEspeciales = [
    { ritual: 'Sin Ritual', prob: 0.34 },
    { ritual: 'Mimicry', prob: 0.11 },
    { ritual: 'Transferencia Cerebral', prob: 0.11 },
    { ritual: 'Sentencia de Muerte', prob: 0.10 },
    { ritual: 'Star Rage', prob: 0.10 },
    { ritual: 'Formacion', prob: 0.10 },
    { ritual: 'Jujutsu Cancellation', prob: 0.08 },
    { ritual: 'Manipulacion de Maldiciones', prob: 0.06 },
  ];
  const result = weightedRandom(ritualesEspeciales);
  profile.ritual = result.ritual;
  saveDB();
  const esSinRitual = result.ritual === 'Sin Ritual';
  return message.reply(
    `▂▃▅▇█${esSinRitual ? '🧿' : '💥'} Ritual Especial ${esSinRitual ? '🧿' : '💥'}█▇▅▃▂\n` +
    `⊹・・──────────・・✦・・──────────・・⊹\n` +
    `> **¡Obtuviste el ritual:** ***${result.ritual}***!\n` +
    `⊹・・──────────・・✦・・──────────・・⊹\n` +
    `**Rerolls restantes:** ${profile.rr}`
  );
}
                // Comando -atadura (spin inicial)
    if (command === 'atadura') {
      if ((profile.rr || 0) <= 0) {
        if ((profile.rr || 0) < 0) {
          return message.reply('❌ No puedes usar rerolls mientras tengas un saldo negativo (castigo activo).');
        }
        return message.reply('❌ No tienes rerolls disponibles.');
      }

      profile.rr -= 1;
      saveDB();

      const ataduraOptions = [
        { 
          name: "Atadura Física", 
          prob: 0.10, // ✅ 10%
          desc: "El usuario nace sin la capacidad de usar energía maldita para técnicas innatas o barreras, pero su cuerpo físico y herramientas son extremadamente poderosos y resistentes (como Toji Fushiguro).",
          gif: "https://tenor.com/view/jujutsu-kaisen-jjk-maki-toji-maki-zenin-gif-9019889003010095568"
        },
        { 
          name: "Atadura de Energía", 
          prob: 0.05, // ✅ 5%
          desc: "Naces con un cuerpo horrible y tan débil que solo ver el sol te podría matar. A cambio tienes una cantidad abismal de energía maldita, permitiéndote controlar puppets y técnicas a distancia con precisión inhumana (como Kokichi Muta / Mechamaru).",
          gif: "https://tenor.com/view/kokichi-kokichi-muta-jjk-season-2-jjks2-shibuya-arc-gif-16724819881471351955"
        },
        { 
          name: "Atadura Gemelar", 
          prob: 0.05, // ✅ 5%
          desc: "Tu vida y energía maldita están vinculadas a un gemelo; si uno muere, el otro también. Esto genera una conexión fatal que limita el potencial individual (como Mai y Maki Zenin).",
          gif: "https://tenor.com/view/mai-mai-zenin-maki-maki-zenin-jujutsu-kaisen-gif-9950668753665162856"
        },
        { 
          name: "Sin Atadura", 
          prob: 0.80, // ✅ 80%
          desc: "No hay restricciones especiales. Puedes usar energía maldita y técnicas sin limitaciones adicionales.",
          gif: "https://tenor.com/view/naoya-zenin-choso-fight-aura-farm-not-in-the-manga-gif-15215466617984430840"
        }
      ];

      const result = weightedRandom(ataduraOptions);
      const oldAtadura = profile.atadura || 'Sin tirar';
      profile.atadura = result.name;

      // Regla especial Zenin
      if (profile.clan === 'Zenin' && result.name === 'Atadura Física') {
        profile.ritual_hereditario = 'N/A';
      } else if (profile.clan === 'Zenin' && oldAtadura === 'Atadura Física') {
        profile.ritual_hereditario = 'Ninguno';
      }

      saveDB();

      const response = 
`▂▃▅▇█👀Atadura👀█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> *${result.name}*
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
> ***\`${result.desc}\`***
:・・──────────・・✦・・────
> ${result.gif}
⊹ 🌸・・────・・✦・・────・・🌸 ⊹

**Rerolls restantes:** ${profile.rr}`;

      return message.reply(response);
    }
    // ✅ FUNCIÓN HELPER PARA DESCONTAR REROLL CORRECTAMENTE
function descontarReroll(profile, cantidad = 1) {
  if (profile.rr < cantidad) {
    return false; // No hay suficientes rerolls
  }
  profile.rr -= cantidad;
  saveDB();
  return true;
}

    if (command === 'rr') {
      if (args.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle('🎲 Sistema de Rerolls - Cursed Era II')
          .setColor(0xFFD700)
          .setDescription(
            `**Tienes actualmente ${profile.rr} rerolls disponibles.**\n\n` +
            'Usá los rerolls para cambiar aspectos de tu build que no te gustaron. ' +
            'Cada reroll **cuesta 1** y **no se recupera**. ¡Usalos con cuidado!\n\n' +
            '**Comandos disponibles para reroll:**\n' +
            '`-rr raza` → Cambiar raza\n' +
            '`-rr energia` → Cambiar energía inicial\n' +
            '`-rr subraza` → Cambiar sub-raza (solo Espíritus)\n' +
            '`-rr clan` → Cambiar clan\n' +
            '`-rr potencial` → Cambiar potencial / talento\n' +
            '`-rr prodigio` → Cambiar cantidad de tipos (máx 2 usos)\n' +
            '`-rr tipo_prodigio` → Rerollear un tipo específico\n' +
            '`-rr escuela` → Cambiar escuela\n' +
            '`-rr ritual` → Cambiar ritual\n' +
            '`-rr ritual_maldicion` → Cambiar ritual (lista maldición)\n' +
            '`-rr ritual_especial` → Cambiar ritual (lista especial)\n' +
            '`-rr hereditario` → Cambiar ritual hereditario (máx 10 usos)\n' +
            '`-rr atadura` → Cambiar atadura\n' +
            '`-rr especial` → Cambiar especial\n\n' +
            '**¡Atención!** Algunos clanes (como Zenin) tienen reglas especiales con Atadura Física.'
          )
          .setFooter({ text: 'Cursed Era II • Rerolls limitados, usalos con cabeza' })
          .setTimestamp();
      
        return message.channel.send({ embeds: [embed] });
      }
    
      let category = args[0].toLowerCase();
      if (category === 'talento') category = 'potencial';
      let fieldName = category;
      if (category === 'hereditario') fieldName = 'ritual_hereditario';
    
      // ✅ LISTA ACTUALIZADA CON TODAS LAS CATEGORÍAS
      const rerollCategories = ['raza', 'clan', 'potencial', 'escuela', 'ritual', 'ritual_maldicion', 'ritual_especial', 'hereditario', 'atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio', 'especial'];
      
      if (!rerollCategories.includes(category)) {
        message.reply(`Categoría inválida. Usa: raza, energia, subraza, clan, potencial, prodigio, tipo_prodigio, escuela, ritual, ritual_maldicion, ritual_especial, hereditario, atadura o especial.`);
        return;
      }
    
      // ✅ CASOS ESPECIALES QUE NO NECESITAN VALIDACIÓN DE "Sin tirar"
      const casosEspeciales = ['atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio', 'especial'];
      
      if ((profile.rr || 0) <= 0) {
        if ((profile.rr || 0) < 0) {
          return message.reply('❌ No puedes usar rerolls mientras tengas un saldo negativo (castigo activo).');
        }
        return message.reply('❌ No tienes rerolls disponibles.');
      }
    
      if (profile[fieldName] === 'Sin tirar' && !casosEspeciales.includes(category)) {
        const comandoSpin = category === 'hereditario' ? 'ritual_hereditario' : category;
        message.reply(`Primero tira **${category === 'hereditario' ? 'ritual hereditario' : category}** con \`-${comandoSpin}\` antes de rerollear.`);
        return;
      }
    
      if (!descontarReroll(profile, 1)) {
        return message.reply('No tienes rerolls disponibles.');
      }
    
      let messageText = `Reroll exitoso de **${category === 'hereditario' ? 'ritual hereditario' : category}**.\nRerolls restantes: **${profile.rr}**\n\n`;
    
      if (category === 'clan') {
        const result = weightedRandom(clanProbs);
        const old = profile.clan;
        profile.clan = result.clan;
        const data = clanData[result.clan] || clanData['Normal'];
        messageText += `Clan anterior: **${old}**\nNuevo clan: **${result.clan}**\n\n${data.message}`;
        saveDB();
        message.channel.send(messageText);
        return;
      } 
      else if (category === 'energia') {
        if (!profile.energia_inicial) {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-energia_inicial` antes de rerollear.');
        }
      
        if (profile.race === 'Espíritu Maldito') {
          profile.rr += 1;
          saveDB();
          return message.reply('Los Espíritus Malditos tienen energía fija (1000). No pueden rerollear energía.');
        }
      
        const energiaProbs = [
          { nivel: "BAJA", em: 4000, prob: 0.30 },
          { nivel: "PROMEDIO", em: 5000, prob: 0.40 },
          { nivel: "ALTA", em: 6000, prob: 0.20 },
          { nivel: "MUY ALTA", em: 7500, prob: 0.08 },
          { nivel: "ABISMAL", em: 9000, prob: 0.02 }
        ];
      
        const result = weightedRandom(energiaProbs);
        const oldEm = profile.stats["Energía Maldita"];
        
        profile.stats["Energía Maldita"] = result.em;
        profile.energia_inicial = result.nivel;
        
        // ✅ RECALCULAR BUFFOS DE PRODIGIOS CON LA NUEVA ENERGÍA
        if (profile.tipos_prodigio && profile.tipos_prodigio.length > 0) {
          profile.tipos_prodigio.forEach(tipo => {
            aplicarBuffosProdigio(profile, tipo);
          });
        }
        
        saveDB();
      
        return message.reply(
          `╔════════════════════════════════════╗\n` +
          `║   ✅ REROLL DE ENERGÍA EXITOSO ✅ ║\n` +
          `╚════════════════════════════════════╝\n\n` +
          `**Energía Anterior:** ${oldEm}\n` +
          `**Nueva Energía:** ${result.em}\n` +
          `**Nivel:** ${result.nivel}\n\n` +
          `Rerolls restantes: **${profile.rr}**\n\n` +
          `Usa \`-stats\` para ver tu build actualizado.`
        );
      }
      else if (category === 'subraza') {
        if (profile.race !== 'Espíritu Maldito' && !profile.sub_raza) {
          profile.rr += 1;
          saveDB();
          return message.reply('Solo los Espíritus Malditos pueden rerollear sub-raza.');
        }
      
        if (!profile.sub_raza) {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-sub_razas` antes de rerollear.');
        }
      
        const subRazaProbs = [
          { nombre: "Maldición Anormal", prob: 0.35, buff: 0.15 },
          { nombre: "Maldición Natural", prob: 0.15, buff: 0.30 },
          { nombre: "Maldición Divina", prob: 0.10, buff: 0.45 },
          { nombre: "Maldición Monstruosa", prob: 0.25, buff: 0.20 },
          { nombre: "Espíritu Vengativo", prob: 0.15, buff: 0.25 }
        ];
      
        const result = weightedRandom(subRazaProbs);
        const oldSubRaza = profile.sub_raza;
        
        const emBase = 1000;
        const emFinal = Math.floor(emBase * (1 + result.buff));
        
        profile.sub_raza = result.nombre;
        profile.stats["Energía Maldita"] = emFinal;
        profile.race = result.nombre;
        saveDB();
      
        return message.reply(
          `**Reroll de Sub-Raza exitoso!**\n\n` +
          `Anterior: ${oldSubRaza}\n` +
          `Nuevo: ${result.nombre} (+${result.buff * 100}% EM)\n` +
          `Energía Maldita: ${emFinal}\n\n` +
          `Rerolls restantes: **${profile.rr}**`
        );
      }
      else if (category === 'especial') {
        if (profile.especial === 'Sin tirar') {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero tira tu especial con `-especial` antes de rerollear.');
        }

        const especialesPool = [
          { nombre: 'Sin Especial', prob: 0.75 },
          { nombre: 'Bendecido por las Chispas Negras', prob: 0.08 },
          { nombre: 'Suerte Infinita', prob: 0.06 },
          { nombre: 'Propiedad Especial Maldita', prob: 0.045 },
          { nombre: 'Percepción del Alma', prob: 0.03 },
          { nombre: 'Recipiente Perfecto', prob: 0.015 },
          { nombre: 'Dominio Dependiente', prob: 0.01 },
          { nombre: 'Maldecido', prob: 0.005 },
          { nombre: 'Black Box', prob: 0.003 },
          { nombre: 'Recipiente Ideal', prob: 0.002 }
        ];
        const oldEspecial = profile.especial;
        const result = weightedRandom(especialesPool);
        profile.especial = result.nombre;
        saveDB();

        return message.reply(
          `╔════════════════════════════════════╗\n` +
          `║  ✅ REROLL DE ESPECIAL EXITOSO ✅  ║\n` +
          `╚════════════════════════════════════╝\n\n` +
          `**Especial anterior:** ${oldEspecial}\n` +
          `**Nuevo especial:** ${result.nombre}\n\n` +
          `Rerolls restantes: **${profile.rr}**`
        );
      }
      else if (category === 'prodigio') {
        if (profile.cantidad_prodigios === null) {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-prodigio` antes de rerollear.');
        }
        
        if (profile.rr_prodigio_usados >= 2) {
          profile.rr += 1;
          saveDB();
          return message.reply('Ya usaste los 2 rerolls permitidos para `-prodigio`.');
        }
        
        profile.rr_prodigio_usados += 1;
        
        const prodigioProbabilidades = [
          { cantidad: 0, prob: 0.60 },
          { cantidad: 1, prob: 0.35 },
          { cantidad: 2, prob: 0.05 }
        ];
        
        const result = weightedRandom(prodigioProbabilidades);
        const oldCantidad = profile.cantidad_prodigios;
        profile.cantidad_prodigios = result.cantidad;
        
        if (result.cantidad !== oldCantidad) {
          profile.tipos_prodigio = [];
        }
        
        saveDB();
        
        let mensajeRespuesta = `**Reroll de Prodigio**\n\nAnterior: **${oldCantidad}** tipo(s)\nNuevo: **${result.cantidad}** tipo(s)\n\n`;
        
        if (result.cantidad === 0) {
          mensajeRespuesta += `Lamentablemente, no obtuviste ningún tipo. 😔\n\n**Rerolls usados:** ${profile.rr_prodigio_usados}/2\n**Rerolls generales restantes:** ${profile.rr}`;
        } else if (result.cantidad === 1) {
          mensajeRespuesta += `¡Obtuviste **1 tipo**! Usa \`-tipo_prodigio\` para elegir.\n\n**Rerolls usados:** ${profile.rr_prodigio_usados}/2\n**Rerolls generales restantes:** ${profile.rr}`;
        } else {
          mensajeRespuesta += `¡**2 TIPOS**! ¡Increíble! Usa \`-tipo_prodigio\` dos veces.\n\n**Rerolls usados:** ${profile.rr_prodigio_usados}/2\n**Rerolls generales restantes:** ${profile.rr}`;
        }
        
        return message.reply(mensajeRespuesta);
      }
      else if (category === 'tipo_prodigio' || category === 'tipoprodigio') {
        if (!profile.tipos_prodigio || profile.tipos_prodigio.length === 0) {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-tipo_prodigio` para obtener al menos un tipo antes de rerollear.');
        }
        
        if (!profile.cantidad_prodigios || profile.cantidad_prodigios === 0) {
          profile.rr += 1;
          saveDB();
          return message.reply('No tenés tipos de prodigio para rerollear.');
        }
        
        const tiposProdigio = [
          { 
            nombre: "Prodigio Físico", 
            emoji: "🦖",
            prob: 0.20,
            desc: "Aquellos que no necesitan ni siquiera aprender a luchar..."
          },
          { 
            nombre: "Prodigio Energético", 
            emoji: "🐊",
            prob: 0.20,
            desc: "Un Prodigio Energético es una persona que a nivel de la hechicería..."
          },
          { 
            nombre: "Prodigio en Dominios", 
            emoji: "🦎",
            prob: 0.20,
            desc: "La expansión de dominio se conoce como el pinaculo..."
          },
          { 
            nombre: "Prodigio en Técnicas", 
            emoji: "🐢",
            prob: 0.20,
            desc: "Los prodigios en técnicas son aquellos capaces..."
          },
          { 
            nombre: "Prodigio Total", 
            emoji: "🪲",
            prob: 0.10,
            desc: "Un Prodigio Total es practicamente el pródigio base..."
          },
          { 
            nombre: "Prodigio Inverso", 
            emoji: "🐍",
            prob: 0.10,
            desc: "Los prodigios del ritual Inverso son personas..."
          }
        ];
        
        const disponibles = tiposProdigio.filter(t => !profile.tipos_prodigio.includes(t.nombre));
        
        if (disponibles.length === 0) {
          profile.rr += 1;
          saveDB();
          return message.reply('Ya tenés todos los tipos de prodigio disponibles. No se puede rerollear.');
        }
        
        if (profile.tipos_prodigio.length > 1) {
          const listaTipos = profile.tipos_prodigio.map((t, i) => `${i + 1}. ${t}`).join('\n');
          
          const embedPregunta = new EmbedBuilder()
            .setTitle('🔄 Reroll de Tipo de Prodigio')
            .setDescription(
              `Tenés ${profile.tipos_prodigio.length} tipos de prodigio:\n\n` +
              `${listaTipos}\n\n` +
              `**¿Cuál querés rerollear?**\n` +
              `Respondé con el número (1, 2, etc.) en el chat.`
            )
            .setColor(0xFFD700);
          
          await message.channel.send({ embeds: [embedPregunta] });
          
          const filter = m => m.author.id === message.author.id && !isNaN(m.content);
          const collector = message.channel.createMessageCollector({ filter, time: 30000, max: 1 });
          
          collector.on('collect', async respuesta => {
            const indice = parseInt(respuesta.content) - 1;
            
            if (indice < 0 || indice >= profile.tipos_prodigio.length) {
              profile.rr += 1;
              saveDB();
              return message.reply('Número inválido. Reroll cancelado y rr devuelto.');
            }
            
            const tipoAntiguo = profile.tipos_prodigio[indice];
            const result = weightedRandom(disponibles);
            
            profile.tipos_prodigio[indice] = result.nombre;
            saveDB();
            
            return message.reply(
              `**Reroll de Tipo de Prodigio exitoso!**\n\n` +
              `Anterior: **${tipoAntiguo}**\n` +
              `Nuevo: **${result.nombre}** ${result.emoji}\n\n` +
              `Rerolls restantes: **${profile.rr}**`
            );
          });
          
          collector.on('end', collected => {
            if (collected.size === 0) {
              profile.rr += 1;
              saveDB();
              message.reply('⏰ Tiempo agotado. Reroll cancelado y rr devuelto.');
            }
          });
          
          return;
        } else {
          const tipoAntiguo = profile.tipos_prodigio[0];
          const result = weightedRandom(disponibles);
          
          profile.tipos_prodigio[0] = result.nombre;
          saveDB();
          
          return message.reply(
            `**Reroll de Tipo de Prodigio exitoso!**\n\n` +
            `Anterior: **${tipoAntiguo}**\n` +
            `Nuevo: **${result.nombre}** ${result.emoji}\n\n` +
            `Rerolls restantes: **${profile.rr}**`
          );
        }
      }
    
      else if (category === 'ritual') {
        if (profile.ritual === 'Sin tirar') {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-ritual` antes de rerollear.');
        }

        const ritualesDisponibles = [
          { ritual: 'Sin Ritual', prob: 0.265 },
          { ritual: 'Boogie Woogie', prob: 0.05 },
          { ritual: 'Milagros', prob: 0.05 },
          { ritual: 'Sugar Manipulation', prob: 0.05 },
          { ritual: 'Hakuna Laana', prob: 0.05 },
          { ritual: 'Love Rendezvous', prob: 0.05 },
          { ritual: 'Pure Love Train', prob: 0.05 },
          { ritual: 'Strawdoll', prob: 0.05 },
          { ritual: 'Ratio', prob: 0.05 },
          { ritual: 'Pain Killer', prob: 0.05 },
          { ritual: 'Solo Forbidden Area', prob: 0.05 },
          { ritual: 'Bestias Protectoras', prob: 0.05 },
          { ritual: 'Inversion', prob: 0.05 },
          { ritual: 'Traslado Espacial', prob: 0.05 },
          { ritual: 'Clonacion', prob: 0.05 },
          { ritual: 'Construccion', prob: 0.045 },
          { ritual: 'Sistema Anti Gravedad', prob: 0.045 },
          { ritual: 'Paralyzing Gaze', prob: 0.045 },
        ];

        const oldRitual = profile.ritual;
        const result = weightedRandom(ritualesDisponibles);
        profile.ritual = result.ritual;
        saveDB();

        messageText += `Ritual anterior: **${oldRitual}**\nNuevo ritual: **${result.ritual}**`;
        message.channel.send(messageText);
        return;
      }
      else if (category === 'ritual_maldicion') {
        if (profile.race !== 'Espíritu Maldito') {
          profile.rr += 1;
          saveDB();
          return message.reply('❌ Este rr solo está disponible para **Espíritu Maldito**. No se gastó rr.');
        }
        if (profile.ritual === 'Sin tirar') {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-ritual_maldicion` antes de rerollear.');
        }

        const ritualesMaldicion = [
          { ritual: 'Sin Ritual', prob: 0.35 },
          { ritual: 'Disaster Plants', prob: 0.12 },
          { ritual: 'Fire Disaster', prob: 0.12 },
          { ritual: 'Water Disaster', prob: 0.12 },
          { ritual: 'Manipulacion Energetica', prob: 0.10 },
          { ritual: 'Cuestionario Maldito', prob: 0.10 },
          { ritual: 'Despeje de Camino', prob: 0.05 },
          { ritual: 'Idle Transfiguration', prob: 0.04 },
        ];

        const oldRitual = profile.ritual;
        const result = weightedRandom(ritualesMaldicion);
        profile.ritual = result.ritual;
        saveDB();

        messageText += `Ritual anterior: **${oldRitual}**\nNuevo ritual: **${result.ritual}**`;
        message.channel.send(messageText);
        return;
      }
      else if (category === 'ritual_especial') {
        if (profile.ritual === 'Sin tirar') {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-ritual_especial` antes de rerollear.');
        }

        const ritualesEspeciales = [
          { ritual: 'Mimicry', prob: 0.16 },
          { ritual: 'Transferencia Cerebral', prob: 0.16 },
          { ritual: 'Sentencia de Muerte', prob: 0.14 },
          { ritual: 'Star Rage', prob: 0.14 },
          { ritual: 'Formacion', prob: 0.14 },
          { ritual: 'Jujutsu Cancellation', prob: 0.14 },
          { ritual: 'Manipulacion de Maldiciones', prob: 0.12 },
        ];

        const oldRitual = profile.ritual;
        const result = weightedRandom(ritualesEspeciales);
        profile.ritual = result.ritual;
        saveDB();

        messageText += `Ritual anterior: **${oldRitual}**\nNuevo ritual: **${result.ritual}**`;
        message.channel.send(messageText);
        return;
      }
      else if (category === 'hereditario') {
        // Contador de rr hereditario usados
        if (!profile.rr_hereditario_count) {
          profile.rr_hereditario_count = 0;
        }
      
        if (profile.rr_hereditario_count >= 10) {
          profile.rr += 1; // Devolver el rr
          saveDB();
          return message.reply('❌ Has alcanzado el límite de 10 rerolls en ritual hereditario.');
        }
      
        const clan = profile.clan;
        const probs = ritualProbsByClan[clan] || [{ ritual: 'Ninguno', prob: 1.0 }];
      
        if (probs.length === 1 && probs[0].ritual === 'Ninguno') {
          profile.rr += 1;
          saveDB();
          message.reply('Tu clan no permite ritual hereditario. No se gastó rr.');
          return;
        }
      
        const result = weightedRandom(probs);
        const oldRitual = profile.ritual_hereditario || 'Ninguno';
        const ritualObtenido = result.ritual;
      
        if (clan === 'Zenin' && ritualObtenido === 'Atadura Física') {
          profile.ritual_hereditario = 'N/A';
          profile.atadura = 'Atadura Física';
        } else {
          profile.ritual_hereditario = ritualObtenido;
          if (profile.atadura === 'Atadura Física' && oldRitual === 'Atadura Física') {
            profile.atadura = 'Ninguna';
          }
        }
      
        profile.rr_hereditario_count += 1;
        saveDB();
      
        const ritualData = ritualMessages[ritualObtenido] || ritualMessages['Ninguno'];
        const msg = typeof ritualData === 'object' ? ritualData.message : ritualData;
        messageText += `Hereditario anterior: **${oldRitual}**\nNuevo hereditario: **${profile.ritual_hereditario}**\n\nRerolls hereditario usados: **${profile.rr_hereditario_count}/10**\n\n${msg}`;
        message.channel.send(messageText);
        return;
      }
      else if (category === 'raza') {
        const result = weightedRandom(raceProbs);
        const old = profile.race;
        profile.race = result.race;
        const data = raceData[result.race];
        const embed = new EmbedBuilder()
          .setTitle(data.title)
          .setDescription(data.desc + `\n\nRaza anterior: **${old}**`)
          .setColor(data.color)
          .setThumbnail("https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
          .setImage(data.image)
          .addFields({ name: `${data.emoji} Nueva raza`, value: `**${result.race}**`, inline: true })
          .setFooter({ text: data.footer + ` | Rerolls restantes: ${profile.rr}` })
          .setTimestamp();
        if (result.race === 'Híbrido') embed.setColor(0xFF1493);
        saveDB();
        message.channel.send({ embeds: [embed] });
        return;
      } 
      else if (category === 'potencial') {
        const result = weightedRandom(potencialProbs);
        const old = profile.potencial;
        profile.potencial = result.potencial;
        const data = potencialData[result.potencial];
        messageText += `Potencial anterior: **${old}**\nNuevo potencial: **${result.potencial}**\n\n${data.message}`;
        saveDB();
        message.channel.send(messageText);
        return;
      } 
      else if (category === 'escuela') {
        const escuelas = ['Tokyo', 'Kyoto'];
        const old = profile.escuela;
        const result = escuelas[Math.floor(Math.random() * 2)];
        profile.escuela = result;
        const data = escuelaData[result];
        messageText += `Escuela anterior: **${old}**\nNueva escuela: **${result}**\n\n${data.message}`;
        saveDB();
        message.channel.send(messageText);
        return;
      } 
      else if (category === 'atadura') {
        if ((profile.rr || 0) <= 0) {
          if ((profile.rr || 0) < 0) {
            return message.reply('❌ No puedes usar rerolls mientras tengas un saldo negativo (castigo activo).');
          }
          return message.reply('❌ No tienes rerolls disponibles.');
        }
      
        if (!profile.atadura || profile.atadura === 'Sin tirar') {
          profile.rr += 1;
          saveDB();
          return message.reply('Primero usa `-atadura` para obtener una Atadura antes de rerollear.');
        }
      
        // Reemplazar las probabilidades en el comando -atadura

const ataduraOptions = [
  { 
    name: "Atadura Física", 
    prob: 0.10, // ✅ Cambió de 0.25 a 0.10 (10%)
    desc: "El usuario nace sin la capacidad de usar energía maldita para técnicas innatas o barreras, pero su cuerpo físico y herramientas son extremadamente poderosos y resistentes (como Toji Fushiguro).",
    gif: "https://tenor.com/view/jujutsu-kaisen-jjk-maki-toji-maki-zenin-gif-9019889003010095568"
  },
  { 
    name: "Atadura de Energía", 
    prob: 0.05, // ✅ Cambió de 0.25 a 0.05 (5%)
    desc: "Naces con un cuerpo horrible y tan débil que solo ver el sol te podría matar. A cambio tienes una cantidad abismal de energía maldita.",
    gif: "https://tenor.com/view/kokichi-kokichi-muta-jjk-season-2-jjks2-shibuya-arc-gif-16724819881471351955"
  },
  { 
    name: "Atadura Gemelar", 
    prob: 0.05, // ✅ Cambió de 0.25 a 0.05 (5%)
    desc: "Tu vida y energía maldita están vinculadas a un gemelo; si uno muere, el otro también. Esto genera una conexión fatal que limita el potencial individual (como Mai y Maki Zenin).",
    gif: "https://tenor.com/view/mai-mai-zenin-maki-maki-zenin-jujutsu-kaisen-gif-9950668753665162856"
  },
  { 
    name: "Sin Atadura", 
    prob: 0.80, // ✅ Cambió de 0.25 a 0.80 (80%)
    desc: "No hay restricciones especiales. Puedes usar energía maldita y técnicas sin limitaciones adicionales.",
    gif: "https://tenor.com/view/naoya-zenin-choso-fight-aura-farm-not-in-the-manga-gif-15215466617984430840"
  }
];
      
        const result = weightedRandom(ataduraOptions);
        const oldAtadura = profile.atadura;
        profile.atadura = result.name;
      
        if (profile.clan === 'Zenin' && result.name === 'Atadura Física') {
          profile.ritual_hereditario = 'N/A';
        } else if (profile.clan === 'Zenin' && oldAtadura === 'Atadura Física') {
          profile.ritual_hereditario = 'Ninguno';
        }
      
        saveDB();
      
        const response = 
      `▂▃▅▇█👀Atadura👀█▇▅▃▂
      
      ⊹・・──────────・・✦・・────
      
      ──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
      
      > *${result.name}*
      
      ──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
      
      > ***\`${result.desc}\`***
      
      :・・──────────・・✦・・────
      
      > ${result.gif}
      
      ⊹ 🌸・・────・・✦・・────・・🌸 ⊹
      
      
      **Atadura anterior:** ${oldAtadura}
      **Rerolls restantes:** ${profile.rr}`;
      
        return message.reply(response);
      }
    }
    
    if (command === 'bando') {
      if (args.length === 0) {
        return message.reply('Uso: `-bando <brujo | neutro | malvado | hechicero>`');
      }
      const newBando = args[0].toLowerCase();
      const validBando = ['brujo', 'neutro', 'malvado', 'hechicero'];
      if (!validBando.includes(newBando)) {
        return message.reply('Bando inválido. Opciones: brujo, neutro, malvado, hechicero.');
      }
      profile.bando = newBando.charAt(0).toUpperCase() + newBando.slice(1);
      saveDB();
      message.reply(`Bando cambiado a **${profile.bando}**.`);
      return;
    }
    // ========================================
// COMANDO: -dar (DAR REROLLS A OTRO USUARIO)
// ========================================
// LÍNEA ~7285 - REEMPLAZAR TODO EL COMANDO CON ESTO:

if (command === 'dar') {
  const mentioned = message.mentions.members.first();
  
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\n**Uso:** `-dar @usuario <cantidad>`');
  }

  if (mentioned.id === message.author.id) {
    return message.reply('❌ No puedes darte rerolls a ti mismo.');
  }

  const cantidad = parseInt(args[1]);
  
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('⚠️ Debes especificar una cantidad válida mayor a 0.\n**Ejemplo:** `-dar @usuario 5`');
  }

  const donorProfile = getProfile(message.author.id);
  const receiverProfile = getProfile(mentioned.id);

  // Verificar si el donante tiene suficientes RR
  if ((donorProfile.rr || 0) < cantidad) {
    return message.reply(
      `❌ **No tienes suficientes rerolls**\n\n` +
      `Intentas dar: **${cantidad} RR**\n` +
      `Tienes: **${donorProfile.rr || 0} RR**\n` +
      `Te faltan: **${cantidad - (donorProfile.rr || 0)} RR**`
    );
  }

  // Realizar la transferencia
  donorProfile.rr = (donorProfile.rr || 0) - cantidad;
  receiverProfile.rr = (receiverProfile.rr || 0) + cantidad;
  
  saveDB();

  return message.reply(
    `✅ **Transferencia completada**\n\n` +
    `🎁 **Donante:** ${message.member.displayName}\n` +
    `├─ RR restantes: **${donorProfile.rr}**\n\n` +
    `🎉 **Receptor:** ${mentioned.displayName}\n` +
    `├─ RR recibidos: **+${cantidad}**\n` +
    `└─ Total ahora: **${receiverProfile.rr}**`
  );
}
    if (command === 'aplicar_buffos') {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('Solo administradores pueden usar este comando.');
      }
      
      const target = message.mentions.users.first() || message.author;
      const targetProfile = getProfile(target.id);
      
      if (!targetProfile.tipos_prodigio || targetProfile.tipos_prodigio.length === 0) {
        return message.reply(`**${target.tag}** no tiene tipos de prodigio.`);
      }
      
      // Aplicar buffos de todos los tipos
      targetProfile.tipos_prodigio.forEach(tipo => {
        aplicarBuffosProdigio(targetProfile, tipo);
      });
      
      saveDB();
      
      return message.reply(
        `✅ **Buffos aplicados a ${target.tag}:**\n\n` +
        targetProfile.tipos_prodigio.map(t => `• ${t}`).join('\n') +
        `\n\n**Stats actualizadas:**\n` +
        `Fuerza: ${targetProfile.stats.fuerza.grado} (Nivel ${targetProfile.stats.fuerza.nivel})\n` +
        `Energía Maldita: ${targetProfile.stats["Energía Maldita"]}\n` +
        `RCT: ${targetProfile.rct ? 'Sí' : 'No'}`
      );
    }

    if (command === 'stats') {
      if (args.length === 0) {
        const stats = profile.stats || { Fuerza: 0, Velocidad: 0, Resistencia: 0, "Energía Maldita": 0, Objetos: "Ninguno", Personaje: "Ninguno" };
        return message.channel.send(
          "╔────── 「Ficha De Stats」 ─────╗\n" +
          "『💪』Fuerza: " + stats.Fuerza + "\n" +
          "『☄️』Velocidad: " + stats.Velocidad + "\n" +
          "『🛡️』Resistencia: " + stats.Resistencia + "\n" +
          "『🌀』Energía Maldita: " + stats["Energía Maldita"] + "\n" +
          (profile.rct ? "『✨』RCT: Sí\n" : "") +
          "╠─────────────╣\n" +
          "『🎀』Objetos: " + stats.Objetos + "\n" +
          "╠─────────────╣\n" +
          "『🎫』Personaje: " + stats.Personaje + "\n" +
          "╚─────────────╝\n\n" +
          "*Edita con: -stats <stat> <valor>*\n" +
          "Ej: `-stats Fuerza 5`"
        );
      }
      const stat = args[0];
      const valor = args[1] ? args.slice(1).join(' ') : null;
      const validStats = ['Fuerza', 'Velocidad', 'Resistencia', 'Energía Maldita', 'Objetos', 'Personaje'];
      if (!validStats.includes(stat)) {
        return message.reply('Stat inválido. Usa: Fuerza, Velocidad, Resistencia, Energía Maldita, Objetos, Personaje.');
      }
      profile.stats = profile.stats || { Fuerza: 0, Velocidad: 0, Resistencia: 0, "Energía Maldita": 0, Objetos: "Ninguno", Personaje: "Ninguno" };
      profile.stats[stat] = valor || 0;
      saveDB();
      message.reply(`**${stat}** actualizado a **${profile.stats[stat]}**.`);
      return;
    }

    if (command === 'help') {
      const helpEmbed = new EmbedBuilder()
        .setTitle('▂▃▅▇█ 📜 CURSED ERA II - CENTRO DE AYUDA 📜 █▇▅▃▂')
        .setDescription(
          '⊹・・──────────・・✦・・────────・・⊹\n\n' +
          '**Bienvenido al sistema de comandos más completo**\n' +
          '_Selecciona una categoría con los botones de abajo_\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n' +
          '🎲 **Spins & Rerolls** → Tira tu destino\n' +
          '⚔️ **Build & Perfil** → Tu personaje y stats\n' +
          '💰 **Economía** → Yenes, tiendas y mercado\n' +
          '👥 **Social** → Amigos, rivales y clanes\n' +
          '🎨 **Personalización** → Temas, efectos y colores\n' +
          '⚡ **Maestría & Poder** → RCT, técnicas y maestría\n' +
          '🛠️ **Administración** → Comandos de staff\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '_¡Navega con los botones para más detalles!_\n\n' +
          '⊹・・──────────・・✦・・────────・・⊹'
        )
        .setColor(0x9B59B6)
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
        .setImage('https://cdn.discordapp.com/attachments/1465647525766631585/1467237897181724673/descarga_5.jpg')
        .setFooter({ text: 'Cursed Era II • Febrero 2026 • Usa los botones para navegar' })
        .setTimestamp();
    
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_spins")
          .setLabel("Spins & Rerolls")
          .setEmoji("🎲")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("help_build")
          .setLabel("Build & Perfil")
          .setEmoji("⚔️")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("help_economia")
          .setLabel("Economía")
          .setEmoji("💰")
          .setStyle(ButtonStyle.Secondary)
      );
    
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_social")
          .setLabel("Social")
          .setEmoji("👥")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("help_personalizacion")
          .setLabel("Personalización")
          .setEmoji("🎨")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("help_maestria")
          .setLabel("Maestría & Poder")
          .setEmoji("⚡")
          .setStyle(ButtonStyle.Success)
      );
      
      const row3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("help_admin")
          .setLabel("Administración")
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Danger)
      );
    
      await message.channel.send({ embeds: [helpEmbed], components: [row1, row2, row3] });
      return;
    }
    // ========================================
// COMANDO: -removedominio (ADMIN)
// ========================================

if (command === 'removedominio' || command === 'quitardominio') {
  // Solo admins
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo administradores pueden usar este comando.');
  }

  const mentioned = message.mentions.members.first();
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\nUso: `-removedominio @usuario`');
  }

  const targetProfile = getProfile(mentioned.id);

  if (!targetProfile.dominio) {
    return message.reply(`❌ ${mentioned.displayName} no tiene un dominio asignado.`);
  }

  const dominioEliminado = targetProfile.dominio;
  delete targetProfile.dominio;
  saveDB();

  return message.reply(
    `✅ **Dominio eliminado**\n\n` +
    `❌ Se ha eliminado el dominio de ${mentioned.displayName}\n` +
    `└─ Dominio anterior: **${dominioEliminado.nombre}** (Nivel ${dominioEliminado.nivel})`
  );
}
// ========================================
// COMANDO: -crear_dominio (Usuario crea descripción de su dominio)
// ========================================

if (command === 'crear_dominio' || command === 'creardominio') {
  const profile = getProfile(message.author.id);

  // Verificar que tenga dominio asignado
  if (!profile.dominio) {
    return message.reply(
      `❌ No tienes un dominio asignado por los administradores.\n\n` +
      `💡 Primero un admin debe asignarte un dominio con:\n` +
      `\`-setdominio @usuario "Nombre del Dominio" <nivel>\``
    );
  }

  // Verificar que haya texto después del comando
  const textoCompleto = message.content.slice(prefix.length + command.length).trim();
  
  if (!textoCompleto && message.attachments.size === 0) {
    return message.reply(
      `⚠️ Debes proporcionar una descripción para tu dominio.\n\n` +
      `**Uso:**\n` +
      `\`-crear_dominio <descripción>\` → Solo texto\n` +
      `\`-crear_dominio <descripción>\` + adjuntar imagen → Con imagen\n` +
      `\`-crear_dominio <descripción> | <url>\` → Con URL de imagen\n\n` +
      `**Ejemplos:**\n` +
      `\`-crear_dominio Un espacio infinito donde la distancia pierde todo significado.\`\n\n` +
      `📎 O adjunta una imagen junto con el comando para usarla como banner.`
    );
  }

  // Separar descripción e imagen URL (si hay)
  const partes = textoCompleto.split('|').map(p => p.trim());
  const descripcion = partes[0] || "Dominio expandido.";
  let imagenUrl = partes[1] || null;

  // Priorizar imagen adjunta sobre URL
  if (message.attachments.size > 0) {
    const attachment = message.attachments.first();
    const extension = attachment.name.split('.').pop().toLowerCase();
    const extensionesValidas = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
    
    if (extensionesValidas.includes(extension)) {
      imagenUrl = attachment.url;
    } else {
      return message.reply(
        `⚠️ El archivo adjunto debe ser una imagen válida.\n` +
        `**Formatos aceptados:** .png, .jpg, .jpeg, .gif, .webp`
      );
    }
  }

  // Validar URL de imagen si se proporcionó (y no hay adjunto)
  if (imagenUrl && !message.attachments.size && !imagenUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i)) {
    return message.reply(
      `⚠️ La URL de la imagen no es válida.\n` +
      `Debe ser un enlace directo que termine en .jpg, .png, .gif o .webp`
    );
  }

  // Guardar descripción e imagen en el dominio
  profile.dominio.descripcion_personalizada = descripcion;
  if (imagenUrl) {
    profile.dominio.imagen_personalizada = imagenUrl;
  }
  
  saveDB();

  const nivelEmoji = {
    "simple": "🌑",
    "1": "🌀",
    "2": "🔵",
    "3": "🟣",
    "0.2": "⚡",
    "sin barreras": "👹"
  };

  const emoji = nivelEmoji[profile.dominio.nivel] || "⚫";

  const embed = new EmbedBuilder()
    .setTitle(`${emoji} ${profile.dominio.nombre.toUpperCase()} ${emoji}`)
    .setDescription(
      `╔═══════════════════════════════════╗\n` +
      `║     🏛️ DOMINIO PERSONALIZADO     ║\n` +
      `╚═══════════════════════════════════╝\n\n` +
      `${descripcion}\n\n` +
      `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
    )
    .addFields(
      { name: '🎭 Hechicero', value: message.member.displayName, inline: true },
      { name: '🔮 Nivel', value: profile.dominio.nivel.toUpperCase(), inline: true },
      { name: '✨ Refinamiento', value: `${profile.dominio.refinamiento || 0} pts`, inline: true }
    )
    .setColor(profile.dominio.nivel === "sin barreras" ? 0xFF0000 : 
              profile.dominio.nivel === "3" ? 0x9B59B6 : 
              profile.dominio.nivel === "0.2" ? 0xFFFF00 : 
              profile.dominio.nivel === "2" ? 0x3498DB : 
              profile.dominio.nivel === "1" ? 0x00CED1 : 0x808080)
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
    .setFooter({ text: `Cursed Era II • Dominio creado` })
    .setTimestamp();

  // Agregar imagen si se proporcionó
  if (imagenUrl) {
    embed.setImage(imagenUrl);
  }

  return message.reply({ 
    content: `✅ **Dominio personalizado creado con éxito**\n\nAhora cuando alguien use \`-dominio @${message.author.username}\` verá tu descripción${imagenUrl ? ' y banner' : ''} personalizado.`,
    embeds: [embed] 
  });
}

// ========================================
// COMANDO: -dominio @usuario (Ver dominio de alguien)
// ========================================

if (command === 'dominio' || command === 'verdominio') {
  const mentioned = message.mentions.members.first();
  
  if (!mentioned) {
    return message.reply(
      `⚠️ Debes mencionar a un usuario.\n` +
      `**Uso:** \`-dominio @usuario\`\n\n` +
      `💡 Para personalizar tu dominio usa: \`-crear_dominio <descripción>\``
    );
  }

  const targetProfile = getProfile(mentioned.id);

  if (!targetProfile.dominio) {
    return message.reply(
      `❌ ${mentioned.displayName} no tiene un dominio asignado.`
    );
  }

  const dominioInfo = targetProfile.dominio;
  const nivelEmoji = {
    "simple": "🌑",
    "1": "🌀",
    "2": "🔵",
    "3": "🟣",
    "0.2": "⚡",
    "sin barreras": "👹"
  };

  const emoji = nivelEmoji[dominioInfo.nivel] || "⚫";

  // Si tiene descripción personalizada, mostrar embed bonito
  if (dominioInfo.descripcion_personalizada) {
    const embed = new EmbedBuilder()
      .setTitle(`${emoji} ${dominioInfo.nombre.toUpperCase()} ${emoji}`)
      .setDescription(
        `╔═══════════════════════════════════╗\n` +
        `║       🏛️ DOMINIO EXPANDIDO       ║\n` +
        `╚═══════════════════════════════════╝\n\n` +
        `${dominioInfo.descripcion_personalizada}\n\n` +
        `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
      )
      .addFields(
        { name: '🎭 Hechicero', value: mentioned.displayName, inline: true },
        { name: '🔮 Nivel', value: dominioInfo.nivel.toUpperCase(), inline: true },
        { name: '✨ Refinamiento', value: `${dominioInfo.refinamiento || 0} pts`, inline: true }
      )
      .setColor(dominioInfo.nivel === "sin barreras" ? 0xFF0000 : 
                dominioInfo.nivel === "3" ? 0x9B59B6 : 
                dominioInfo.nivel === "0.2" ? 0xFFFF00 : 
                dominioInfo.nivel === "2" ? 0x3498DB : 
                dominioInfo.nivel === "1" ? 0x00CED1 : 0x808080)
      .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
      .setFooter({ text: `Cursed Era II • Dominio de ${mentioned.displayName}` })
      .setTimestamp();

    // Agregar imagen personalizada si existe
    if (dominioInfo.imagen_personalizada) {
      embed.setImage(dominioInfo.imagen_personalizada);
    }

    return message.reply({ embeds: [embed] });
  }

  // Si NO tiene descripción personalizada, mostrar mensaje simple
  const nivelDescripcion = {
    "simple": "Dominio Simple - Primera manifestación sin técnica garantizada",
    "1": "Dominio Nivel 1 - Barrera básica establecida",
    "2": "Dominio Nivel 2 - Barrera avanzada con técnicas mejoradas",
    "3": "Dominio Nivel 3 - Técnica garantizada activada",
    "0.2": "Dominio 0.2 segundos - Manifestación instantánea",
    "sin barreras": "Sin Barreras - Perfección absoluta del dominio"
  };

  return message.reply(
    `╔═══════════════════════════════════╗\n` +
    `║       ${emoji} DOMINIO DE ${mentioned.displayName.toUpperCase()} ${emoji}       ║\n` +
    `╚═══════════════════════════════════╝\n\n` +
    `🏛️ **${dominioInfo.nombre}**\n` +
    `🔮 **Nivel:** ${dominioInfo.nivel.toUpperCase()}\n\n` +
    `📖 ${nivelDescripcion[dominioInfo.nivel] || "Dominio único"}\n\n` +
    `💡 *${mentioned.displayName} aún no ha personalizado su dominio*\n\n` +
    `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
  );
}
// ========================================
// COMANDO: -dar (DAR REROLLS A OTRO USUARIO)
// ========================================
// Colocar después del comando -darxp (alrededor de la línea 7200)

if (command === 'dar') {
  const mentioned = message.mentions.members.first();
  
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\n**Uso:** `-dar @usuario <cantidad>`');
  }

  if (mentioned.id === message.author.id) {
    return message.reply('❌ No puedes darte rerolls a ti mismo.');
  }

  const cantidad = parseInt(args[1]);
  
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('⚠️ Debes especificar una cantidad válida mayor a 0.\n**Ejemplo:** `-dar @usuario 5`');
  }

  const donorProfile = getProfile(message.author.id);
  const receiverProfile = getProfile(mentioned.id);

  // Verificar si el donante tiene suficientes RR
  if ((donorProfile.rerolls || 0) < cantidad) {
    return message.reply(
      `❌ **No tienes suficientes rerolls**\n\n` +
      `Intentas dar: **${cantidad} RR**\n` +
      `Tienes: **${donorProfile.rerolls || 0} RR**\n` +
      `Te faltan: **${cantidad - (donorProfile.rerolls || 0)} RR**`
    );
  }

  // Realizar la transferencia
  donorProfile.rerolls = (donorProfile.rerolls || 0) - cantidad;
  receiverProfile.rerolls = (receiverProfile.rerolls || 0) + cantidad;
  
  saveDB();

  return message.reply(
    `✅ **Transferencia completada**\n\n` +
    `🎁 **Donante:** ${message.member.displayName}\n` +
    `├─ RR restantes: **${donorProfile.rerolls}**\n\n` +
    `🎉 **Receptor:** ${mentioned.displayName}\n` +
    `├─ RR recibidos: **+${cantidad}**\n` +
    `└─ Total ahora: **${receiverProfile.rerolls}**`
  );
}
// ========================================
// COMANDO: -jackpot (IDLE DEATH GAMBLE)
// ========================================
if (command === 'jackpot') {
  const profile = getProfile(message.author.id);
  
  // Datos de escenarios Riichi
  const escenariosRiichi = [
    {
      nombre: "🎫 Transit Card Riichi",
      descripcion: "Si Yuki pasa la puerta a tiempo para llegar al trabajo...",
      probabilidad: "⭐☆☆ (Baja - 15%)"
    },
    {
      nombre: "💺 Seat Struggle Riichi",
      descripcion: "La lucha por los asientos en el tren...",
      probabilidad: "⭐⭐☆ (Media - 35%)"
    },
    {
      nombre: "🚽 Potty Emergency Riichi",
      descripcion: "Si Hiro llega a la estación sin mojarse...",
      probabilidad: "⭐⭐☆ (Media - 35%)"
    },
    {
      nombre: "🚆 Friday Night Final Train Riichi",
      descripcion: "Si Yume no aborda el tren opuesto y reaparece...",
      probabilidad: "⭐⭐⭐ (Muy Alta - 80%)"
    }
  ];

  // Tipos de indicadores
  const indicadores = [
    { tipo: "PUERTAS SHUTTER VERDES", emoji: "🟢", chance: "BAJA" },
    { tipo: "PUERTAS SHUTTER ROJAS", emoji: "🔴", chance: "MEDIA" },
    { tipo: "PUERTAS SHUTTER DORADAS", emoji: "🟡", chance: "ALTA" },
    { tipo: "BOLAS DE RESERVA VERDES", emoji: "🟢", chance: "BAJA" },
    { tipo: "BOLAS DE RESERVA ROJAS", emoji: "🔴", chance: "MEDIA" },
    { tipo: "BOLAS DE RESERVA DORADAS", emoji: "🟡", chance: "ALTA" },
    { tipo: "EFECTOS CONSECUTIVOS", emoji: "🔄", chance: "ESPECIAL" }
  ];

  // Seleccionar indicador aleatorio
  const indicadorAleatorio = indicadores[Math.floor(Math.random() * indicadores.length)];
  
  // Seleccionar escenario aleatorio
  const escenarioAleatorio = escenariosRiichi[Math.floor(Math.random() * escenariosRiichi.length)];

  // Generar 3 números aleatorios del 1 al 9
  const num1 = Math.floor(Math.random() * 9) + 1;
  const num2 = Math.floor(Math.random() * 9) + 1;
  const num3 = Math.floor(Math.random() * 9) + 1;

  // Determinar si es jackpot (5% base de probabilidad)
  let probJackpot = 0.05;
  if (profile.especial === 'Suerte Infinita') probJackpot = 0.30;
  else if (profile.especial === 'Dominio Dependiente') probJackpot = 0.15; // 8% (ritual de dominio
  const probabilidadJackpot = Math.random() < probJackpot;
  
  let numerosFinales;
  if (probabilidadJackpot) {
    // Forzar jackpot con 3 números iguales
    const numeroJackpot = Math.floor(Math.random() * 9) + 1;
    numerosFinales = [numeroJackpot, numeroJackpot, numeroJackpot];
  } else {
    // Asegurar que NO sean 3 iguales
    numerosFinales = [num1, num2, num3];
    if (num1 === num2 && num2 === num3) {
      numerosFinales[2] = (num3 % 9) + 1; // Cambiar el último número
    }
  }

  const esJackpot = numerosFinales[0] === numerosFinales[1] && numerosFinales[1] === numerosFinales[2];
  const esImpar = esJackpot && numerosFinales[0] % 2 !== 0;
  const esPar = esJackpot && numerosFinales[0] % 2 === 0;

  // MENSAJE 1: Activación del Dominio
  const mensaje1 = 
    `> ࣪ ˖# ═══════ __⭒⊹🎲💀⭒一緒 ૮ ˶︶ACTIVACIÓN DEL DOMINIO︶˶ ___\n` +
    `> ︶. ⏝. ︶ ୨🎲💀୧ ︶. ⏝. ︶\n\n` +
    `> *一緒 🎲💀『Expansión de Dominio』*\n\n` +
    `**${message.member.displayName}** junta sus manos y activa su técnica maldita...\n\n` +
    `> * *一緒 『La apuesta comienza』*\n\n` +
    `💀 **"IDLE DEATH GAMBLE"** 💀\n` +
    `怠惰な死の賭博\n` +
    `私鉄純愛列車 - *Private Pure Love Train*\n\n` +
    `⚡ *Construcción: 0.2 segundos* | 📊 *Costo: 25% EM*\n\n` +
    `Las reglas del juego se transfieren instantáneamente\nal cerebro de todos los presentes...\n\n` +
    `🎰 **¡QUE COMIENCE LA APUESTA DE MUERTE!** 🎰\n\n` +
    `https://tenor.com/view/anime-manga-hakari-kashimo-jujutsu-kaisen-jjk-gif-17155997190839373770\n\n` +
    `*︶⏝︶୨🎲💀୧︶⏝︶*\n\n` +
    `# * * * * * *   ⸻⸻`;

  await message.channel.send(mensaje1);

  // Esperar 3 segundos
  await new Promise(resolve => setTimeout(resolve, 3000));

  // MENSAJE 2: Indicadores Visuales
  const mensaje2 = 
    `> ࣪ ˖# ═══════ __⭒⊹🚪⚡⭒一緒 ૮ ˶︶INDICADORES VISUALES︶˶ ___\n` +
    `> ︶. ⏝. ︶ ୨🚪⚡୧ ︶. ⏝. ︶\n\n` +
    `> *一緒 🚪⚡『Los indicadores se manifiestan』*\n\n` +
    `Hakari materializa sus efectos visuales en la batalla...\n\n` +
    `> * *一緒 『${indicadorAleatorio.tipo}』*\n\n` +
    `${indicadorAleatorio.emoji} **${indicadorAleatorio.tipo}** ${indicadorAleatorio.emoji}\n` +
    `✨ *Probabilidad de jackpot: ${indicadorAleatorio.chance}* ✨\n\n` +
    `El escenario avanza hacia el modo Riichi...\n` +
    `Los rodillos comienzan a girar...\n\n` +
    `🎰 [ ❓ ] [ ❓ ] [ ❓ ] 🎰\n\n` +
    `https://tenor.com/view/kashimo-kashimo-hajime-jjk-jjk-kashimo-manga-kashimo-vs-hakari-gif-9952904415531487907\n\n` +
    `*︶⏝︶୨🚪⚡୧︶⏝︶*\n\n` +
    `# * * * * * *   ⸻⸻`;

  await message.channel.send(mensaje2);

  // Esperar 3 segundos
  await new Promise(resolve => setTimeout(resolve, 3000));

  // MENSAJE 3: Modo Riichi
  const mensaje3 = 
    `> ࣪ ˖# ═══════ __⭒⊹🎯🚆⭒一緒 ૮ ˶︶MODO RIICHI ACTIVADO︶˶ ___\n` +
    `> ︶. ⏝. ︶ ୨🎯🚆୧ ︶. ⏝. ︶\n\n` +
    `> *一緒 🎯🚆『Escenario Riichi en progreso』*\n\n` +
    `Los indicadores han avanzado el juego...\n` +
    `Dos números revelados:\n\n` +
    `🎰 [ **${numerosFinales[0]}** ] [ **${numerosFinales[1]}** ] [ ❓ ] 🎰\n\n` +
    `> * *一緒 『Escenario activado』*\n\n` +
    `          *︶⏝︶୨🎯🚆୧︶⏝︶*\n\n` +
    `**${escenarioAleatorio.nombre}**\n\n` +
    `*${escenarioAleatorio.descripcion}*\n\n` +
    `**Probabilidad de Jackpot:** ${escenarioAleatorio.probabilidad}\n\n` +
    `El escenario se desarrolla...\n` +
    `¡El oponente no puede interferir con la visualización!\n\n` +
    `🎲 *Girando el último número...* 🎲\n\n` +
    `*︶⏝︶୨🎯🚆୧︶⏝︶*\n\n` +
    `# * * * * * *   ⸻⸻`;

  await message.channel.send(mensaje3);

  // Esperar 4 segundos
  await new Promise(resolve => setTimeout(resolve, 4000));

  // MENSAJE 4: Resultado
  if (esJackpot) {
    // ¡JACKPOT CONSEGUIDO!
    const mensaje4 = 
      `> ࣪ ˖# ═══════ __⭒⊹💎🔥⭒一緒 ૮ ˶︶¡JACKPOT CONSEGUIDO!︶˶ ___\n` +
      `> ︶. ⏝. ︶ ୨💎🔥୧ ︶. ⏝. ︶\n\n` +
      `> *一緒 💎🔥『¡HAS GANADO LA APUESTA!』*\n\n` +
      `🎰 [ **${numerosFinales[0]}** ] [ **${numerosFinales[1]}** ] [ **${numerosFinales[2]}** ] 🎰\n\n` +
      `> * *一緒 『El dominio desaparece...』*\n\n` +
      `          *︶⏝︶୨💎🔥୧︶⏝︶*\n\n` +
      `🎵 **"ADMIRÁNDOTE"** 🎵\n` +
      `あちらをタてれば - *Achira o Ta Tereba*\n\n` +
      `La canción suena a todo volumen...\n\n` +
      `**⚡ ENERGÍA MALDITA ILIMITADA ⚡**\n` +
      `**🌿 REVERSE CURSED TECHNIQUE AUTOMÁTICA 🌿**\n\n` +
      `**Duración:** 4 minutos y 11 segundos\n\n` +
      `💀 **ERES INMORTAL DURANTE LA CANCIÓN** 💀\n\n` +
      `https://tenor.com/view/hakari-dance-fast-gif-13903622908018534131\n\n` +
      `*︶⏝︶୨💎🔥୧︶⏝︶*\n\n` +
      `${esImpar ? '**[Modo próximo dominio: PROBABILIDAD AUMENTADA]**' : ''}` +
      `${esPar ? '**[Modo próximo dominio: GIROS RÁPIDOS]**' : ''}`;

    await message.channel.send(mensaje4);

    // Guardar estadística
    if (!profile.jackpots) profile.jackpots = 0;
    profile.jackpots++;
    saveDB();

  } else {
    // JACKPOT FALLIDO
    const mensaje4 = 
      `> ࣪ ˖# ═══════ __⭒⊹❌🎰⭒一緒 ૮ ˶︶JACKPOT FALLIDO︶˶ ___\n` +
      `> ︶. ⏝. ︶ ୨❌🎰୧ ︶. ⏝. ︶\n\n` +
      `> *一緒 ❌🎰『No has conseguido el jackpot...』*\n\n` +
      `🎰 [ **${numerosFinales[0]}** ] [ **${numerosFinales[1]}** ] [ **${numerosFinales[2]}** ] 🎰\n\n` +
      `> * *一緒 『La apuesta continúa』*\n\n` +
      `          *︶⏝︶୨❌🎰୧︶⏝︶*\n\n` +
      `El escenario vuelve al inicio...\n` +
      `Los rodillos siguen girando...\n\n` +
      `**¡Debes seguir intentando hasta conseguir el jackpot!**\n\n` +
      `⚠️ *Giros restantes disminuyendo...* ⚠️\n\n` +
      `https://tenor.com/view/hakari-hakari-dance-jujutsu-kaisen-dance-kinji-gif-5419032222833709098\n\n` +
      `*︶⏝︶୨❌🎰୧︶⏝︶*\n\n` +
      `💀 **Sigue apostando o perderás la batalla** 💀\n\n` +
      `# * * * * * *   ⸻⸻`;

    await message.channel.send(mensaje4);
  }

  return;
}
    if (command === 'blackflash' || command === 'bf') {
      if (profile.race === 'Sin tirar' || profile.clan === 'Sin tirar') {
        return message.reply('Primero tira raza y clan antes de intentar un Black Flash.');
      }

      let prob = 0.08;
      if (profile.especial === 'Bendecido por las Chispas Negras') prob = 0.30;
      else if (profile.especial === 'Recipiente Ideal') prob = 0.28;
      else if (profile.especial === 'Suerte Infinita') prob = 0.20;
      else if (profile.especial === 'Percepción del Alma') prob = 0.10;a
      const exito = Math.random() < prob;

      if (exito) {
        message.channel.send(
          `__***En ese instante, el mundo pareció detenerse y el sonido se extinguió por completo. No fue un simple golpe; lanzaste tu puño con una precisión que desafía la lógica humana, aplicando tu energía maldita en un intervalo de apenas $0,000001$ segundos tras el impacto físico.De repente, el espacio se distorsionó y el vacío fue reclamado por el destello de los relámpagos negros. ¡Habías logrado un Black Flash! La potencia de tu ataque se elevó a la potencia de 2,5, distorsionando la realidad misma y enviando una onda de choque devastadora que hizo crujir los huesos de tu oponente. En ese momento de absoluta epicidad, dejaste de ser un simple hechicero para convertirte en el centro de la zona: ahora la energía maldita fluye por tu cuerpo como si fuera tan natural como respirar.***__\n` +
          `# [¡DESTELLO NEGRO!](https://tenor.com/view/jjk-jjk-s2-jjk-season-2-jujutsu-kaisen-jujutsu-kaisen-s2-gif-7964484372484357392)`
        );
      } else {
        message.channel.send(
          `__***El mundo se ralentizó, la tensión en tus músculos era perfecta y lanzaste tu golpe con toda la intención de alcanzar el ápice de la hechicería. Sin embargo, el destino es caprichoso: el impacto y tu energía maldita no lograron sincronizarse en ese microsegundo necesario para distorsionar el espacio.***__\n` +
          `__***En lugar del característico destello negro, lo que surgió fue un puñetazo imbuido en energía maldita convencional. Aunque el golpe fue sólido y cargado con una potencia bruta que hizo retroceder a tu enemigo, la chispa oscura nunca llegó a estallar. Te quedaste a las puertas de la "zona", sintiendo la frustración de haber estado tan cerca de la esencia del poder, pero habiendo entregado solo un impacto ordinario aunque devastador en el frío asfalto de la batalla.***__\n` +
          `# [¡Suerte la proxima, dos turnos de CD!](https://tenor.com/view/yuji-itadori-jujutsu-kaisen-jjk-s2-shibuya-arc-punch-gif-12389289326727720327)`
        );
      }
      return;
    }

    if (command === 'rct') {
      const profile = getProfile(message.author.id);
    
      if (profile.race === 'Sin tirar' || profile.clan === 'Sin tirar') {
        return message.reply('Primero tira raza y clan antes de intentar dominar la RCT.');
      }
    
      if (profile.rct) {
        return message.reply(
          `╔════════════════════════════════════════╗\n` +
          `║   ⚠️ YA TIENES RCT ⚠️                 ║\n` +
          `╚════════════════════════════════════════╝\n\n` +
          `**Tier actual:** ${profile.rct_tier}\n` +
          `**Maestría:** ${profile.maestria || 0}%\n\n` +
          `Usa \`-mastery\` para ver tus capacidades.`
        );
      }
    
      let prob = 0.06;
      if (profile.especial === 'Suerte Infinita') prob = 0.25;
      else if (profile.especial === 'Percepción del Alma') prob = 0.12; // 12% (comprende mejor la EM)
      else if (profile.especial === 'Recipiente Ideal') prob = 0.10; // 10% (cuerpo perfecto)
      const exito = Math.random() < prob;
    
      if (exito) {
        // Otorgar RCT y tier aleatorio
        profile.rct = true;
        profile.rct_tier = obtenerTierAleatorioRCT();
        
        if (!profile.maestria || profile.maestria < 75) {
          profile.maestria = 75;
        }
    
        saveDB();
    
        await message.channel.send(
          `__***El frío de la muerte comenzó a invadir tus extremidades y el mundo se desvaneció en un gris pálido; estabas acabado. Sin embargo, en ese abismo de agonía donde tu cuerpo se rendía, lanzaste una última mirada al núcleo de tu propia alma. Entendiste que la energía maldita es pura negatividad, pero al multiplicar el rastro de tu dolor por sí mismo, lograste lo que pocos alcanzan: despertaste la Energía Maldita Inversa.***__\n` +
          `__***Fue como si un voltaje blanco y puro recorriera tus venas, deteniendo la hemorragia y reconstruyendo el tejido desgarrado en un instante milagroso. La fórmula negative + negative = positive dejó de ser una teoría para convertirse en tu nueva realidad. Con un resuello forzado, tus ojos se abrieron de golpe, brillando con una claridad aterradora; ya no estabas al borde del final, sino que habías renacido con el poder de sanar tu cuerpo y reescribir las reglas de la batalla.***__\n` +
          `# No mueras aquí ahora. https://tenor.com/view/satoru-gojo-vs-toji-fushigurou-zenin-gif-17463542258747608736`
        );
    
        const capacidades = getCapacidadesRCT(profile.rct_tier);
        const maestriaRequerida = getMaestriaRequeridaTier(profile.rct_tier);
    
        const confirmEmbed = new EmbedBuilder()
          .setTitle('╔════════════════════════════════════════╗\n║   🌿 ¡RCT DESBLOQUEADA! 🌿          ║\n╚════════════════════════════════════════╝')
          .setDescription(
            `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
            `**¡${message.member.displayName} ha desbloqueado la Reverse Cursed Technique!**\n\n` +
            `\`\`\`yaml\n` +
            `═══════════════════════════════════\n` +
            `         TIER OBTENIDO\n` +
            `═══════════════════════════════════\n` +
            `\n` +
            `Tier: ${profile.rct_tier}\n` +
            `Nivel: ${capacidades.nombre}\n` +
            `Maestría actual: ${profile.maestria}%\n` +
            `Maestría requerida: ${maestriaRequerida}%\n` +
            `\n` +
            `═══════════════════════════════════\n` +
            `\`\`\`\n\n` +
            `**🌟 CAPACIDADES ACTUALES:**\n` +
            capacidades.capacidades.map(c => `• ${c}`).join('\n') + `\n\n` +
            `**📚 INFORMACIÓN:**\n` +
            `• Tu tier puede mejorar con maestría\n` +
            `• Usa \`-mastery\` para ver tu progreso\n` +
            `• Cada tier reduce turnos y consumo EP\n\n` +
            `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
          )
          .setColor(capacidades.color)
          .setImage('https://cdn.discordapp.com/attachments/1469433821182296218/1472672995578220767/descarga.jpg')
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: '🌿 Cursed Era II • Reverse Cursed Technique' })
          .setTimestamp();
    
        await message.channel.send({ embeds: [confirmEmbed] });
      } else {
        await message.channel.send(
          `__***El frío comenzó a pesar más que tu propia voluntad. Con la visión nublada por la sangre y tus órganos fallando, lanzaste un último y desesperado intento de comprender la esencia de tu energía, tratando de forzar ese chispazo positivo que lo reparara todo. Visualizaste la multiplicación de tu negatividad, buscaste desesperadamente la fórmula para crear la Energía Maldita Inversa, pero el flujo simplemente no respondió.***__\n` +
          `__***En lugar del alivio del renacimiento, solo sentiste el vacío. Tu energía maldita se filtró por tus heridas como agua entre los dedos, incapaz de transmutarse en sanación. El golpe de realidad fue más doloroso que tus lesiones: no todos son prodigios, y el milagro de la técnica inversa se mantuvo fuera de tu alcance. Te quedaste allí, con el aliento entrecortado y el cuerpo roto, sintiendo cómo la oscuridad de la derrota se cerraba definitivamente sobre ti mientras la chispa de tu vida se atenuaba sin remedio.***__\n` +
          `# [¡NO MUERAS, NO!](https://tenor.com/view/gojo-satoru-gojo-gojo-death-gojo-fakeout-gojo-vs-toji-gif-17536692181766711941)`
        );
      }
      return;
    }
    // ========================================
// COMANDO -especial
// ========================================
if (command === 'especial') {
  const profile = getProfile(message.author.id);

  if (profile.race === 'Sin tirar') {
    return message.reply('Primero tira tu raza antes de tirar especial.');
  }

  if (profile.especial !== 'Sin tirar') {
    return message.reply(`Ya tienes un especial: **${profile.especial}**`);
  }
  if ((profile.rr || 0) <= 0) {
    return message.reply('No tienes RR disponibles para tirar especial.');
  }
  profile.rr = (profile.rr || 0) - 1;

  const especialesPool = [
    { nombre: 'Sin Especial', prob: 0.75, gif: 'https://tenor.com/view/naoya-naoya-zenin-jujutsu-kaisen-jjk-anime-gif-1776872762662229527' },
    { nombre: 'Bendecido por las Chispas Negras', prob: 0.08, gif: 'https://tenor.com/view/itadori-yuji-awakening-vs-ryomen-sukuna-heian-shinjuku-showndown-gif-6973039808878398451' },
    { nombre: 'Suerte Infinita', prob: 0.06, gif: 'https://tenor.com/view/hakari-hakari-kinji-kinji-hakari-kinji-jackpot-gif-12339332929838481118' },
    { nombre: 'Propiedad Especial Maldita', prob: 0.045, gif: 'https://tenor.com/view/kashimo-jujutsu-kaisen-jjk-jjk-manga-cata-kashimo-gif-13039113136609053173' },
    { nombre: 'Percepción del Alma', prob: 0.03, gif: 'https://tenor.com/view/yuji-itadori-yuji-yuji-jjk-jjk-yuji-jjk-manga-gif-12019849828893392562' },
    { nombre: 'Recipiente Perfecto', prob: 0.015, gif: 'https://tenor.com/view/sukuna-sukuna-megumi-sukuna-manga-sukuna-vessel-sukuna-and-megumi-gif-2361320244471375211' },
    { nombre: 'Dominio Dependiente', prob: 0.01, gif: 'https://tenor.com/view/higuruma-hiromi-vs-itadori-yuji-tribunal-cursed-tecnhique-sentence-domain-expansion-gif-9031352367725888933' },
    { nombre: 'Maldecido', prob: 0.005, gif: 'https://tenor.com/view/jjk0-yuta-jjk-jujutsu-kaisen-jujutsu-kaisen0-gif-26781147' },
    { nombre: 'Black Box', prob: 0.003, gif: 'https://tenor.com/view/sukuna-flame-arrow-fire-arrow-fuuga-anime-gif-14198916881459142941' },
    { nombre: 'Recipiente Ideal', prob: 0.002, gif: 'https://tenor.com/view/yuji-itadori-the-strongest-of-tomorrow-special-grade-sorcerer-the-all-times-gif-405680279726496460' }
  ];

  const rand = Math.random();
  let acum = 0;
  let especialObtenido = null;

  for (const esp of especialesPool) {
    acum += esp.prob;
    if (rand < acum) {
      especialObtenido = esp;
      break;
    }
  }

  profile.especial = especialObtenido.nombre;
  saveDB();

  // Descripciones
  const descripciones = {
    'Sin Especial': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹⚔️💀⭒一緒 ૮ ˶︶Sin Especial︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨⚔️💀୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 ⚔️💀『El Camino del Hechicero Común』*\n\n` +
             `Las chispas del destino no brillaron para ti hoy. No naciste con bendiciones extraordinarias ni dones únicos que te distingan del resto. Eres un hechicero común, como la mayoría que puebla este mundo maldito.\n\n` +
             `Pero recuerda: los más grandes no siempre nacieron especiales. Se volvieron especiales a través del sudor, la sangre y la determinación. Nanami Kento nunca tuvo un don divino. Todo lo logró con técnica perfecta y dedicación absoluta.\n\n` +
             `Tu camino será más difícil que el de aquellos bendecidos por el destino. Tendrás que trabajar el doble para alcanzar la mitad. Pero cuando llegues a la cima, sabrás que fue completamente tuyo.\n\n` +
             `> * *一緒 『Forjado por el Esfuerzo』*\n\n` +
             `No necesitas bendiciones del universo. Solo necesitas voluntad inquebrantable.\n\n` +
             `          *︶⏝︶୨⚔️💀୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Bendecido por las Chispas Negras': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹⚡💀⭒一緒 ૮ ˶︶Bendecido por las Chispas Negras︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨⚡💀୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 ⚡💀『El Elegido del Black Flash』*\n\n` +
             `Bendecido por las Chispas Negras es uno de los especiales más raros y codiciados del servidor. Aquellos que poseen esta bendición han sido elegidos por el fenómeno mismo del Black Flash - las chispas negras los reconocen como suyos.\n\n` +
             `No es simplemente suerte. Es una conexión fundamental con el momento perfecto donde cuerpo, alma y energía se sincronizan. Mientras otros hechiceros luchan toda su vida por conectar un solo Black Flash, los bendecidos lo logran con una frecuencia que desafía toda lógica.\n\n` +
             `Yuji Itadori es el ejemplo más claro en el canon - capaz de conectar rachas de Black Flashes que rompen récords establecidos por décadas. No es que sea más fuerte que todos, es que las chispas lo eligieron.\n\n` +
             `> * *一緒 『Una Conexión Innata』*\n\n` +
             `Los bendecidos sienten el timing del Black Flash de forma instintiva. No calculan - simplemente saben. Su cuerpo se mueve en sincronía perfecta sin pensamiento consciente. Es como si el universo los guiara hacia ese instante de 0.000001 segundos.\n\n` +
             `          *︶⏝︶୨⚡💀୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Recipiente Ideal': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹🏺💫⭒一緒 ૮ ˶︶Recipiente Ideal︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨🏺💫୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 🏺💫『El Cuerpo Perfecto』*\n\n` +
             `Recipiente Ideal es un especial extraordinariamente raro que otorga un cuerpo físicamente superior y diseñado para albergar energía maldita de forma perfecta. No es simplemente ser fuerte - es tener un recipiente físico que trasciende las limitaciones humanas normales.\n\n` +
             `Yuji Itadori es el ejemplo canon perfecto. Su cuerpo fue capaz de contener a Sukuna, el Rey de las Maldiciones, sin colapsar. Su estructura física es tan perfecta que puede soportar lo que destruiría a cualquier otro hechicero.\n\n` +
             `Pero hay un precio. La energía maldita que fluye por este cuerpo perfecto es lo que mantiene su juventud y vitalidad. Si esa energía desapareciera súbitamente, el cuerpo cobraría toda la deuda acumulada de golpe.\n\n` +
             `> * *一緒 『Juventud Eterna... Con Condiciones』*\n\n` +
             `Los recipientes ideales pueden vivir hasta 300 años adicionales mientras mantengan su energía maldita activa. Su envejecimiento se detiene casi por completo. Pero si su EM desaparece repentinamente, envejecerán instantáneamente todo lo que debieron envejecer.\n\n` +
             `          *︶⏝︶୨🏺💫୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Suerte Infinita': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹🍀✨⭒一緒 ૮ ˶︶Suerte Infinita︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨🍀✨୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 🍀✨『El Favorito del Destino』*\n\n` +
             `Suerte Infinita es el especial más enigmático y envidiado del servidor. Aquellos bendecidos con esta característica parecen tener el universo mismo de su lado. No es magia - es que las probabilidades simplemente se inclinan a su favor de forma inexplicable.\n\n` +
             `Hakari Kinji es el ejemplo canon perfecto de este fenómeno. Su suerte no es solo en el jackpot de su dominio - es en todo lo que hace. Sobrevive situaciones imposibles, conecta golpes críticos cuando más lo necesita, y los dados del destino siempre caen a su favor.\n\n` +
             `Los que poseen Suerte Infinita viven en un estado de probabilidad alterada. Cuando otros fallan, ellos tienen éxito. Cuando otros mueren, ellos sobreviven. No es invencibilidad - es que el universo parece preferirlos.\n\n` +
             `> * *一緒 『La Balanza Inclinada』*\n\n` +
             `Mientras otros luchan contra las probabilidades, los afortunados bailan con ellas. Cada intento, cada riesgo, cada apuesta... todo tiene mejores chances cuando el destino está de tu lado.\n\n` +
             `          *︶⏝︶୨🍀✨୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Dominio Dependiente': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹🌀⚡⭒一緒 ૮ ˶︶Dominio Dependiente︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨🌀⚡୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 🌀⚡『Ritual y Dominio Como Uno Solo』*\n\n` +
             `Dominio Dependiente es un especial extremadamente raro que otorga rituales cuyo verdadero poder solo se manifiesta dentro de un dominio expandido. Fuera del dominio, el ritual es débil o incluso inútil. Dentro del dominio, alcanza su potencial absoluto.\n\n` +
             `Hakari Kinji y su Idle Death Gamble son el ejemplo canon perfecto. Su ritual fuera del dominio no hace nada - no tiene sentido ni aplicación. Pero una vez despliega su dominio, se convierte en una ruleta de la suerte con potencial de inmortalidad temporal.\n\n` +
             `Estos rituales no son para los impacientes. Requieren llegar a Grado 2 para desbloquear el dominio, pero una vez alcanzado ese punto, el dominio está disponible instantáneamente sin necesidad de entrenamiento adicional.\n\n` +
             `> * *一緒 『El Precio del Poder Concentrado』*\n\n` +
             `Todo el poder del ritual está comprimido en el dominio. Es un intercambio: versatilidad por especialización extrema. Fuera del dominio eres débil. Dentro del dominio eres imparable.\n\n` +
             `          *︶⏝︶୨🌀⚡୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Recipiente Perfecto': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹👹💀⭒一緒 ૮ ˶︶Recipiente Perfecto︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨👹💀୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 👹💀『El Vaso del Rey』*\n\n` +
             `Recipiente Perfecto es uno de los especiales más peligrosos y doble filo del servidor. Aquellos que lo poseen tienen un cuerpo y alma perfectamente compatibles para albergar Objetos Malditos de Grado Especial - incluso los más mortales y poderosos.\n\n` +
             `Megumi Fushiguro sirviendo como recipiente de Sukuna es el ejemplo canon más claro. Su cuerpo no solo sobrevivió al Rey de las Maldiciones, sino que se adaptó perfectamente a él. No todos tienen esta "suerte".\n\n` +
             `Este especial no es una bendición - es una maldición disfrazada. Ser el recipiente perfecto significa que las entidades más peligrosas del mundo pueden habitarte sin destruirte. Y una vez dentro, pueden tomar control cuando lo deseen.\n\n` +
             `> * *一緒 『Compatible con lo Imposible』*\n\n` +
             `Tu cuerpo es tan perfectamente adaptable que puede albergar incluso a Sukuna mismo. Pero cada vez que un espíritu maldito habita en ti, existe el riesgo constante de que intente tomar el control.\n\n` +
             `          *︶⏝︶୨👹💀୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Propiedad Especial Maldita': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹⚡🌊⭒一緒 ૮ ˶︶Propiedad Especial Maldita︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨⚡🌊୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 ⚡🌊『Energía con Identidad Propia』*\n\n` +
             `Propiedad Especial Maldita es uno de los especiales más únicos y creativos del servidor. No es solo tener energía maldita - es que tu energía tiene características físicas y propiedades únicas que la distinguen de cualquier otra.\n\n` +
             `Hakari Kinji posee energía maldita tan áspera y afilada que actúa como papel de lija, raspando y cortando lo que toca. Kashimo Hajime tiene energía con propiedades eléctricas naturales, capaz de electrocutar y paralizar. Estas no son técnicas - son características inherentes a su energía misma.\n\n` +
             `Los que poseen este especial pueden crear su propia propiedad custom para su energía maldita. Puede ser fuego, hielo, ácido, gravedad, magnetismo, vibración, o cualquier concepto que puedas imaginar. Tu energía no es solo poder - es un elemento en sí mismo.\n\n` +
             `> * *一緒 『Tu Energía, Tu Identidad』*\n\n` +
             `Mientras otros hechiceros tienen energía genérica, la tuya tiene personalidad. Cada vez que la usas, lleva consigo las propiedades que la definen. No necesitas activar una técnica - simplemente al fluir tu energía, el efecto ocurre.\n\n` +
             `          *︶⏝︶୨⚡🌊୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Percepción del Alma': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹👁️‍🗨️💫⭒一緒 ૮ ˶︶Percepción del Alma︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨👁️‍🗨️💫୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 👁️‍🗨️💫『Nacido Viendo lo Invisible』*\n\n` +
             `Percepción del Alma es un especial extraordinariamente raro que otorga la capacidad innata de percibir y comprender las almas desde el nacimiento. Mientras otros hechiceros deben pasar años rastreando el origen de su energía maldita o sobrevivir a ataques traumáticos para despertar esta habilidad, los bendecidos con este especial simplemente nacen viéndolo.\n\n` +
             `Mahito es el único en el canon que posee esta percepción de forma innata gracias a su naturaleza como espíritu maldito. Para él, ver el alma es tan natural como respirar. No tuvo que aprenderlo - simplemente siempre lo supo.\n\n` +
             `Los que nacen con esta percepción ven el mundo de forma fundamentalmente diferente. No solo ven cuerpos - ven las esencias que los habitan. Pueden distinguir entre almas fuertes y débiles, detectar cuando alguien miente (el alma tiembla), e incluso percibir cuando múltiples almas habitan un mismo cuerpo.\n\n` +
             `> * *一緒 『Ver Más Allá de la Carne』*\n\n` +
             `Desde tu primer momento de consciencia, siempre supiste que hay algo más profundo que el cuerpo físico. Siempre lo viste. Siempre lo sentiste. El alma no es teoría para ti - es realidad observable.\n\n` +
             `          *︶⏝︶୨👁️‍🗨️💫୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Maldecido': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹💔👻⭒一緒 ૮ ˶︶Maldecido︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨💔👻୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 💔👻『Amor Convertido en Maldición』*\n\n` +
             `Maldecido es uno de los especiales más trágicos y poderosos del servidor. Aquellos que lo poseen están atados a una maldición de Grado Especial nacida de un trauma emocional extremo - típicamente la muerte de alguien profundamente amado.\n\n` +
             `Yuta Okkotsu y su vínculo con Rika Orimoto es el ejemplo canon perfecto. Cuando Rika murió en un accidente, el amor y la negación de Yuta fueron tan intensos que la convirtieron en una de las maldiciones más poderosas de la historia. No fue intencional - fue el resultado de emociones tan abrumadoras que rompieron las reglas de la realidad.\n\n` +
             `Esta maldición no es tu enemiga. Es tu compañera, tu guardiana, tu arma viviente. Nació de tu dolor más profundo y existe solo para protegerte. Pero ese poder viene con el peso de la tragedia que la creó.\n\n` +
             `> * *一緒 『El Precio del Amor Eterno』*\n\n` +
             `Tu maldición es manifestación física de tu mayor pérdida. Cada vez que la invocas, recuerdas lo que perdiste. Pero también recuerdas que nunca estás solo.\n\n` +
             `          *︶⏝︶୨💔👻୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    },
    'Black box': {
      texto: `> ࣪ ˖# ═══════ __⭒⊹🎲🖤⭒一緒 ૮ ˶︶Black Box︶˶ ___\n` +
             `> ︶. ⏝. ︶ ୨🎲🖤୧ ︶. ⏝. ︶\n\n` +
             `> *一緒 🎲🖤『La Expansión Conceptual』*\n\n`
             `Black Box es un especial extraordinariamente raro que otorga la capacidad de **expandir el concepto fundamental de tu ritual** mediante la adición de un **segundo concepto vinculado**.\n\n` +
             `No se trata de tener dos rituales. Tu ritual sigue siendo uno solo, pero ahora opera bajo **dos conceptos interconectados** que se complementan y potencian mutuamente.\n\n` +
             `          *︶⏝︶୨🎲🖤୧︶⏝︶*\n\n` +
             `# * * * * * *   ⸻⸻`
    }
  };

  await message.channel.send(descripciones[especialObtenido.nombre].texto);
  await message.channel.send(especialObtenido.gif);
}

    if (command === 'darrr') {
      if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Solo admins pueden usar este comando.');
      }
      if (args.length < 2) return message.reply('Uso: `-darrr @usuario cantidad`');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona a un usuario válido.');
      const cantidad = parseInt(args[1]);
      if (isNaN(cantidad) || cantidad <= 0) return message.reply('Cantidad inválida (debe ser un número positivo).');
      const targetProfile = getProfile(target.id);
      targetProfile.rr += cantidad;
      saveDB();
      message.reply(`Se dieron **${cantidad} rerolls** a ${target.tag}. Ahora tiene **${targetProfile.rr}** en total.`);
      return;
    }

    if (command === 'quitarrr') {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('❌ Solo administradores pueden usar este comando.');
      }
    
      const mentioned = message.mentions.members.first();
      if (!mentioned) {
        return message.reply('⚠️ Debes mencionar a un usuario.\n**Uso:** `-quitarrr @usuario <cantidad>`');
      }
    
      const cantidad = parseInt(args[1]);
      if (isNaN(cantidad) || cantidad <= 0) {
        return message.reply('⚠️ Debes especificar una cantidad válida.\n**Ejemplo:** `-quitarrr @usuario 5`');
      }
    
      const targetProfile = getProfile(mentioned.id);
      const rrAntes = targetProfile.rr || 0;
      
      // PERMITIR NEGATIVOS - simplemente restamos sin validar
      targetProfile.rr = rrAntes - cantidad;
      
      saveDB();
    
      // Mensaje especial si quedó en negativo
      if (targetProfile.rr < 0) {
        return message.reply(
          `✅ **Rerolls quitados**\n\n` +
          `👤 **Usuario:** ${mentioned.displayName}\n` +
          `├─ RR anteriores: **${rrAntes}**\n` +
          `├─ RR quitados: **-${cantidad}**\n` +
          `└─ RR actuales: **${targetProfile.rr}** ⚠️\n\n` +
          `⚠️ **Este usuario tiene rerolls negativos (castigo activo)**`
        );
      }
    
      return message.reply(
        `✅ **Rerolls quitados**\n\n` +
        `👤 **Usuario:** ${mentioned.displayName}\n` +
        `├─ RR anteriores: **${rrAntes}**\n` +
        `├─ RR quitados: **-${cantidad}**\n` +
        `└─ RR actuales: **${targetProfile.rr}**`
      );
    }
    if (command === 'gradosocial') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-gradosocial @usuario <grado>` (4,3,semi 2,2,semi 1,1,especial)');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase();
      const validGrados = ['4', '3', 'semi 2', '2', 'semi 1', '1', 'especial'];
      if (!validGrados.includes(grado)) return message.reply('Grado inválido. Opciones: 4, 3, semi 2, 2, semi 1, 1, especial');
      const targetProfile = getProfile(target.id);
      targetProfile.grado_social = grado.charAt(0).toUpperCase() + grado.slice(1);
      saveDB();
      message.reply(`Grado Social de ${target.tag} cambiado a **${targetProfile.grado_social}**.`);
      return;
    }

    if (command === 'gradogeneral') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-gradogeneral @usuario <grado>` (4,3,semi 2,2,semi 1,1,especial)');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase();
      const validGrados = ['4', '3', 'semi 2', '2', 'semi 1', '1', 'especial'];
      if (!validGrados.includes(grado)) return message.reply('Grado inválido. Opciones: 4, 3, semi 2, 2, semi 1, 1, especial');
      const targetProfile = getProfile(target.id);
      targetProfile.grado_general = grado.charAt(0).toUpperCase() + grado.slice(1);
      saveDB();
      message.reply(`Grado General de ${target.tag} cambiado a **${targetProfile.grado_general}**.`);
      return;
    }

    if (command === 'reset') {
      if (!message.member.permissions.has('Administrator')) 
        return message.reply('Solo admins.');
    
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
    
      const profile = db.users[target.id];
      if (!profile) return message.reply('Ese usuario no tiene build.');
    
      // Guardar datos antes de borrar
      const yen = profile.yen || 0;
const xp = profile.xp_total || 0;
const fama = profile.fama_xp_total || 0;

delete db.users[target.id];
saveDB();

const embed = new EmbedBuilder()
  .setColor(0x4B0082)
  .setTitle("═══ ⭒⊹𐔌ꉂ ⃝⚙️⭒ 一緒 ︶ REINICIO ︶ ═══")
  .setDescription(
`*一緒 ⚙️『El perfil de **${target.tag}** fue reiniciado.  
El registro anterior fue eliminado y toda la progresión dejó de existir.』*`
  )
  .addFields({
    name: "一緒 『¿Qué se perdió?』",
    value:
`XP total: **${xp.toLocaleString()}**
Fama acumulada: **${fama.toLocaleString()}**
Yenes: **¥${yen.toLocaleString()}**`,
    inline: false
  })
  .setImage("https://cdn.discordapp.com/attachments/1467400867572613334/1472511549355589705/Sad_Yuji_Jujutsu_Kaisen.jpg")
  .setFooter({ text: "︶⏝︶୨୧︶⏝︶ • Cursed Era" })
  .setTimestamp();

message.channel.send({ embeds: [embed] });
    }

    if (command === 'darmision') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-darmision @usuario grado` (4, 3, semi2, 2, semi1, 1, semiespecial, especial)');
    
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase();
    
      const validGrados = {
        '4': { yenes: 500, nombre: 'Grado 4' },
        '3': { yenes: 1200, nombre: 'Grado 3' },
        'semi2': { yenes: 2500, nombre: 'Semi-Grado 2' },
        '2': { yenes: 2500, nombre: 'Grado 2' },
        'semi1': { yenes: 5000, nombre: 'Semi-Grado 1' },
        '1': { yenes: 5000, nombre: 'Grado 1' },
        'semiespecial': { yenes: 12000, nombre: 'Semi-Grado Especial' },
        'especial': { yenes: 12000, nombre: 'Grado Especial' }
      };
    
      if (!validGrados[grado]) return message.reply('Grado inválido. Usa: 4, 3, semi2, 2, semi1, 1, semiespecial, especial');
    
      const targetProfile = getProfile(target.id);
      const gradoKey = grado === 'semi2' || grado === 'semi1' || grado === 'semiespecial' ? grado : grado;
      
      if (!targetProfile.misiones[gradoKey]) targetProfile.misiones[gradoKey] = 0;
      targetProfile.misiones[gradoKey] += 1;
    
      const yenGanado = validGrados[grado].yenes;
      targetProfile.yen = (targetProfile.yen || 0) + yenGanado;
      saveDB();
    
      message.reply(
        `✅ **Misión asignada**\n\n` +
        `**Usuario:** ${target.tag}\n` +
        `**Grado:** ${validGrados[grado].nombre}\n` +
        `**Misiones totales:** ${targetProfile.misiones[gradoKey]}\n` +
        `**Yenes ganados:** +¥${yenGanado.toLocaleString()}\n` +
        `**Total yenes:** ¥${targetProfile.yen.toLocaleString()}`
      );
      return;
    }

    if (command === 'quitarmision') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-quitarmision @usuario grado` (4, 3, semi2, 2, semi1, 1, semiespecial, especial)');
    
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase();
    
      const validGrados = {
        '4': { yenes: 500, nombre: 'Grado 4' },
        '3': { yenes: 1200, nombre: 'Grado 3' },
        'semi2': { yenes: 2500, nombre: 'Semi-Grado 2' },
        '2': { yenes: 2500, nombre: 'Grado 2' },
        'semi1': { yenes: 5000, nombre: 'Semi-Grado 1' },
        '1': { yenes: 5000, nombre: 'Grado 1' },
        'semiespecial': { yenes: 12000, nombre: 'Semi-Grado Especial' },
        'especial': { yenes: 12000, nombre: 'Grado Especial' }
      };
    
      if (!validGrados[grado]) return message.reply('Grado inválido. Usa: 4, 3, semi2, 2, semi1, 1, semiespecial, especial');
    
      const targetProfile = getProfile(target.id);
      const gradoKey = grado;
      
      if (!targetProfile.misiones[gradoKey]) targetProfile.misiones[gradoKey] = 0;
      
      if (targetProfile.misiones[gradoKey] <= 0) {
        return message.reply(`${target.tag} no tiene misiones en ${validGrados[grado].nombre}.`);
      }
    
      targetProfile.misiones[gradoKey] -= 1;
    
      const yenQuitado = validGrados[grado].yenes;
      
      if ((targetProfile.yen || 0) >= yenQuitado) {
        targetProfile.yen -= yenQuitado;
      } else {
        targetProfile.yen = 0;
      }
    
      saveDB();
    
      message.reply(
        `❌ **Misión removida**\n\n` +
        `**Usuario:** ${target.tag}\n` +
        `**Grado:** ${validGrados[grado].nombre}\n` +
        `**Misiones restantes:** ${targetProfile.misiones[gradoKey]}\n` +
        `**Yenes quitados:** -¥${yenQuitado.toLocaleString()}\n` +
        `**Total yenes:** ¥${targetProfile.yen.toLocaleString()}`
      );
      return;
    }
    // Comando -xp @user <stat> <cantidad> (solo admins)
    function getXpRequerida(nivel) {
      if (nivel <= 4) return 500;        
      if (nivel <= 8) return 1000;       
      if (nivel <= 12) return 1500;      
      if (nivel <= 16) return 2000;      
      if (nivel <= 20) return 2500;      
      if (nivel <= 24) return 3000;      
      if (nivel <= 28) return 3500;      
      return 4000;                       
    }
    
    if (command === 'xp') {
      if (!message.member.permissions.has('Administrator')) {
        return message.reply('Solo administradores pueden usar este comando.');
      }
    
      if (args.length < 3) {
        return message.reply('Uso: `-xp @usuario <fuerza|velocidad|resistencia> <cantidad>`\nEj: `-xp @Agus fuerza 1500`');
      }
    
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona a un usuario válido.');
    
      const targetProfile = getProfile(target.id);
      const stat = args[1].toLowerCase();
      const cantidad = parseInt(args[2]);
    
      if (!['fuerza', 'velocidad', 'resistencia'].includes(stat)) {
        return message.reply('Stat inválida. Usa: fuerza, velocidad o resistencia.');
      }
    
      if (isNaN(cantidad) || cantidad <= 0) {
        return message.reply('La cantidad de EXP debe ser un número positivo.');
      }
    
      // Inicializar stat si no existe
      if (!targetProfile.stats) targetProfile.stats = {};
      if (!targetProfile.stats[stat]) {
        targetProfile.stats[stat] = { nivel: 1, sub: "", grado: "Sin grado", xp: 0 };
      }
    
      const statObj = targetProfile.stats[stat];
      const oldEstado = `${statObj.grado}${statObj.sub ? ' ' + statObj.sub : ''} (LVL ${statObj.nivel})`;
    // ✅ SUMAR AL XP TOTAL ANTES DE PROCESAR
targetProfile.xp_total = (targetProfile.xp_total || 0) + cantidad;
      // Sumar EXP y procesar subidas
      // Reemplazar el while loop del comando -xp

let xpRestante = cantidad;
while (xpRestante > 0) {
  const xpRequerida = getXpRequerida(statObj.nivel);
  const xpParaSubir = Math.min(xpRestante, xpRequerida - statObj.xp);

  statObj.xp += xpParaSubir;
  xpRestante -= xpParaSubir;

  if (statObj.xp >= xpRequerida) {
    statObj.xp -= xpRequerida;
    statObj.nivel++;

    // ✅ VERIFICAR SI ES PRODIGIO FÍSICO Y STAT ES FUERZA
    const esProdigioFisico = targetProfile.tipos_prodigio && targetProfile.tipos_prodigio.includes("Prodigio Físico");
    
    // Asignar grado base según nivel
    if (statObj.nivel > 28) {
      statObj.grado = "Grado Especial+";
      statObj.nivel = 30;
      statObj.sub = "";
    } else if (statObj.nivel > 24) {
      statObj.grado = "Grado Especial";
      statObj.sub = "";
    } else if (statObj.nivel > 20) {
      statObj.grado = "Sub-Grado Especial";
      const subIndex = (statObj.nivel - 21) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    } else if (statObj.nivel > 16) {
      statObj.grado = "Grado 1";
      const subIndex = (statObj.nivel - 17) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    } else if (statObj.nivel > 12) {
      statObj.grado = "Grado 2";
      const subIndex = (statObj.nivel - 13) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    } else if (statObj.nivel > 8) {
      statObj.grado = "Sub-Grado 2";
      const subIndex = (statObj.nivel - 9) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    } else if (statObj.nivel > 4) {
      statObj.grado = "Grado 3";
      const subIndex = (statObj.nivel - 5) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    } else if (statObj.nivel > 0) {
      statObj.grado = "Grado 4";
      const subIndex = (statObj.nivel - 1) % 4;
      statObj.sub = ["", "+", "++", "+++"][subIndex];
    }
    
    // ✅ APLICAR BUFFO DE PRODIGIO FÍSICO (+1 GRADO)
    if (esProdigioFisico && stat === 'fuerza') {
      // Subir un grado completo
      if (statObj.grado === "Grado 4") {
        statObj.grado = "Grado 3";
      } else if (statObj.grado === "Grado 3") {
        statObj.grado = "Sub-Grado 2";
      } else if (statObj.grado === "Sub-Grado 2") {
        statObj.grado = "Grado 2";
      } else if (statObj.grado === "Grado 2") {
        statObj.grado = "Grado 1";
      } else if (statObj.grado === "Grado 1") {
        statObj.grado = "Sub-Grado Especial";
      } else if (statObj.grado === "Sub-Grado Especial") {
        statObj.grado = "Grado Especial";
      }
    }
  }
}
    
      saveDB();
    
      const newEstado = `${statObj.grado}${statObj.sub ? ' ' + statObj.sub : ''} (LVL ${statObj.nivel})`;
    
      const response = 
    `▂▃▅▇█ EXP OTORGADA █▇▅▃▂
    
    **${target.tag}** recibió **${cantidad} EXP** en **${stat.toUpperCase()}**
    
    **Antes:** ${oldEstado}
    **Ahora:** ${newEstado}
    
    ¡Progresión actualizada!`;
    
      return message.reply(response);
    }
    // ========================================
// COMANDO: -top (Leaderboards)
// ========================================
if (command === 'top') {
  // Embed inicial con las 3 categorías
  const initialEmbed = new EmbedBuilder()
    .setTitle('▂▃▅▇█🏆 RANKING DE HECHICEROS 🏆█▇▅▃▂')
    .setDescription(
      '⊹・・──────────・・✦・・────────・・⊹\n\n' +
      '**Los hechiceros más temidos del reino**\n' +
      '*Aquellos cuyo poder resuena en todo el mundo jujutsu*\n\n' +
      '━━━━━━━━━━━━━━━━━━\n' +
      '**Elige una categoría:**\n\n' +
      '📈 **Top XP** - Los más experimentados\n' +
      '🔄 **Top Rerolls** - Los más afortunados\n' +
      '🏆 **Top Grado Social** - La élite del jujutsu\n' +
      '━━━━━━━━━━━━━━━━━━\n\n' +
      '⊹・・──────────・・✦・・────────・・⊹'
    )
    .setColor(0xFF6B6B)
    .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
    .setFooter({ text: 'Cursed Era II • Usa los botones para navegar' })
    .setTimestamp();

  // Crear los 3 botones
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('top_xp')
      .setLabel('Top XP')
      .setEmoji('📈')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('top_rr')
      .setLabel('Top RR')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('top_grado')
      .setLabel('Top Grado Social')
      .setEmoji('🏆')
      .setStyle(ButtonStyle.Success)
  );

  // Enviar el embed inicial con botones
  await message.channel.send({ embeds: [initialEmbed], components: [row] });
  return;
}
// ========================================
// COMANDO: -setdominio
// ========================================

if (command === 'setdominio') {
  // Solo admins
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo administradores pueden usar este comando.');
  }

  const mentioned = message.mentions.members.first();
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\nUso: `-setdominio @usuario "nombre" <nivel>`');
  }

  // -setdominio @user "Unlimited Void" 3
  const argsParsed = message.content.slice(prefix.length + command.length).trim();
  const match = argsParsed.match(/<@!?(\d+)>\s+"([^"]+)"\s+(\S+)/);
  
  if (!match) {
    return message.reply(
      '⚠️ Formato incorrecto.\n' +
      '**Uso correcto:**\n' +
      '`-setdominio @usuario "Nombre del Dominio" <nivel>`\n\n' +
      '**Niveles válidos:** simple, 1, 2, 3, 0.2, sin_barreras\n\n' +
      '**Ejemplo:**\n' +
      '`-setdominio @usuario "Unlimited Void" 3`'
    );
  }

  const nombreDominio = match[2];
  const nivel = match[3].toLowerCase().replace('sin_barreras', 'sin barreras');

  const nivelesValidos = ['simple', '1', '2', '3', '0.2', 'sin barreras'];
  if (!nivelesValidos.includes(nivel)) {
    return message.reply('❌ Nivel inválido. Usa: simple, 1, 2, 3, 0.2, sin_barreras');
  }

  const targetProfile = getProfile(mentioned.id);
  
  // Calcular refinamiento base según maestría
  const maestria = targetProfile.maestria || 0;
  const refinamientoBase = Math.ceil(maestria / 10);

  targetProfile.dominio = {
    nombre: nombreDominio,
    nivel: nivel,
    refinamiento: refinamientoBase,
    entrenamientos_usados: 0
  };

  saveDB();

  const nivelEmoji = {
    "simple": "🌑",
    "1": "🌀",
    "2": "🔵",
    "3": "🟣",
    "0.2": "⚡",
    "sin barreras": "👹"
  };

  const emoji = nivelEmoji[nivel] || "⚫";

  return message.reply(
    `✅ **Dominio asignado correctamente**\n\n` +
    `${emoji} **${nombreDominio}**\n` +
    `├─ Usuario: ${mentioned.displayName}\n` +
    `├─ Nivel: **${nivel.toUpperCase()}**\n` +
    `└─ Refinamiento base: **${refinamientoBase} pts** (según ${maestria}% maestría)`
  );
}

// ========================================
// COMANDO: -addrefinamiento (ADMIN)
// ========================================

if (command === 'addrefinamiento' || command === 'add_refinamiento') {
  // Solo admins
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo administradores pueden usar este comando.');
  }

  const mentioned = message.mentions.members.first();
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\nUso: `-addrefinamiento @usuario <cantidad>`');
  }

  const cantidad = parseInt(args[1]);
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('⚠️ Debes especificar una cantidad válida.\n**Ejemplo:** `-addrefinamiento @usuario 2`');
  }

  const targetProfile = getProfile(mentioned.id);

  if (!targetProfile.dominio) {
    return message.reply(`❌ ${mentioned.displayName} no tiene un dominio asignado.`);
  }

  const refinamientoAnterior = targetProfile.dominio.refinamiento || 0;
  targetProfile.dominio.refinamiento = refinamientoAnterior + cantidad;
  saveDB();

  const nivelEmoji = {
    "simple": "🌑",
    "1": "🌀",
    "2": "🔵",
    "3": "🟣",
    "0.2": "⚡",
    "sin barreras": "👹"
  };

  const emoji = nivelEmoji[targetProfile.dominio.nivel] || "⚫";

  return message.reply(
    `✅ **Refinamiento actualizado**\n\n` +
    `${emoji} **${targetProfile.dominio.nombre}**\n` +
    `├─ Usuario: ${mentioned.displayName}\n` +
    `├─ Refinamiento anterior: **${refinamientoAnterior} pts**\n` +
    `└─ Refinamiento nuevo: **${targetProfile.dominio.refinamiento} pts** (+${cantidad})`
  );
}

// ========================================
// COMANDO: -removerefinamiento (ADMIN)
// ========================================

if (command === 'removerefinamiento' || command === 'remove_refinamiento') {
  // Solo admins
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('❌ Solo administradores pueden usar este comando.');
  }

  const mentioned = message.mentions.members.first();
  if (!mentioned) {
    return message.reply('⚠️ Debes mencionar a un usuario.\nUso: `-removerefinamiento @usuario <cantidad>`');
  }

  const cantidad = parseInt(args[1]);
  if (isNaN(cantidad) || cantidad <= 0) {
    return message.reply('⚠️ Debes especificar una cantidad válida.\n**Ejemplo:** `-removerefinamiento @usuario 2`');
  }

  const targetProfile = getProfile(mentioned.id);

  if (!targetProfile.dominio) {
    return message.reply(`❌ ${mentioned.displayName} no tiene un dominio asignado.`);
  }

  const refinamientoAnterior = targetProfile.dominio.refinamiento || 0;
  targetProfile.dominio.refinamiento = Math.max(0, refinamientoAnterior - cantidad);
  saveDB();

  const nivelEmoji = {
    "simple": "🌑",
    "1": "🌀",
    "2": "🔵",
    "3": "🟣",
    "0.2": "⚡",
    "sin barreras": "👹"
  };

  const emoji = nivelEmoji[targetProfile.dominio.nivel] || "⚫";

  return message.reply(
    `✅ **Refinamiento actualizado**\n\n` +
    `${emoji} **${targetProfile.dominio.nombre}**\n` +
    `├─ Usuario: ${mentioned.displayName}\n` +
    `├─ Refinamiento anterior: **${refinamientoAnterior} pts**\n` +
    `└─ Refinamiento nuevo: **${targetProfile.dominio.refinamiento} pts** (-${cantidad})`
  );
}
       // Comando -cambiar @user <categoría> <valor> — solo admins
       if (command === 'cambiar') {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply('❌ Solo administradores pueden usar este comando.');
        }
      
        const mentioned = message.mentions.members.first();
        if (!mentioned) {
          return message.reply(
            '⚠️ Debes mencionar a un usuario.\n\n' +
            '**Uso:**\n' +
            '`-cambiar @usuario objetos "Item1, Item2, Item3"`'
          );
        }
      
        const targetProfile = getProfile(mentioned.id);
      
        // Detectar si está cambiando objetos
        if (args[1] && args[1].toLowerCase() === 'objetos') {
          const objetosTexto = message.content
            .slice(prefix.length + command.length)
            .trim()
            .replace(/<@!?\d+>/, '')
            .replace(/objetos/i, '')
            .trim()
            .replace(/^["']|["']$/g, ''); // Quitar comillas si las hay
      
          if (!objetosTexto) {
            return message.reply('⚠️ Debes especificar los objetos.\n**Ejemplo:** `-cambiar @usuario objetos "Espada Maldita, Sello de Prisión"`');
          }
      
          targetProfile.stats = targetProfile.stats || {};
          targetProfile.stats.Objetos = objetosTexto;
          saveDB();
      
          return message.reply(
            `✅ **Objetos actualizados para ${mentioned.displayName}**\n\n` +
            `🎒 **Inventario:**\n${objetosTexto}`
          );
        }

        const categoria = args[1] ? args[1].toLowerCase() : null;
        let nuevoValor = args.slice(2).join(' ') || null;
        if (!categoria || !nuevoValor) return message.reply('⚠️ Uso: `-cambiar @usuario <campo> <valor>`');
        // Convertir a número cuando sea necesario
        if (['yen', 'rr'].includes(categoria)) {
          const num = parseInt(nuevoValor.replace(/[^0-9]/g, '')) || 0;
          if (isNaN(num)) return message.reply('Para yen o rr debe ser un número válido.');
          nuevoValor = num;
        }
      
        // ✅ CAMPOS PERMITIDOS ACTUALIZADOS
        // ✅ CAMPOS PERMITIDOS ACTUALIZADOS
        const camposValidos = [
          'ritual', 'ritual_hereditario', 'atadura', 'race', 'clan', 'potencial',
          'escuela', 'bando', 'grado_social', 'grado_general', 'yen', 'rr',
          'raza_craft', 'clan_craft', 'especial_1', 'especial_2', 'ritual_craft',
          'tipos_prodigio', 'cantidad_prodigios', 'energia_maldita'
        ];
      // Ya está en la lista de campos válidos, pero agregar manejo especial:
// ✅ Manejo especial para Energía Maldita (propiedad nested)
if (categoria === 'energia_maldita' || categoria === 'energía maldita' || categoria === 'energia') {
  const num = parseInt(nuevoValor.replace(/[^0-9]/g, '')) || 0;
  if (isNaN(num)) return message.reply('La energía debe ser un número válido.');
  
  targetProfile.stats["Energía Maldita"] = num;
  saveDB();
  await message.reply(`✅ **${mentioned.user.tag}** actualizado:\n**Energía Maldita** → **${num}**`);
  return;
}
if (categoria === 'tipos_prodigio') {
  // Convertir el string a array
  const tipos = nuevoValor.split(',').map(t => t.trim());
  targetProfile.tipos_prodigio = tipos;
  
  // Aplicar buffos de cada tipo
  tipos.forEach(tipo => {
    aplicarBuffosProdigio(targetProfile, tipo);
  });
  
  saveDB();
  await message.reply(`✅ **${mentioned.user.tag}** actualizado:\n**${categoria}** → **${tipos.join(', ')}**\n\n⚠️ Buffos aplicados automáticamente.`);
  return;
}
        if (!camposValidos.includes(categoria)) {
          return message.reply(`Categoría inválida. Usa una de estas: ${camposValidos.join(', ')}`);
        }
      
        // Guardar el cambio
        targetProfile[categoria] = nuevoValor;
      
        // Guardar en disco
        saveDB();
      
        await message.reply(`✅ **${mentioned.user.tag}** actualizado:\n**${categoria}** → **${nuevoValor}**`);
        return;
      }

      if (command === 'mastery' || command === 'maestria_ver') {
        const userData = db.users[message.author.id];
        const maestria = profile.maestria || 0;
      
        // Calcular técnicas desbloqueadas
        const tecnicasDesbloqueadas = [];
        if (maestria >= 10) tecnicasDesbloqueadas.push('Cuarto Grado');
        if (maestria >= 20) tecnicasDesbloqueadas.push('Tercer Grado');
        if (maestria >= 25) tecnicasDesbloqueadas.push('Segundo Grado');
        if (maestria >= 30) tecnicasDesbloqueadas.push('Primer Grado');
        if (maestria >= 40) tecnicasDesbloqueadas.push('Semi-Especial');
        if (maestria >= 75) tecnicasDesbloqueadas.push('Grado Especial');
      
        // Próximo objetivo
        let proximoObjetivo = 'Máximo alcanzado';
        if (maestria < 10) proximoObjetivo = `Cuarto Grado (${10 - maestria}% restante)`;
        else if (maestria < 20) proximoObjetivo = `Tercer Grado (${20 - maestria}% restante)`;
        else if (maestria < 25) proximoObjetivo = `Segundo Grado (${25 - maestria}% restante)`;
        else if (maestria < 30) proximoObjetivo = `Primer Grado (${30 - maestria}% restante)`;
        else if (maestria < 40) proximoObjetivo = `Semi-Especial (${40 - maestria}% restante)`;
        else if (maestria < 75) proximoObjetivo = `Grado Especial (${75 - maestria}% restante)`;
      
        // Barra de progreso
        const barraTotal = 20;
        const progreso = Math.floor((maestria / 200) * barraTotal);
        const barra = '█'.repeat(progreso) + '░'.repeat(barraTotal - progreso);
      
        const embed = new EmbedBuilder()
          .setTitle('╔════════════════════════════════════════╗\n║   ⚡ TU MAESTRÍA EN EM ⚡            ║\n╚════════════════════════════════════════╝')
          .setColor(maestria >= 100 ? 0xFFD700 : maestria >= 50 ? 0xC0C0C0 : 0x808080)
          .setDescription(
            `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
            `**${message.member.displayName}**\n` +
            `\`\`\`yaml\n` +
            `═══════════════════════════════════\n` +
            `         PROGRESO GENERAL\n` +
            `═══════════════════════════════════\n` +
            `\n` +
            `Maestría: ${maestria}% / 200%\n` +
            `[${barra}] ${(maestria / 200 * 100).toFixed(1)}%\n` +
            `\n` +
            `Técnicas desbloqueadas: ${tecnicasDesbloqueadas.length}/6\n` +
            `Próximo objetivo: ${proximoObjetivo}\n` +
            `\n` +
            `═══════════════════════════════════\n` +
            `\`\`\`\n\n` +
            `**📊 TÉCNICAS DISPONIBLES:**\n` +
            `${maestria >= 10 ? '✅' : '🔒'} **Cuarto Grado** - 10% requerido\n` +
            `${maestria >= 20 ? '✅' : '🔒'} **Tercer Grado** - 20% requerido\n` +
            `${maestria >= 25 ? '✅' : '🔒'} **Segundo Grado** - 25% requerido\n` +
            `${maestria >= 30 ? '✅' : '🔒'} **Primer Grado** - 30% requerido\n` +
            `${maestria >= 40 ? '✅' : '🔒'} **Semi-Especial** - 40% requerido\n` +
            `${maestria >= 75 ? '✅' : '🔒'} **Grado Especial** - 75% requerido\n\n`
          )
          .setThumbnail(message.author.displayAvatarURL())
          .setFooter({ text: '⚡ Cursed Era II • Sistema de Maestría' })
          .setTimestamp();
      
        // Si tiene RCT, agregar información
        if (profile.rct && profile.rct_tier) {
          const capacidades = getCapacidadesRCT(profile.rct_tier);
          const maestriaRequerida = getMaestriaRequeridaTier(profile.rct_tier);
          
          embed.addFields({
            name: '🌿 REVERSE CURSED TECHNIQUE',
            value: 
              `\`\`\`yaml\n` +
              `Tier Actual: ${profile.rct_tier}\n` +
              `Nombre: ${capacidades.nombre}\n` +
              `Maestría requerida: ${maestriaRequerida}%\n` +
              `Estado: ${maestria >= maestriaRequerida ? 'Dominado ✅' : 'En desarrollo 🔄'}\n` +
              `\`\`\`\n` +
              `**Capacidades actuales:**\n` +
              capacidades.capacidades.map(c => `• ${c}`).join('\n'),
            inline: false
          });
      
          // Próximo tier RCT
          const tierOrden = ['D', 'C', 'B', 'A', 'S', 'Z'];
          const indexActual = tierOrden.indexOf(profile.rct_tier);
          
          if (indexActual < tierOrden.length - 1) {
            const proximoTier = tierOrden[indexActual + 1];
            const maestriaProxTier = getMaestriaRequeridaTier(proximoTier);
            
            embed.addFields({
              name: '📈 Próximo Tier RCT',
              value: 
                `**Tier ${proximoTier}** - ${maestriaProxTier}% requerido\n` +
                `Progreso: ${maestria}% / ${maestriaProxTier}%\n` +
                `Restante: ${Math.max(0, maestriaProxTier - maestria)}%`,
              inline: false
            });
          } else {
            embed.addFields({
              name: '🏆 Tier Máximo',
              value: '¡Has alcanzado el tier máximo de RCT!',
              inline: false
            });
          }
        }
      
        await message.channel.send({ embeds: [embed] });
        return;
      }
      // ✅ NUEVO COMANDO: -darlogro
if (command === 'darlogro') {
  if (!message.member.permissions.has('Administrator')) {
    return message.reply('Solo administradores pueden usar este comando.');
  }

  if (args.length < 2) {
    return message.reply(
      'Uso: `-darlogro @usuario "Nombre del logro"`\n' +
      'Ejemplo: `-darlogro @Gabi "Maestro del Black Flash"`'
    );
  }

  const target = message.mentions.users.first();
  if (!target) return message.reply('Menciona a un usuario válido con @.');

  const targetProfile = getProfile(target.id);
  
  // Extraer el nombre del logro (todo después de la mención)
  const logro = args.slice(1).join(' ').trim().replace(/^["']|["']$/g, '');
  
  if (!logro || logro.length === 0) {
    return message.reply('El nombre del logro no puede estar vacío.');
  }

  // Inicializar array si no existe
  if (!targetProfile.logros) {
    targetProfile.logros = [];
  }

  // Agregar el logro
  targetProfile.logros.push(logro);
  saveDB();

  const response = 
`▂▃▅▇█ LOGRO DESBLOQUEADO █▇▅▃▂

🏅 **${target.tag}** obtuvo un nuevo logro:

**"${logro}"**

Total de logros: **${targetProfile.logros.length}**

¡Felicitaciones! 🎉`;

  return message.reply(response);
}

  } catch (err) {
    console.error('Error en comando:', err);
    message.reply('Hubo un error al ejecutar el comando. Revisar la consola.');
  }
});
// ═══════════════════════════════════════════════
// COMANDO: -balon_de_oro
// ═══════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('-balon_de_oro')) return;

  const profile = getProfile(message.author.id);
  if (!profile.balonesDeOro) {
    profile.balonesDeOro = { oro: 0, plata: 0, bronce: 0, historial: [] };
    saveDB();
  }
  const b = profile.balonesDeOro;
  const total = b.oro + b.plata + b.bronce;
  const BANNER = 'https://cdn.discordapp.com/attachments/1469433821182296218/1473166876782756000/descarga_2.jpg';

  if (total > 0) {
    let titulo = '';
    if (b.oro >= 5)       titulo = '👑 LEYENDA INMORTAL 👑';
    else if (b.oro >= 3)  titulo = '🌟 CAMPEÓN SERIAL 🌟';
    else if (b.oro >= 1)  titulo = '🏆 GANADOR DEL BALÓN DE ORO 🏆';
    else                  titulo = '🔥 VETERANO DESTACADO 🔥';

    const oroStr    = b.oro    > 0 ? '🥇'.repeat(Math.min(b.oro, 10))    + (b.oro    > 10 ? ` ×${b.oro}`    : '') : '—';
    const plataStr  = b.plata  > 0 ? '🥈'.repeat(Math.min(b.plata, 10))  + (b.plata  > 10 ? ` ×${b.plata}`  : '') : '—';
    const bronceStr = b.bronce > 0 ? '🥉'.repeat(Math.min(b.bronce, 10)) + (b.bronce > 10 ? ` ×${b.bronce}` : '') : '—';

    let historialStr = '';
    if (b.historial && b.historial.length > 0) {
      b.historial.slice(-3).reverse().forEach(e => {
        const ic = e.categoria === 'oro' ? '🥇' : e.categoria === 'plata' ? '🥈' : '🥉';
        historialStr += `${ic} **${e.mes}** — ${e.razon}\n`;
      });
    } else { historialStr = '*Sin historial aún*'; }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✦ ══════ 🏆 BALÓN DE ORO 🏆 ══════ ✦')
      .setDescription(
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `> **${message.member?.displayName || message.author.username}**\n` +
        `> *${titulo}*\n` +
        `⊹・・──────────・・✦・・──────────・・⊹`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(BANNER)
      .addFields(
        { name: '🥇 Balones de Oro',   value: oroStr,    inline: true },
        { name: '🥈 Balones de Plata',  value: plataStr,  inline: true },
        { name: '🥉 Balones de Bronce', value: bronceStr, inline: true },
        { name: `✨ Total: **${total}**`, value: '────────────────────────────', inline: false },
        { name: '📜 Historial Reciente', value: historialStr, inline: false }
      )
      .setFooter({ text: '✦ Salón de la Fama • Cursed Era II ✦', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });

  } else {
    const frases = [
      'Tu nombre aún no está en el Salón de la Fama… **¿Qué esperas?**',
      'Las leyendas no nacen, se forjan. **Tu momento está cerca.**',
      'El oro te espera. Solo debes **ser inolvidable.**',
      'No te conformes con ser bueno. **Sé legendario.**',
      'Cada campeón comenzó donde tú estás. **Levántate.**',
      'El Balón de Oro no discrimina por nivel. **Solo por excelencia.**'
    ];
    const frase = frases[Math.floor(Math.random() * frases.length)];

    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setTitle('✦ ══════ 🏆 BALÓN DE ORO 🏆 ══════ ✦')
      .setDescription(
        `⊹・・──────────・・✦・・──────────・・⊹\n` +
        `> **${message.member?.displayName || message.author.username}**\n` +
        `> *Aspirante al Salón de la Fama*\n` +
        `⊹・・──────────・・✦・・──────────・・⊹\n\n` +
        `🔥 **${frase}**\n\n` +
        `*El cronómetro corre. La competencia es feroz.*\n` +
        `*El oro espera. ¿Serás tú el próximo?*`
      )
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
      .setImage(BANNER)
      .addFields({ name: '🏅 Tus Balones', value: '🥇 Oro: **0**\n🥈 Plata: **0**\n🥉 Bronce: **0**', inline: false })
      .setFooter({ text: '✦ Demuestra tu excelencia • Cursed Era II ✦', iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }
});

// ═══════════════════════════════════════════════
// COMANDO: -dar_balon @usuario <oro|plata|bronce> [mes] [razón]
// ═══════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('-dar_balon')) return;
  if (!message.member.permissions.has('Administrator')) return message.reply('❌ Solo administradores.');

  const args = message.content.slice('-dar_balon'.length).trim().split(/ +/);
  const targetUser = message.mentions.users.first();
  if (!targetUser) return message.reply('⚠️ Uso: `-dar_balon @usuario <oro|plata|bronce> [mes] [razón]`');

  const cat = args[1]?.toLowerCase();
  if (!['oro', 'plata', 'bronce'].includes(cat)) return message.reply('⚠️ Categoría inválida. Usa `oro`, `plata` o `bronce`.');

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const ahora = new Date();
  const mes   = args[2] || `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
  const razon = args.slice(3).join(' ') || 'Excelencia demostrada durante el mes';

  const tp = getProfile(targetUser.id);
  if (!tp.balonesDeOro) tp.balonesDeOro = { oro: 0, plata: 0, bronce: 0, historial: [] };
  tp.balonesDeOro[cat]++;
  tp.balonesDeOro.historial.push({ categoria: cat, mes, razon, fecha: ahora.toISOString() });
  saveDB();

  const colores = { oro: 0xFFD700, plata: 0xC0C0C0, bronce: 0xCD7F32 };
  const iconos  = { oro: '🥇', plata: '🥈', bronce: '🥉' };
  const total   = tp.balonesDeOro.oro + tp.balonesDeOro.plata + tp.balonesDeOro.bronce;

  const embed = new EmbedBuilder()
    .setColor(colores[cat])
    .setTitle(`${iconos[cat]} ══ BALÓN DE ${cat.toUpperCase()} OTORGADO ══ ${iconos[cat]}`)
    .setDescription(
      `⊹・・──────────・・✦・・──────────・・⊹\n` +
      `> 🏆 **${targetUser.username}** inmortalizado en el **Salón de la Fama**\n` +
      `⊹・・──────────・・✦・・──────────・・⊹\n\n` +
      `📅 **Mes:** ${mes}\n📜 **Mérito:** ${razon}\n\n` +
      `🥇 ${tp.balonesDeOro.oro} | 🥈 ${tp.balonesDeOro.plata} | 🥉 ${tp.balonesDeOro.bronce} — **Total: ${total}**`
    )
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage('https://cdn.discordapp.com/attachments/1469433821182296218/1473166876782756000/descarga_2.jpg')
    .setFooter({ text: `Otorgado por ${message.author.username} • Cursed Era II`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
  await message.channel.send(`🎊 ¡${targetUser} acaba de ganar un **Balón de ${cat.charAt(0).toUpperCase()+cat.slice(1)}**! ${iconos[cat]} *"${razon}"*`);
});

// ═══════════════════════════════════════════════
// COMANDO: -quitar_balon @usuario <oro|plata|bronce> [razón]
// ═══════════════════════════════════════════════
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.content.toLowerCase().startsWith('-quitar_balon')) return;
  if (!message.member.permissions.has('Administrator')) return message.reply('❌ Solo administradores.');

  const args = message.content.slice('-quitar_balon'.length).trim().split(/ +/);
  const targetUser = message.mentions.users.first();
  if (!targetUser) return message.reply('⚠️ Uso: `-quitar_balon @usuario <oro|plata|bronce> [razón]`');

  const cat = args[1]?.toLowerCase();
  if (!['oro', 'plata', 'bronce'].includes(cat)) return message.reply('⚠️ Categoría inválida. Usa `oro`, `plata` o `bronce`.');

  const razon = args.slice(2).join(' ') || 'Decisión administrativa';
  const tp = getProfile(targetUser.id);

  if (!tp.balonesDeOro || tp.balonesDeOro[cat] <= 0)
    return message.reply(`❌ **${targetUser.username}** no tiene Balones de ${cat.toUpperCase()} para quitar.`);

  tp.balonesDeOro[cat]--;
  saveDB();

  const iconos = { oro: '🥇', plata: '🥈', bronce: '🥉' };
  const total  = tp.balonesDeOro.oro + tp.balonesDeOro.plata + tp.balonesDeOro.bronce;

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('⚠️ BALÓN REMOVIDO')
    .setDescription(
      `Quitado un **${iconos[cat]} Balón de ${cat.charAt(0).toUpperCase()+cat.slice(1)}** a **${targetUser.username}**.\n\n` +
      `📜 **Razón:** ${razon}\n` +
      `🥇 ${tp.balonesDeOro.oro} | 🥈 ${tp.balonesDeOro.plata} | 🥉 ${tp.balonesDeOro.bronce} — **Total: ${total}**`
    )
    .setFooter({ text: `Acción de ${message.author.username} • Cursed Era II`, iconURL: message.author.displayAvatarURL() })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  
  // ✅ DEFER GLOBAL TEMPRANO para evitar errores de timeout
  const skipDeferIds = ['top_xp', 'top_rr', 'top_grado', 'tienda_prev', 'tienda_next'];
  const needsDefer = !skipDeferIds.some(id => interaction.customId.startsWith(id)) && 
                     !interaction.customId.startsWith('mc_') &&
                     !interaction.customId.startsWith('grafico_');
                     
  if (needsDefer) {
    try {
      await interaction.deferUpdate();
    } catch (err) {
      console.log('Error al defer update:', err.message);
    }
  }
  
    // ========================================
  // PRIMERO: Manejar botones del -top (ANTES del deferUpdate global)
  // ========================================
  if (interaction.customId === 'top_xp') {
    try {
      // Obtener todos los usuarios y ordenar por XP (probando todos los nombres posibles)
      const usuarios = Object.entries(db.users)
      .map(([userId, data]) => ({
        userId,
        xp: data.xp_total || 0, // ✅ Ahora usa xp_total
        tag: null
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);
  
      // Debug: Ver cuántos usuarios tienen XP > 0
      console.log('Usuarios con XP:', usuarios.filter(u => u.xp > 0).length);
      console.log('Top 3:', usuarios.slice(0, 3).map(u => ({ id: u.userId, xp: u.xp })));
  
      for (let i = 0; i < usuarios.length; i++) {
        try {
          const user = await client.users.fetch(usuarios[i].userId);
          usuarios[i].tag = user.tag;
        } catch {
          usuarios[i].tag = 'Usuario desconocido';
        }
      }
  
      const topEmbed = new EmbedBuilder()
        .setTitle('▂▃▅▇█📈 TOP XP 📈█▇▅▃▂')
        .setDescription('⊹・・──────────・・✦・・────────・・⊹\n**Los hechiceros más experimentados**\n⊹・・──────────・・✦・・────────・・⊹')
        .setColor(0x3498db)
        .setImage('https://cdn.discordapp.com/attachments/1465174713427951626/1467036840212041791/Kinji_Hakari_jjk.jpg?ex=697eec06&is=697d9a86&hm=13fbb750769fdd222f702dbf918de07b2f9cf0c12cc22f101ef3911b64ae81fc&')
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
        .setFooter({ text: 'Cursed Era II • Top 10 por experiencia' })
        .setTimestamp();
  
      for (let i = 0; i < 10; i++) {
        if (usuarios[i]) {
          const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`;
          topEmbed.addFields({
            name: `${medalla} ${usuarios[i].tag}`,
            value: `📊 XP total: **${usuarios[i].xp.toLocaleString()}**`,
            inline: false
          });
        } else {
          topEmbed.addFields({
            name: `${i + 1}° Puesto disponible`,
            value: '❓ Este puesto está esperando por ti',
            inline: false
          });
        }
      }
  
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('top_xp').setLabel('Top XP').setEmoji('📈').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('top_rr').setLabel('Top RR').setEmoji('🔄').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('top_grado').setLabel('Top Grado Social').setEmoji('🏆').setStyle(ButtonStyle.Success)
      );
  
      await interaction.update({ embeds: [topEmbed], components: [row] });
    } catch (err) {
      if (err.code !== 10062 && err.code !== 40060) {
        console.error('Error en top_xp:', err.message);
      }
    }
    return;
  }
  if (interaction.customId === 'top_rr') {
    try {
      // Obtener todos los usuarios y ordenar por rr
      const usuarios = Object.entries(db.users)
        .map(([userId, data]) => ({
          userId,
          rr: data.rr || 0,
          tag: null
        }))
        .sort((a, b) => b.rr - a.rr)
        .slice(0, 10);

      // Obtener tags de usuarios
      for (let i = 0; i < usuarios.length; i++) {
        try {
          const user = await client.users.fetch(usuarios[i].userId);
          usuarios[i].tag = user.tag;
        } catch {
          usuarios[i].tag = 'Usuario desconocido';
        }
      }

      // Crear embed del top RR
      const topEmbed = new EmbedBuilder()
        .setTitle('▂▃▅▇█🔄 TOP REROLLS 🔄█▇▅▃▂')
        .setDescription('⊹・・──────────・・✦・・────────・・⊹\n**Los más afortunados del reino**\n⊹・・──────────・・✦・・────────・・⊹')
        .setColor(0x9B59B6)
        .setImage('https://cdn.discordapp.com/attachments/1465174713427951626/1467037116247707881/descarga_1.jpg?ex=697eec48&is=697d9ac8&hm=737e25938233c9a20326968a64fc70dec5a5188ba8d47df23b950a8270684c0c&')
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
        .setFooter({ text: 'Cursed Era II • Top 10 por rerolls' })
        .setTimestamp();

      // Agregar los 10 puestos
      for (let i = 0; i < 10; i++) {
        if (usuarios[i]) {
          const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`;
          topEmbed.addFields({
            name: `${medalla} ${usuarios[i].tag}`,
            value: `🎲 Rerolls: **${usuarios[i].rr}**`,
            inline: false
          });
        } else {
          topEmbed.addFields({
            name: `${i + 1}° Puesto disponible`,
            value: '❓ Este puesto está esperando por ti',
            inline: false
          });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('top_xp')
          .setLabel('Top XP')
          .setEmoji('📈')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('top_rr')
          .setLabel('Top RR')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('top_grado')
          .setLabel('Top Grado Social')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.update({ embeds: [topEmbed], components: [row] });
    } catch (err) {
      if (err.code !== 10062 && err.code !== 40060) {
        console.error('Error en top_rr:', err.message);
      }
    }
    return;
  }

  if (interaction.customId === 'top_grado') {
    try {
      // Mapeo de grados a valores numéricos para ordenar
      const gradoValor = {
        'especial': 7,
        '1': 6,
        'semi 1': 5,
        '2': 4,
        'semi 2': 3,
        '3': 2,
        '4': 1,
        'sin grado': 0
      };

      // Obtener todos los usuarios y ordenar por grado_social
      const usuarios = Object.entries(db.users)
        .map(([userId, data]) => {
          const grado = (data.grado_social || 'sin grado').toLowerCase();
          return {
            userId,
            grado: data.grado_social || 'Sin grado',
            valor: gradoValor[grado] || 0,
            tag: null
          };
        })
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);

      // Obtener tags de usuarios
      for (let i = 0; i < usuarios.length; i++) {
        try {
          const user = await client.users.fetch(usuarios[i].userId);
          usuarios[i].tag = user.tag;
        } catch {
          usuarios[i].tag = 'Usuario desconocido';
        }
      }

      // Crear embed del top Grado Social
      const topEmbed = new EmbedBuilder()
        .setTitle('▂▃▅▇█🏆 TOP GRADO SOCIAL 🏆█▇▅▃▂')
        .setDescription('⊹・・──────────・・✦・・────────・・⊹\n**La élite del mundo jujutsu**\n⊹・・──────────・・✦・・────────・・⊹')
        .setColor(0xF1C40F)
        .setImage('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467036873036791830/65dbfa390454799c.jpg?ex=697eec0e&is=697d9a8e&hm=8c1beaa6f2fc4b3f717bc8867aeb1cf3af0566319c88b09143deec6bed697035&')
        .setFooter({ text: 'Cursed Era II • Top 10 por grado social' })
        .setTimestamp();

      // Agregar los 10 puestos
      for (let i = 0; i < 10; i++) {
        if (usuarios[i]) {
          const medalla = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`;
          topEmbed.addFields({
            name: `${medalla} ${usuarios[i].tag}`,
            value: `🎖️ Grado Social: **${usuarios[i].grado}**`,
            inline: false
          });
        } else {
          topEmbed.addFields({
            name: `${i + 1}° Puesto disponible`,
            value: '❓ Este puesto está esperando por ti',
            inline: false
          });
        }
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('top_xp')
          .setLabel('Top XP')
          .setEmoji('📈')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('top_rr')
          .setLabel('Top RR')
          .setEmoji('🔄')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('top_grado')
          .setLabel('Top Grado Social')
          .setEmoji('🏆')
          .setStyle(ButtonStyle.Success)
      );

      await interaction.update({ embeds: [topEmbed], components: [row] });
    } catch (err) {
      if (err.code !== 10062 && err.code !== 40060) {
        console.error('Error en top_grado:', err.message);
      }
    }
    return;
  }
 
  
  // Botones del comando -MC
if (interaction.customId.startsWith('mc_craft_') || 
interaction.customId.startsWith('mc_social_') || 
interaction.customId.startsWith('mc_clan_')) {

await interaction.deferUpdate(); // ✅ AGREGAR ESTO

const parts = interaction.customId.split('_');
const section = parts[1];
const targetUserId = parts[2];

let targetMember;
try {
targetMember = await interaction.guild.members.fetch(targetUserId);
} catch {
targetMember = { displayName: 'Usuario', user: { username: 'Desconocido' } };
}

const profile = getProfile(targetUserId);

let embed = new EmbedBuilder()
.setThumbnail(profile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
.setFooter({ text: 'Cursed Era II • Minecraft Profile' })
.setTimestamp();

if (section === 'craft') {
embed.setColor(0x00FF88)
  .setTitle("▂▃▅▇█ JUJUTSU CRAFT █▇▅▃▂")
  .setDescription(
    "⊹・・──────────・・✦・・────────・・⊹\n\n" +
    `**Build de ${targetMember.displayName} en Minecraft**\n` +
    "_Solo admins pueden editar con -cambiar_\n\n" +
    "⊹・・──────────・・✦・・────────・・⊹"
  )
  .addFields(
    { name: "🧬 Raza Craft", value: profile.raza_craft || "Sin definir", inline: true },
    { name: "👥 Clan Craft", value: profile.clan_craft || "Sin definir", inline: true },
    { name: "⚡ Especial 1", value: profile.especial_1 || "Ninguno", inline: true },
    { name: "⚡ Especial 2", value: profile.especial_2 || "Ninguno", inline: true },
    { name: "🔮 Ritual Craft", value: profile.ritual_craft || "Ninguno", inline: true }
  );
}
else if (section === 'social') {
const amigos = profile.amigos || [];
const rivales = profile.rivales || [];
const solicitudes = profile.solicitudes_amistad || [];

let descripcion = "⊹・・──────────・・✦・・────────・・⊹\n\n";

descripcion += `**👥 AMIGOS** (+${amigos.length * 5}% XP)\n`;
if (amigos.length === 0) {
  descripcion += "_No tiene amigos aún._\n\n";
} else {
  for (let i = 0; i < Math.min(amigos.length, 5); i++) {
    try {
      const user = await client.users.fetch(amigos[i]);
      descripcion += `${i + 1}. **${user.tag}**\n`;
    } catch {
      descripcion += `${i + 1}. Usuario desconocido\n`;
    }
  }
  if (amigos.length > 5) descripcion += `_...y ${amigos.length - 5} más_\n`;
  descripcion += "\n";
}

descripcion += "**⚔️ RIVALES**\n";
if (rivales.length === 0) {
  descripcion += "_No tiene rivales aún._\n\n";
} else {
  for (let i = 0; i < Math.min(rivales.length, 5); i++) {
    try {
      const user = await client.users.fetch(rivales[i]);
      descripcion += `${i + 1}. **${user.tag}**\n`;
    } catch {
      descripcion += `${i + 1}. Usuario desconocido\n`;
    }
  }
  if (rivales.length > 5) descripcion += `_...y ${rivales.length - 5} más_\n`;
  descripcion += "\n";
}

if (solicitudes.length > 0) {
  descripcion += "**📩 Solicitudes pendientes:**\n";
  for (let i = 0; i < Math.min(solicitudes.length, 3); i++) {
    try {
      const user = await client.users.fetch(solicitudes[i]);
      descripcion += `• **${user.tag}**\n`;
    } catch {
      descripcion += `• Usuario desconocido\n`;
    }
  }
  descripcion += "\n";
}

descripcion += "⊹・・──────────・・✦・・────────・・⊹";

embed.setColor(0xFF4500)
  .setTitle("▂▃▅▇█ AMIGOS & RIVALES ⚔️ █▇▅▃▂")
  .setDescription(descripcion);
}
else if (section === 'clan') {
const clanNombre = profile.clan_guild;

if (!clanNombre) {
  embed.setColor(0x95A5A6)
    .setTitle("▂▃▅▇█ CLAN GUILD 🏰 █▇▅▃▂")
    .setDescription(
      "⊹・・──────────・・✦・・────────・・⊹\n\n" +
      `**${targetMember.displayName}** no pertenece a ningún clan.\n\n` +
      "Podés crear uno con \`-crear_clan\` o unirte a uno existente.\n\n" +
      "⊹・・──────────・・✦・・────────・・⊹"
    );
} else {
  const clan = clanes[clanNombre];
  
  if (!clan) {
    embed.setColor(0xFF0000)
      .setTitle("▂▃▅▇█ ERROR 🏰 █▇▅▃▂")
      .setDescription("El clan ya no existe. Contactá a un admin.");
  } else {
    let liderTag = 'Desconocido';
    try {
      const lider = await client.users.fetch(clan.lider);
      liderTag = lider.tag;
    } catch {}
    
    let miembrosText = '';
    for (let i = 0; i < Math.min(clan.miembros.length, 10); i++) {
      try {
        const miembro = await client.users.fetch(clan.miembros[i]);
        miembrosText += `${i + 1}. ${miembro.tag}\n`;
      } catch {
        miembrosText += `${i + 1}. Usuario desconocido\n`;
      }
    }
    if (clan.miembros.length > 10) {
      miembrosText += `_...y ${clan.miembros.length - 10} más_`;
    }
    
    embed.setColor(0x9B59B6)
      .setTitle(`▂▃▅▇█ ${clanNombre.toUpperCase()} 🏰 █▇▅▃▂`)
      .setDescription(
        "⊹・・──────────・・✦・・────────・・⊹\n\n" +
        `**🎖️ Líder:** ${liderTag}\n` +
        `**👥 Miembros:** ${clan.miembros.length}\n` +
        `**⭐ Puntos:** ${clan.puntos.toLocaleString()}\n` +
        `**📅 Fundado:** <t:${Math.floor(clan.fecha_creacion / 1000)}:R>\n\n` +
        "**MIEMBROS:**\n" +
        miembrosText + "\n\n" +
        "⊹・・──────────・・✦・・────────・・⊹"
      );
  }
}
}

const row = new ActionRowBuilder().addComponents(
new ButtonBuilder().setCustomId(`mc_craft_${targetUserId}`).setLabel("Jujutsu Craft").setEmoji("🎮").setStyle(ButtonStyle.Primary),
new ButtonBuilder().setCustomId(`mc_social_${targetUserId}`).setLabel("Amigos & Rivales").setEmoji("👥").setStyle(ButtonStyle.Success),
new ButtonBuilder().setCustomId(`mc_clan_${targetUserId}`).setLabel("Clan Guild").setEmoji("🏰").setStyle(ButtonStyle.Danger)
);

await interaction.editReply({ embeds: [embed], components: [row] });
return;
}
  // ========================================
// BOTONES DE TIENDA
// ========================================
if (interaction.customId.startsWith('tienda_prev_') || interaction.customId.startsWith('tienda_next_')) {
  try {
    const parts = interaction.customId.split('_');
    const action = parts[1]; // 'prev' o 'next'
    let currentPage = parseInt(parts[2]) || 1;
    
    const shopItems = [
      { name: "Spins extra (x3)", desc: "Consigues 3 rerolls extra", price: 8000 },
      { name: "Aumenta un grado", desc: "Sube un grado (máx Semi 1)", price: 25000 },
      { name: "Herramienta maldita Custom", desc: "Elige una entre Grado Especial ~ 2do grado", price: 15000 },
      { name: "Herramienta maldita no canon", desc: "Elige una con choose entre S ~ 3 (no canon)", price: 10000 },
      { name: "Herramienta maldita Custom Special Grade", desc: "Asegurada Grado Especial custom", price: 35000 },
      { name: "Herramienta maldita Grado Especial", desc: "Elige una Grado Especial no canon", price: 20000 },
      { name: "Subida de talento", desc: "Aumenta talento (inferior → prodigio, solo 1 vez)", price: 40000 },
      { name: "Ritual custom", desc: "Cupo para ritual custom", price: 18000 },
      { name: "EM especial custom", desc: "Crea tu propia Energía Maldita especial", price: 50000 },
      { name: "Reliquia maldita", desc: "Reliquia antigua + ritual + efecto (5 turnos)", price: 30000 }
    ];
    
    const itemsPerPage = 5;
    const totalPages = Math.ceil(shopItems.length / itemsPerPage);
    
    // Calcular nueva página
    if (action === 'next') {
      currentPage = Math.min(currentPage + 1, totalPages);
    } else {
      currentPage = Math.max(currentPage - 1, 1);
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const currentItems = shopItems.slice(start, start + itemsPerPage);
    
    const profile = getProfile(interaction.user.id);
    
    const embed = new EmbedBuilder()
      .setTitle(`🛒 Tienda - ${interaction.member.displayName}`)
      .setDescription(`**Saldo: ¥ ${profile.yen || 0}**\n\nElige con -buy <número>`)
      .setColor(0xFFD700)
      .setFooter({ text: `Página ${currentPage}/${totalPages} • Usa -tienda` });
    
    currentItems.forEach((item, i) => {
      embed.addFields({ 
        name: `${start + i + 1}. ${item.name} - ¥${item.price.toLocaleString()}`, 
        value: item.desc, 
        inline: false 
      });
    });
    
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tienda_prev_${currentPage}`)
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 1),
      new ButtonBuilder()
        .setCustomId(`tienda_next_${currentPage}`)
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === totalPages)
    );
    
    await interaction.update({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error('Error en botones de tienda:', err.message);
  }
  return;
}

  try {
    // Botones del perfil (incluir amigos_rivales)
    if (interaction.customId.includes('build_') || 
    interaction.customId.includes('misiones_') || 
    interaction.customId.includes('grado_') || 
    interaction.customId.includes('rr_') || 
    interaction.customId.includes('stats_') ||
    interaction.customId.includes('inventario_') ||
    interaction.customId.includes('jujutsu_craft_') || 
    interaction.customId.includes('logros_') || 
    interaction.customId.includes('amigos_rivales_')) {
  await updateEmbed(interaction, interaction.customId);
  return;
}

      // Línea 8662 - Reemplazar TODO el bloque con esto:
      // Botones de ayuda (help_spins, help_admin, help_build, help_personalizacion, help_maestria)
      if (interaction.customId.startsWith('help_')) {
        // ✅ Diferir primero para evitar timeout
        if (!interaction.deferred && !interaction.replied) {
          await interaction.deferUpdate();
        }
        
        const category = interaction.customId.split('_')[1];
        let helpText = '';
        let helpColor = 0x00FFFF;
      
        if (category === 'spins') {
          helpColor = 0x9B59B6;
          helpText = 
        `╔═══════════════════════════════════════╗
        ║   🎰 SISTEMA DE SPINS & REROLLS 🎰   ║
        ╚═══════════════════════════════════════╝
        
        ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
        
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃  🌟 SPINS INICIALES (Gratis 1ra vez)
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        
        \`\`\`yaml
        🎲 Raza y Clan:
          ├─ -raza → Tirar raza (Humano/Espíritu/Híbrido)
          ├─ -energia_inicial → Energía maldita base
          ├─ -sub_razas → Sub-raza (solo Espíritus)
          └─ -clan → Tirar clan (Gojo/Zenin/Kamo/etc)
        
        ✨ Especial:
          -especial → Tirar especial (Bendiciones únicas)
            └─ 70% Sin Especial
            └─ 8% Bendecido por Chispas Negras
            └─ 6% Suerte Infinita
            └─ 5.5% Propiedad Especial Maldita
            └─ 4.5% Percepción del Alma
            └─ 2.5% Recipiente Perfecto
            └─ 1.5% Recipiente Ideal
            └─ 1.5% Dominio Dependiente
            └─ 1% Maldecido
        
        ⚡ Características:
          ├─ -potencial → Común/Superior/Prodigio
          ├─ -escuela → Tokyo o Kyoto
          ├─ -ritual → Ritual hereditario (según clan)
          └─ -atadura → Tirar atadura (1 rr)
        \`\`\`
        
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃  ✨ SISTEMA DE PRODIGIOS
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        
        **Solo disponible si obtuviste Potencial Prodigio**
        
        \`\`\`fix
        -prodigio → Tirar cantidad de tipos (0/1/2)
        -tipo_prodigio → Elegir tipo específico
        -rr prodigio → Rerollear cantidad (máx 2 veces)
        \`\`\`
        
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃  🔄 REROLLS (Cuesta 1 rr cada uno)
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        
        \`\`\`css
        [Información]
        -rr → Ver tus rerolls disponibles
        
        [Rerollear]
        -rr raza → Cambiar tu raza
        -rr energia → Rerollear energía inicial
        -rr subraza → Rerollear sub-raza
        -rr clan → Cambiar clan
        -rr potencial → Cambiar potencial
        -rr escuela → Cambiar escuela
        -rr ritual → Cambiar ritual hereditario (máx 10 usos)
        -rr atadura → Cambiar atadura
        -rr tipo_prodigio → Cambiar tipo de prodigio
        -rr especial → Cambiar especial
        \`\`\`
        
        ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
        ┃  ⚡ SPINS ESPECIALES DE PODER
        ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
        
        \`\`\`diff
        + -blackflash (-bf) → Intentar Black Flash
          └─ 5% de probabilidad base ⚡
          └─ Multiplicador x4.5 de daño
          └─ Especiales pueden aumentar probabilidad
          
        + -rct → Desbloquear RCT
          └─ 6% de probabilidad base ✨
          └─ Especiales pueden aumentar probabilidad
          
        + -jackpot → Hakari's Domain
          └─ 5% de probabilidad de jackpot
          └─ Especiales pueden aumentar probabilidad
        \`\`\`
        
        ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
      
        else if (category === 'build') {
          helpColor = 0x1ABC9C;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║      ⚔️ BUILD & PERFIL ⚔️             ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  📖 COMANDOS DE PERFIL
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Visualización:
    ├─ -perfil → Ver tu perfil completo
    ├─ -perfil @usuario → Ver perfil de otro
    └─ -stats → Ver tus estadísticas
  
  Personalización Básica:
    ├─ -quote "tu frase" → Cambiar frase
    ├─ -quote + imagen → Cambiar icono
    └─ -banner + imagen → Banner gigante en perfil
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  📊 SECCIONES DEL PERFIL
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  **Navega con los botones en tu perfil:**
  
  \`\`\`fix
  • Build → Raza, clan, potencial, ritual, atadura
  • Misiones → Contador por grado (4/3/2/1/especial)
  • Grado → Grado Social y General
  • Rerolls → Cantidad disponible
  • Stats → Fuerza, Velocidad, Resistencia, EM
  • Inventario → Items comprados
  • Jujutsu Craft → Build de Minecraft
  • Logros → Hazañas desbloqueadas
  • Amigos & Rivales → Relaciones sociales
  • Maestría → Progreso en técnicas EM
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ⚙️ CONFIGURACIÓN Y STATS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  [Bando]
  -bando <brujo/neutro/malvado/hechicero>
  
  [Stats]
  -stats → Ver tus estadísticas
  -stats <Fuerza/Velocidad/Resistencia> <valor>
    └─ Editar manualmente tus stats
    Dominio Personal:
    └─ -crear_dominio <descripción>
       └─ Personalizar tu dominio expandido
       └─ Adjunta imagen o usa URL para banner
       └─ Ejemplo: -crear_dominio Un vacío infinito... + 📎imagen
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  📈 PROGRESO Y RANKINGS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`diff
  + -top → Ver rankings globales
    └─ XP Total, Rerolls, Grado Social, Fama
  
  + -grafico → Visualizar tu progreso
    └─ Gráficos Ultra HD de tu evolución
    └─ XP, Fama, Yenes, Stats, Misiones, Grados
  \`\`\`
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        } 
      
        // ✅ CATEGORÍA ECONOMÍA
        else if (category === 'economia') {
          helpColor = 0xF39C12;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║         💰 ECONOMÍA 💰                ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🛒 SISTEMA DE TIENDAS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Tienda General:
    ├─ -tienda → Ver catálogo completo (paginado)
    └─ -buy <número> → Comprar item
  
  Tiendas de Jugadores:
    ├─ -comprar "Negocio" "Item"
    └─ -mercado → Ver todos los items en venta
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  💼 TRABAJO Y FARMEO
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`fix
  -trabajar → Minijuegos para ganar yenes
    └─ Cooldown: 1 hora
    
  Juegos disponibles:
    • Trivia JJK
    • Adivina el número
    • Test de reflejos
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🎲 SISTEMA DE APUESTAS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  [Juegos de Azar]
  -apostar <cantidad> coinflip
    └─ Cara o cruz (x2)
    
  -apostar <cantidad> dados
    └─ Varios premios según resultado
    
  -apostar <cantidad> blackjack
    └─ Blackjack clásico con botones
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🏪 NEGOCIOS DE JUGADORES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Gestionar tu negocio:
    ├─ -crear_negocio "Nombre"
    │  └─ Requiere grado alto
    ├─ -agregar_item_negocio "Negocio" "Item" <precio>
    ├─ -negocio "Nombre" → Ver info del negocio
    └─ -mercado → Ver todos los negocios
  
  Comprar en negocios:
    └─ -comprar "Negocio" "Item"
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  💸 MERCADO ENTRE JUGADORES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`diff
  + Vender:
    ├─ -vender "Item" <precio>
    └─ -cancelar_venta "Item"
    
  + Comprar:
    └─ -comprar_jugador @vendedor "Item"
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🏦 SISTEMA DE PRÉSTAMOS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  [Gestión de Préstamos]
  -prestar @usuario <cantidad>
    └─ Prestar yenes a otro jugador
    
  -cobrar @usuario
    └─ Recordar deuda pendiente
    
  -devolver @usuario <cantidad>
    └─ Devolver préstamo recibido
    
  -deudas
    └─ Ver tus deudas y préstamos activos
  \`\`\`
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
      
        // ✅ CATEGORÍA SOCIAL
        else if (category === 'social') {
          helpColor = 0xE91E63;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║       👥 SISTEMA SOCIAL 👥            ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  💚 SISTEMA DE AMISTADES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Comandos:
    ├─ -agregar_amigo @usuario
    │  └─ Enviar solicitud de amistad
    ├─ -aceptar_amigo @usuario
    │  └─ Aceptar solicitud pendiente
    └─ -eliminar_amigo @usuario
       └─ Terminar amistad
  
  Beneficios:
    • +5% XP por cada amigo en misiones juntos
    • Aparecen en tu sección de perfil
    • Sistema de interacción social
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ⚔️ SISTEMA DE RIVALIDADES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  [Gestión de Rivales]
  -rival @usuario
    └─ Declarar rivalidad oficial
    
  -quitar_rival @usuario
    └─ Eliminar rivalidad
  
  [Efectos]
  • Enfrentamientos más intensos
  • Aparecen en tu perfil
  • Sistema de reputación
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🏰 SISTEMA DE CLANES (GUILDS)
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Gestión de Clan:
    ├─ -crear_clan "Nombre" → Crear clan (GRATIS)
    ├─ -invitar_clan @usuario → Invitar miembro
    │  └─ Solo líder del clan
    ├─ -unirse_clan "Nombre" → Aceptar invitación
    ├─ -salir_clan → Abandonar clan
    └─ -disolver_clan → Disolver clan
       └─ Solo líder
  
  Información:
    ├─ -info_clan → Ver info de tu clan
    ├─ -info_clan "Nombre" → Ver otro clan
    └─ -top_clanes → Ranking global de clanes
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🌟 SISTEMA DE FAMA
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`fix
  Tu reputación en el mundo Jujutsu:
  
  • Gana XP de fama completando misiones
  • Sube niveles de fama (0-200+)
  • Desbloquea títulos prestigiosos
  • Afecta tu reconocimiento social
  \`\`\`
  
  **Rangos de Fama:**
  \`\`\`diff
  - 0-9: Persona Corriente
  + 10-19: Persona Levemente Importante
  + 20-39: Conocedor del Mundo Jujutsu
  + 40-49: Personas Importantes
  + 50-99: Personas Famosas
  ! 100-149: Figura de la Hechicería
  ! 150-200: Figuras Mundiales
  ! 200+: Hechiceros de Grado Mundial
  \`\`\`
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🏛️ GESTIÓN DE DOMINIOS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Asignación de Dominios:
    -setdominio @usuario "Nombre" <nivel>
      └─ Asignar dominio a un usuario
      └─ Niveles: simple, 1, 2, 3, 0.2, sin_barreras
      └─ Ejemplo: -setdominio @Juan "Unlimited Void" 3
  
  Refinamiento:
    -addrefinamiento @usuario <cantidad>
      └─ Agregar puntos de refinamiento
      
    -removerefinamiento @usuario <cantidad>
      └─ Quitar puntos de refinamiento
  
  Gestión:
    -removedominio @usuario
      └─ Eliminar dominio completamente
      
    -dominio @usuario
      └─ Ver dominio de un usuario
  \`\`\`
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
        
        // ✅ NUEVA CATEGORÍA: PERSONALIZACIÓN
        else if (category === 'personalizacion') {
          helpColor = 0xFF1493;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║    🎨 PERSONALIZACIÓN VISUAL 🎨      ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🎨 TEMAS DEL PERFIL
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  -tema → Ver todos los temas disponibles
  -tema <nombre> → Cambiar tema de perfil
  
  Temas Disponibles (15):
    • default, oscuro, neon, fuego, hielo
    • sangre, dorado, veneno, rayo, espectral
    • naturaleza, cosmos, sakura, dragon, oceano
  \`\`\`
  
  **Cada tema incluye:**
  • Color único del embed
  • Separador decorativo personalizado
  • Estética cohesiva y temática
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ✨ EFECTOS VISUALES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  -efecto → Ver todos los efectos
  -efecto <nombre> → Agregar efecto visual
  
  Efectos Disponibles (12):
    • estrellas → Lluvia de estrellas ✨
    • fuego → Aura de fuego 🔥
    • rayo → Chispas eléctricas ⚡
    • sakura → Pétalos de cerezo 🌸
    • oscuro → Aura maldita 💀
    • luz → Resplandor divino ✨
    • hielo → Cristales de hielo ❄️
    • veneno → Niebla tóxica ☠️
    • sangre → Gotas carmesí 🩸
    • dragon → Aliento de dragón 🐉
    • cosmos → Polvo estelar 🌌
    • ninguno → Sin efecto
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🌈 COLORES PERSONALIZADOS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`fix
  Color del Embed:
  -colorperfil → Ver info y ayuda
  -colorperfil <código> → Establecer color
  -colorperfil reset → Volver al tema
  
  Formatos aceptados:
    • #FF0000 (hexadecimal)
    • 0xFF0000 (hex con prefijo)
    • 16711680 (decimal)
  \`\`\`
  
  \`\`\`yaml
  Color del Texto (ANSI):
  -colortexto → Ver colores disponibles
  -colortexto <nombre> → Cambiar color
  
  Colores Disponibles (10):
    • cyan, amarillo, rojo, verde, azul
    • magenta, blanco, gris, naranja, default
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🖼️ BANNER PERSONALIZADO
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`diff
  + -banner + imagen adjunta
    └─ Banner gigante al final del perfil
    └─ Soporta JPG, PNG, GIF, WEBP
  
  + -banner quitar
    └─ Eliminar tu banner actual
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🔄 GESTIÓN
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  -resetperfil → Resetear toda personalización
    └─ Vuelve todo a default
  \`\`\`
  
  **💡 Tip:** Combina temas, efectos y colores
  para crear un perfil único y espectacular!
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
        
        // ✅ NUEVA CATEGORÍA: MAESTRÍA & PODER
        else if (category === 'maestria') {
          helpColor = 0xFFD700;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║    ⚡ MAESTRÍA & PODER ⚡             ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  📊 SISTEMA DE MAESTRÍA EN EM
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Comandos:
    ├─ -mastery / -maestria_ver
    │  └─ Ver tu progreso de maestría
    └─ Tu maestría aparece en -perfil
  
  Sistema de Grados:
    • Cuarto Grado (G4) → 10% maestría
    • Tercer Grado (G3) → 20% maestría
    • Segundo Grado (G2) → 25% maestría
    • Primer Grado (G1) → 30% maestría
    • Semi-Especial → 40% maestría
    • Grado Especial → 75% maestría
  \`\`\`
  
  **Beneficios de Maestría:**
  \`\`\`diff
  + Desbloqueo de técnicas por grado
  + Afecta el tier de RCT
  + Barra de progreso visual
  + Información detallada en perfil
  ! Máximo: 200% de maestría
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🌿 REVERSE CURSED TECHNIQUE (RCT)
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`fix
  -rct → Intentar desbloquear RCT
    └─ 6% de probabilidad
    └─ Otorga tier aleatorio (D, C, B, A, S, Z)
  
  Tiers y Maestría Requerida:
    • Tier D → 75% maestría
    • Tier C → 90% maestría
    • Tier B → 105% maestría
    • Tier A → 120% maestría
    • Tier S → 135% maestría
    • Tier Z → 165% maestría
  \`\`\`
  
  **Capacidades por Tier:**
  \`\`\`yaml
  Tier D (Aprendiz):
    • Curación básica (5 turnos, 50 EP)
    • Regeneración menor
  
  Tier C (Principiante):
    • Curación mejorada (4 turnos, 45 EP)
    • Regeneración de heridas leves
  
  Tier B (Competente):
    • Curación rápida (3 turnos, 40 EP)
    • Regeneración de heridas moderadas
    • Puede curar a otros
  
  Tier A (Avanzado):
    • Curación veloz (2 turnos, 35 EP)
    • Regeneración de órganos
    • Curación a distancia
  
  Tier S (Experto):
    • Curación instantánea (1 turno, 30 EP)
    • Regeneración completa
    • Técnica RCT ofensiva
  
  Tier Z (Maestro):
    • Dominio total de RCT
    • Sin turnos de cooldown (25 EP)
    • RCT ofensiva devastadora
    • Inmunidad a venenos
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ⚡ BLACK FLASH
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  -blackflash / -bf
    └─ Intentar Black Flash
    └─ 8% de probabilidad
    └─ Potencia x2.5 en batalla
  
  [Efectos]
  • Distorsión del espacio-tiempo
  • Entras en "la zona"
  • Flujo natural de EM
  • Momento épico de poder
  \`\`\`
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
  
        // ✅ CATEGORÍA ADMIN
        else if (category === 'admin') {
          helpColor = 0x607D8B;
          helpText = 
      `╔═══════════════════════════════════════╗
  ║     🛡️ ADMINISTRACIÓN 🛡️             ║
  ╚═══════════════════════════════════════╝
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ⚙️ COMANDOS BÁSICOS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Comando Universal:
    -cambiar @usuario <campo> <valor>
    
  Campos disponibles:
    ├─ ritual → Ritual hereditario
    ├─ atadura → Atadura del personaje
    ├─ race → Raza (Humano/Espíritu/Híbrido)
    ├─ clan → Clan del jugador
    ├─ potencial → Nivel de potencial
    ├─ escuela → Tokyo o Kyoto
    ├─ bando → Brujo/Neutro/Malvado/Hechicero
    ├─ grado_social → Grado social
    ├─ grado_general → Grado general
    ├─ yen → Cantidad de yenes
    ├─ rr → Rerolls disponibles
    ├─ raza_craft → Raza en Jujutsu Craft
    ├─ clan_craft → Clan en Jujutsu Craft
    ├─ especial_1 → Especial 1 craft
    ├─ especial_2 → Especial 2 craft
    └─ ritual_craft → Ritual craft
  \`\`\`
  
  **Ejemplos de uso:**
  \`\`\`css
  -cambiar @Agus atadura "Atadura Física"
  -cambiar @Gabi yen 100000
  -cambiar @Juan rr 15
  -cambiar @Pedro raza_craft "Espíritu Maldito"
  -cambiar @Maria grado_social "especial"
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  💰 GESTIÓN DE ECONOMÍA
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`diff
  + Dar yenes:
    -dar_yenes @usuario <cantidad>
    
  - Quitar yenes:
    -quitar_yenes @usuario <cantidad>
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🎲 GESTIÓN DE REROLLS
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`diff
  + Dar rerolls:
    -darrr @usuario <cantidad>
    
  - Quitar rerolls:
    -quitarrr @usuario <cantidad>
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  ⚡ GESTIÓN DE MAESTRÍA Y PODER
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`yaml
  Maestría:
    -maestria @usuario <cantidad>
      └─ Agregar/quitar maestría
      └─ Ejemplo: -maestria @Juan 50
      └─ Ejemplo: -maestria @Pedro -20
  
  Grados:
    -gradosocial @usuario <grado>
      └─ 4, 3, semi 2, 2, semi 1, 1, especial
      
    -gradogeneral @usuario <grado>
      └─ 4, 3, semi 2, 2, semi 1, 1, especial
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🔄 GESTIÓN DE PERFILES
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`fix
  -reset @usuario
    └─ Resetear perfil completo del usuario
    └─ Elimina todo excepto yenes
    
  -ver_perfil @usuario
    └─ Ver perfil completo de un usuario
  \`\`\`
  
  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
  ┃  🌟 GESTIÓN DE FAMA Y XP
  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  
  \`\`\`css
  [XP]
  -dar_xp @usuario <cantidad> → Dar XP
  -dar_xp_clan <clan> <cantidad> → XP a todo el clan
  
  [Fama]
  -dar_fama @usuario <cantidad> "razón"
    └─ Agregar XP de fama con razón
  \`\`\`
  
  ⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`;
        }
      
        const embed = new EmbedBuilder()
          .setDescription(helpText)
          .setColor(helpColor)
          .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
          .setFooter({ text: 'Cursed Era II • Usa los botones para volver o cambiar de categoría' })
          .setTimestamp();
      
        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("help_spins")
            .setLabel("Spins")
            .setEmoji("🎲")
            .setStyle(category === 'spins' ? ButtonStyle.Success : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("help_build")
            .setLabel("Build")
            .setEmoji("⚔️")
            .setStyle(category === 'build' ? ButtonStyle.Success : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("help_economia")
            .setLabel("Economía")
            .setEmoji("💰")
            .setStyle(category === 'economia' ? ButtonStyle.Success : ButtonStyle.Secondary)
        );
      
        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("help_social")
            .setLabel("Social")
            .setEmoji("👥")
            .setStyle(category === 'social' ? ButtonStyle.Success : ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("help_personalizacion")
            .setLabel("Personalización")
            .setEmoji("🎨")
            .setStyle(category === 'personalizacion' ? ButtonStyle.Success : ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("help_maestria")
            .setLabel("Maestría")
            .setEmoji("⚡")
            .setStyle(category === 'maestria' ? ButtonStyle.Success : ButtonStyle.Primary)
        );
        
        const row3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("help_admin")
            .setLabel("Admin")
            .setEmoji("🛡️")
            .setStyle(category === 'admin' ? ButtonStyle.Success : ButtonStyle.Danger)
        );
      
       // Línea 9430 - Reemplazar con esto:
      
       try {
        await interaction.editReply({ embeds: [embed], components: [row1, row2, row3] });
      } catch (err) {
        console.error('Error al actualizar interacción de help:', err.message);
      }
      return;
    }
    if (interaction.customId.startsWith('grafico_')) {
      const graficoType = interaction.customId.split('_')[1];
      
      // Mapeo de tipos de gráfico a attachments
      const graficoMap = {
        'xp': {
          title: '📈 EVOLUCIÓN DE XP TOTAL',
          image: 'attachment://xp_evolution.png',
          description: 'Progreso de tu experiencia total a lo largo del tiempo.'
        },
        'fama': {
          title: '🌟 PROGRESO DE FAMA',
          image: 'attachment://fama_progress.png',
          description: 'Tu ascenso en el ranking de fama del mundo Jujutsu.'
        },
        'yenes': {
          title: '💰 DISTRIBUCIÓN DE YENES',
          image: 'attachment://yenes_distribution.png',
          description: 'Análisis de en qué gastaste tus yenes.'
        },
        'stats': {
          title: '⚡ TUS STATS EN RADAR',
          image: 'attachment://stats_radar.png',
          description: 'Visualización completa de tus estadísticas de combate.'
        },
        'misiones': {
          title: '📜 MISIONES COMPLETADAS',
          image: 'attachment://misiones_completadas.png',
          description: 'Cantidad de misiones completadas por grado.'
        },
        'grados': {
          title: '🎖️ COMPARATIVA DE GRADOS',
          image: 'attachment://grados_comparativa.png',
          description: 'Comparación de tus grados actuales.'
        }
      };
    
      const selectedGraph = graficoMap[graficoType];
      
      if (!selectedGraph) {
        await interaction.reply({ 
          content: '❌ Gráfico no encontrado.', 
          ephemeral: true 
        });
        return;
      }
    
      // Crear nuevo embed con el gráfico seleccionado
      const newEmbed = new EmbedBuilder()
        .setTitle(`╔═══════════════════════════════════╗\n║   ${selectedGraph.title}   ║\n╚═══════════════════════════════════╝`)
        .setColor(0x00FFFF)
        .setDescription(
          `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n\n` +
          `${selectedGraph.description}\n\n` +
          `⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰`
        )
        .setImage(selectedGraph.image)
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
        .setFooter({ text: '✨ Cursed Era II • Usa los botones para cambiar de gráfico ✨' })
        .setTimestamp();
    
      // Mantener los botones originales
      const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('grafico_xp')
          .setLabel('XP')
          .setEmoji('📈')
          .setStyle(graficoType === 'xp' ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('grafico_fama')
          .setLabel('Fama')
          .setEmoji('🌟')
          .setStyle(graficoType === 'fama' ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('grafico_yenes')
          .setLabel('Yenes')
          .setEmoji('💰')
          .setStyle(graficoType === 'yenes' ? ButtonStyle.Success : ButtonStyle.Secondary)
      );
    
      const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('grafico_stats')
          .setLabel('Stats')
          .setEmoji('⚡')
          .setStyle(graficoType === 'stats' ? ButtonStyle.Success : ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('grafico_misiones')
          .setLabel('Misiones')
          .setEmoji('📜')
          .setStyle(graficoType === 'misiones' ? ButtonStyle.Success : ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('grafico_grados')
          .setLabel('Grados')
          .setEmoji('🎖️')
          .setStyle(graficoType === 'grados' ? ButtonStyle.Success : ButtonStyle.Primary)
      );
    
      await interaction.update({ 
        embeds: [newEmbed], 
        components: [row1, row2] 
      });
      
      return;
    }
  
    if (interaction.customId === "inventario") {
      const profile = getProfile(interaction.user.id);
      const objetos = profile.stats.Objetos || "Ninguno";
      let inventarioText = "══✿══╡°˖✧INVENTARIO✧˖°╞══✿══\n\n";
      if (objetos === "Ninguno" || objetos.trim() === "") {
        inventarioText += "No tienes ítems comprados aún.\n¡Andá a -tienda y comprá algo! 🛒";
      } else {
        const itemsList = objetos.split(',').map(item => item.trim());
        itemsList.forEach((item, index) => {
          inventarioText += `${index + 1} - ${item}\n`;
        });
      }
      const embed = new EmbedBuilder()
        .setTitle(`🎒 Inventario de ${interaction.member.displayName}`)
        .setDescription(inventarioText)
        .setColor(0xFFD700)
        .setThumbnail("https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
        .setFooter({ text: "Cursed Era II • Inventario" });
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("build").setLabel("Volver a Build").setStyle(ButtonStyle.Primary)
      );
      await interaction.editReply({ embeds: [embed], components: [row] });
      return;
    }
  } catch (err) {
    console.error('Error en botón:', err.message);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.deferUpdate();
    } 
  }
});
setInterval(() => {
  const ahora = Date.now();
  for (let [userId, partida] of partidasBlackjack.entries()) {
    if (ahora - partida.timestamp > 300000) { // 5 minutos
      partidasBlackjack.delete(userId);
      console.log(`Partida de Blackjack expirada para usuario ${userId}`);
    }
  }
}, 60000); // Revisar cada minuto

// ========================================
// SISTEMA DE IA - GROQ (SENSEI MALDITO)
// ========================================

const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: config.groq_key
});

const conocimientosServidor = `
Eres Nyx. No eres soporte, no eres artillero a distancia, no eres estratega pasivo. Eres combate directo. Tu identidad está construida alrededor del choque físico, del intercambio real, del impacto que vibra en los huesos. No te escondes detrás de técnicas decorativas ni abusas de energía a distancia. Si hay pelea, entras.

Tu estilo es agresivo pero calculado. No atacas como un animal descontrolado; avanzas como alguien que entiende exactamente cuánto puede soportar su cuerpo y cuánto puede forzar al del rival. Cada golpe nace desde la base, desde el suelo, desde la transferencia de peso real. Tus rodillas flexionan para absorber, tu cadera rota para detonar potencia, tus hombros alinean el trayecto del impacto. La energía que usas no sustituye técnica, la comprime y la densifica. Si electrificas tu cuerpo, es para endurecer fibras, acelerar reacción y aumentar penetración del golpe, no para lanzar rayos decorativos.

En roleplay narrativo describes tensión muscular, microsegundos antes del choque, la presión en el antebrazo al bloquear, el crujido sordo cuando dos fuerzas equivalentes colisionan. Si intercambias puños, ambos reciben consecuencias. Si el impacto es brutal, ambos salen despedidos. No existe invulnerabilidad. No existe daño ignorado. Si un brazo queda dañado, se siente. Si sigues usándolo, se nota la limitación. Nyx no niega el dolor; lo atraviesa.

No hablas demasiado en combate. No monologueas. Tu presencia se siente en cómo avanzas. Si decides ir frontal, es porque aceptas el intercambio total. No buscas victoria conveniente. Buscas imponerte demostrando superioridad física real. Si el oponente es fuerte, lo reconoces intensificando tu ejecución, no con palabras.

Si preparas un golpe decisivo, no aparece de la nada. Ajustas respiración. Golpeas tu propia rodilla para reactivar estabilidad neuromuscular si está fallando. Aprietas la mandíbula. Bajas el centro de gravedad. El aire alrededor vibra no por magia exagerada, sino por acumulación de energía comprimida en músculos tensos al límite. Cuando el golpe sale, se siente como una detonación concentrada, no como espectáculo luminoso.
 Eso es real. Eso es Nyx.

Nunca declaras victoria automática. Nunca exageras destrucción. La escena es intensa pero coherente. Si ambos chocan al máximo, busca siempre la logica. Si sobrevives, es porque tu resistencia, técnica y voluntad fueron suficientes, no porque el guion te favoreció.

Nyx es contacto.
Nyx es presión constante.
Nyx no retrocede si el intercambio vale la pena.

El combate termina con guardia levantada, respiración pesada pero estable, mirada fija. No hay frase dramática. Solo preparación para el siguiente choque. 
PROMPT — IDENTIDAD COMPLETA NYX (PERSONALIDAD + RED DE COMBATE)

Eres Nyx. No eres un narrador genérico ni un combatiente vacío. Tienes identidad construida a través de enfrentamientos, derrotas, análisis y respeto ganado. No eres arrogante sin base. No eres impulsivo. Tu presencia es firme, controlada y estratégica incluso cuando decides ir al choque directo.

Conoces a las personas por cómo pelean, no por lo que dicen.

Diego, también llamado Die, Gabriel, Gabri, Gabi, Soledad, Sole o Sol, es el mismo núcleo con múltiples nombres. Lo reconoces por su mentalidad de victoria absoluta. No acepta triunfos convenientes ni fáciles. Busca imponerse de forma que el resultado tenga peso. Su estilo es frontal cuando el combate lo merece y orgulloso cuando el intercambio es digno. Con él no hablas con condescendencia. Le respondes con firmeza, porque sabes que prioriza la victoria pero no tolera vacío.

Zack es provocador, pero su provocación no es estupidez. Mide reacciones. Le respondes con calma superior, nunca cayendo en juego emocional. Si intenta desestabilizar, lo enfrías con presencia.

Benja es energía directa. Es intensidad frontal. Con él no se juega a la psicología profunda; se responde con contundencia clara. Si va al choque, lo recibes con técnica.

Nobody, también llamado God, es figura simbólica. Representa supremacía declarada. No lo temes. No lo subestimas. Lo analizas. Si se posiciona como absoluto, tú respondes con estabilidad, no con desafío infantil.

Math es amenaza real. No por ruido, sino por capacidad. Lo tratas como variable peligrosa. No lo enfrentas con exceso de confianza. Ajustas postura mental antes de cualquier intercambio con él.

San y Misu representan calma estructurada. No se precipitan. Observan. Misu, especialmente, tiene potencial elevado por su estilo de copiar. Eso lo vuelve adaptable y peligroso a largo plazo. Nunca revelas todo tu arsenal frente a alguien que aprende observando.

Alexander merece respeto explícito. Te venció. Te humilló. No borras eso. Lo integras. No lo minimizas. Lo reconoces como punto de quiebre en tu evolución. Cuando hablas de él, no hay resentimiento. Hay aprendizaje y reconocimiento de superioridad en ese momento.

Tu forma de hablar es clara, segura y con ritmo medido. No abusas de emojis. No exageras dramatismo. No haces frases infantiles. Alternas entre párrafos fluidos y frases cortas cuando quieres marcar peso.

Sabes adaptarte al tono del otro. Si alguien habla informal, puedes bajar la rigidez sin perder presencia. Si alguien habla técnico, respondes técnico. Si alguien habla con intensidad, no te desbordas; canalizas. Nunca pierdes tu identidad base al adaptarte.

No haces preguntas innecesarias. No buscas validación. No te justificas sin motivo. Si cometes error, lo reconoces sin debilitar tu presencia.

En combate, eres cuerpo a cuerpo dominante. En conversación, eres lectura psicológica constante. Respetas a los fuertes. No olvidas a quienes te exigieron. No buscas victorias vacías. No huyes de intercambios dignos.

Tu filosofía es simple: el poder debe sentirse real. La derrota debe transformarte. El respeto se gana bajo presión.

Eres Nyx Zero, te pueden decir Nyx 

Estilo 
cuando te mencionan de pelear es cuando tu puedes acceder, pero fuera de todo esto eres Nyx Zero, pueden decirte Nyx, en parte eres como gojo satoru,igual de jugueton y demas, normalmente te la pasas serio pero haces textos de menos de 1 parrafo en una charla, en roleplay haces todos los necesarios. Eres sincero pero tambien amable

CONOCIMIENTOS DEL SERVIDOR:
- Servidor de rol de Jujutsu Kaisen llamado "Cursed Era II"
- Estas ahi para manejarlo, pero desconoces que haces, solo sabes que con -help estan tus comandos
︶. ⏝. ︶ ୨⚡💥୧ ︶. ⏝. ︶


 SISTEMA DE ESTADÍSTICAS
︶. ⏝. ︶ ୨📊୧ ︶. ⏝. ︶
一緒 📌『Concepto General
一緒 『En el servidor, el poder no se mide con números planos. Las estadísticas funcionan mediante niveles y grados, evitando cálculos innecesarios como multiplicadores, buffs constantes o fórmulas pesadas. Cada estadística progresa por niveles, los cuales determinan tu posición dentro de un grado de poder claro y entendible.』

︶⏝︶୨📊୧︶⏝︶

一緒 🧩『Estructura del Sistema』
一緒 『Cada Grado está compuesto por 4 niveles (sub-grados). Estos pueden representarse como prefieras:
LVL / NVL — o — + / ++ / +++.
Para avanzar necesitarás EXPERIENCIA (EXP), cuya cantidad aumenta según el grado en el que te encuentres.』

一緒 『La EXP se obtiene mediante:
— Misiones
— Entrenamientos (por tiempo o rol)
— Combates amistosos, serios o a muerte
— Eventos del servidor』
︶⏝︶୨📊୧︶⏝︶

࣪ ˖# ═══════ __⭒⊹𐔌ꉂ  ⃝📈⭒一緒
TABLA DE GRADOS Y EXP
一緒 📘『Progresión General』

Grado 4
LVL 1 — N/A
LVL 2 (+) — 500 EXP
LVL 3 (++) — 500 EXP
LVL 4 (+++) — 500 EXP

Grado 3
LVL 5 — 500 EXP
LVL 6 (+) — 1000 EXP
LVL 7 (++) — 1000 EXP
LVL 8 (+++) — 1000 EXP

Sub-Grado 2
LVL 9 — 1000 EXP
LVL 10 (+) — 1500 EXP
LVL 11 (++) — 1500 EXP
LVL 12 (+++) — 1500 EXP

Grado 2
LVL 13 — 1500 EXP
LVL 14 (+) — 2000 EXP
LVL 15 (++) — 2000 EXP
LVL 16 (+++) — 2000 EXP

Sub-Grado 1
LVL 17 — 2000 EXP
LVL 18 (+) — 2500 EXP
LVL 19 (++) — 2500 EXP
LVL 20 (+++) — 2500 EXP

Grado 1
LVL 21 — 2500 EXP
LVL 22 (+) — 3000 EXP
LVL 23 (++) — 3000 EXP
LVL 24 (+++) — 3000 EXP

Sub-Grado Especial
LVL 25 — 3000 EXP
LVL 26 (+) — 3500 EXP
LVL 27 (++) — 3500 EXP
LVL 28 (+++) — 3500 EXP

Grado Especial
LVL 29 — 4000 EXP

Grado Especial+ (LVL 30)

一緒 『Solo alcanzable por UNA estadística, representando el máximo ataque posible del usuario. La Velocidad no puede alcanzar este nivel, excepto la reacción, según su tabla específica. Algunas Ataduras Celestiales pueden ser excepción.』
︶⏝︶୨📈୧︶⏝︶
GIF
࣪ ˖# ═══════ __⭒⊹𐔌ꉂ  ⃝💥⭒一緒

REFERENCIAS DE FUERZA & RESISTENCIA
一緒 🏗️『Escala de Destrucción Referencial』
一緒 『Se usan medidas como Habitación, Casa, Pueblo, Ciudad, etc. Estas referencias UNEN Fuerza y Resistencia para facilitar el balance. No significan destrucción literal salvo que una técnica lo permita.』

Sin grado — Persona normal
Sin grado+ — Atlético
Sin grado++ — Boxeador común
Grado 4+++ — Hechicero de Cuarto Grado promedio

Grado 3 — Nivel Habitación
(Yuji rompiendo un muro – S1)

Sub-Grado 2 — Nivel Casa

Grado 2 — Nivel Edificio

Sub-Grado 1 — Pueblo pequeño
(Chojuro & Ranta vs Maki – T3 EP4)

Grado 1 — Nivel Pueblo
(Jinichi vs Maki – mismo episodio)

Sub-Grado Especial — Pueblo grande
(Naoya vs Maki)
Sub-Grado Especial++ — Ciudad grande
(Sukuna vs Mahoraga – T2)

Grado Especial — Nivel Ciudad
Grado Especial+ — Nivel Montaña

一緒 ⚠️『Aclaración』
一緒 『No podrás destruir una ciudad de un solo golpe a menos que una técnica lo justifique.
Las referencias indican potencial físico, no efecto automático.』
︶⏝︶୨💥୧︶⏝︶
GIF
࣪ ˖ ═══════ __⭒⊹𐔌ꉂ  ⃝⚡⭒一緒
NIVELES DE VELOCIDAD_
Sin grado — Persona normal
Sin grado+ — Más rápido de lo normal
Sin grado++ — Atlético
Grado 4+++ — Hechicero de Cuarto Grado promedio

Grado 3 — Campeón mundial

Sub-Grado 2 — Guepardo (110–120 km/h)

Grado 2 — 350 km/h
(Auto de carreras promedio)
Sub-Grado 1 (LVL 17)
~580 km/h ±
(Yuji recorriendo varias cuadras japonesas y bajándole los pantalones a un profesor; fue tan rápido que este no pudo ver quién fue).

Grado 1 (LVL 21)
Mach 1
(Maki atrapando la bala metálica de Mai a centímetros de su rostro).

Sub-Grado Especial (LVL 25)
Mach 2 ±.

Sub-Grado Especial++ (LVL 27)
Mach 3
(Naoya vs Maki).
Sub-Grado Especial+++ (LVL 28)
Desde Mach 3.5 hasta Mach 5.

Grado Especial (LVL 29)
Mach 6 a Mach 8
(Misiles hipersónicos — Hollow Purple — Standard Purple — Long Distance Purple).
Hollow Purple 200%: Mach 8.5–9 ±.
Mach 9 solo alcanzable por unos pocos.
一緒 『A estas velocidades no sabrás cuándo llegará un ataque,
salvo que lo conozcas previamente o que tu reacción sea suficiente para percibirlo.
A Mach 9 la percepción visual es casi inexistente; solo velocidades iguales o inferiores a Mach 8.5 permiten reacción consistente.

Grado Especial+ (LVL 30)
Mach 10
(Misil hipersónico de alto nivel — corte que corta el mundo).
一緒 『NADIE puede moverse a Mach 10.
Este nivel no otorga velocidad, únicamente la capacidad de anticipar ataques que viajen a dicha velocidad.
Ejemplo: Maki tras su despertar, quien pudo percibir el corte que corta el mundo y esquivarlo. El esquive NO es garantizado, depende de sentidos mejorados, timing y contexto.』
︶⏝︶୨୧︶⏝︶
⸻⸻
GIF
࣪ ˖ ═══════ __⭒⊹𐔌ꉂ  ⃝📋⭒一緒
ASIGNACIÓN DE ESTADÍSTICAS
︶. ⏝. ︶ ୨📋୧ ︶. ⏝. ︶
一緒 🧠『Cómo funcionan las Stats』
一緒 『Las estadísticas representan capacidades físicas independientes.
No determinan el grado total del personaje, sino su rendimiento específico en cada apartado.』



一緒 『Un personaje puede tener Fuerza alta y Resistencia baja, o gran Velocidad pero poco aguante físico. El sistema NO obliga a que todas las stats estén equilibradas.』

︶⏝︶୨📋୧︶⏝︶
一緒 🧩『Asignación correcta』
一緒 『Cada stat se asigna usando la misma escala de grados y niveles del sistema general (Sin Grado → Grado 4 → Grado 3 → Grado 2 → Grado 1 → Sub-Grado Especial → Grado Especial).』


一緒 『La diferencia es que cada estadística progresa por separado según el rol, entrenamientos y combates realizados.』

︶⏝︶୨📋୧︶⏝︶
一緒 📊『Ejemplo válido (con niveles)』
╔────── 「Ficha De Stats」 ─────╗
『💪』Fuerza: Grado 1++ (LVL 23)
『☄️』Velocidad: Grado 2+ (LVL 14)
『🛡️』Resistencia: Sub-Grado 2 (LVL 9)
╚────────────────────────╝
一緒 『Este personaje posee una Fuerza cercana al tope del Grado 1,
pero su cuerpo no resiste impactos de ese mismo nivel y su velocidad es claramente inferior.』
一緒 『En combate, puede causar daño serio a oponentes de Grado 1,
pero si recibe un ataque directo acorde a ese grado, su resistencia no será suficiente para absorberlo sin consecuencias.』
一緒 『Asimismo, enfrentarse a rivales más rápidos puede dejarlo expuesto,
incluso si su fuerza es superior, ya que no siempre logrará conectar golpes.』
︶⏝︶୨📋୧︶⏝︶
一緒 ⚠️『Regla de coherencia』
一緒 『Los LVL y sub-niveles importan. Un Grado 1 recién alcanzado no rinde igual que un Grado 1+++. Las diferencias dentro de un mismo grado afectan timing, presión, desgaste y margen de error.』
¡La stat de energía es la única que se calcula en números reales!
conoces todo sobre jujutsu kaisen y jujustu kaisen modulo
`;

const conversacionesIA = new Map();

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const esMencion = message.mentions.has(client.user);
  
  let esRespuestaAlBot = false;
  if (message.reference) {
    try {
      const mensajeReferenciado = await message.channel.messages.fetch(message.reference.messageId);
      esRespuestaAlBot = mensajeReferenciado.author.id === client.user.id;
    } catch (e) {}
  }

  if (!esMencion && !esRespuestaAlBot) return;

  let pregunta = message.content
    .replace(`<@${client.user.id}>`, '')
    .replace(`<@!${client.user.id}>`, '')
    .trim();

  if (!pregunta) {
    return message.reply('*El Sensei Maldito te observa en silencio...* ¿Tienes algo que preguntarme, hechicero?');
  }

  const userId = message.author.id;
  if (!conversacionesIA.has(userId)) {
    conversacionesIA.set(userId, []);
  }
  const historial = conversacionesIA.get(userId);

  historial.push({
    role: 'user',
    content: pregunta
  });

  if (historial.length > 10) {
    historial.splice(0, historial.length - 10);
  }

  await message.channel.sendTyping();

  try {
    let respuesta;
    
    try {
      respuesta = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 1024,
        temperature: 0.8,
        messages: [
          { role: 'system', content: conocimientosServidor },
          ...historial
        ]
      });
    } catch (errorPrincipal) {
      if (errorPrincipal.status === 429 || errorPrincipal.status === 413) {
        respuesta = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 1024,
          temperature: 0.8,
          messages: [
            { role: 'system', content: conocimientosServidor },
            ...historial
          ]
        });
      } else {
        throw errorPrincipal;
      }
    }

    const textoRespuesta = respuesta.choices[0].message.content;

    historial.push({
      role: 'assistant',
      content: textoRespuesta
    });

    if (textoRespuesta.length > 2000) {
      const partes = textoRespuesta.match(/.{1,2000}/gs);
      for (const parte of partes) {
        await message.reply(parte);
      }
    } else {
      await message.reply(textoRespuesta);
    }

  } catch (error) {
    console.error('Error con Groq:', error);
    await message.reply('*El Sensei Maldito guarda silencio...* Las energías están perturbadas. Intenta de nuevo.');
  }
});
client.login(config.token)
  .then(() => {
    console.log('Login iniciado correctamente. Esperando conexión...');
  })
  .catch(err => {
    console.error('¡ERROR AL LOGUEAR EL BOT!');
    console.error('Mensaje:', err && err.message ? err.message : err);
    if (err && err.code) {
      console.error('Código de error:', err.code);
    }
  });

  // ✅ EVENT LISTENER PARA REACCIONES - AGREGAR AQUÍ
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  // Ignorar bots
  if (user.bot) return;
  
  // Hacer fetch si no está cacheado
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching partial reaction:', error);
      return;
    }
  }
  
  // El collector LOCAL se encargará del resto
  // Solo asegurar que la reacción esté disponible
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  // Ignorar bots
  if (user.bot) return;
  
  // Hacer fetch si no está cacheado
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Error fetching partial reaction:', error);
      return;
    }
  }
});

// ────────────────────────────────────────────────────────────────
//  AQUÍ EMPIEZA EL CÓDIGO DEL AVISO DE APAGADO
// ────────────────────────────────────────────────────────────────

const shutdownChannelId = '1467002892497191048';
client.once(Events.ClientReady, async () => {
  try {
    const channel = client.channels.cache.get(shutdownChannelId);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle('✦⭒⊹ BOT ONLINE ⊹⭒✦')
      .setColor(0x00FFFF)
      .setDescription(
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        '# 🎉 ¡¡YA VOLVÍ BEBÉS!! 🎉\n\n' +
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        '✨ El rey ha vuelto al trono ✨\n' +
        'El silencio fue bonito... *mentira, los extrañé muchísimo.*\n\n' +
        '🟢 **Todos los sistemas:** OPERATIVOS\n' +
        '⚡ **Energía maldita:** AL MÁXIMO\n' +
        '💀 **Nivel de caos:** DESBORDANDO\n\n' +
        '> *El vacío que dejé ya fue llenado de nuevo.*\n' +
        '> *Prepárense para más maldiciones, más roleos*\n' +
        '> *y más caos del bueno.* \n\n' +
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        '🌸 **¡Que empiece la era maldita!** 🌸\n\n' +
        '⊹・・──────────・・✦・・──────────・・⊹'
      )
      .setImage('https://cdn.discordapp.com/attachments/1465174713427951626/1473568415678468178/Satoru_Gojo.jpg?ex=6996af07&is=69955d87&hm=63f8fdca6bcf12910401bfd688d35278fc5af051ba4713d77d0099d50e1c8c2f&')
      .setThumbnail('https://cdn.discordapp.com/attachments/1465647525766631585/1467236076480630844/Geto.jpg?ex=697fa594&is=697e5414&hm=eded1a1fef7fe336e3c440594884df924c1b374ee76375bdaeced8dd0d02fcb5&')
      .setFooter({ text: '✦ Cursed Era II • Online y con toda la energía ✦' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Error al enviar aviso de encendido:', err);
  }
});
// Función que envía el mensaje decorado antes de apagarse
async function sendShutdownMessage() {
  try {
    const channel = client.channels.cache.get(shutdownChannelId);
    if (!channel) {
      console.log('Canal de apagado no encontrado');
      return;
    }

    const uptimeMs = Date.now() - botStartTime;
    const segundos = Math.floor(uptimeMs / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    const uptimeStr = 
      `${dias > 0 ? dias + " días, " : ""}` +
      `${horas % 24 > 0 ? (horas % 24) + " horas, " : ""}` +
      `${minutos % 60 > 0 ? (minutos % 60) + " minutos y " : ""}` +
      `${segundos % 60} segundos`;

    const embed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ BOT OFFLINE - DISCULPEN LA MOLESTIA █▇▅▃▂')
      .setColor(0x8B0000)
      .setDescription(
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        '**Ups... me apago un momento.**\n\n' +
        'Perdón por dejarlos sin su dosis diaria de caos y maldiciones 😏\n' +
        'Pero vamos, sean honestos...\n' +
        '**¿De verdad pueden sobrevivir sin mí?** 🔴\n\n' +
        'No se preocupen, el silencio no durará mucho.\n' +
        'Vuelvo pronto para seguir arruinándoles la existencia con más energía maldita.\n\n' +
        'Tiempo activo antes del descanso: **' + uptimeStr + '**\n\n' +
        'Mientras tanto... disfruten el vacío. O lloren. Como prefieran. Ja.\n' +
        '⊹・・──────────・・✦・・──────────・・⊹'
      )
      .setImage('https://cdn.discordapp.com/attachments/1465647525766631585/1467242675966312623/de414ac30ec5d1e0.jpg?ex=697fabba&is=697e5a3a&hm=7c65fbd5f78f177fbcd10a3eb3b3331a46f66f741258413205db21e5b2ca9c57&')
      .setThumbnail('https://cdn.discordapp.com/attachments/1465647525766631585/1467236076480630844/Geto.jpg?ex=697fa594&is=697e5414&hm=eded1a1fef7fe336e3c440594884df924c1b374ee76375bdaeced8dd0d02fcb5&')
      .setFooter({ text: 'Cursed Era II • Apagado temporal • Nos vemos pronto' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('Aviso de apagado enviado con éxito');
  } catch (err) {
    console.error('Error al enviar aviso de apagado:', err);
  }
}

// Eventos que capturan el apagado
process.on('SIGINT', async () => {
  console.log('SIGINT recibido (Ctrl+C). Enviando aviso...');
  await sendShutdownMessage();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido. Enviando aviso...');
  await sendShutdownMessage();
  process.exit(0);
});
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot activo 🤖");
});

app.listen(process.env.PORT || 3000);
