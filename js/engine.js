// Módulo do Motor do Jogo: lógica de execução da VN

let gameState = {};
const playerContainer = document.getElementById('game-player-container');

// CORREÇÃO: Função auxiliar específica para encontrar uma expressão
function getExpressionAsset(charId, exprId, assets) {
    const character = assets.characters.find(c => c.id === charId);
    if (character) {
        return character.expressions.find(e => e.id === exprId);
    }
    return null;
}

function getAssetById(id, assets, category) {
    return assets[category]?.find(asset => asset.id === id) || null;
}

function renderGameState() {
    playerContainer.innerHTML = ''; // Limpa a tela

    // Renderiza o fundo
    if (gameState.currentBackground) {
        const bgAsset = getAssetById(gameState.currentBackground, gameState.project.assets, 'backgrounds');
        if (bgAsset) {
            playerContainer.style.backgroundImage = `url(${bgAsset.data})`;
            playerContainer.style.backgroundSize = 'cover';
            playerContainer.style.backgroundPosition = 'center';
        }
    }

    // Renderiza personagens com a expressão correta
    for (const charId in gameState.charactersOnScreen) {
        const charState = gameState.charactersOnScreen[charId];
        const exprAsset = getExpressionAsset(charId, charState.expressionId, gameState.project.assets);
        if (exprAsset) {
            const charImg = document.createElement('img');
            charImg.src = exprAsset.data;
            charImg.className = 'absolute bottom-0 h-4/5 object-contain';
            if (charState.position === 'Esquerda') charImg.style.left = '0%';
            else if (charState.position === 'Direita') charImg.style.right = '0%';
            else {
                charImg.style.left = '50%';
                charImg.style.transform = 'translateX(-50%)';
            }
            playerContainer.appendChild(charImg);
        }
    }
}

function playAudio(action) {
    const audioAsset = getAssetById(action.audioId, gameState.project.assets, 'audio');
    if (!audioAsset) return;

    // MELHORIA: Lógica de canais de áudio
    if (action.audioType === 'music') {
        if (gameState.currentMusic && !gameState.currentMusic.paused) {
            gameState.currentMusic.pause();
        }
        gameState.currentMusic = new Audio(audioAsset.data);
        gameState.currentMusic.loop = true;
        gameState.currentMusic.play();
    } else { // Efeito sonoro
        const soundEffect = new Audio(audioAsset.data);
        soundEffect.play();
    }
}

function showDialogue(text, characterName) {
    const dialogueBox = document.createElement('div');
    dialogueBox.id = 'dialogue-box';
    // ... (estilização)
    dialogueBox.innerHTML = `<h4>${characterName || 'Narrador'}</h4><p>${text}</p>`;
    playerContainer.appendChild(dialogueBox);
    dialogueBox.addEventListener('click', processNextAction, { once: true });
}

function showChoices(choices) {
    const choicesContainer = document.createElement('div');
    // ... (estilização)
    choices.forEach(choice => {
        const choiceBtn = document.createElement('button');
        choiceBtn.textContent = choice.text;
        choiceBtn.onclick = () => goToScene(choice.targetSceneId);
        choicesContainer.appendChild(choiceBtn);
    });
    playerContainer.appendChild(choicesContainer);
}

function goToScene(sceneId) {
    const sceneExists = gameState.project.scenes.some(s => s.id === sceneId);
    if (!sceneExists) {
        console.error(`Tentativa de pular para cena inexistente: ${sceneId}`);
        endGame();
        return;
    }
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
            processNextAction();
            break;
        case 'showCharacter':
            gameState.charactersOnScreen[action.characterId] = {
                expressionId: action.expressionId,
                position: action.position
            };
            renderGameState();
            processNextAction();
            break;
        case 'hideCharacter':
            delete gameState.charactersOnScreen[action.characterId];
            renderGameState();
            processNextAction();
            break;
        case 'dialogue':
            renderGameState();
            showDialogue(action.text, action.characterName);
            break;
        case 'playAudio':
            playAudio(action);
            processNextAction();
            break;
        case 'jumpToScene':
            goToScene(action.sceneId);
            break;
        case 'addChoice':
            renderGameState();
            showChoices(action.choices);
            break;
        case 'endGame':
            endGame();
            break;
        default:
            processNextAction();
            break;
    }
}

function endGame() {
    gameState.isFinished = true;
    // ... (lógica da tela final)
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
        currentMusic: null,
    };

    document.getElementById('game-player-modal').classList.remove('hidden');
    processNextAction();
}
