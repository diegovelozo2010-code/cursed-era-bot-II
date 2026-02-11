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

// ← FALTABA LA FUNCIÓN getProfile - AHORA AGREGADA
function getProfile(userId) {
  if (!db.users[userId]) {
    db.users[userId] = {
      race: "Sin tirar",
      clan: "Sin tirar",
      sub_raza: null,
      energia_inicial: null, 
      escuela: "Sin tirar",
      potencial: "Sin tirar",
      ritual_hereditario: "Sin tirar",
      atadura: null,
      rr: 5,
      bando: null,
      cantidad_prodigios: null,
      tipos_prodigio: [],
      rr_prodigio_usados: 0,
      grado_social: "Sin grado",
      grado_general: "Sin grado",
      tecnica: "Sin definir",
      xp_total: 0,
      quote: null,
      icon: null,
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
      misiones: { "4": 0, "3": 0, "2": 0, "1": 0, "especial": 0 },
      stats: {
        fuerza: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        velocidad: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        resistencia: { grado: "Sin grado", nivel: 1, sub: "", xp: 0 },
        "Energía Maldita": 0,
        Objetos: "Ninguno",
        Personaje: "Ninguno"
      },
      rct: false,
      // ✅ NUEVO: Buffos de prodigio aplicados
      buffos_prodigio_aplicados: false
    };
    saveDB();
    console.log(`Perfil creado para ${userId}`);
  }
  return db.users[userId];
}

const raceProbs = [
  { race: 'Humano', prob: 0.4995 },
  { race: 'Espíritu Maldito', prob: 0.4995 },
  { race: 'Híbrido', prob: 0.05 },
];

const clanProbs = [
  { clan: 'Gojo', prob: 0.04 },
  { clan: 'Itadori', prob: 0.05 },
  { clan: 'Zenin', prob: 0.04 },
  { clan: 'Kamo', prob: 0.06 },
  { clan: 'Inumaki', prob: 0.03 },
  { clan: 'Ashiya', prob: 0.08 },
  { clan: 'Kugisaki', prob: 0.15 },
  { clan: 'Normal', prob: 0.55 }
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
  'Normal': [{ ritual: 'Ninguno', prob: 1.0 }]
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
  'Ninguno': 'No obtuviste ritual hereditario esta vez. ¡Mala suerte!'
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
  'Normal': {
    message: `▂▃▅▇█🏠Familia🏠█▇▅▃▂
⊹・・──────────・・✦・・────
──── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ────
***\`Perdón por no haberte dado un clan épico esta vez... no salió nada "bueno", pero no te preocupes! Tienes todo el potencial para crear tu propio legado y ser más fuerte que cualquiera de los grandes clanes. ¡Te deseo mucha suerte en tu camino, vas a romperla igual! \`***
:・・──────────・・✦・・────
#  ¡Lo siento! No obtuviste clan...
⊹ 🌸・・────・・✦・・────・・🌸 ⊹`
  }
};

function createBuildEmbed(member) {
  const profile = getProfile(member.id);
  
  let fraseDisplay = profile.quote ? `__*"${profile.quote}"*__` : "__*Sin frase personalizada*__";
  
  const embed = new EmbedBuilder()
    .setTitle(`📖 Perfil de ${member.displayName || member.user.username} ✴ ⛓ 🧬`)
    .setThumbnail(profile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
    .setColor(raceColors[profile.race] || 0x2F3136)
    .setDescription("⟦⟪════════════⟫⟧\n────────────────────")
    .addFields(
      { name: "💰 Yenes", value: `¥ ${profile.yen || 0}`, inline: false },
      { name: "💭 Frase", value: fraseDisplay, inline: false },
      { name: "🧬 Raza", value: profile.race || "Sin definir", inline: false },
      { name: "👥 Clan", value: profile.clan || "Sin definir", inline: false },
      { name: "🏫 Escuela", value: profile.escuela || "Sin definir", inline: false },
      { name: "⚖️ Bando", value: profile.bando || "no definido", inline: false },
      { name: "🔮 Potencial", value: profile.potencial || "Sin tirar", inline: false },
      { name: "🌟 Tipo de Prodigio", value: Array.isArray(profile.tipos_prodigio) && profile.tipos_prodigio.length > 0 ? profile.tipos_prodigio.join(', ') : "Ninguno", inline: false },
      { name: "🧿 Ritual", value: profile.ritual || "Ninguno", inline: false },
      { name: "🧬 Hereditario", value: profile.ritual_hereditario || "Ninguno", inline: false },
      { name: "⚠️ Atadura", value: profile.atadura || "Ninguna", inline: false }
    )
    .setFooter({ text: "Cursed Era II • Navega con botones" });
    
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
    .setThumbnail(profile.icon || "https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg")
    .setColor(raceColors[profile.race] || 0x2F3136);
    
  if (action === "build") {
    let fraseDisplay = profile.quote ? `__*"${profile.quote}"*__` : "__*Sin frase personalizada*__";
    
    embed.setDescription("⟦⟪════════════⟫⟧\n────────────────────")
      .addFields(
        { name: "💰 Yenes", value: `¥ ${profile.yen || 0}`, inline: false },
        { name: "💭 Frase", value: fraseDisplay, inline: false },
        { name: "🧬 Raza", value: profile.race || "Sin definir", inline: false },
        { name: "👥 Clan", value: profile.clan || "Sin definir", inline: false },
        { name: "🏫 Escuela", value: profile.escuela || "Sin definir", inline: false },
        { name: "🔥 Talento", value: profile.potencial || "Sin definir", inline: false },
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
        { name: "Misión Grado 4", value: profile.misiones["4"].toString(), inline: false },
        { name: "Misión Grado 3", value: profile.misiones["3"].toString(), inline: false },
        { name: "Misión Grado 2", value: profile.misiones["2"].toString(), inline: false },
        { name: "Misión Grado 1", value: profile.misiones["1"].toString(), inline: false },
        { name: "Misión Grado Especial", value: profile.misiones["especial"].toString(), inline: false }
      );
  } else if (action === "grado") {
    embed.setDescription("🎖️ Información de Grado\n────────────────────")
      .addFields(
        { name: "🏛️ Grado Social", value: profile.grado_social || "Sin grado", inline: false },
        { name: "⚔️ Grado General", value: profile.grado_general || "Sin grado", inline: false }
      );
  } else if (action === "rr") {
    embed.setDescription("🎲 Rerrols disponibles\n────────────────────")
      .addFields(
        { name: "Rerrols totales", value: profile.rr.toString(), inline: false }
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

const rerollCategories = ['raza', 'clan', 'potencial', 'escuela', 'ritual', 'atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio'];

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
    
    // Dar +1 grado en fuerza
    if (profile.stats.fuerza.grado === "Sin grado") {
      profile.stats.fuerza.grado = "Grado 3";
      profile.stats.fuerza.nivel = 1;
      profile.stats.fuerza.sub = "";
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
      return message.reply('Primero tira tu raza con `-raza`');
    }
    if (profile.race === 'Espíritu Maldito' && command === 'clan') {
      return message.reply('Las maldiciones no tienen clanes. Usa `-sub_razas` en su lugar.');
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
      return message.reply('Solo los **Espíritus Malditos** pueden usar este comando.');
    }
  
    if (profile.sub_raza && profile.sub_raza !== 'Sin tirar') {
      return message.reply('Ya obtuviste tu sub-raza. Usa `-rr subraza` para rerollear.');
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
      return message.reply(`⏰ Ya trabajaste recientemente. Podés trabajar de nuevo en **${minutos} minutos**.`);
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

if (command === 'grafico') {
  try {
    const { AttachmentBuilder } = require('discord.js');
    const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
    
    const profile = getProfile(message.author.id);

    // ✅ Datos de XP (usar historial si existe, sino generar ejemplo)
    const xpData = profile.historial_xp && profile.historial_xp.length > 0 
      ? profile.historial_xp.slice(-5).map(h => h.xp_total)
      : [100, 250, 400, 600, profile.xp_total || 850];
    
    const weeks = xpData.map((_, i) => `Semana ${i + 1}`);

    // ✅ Datos de Yenes (calcular desde historial si existe)
    const yenesData = [
      (profile.historial_yenes?.filter(h => h.tipo.includes('reroll')).reduce((sum, h) => sum + Math.abs(h.cantidad), 0) || 3000),
      (profile.historial_yenes?.filter(h => h.tipo.includes('compra')).reduce((sum, h) => sum + Math.abs(h.cantidad), 0) || 5000),
      (profile.historial_yenes?.filter(h => h.tipo.includes('mision')).reduce((sum, h) => sum + Math.abs(h.cantidad), 0) || 2000),
      1000
    ];

    // ✅ Stats en radar
    const statsData = [
      profile.stats?.fuerza?.nivel || 1,
      profile.stats?.velocidad?.nivel || 1,
      profile.stats?.resistencia?.nivel || 1,
      Math.floor((profile.stats?.["Energía Maldita"] || 0) / 1000), // Escalar EM
      profile.rct ? 5 : 0
    ];

    const canvasRenderService = new ChartJSNodeCanvas({ 
      width: 800, 
      height: 600,
      backgroundColour: 'white'
    });

    // 1️⃣ Gráfico de XP
    const xpConfig = {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [{
          label: 'XP Total',
          data: xpData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Evolución de XP',
            font: { size: 18 }
          },
          legend: { display: false }
        },
        scales: { 
          y: { 
            beginAtZero: true,
            ticks: { font: { size: 12 } }
          },
          x: { ticks: { font: { size: 12 } } }
        }
      }
    };
    const xpBuffer = await canvasRenderService.renderToBuffer(xpConfig);

    // 2️⃣ Distribución de Yenes
    const yenesConfig = {
      type: 'pie',
      data: {
        labels: ['Rerolls', 'Items', 'Misiones', 'Otros'],
        datasets: [{
          data: yenesData,
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)',
            'rgb(75, 192, 192)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Distribución de Yenes Gastados',
            font: { size: 18 }
          },
          legend: { 
            position: 'bottom',
            labels: { font: { size: 14 } }
          }
        }
      }
    };
    const yenesBuffer = await canvasRenderService.renderToBuffer(yenesConfig);

    // 3️⃣ Stats en Radar
    const radarConfig = {
      type: 'radar',
      data: {
        labels: ['Fuerza', 'Velocidad', 'Resistencia', 'EM (x1000)', 'RCT'],
        datasets: [{
          label: 'Tus Stats',
          data: statsData,
          fill: true,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgb(255, 99, 132)',
          pointBackgroundColor: 'rgb(255, 99, 132)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgb(255, 99, 132)'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Stats en Radar Chart',
            font: { size: 18 }
          },
          legend: { display: false }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: { 
              stepSize: 1,
              font: { size: 12 }
            }
          }
        }
      }
    };
    const radarBuffer = await canvasRenderService.renderToBuffer(radarConfig);

    // ✅ Crear attachments
    const xpAttachment = new AttachmentBuilder(xpBuffer, { name: 'xp_evolution.png' });
    const yenesAttachment = new AttachmentBuilder(yenesBuffer, { name: 'yenes_distribution.png' });
    const radarAttachment = new AttachmentBuilder(radarBuffer, { name: 'stats_radar.png' });

    const embed = new EmbedBuilder()
      .setTitle('▂▃▅▇█ GRÁFICOS DE PROGRESO █▇▅▃▂')
      .setColor(0x00FFFF)
      .setDescription(
        '⊹・・──────────・・✦・・──────────・・⊹\n\n' +
        '**Tu progreso en Cursed Era II**\n\n' +
        '📈 Evolución de XP\n' +
        '💰 Distribución de Yenes\n' +
        '⚡ Stats en Radar\n\n' +
        '⊹・・──────────・・✦・・──────────・・⊹'
      )
      .setImage('attachment://xp_evolution.png')
      .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1465579652000120996/dfb5ab59669aa374b5807609ba8c9d79.jpg')
      .setFooter({ text: 'Cursed Era II • Gráficos de Progreso' })
      .setTimestamp();

    await message.channel.send({ 
      embeds: [embed], 
      files: [xpAttachment, yenesAttachment, radarAttachment] 
    });
  } catch (err) {
    console.error('Error en -grafico:', err.message);
    await message.reply(
      '❌ Error al generar los gráficos.\n\n' +
      '**Instalá la librería:**\n```npm install chartjs-node-canvas chart.js```\n\n' +
      `**Error:** ${err.message}`
    );
  }
  return;
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

    if (command === 'ritual_hereditario' || command === 'ritual') {
      if (profile.ritual_hereditario !== 'Sin tirar') {
        return message.reply('Ya tiraste ritual hereditario. Usa `-rr ritual` para rerollear (gasta 1 rr).');
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

      const msg = ritualMessages[result.ritual] || ritualMessages['Ninguno'];
      message.reply(msg);
      return;
    }
                // Comando -atadura (spin inicial)
    if (command === 'atadura') {
      if (profile.rr <= 0) {
        return message.reply('No tenés rerolls disponibles para tirar Atadura.');
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
            '`-rr ritual` → Cambiar ritual hereditario\n' +
            '`-rr atadura` → Cambiar atadura\n\n' +
            '**¡Atención!** Algunos clanes (como Zenin) tienen reglas especiales con Atadura Física.'
          )
          .setFooter({ text: 'Cursed Era II • Rerolls limitados, usalos con cabeza' })
          .setTimestamp();
      
        return message.channel.send({ embeds: [embed] });
      }
    
      let category = args[0].toLowerCase();
      if (category === 'talento') category = 'potencial';
      let fieldName = category;
      if (category === 'ritual') fieldName = 'ritual_hereditario';
    
      // ✅ LISTA ACTUALIZADA CON TODAS LAS CATEGORÍAS
      const rerollCategories = ['raza', 'clan', 'potencial', 'escuela', 'ritual', 'atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio'];
      
      if (!rerollCategories.includes(category)) {
        message.reply(`Categoría inválida. Usa: raza, energia, subraza, clan, potencial, prodigio, tipo_prodigio, escuela, ritual o atadura.`);
        return;
      }
    
      // ✅ CASOS ESPECIALES QUE NO NECESITAN VALIDACIÓN DE "Sin tirar"
      const casosEspeciales = ['atadura', 'energia', 'subraza', 'prodigio', 'tipo_prodigio', 'tipoprodigio'];
      
      if (profile.rr <= 0) {
        message.reply('No tienes rerolls disponibles.');
        return;
      }
    
      if (profile[fieldName] === 'Sin tirar' && !casosEspeciales.includes(category)) {
        const comandoSpin = category === 'ritual' ? 'ritual_hereditario' : category;
        message.reply(`Primero tira **${category === 'ritual' ? 'ritual hereditario' : category}** con \`-${comandoSpin}\` antes de rerollear.`);
        return;
      }
    
      if (!descontarReroll(profile, 1)) {
        return message.reply('No tienes rerolls disponibles.');
      }
    
      let messageText = `Reroll exitoso de **${category === 'ritual' ? 'ritual hereditario' : category}**.\nRerolls restantes: **${profile.rr}**\n\n`;
    
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
          `**Reroll de Energía exitoso!**\n\n` +
          `Anterior: ${oldEm} EM\n` +
          `Nuevo: ${result.em} EM (${result.nivel})\n\n` +
          `⚠️ Buffos de prodigios recalculados automáticamente.\n\n` +
          `Rerolls restantes: **${profile.rr}**`
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
    
        saveDB();
    
        const msg = ritualMessages[ritualObtenido] || ritualMessages['Ninguno'];
        messageText += `Ritual anterior: **${oldRitual}**\nNuevo ritual: **${profile.ritual_hereditario}**\n\n${msg}`;
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
        if (profile.rr <= 0) {
          return message.reply('No tienes rerolls disponibles.');
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
          '🛠️ **Administración** → Comandos de staff\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '_¡Navega con los botones para más detalles!_\n\n' +
          '⊹・・──────────・・✦・・────────・・⊹'
        )
        .setColor(0x9B59B6)
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
        .setImage('https://cdn.discordapp.com/attachments/1465647525766631585/1467237897181724673/descarga_5.jpg')
        .setFooter({ text: 'Cursed Era II • Enero 2026 • Usa los botones para navegar' })
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
          .setCustomId("help_admin")
          .setLabel("Administración")
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Danger)
      );
    
      await message.channel.send({ embeds: [helpEmbed], components: [row1, row2] });
      return;
    }
    if (command === 'blackflash' || command === 'bf') {
      if (profile.race === 'Sin tirar' || profile.clan === 'Sin tirar') {
        return message.reply('Primero tira raza y clan antes de intentar un Black Flash.');
      }

      const prob = 0.08;
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
      if (profile.race === 'Sin tirar' || profile.clan === 'Sin tirar') {
        return message.reply('Primero tira raza y clan antes de intentar dominar la RCT.');
      }

      if (profile.rct) {
        return message.reply('Ya tienes RCT desbloqueada.');
      }

      const prob = 0.06;
      const exito = Math.random() < prob;

      if (exito) {
        message.channel.send(
          `__***El frío de la muerte comenzó a invadir tus extremidades y el mundo se desvaneció en un gris pálido; estabas acabado. Sin embargo, en ese abismo de agonía donde tu cuerpo se rendía, lanzaste una última mirada al núcleo de tu propia alma. Entendiste que la energía maldita es pura negatividad, pero al multiplicar el rastro de tu dolor por sí mismo, lograste lo que pocos alcanzan: despertaste la Energía Maldita Inversa.***__\n` +
          `__***Fue como si un voltaje blanco y puro recorriera tus venas, deteniendo la hemorragia y reconstruyendo el tejido desgarrado en un instante milagroso. La fórmula negative + negative = positive dejó de ser una teoría para convertirse en tu nueva realidad. Con un resuello forzado, tus ojos se abrieron de golpe, brillando con una claridad aterradora; ya no estabas al borde del final, sino que habías renacido con el poder de sanar tu cuerpo y reescribir las reglas de la batalla.***__\n` +
          `# No mueras aquí ahora. https://tenor.com/view/satoru-gojo-vs-toji-fushigurou-zenin-gif-17463542258747608736`
        );

        const confirmEmbed = new EmbedBuilder()
          .setTitle('¡RCT lograda!')
          .setDescription('¿Querés agregar RCT a tu ficha de stats?\n(Se agregará debajo de Energía Maldita como 『✨』RCT: Sí)')
          .setColor(0x00FFAA);

        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('rct_accept')
              .setLabel('Sí')
              .setStyle(ButtonStyle.Success)
          );

        message.channel.send({ embeds: [confirmEmbed], components: [row] });
      } else {
        message.channel.send(
          `__***El frío comenzó a pesar más que tu propia voluntad. Con la visión nublada por la sangre y tus órganos fallando, lanzaste un último y desesperado intento de comprender la esencia de tu energía, tratando de forzar ese chispazo positivo que lo reparara todo. Visualizaste la multiplicación de tu negatividad, buscaste desesperadamente la fórmula para crear la Energía Maldita Inversa, pero el flujo simplemente no respondió.***__\n` +
          `__***En lugar del alivio del renacimiento, solo sentiste el vacío. Tu energía maldita se filtró por tus heridas como agua entre los dedos, incapaz de transmutarse en sanación. El golpe de realidad fue más doloroso que tus lesiones: no todos son prodigios, y el milagro de la técnica inversa se mantuvo fuera de tu alcance. Te quedaste allí, con el aliento entrecortado y el cuerpo roto, sintiendo cómo la oscuridad de la derrota se cerraba definitivamente sobre ti mientras la chispa de tu vida se atenuaba sin remedio.***__\n` +
          `# [¡NO MUERAS, NO!](https://tenor.com/view/gojo-satoru-gojo-gojo-death-gojo-fakeout-gojo-vs-toji-gif-17536692181766711941)`
        );
      }
      return;
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
      if (!message.member?.permissions.has('Administrator')) {
        return message.reply('Solo admins pueden usar este comando.');
      }
      if (args.length < 2) return message.reply('Uso: `-quitarrr @usuario cantidad`');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona a un usuario válido.');
      const cantidad = parseInt(args[1]);
      if (isNaN(cantidad) || cantidad <= 0) return message.reply('Cantidad inválida (debe ser un número positivo).');
      const targetProfile = getProfile(target.id);
      if (targetProfile.rr < cantidad) return message.reply('El usuario no tiene suficientes rerolls.');
      targetProfile.rr -= cantidad;
      saveDB();
      message.reply(`Se quitaron **${cantidad} rerolls** a ${target.tag}. Ahora tiene **${targetProfile.rr}** en total.`);
      return;
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
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      delete db.users[target.id];
      saveDB();
      message.reply(`Build de ${target.tag} reseteada.`);
      return;
    }

    if (command === 'darmision') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-darmision @usuario grado` (4,3,2,1,especial,semi 2,semi 1)`');

      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase().replace('semi ', 'semi');

      const validGrados = ['4', '3', '2', '1', 'especial', 'semi 2', 'semi 1'];
      if (!validGrados.includes(grado)) return message.reply('Grado inválido.');

      const targetProfile = getProfile(target.id);
      targetProfile.misiones[grado] = (targetProfile.misiones[grado] || 0) + 1;

      let yenGanado = 0;
      if (grado === '4') yenGanado = 500;
      else if (grado === '3') yenGanado = 1200;
      else if (grado === 'semi 2' || grado === '2') yenGanado = 2500;
      else if (grado === 'semi 1' || grado === '1') yenGanado = 5000;
      else if (grado === 'especial') yenGanado = 12000;

      targetProfile.yen = (targetProfile.yen || 0) + yenGanado;
      saveDB();

      message.reply(`+1 misión grado **${grado}** a ${target.tag}. Ahora tiene ${targetProfile.misiones[grado]}.\n+¥${yenGanado.toLocaleString()} (total: ¥${targetProfile.yen.toLocaleString()})`);
      return;
    }

    if (command === 'quitarmision') {
      if (!message.member.permissions.has('Administrator')) return message.reply('Solo admins.');
      if (args.length < 2) return message.reply('Uso: `-quitarmision @usuario grado` (4,3,2,1,especial,semi 2,semi 1)`');

      const target = message.mentions.users.first();
      if (!target) return message.reply('Menciona un usuario.');
      const grado = args[1].toLowerCase().replace('semi ', 'semi');

      const validGrados = ['4', '3', '2', '1', 'especial', 'semi 2', 'semi 1'];
      if (!validGrados.includes(grado)) return message.reply('Grado inválido.');

      const targetProfile = getProfile(target.id);
      if ((targetProfile.misiones[grado] || 0) <= 0) return message.reply('No tiene misiones en ese grado.');

      targetProfile.misiones[grado] -= 1;

      let yenQuitado = 0;
      if (grado === '4') yenQuitado = 500;
      else if (grado === '3') yenQuitado = 1200;
      else if (grado === 'semi 2' || grado === '2') yenQuitado = 2500;
      else if (grado === 'semi 1' || grado === '1') yenQuitado = 5000;
      else if (grado === 'especial') yenQuitado = 12000;

      if ((targetProfile.yen || 0) >= yenQuitado) {
        targetProfile.yen -= yenQuitado;
      } else {
        targetProfile.yen = 0;
      }

      saveDB();

      message.reply(`-1 misión grado **${grado}** a ${target.tag}. Ahora tiene ${targetProfile.misiones[grado]}.\n-¥${yenQuitado.toLocaleString()} (total: ¥${targetProfile.yen.toLocaleString()})`);
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
    const saltarSubGrados = esProdigioFisico && stat === 'fuerza';

    // Actualizar sub-nivel
    if (statObj.nivel <= 4) {
      if (saltarSubGrados) {
        // ✅ PRODIGIO FÍSICO: Saltar directamente al siguiente grado
        statObj.sub = "";
        statObj.nivel = 5; // Ir directo a Sub-Grado 2
      } else {
        // Normal: usar sub-grados
        const subs = ["", "+", "++", "+++"];
        statObj.sub = subs[statObj.nivel - 1];
      }
    } else {
      statObj.sub = "";
    }
    
    // Cambiar grado cuando llega a nuevo bloque
    if (statObj.nivel > 28) {
      statObj.grado = "Grado Especial+";
      statObj.nivel = 30;
    } else if (statObj.nivel > 24) {
      statObj.grado = "Grado Especial";
    } else if (statObj.nivel > 20) {
      statObj.grado = "Sub-Grado Especial";
    } else if (statObj.nivel > 16) {
      statObj.grado = "Sub-Grado 1";
    } else if (statObj.nivel > 12) {
      statObj.grado = "Grado 1";
    } else if (statObj.nivel > 8) {
      statObj.grado = "Grado 2";
    } else if (statObj.nivel > 4) {
      statObj.grado = "Sub-Grado 2";
    } else if (statObj.nivel > 0) {
      statObj.grado = "Grado 3";
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
       // Comando -cambiar @user <categoría> <valor> — solo admins
       if (command === 'cambiar') {
        if (!message.member.permissions.has('Administrator')) {
          return message.reply('Solo administradores pueden usar este comando.');
        }
      
        if (args.length < 3) {
          return message.reply('Uso: `-cambiar @usuario <categoría> <nuevo valor>`\nEj: `-cambiar @Gabriel ritual "Atadura Física"`');
        }
      
        const target = message.mentions.users.first();
        if (!target) return message.reply('Menciona a un usuario válido con @.');
      
        const targetProfile = getProfile(target.id);
        if (!targetProfile) return message.reply('No se encontró perfil para ese usuario.');
      
        const categoria = args[1].toLowerCase();
        let nuevoValor = args.slice(2).join(' ').trim();
      
        // Limpieza: quitar comillas si las pusieron
        nuevoValor = nuevoValor.replace(/^["']|["']$/g, '');
      
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
  await message.reply(`✅ **${target.tag}** actualizado:\n**Energía Maldita** → **${num}**`);
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
  await message.reply(`✅ **${target.tag}** actualizado:\n**${categoria}** → **${tipos.join(', ')}**\n\n⚠️ Buffos aplicados automáticamente.`);
  return;
}
        if (!camposValidos.includes(categoria)) {
          return message.reply(`Categoría inválida. Usa una de estas: ${camposValidos.join(', ')}`);
        }
      
        // Guardar el cambio
        targetProfile[categoria] = nuevoValor;
      
        // Guardar en disco
        saveDB();
      
        await message.reply(`✅ **${target.tag}** actualizado:\n**${categoria}** → **${nuevoValor}**`);
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
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
  await interaction.deferUpdate();

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

    // Botones de ayuda (help_spins, help_admin, help_build)
    if (interaction.customId.startsWith('help_')) {
      const category = interaction.customId.split('_')[1];
      let helpText = '';
      let helpColor = 0x00FFFF;
    
      if (category === 'spins') {
        helpColor = 0x3498DB;
        helpText = 
`▂▃▅▇█🎲 SPINS & REROLLS 🎲█▇▅▃▂

⊹・・──────────・・✦・・────────・・⊹

**🎰 SPINS INICIALES (Gratis 1ra vez)**
━━━━━━━━━━━━━━━━━━━━━
\`-raza\` → Tirar tu raza (Humano/Espíritu/Híbrido)
\`-energia_inicial\` → Tirar energía maldita inicial
\`-sub_razas\` → Tirar sub-raza (solo Espíritus Malditos)
\`-clan\` → Tirar tu clan (Gojo/Zenin/Kamo/etc)
\`-potencial\` → Tirar tu potencial (Común/Superior/Prodigio)
\`-escuela\` → Tirar tu escuela (Tokyo/Kyoto)
\`-ritual\` → Tirar ritual hereditario (según tu clan)
\`-atadura\` → Tirar atadura (gasta 1 rr)

**🌟 SISTEMA DE PRODIGIOS (solo si sos Prodigio)**
━━━━━━━━━━━━━━━━━━━━━
\`-prodigio\` → Tirar cantidad de tipos (0/1/2)
\`-tipo_prodigio\` → Elegir tipo de prodigio específico
\`-rr prodigio\` → Rerollear cantidad (máx 2 veces)

**🔄 REROLLS (Cuesta 1 rr cada uno)**
━━━━━━━━━━━━━━━━━━━━━
\`-rr\` → Ver info de rerolls disponibles
\`-rr raza\` → Cambiar raza
\`-rr energia\` → Rerollear energía inicial
\`-rr subraza\` → Rerollear sub-raza (Espíritus)
\`-rr clan\` → Cambiar clan
\`-rr potencial\` → Cambiar potencial
\`-rr escuela\` → Cambiar escuela
\`-rr ritual\` → Cambiar ritual hereditario
\`-rr atadura\` → Cambiar atadura
\`-rr tipo_prodigio\` → Cambiar tu tipo de prodigio

**⚡ SPINS ESPECIALES**
━━━━━━━━━━━━━━━━━━━━━
\`-blackflash\` o \`-bf\` → Intentar Black Flash (8% probabilidad)
\`-rct\` → Intentar desbloquear RCT (6% probabilidad)

⊹・・──────────・・✦・・────────・・⊹`;
      } 
    
      else if (category === 'build') {
        helpColor = 0x2ECC71;
        helpText = 
    `▂▃▅▇█⚔️ BUILD & PERFIL ⚔️█▇▅▃▂
    
    ⊹・・──────────・・✦・・────────・・⊹
    
    **📖 COMANDOS DE PERFIL**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-perfil\` → Ver tu perfil completo (con botones navegables)
    \`-perfil @usuario\` → Ver perfil de otro usuario
    \`-quote "tu frase"\` → Cambiar tu frase personalizada
    \`-quote + imagen\` → Cambiar tu icono de perfil
    
    **📊 SECCIONES DEL PERFIL (botones)**
    ━━━━━━━━━━━━━━━━━━━━━
    • **Build** → Raza, clan, potencial, ritual, atadura
    • **Misiones** → Contador de misiones por grado
    • **Grado** → Grado Social y Grado General
    • **Rerolls** → Cantidad de rerolls disponibles
    • **Stats** → Estadísticas de combate
    • **Inventario** → Items comprados
    • **Jujutsu Craft** → Build alternativa de Minecraft
    • **Logros** → Tus logros desbloqueados
    • **Amigos & Rivales** → Sistema social
    
    **⚙️ CONFIGURACIÓN**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-bando <brujo/neutro/malvado/hechicero>\` → Cambiar bando
    \`-stats\` → Ver tus stats detalladas
    \`-stats <Fuerza/Velocidad/Resistencia> <valor>\` → Editar stats
    
    **📈 PROGRESO**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-top\` → Rankings (XP, Rerolls, Grado Social)
    \`-grafico\` → Ver gráficos de tu progreso
    
    ⊹・・──────────・・✦・・────────・・⊹`;
      } 
    
      // ✅ NUEVO: CATEGORÍA ECONOMÍA
      else if (category === 'economia') {
        helpColor = 0xF1C40F;
        helpText = 
    `▂▃▅▇█💰 ECONOMÍA 💰█▇▅▃▂
    
    ⊹・・──────────・・✦・・────────・・⊹
    
    **🛒 TIENDAS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-tienda\` → Ver tienda general (paginada)
    \`-buy <número>\` → Comprar de la tienda general
    \`-comprar "Negocio" "Item"\` → Comprar en negocio de jugador
    
    **💼 TRABAJO Y FARMEO**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-trabajar\` → Hacer minijuegos para ganar yenes (1h cooldown)
      • Trivia JJK
      • Adivina el número
      • Test de reflejos
    
    **🎲 APUESTAS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-apostar <cantidad> coinflip\` → Cara o cruz (x2)
    \`-apostar <cantidad> dados\` → Tirar dados (varios premios)
    \`-apostar <cantidad> blackjack\` → Blackjack simple
    
    **🏪 NEGOCIOS DE JUGADORES**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-crear_negocio "Nombre"\` → Crear tu negocio (requiere grado alto)
    \`-agregar_item_negocio "Negocio" "Item" <precio>\` → Agregar item
    \`-negocio "Nombre"\` → Ver info de un negocio
    \`-mercado\` → Ver todos los items en venta
    
    **💸 MERCADO ENTRE JUGADORES**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-vender "Item" <precio>\` → Poner item en venta
    \`-cancelar_venta "Item"\` → Cancelar venta
    \`-comprar_jugador @vendedor "Item"\` → Comprar item
    
    **🏦 PRÉSTAMOS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-prestar @usuario <cantidad>\` → Prestar yenes
    \`-cobrar @usuario\` → Recordar deuda
    \`-devolver @usuario <cantidad>\` → Devolver préstamo
    \`-deudas\` → Ver tus deudas y préstamos
    
    ⊹・・──────────・・✦・・────────・・⊹`;
      }
    
      // ✅ NUEVO: CATEGORÍA SOCIAL
      else if (category === 'social') {
        helpColor = 0xE74C3C;
        helpText = 
    `▂▃▅▇█👥 SISTEMA SOCIAL 👥█▇▅▃▂
    
    ⊹・・──────────・・✦・・────────・・⊹
    
    **💚 AMISTADES**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-agregar_amigo @usuario\` → Enviar solicitud de amistad
    \`-aceptar_amigo @usuario\` → Aceptar solicitud
    \`-eliminar_amigo @usuario\` → Eliminar amistad
    
    **Beneficios de tener amigos:**
    • +5% XP por amigo en misiones juntos
    • Aparecen en tu perfil
    
    **⚔️ RIVALIDADES**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-rival @usuario\` → Declarar rivalidad
    \`-quitar_rival @usuario\` → Eliminar rivalidad
    
    **Efectos de tener rivales:**
    • Enfrentamientos más intensos
    • Aparecen en tu perfil
    
    **🏰 CLANES (GUILDS)**
━━━━━━━━━━━━━━━━━━━━━
\`-crear_clan "Nombre"\` → Crear un clan (GRATIS)
\`-invitar_clan @usuario\` → Invitar miembro (solo líder)
\`-unirse_clan "Nombre"\` → Aceptar invitación
\`-salir_clan\` → Salir del clan
\`-disolver_clan\` → Disolver clan (solo líder)
\`-info_clan\` → Ver info de tu clan
\`-info_clan "Nombre"\` → Ver info de otro clan
\`-top_clanes\` → Ranking de clanes
    
    ⊹・・──────────・・✦・・────────・・⊹`;
      }
    
      else if (category === 'admin') {
        helpColor = 0x95A5A6;
        helpText = 
    `▂▃▅▇█🛡️ ADMINISTRACIÓN 🛡️█▇▅▃▂
    
    ⊹・・──────────・・✦・・────────・・⊹
    
    **⚙️ COMANDOS BÁSICOS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-cambiar @usuario <campo> <valor>\` → Cambiar cualquier campo
      Campos: ritual, atadura, race, clan, potencial, escuela, 
              bando, grado_social, grado_general, yen, rr,
              raza_craft, clan_craft, especial_1, especial_2, ritual_craft
    
    **Ejemplos:**
    \`-cambiar @Agus atadura "Atadura Física"\`
    \`-cambiar @Gabi yen 100000\`
    \`-cambiar @Juan rr 15\`
    \`-cambiar @Pedro raza_craft "Espíritu Maldito"\`
    
    **💰 ECONOMÍA**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-dar_yenes @usuario <cantidad>\` → Dar yenes
    \`-quitar_yenes @usuario <cantidad>\` → Quitar yenes
    
    **🎲 REROLLS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-darrr @usuario <cantidad>\` → Dar rerolls
    \`-quitarrr @usuario <cantidad>\` → Quitar rerolls
    
    **🎖️ GRADOS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-gradosocial @usuario <grado>\` → Cambiar Grado Social
    \`-gradogeneral @usuario <grado>\` → Cambiar Grado General
      Grados: 4, 3, semi 2, 2, semi 1, 1, especial
    
    **📜 MISIONES**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-darmision @usuario <grado>\` → Dar +1 misión
    \`-quitarmision @usuario <grado>\` → Quitar -1 misión
      Grados: 4, 3, 2, 1, especial, semi 2, semi 1
    
    **📈 EXPERIENCIA**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-xp @usuario <fuerza/velocidad/resistencia> <cantidad>\`
      → Dar EXP en una stat (auto-calcula niveles)
    
    **🏅 LOGROS**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-darlogro @usuario "Nombre del logro"\`
      → Dar un logro personalizado
    
    **🗑️ GESTIÓN**
    ━━━━━━━━━━━━━━━━━━━━━
    \`-reset @usuario\` → Resetear build completa
    **🛠️ UTILIDAD**
━━━━━━━━━━━━━━━━━━━━━
\`-estado\` → Ver estado y uptime del bot
    ⊹・・──────────・・✦・・────────・・⊹`;
      }
    
      // Si llega acá y no matcheó ninguna categoría
      else {
        helpText = '❌ Categoría no encontrada. Usa los botones para navegar.';
        helpColor = 0xFF0000;
      }
    
      const helpEmbed = new EmbedBuilder()
        .setTitle(`Ayuda - ${category.toUpperCase()}`)
        .setDescription(helpText)
        .setColor(helpColor)
        .setThumbnail('https://cdn.discordapp.com/attachments/1465174713427951626/1467023621296750604/descarga.jpg')
        .setFooter({ text: 'Cursed Era II • Usa los botones para cambiar de sección' })
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
          .setCustomId("help_admin")
          .setLabel("Administración")
          .setEmoji("🛡️")
          .setStyle(ButtonStyle.Danger)
      );
    
      await interaction.editReply({ embeds: [helpEmbed], components: [row1, row2] });
      return;
    }    
    if (interaction.customId === 'rct_accept') {
      const profile = getProfile(interaction.user.id);
      profile.rct = true;
      saveDB();
      await interaction.editReply({
        content: '¡RCT agregada a tu ficha de stats!\nAhora aparece en la sección Stats como 『✨』RCT: Sí.',
        embeds: [],
        components: []
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
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Error al procesar el botón 😔', ephemeral: true });
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