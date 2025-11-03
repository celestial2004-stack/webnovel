// Módulo de UI: manipulação de DOM, views, etc.

// IDs das Views
export const DASHBOARD_VIEW_ID = 'dashboard-view';
export const EDITOR_VIEW_ID = 'editor-view';

const views = [DASHBOARD_VIEW_ID, EDITOR_VIEW_ID];
const projectsGrid = document.getElementById('projects-grid');
const editorProjectTitle = document.getElementById('editor-project-title');

/**
 * Exibe a view especificada e oculta as outras.
 * @param {string} viewId - O ID da view a ser exibida.
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
 * @param {string} title - O título do projeto.
 */
export function setEditorTitle(title) {
    editorProjectTitle.textContent = title;
}

/**
 * Renderiza as galerias de recursos (fundos e personagens) no editor.
 * @param {object} assets - O objeto de assets do projeto.
 */
export function renderAssetGalleries(assets) {
    const backgroundsGallery = document.getElementById('backgrounds-gallery');
    const charactersGallery = document.getElementById('characters-gallery');
    const audioList = document.getElementById('audio-list');

    // Limpa galerias existentes
    backgroundsGallery.innerHTML = '';
    charactersGallery.innerHTML = '';
    audioList.innerHTML = '';

    // Renderiza planos de fundo
    assets.backgrounds.forEach(bg => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative group';
        imgContainer.innerHTML = `
            <img src="${bg.data}" alt="${bg.name}" class="w-full h-full object-cover rounded">
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-xs text-center p-1">${bg.name}</span>
            </div>
        `;
        backgroundsGallery.appendChild(imgContainer);
    });

    // Renderiza personagens
    assets.characters.forEach(char => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative group';
        imgContainer.innerHTML = `
            <img src="${char.data}" alt="${char.name}" class="w-full h-full object-cover rounded">
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="text-white text-xs text-center p-1">${char.name}</span>
            </div>
        `;
        charactersGallery.appendChild(imgContainer);
    });

    // Renderiza áudios
    assets.audio.forEach(aud => {
        const li = document.createElement('li');
        li.className = 'text-sm text-gray-300 truncate';
        li.textContent = aud.name;
        audioList.appendChild(li);
    });
}

/**
 * Renderiza a lista de cenas no painel do editor.
 * @param {Array} scenes - A lista de cenas do projeto.
 */
export function renderScenesList(scenes) {
    const scenesList = document.getElementById('scenes-list');
    scenesList.innerHTML = ''; // Limpa a lista

    if (scenes.length === 0) {
        scenesList.innerHTML = `<li class="text-gray-500 text-sm">Nenhuma cena criada ainda.</li>`;
        return;
    }

    scenes.forEach(scene => {
        const li = document.createElement('li');
        li.className = 'bg-gray-700 p-2 rounded cursor-pointer hover:bg-gray-600';
        li.textContent = scene.name;
        li.dataset.sceneId = scene.id;
        scenesList.appendChild(li);
    });
}

/**
 * Renderiza a grade de projetos no dashboard.
 * @param {Array} projects - A lista de projetos a serem exibidos.
 */
export function renderProjectsGrid(projects) {
    projectsGrid.innerHTML = ''; // Limpa a grade antes de renderizar

    if (projects.length === 0) {
        projectsGrid.innerHTML = `
            <div class="col-span-full text-center text-gray-500">
                <p>Nenhum projeto encontrado. Comece criando um novo!</p>
            </div>
        `;
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
