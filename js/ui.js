// Módulo de UI: manipulação de DOM, views, etc.

// IDs das Views
export const DASHBOARD_VIEW_ID = 'dashboard-view';
export const EDITOR_VIEW_ID = 'editor-view';

const views = [DASHBOARD_VIEW_ID, EDITOR_VIEW_ID];
const projectsGrid = document.getElementById('projects-grid');
const editorProjectTitle = document.getElementById('editor-project-title');

/**
 * Exibe a view especificada e oculta as outras.
 */
export function showView(viewId) {
    views.forEach(id => {
        const view = document.getElementById(id);
        if (id === viewId) {
            view.classList.remove('hidden');
        } else {
            view.classList.add('hidden');
        }
    });
}

/**
 * Atualiza o título do projeto no cabeçalho do editor.
 */
export function setEditorTitle(title) {
    editorProjectTitle.textContent = title;
}

/**
 * Renderiza as galerias de recursos (fundos e personagens) no editor.
 */
export function renderAssetGalleries(assets) {
    const backgroundsGallery = document.getElementById('backgrounds-gallery');
    const charactersGallery = document.getElementById('characters-gallery');
    const audioList = document.getElementById('audio-list');

    backgroundsGallery.innerHTML = '';
    charactersGallery.innerHTML = '';
    audioList.innerHTML = '';

    // Renderiza planos de fundo com botão de exclusão
    assets.backgrounds.forEach(bg => {
        const container = document.createElement('div');
        container.className = 'relative group';
        container.innerHTML = `
            <img src="${bg.data}" alt="${bg.name}" class="w-full h-full object-cover rounded">
            <button data-asset-id="${bg.id}" data-asset-type="background" class="delete-asset-btn absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
            <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1 truncate">${bg.name}</div>
        `;
        backgroundsGallery.appendChild(container);
    });

    // CORREÇÃO: Renderiza cards de personagem com suas expressões
    assets.characters.forEach(char => {
        const charCard = document.createElement('div');
        charCard.className = 'bg-gray-700 rounded p-2 mb-3';
        let expressionsHTML = '<div class="grid grid-cols-3 gap-1 mt-2">';
        char.expressions.forEach(expr => {
            expressionsHTML += `
                <div class="relative group">
                    <img src="${expr.data}" alt="${expr.name}" class="w-full h-full object-cover rounded">
                    <button data-char-id="${char.id}" data-expr-id="${expr.id}" class="delete-expression-btn absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
                    <div class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center p-1 truncate">${expr.name}</div>
                </div>
            `;
        });
        expressionsHTML += '</div>';

        charCard.innerHTML = `
            <div class="flex justify-between items-center">
                <h5 class="font-bold text-sm">${char.name}</h5>
                <button data-char-id="${char.id}" class="delete-character-btn text-red-500 font-bold">&times;</button>
            </div>
            ${expressionsHTML}
            <button data-char-id="${char.id}" class="add-expression-btn w-full bg-blue-500 hover:bg-blue-600 text-xs p-1 mt-2 rounded">+ Adicionar Expressão</button>
        `;
        charactersGallery.appendChild(charCard);
    });

    // Renderiza áudios
    assets.audio.forEach(aud => {
        const li = document.createElement('li');
        li.className = 'text-sm text-gray-300 truncate';
        li.textContent = aud.name; // Adicionar exclusão aqui se necessário
        audioList.appendChild(li);
    });
}

/**
 * Renderiza a lista de cenas no painel do editor.
 */
export function renderScenesList(scenes) {
    const scenesList = document.getElementById('scenes-list');
    scenesList.innerHTML = '';

    if (scenes.length === 0) {
        scenesList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma cena criada.</li>`;
        return;
    }

    scenes.forEach(scene => {
        const li = document.createElement('li');
        // MELHORIA: Adiciona botão de exclusão e atributos para drag-and-drop
        li.className = 'bg-gray-700 p-2 rounded flex justify-between items-center cursor-grab';
        li.dataset.sceneId = scene.id;
        li.draggable = true;
        li.innerHTML = `
            <span>${scene.name}</span>
            <button data-scene-id="${scene.id}" class="delete-scene-btn text-red-500 hover:text-red-400">&times;</button>
        `;
        scenesList.appendChild(li);
    });
}

/**
 * Renderiza a grade de projetos no dashboard.
 */
export function renderProjectsGrid(projects) {
    projectsGrid.innerHTML = '';

    if (projects.length === 0) {
        projectsGrid.innerHTML = `<div class="col-span-full text-center text-gray-500"><p>Nenhum projeto encontrado. Comece criando um novo!</p></div>`;
        return;
    }

    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'bg-gray-800 rounded-lg shadow-lg p-4 flex flex-col justify-between';
        projectCard.dataset.projectId = project.id;

        projectCard.innerHTML = `
            <div>
                <h3 class="text-xl font-bold mb-2">${project.title}</h3>
                <p class="text-gray-400 text-sm">Criado em: ${new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
            </div>
            <div class="mt-4 flex justify-end space-x-2">
                <button class="edit-btn bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded" title="Editar projeto">&#9998; Editar</button>
                <button class="export-btn bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded" title="Exportar como jogo (.html)">&#11123; Exportar</button>
                <button class="delete-btn bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded" title="Excluir projeto">&#128465; Excluir</button>
            </div>
        `;
        projectsGrid.appendChild(projectCard);
    });
}
