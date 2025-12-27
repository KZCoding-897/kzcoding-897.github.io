/* =========================================
   CONFIGURACIÓN Y MAPEO
   ========================================= */
const WHITE_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
const BLACK_KEYS = ['s', 'd', 'g', 'h', 'j'];

// Mapeo de semitonos relativos a Do Central (C4 = 0)
// Esto es vital para calcular la afinación exacta
const noteSemitones = {
    'C4': 0, 'Db4': 1, 'D4': 2, 'Eb4': 3, 'E4': 4,
    'F4': 5, 'Gb4': 6, 'G4': 7, 'Ab4': 8, 'A4': 9,
    'Bb4': 10, 'B4': 11
};

// Selección de elementos del DOM (Tu HTML existente)
const keys = document.querySelectorAll('.key');
const whiteKeys = document.querySelectorAll('.key.white');
const blackKeys = document.querySelectorAll('.key.black');

// Variables globales de audio
let audioContext;
let pianoBuffer = null;

/* =========================================
   MOTOR DE AUDIO (SAMPLER)
   ========================================= */

// 1. Inicializar el contexto y descargar el sonido
async function initAudio() {
    if (audioContext) return;

    // Crear contexto de audio compatible con todos los navegadores
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();

    try {
        // Cargamos una grabación real de un Piano (Nota C4)
        // Nota: Si usas esto en local sin servidor, puede dar error de CORS. 
        // Usa Live Server o sube el archivo mp3 a tu carpeta local.
        const response = await fetch('https://raw.githubusercontent.com/pffy/mp3-piano-sound/master/mp3/c4.mp3');
        const arrayBuffer = await response.arrayBuffer();
        
        // Decodificamos el audio para usarlo
        pianoBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("Sonido de piano cargado correctamente");
        
    } catch (error) {
        console.error("Error cargando el sonido:", error);
        alert("Para que el sonido funcione, necesitas ejecutar este archivo en un servidor local (por políticas de seguridad del navegador).");
    }
}

// 2. Función para reproducir la nota
function playNote(key) {
    // Si no se ha iniciado el audio, iniciarlo (requerido por navegadores)
    if (!audioContext) initAudio();
    
    // Si el buffer aún no descargó, no hacer nada
    if (!pianoBuffer) return;

    const note = key.dataset.note;
    const semitones = noteSemitones[note];

    // Si la nota no está en nuestro mapa, salir
    if (semitones === undefined) return;

    // --- CADENA DE AUDIO ---
    
    // A. Fuente de sonido (Sampler)
    const source = audioContext.createBufferSource();
    source.buffer = pianoBuffer;

    // B. Matemáticas de afinación (Pitch Shifting)
    // Fórmula: 2 elevado a (semitonos / 12)
    // Esto estira o encoge el audio para dar la nota correcta
    source.playbackRate.value = Math.pow(2, semitones / 12);

    // C. Control de Volumen y Envolvente (Gain)
    const gainNode = audioContext.createGain();
    
    // Conexiones: Fuente -> Volumen -> Altavoces
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // D. Envolvente (ADSR simplificado)
    const now = audioContext.currentTime;
    // Volumen inicial (evita distorsión si se tocan muchas teclas)
    gainNode.gain.setValueAtTime(0.8, now); 
    // Decaimiento natural (como un piano real que se apaga lentamente)
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.5);

    // Reproducir
    source.start(0);
    
    // Añadir clase visual para CSS
    key.classList.add('active');
    // Quitar clase visual después de un momento
    setTimeout(() => key.classList.remove('active'), 200);
}

/* =========================================
   EVENT LISTENERS (INTERACCIÓN)
   ========================================= */

// Eventos de Mouse / Click
keys.forEach(key => {
    key.addEventListener('mousedown', () => playNote(key));
});

// Eventos de Teclado
document.addEventListener('keydown', e => {
    // Evitar que si dejas la tecla pegada se dispare mil veces
    if (e.repeat) return;
    
    const keyChar = e.key.toLowerCase();
    const whiteIndex = WHITE_KEYS.indexOf(keyChar);
    const blackIndex = BLACK_KEYS.indexOf(keyChar);

    if (whiteIndex > -1) {
        playNote(whiteKeys[whiteIndex]);
    }
    
    if (blackIndex > -1) {
        playNote(blackKeys[blackIndex]);
    }
});

// Inicialización "lazy" (al primer clic en la página)
// Los navegadores modernos bloquean el audio si no hay interacción del usuario primero.
document.addEventListener('click', () => {
    if (!audioContext) initAudio();
}, { once: true });