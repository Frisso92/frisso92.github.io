let materias = [];
let planesDisponibles = [];
let currentPlan = null;
// js/main.js


const planSelect = document.getElementById('plan-select');
const planSelector = document.getElementById('plan-selector');
const planTitle = document.getElementById('plan-title');
const content = document.getElementById('content');
const materiasList = document.getElementById('materias-list');
const availableList = document.getElementById('available-list');
const progressFill = document.getElementById('progress-fill');
const porcentageCompleted = document.getElementById('porcentage-completed');
const statsContainer = document.getElementById('stats-container');
const completedCount = document.getElementById('completed-count');
const availableCount = document.getElementById('available-count');
const loading = document.getElementById('loading');
const completed = new Set();




const planesConfig = [
    {
        id: 'electronica-unsam',
        nombre: '🤖 Ingeniería Electrónica - UNSAM',
        archivo: 'electronica-unsam.csv',
        descripcion: 'Plan de estudios completo de Ingeniería Electrónica de la Universidad Nacional de San Martín'
    },
    {
        id: 'biomedica-unsam',
        nombre: '🔬 Ingeniería en Biomedicina - UNSAM',
        archivo: 'biomedica-unsam.csv',
        descripcion: 'Plan de estudios de Ingeniería en Biomedicina de la Universidad Nacional de San Martín'
    },
    {
        id: 'ambienta-unsam',
        nombre: '🏞️ Ingeniería Ambiental - UNSAM',
        archivo: 'ambiental-unsam.csv',
        descripcion: 'Plan de estudios de Ingeniería Ambiental de la Universidad Nacional de San Martín'
    },
    {
        id: 'energia-unsam',
        nombre: '⚡ Ingeniería en Energía - UNSAM',
        archivo: 'energia-unsam.csv',
        descripcion: 'Plan de estudios de Ingeniería en Energía de la Universidad Nacional de San Martín'
    }
];


// Asegurate de que la página se ha cargado completamente antes de ejecutar el código
document.addEventListener('DOMContentLoaded', function () {
    console.log(planSelect.value);
    initPlanSelector();
    initDiagramControls();
    // Aquí puedes incluir tu código

});

function initPlanSelector() {


    planesConfig.forEach(plan => {
        const option = document.createElement('option');
        option.value = plan.id;
        option.textContent = plan.nombre;
        option.title = plan.descripcion;
        planSelect.appendChild(option);

    });

    planSelect.addEventListener('change', handlePlanChange);
}
// Actualiza tu función handlePlanChange para mostrar el botón
async function handlePlanChange() {
    const selectedPlanId = this.value;
    const selectedPlan = planesConfig.find(plan => plan.id === selectedPlanId);

    if (selectedPlan) {
        planSelector.classList.add('minimized');
        planSelect.classList.add('minimized');
        planTitle.textContent = selectedPlan.nombre;
        content.classList.add('visible');

        // Mostrar el botón de exportar PDF
        const exportBtn = document.getElementById('export-pdf-btn');
        exportBtn.style.display = 'block';

        const diagramLoading = document.getElementById('diagram-loading');
        const levelsContainer = document.getElementById('levels-container');
        diagramLoading.style.display = 'block';
        levelsContainer.style.display = 'none';

    } else {
        resetInterface();
        return;
    }

    const planConfig = planesConfig.find(p => p.id === selectedPlanId);
    currentPlan = planConfig;
    completed.clear();

    await loadPlan(planConfig.archivo);
}


// Actualiza resetInterface para ocultar el botón
function resetInterface() {
    planTitle.textContent = 'Plan de Estudios';
    planSelector.classList.remove('minimized');
    planSelect.classList.remove('minimized');
    content.classList.remove('visible');

    // Ocultar el botón de exportar PDF
    const exportBtn = document.getElementById('export-pdf-btn');
    exportBtn.style.display = 'none';
}

// Función para resetear todo el progreso
function resetAllProgress() {
    // Mostrar confirmación
    const confirmation = confirm(
        '¿Estás seguro de que quieres resetear todo?\n\n' +
        'Esto hará lo siguiente:\n' +
        '• Desmarcará todas las materias completadas\n' +
        '• Moverá todas las materias al área "Sin asignar"\n' +
        '• Eliminará todos los periodos creados\n\n' +
        'Esta acción no se puede deshacer.'
    );

    if (!confirmation) {
        return;
    }

    console.log('Resetting all progress...');

    // 1. Limpiar todas las materias completadas
    completed.clear();

    // 2. Resetear los periodos - solo dejar el área sin asignar con todas las materias
    levels.length = 0;
    levels.push({
        id: 'unassigned',
        name: 'Sin asignar',
        materias: materias.map(m => m.codigo),
        collapsed: false,
        isUnassigned: true
    });

    // 3. Actualizar todas las vistas
    updateAvailable();
    updateStats();
    renderMaterias();
    renderDiagram();

    console.log('Reset completed successfully');

    // Mostrar mensaje de confirmación
    showResetMessage();
}

// Función para mostrar mensaje de confirmación del reset
function showResetMessage() {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = 'reset-notification';
    notification.innerHTML = `
        <div class="notification-content">
            ✅ Reset completado exitosamente
        </div>
    `;

    // Agregar estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
        backdrop-filter: blur(10px);
    `;

    document.body.appendChild(notification);

    // Remover la notificación después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];

    lines.forEach(line => {
        const matches = line.match(/("([^"]|"")*"|[^,]+)/g);
        if (matches && matches.length >= 4) {
            const nombre = matches[0].replace(/^"|"$/g, '').trim();
            const codigo = matches[1].replace(/^"|"$/g, '').trim() == 0 ? nombre : matches[1].replace(/^"|"$/g, '').trim();
            const cargaHoraria = matches[2].replace(/^"|"$/g, '').trim();
            const prereqsStr = matches[3].replace(/^"|"$/g, '').trim();

            let prereqs = [];
            if (prereqsStr) {
                prereqs = prereqsStr.split(',').map(p => p.trim()).filter(p => p);
            }


            if (nombre) {
                result.push({
                    nombre: nombre,
                    codigo: codigo,
                    cargaHoraria: parseFloat(cargaHoraria) || 0,
                    prereqs: prereqs
                });
            }
        }
    });

    return result;
}

async function loadPlan(archivo) {
    try {
        const response = await fetch(`./planes/${archivo}`);
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.status}`);
        }
        const csvText = await response.text();
        materias = parseCSV(csvText);

        if (materias.length === 0) {
            throw new Error('No se pudieron cargar las materias');
        }

        // Vista lista
        loading.style.display = 'none';
        materiasList.style.display = 'block';
        renderMaterias();

        // Vista diagrama
        const diagramLoading = document.getElementById('diagram-loading');
        const levelsContainer = document.getElementById('levels-container');
        diagramLoading.style.display = 'none';
        levelsContainer.style.display = 'block';
        initDiagram();

        updateAvailable();
        updateStats();
    } catch (error) {
        console.error('Error cargando plan:', error);
        const errorMsg = `
            <div style="color: red; text-align: center;">
                ❌ Error al cargar el plan de estudios<br>
                <small>${error.message}</small><br>
                <small>Verifica que el archivo ./planes/${archivo} exists</small>
            </div>
        `;
        loading.innerHTML = errorMsg;

        // Also show error in diagram
        const diagramLoading = document.getElementById('diagram-loading');
        diagramLoading.innerHTML = errorMsg;
    }
}

function toggleMateriaCompletion(codigo, isChecked) {
    if (isChecked) {
        completed.add(codigo);
    } else {
        completed.delete(codigo);
    }

    updateAvailable();
    updateStats();
    renderMaterias();

    // Re-ordenar todos los niveles después del cambio
    reorderAllLevels();

    if (levels.length > 0) {
        renderDiagram();
    }
}

function renderMaterias() {
    materiasList.innerHTML = '';

    materias.forEach(m => {
        const div = document.createElement('div');
        div.className = 'materia-item';

        if (completed.has(m.codigo)) {
            div.classList.add('completed');
        }

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = m.codigo;
        cb.checked = completed.has(m.codigo);
        cb.addEventListener('change', () => {
            toggleMateriaCompletion(m.codigo, cb.checked);
            if (cb.checked) {
                div.classList.add('completed');
            } else {
                div.classList.remove('completed');
            }
        });

        const label = document.createElement('label');
        label.htmlFor = m.codigo;

        const cargaInfo = m.cargaHoraria ? ` (${m.cargaHoraria}h)` : '';
        label.innerHTML = `<span class="materia-codigo">${m.codigo}</span>
            <span class="materia-nombre">${m.nombre}</span>
            <span class="materia-carga">${cargaInfo}</span>
        `;

        label.prepend(cb);
        div.append(label);
        materiasList.appendChild(div);
    });
}

function updateAvailable() {
    const availableSubjects = [];

    materias.forEach(m => {
        if (completed.has(m.codigo)) return;
        const ok = m.prereqs.every(p => completed.has(p));
        if (ok) {
            availableSubjects.push(m);
        }
    });

    if (availableSubjects.length === 0) {
        const message = completed.size === 0 ?
            'Selecciona materias completadas para ver las disponibles' :
            'No hay materias disponibles para cursar';

        availableList.innerHTML = `
            <div class="empty-state">
                <span style="font-size: 3rem;"></span>
                <div>${message}</div>
            </div>
        `;
    } else {
        availableList.innerHTML = '';
        availableSubjects.forEach(m => {
            const div = document.createElement('div');
            div.className = 'available-item';
            const cargaInfo = m.cargaHoraria ? ` (${m.cargaHoraria}h)` : '';
            div.innerHTML = `<span class="materia-codigo">${m.codigo}</span>
            <span class="materia-nombre">${m.nombre}</span>
            <span class="materia-carga">${cargaInfo}</span>
        `;
            availableList.appendChild(div);
        });
    }
}

function updateStats() {
    const completedSize = completed.size;
    const totalMaterias = materias.length;
    const availableSize = materias.filter(m =>
        !completed.has(m.codigo) && m.prereqs.every(p => completed.has(p))
    ).length;
    const remaining = totalMaterias - completedSize;

    const progress = totalMaterias > 0 ? (completedSize / totalMaterias) * 100 : 0;

    porcentageCompleted.textContent = `${progress.toFixed(2)}%`;
    progressFill.style.width = `${progress}%`;
    completedCount.textContent = `✅ Materias Completadas: ${completedSize}`;
    availableCount.textContent = `🎯 Materias Disponibles: ${availableSize}`;
}


























//DIAGRAMA

let levels = [];
let zoomLevel = 1;
let isDragging = false;
let draggedElement = null;


// Elementos del diagrama
const listView = document.getElementById('list-view');
const diagramView = document.getElementById('diagram-view');
const tabButtons = document.querySelectorAll('.tab-button');
const diagramContent = document.getElementById('diagram-content');
const levelsContainer = document.getElementById('levels-container');
const diagramLoading = document.getElementById('diagram-loading');


// Inicializar controles del diagrama
function initDiagramControls() {
    const addLevelBtn = document.getElementById('add-level-btn');
    addLevelBtn.addEventListener('click', addLevel);

    const autoDistributeBtn = document.getElementById('auto-distribute-btn');
    autoDistributeBtn.addEventListener('click', autoDistributeMaterias);

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', resetAllProgress);

    // Agregar listener para el botón de exportar PDF
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    exportPdfBtn.addEventListener('click', exportToPDF);
}


// Funciones del diagrama de flujo

function initDiagram() {
    levels = [
        {
            id: 'unassigned',
            name: 'Sin asignar',
            materias: materias.map(m => m.codigo),
            collapsed: false,
            isUnassigned: true
        }
    ];

    renderDiagram();
}

function autoOrganizeInitialLevels() {
    // Materias sin prerrequisitos van al primer periodo
    const materiasLevel1 = materias.filter(m => m.prereqs.length === 0);
    levels[0].materias = materiasLevel1.map(m => m.codigo);

    // Las demás quedan sin asignar inicialmente
    levels.push({
        id: 'unassigned',
        name: 'Sin asignar',
        materias: materias.filter(m => m.prereqs.length > 0).map(m => m.codigo),
        collapsed: false,
        isUnassigned: true
    });
}


function renderDiagram() {
    const levelsContainer = document.getElementById('levels-container');
    levelsContainer.innerHTML = '';
    levelsContainer.style.display = 'block'; // Make sure it's visible

    levels.forEach(level => {
        const levelElement = createLevelElement(level);
        levelsContainer.appendChild(levelElement);
    });

    // Setup drop zones
    levelsContainer.childNodes.forEach((levelElement) => {
        const content = levelElement.querySelector(`[data-level-id="${levelElement.getAttribute('data-level-id')}"]`);
        setupDropZone(content);
    });

    // Add SVG for connections
    setTimeout(() => {
        renderConnections();
    }, 100);
}
function createLevelElement(level) {
    const levelDiv = document.createElement('div');
    levelDiv.className = 'level';
    levelDiv.setAttribute('data-level-id', level.id);

    if (level.isUnassigned) {
        const unassignedStats = getUnassignedStats(level);
        // Ordenar materias en el área sin asignar también
        const sortedMaterias = sortMateriasByStatus(level.materias);

        levelDiv.classList.add('unassigned-area');
        levelDiv.innerHTML = `
            <div class="unassigned-header">
                📦 Materias Sin Asignar
                <span class="level-stats">${unassignedStats.total} materias • ${unassignedStats.totalCarga}h</span>
            </div>
            <div class="unassigned-content" data-level-id="${level.id}">
                ${sortedMaterias.map(codigo => createMateriaNode(codigo)).join('')}
            </div>
        `;
    } else {
        const stats = getLevelStats(level);
        const allCompleted = stats.total > 0 && stats.completed === stats.total;

        // Ordenar materias por estado
        const sortedMaterias = sortMateriasByStatus(level.materias);

        levelDiv.innerHTML = `
            <div class="level-header ${level.collapsed ? 'collapsed' : ''}">
                <input type="checkbox" 
                       class="level-complete-checkbox" 
                       ${allCompleted ? 'checked' : ''}
                       onchange="toggleLevelCompletion('${level.id}', this.checked)"
                       onclick="event.stopPropagation()"
                       title="Marcar/desmarcar todas las materias del nivel">
                <button class="level-toggle">${level.collapsed ? '▶' : '▼'}</button>
                <span class="level-title">${level.name}</span>
                <span class="level-stats">
                    ${stats.total} materias • ${stats.totalCarga}h
                    <span class="completed-info">(${stats.completed} completadas • ${stats.completedCarga}h)</span>
                </span>
                <button class="level-remove" onclick="removeLevel('${level.id}')">🗑️</button>
            </div>
            <div class="level-content ${level.collapsed ? 'collapsed' : ''}" data-level-id="${level.id}">
                ${sortedMaterias.map(codigo => createMateriaNode(codigo)).join('')}
            </div>
        `;

        // Add event listeners
        const toggleBtn = levelDiv.querySelector('.level-toggle');
        toggleBtn.addEventListener('click', () => toggleLevel(level.id));
    }

    // Make that the content is droppable
    const content = levelDiv.querySelector(`[data-level-id="${level.id}"]`);
    setupDropZone(content);

    return levelDiv;
}

// Función para ordenar materias por estado
function sortMateriasByStatus(materiasCodigos) {
    const materiasWithStatus = materiasCodigos.map(codigo => {
        const materia = materias.find(m => m.codigo === codigo);
        if (!materia) return null;

        const status = getMateriaStatus(materia);
        return {
            codigo: codigo,
            materia: materia,
            status: status,
            nombre: materia.nombre,
            cargaHoraria: materia.cargaHoraria || 0
        };
    }).filter(item => item !== null);

    // Definir el orden de prioridad
    const statusPriority = {
        'available': 1,    // Disponibles primero
        'blocked': 2,      // Bloqueadas segundo
        'completed': 3,    // Completadas tercero
        'unassigned': 4    // Sin asignar último
    };

    // Ordenar por estado, luego por nombre alfabéticamente
    materiasWithStatus.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 5;
        const priorityB = statusPriority[b.status] || 5;

        // Primero por prioridad de estado
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        // Si tienen el mismo estado, ordenar alfabéticamente por nombre
        return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
    });

    return materiasWithStatus.map(item => item.codigo);
}

function reorderAllLevels() {
    levels.forEach(level => {
        if (level.materias.length > 0) {
            level.materias = sortMateriasByStatus(level.materias);
        }
    });
}

function createMateriaNode(codigo) {
    const materia = materias.find(m => m.codigo === codigo);
    if (!materia) return '';

    const status = getMateriaStatus(materia);
    const cargaInfo = materia.cargaHoraria ? `${materia.cargaHoraria}h` : '';

    return `
        <div class="materia-node ${status}" 
             data-codigo="${codigo}"
             draggable="true"
             ondragstart="startDrag(event, '${codigo}')"
             onclick="toggleMateria('${codigo}')">
            <input type="checkbox" 
                   class="materia-checkbox" 
                   ${completed.has(codigo) ? 'checked' : ''}
                   onchange="handleDiagramCheckbox('${codigo}', this.checked)"
                   onclick="event.stopPropagation()">
            <div class="materia-codigo">${codigo}</div>
            <div class="materia-nombre">${materia.nombre}</div>
            ${cargaInfo ? `<div class="materia-carga">${cargaInfo}</div>` : ''}
        </div>
    `;
}

function getMateriaStatus(materia) {
    if (completed.has(materia.codigo)) return 'completed';

    const canTake = materia.prereqs.every(prereq => completed.has(prereq));
    if (canTake) return 'available';

    // Verificar si está en un periodo asignado
    const isAssigned = levels.some(level =>
        !level.isUnassigned && level.materias.includes(materia.codigo)
    );

    return isAssigned ? 'blocked' : 'unassigned';
}

function getLevelStats(level) {
    const total = level.materias.length;
    const completedInLevel = level.materias.filter(codigo => completed.has(codigo)).length;

    // Calculate total carga horaria for the level
    const totalCarga = level.materias.reduce((sum, codigo) => {
        const materia = materias.find(m => m.codigo === codigo);
        return sum + (materia?.cargaHoraria || 0);
    }, 0);

    // Calculate completed carga horaria
    const completedCarga = level.materias.reduce((sum, codigo) => {
        if (completed.has(codigo)) {
            const materia = materias.find(m => m.codigo === codigo);
            return sum + (materia?.cargaHoraria || 0);
        }
        return sum;
    }, 0);

    return {
        total,
        completed: completedInLevel,
        totalCarga,
        completedCarga
    };
}

function getUnassignedStats(level) {
    const total = level.materias.length;

    const totalCarga = level.materias.reduce((sum, codigo) => {
        const materia = materias.find(m => m.codigo === codigo);
        return sum + (materia?.cargaHoraria || 0);
    }, 0);

    return { total, totalCarga };
}

// Funciones de drag and drop
function setupDropZone(element) {
    console.log('Configurando drop zone para', element);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDrop);
    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDragEnter(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    console.log('Elemento droppeado en', e.currentTarget);

    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const targetLevelId = e.currentTarget.getAttribute('data-level-id');
    const draggedCodigo = e.dataTransfer.getData('text/plain');

    moveMateria(draggedCodigo, targetLevelId);
}

function startDrag(e, codigo) {
    if (e.target.classList.contains('materia-checkbox')) {
        return;
    }

    e.dataTransfer.setData('text/plain', codigo);
    e.target.classList.add('dragging');

    setTimeout(() => {
        e.target.classList.remove('dragging');
    }, 0);
}

function moveMateria(codigo, targetLevelId) {
    // Remover de todos los niveles
    levels.forEach(level => {
        const index = level.materias.indexOf(codigo);
        if (index > -1) {
            level.materias.splice(index, 1);
        }
    });

    // Agregar al nivel destino
    const targetLevel = levels.find(level => level.id === targetLevelId);
    if (targetLevel) {
        targetLevel.materias.push(codigo);
        // Re-ordenar el nivel destino
        targetLevel.materias = sortMateriasByStatus(targetLevel.materias);
    }

    renderDiagram();
}

// Funciones de control de periodos
function addLevel() {
    const levelNumber = levels.filter(l => !l.isUnassigned).length + 1;
    const newLevel = {
        id: `level-${Date.now()}`,
        name: `Periodo ${levelNumber}`,
        materias: [],
        collapsed: false
    };

    // Insertar antes del área sin asignar
    const unassignedIndex = levels.findIndex(l => l.isUnassigned);
    if (unassignedIndex > -1) {
        levels.splice(unassignedIndex, 0, newLevel);
    } else {
        levels.push(newLevel);
    }

    renderDiagram();
}

function removeLevel(levelId) {
    if (confirm('¿Estás seguro de que quieres eliminar este periodo? Las materias se moverán al área sin asignar.')) {
        const levelIndex = levels.findIndex(l => l.id === levelId);
        if (levelIndex > -1) {
            const level = levels[levelIndex];

            // Mover materias al área sin asignar
            const unassignedLevel = levels.find(l => l.isUnassigned);
            if (unassignedLevel) {
                unassignedLevel.materias.push(...level.materias);
            }

            levels.splice(levelIndex, 1);
            renderDiagram();
        }
    }
}

function toggleLevel(levelId) {
    const level = levels.find(l => l.id === levelId);
    if (level) {
        level.collapsed = !level.collapsed;
        renderDiagram();
    }
}

function toggleAllLevels() {
    const hasCollapsed = levels.some(l => l.collapsed);
    levels.forEach(level => {
        if (!level.isUnassigned) {
            level.collapsed = !hasCollapsed;
        }
    });
    renderDiagram();
}

// Funciones de zoom
function setZoom(newZoom) {
    zoomLevel = Math.max(0.3, Math.min(3, newZoom));
    diagramContent.style.transform = `scale(${zoomLevel})`;
}


// Renderizar conexiones entre materias
function renderConnections() {
    // Remove existing SVG
    const existingSvg = document.querySelector('.connections-svg');
    if (existingSvg) {
        existingSvg.remove();
    }

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('connections-svg');
    svg.innerHTML = `
        <defs>
            <!-- Default arrow for unassigned -->
            <marker id="arrowhead" markerWidth="8" markerHeight="6" 
                    refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(108, 117, 125, 0.6)" />
            </marker>
            
            <!-- Smaller arrow for completed -->
            <marker id="arrowhead-completed" markerWidth="6" markerHeight="4" 
                    refX="5" refY="2" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 6 2, 0 4" fill="rgba(40, 167, 69, 0.7)" />
            </marker>
            
            <!-- Larger arrow for assigned -->
            <marker id="arrowhead-assigned" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(0, 123, 255, 0.8)" />
            </marker>
            
            <!-- Blocked arrows -->
            <marker id="arrowhead-blocked" markerWidth="8" markerHeight="6" 
                    refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(220, 53, 69, 0.6)" />
            </marker>
            
            <marker id="arrowhead-blocked-assigned" markerWidth="10" markerHeight="7" 
                    refX="9" refY="3.5" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(220, 53, 69, 0.8)" />
            </marker>
        </defs>
    `;

    diagramContent.appendChild(svg);

    // Create connection lines
    setTimeout(() => {
        drawConnections(svg);
    }, 50);
}

function drawConnections(svg) {
    materias.forEach(materia => {
        const targetNode = document.querySelector(`[data-codigo="${materia.codigo}"]`);
        if (!targetNode) return;

        // Check if target node is visible (not in a collapsed level)
        const targetLevel = targetNode.closest('.level-content');
        if (targetLevel && targetLevel.classList.contains('collapsed')) {
            return; // Skip drawing connections to hidden nodes
        }

        materia.prereqs.forEach(prereqCodigo => {
            const sourceNode = document.querySelector(`[data-codigo="${prereqCodigo}"]`);
            if (!sourceNode) return;

            // Check if source node is visible (not in a collapsed level)
            const sourceLevel = sourceNode.closest('.level-content');
            if (sourceLevel && sourceLevel.classList.contains('collapsed')) {
                return; // Skip drawing connections from hidden nodes
            }

            const line = createConnectionLine(sourceNode, targetNode, materia);
            if (line) {
                svg.appendChild(line);
            }
        });
    });
}

function createConnectionLine(sourceNode, targetNode, targetMateria) {
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const containerRect = diagramContent.getBoundingClientRect();

    // Calculate relative positions to the diagram container
    const sourceX = (sourceRect.left - containerRect.left) + sourceRect.width / 2;
    const sourceY = (sourceRect.bottom - containerRect.top);
    const targetX = (targetRect.left - containerRect.left) + targetRect.width / 2;
    const targetY = (targetRect.top - containerRect.top);

    // Create curved line
    const midY = sourceY + (targetY - sourceY) * 0.6;
    const pathData = `M ${sourceX} ${sourceY} Q ${sourceX} ${midY} ${targetX} ${targetY}`;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.classList.add('connection-line');

    // Determine if both materias are assigned (not in unassigned area)
    const sourceIsAssigned = !isInUnassignedArea(sourceNode);
    const targetIsAssigned = !isInUnassignedArea(targetNode);
    const bothAssigned = sourceIsAssigned && targetIsAssigned;

    // Determine target status
    const targetStatus = getMateriaStatus(targetMateria);

    if (bothAssigned) {
        path.classList.add('assigned');
    }

    // Apply styling based on status
    if (targetStatus === 'completed') {
        path.classList.add('completed');
        path.setAttribute('marker-end', 'url(#arrowhead-completed)');
    } else if (targetStatus === 'blocked') {
        path.classList.add('blocked');
        if (bothAssigned) {
            path.setAttribute('marker-end', 'url(#arrowhead-blocked-assigned)');
        } else {
            path.setAttribute('marker-end', 'url(#arrowhead-blocked)');
        }
    } else {
        // Available or unassigned
        if (bothAssigned) {
            path.setAttribute('marker-end', 'url(#arrowhead-assigned)');
        } else {
            path.setAttribute('marker-end', 'url(#arrowhead)');
        }
    }

    return path;
}

// Helper function to check if a materia is in the unassigned area
function isInUnassignedArea(materiaNode) {
    return materiaNode.closest('.unassigned-area') !== null;
}

function handleDiagramCheckbox(codigo, isChecked) {
    toggleMateriaCompletion(codigo, isChecked);

    // Update the corresponding checkbox in the list view
    const listCheckbox = document.getElementById(codigo);
    if (listCheckbox) {
        listCheckbox.checked = isChecked;
        const materiaItem = listCheckbox.closest('.materia-item');
        if (materiaItem) {
            if (isChecked) {
                materiaItem.classList.add('completed');
            } else {
                materiaItem.classList.remove('completed');
            }
        }
    }
}

function toggleMateria(codigo) {
    const isCurrentlyCompleted = completed.has(codigo);
    toggleMateriaCompletion(codigo, !isCurrentlyCompleted);

    // Update both checkboxes
    const listCheckbox = document.getElementById(codigo);
    const diagramCheckbox = document.querySelector(`[data-codigo="${codigo}"] .materia-checkbox`);

    if (listCheckbox) {
        listCheckbox.checked = !isCurrentlyCompleted;
        const materiaItem = listCheckbox.closest('.materia-item');
        if (materiaItem) {
            if (!isCurrentlyCompleted) {
                materiaItem.classList.add('completed');
            } else {
                materiaItem.classList.remove('completed');
            }
        }
    }

    if (diagramCheckbox) {
        diagramCheckbox.checked = !isCurrentlyCompleted;
    }
}


// Add function to handle level completion
function toggleLevelCompletion(levelId, isChecked) {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    // Toggle completion for all materias in this level
    level.materias.forEach(codigo => {
        if (isChecked) {
            completed.add(codigo);
        } else {
            completed.delete(codigo);
        }
    });

    // Update everything
    updateAvailable();
    updateStats();
    renderMaterias();
    renderDiagram();
}


// Main function to automatically distribute materias (updated)
function autoDistributeMaterias() {
    const maxMateriasPerLevel = parseInt(document.getElementById('max-materias-per-level').value) || 6;
    const maxCargaPerLevel = parseInt(document.getElementById('max-carga-per-level').value) || 300;

    console.log(`Optimizing distribution with max ${maxMateriasPerLevel} materias and ${maxCargaPerLevel}h per level`);

    // Use the new optimized algorithm
    const distribution = findOptimalDistribution(maxMateriasPerLevel, maxCargaPerLevel);

    // Apply the distribution to the levels
    applyDistribution(distribution);

    // Re-render the diagram
    renderDiagram();
}

// New optimized algorithm using dynamic programming approach
function findOptimalDistribution(maxMaterias, maxCarga) {
    console.time('Distribution calculation');

    // Build dependency graph
    const dependencyGraph = buildDependencyGraph();
    const reverseDependencyGraph = buildReverseDependencyGraph();

    // Find the optimal solution using multiple strategies
    let bestDistribution = null;
    let minLevels = Infinity;

    // Strategy 1: Greedy with priority scoring
    const greedy = greedyWithPriorityScoring(maxMaterias, maxCarga, dependencyGraph, reverseDependencyGraph);
    if (greedy.length < minLevels) {
        minLevels = greedy.length;
        bestDistribution = greedy;
    }

    // Strategy 2: Level-by-level optimization
    const levelOptimized = levelByLevelOptimization(maxMaterias, maxCarga, dependencyGraph, reverseDependencyGraph);
    if (levelOptimized.length < minLevels) {
        minLevels = levelOptimized.length;
        bestDistribution = levelOptimized;
    }

    // Strategy 3: Backtracking for small problem sizes
    if (materias.length <= 50) {
        const backtrackResult = backtrackOptimization(maxMaterias, maxCarga, dependencyGraph);
        if (backtrackResult.length < minLevels) {
            minLevels = backtrackResult.length;
            bestDistribution = backtrackResult;
        }
    }

    console.timeEnd('Distribution calculation');
    console.log(`Optimal distribution found: ${bestDistribution.length} levels`);

    return bestDistribution;
}

// Build dependency graph for faster lookups
function buildDependencyGraph() {
    const graph = new Map();

    materias.forEach(materia => {
        graph.set(materia.codigo, {
            ...materia,
            dependencies: new Set(materia.prereqs),
            dependents: new Set()
        });
    });

    // Add dependents
    materias.forEach(materia => {
        materia.prereqs.forEach(prereq => {
            if (graph.has(prereq)) {
                graph.get(prereq).dependents.add(materia.codigo);
            }
        });
    });

    return graph;
}

// Build reverse dependency graph
function buildReverseDependencyGraph() {
    const reverseGraph = new Map();

    materias.forEach(materia => {
        materia.prereqs.forEach(prereq => {
            if (!reverseGraph.has(prereq)) {
                reverseGraph.set(prereq, new Set());
            }
            reverseGraph.get(prereq).add(materia.codigo);
        });
    });

    return reverseGraph;
}


// Strategy 1: Greedy with advanced priority scoring
function greedyWithPriorityScoring(maxMaterias, maxCarga, depGraph, reverseDepGraph) {
    const distribution = [];
    const assigned = new Set();
    let levelNumber = 1;

    while (assigned.size < materias.length) {
        const candidates = getAvailableCandidatesOptimized(assigned, depGraph);
        if (candidates.length === 0) break;

        // Advanced priority scoring
        const scoredCandidates = candidates.map(materia => ({
            ...materia,
            priority: calculateAdvancedPriority(materia, assigned, depGraph, reverseDepGraph)
        })).sort((a, b) => b.priority - a.priority);

        const levelMaterias = selectOptimalMateriasForLevel(scoredCandidates, maxMaterias, maxCarga);

        if (levelMaterias.length === 0) break;

        distribution.push({
            id: `level-${levelNumber}`,
            name: `Periodo ${levelNumber}`,
            materias: levelMaterias,
            collapsed: false
        });

        levelMaterias.forEach(codigo => assigned.add(codigo));
        levelNumber++;
    }

    return distribution;
}



// Strategy 2: Level-by-level optimization with look-ahead
function levelByLevelOptimization(maxMaterias, maxCarga, depGraph, reverseDepGraph) {
    const distribution = [];
    const assigned = new Set();
    let levelNumber = 1;

    while (assigned.size < materias.length) {
        const candidates = getAvailableCandidatesOptimized(assigned, depGraph);
        if (candidates.length === 0) break;

        // Try different combinations and pick the one that enables most future materias
        const bestCombination = findBestLevelCombination(candidates, assigned, maxMaterias, maxCarga, depGraph, reverseDepGraph);

        if (bestCombination.length === 0) break;

        distribution.push({
            id: `level-${levelNumber}`,
            name: `Periodo ${levelNumber}`,
            materias: bestCombination,
            collapsed: false
        });

        bestCombination.forEach(codigo => assigned.add(codigo));
        levelNumber++;
    }

    return distribution;
}

// Strategy 3: Backtracking optimization (for smaller datasets)
function backtrackOptimization(maxMaterias, maxCarga, depGraph) {
    const assigned = new Set();
    const bestResult = { distribution: [], minLevels: Infinity };

    function backtrack(currentDistribution, currentAssigned, remainingMaterias) {
        if (remainingMaterias.length === 0) {
            if (currentDistribution.length < bestResult.minLevels) {
                bestResult.minLevels = currentDistribution.length;
                bestResult.distribution = JSON.parse(JSON.stringify(currentDistribution));
            }
            return;
        }

        // Pruning: if current path already exceeds best known solution
        if (currentDistribution.length >= bestResult.minLevels) return;

        const candidates = remainingMaterias.filter(materia =>
            materia.prereqs.every(prereq => currentAssigned.has(prereq))
        );

        if (candidates.length === 0) return;

        // Generate possible level combinations
        const combinations = generateLevelCombinations(candidates, maxMaterias, maxCarga, 5); // Limit combinations for performance

        for (const combination of combinations) {
            const newAssigned = new Set([...currentAssigned, ...combination]);
            const newRemaining = remainingMaterias.filter(m => !combination.includes(m.codigo));
            const newLevel = {
                id: `level-${currentDistribution.length + 1}`,
                name: `Periodo ${currentDistribution.length + 1}`,
                materias: combination,
                collapsed: false
            };

            backtrack([...currentDistribution, newLevel], newAssigned, newRemaining);
        }
    }

    backtrack([], assigned, materias);
    return bestResult.distribution;
}



// Calculate advanced priority score for a materia
function calculateAdvancedPriority(materia, assigned, depGraph, reverseDepGraph) {
    let priority = 0;

    // Factor 1: Number of direct dependents (higher = better)
    const directDependents = reverseDepGraph.get(materia.codigo)?.size || 0;
    priority += directDependents * 10;

    // Factor 2: Number of indirect dependents (cascade effect)
    priority += calculateCascadeEffect(materia.codigo, reverseDepGraph, assigned) * 5;

    // Factor 3: Critical path length (longer path from this materia = higher priority)
    priority += calculateCriticalPath(materia.codigo, reverseDepGraph) * 3;

    // Factor 4: Inverse of carga horaria (prefer lighter materias to fit more)
    priority += (1000 - (materia.cargaHoraria || 0)) * 0.1;

    // Factor 5: Depth in dependency tree (earlier materias = higher priority)
    priority += (10 - materia.prereqs.length) * 2;

    return priority;
}

// Calculate cascade effect (how many materias become available by taking this one)
function calculateCascadeEffect(codigo, reverseDepGraph, assigned, visited = new Set()) {
    if (visited.has(codigo)) return 0;
    visited.add(codigo);

    let cascade = 0;
    const directDependents = reverseDepGraph.get(codigo) || new Set();

    for (const dependent of directDependents) {
        if (!assigned.has(dependent)) {
            cascade += 1;
            cascade += calculateCascadeEffect(dependent, reverseDepGraph, assigned, visited) * 0.5;
        }
    }

    return cascade;
}

// Calculate critical path length from this materia
function calculateCriticalPath(codigo, reverseDepGraph, visited = new Set()) {
    if (visited.has(codigo)) return 0;
    visited.add(codigo);

    const dependents = reverseDepGraph.get(codigo) || new Set();
    if (dependents.size === 0) return 1;

    let maxPath = 0;
    for (const dependent of dependents) {
        maxPath = Math.max(maxPath, calculateCriticalPath(dependent, reverseDepGraph, visited));
    }

    return 1 + maxPath;
}

// Find the best combination of materias for a single level
function findBestLevelCombination(candidates, assigned, maxMaterias, maxCarga, depGraph, reverseDepGraph) {
    const combinations = generateLevelCombinations(candidates, maxMaterias, maxCarga, 10);
    let bestCombination = [];
    let bestScore = -1;

    for (const combination of combinations) {
        const score = evaluateLevelCombination(combination, assigned, reverseDepGraph);
        if (score > bestScore) {
            bestScore = score;
            bestCombination = combination;
        }
    }

    return bestCombination;
}




// Generate possible combinations for a level
function generateLevelCombinations(candidates, maxMaterias, maxCarga, maxCombinations) {
    const combinations = [];

    // Start with greedy selection
    const greedy = selectOptimalMateriasForLevel(candidates, maxMaterias, maxCarga);
    combinations.push(greedy);

    // Generate variations by trying different starting points
    for (let i = 0; i < Math.min(candidates.length, maxCombinations - 1); i++) {
        const variation = selectOptimalMateriasForLevel(
            candidates.slice(i).concat(candidates.slice(0, i)),
            maxMaterias,
            maxCarga
        );
        if (variation.length > 0 && !combinations.some(c => arraysEqual(c, variation))) {
            combinations.push(variation);
        }
    }

    return combinations.slice(0, maxCombinations);
}

// Evaluate how good a level combination is
function evaluateLevelCombination(combination, assigned, reverseDepGraph) {
    let score = 0;
    const newAssigned = new Set([...assigned, ...combination]);

    // Score based on how many new materias become available
    materias.forEach(materia => {
        if (!newAssigned.has(materia.codigo) && !assigned.has(materia.codigo)) {
            const wouldBeAvailable = materia.prereqs.every(prereq => newAssigned.has(prereq));
            const wasAvailable = materia.prereqs.every(prereq => assigned.has(prereq));

            if (wouldBeAvailable && !wasAvailable) {
                score += 10; // New materia becomes available
            }
        }
    });

    // Bonus for taking more materias (fill the level efficiently)
    score += combination.length * 5;

    return score;
}

// Optimized candidate selection
function getAvailableCandidatesOptimized(assigned, depGraph) {
    const candidates = [];

    for (const [codigo, materia] of depGraph) {
        if (assigned.has(codigo)) continue;

        const canTake = materia.dependencies.size === 0 ||
            Array.from(materia.dependencies).every(prereq => assigned.has(prereq));

        if (canTake) {
            candidates.push(materia);
        }
    }

    return candidates;
}

// Improved materia selection for a level using knapsack-like approach
function selectOptimalMateriasForLevel(candidates, maxMaterias, maxCarga) {
    if (candidates.length === 0) return [];

    // Sort by priority (already calculated)
    const sortedCandidates = candidates.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    // Use dynamic programming approach for better packing
    return knapsackSelection(sortedCandidates, maxMaterias, maxCarga);
}

// Knapsack-based selection to optimize both materia count and carga constraints
function knapsackSelection(candidates, maxMaterias, maxCarga) {
    const n = Math.min(candidates.length, maxMaterias);
    const selected = [];
    let currentCarga = 0;

    // Greedy selection with look-ahead
    for (let i = 0; i < candidates.length && selected.length < maxMaterias; i++) {
        const candidate = candidates[i];
        const newCarga = currentCarga + (candidate.cargaHoraria || 0);

        if (newCarga <= maxCarga) {
            selected.push(candidate.codigo);
            currentCarga = newCarga;
        }
    }

    return selected;
}

// Utility function to compare arrays
function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, i) => val === sortedB[i]);
}





// Apply the calculated distribution to the levels array
// Apply the calculated distribution to the levels array
function applyDistribution(distribution) {
    // Clear existing levels completely
    levels.length = 0;

    // Add the new distribution levels
    levels.push(...distribution);

    // Calculate which materias have been assigned
    const assignedMaterias = new Set();
    distribution.forEach(level => {
        level.materias.forEach(codigo => assignedMaterias.add(codigo));
    });

    // Find materias that are not assigned to any level
    const unassignedMaterias = materias
        .filter(m => !assignedMaterias.has(m.codigo))
        .map(m => m.codigo);

    // Always add the unassigned level (even if empty)
    levels.push({
        id: 'unassigned',
        name: 'Sin asignar',
        materias: unassignedMaterias,
        collapsed: false,
        isUnassigned: true
    });

    console.log(`Distribution applied:`);
    console.log(`- Created ${distribution.length} levels`);
    console.log(`- ${assignedMaterias.size} materias assigned`);
    console.log(`- ${unassignedMaterias.length} materias unassigned`);

    distribution.forEach((level, i) => {
        const totalCarga = level.materias.reduce((sum, codigo) => {
            const materia = materias.find(m => m.codigo === codigo);
            return sum + (materia?.cargaHoraria || 0);
        }, 0);
        console.log(`  Level ${i + 1}: ${level.materias.length} materias, ${totalCarga}h`);
    });
}


















// Función principal
async function exportToPDF() {
    if (!currentPlan) {
        alert('Por favor selecciona un plan de estudios primero');
        return;
    }

    const exportBtn = document.getElementById('export-pdf-btn');
    const originalText = exportBtn.innerHTML;

    try {
        exportBtn.innerHTML = '⏳ Creando contenido...';
        exportBtn.disabled = true;

        // Crear el contenedor para el PDF
        const pdfContainer = createPDFContainer();

        // Debug: verificar que el contenedor tenga contenido
        console.log('PDF Container content:', pdfContainer.innerHTML.length);
        console.log('PDF Container:', pdfContainer);

        // Agregar al DOM de manera visible temporalmente para debugging
        pdfContainer.style.position = 'fixed';
        pdfContainer.style.top = '0';
        pdfContainer.style.left = '50%';
        pdfContainer.style.transform = 'translate(-43%, 0)';
        pdfContainer.style.zIndex = '10000';
        pdfContainer.style.backgroundColor = 'white';
        pdfContainer.style.width = '1200px';
        pdfContainer.style.height = 'auto';
        pdfContainer.style.overflow = 'visible';


        document.body.appendChild(pdfContainer);

        // Esperar un momento para que se renderice
        await new Promise(resolve => setTimeout(resolve, 1000));

        exportBtn.innerHTML = '⏳ Generando PDF...';

        // Verificar que el contenedor sea visible
        const rect = pdfContainer.getBoundingClientRect();
        console.log('Container dimensions:', rect);

        if (rect.width === 0 || rect.height === 0) {
            throw new Error('El contenedor del PDF no tiene dimensiones válidas');
        }

        // Generar el PDF
        await generatePDF(pdfContainer);

        // Limpiar
        document.body.removeChild(pdfContainer);

        showSuccessNotification('PDF generado exitosamente');

    } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Error al generar el PDF: ${error.message}`);
    } finally {
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }
}


// Crear el contenedor con el contenido del PDF
function createPDFContainer() {
    const container = document.createElement('div');
    container.className = 'pdf-container';

    // Asegurar estilos inline para compatibilidad
    container.style.cssText = `
    background: white;
    color: #333;
    font-family: Arial, sans-serif;
    padding: 20px;
    width: 800px;  // Reduced from 1200px
    min-height: 600px;
    box-sizing: border-box;
    display: block;
    visibility: visible;
    position: relative;
`;

    // Verificar que tenemos datos
    if (!currentPlan || !materias || materias.length === 0) {
        container.innerHTML = '<h1>Error: No hay datos para generar el PDF</h1>';
        return container;
    }

    // Header del PDF
    const header = document.createElement('div');
    header.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 3px solid #6f42c1;
        padding-bottom: 20px;
    `;
    header.innerHTML = `
        <h1 style="font-size: 28px; font-weight: bold; color: #6f42c1; margin-bottom: 10px; margin-top: 0;">
            FLOWBOX - Plan de Estudios
        </h1>
        <h2 style="font-size: 18px; color: #666; margin: 0;">
            ${currentPlan.nombre}
        </h2>
    `;
    container.appendChild(header);

    // Estadísticas
    const stats = createPDFStatsInline();
    container.appendChild(stats);

    // Diagrama
    const diagram = createPDFDiagramInline();
    container.appendChild(diagram);

    // Footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        margin-top: 30px;
        text-align: center;
        color: #6c757d;
        font-size: 12px;
        border-top: 1px solid #e0e0e0;
        padding-top: 15px;
    `;
    footer.innerHTML = `
        Generado el ${new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })} - Flowbox
    `;
    container.appendChild(footer);

    return container;
}

// Estadísticas con estilos inline
function createPDFStatsInline() {
    const statsDiv = document.createElement('div');
    statsDiv.style.cssText = `
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e9ecef;
    `;

    const totalMaterias = materias.length;
    const completedSize = completed.size;
    const availableSize = materias.filter(m =>
        !completed.has(m.codigo) && m.prereqs.every(p => completed.has(p))
    ).length;

    const totalCarga = materias.reduce((sum, m) => sum + (m.cargaHoraria || 0), 0);
    const completedCarga = materias.reduce((sum, m) => {
        if (completed.has(m.codigo)) {
            return sum + (m.cargaHoraria || 0);
        }
        return sum;
    }, 0);

    const progress = totalMaterias > 0 ? (completedSize / totalMaterias) * 100 : 0;

    const statsData = [
        { value: totalMaterias, label: 'Total Materias' },
        { value: completedSize, label: 'Completadas' },
        { value: availableSize, label: 'Disponibles' },
        { value: `${progress.toFixed(1)}%`, label: 'Progreso' },
        { value: `${totalCarga}h`, label: 'Carga Total' },
        { value: `${completedCarga}h`, label: 'Carga Completada' }
    ];

    statsData.forEach(stat => {
        const statDiv = document.createElement('div');
        statDiv.style.textAlign = 'center';
        statDiv.innerHTML = `
            <div style="font-size: 18px; font-weight: bold; color: #6f42c1;">${stat.value}</div>
            <div style="font-size: 12px; color: #6c757d;">${stat.label}</div>
        `;
        statsDiv.appendChild(statDiv);
    });

    return statsDiv;
}

// Diagrama con estilos inline
function createPDFDiagramInline() {
    const diagramDiv = document.createElement('div');
    diagramDiv.style.marginTop = '20px';

    if (!levels || levels.length === 0) {
        diagramDiv.innerHTML = '<p>No hay niveles para mostrar</p>';
        return diagramDiv;
    }

    levels.forEach(level => {
        if (!level.materias || level.materias.length === 0) return;

        const levelDiv = document.createElement('div');
        levelDiv.style.cssText = `
            margin-bottom: 25px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            overflow: hidden;
        `;

        // Header del nivel
        const levelHeader = document.createElement('div');
        levelHeader.style.cssText = `
            background: #f8f9fa;
            padding: 12px 20px;
            border-bottom: 1px solid #e0e0e0;
            font-weight: bold;
            font-size: 16px;
            color: #333;
        `;

        if (level.isUnassigned) {
            const stats = getUnassignedStats(level);
            levelHeader.textContent = `📦 ${level.name} - ${stats.total} materias • ${stats.totalCarga}h`;
        } else {
            const stats = getLevelStats(level);
            levelHeader.textContent = `${level.name} - ${stats.total} materias • ${stats.totalCarga}h (${stats.completed} completadas • ${stats.completedCarga}h)`;
        }

        // Contenido del nivel
        const levelContent = document.createElement('div');
        levelContent.style.cssText = `
            padding: 15px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        `;

        const sortedMaterias = sortMateriasByStatus(level.materias);

        sortedMaterias.forEach(codigo => {
            const materia = materias.find(m => m.codigo === codigo);
            if (!materia) return;

            const status = getMateriaStatus(materia);
            const materiaDiv = document.createElement('div');

            let bgColor = '#f8f9fa';
            let borderColor = '#dee2e6';
            if (status === 'completed') {
                bgColor = '#d4edda';
                borderColor = '#c3e6cb';
            } else if (status === 'available') {
                bgColor = '#fff3cd';
                borderColor = '#ffeaa7';
            } else if (status === 'blocked') {
                bgColor = '#f8d7da';
                borderColor = '#f5c6cb';
            }

            materiaDiv.style.cssText = `
                background: ${bgColor};
                border: 1px solid ${borderColor};
                border-radius: 6px;
                padding: 12px;
                font-size: 12px;
            `;

            materiaDiv.innerHTML = `
                <div style="font-weight: bold; color: #495057; margin-bottom: 4px;">${codigo}</div>
                <div style="color: #6c757d; margin-bottom: 4px;">${materia.nombre}</div>
                ${materia.cargaHoraria ? `<div style="color: #868e96; font-size: 11px;">${materia.cargaHoraria}h</div>` : ''}
            `;

            levelContent.appendChild(materiaDiv);
        });

        levelDiv.appendChild(levelHeader);
        levelDiv.appendChild(levelContent);
        diagramDiv.appendChild(levelDiv);
    });

    return diagramDiv;
}


// Función para mostrar notificación de éxito
function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.innerHTML = `
        <div class="notification-content">
            ✅ ${message}
        </div>
    `;

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #28a745, #20c997);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        font-weight: bold;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Generar PDF usando html2pdf.js (texto seleccionable y alta resolución)
async function generatePDF(container) {
    // Método 1: Usar html2pdf.js si está disponible
    if (typeof html2pdf !== 'undefined') {
        const options = {
            margin: 0.5,
            filename: `${currentPlan.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
            image: {
                type: 'jpeg',
                quality: 0.98
            },
            html2canvas: {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#ffffff',
                logging: true, // Activar logging para debug
                width: container.offsetWidth,
                height: container.offsetHeight,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF: {
                unit: 'in',
                format: 'a4',
                orientation: 'landscape'
            }
        };

        return html2pdf().set(options).from(container).save();
    }

    // Método 2: Fallback con html2canvas + jsPDF
    else if (typeof html2canvas !== 'undefined' && typeof window.jspdf !== 'undefined') {
        console.log('Using html2canvas + jsPDF fallback');

        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            logging: true,
            width: container.offsetWidth,
            height: container.offsetHeight,
            scrollX: 0,
            scrollY: 0,
            onclone: function (clonedDoc) {
                // Asegurar que los estilos se copien correctamente
                const clonedContainer = clonedDoc.querySelector('.pdf-container');
                if (clonedContainer) {
                    clonedContainer.style.display = 'block';
                    clonedContainer.style.visibility = 'visible';
                }
            }
        });

        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error('El canvas generado está vacío');
        }

        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('landscape', 'mm', 'a4');

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const imgWidth = pageWidth - 20;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let finalWidth = imgWidth;
        let finalHeight = imgHeight;

        if (imgHeight > pageHeight - 20) {
            finalHeight = pageHeight - 20;
            finalWidth = (canvas.width * finalHeight) / canvas.height;
        }

        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

        const fileName = `${currentPlan.nombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
    }

    else {
        throw new Error('No se encontraron las librerías necesarias para generar PDF');
    }
}