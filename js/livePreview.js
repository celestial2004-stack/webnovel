// Módulo para gerenciar a Pré-visualização ao Vivo (Coluna 3)

const livePreviewContainer = document.getElementById('live-preview');

/**
 * CORREÇÃO: Atualiza a pré-visualização para mostrar o estado do jogo ATÉ uma ação específica.
 * @param {object} scene - A cena que está sendo editada.
 * @param {object} projectAssets - Os recursos do projeto.
 * @param {number} targetActionIndex - O índice da ação a ser pré-visualizada.
 */
export function updateLivePreview(scene, projectAssets, targetActionIndex) {
    if (!scene || !scene.actions) {
        livePreviewContainer.innerHTML = `<p class="text-center text-gray-400 p-4">Pré-visualização</p>`;
        livePreviewContainer.style.backgroundImage = 'none';
        return;
    }

    // Limpa a pré-visualização
    livePreviewContainer.innerHTML = '';

    // Estado da pré-visualização
    let currentBackgroundId = null;
    const charactersOnScreen = {}; // { charId: { expressionId, position } }
    let lastDialogue = null;

    // Itera sobre as ações ATÉ o índice alvo
    for (let i = 0; i <= targetActionIndex && i < scene.actions.length; i++) {
        const action = scene.actions[i];
        switch (action.type) {
            case 'setBackground':
                currentBackgroundId = action.backgroundId;
                break;
            case 'showCharacter':
                charactersOnScreen[action.characterId] = {
                    expressionId: action.expressionId,
                    position: action.position || 'Centro'
                };
                break;
            case 'hideCharacter':
                delete charactersOnScreen[action.characterId];
                break;
            case 'dialogue':
                lastDialogue = action;
                break;
        }
    }

    // Renderiza o estado final
    const bgAsset = projectAssets.backgrounds.find(b => b.id === currentBackgroundId);
    if (bgAsset) {
        livePreviewContainer.style.backgroundImage = `url(${bgAsset.data})`;
        livePreviewContainer.style.backgroundSize = 'cover';
        livePreviewContainer.style.backgroundPosition = 'center';
    } else {
        livePreviewContainer.style.backgroundImage = 'none';
    }

    Object.entries(charactersOnScreen).forEach(([charId, state]) => {
        const charAsset = projectAssets.characters.find(c => c.id === charId);
        if (charAsset) {
            const exprAsset = charAsset.expressions.find(e => e.id === state.expressionId);
            if (exprAsset) {
                const charImg = document.createElement('img');
                charImg.src = exprAsset.data;
                charImg.className = 'absolute bottom-0 h-4/5 object-contain';
                if (state.position === 'Esquerda') charImg.style.left = '0%';
                else if (state.position === 'Direita') charImg.style.right = '0%';
                else {
                    charImg.style.left = '50%';
                    charImg.style.transform = 'translateX(-50%)';
                }
                livePreviewContainer.appendChild(charImg);
            }
        }
    });

    if (lastDialogue) {
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 m-4 rounded-lg';
        dialogueBox.innerHTML = `
            <h4 class="font-bold text-purple-400 mb-1">${lastDialogue.characterName || 'Narrador'}</h4>
            <p>${lastDialogue.text || ''}</p>
        `;
        livePreviewContainer.appendChild(dialogueBox);
    }
}
