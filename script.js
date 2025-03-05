// 添加3D视图切换功能
const toggleViewBtn = document.getElementById('toggle-2d-3d');
const mapContainer = document.querySelector('.map-container');
const container3D = document.getElementById('3d-container');
let is3DView = false;
let scene, camera, renderer, controls;

toggleViewBtn.addEventListener('click', function() {
    is3DView = !is3DView;
    
    if (is3DView) {
        mapContainer.style.display = 'none';
        container3D.style.display = 'block';
        
        // 初始化3D场景
        if (!scene) {
            init3DScene();
        }
        
        // 更新3D场景
        update3DScene(currentYear);
    } else {
        mapContainer.style.display = 'block';
        container3D.style.display = 'none';
    }
});

// 初始化3D场景
function init3DScene() {
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    container3D.appendChild(renderer.domElement);
    
    // 添加轨道控制
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // 创建地形
    createTerrain();
    
    // 开始动画循环
    animate3D();
}

// 创建地形
function createTerrain() {
    // 创建一个简单的平面作为地图基础
    const geometry = new THREE.PlaneGeometry(20, 15, 20, 20);
    const texture = new THREE.TextureLoader().load('map.jpg');
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        side: THREE.DoubleSide
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
}

// 更新3D场景
function update3DScene(year) {
    // 清除之前的标记
    scene.children.forEach(child => {
        if (child.userData.type === 'marker') {
            scene.remove(child);
        }
    });
    
    // 添加战役标记
    const battles = [];
    for (let y = 431; y >= year; y--) {
        if (warData.battles[y]) {
            warData.battles[y].forEach(battle => {
                battles.push({...battle, year: y});
            });
        }
    }
    
    battles.forEach(battle => {
        const x = (battle.x - 0.5) * 20;
        const z = (battle.y - 0.5) * 15;
        
        const markerGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: battle.year === year ? 0xff0000 : 0x000000 
        });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(x, 0.2, z);
        marker.userData = { type: 'marker', name: battle.name };
        scene.add(marker);
        
        // 添加文本标签
        const textDiv = document.createElement('div');
        textDiv.className = 'battle-label';
        textDiv.textContent = battle.name;
        textDiv.style.position = 'absolute';
        textDiv.style.color = 'black';
        textDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        textDiv.style.padding = '2px 5px';
        textDiv.style.borderRadius = '3px';
        textDiv.style.fontSize = '10px';
        container3D.appendChild(textDiv);
        
        // 更新标签位置
        updateLabelPosition(marker, textDiv);
    });
}

// 更新标签位置
function updateLabelPosition(marker, label) {
    const vector = new THREE.Vector3();
    marker.updateMatrixWorld();
    vector.setFromMatrixPosition(marker.matrixWorld);
    vector.project(camera);
    
    const x = (vector.x * 0.5 + 0.5) * 800;
    const y = (-vector.y * 0.5 + 0.5) * 600;
    
    label.style.left = x + 'px';
    label.style.top = y + 'px';
}

// 3D动画循环
function animate3D() {
    requestAnimationFrame(animate3D);
    
    // 更新控制器
    controls.update();
    
    // 更新标签位置
    const labels = document.querySelectorAll('.battle-label');
    scene.children.forEach((child, index) => {
        if (child.userData.type === 'marker' && index < labels.length) {
            updateLabelPosition(child, labels[index]);
        }
    });
    
    // 渲染场景
    renderer.render(scene, camera);
}