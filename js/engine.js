// Módulo do Motor do Jogo: lógica de execução da VN

let gameState = {};
const playerContainer = document.getElementById('game-player-container');

function getAssetById(id, assets) {
    for (const category in assets) {
        const found = assets[category].find(asset => asset.id === id);
        if (found) return found;
    }
    return null;
}

function renderGameState() {
    playerContainer.innerHTML = ''; // Limpa a tela

    // 1. Renderiza o fundo
    if (gameState.currentBackground) {
        const bgAsset = getAssetById(gameState.currentBackground, gameState.project.assets);
        if (bgAsset) {
            playerContainer.style.backgroundImage = `url(${bgAsset.data})`;
            playerContainer.style.backgroundSize = 'cover';
            playerContainer.style.backgroundPosition = 'center';
        }
    }

    // 2. Renderiza personagens
    for (const charId in gameState.charactersOnScreen) {
        const charState = gameState.charactersOnScreen[charId];
        const charAsset = getAssetById(charId, gameState.project.assets);
        if (charAsset) {
            const charImg = document.createElement('img');
            charImg.src = charAsset.data;
            charImg.className = 'absolute bottom-0 h-4/5 object-contain';
            if (charState.position === 'esquerda') charImg.style.left = '0%';
            else if (charState.position === 'direita') charImg.style.right = '0%';
            else {
                charImg.style.left = '50%';
                charImg.style.transform = 'translateX(-50%)';
            }
            playerContainer.appendChild(charImg);
        }
    }
}

function showDialogue(text, characterName) {
    const dialogueBox = document.createElement('div');
    dialogueBox.id = 'dialogue-box';
    dialogueBox.className = 'absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 m-4 p-4 rounded-lg border border-purple-500 cursor-pointer';
    dialogueBox.innerHTML = `
        <h4 class="font-bold text-purple-400 mb-2">${characterName || 'Narrador'}</h4>
        <p>${text}</p>
    `;
    playerContainer.appendChild(dialogueBox);

    dialogueBox.addEventListener('click', processNextAction, { once: true });
}

function playAudio(audioId) {
    const audioAsset = getAssetById(audioId, gameState.project.assets);
    if (audioAsset) {
        const audio = new Audio(audioAsset.data);
        audio.play();
    }
}

function showChoices(choices) {
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 space-y-4';

    choices.forEach(choice => {
        const choiceBtn = document.createElement('button');
        choiceBtn.className = 'bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg';
        choiceBtn.textContent = choice.text;
        choiceBtn.onclick = () => {
            goToScene(choice.targetSceneId);
        };
        choicesContainer.appendChild(choiceBtn);
    });

    playerContainer.appendChild(choicesContainer);
}

function goToScene(sceneId) {
    gameState.currentSceneId = sceneId;
    gameState.currentActionIndex = 0;
    processNextAction();
}

function processNextAction() {
    if (gameState.isFinished) return;

    const currentScene = gameState.project.scenes.find(s => s.id === gameState.currentSceneId);
    if (!currentScene || gameState.currentActionIndex >= currentScene.actions.length) {
        endGame();
        return;
    }

    const action = currentScene.actions[gameState.currentActionIndex];
    gameState.currentActionIndex++;

    switch (action.type) {
        case 'setBackground':
            gameState.currentBackground = action.backgroundId;
            renderGameState();
            processNextAction(); // Ação instantânea, processa a próxima
            break;
        case 'showCharacter':
            gameState.charactersOnScreen[action.characterId] = { position: action.position };
            renderGameState();
            processNextAction();
            break;
        case 'hideCharacter':
            delete gameState.charactersOnScreen[action.characterId];
            renderGameState();
            processNextAction();
            break;
        case 'dialogue':
            renderGameState(); // Garante que a cena está correta antes do diálogo
            showDialogue(action.text, action.characterName);
            break;
        case 'addChoice':
            renderGameState();
            showChoices(action.choices);
            break;
        case 'jumpToScene':
            goToScene(action.sceneId);
            break;
        case 'playAudio':
            playAudio(action.audioId);
            processNextAction(); // Áudio toca em fundo, continua para a próxima ação
            break;
        case 'endGame':
            endGame();
            break;
        default:
            processNextAction(); // Pula ações não reconhecidas
            break;
    }
}

function endGame() {
    gameState.isFinished = true;
    const endScreen = document.createElement('div');
    endScreen.className = 'absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center text-center';
    endScreen.innerHTML = `
        <h2 class="text-4xl font-bold">Fim de Jogo</h2>
        <p class="mt-2">Clique para fechar.</p>
    `;
    playerContainer.appendChild(endScreen);
    endScreen.addEventListener('click', () => {
        document.getElementById('game-player-modal').classList.add('hidden');
    });
}

export function startGame(project) {
    if (!project.scenes || project.scenes.length === 0) {
        alert("Este projeto não tem cenas para exibir!");
        return;
    }

    gameState = {
        project: project,
        currentSceneId: project.scenes[0].id,
        currentActionIndex: 0,
        currentBackground: null,
        charactersOnScreen: {},
        isFinished: false,
    };

    document.getElementById('game-player-modal').classList.remove('hidden');
    processNextAction();
}
