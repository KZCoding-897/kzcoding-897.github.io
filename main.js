import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';

// 1. Crear la escena
const scene = new THREE.Scene();

// 2. Crear la cámara
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. Crear el renderizador
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. Crear un objeto (Geometría + Material = Malla)
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Un cubo verde
const cube = new THREE.Mesh(geometry, material);

// 5. Agregar el objeto a la escena
scene.add(cube);

// 6. Bucle de animación para renderizar la escena
function animate() {
    requestAnimationFrame(animate);

    // Animación simple: rotar el cubo
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();