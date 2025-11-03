// Módulo para gerenciar a Pré-visualização ao Vivo (Coluna 3)

const livePreviewContainer = document.getElementById('live-preview');

/**
 * Atualiza a janela de pré-visualização com base no estado atual da cena.
 * @param {object} scene - A cena que está sendo editada.
 * @param {object} projectAssets - Os recursos do projeto.
 */
export function updateLivePreview(scene, projectAssets) {
    if (!scene) {
        livePreviewContainer.innerHTML = `<p class="text-center text-gray-400 p-4">Selecione uma cena para ver a pré-visualização.</p>`;
        return;
    }

    // Limpa a pré-visualização
    livePreviewContainer.innerHTML = '';

    // Estado da pré-visualização
    let currentBackground = '';
    const charactersOnScreen = {}; // Para rastrear personagens e suas posições

    // Itera sobre as ações para construir o estado visual final
    scene.actions.forEach(action => {
        switch (action.type) {
            case 'setBackground':
                const bg = projectAssets.backgrounds.find(b => b.id === action.backgroundId);
                if (bg) {
                    currentBackground = bg.data;
                }
                break;
            case 'showCharacter':
                const char = projectAssets.characters.find(c => c.id === action.characterId);
                if (char) {
                    charactersOnScreen[action.characterId] = {
                        data: char.data,
                        position: action.position || 'centro' // Padrão para 'centro'
                    };
                }
                break;
            case 'hideCharacter':
                if (action.characterId) {
                    delete charactersOnScreen[action.characterId];
                }
                break;
            case 'dialogue':
                // A pré-visualização mostrará o último diálogo
                // A lógica completa do diálogo será mais complexa no motor do jogo
                break;
        }
    });

    // Renderiza o estado final
    // 1. Fundo
    if (currentBackground) {
        livePreviewContainer.style.backgroundImage = `url(${currentBackground})`;
        livePreviewContainer.style.backgroundSize = 'cover';
        livePreviewContainer.style.backgroundPosition = 'center';
    } else {
        livePreviewContainer.style.backgroundImage = 'none';
    }

    // 2. Personagens
    Object.values(charactersOnScreen).forEach(char => {
        const charImg = document.createElement('img');
        charImg.src = char.data;
        charImg.className = 'absolute bottom-0 h-4/5 object-contain';
        // Mapeia posição para classes do Tailwind
        if (char.position === 'esquerda') charImg.classList.add('left-0');
        else if (char.position === 'direita') charImg.classList.add('right-0');
        else charImg.classList.add('left-1/2', '-translate-x-1/2'); // Centro

        livePreviewContainer.appendChild(charImg);
    });

    // 3. Caixa de Diálogo (mostra a última)
    const lastDialogue = [...scene.actions].reverse().find(a => a.type === 'dialogue');
    if (lastDialogue) {
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 p-4 m-4 rounded-lg border border-gray-600';
        dialogueBox.innerHTML = `
            <h4 class="font-bold text-purple-400 mb-1">${lastDialogue.characterName || 'Narrador'}</h4>
            <p>${lastDialogue.text || ''}</p>
        `;
        livePreviewContainer.appendChild(dialogueBox);
    }
}
