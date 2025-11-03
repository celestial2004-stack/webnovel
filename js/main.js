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
                    assets: { backgrounds: [], characters: [], audio: [] }
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
            const sceneItem = event.target.closest('[data-scene-id]');
            if (sceneItem) {
                const sceneId = sceneItem.dataset.sceneId;
                currentEditingScene = currentEditingProject.scenes.find(s => s.id === sceneId);
                renderSceneEditor(currentEditingScene, currentEditingProject.assets, currentEditingProject.scenes);
                updateLivePreview(currentEditingScene, currentEditingProject.assets);
                document.querySelectorAll('#scenes-list li').forEach(li => li.classList.remove('bg-purple-800'));
                sceneItem.classList.add('bg-purple-800');
            }
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
                updateLivePreview(currentEditingScene, currentEditingProject.assets);
            }
        });

        function handleActionInputChange(event) {
            const target = event.target;
            const actionIndex = target.closest('[data-action-index]')?.dataset.actionIndex;
            if (actionIndex === undefined) return;

            const action = currentEditingScene.actions[actionIndex];
            const propertyName = target.dataset.propertyName;
            if (propertyName) {
                const match = propertyName.match(/(\w+)\[(\d+)\]\.(\w+)/);
                if (match) {
                    const [, collection, index, prop] = match;
                    action[collection][index][prop] = target.value;
                } else {
                    action[propertyName] = target.value;
                }
                updateProject(currentEditingProject);
                updateLivePreview(currentEditingScene, currentEditingProject.assets);
            }
        }

        sceneEditorContent.addEventListener('change', handleActionInputChange);
        sceneEditorContent.addEventListener('keyup', handleActionInputChange);

        function handleFileUpload(fileType, assetCategory) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = fileType;
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const newAsset = { id: `${assetCategory}_${Date.now()}`, name: file.name, data: e.target.result };
                    currentEditingProject.assets[assetCategory].push(newAsset);
                    updateProject(currentEditingProject);
                    renderAssetGalleries(currentEditingProject.assets);
                };
                reader.readAsDataURL(file);
            };
            input.click();
        }

        uploadBackgroundBtn.addEventListener('click', () => handleFileUpload('image/*', 'backgrounds'));
        uploadCharacterBtn.addEventListener('click', () => handleFileUpload('image/*', 'characters'));
        uploadAudioBtn.addEventListener('click', () => handleFileUpload('audio/*', 'audio'));

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
