// Módulo para renderizar e gerenciar o editor de ações de cena (Coluna 2)

const sceneEditorContent = document.getElementById('scene-editor-content');
const currentSceneNameEl = document.getElementById('current-scene-name');

// Funções auxiliares para gerar HTML com data-attributes para o salvamento
function createDropdown(items, selectedValue, defaultOption, propertyName, extraAttrs = '') {
    let options = `<option value="">${defaultOption}</option>`;
    items.forEach(item => {
        options += `<option value="${item.id}" ${item.id === selectedValue ? 'selected' : ''}>${item.name}</option>`;
    });
    return `<select data-property-name="${propertyName}" ${extraAttrs} class="bg-gray-700 text-white p-2 rounded w-full">${options}</select>`;
}

function createTextInput(value, placeholder, propertyName, extraAttrs = '') {
    return `<input type="text" data-property-name="${propertyName}" ${extraAttrs} class="bg-gray-700 text-white p-2 rounded w-full" value="${value || ''}" placeholder="${placeholder}">`;
}

function createTextArea(value, placeholder, propertyName, extraAttrs = '') {
    return `<textarea data-property-name="${propertyName}" ${extraAttrs} class="bg-gray-700 text-white p-2 rounded w-full" placeholder="${placeholder}">${value || ''}</textarea>`;
}


/**
 * Renderiza o editor completo para uma cena específica.
 */
export function renderSceneEditor(scene, projectAssets, allScenes) {
    if (!scene) {
        currentSceneNameEl.textContent = 'Nenhuma selecionada';
        sceneEditorContent.innerHTML = `<p class="text-gray-400">Selecione ou crie uma cena para começar a editar.</p>`;
        return;
    }

    currentSceneNameEl.textContent = scene.name;
    sceneEditorContent.innerHTML = `
        <div id="actions-list" class="space-y-4 mb-6"></div>
        <div id="add-action-palette" class="border-t border-gray-600 pt-4">
            <h4 class="text-md font-semibold mb-2">Adicionar Nova Ação:</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                <button data-action-type="setBackground" class="action-btn bg-blue-500 hover:bg-blue-600 p-2 rounded text-sm">Definir Fundo</button>
                <button data-action-type="showCharacter" class="action-btn bg-blue-500 hover:bg-blue-600 p-2 rounded text-sm">Mostrar Personagem</button>
                <button data-action-type="hideCharacter" class="action-btn bg-blue-500 hover:bg-blue-600 p-2 rounded text-sm">Ocultar Personagem</button>
                <button data-action-type="dialogue" class="action-btn bg-green-500 hover:bg-green-600 p-2 rounded text-sm">Diálogo</button>
                <button data-action-type="playAudio" class="action-btn bg-purple-500 hover:bg-purple-600 p-2 rounded text-sm">Tocar Áudio</button>
                <button data-action-type="addChoice" class="action-btn bg-yellow-500 hover:bg-yellow-600 p-2 rounded text-sm">Adicionar Escolha</button>
                <button data-action-type="jumpToScene" class="action-btn bg-gray-500 hover:bg-gray-600 p-2 rounded text-sm">Pular para Cena</button>
                <button data-action-type="endGame" class="action-btn bg-red-500 hover:bg-red-600 p-2 rounded text-sm">Fim do Jogo</button>
            </div>
        </div>
    `;

    renderActions(scene, projectAssets, allScenes);
}

/**
 * Renderiza a lista de ações dentro do editor de cena.
 */
function renderActions(scene, projectAssets, allScenes) {
    const actionsListContainer = document.getElementById('actions-list');
    actionsListContainer.innerHTML = '';

    if (!scene.actions) scene.actions = [];
    if (scene.actions.length === 0) {
        actionsListContainer.innerHTML = '<p class="text-gray-500 text-center">Nenhuma ação nesta cena ainda.</p>';
        return;
    }

    scene.actions.forEach((action, index) => {
        const actionEl = document.createElement('div');
        actionEl.className = 'bg-gray-800 p-4 rounded-lg shadow';
        actionEl.dataset.actionIndex = index;

        let content = `<div class="flex justify-between items-center mb-2">
                         <h5 class="font-bold text-purple-400 capitalize">${action.type.replace(/([A-Z])/g, ' $1')}</h5>
                         <button class="delete-action-btn text-red-500 hover:text-red-400 font-bold text-lg" title="Excluir ação">&times;</button>
                       </div>`;

        switch (action.type) {
            case 'setBackground':
                content += createDropdown(projectAssets.backgrounds, action.backgroundId, 'Selecione um fundo', 'backgroundId');
                break;
            case 'showCharacter':
                content += createDropdown(projectAssets.characters, action.characterId, 'Selecione um personagem', 'characterId');
                content += `<div class="mt-2 grid grid-cols-2 gap-2">
                                ${createTextInput(action.position, 'Posição (ex: centro)', 'position')}
                                ${createTextInput(action.expression, 'Expressão (ex: feliz)', 'expression')}
                            </div>`;
                break;
            case 'hideCharacter':
                content += createDropdown(projectAssets.characters, action.characterId, 'Selecione um personagem', 'characterId');
                break;
            case 'dialogue':
                content += createTextInput(action.characterName, 'Nome do Personagem (ou Narrador)', 'characterName');
                content += `<div class="mt-2">${createTextArea(action.text, 'Texto do diálogo...', 'text')}</div>`;
                break;
            case 'playAudio':
                content += createDropdown(projectAssets.audio, action.audioId, 'Selecione um áudio', 'audioId');
                break;
            case 'jumpToScene':
                content += createDropdown(allScenes.filter(s => s.id !== scene.id), action.sceneId, 'Selecione uma cena para pular', 'sceneId');
                break;
            case 'addChoice':
                action.choices = action.choices || [];
                let choicesHTML = '<div class="space-y-2">';
                action.choices.forEach((choice, choiceIndex) => {
                    choicesHTML += `<div class="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                                      ${createTextInput(choice.text, 'Texto da escolha', `choices[${choiceIndex}].text`)}
                                      ${createDropdown(allScenes.filter(s => s.id !== scene.id), choice.targetSceneId, 'Pular para...', `choices[${choiceIndex}].targetSceneId`)}
                                      <button class="remove-choice-btn text-red-500" data-choice-index="${choiceIndex}">-</button>
                                    </div>`;
                });
                choicesHTML += '</div>';
                content += choicesHTML;
                content += `<button class="add-choice-btn mt-2 bg-green-600 hover:bg-green-700 text-white text-sm py-1 px-2 rounded">+ Adicionar Opção</button>`;
                break;
            case 'endGame':
                content += '<p class="text-gray-400 text-sm">O jogo terminará após esta ação.</p>';
                break;
            default:
                 content += '<p class="text-gray-500 text-sm">Esta ação não possui opções.</p>';
        }

        actionEl.innerHTML = content;
        actionsListContainer.appendChild(actionEl);
    });
}
