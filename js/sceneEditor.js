// Módulo para renderizar e gerenciar o editor de ações de cena (Coluna 2)

const sceneEditorContent = document.getElementById('scene-editor-content');
const currentSceneNameEl = document.getElementById('current-scene-name');

// Funções auxiliares para gerar HTML
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
                <button data-action-type="setBackground" class="action-btn">Definir Fundo</button>
                <button data-action-type="showCharacter" class="action-btn">Mostrar Personagem</button>
                <button data-action-type="hideCharacter" class="action-btn">Ocultar Personagem</button>
                <button data-action-type="dialogue" class="action-btn">Diálogo</button>
                <button data-action-type="playAudio" class="action-btn">Tocar Áudio</button>
                <button data-action-type="addChoice" class="action-btn">Adicionar Escolha</button>
                <button data-action-type="jumpToScene" class="action-btn">Pular para Cena</button>
                <button data-action-type="endGame" class="action-btn">Fim do Jogo</button>
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
        actionsListContainer.innerHTML = '<p class="text-gray-500 text-center">Nenhuma ação. Adicione uma abaixo.</p>';
        return;
    }

    scene.actions.forEach((action, index) => {
        const actionEl = document.createElement('div');
        actionEl.className = 'bg-gray-800 p-4 rounded-lg shadow cursor-grab';
        actionEl.dataset.actionIndex = index;
        actionEl.draggable = true;

        let content = `<div class="flex justify-between items-center mb-2">
                         <h5 class="font-bold text-purple-400 capitalize">${action.type.replace(/([A-Z])/g, ' $1')}</h5>
                         <button class="delete-action-btn text-red-500 font-bold text-lg">&times;</button>
                       </div>`;

        switch (action.type) {
            case 'setBackground':
                content += createDropdown(projectAssets.backgrounds, action.backgroundId, 'Selecione um fundo', 'backgroundId');
                break;
            case 'showCharacter':
                const selectedChar = projectAssets.characters.find(c => c.id === action.characterId);
                const expressions = selectedChar ? selectedChar.expressions : [];
                content += `<div class="grid grid-cols-2 gap-2">
                                ${createDropdown(projectAssets.characters, action.characterId, 'Personagem', 'characterId', 'data-action="select-char"')}
                                ${createDropdown(expressions, action.expressionId, 'Expressão', 'expressionId')}
                           </div>
                           <div class="mt-2">
                                ${createDropdown([
                                    {id: 'Esquerda', name: 'Esquerda'},
                                    {id: 'Centro', name: 'Centro'},
                                    {id: 'Direita', name: 'Direita'}
                                ], action.position, 'Posição', 'position')}
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
                content += `<div class="mt-2">${createDropdown([
                    {id: 'effect', name: 'Efeito Sonoro'},
                    {id: 'music', name: 'Música de Fundo'}
                ], action.audioType, 'Tipo de Áudio', 'audioType')}</div>`;
                break;
            case 'jumpToScene':
                content += createDropdown(allScenes.filter(s => s.id !== scene.id), action.sceneId, 'Selecione cena', 'sceneId');
                break;
            case 'addChoice':
                action.choices = action.choices || [];
                let choicesHTML = '<div class="space-y-2">';
                action.choices.forEach((choice, choiceIndex) => {
                    choicesHTML += `<div class="flex items-center space-x-2 bg-gray-700 p-2 rounded">
                                      <input type="text" data-property-name="choices[${choiceIndex}].text" value="${choice.text || ''}" class="bg-gray-600 p-1 rounded w-full" placeholder="Texto da escolha">
                                      ${createDropdown(allScenes.filter(s => s.id !== scene.id), choice.targetSceneId, 'Pular para...', `choices[${choiceIndex}].targetSceneId`)}
                                      <button class="remove-choice-btn text-red-500" data-choice-index="${choiceIndex}">-</button>
                                    </div>`;
                });
                choicesHTML += '</div>';
                content += choicesHTML;
                content += `<button class="add-choice-btn mt-2 bg-green-600 text-white text-sm py-1 px-2 rounded">+ Opção</button>`;
                break;
            case 'endGame':
                content += '<p class="text-gray-400 text-sm">O jogo terminará aqui.</p>';
                break;
        }

        actionEl.innerHTML = content;
        actionsListContainer.appendChild(actionEl);
    });
}
