/* =========================================
   1. CONFIGURACIÓN Y MAPEO DE TECLAS
   ========================================= */

// Teclas del teclado de la computadora
const WHITE_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm'];
const BLACK_KEYS = ['s', 'd', 'g', 'h', 'j'];

// Lista de nombres de archivos que vamos a cargar
// Deben coincidir con el atributo data-note en tu HTML
const NOTE_NAMES = [
    'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 
    'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'
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
    // Si el contexto no existe (primera vez), intentamos iniciarlo
    if (!audioContext) initAudio();

    // Si el navegador suspendió el audio (común en Chrome), lo reanudamos
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }

    const note = key.dataset.note;
    const buffer = audioBuffers[note];

    // Si el archivo de audio para esta nota no se cargó, no hacemos nada
    if (!buffer) return;

    // Creamos una fuente de sonido
    const source = audioContext.createBufferSource();
    source.buffer = buffer;

    // Conectamos la fuente a los altavoces (destination)
    source.connect(audioContext.destination);

    // Reproducimos el sonido ahora mismo (tiempo 0)
    source.start(0);

    // --- EFECTOS VISUALES ---
    key.classList.add('active');
    // Quitamos la clase 'active' después de 150ms para que la tecla "suba"
    setTimeout(() => {
        key.classList.remove('active');
    }, 150);
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

    // Si la tecla presionada está en nuestra lista de blancas, tocarla
    if (whiteIndex > -1) {
        playNote(whiteKeys[whiteIndex]);
    }
    
    // Si la tecla presionada está en nuestra lista de negras, tocarla
    if (blackIndex > -1) {
        playNote(blackKeys[blackIndex]);
    }
});

// Inicialización Lazy:
// Los navegadores no permiten reproducir audio hasta que el usuario interactúa.
// Ponemos un listener global para iniciar el motor de audio al primer clic en cualquier lado.
document.addEventListener('click', () => {
    if (!audioContext) initAudio();
}, { once: true });