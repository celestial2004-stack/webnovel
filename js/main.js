import { getProjects, saveProject, deleteProject, updateProject } from './database.js';
import { renderProjectsGrid, showView, setEditorTitle, DASHBOARD_VIEW_ID, EDITOR_VIEW_ID, renderAssetGalleries, renderScenesList } from './ui.js';
import { renderSceneEditor } from './sceneEditor.js';
import { updateLivePreview } from './livePreview.js';
import { startGame } from './engine.js';
import { exportProject } from './exporter.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentEditingProject = null;
    let currentEditingScene = null;
    let isEditorInitialized = false;

    // --- DOM Elements ---
    const projectsGrid = document.getElementById('projects-grid');

    // --- Core Functions ---
    function loadAndRenderProjects() {
        const projects = getProjects();
        renderProjectsGrid(projects);
    }

    function enterEditor(project) {
        currentEditingProject = project;
        currentEditingScene = null;
        setEditorTitle(project.title);
        renderAssetGalleries(project.assets);
        renderScenesList(project.scenes);
        renderSceneEditor(null, {}, []); // Clear editor
        updateLivePreview(null, {}); // Clear preview
        showView(EDITOR_VIEW_ID);

        // Initialize editor listeners only once
        if (!isEditorInitialized) {
            initializeEditorListeners();
            isEditorInitialized = true;
        }
    }

    // --- Event Listener Initializers ---
    function initializeDashboardListeners() {
        const createNewProjectBtn = document.getElementById('create-new-project-btn');
        const newProjectModal = document.getElementById('new-project-modal');
        const cancelProjectCreationBtn = document.getElementById('cancel-project-creation-btn');
        const confirmProjectCreationBtn = document.getElementById('confirm-project-creation-btn');
        const projectTitleInput = document.getElementById('project-title-input');

        createNewProjectBtn.addEventListener('click', () => {
            newProjectModal.classList.remove('hidden');
            projectTitleInput.value = '';
            projectTitleInput.focus();
        });

        cancelProjectCreationBtn.addEventListener('click', () => newProjectModal.classList.add('hidden'));

        confirmProjectCreationBtn.addEventListener('click', () => {
            const title = projectTitleInput.value.trim();
            if (title) {
                const newProject = {
                    id: `proj_${Date.now()}`,
                    title,
                    createdAt: new Date().toISOString(),
                    scenes: [],
                    // CORREÇÃO: Estrutura de assets.characters atualizada
                    assets: {
                        backgrounds: [],
                        characters: [], // Agora um array para objetos de personagem
                        audio: []
                    }
                };
                saveProject(newProject);
                newProjectModal.classList.add('hidden');
                enterEditor(newProject);
            } else {
                alert('Por favor, insira um título para o projeto.');
            }
        });

        projectsGrid.addEventListener('click', (event) => {
            const target = event.target;
            const projectCard = target.closest('[data-project-id]');
            if (!projectCard) return;

            const projectId = projectCard.dataset.projectId;
            const project = getProjects().find(p => p.id === projectId);

            if (target.classList.contains('edit-btn')) enterEditor(project);
            else if (target.classList.contains('delete-btn')) {
                if (confirm(`Tem certeza que deseja excluir o projeto "${project.title}"?`)) {
                    deleteProject(projectId);
                    loadAndRenderProjects();
                }
            } else if (target.classList.contains('export-btn')) {
                exportProject(project);
            }
        });
    }

    function initializeEditorListeners() {
        const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
        const addSceneBtn = document.querySelector('#scenes-panel button');
        const scenesListEl = document.getElementById('scenes-list');
        const sceneEditorContent = document.getElementById('scene-editor-content');
        const previewGameBtn = document.getElementById('preview-game-btn');
        const closeGamePlayerBtn = document.getElementById('close-game-player-btn');
        const gamePlayerModal = document.getElementById('game-player-modal');
        const uploadBackgroundBtn = document.querySelector('#assets-panel button:nth-of-type(1)');
        const uploadCharacterBtn = document.querySelector('#assets-panel button:nth-of-type(2)');
        const uploadAudioBtn = document.querySelector('#assets-panel button:nth-of-type(3)');

        backToDashboardBtn.addEventListener('click', () => {
            currentEditingProject = null;
            loadAndRenderProjects();
            showView(DASHBOARD_VIEW_ID);
        });

        addSceneBtn.addEventListener('click', () => {
            const sceneName = prompt("Digite o nome da nova cena:");
            if (sceneName?.trim()) {
                const newScene = { id: `scene_${Date.now()}`, name: sceneName.trim(), actions: [] };
                currentEditingProject.scenes.push(newScene);
                updateProject(currentEditingProject);
                renderScenesList(currentEditingProject.scenes);
            }
        });

        scenesListEl.addEventListener('click', (event) => {
            const target = event.target;
            // Lógica de seleção de cena
            const sceneItem = target.closest('[data-scene-id]');
            if (sceneItem && !target.classList.contains('delete-scene-btn')) {
                const sceneId = sceneItem.dataset.sceneId;
                currentEditingScene = currentEditingProject.scenes.find(s => s.id === sceneId);
                renderSceneEditor(currentEditingScene, currentEditingProject.assets, currentEditingProject.scenes);
                updateLivePreview(currentEditingScene, currentEditingProject.assets, 0);
                document.querySelectorAll('#scenes-list li').forEach(li => li.classList.remove('bg-purple-800'));
                sceneItem.classList.add('bg-purple-800');
            }
            // Lógica de exclusão de cena
            if (target.classList.contains('delete-scene-btn')) {
                const sceneId = target.dataset.sceneId;
                if (confirm('Tem certeza que deseja excluir esta cena?')) {
                    currentEditingProject.scenes = currentEditingProject.scenes.filter(s => s.id !== sceneId);
                    updateProject(currentEditingProject);
                    renderScenesList(currentEditingProject.scenes);
                    // Limpa o editor se a cena excluída era a que estava sendo editada
                    if (currentEditingScene?.id === sceneId) {
                        currentEditingScene = null;
                        renderSceneEditor(null, {}, []);
                        updateLivePreview(null, {});
                    }
                }
            }
        });

        // --- Lógica de Drag-and-Drop para Cenas ---
        let draggedSceneId = null;
        scenesListEl.addEventListener('dragstart', (event) => {
            draggedSceneId = event.target.closest('[data-scene-id]').dataset.sceneId;
        });

        scenesListEl.addEventListener('dragover', (event) => {
            event.preventDefault(); // Necessário para permitir o drop
        });

        scenesListEl.addEventListener('drop', (event) => {
            event.preventDefault();
            const targetSceneItem = event.target.closest('[data-scene-id]');
            if (!targetSceneItem || targetSceneItem.dataset.sceneId === draggedSceneId) return;

            const scenes = currentEditingProject.scenes;
            const draggedIndex = scenes.findIndex(s => s.id === draggedSceneId);
            const targetIndex = scenes.findIndex(s => s.id === targetSceneItem.dataset.sceneId);

            // Remove o item arrastado e o insere na nova posição
            const [draggedItem] = scenes.splice(draggedIndex, 1);
            scenes.splice(targetIndex, 0, draggedItem);

            updateProject(currentEditingProject);
            renderScenesList(scenes);
        });

        sceneEditorContent.addEventListener('click', (event) => {
            const target = event.target;
            const actionIndex = target.closest('[data-action-index]')?.dataset.actionIndex;
            let structuralChange = false;

            if (target.matches('[data-action-type]')) {
                currentEditingScene.actions.push({ type: target.dataset.actionType });
                structuralChange = true;
            } else if (target.classList.contains('delete-action-btn')) {
                if (confirm('Excluir esta ação?')) {
                    currentEditingScene.actions.splice(actionIndex, 1);
                    structuralChange = true;
                }
            } else if (target.classList.contains('add-choice-btn')) {
                const action = currentEditingScene.actions[actionIndex];
                if (!action.choices) action.choices = [];
                action.choices.push({ text: '', targetSceneId: '' });
                structuralChange = true;
            } else if (target.classList.contains('remove-choice-btn')) {
                const choiceIndex = target.dataset.choiceIndex;
                currentEditingScene.actions[actionIndex].choices.splice(choiceIndex, 1);
                structuralChange = true;
            }

            if (structuralChange) {
                updateProject(currentEditingProject);
                renderSceneEditor(currentEditingScene, currentEditingProject.assets, currentEditingProject.scenes);
                updateLivePreview(currentEditingScene, currentEditingProject.assets, currentEditingScene.actions.length - 1);
            }
        });

        function handleActionInputChange(event) {
            const target = event.target;
            const actionIndex = target.closest('[data-action-index]')?.dataset.actionIndex;
            if (actionIndex === undefined) return;

            const action = currentEditingScene.actions[actionIndex];
            const propertyName = target.dataset.propertyName;

            if (propertyName) {
                // Lógica para salvar propriedades normais e aninhadas
                const match = propertyName.match(/(\w+)\[(\d+)\]\.(\w+)/);
                if (match) {
                    const [, collection, index, prop] = match;
                    action[collection][index][prop] = target.value;
                } else {
                    action[propertyName] = target.value;
                }
                updateProject(currentEditingProject);
                updateLivePreview(currentEditingScene, currentEditingProject.assets, parseInt(actionIndex));
            }

            // CORREÇÃO: Lógica para dropdowns dependentes
            if (target.dataset.action === 'select-char') {
                // Limpa a expressão selecionada para evitar inconsistências
                action.expressionId = '';
                updateProject(currentEditingProject);
                // Re-renderiza o editor para atualizar o dropdown de expressões
                renderSceneEditor(currentEditingScene, currentEditingProject.assets, currentEditingProject.scenes);
            }
        }

        // CORREÇÃO: Eventos de salvamento otimizados
        sceneEditorContent.addEventListener('change', handleActionInputChange);
        sceneEditorContent.addEventListener('blur', handleActionInputChange, true);

        // --- Lógica de Drag-and-Drop para Ações ---
        let draggedActionIndex = null;
        sceneEditorContent.addEventListener('dragstart', (event) => {
            const target = event.target.closest('[data-action-index]');
            if(target) {
                draggedActionIndex = target.dataset.actionIndex;
                event.dataTransfer.effectAllowed = 'move';
            }
        });

        sceneEditorContent.addEventListener('dragover', (event) => {
            event.preventDefault();
        });

        sceneEditorContent.addEventListener('drop', (event) => {
            event.preventDefault();
            const targetActionItem = event.target.closest('[data-action-index]');
            if (!targetActionItem || targetActionItem.dataset.actionIndex === draggedActionIndex) {
                 draggedActionIndex = null;
                 return;
            }

            const actions = currentEditingScene.actions;
            const targetIndex = targetActionItem.dataset.actionIndex;

            const [draggedItem] = actions.splice(draggedActionIndex, 1);
            actions.splice(targetIndex, 0, draggedItem);

            updateProject(currentEditingProject);
            renderSceneEditor(currentEditingScene, currentEditingProject.assets, currentEditingProject.scenes);
            draggedActionIndex = null;
        });

        // --- Lógica de Upload e Exclusão de Recursos ---
        const assetsPanel = document.getElementById('assets-panel');

        function uploadFileAsBase64(file, callback) {
            const reader = new FileReader();
            reader.onload = (e) => callback(e.target.result);
            reader.readAsDataURL(file);
        }

        uploadBackgroundBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                uploadFileAsBase64(file, base64Data => {
                    const newBg = { id: `bg_${Date.now()}`, name: file.name, data: base64Data };
                    currentEditingProject.assets.backgrounds.push(newBg);
                    updateProject(currentEditingProject);
                    renderAssetGalleries(currentEditingProject.assets);
                });
            };
            input.click();
        });

        // CORREÇÃO: Nova lógica de upload de personagem/expressão
        uploadCharacterBtn.addEventListener('click', () => {
            const charName = prompt("Digite o nome do NOVO personagem:");
            if (!charName?.trim()) return;

            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true; // Permite selecionar várias expressões de uma vez
            input.onchange = e => {
                const files = e.target.files;
                if (!files.length) return;

                const newCharacter = {
                    id: `char_${Date.now()}`,
                    name: charName.trim(),
                    expressions: []
                };

                Array.from(files).forEach(file => {
                    uploadFileAsBase64(file, base64Data => {
                        const exprName = file.name.split('.').slice(0, -1).join('.');
                        newCharacter.expressions.push({
                            id: `expr_${Date.now()}_${Math.random()}`,
                            name: exprName,
                            data: base64Data
                        });
                        // Salva e re-renderiza após a última imagem ser processada
                        if (newCharacter.expressions.length === files.length) {
                             currentEditingProject.assets.characters.push(newCharacter);
                             updateProject(currentEditingProject);
                             renderAssetGalleries(currentEditingProject.assets);
                        }
                    });
                });
            };
            input.click();
        });

        assetsPanel.addEventListener('click', (event) => {
            const target = event.target;

            // Adicionar nova expressão a um personagem existente
            if (target.classList.contains('add-expression-btn')) {
                const charId = target.dataset.charId;
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    uploadFileAsBase64(file, base64Data => {
                        const character = currentEditingProject.assets.characters.find(c => c.id === charId);
                        const exprName = file.name.split('.').slice(0, -1).join('.');
                        character.expressions.push({ id: `expr_${Date.now()}`, name: exprName, data: base64Data });
                        updateProject(currentEditingProject);
                        renderAssetGalleries(currentEditingProject.assets);
                    });
                };
                input.click();
            }

            // Excluir um recurso (fundo)
            if (target.classList.contains('delete-asset-btn')) {
                const assetId = target.dataset.assetId;
                if (confirm('Tem certeza que deseja excluir este fundo?')) {
                    currentEditingProject.assets.backgrounds = currentEditingProject.assets.backgrounds.filter(bg => bg.id !== assetId);
                    updateProject(currentEditingProject);
                    renderAssetGalleries(currentEditingProject.assets);
                }
            }

            // Excluir um personagem inteiro
             if (target.classList.contains('delete-character-btn')) {
                const charId = target.dataset.charId;
                if (confirm('Tem certeza que deseja excluir este personagem e todas as suas expressões?')) {
                    currentEditingProject.assets.characters = currentEditingProject.assets.characters.filter(c => c.id !== charId);
                    updateProject(currentEditingProject);
                    renderAssetGalleries(currentEditingProject.assets);
                }
            }

            // Excluir uma expressão específica
            if (target.classList.contains('delete-expression-btn')) {
                const charId = target.dataset.charId;
                const exprId = target.dataset.exprId;
                 if (confirm('Tem certeza que deseja excluir esta expressão?')) {
                    const character = currentEditingProject.assets.characters.find(c => c.id === charId);
                    character.expressions = character.expressions.filter(e => e.id !== exprId);
                    updateProject(currentEditingProject);
                    renderAssetGalleries(currentEditingProject.assets);
                }
            }
        });

        previewGameBtn.addEventListener('click', () => {
            if (currentEditingProject) startGame(currentEditingProject);
        });

        closeGamePlayerBtn.addEventListener('click', () => gamePlayerModal.classList.add('hidden'));
    }

    // --- Initial Load ---
    initializeDashboardListeners();
    loadAndRenderProjects();
    showView(DASHBOARD_VIEW_ID);
});
