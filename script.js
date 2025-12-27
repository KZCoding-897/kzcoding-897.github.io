/* =========================================
   1. CONFIGURACIÓN Y MAPEO DE TECLAS
   ========================================= */

// Teclas del teclado de la computadora
const WHITE_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
const BLACK_KEYS = ['s', 'd', 'g', 'h', 'j'];
const HIGHER_KEYS = ['q', 'w', 'e', 'r', 't']; // Nuevas teclas para notas agudas

// Lista de nombres de archivos que vamos a cargar
// Deben coincidir con el atributo data-note en tu HTML
const NOTE_NAMES = [
    'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 
    'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4',
    'C5', 'D5', 'E5', 'F5', 'G5'
];

// Selección de elementos del HTML
const keys = document.querySelectorAll('.key');
const whiteKeys = document.querySelectorAll('.key.white');
const blackKeys = document.querySelectorAll('.key.black');

// Variables del sistema de audio
let audioContext;
const audioBuffers = {}; // Aquí se guardarán los sonidos cargados

/* =========================================
   2. MOTOR DE AUDIO (CARGA Y REPRODUCCIÓN)
   ========================================= */

// Función para iniciar el contexto y cargar los archivos
async function initAudio() {
    if (audioContext) return;

    // Crear el contexto de audio (Soporte para Chrome, Firefox, Safari)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    console.log("Iniciando carga de sonidos...");

    // Recorremos la lista de notas y creamos una promesa de carga para cada una
    const loadPromises = NOTE_NAMES.map(async (note) => {
        try {
            // Buscamos el archivo en la carpeta local (ej: ./C4.mp3)
            // AHORA (Busca dentro de la carpeta "notes")
            const response = await fetch(`./notes/${note}.mp3`);
            
            if (!response.ok) {
                throw new Error(`No se encontró el archivo: ${note}.mp3`);
            }

            const arrayBuffer = await response.arrayBuffer();
            
            // Decodificamos el audio (convertir mp3 a datos de audio crudos)
            const decodedAudio = await audioContext.decodeAudioData(arrayBuffer);
            
            // Guardamos el sonido en nuestro diccionario usando el nombre de la nota
            audioBuffers[note] = decodedAudio;
            
        } catch (error) {
            console.error(`Error cargando la nota ${note}:`, error);
        }
    });

    // Esperamos a que TODOS los archivos se terminen de cargar
    await Promise.all(loadPromises);
    console.log("¡Piano listo! Todos los sonidos cargados.");
}

// Función para reproducir una nota específica
function playNote(key) {
    // 1. INICIALIZACIÓN Y SEGURIDAD
    // Si es la primera vez, iniciamos el motor de audio
    if (!audioContext) initAudio();

    // Si el navegador suspendió el audio (ahorro de energía), lo reactivamos
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const note = key.dataset.note;
    const buffer = audioBuffers[note];

    // Si el archivo de audio para esta nota no cargó, salimos para evitar errores
    if (!buffer) return;

    // 2. REPRODUCCIÓN DE AUDIO
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    
    // Conectamos a los altavoces
    source.connect(audioContext.destination);
    
    // Reproducimos instantáneamente
    source.start(0);

    // 3. ANIMACIÓN VISUAL (CSS)
    key.classList.add('active');
    
    // Quitamos la clase 'active' después de 150ms
    setTimeout(() => {
        key.classList.remove('active');
    }, 150);

    // 4. LÓGICA DE DETECCIÓN DE MELODÍAS (ZELDA)
    // Agregamos la nota actual al historial
    playedNotes.push(note);
    
    // Mantenemos el historial corto (máximo 20 notas) para ahorrar memoria
    if (playedNotes.length > 20) {
        playedNotes.shift(); // Borra la más antigua
    }

    // Verificamos si lo que acabas de tocar coincide con alguna canción
    checkMelody();
}

/* =========================================
   3. MANEJO DE EVENTOS (MOUSE Y TECLADO)
   ========================================= */

// Evento: Clic del mouse en las teclas
keys.forEach(key => {
    key.addEventListener('mousedown', () => playNote(key));
});

// Evento: Presionar teclas del teclado de la computadora
document.addEventListener('keydown', e => {
    // Evitar que el sonido se repita como metralleta si dejas la tecla presionada
    if (e.repeat) return;
    
    const keyChar = e.key.toLowerCase();
    const whiteIndex = WHITE_KEYS.indexOf(keyChar);
    const blackIndex = BLACK_KEYS.indexOf(keyChar);
    const higherIndex = HIGHER_KEYS.indexOf(keyChar);

    // Si la tecla presionada está en nuestra lista de blancas, tocarla
    if (whiteIndex > -1) {
        playNote(whiteKeys[whiteIndex]);
    }
    
    // Si la tecla presionada está en nuestra lista de negras, tocarla
    if (blackIndex > -1) {
        playNote(blackKeys[blackIndex]);
    }
    
    // Si la tecla presionada está en la lista de notas agudas, tocarla
    if (higherIndex > -1) {
        const higherKeys = document.querySelectorAll('[data-note="C5"], [data-note="D5"], [data-note="E5"], [data-note="F5"], [data-note="G5"]');
        playNote(higherKeys[higherIndex]);
    }
});

// Inicialización Lazy:
// Los navegadores no permiten reproducir audio hasta que el usuario interactúa.
// Ponemos un listener global para iniciar el motor de audio al primer clic en cualquier lado.
document.addEventListener('click', () => {
    if (!audioContext) initAudio();
}, { once: true });

/* =========================================
   SISTEMA DE DETECCIÓN DE CANCIONES (ZELDA) - CON ICONOS
   ========================================= */

// 1. NUEVA Base de datos: Ahora incluye notas e iconos
const SONGS = {
    // --- CANCIONES PRINCIPALES ---
    'Song of Time': {
        notes: ['A4', 'D4', 'F4', 'A4', 'D4', 'F4'], // Recuerda corregir el ritmo si usas la versión completa
        icon: './icons/song_of_time.png'
    },
    'Song of Storms': {
        notes: ['D4', 'F4', 'D5', 'D4', 'F4', 'D5'],
        icon: './icons/song_of_storms.png'
    },
    'Saria\'s Song': {
        notes: ['F4', 'A4', 'B4', 'F4', 'A4', 'B4'],
        icon: './icons/saria_song.png'
    },
    'Epona\'s Song': {
        notes: ['D5', 'B4', 'A4', 'D5', 'B4', 'A4'],
        icon: './icons/epona_song.png'
    },
    'Zelda\'s Lullaby': {
        notes: ['B4', 'D5', 'A4', 'B4', 'D5', 'A4'],
        icon: './icons/zelda_lullaby.png'
    },
    'Sun\'s Song': {
        notes: ['A4', 'F4', 'D5', 'A4', 'F4', 'D5'],
        icon: './icons/suns_song.png'
    },
    
    // --- CANCIONES DE TELETRANSPORTE (Opcional si quieres programarlas también) ---
    'Minuet of Forest': {
        // CORREGIDO: Re, Re5, Si, La, Si, La
        notes: ['D4', 'D5', 'B4', 'A4', 'B4', 'A4'],
        icon: './icons/minuet_forest.png'
    },
    'Bolero of Fire': {
        notes: ['F4', 'D4', 'F4', 'D4', 'A4', 'F4', 'A4', 'F4'],
        icon: './icons/bolero_fire.png'
    },
    'Serenade of Water': {
        notes: ['D4', 'F4', 'A4', 'A4', 'B4'],
        icon: './icons/serenade_water.png'
    },
    'Nocturne of Shadow': {
        notes: ['B4', 'A4', 'A4', 'D4', 'B4', 'A4', 'F4'],
        icon: './icons/nocturne_shadow.png'
    },
    'Requiem of Spirit': {
        notes: ['D4', 'F4', 'D4', 'A4', 'F4', 'D4'],
        icon: './icons/requiem_spirit.png'
    },
    'Prelude of Light': {
        // CORREGIDO POR TI: Re5, Si, Re5, La, Si, Re5
        notes: ['D5', 'B4', 'D5', 'A4', 'B4', 'D5'],
        icon: './icons/prelude_light.png'
    },
    'Song of Healing': {
        // Notas: Si - La - Fa - Si - La - Fa
        notes: ['B4', 'A4', 'F4', 'B4', 'A4', 'F4'],
        icon: './icons/song_of_healing.png'
    }
};

// Historial y elementos del DOM
let playedNotes = [];
const notificationDiv = document.getElementById('song-notification');
const songNameDiv = document.getElementById('song-name');
// NUEVO: Referencia a la imagen
const songIconImg = document.getElementById('song-icon'); 
let notificationTimeout;

// 2. Función para chequear melody (Actualizada para la nueva estructura)
function checkMelody() {
    const historyString = playedNotes.join(',');

    // Ahora recorremos el objeto: name es la clave, data es el objeto {notes, icon}
    for (const [name, data] of Object.entries(SONGS)) {
        // Accedemos a data.notes
        const sequenceString = data.notes.join(',');

        if (historyString.endsWith(sequenceString)) {
            // Pasamos el nombre Y el icono a la función de mostrar
            showNotification(name, data.icon);
            playedNotes = []; 
            return;
        }
    }
}

// 3. Función para mostrar la animación (Actualizada para recibir imagen)
function showNotification(name, iconUrl) {
    // Actualizamos texto
    songNameDiv.innerText = name;
    // NUEVO: Actualizamos la fuente de la imagen
    songIconImg.src = iconUrl;

    notificationDiv.classList.add('show');

    clearTimeout(notificationTimeout);
    notificationTimeout = setTimeout(() => {
        notificationDiv.classList.remove('show');
        // Opcional: borrar el src al ocultar para que no parpadee la próxima vez
        setTimeout(() => { songIconImg.src = ''; }, 500); 
    }, 4000);
}

/* =========================================
   SOPORTE TÁCTIL (MÓVIL)
   ========================================= */

const allKeys = document.querySelectorAll('.key');

allKeys.forEach(key => {
    // Evento cuando el dedo toca la pantalla
    key.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Evita scroll o zoom o menú contextual
        playNote(key);
    });

    // Opcional: Si quieres que deje de brillar al soltar
    key.addEventListener('touchend', (e) => {
        e.preventDefault();
        // La clase 'active' ya se quita sola en playNote con el setTimeout, 
        // pero esto asegura limpieza si cambias la lógica.
    });
});