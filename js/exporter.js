// Módulo de Exportação: gera o arquivo HTML final do jogo

// CORREÇÃO: Conteúdo do engine.js embutido para evitar fetch() e problemas com file:///
const engineCode = `
// Módulo do Motor do Jogo: lógica de execução da VN

let gameState = {};
let playerContainer; // Definido no DOMContentLoaded

function getExpressionAsset(charId, exprId, assets) {
    const character = assets.characters.find(c => c.id === charId);
    return character ? character.expressions.find(e => e.id === exprId) : null;
}

function getAssetById(id, assets, category) {
    return assets[category]?.find(asset => asset.id === id) || null;
}

function renderGameState() {
    playerContainer.innerHTML = '';

    const bgAsset = getAssetById(gameState.currentBackground, gameState.project.assets, 'backgrounds');
    if (bgAsset) {
        playerContainer.style.backgroundImage = \`url(\${bgAsset.data})\`;
        playerContainer.style.backgroundSize = 'cover';
        playerContainer.style.backgroundPosition = 'center';
    }

    for (const charId in gameState.charactersOnScreen) {
        const charState = gameState.charactersOnScreen[charId];
        const exprAsset = getExpressionAsset(charId, charState.expressionId, gameState.project.assets);
        if (exprAsset) {
            const charImg = document.createElement('img');
            charImg.src = exprAsset.data;
            charImg.className = 'char-sprite'; // Usando classe para CSS
            if (charState.position === 'Esquerda') charImg.style.left = '5%';
            else if (charState.position === 'Direita') charImg.style.right = '5%';
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

    if (action.audioType === 'music') {
        if (gameState.currentMusic && !gameState.currentMusic.paused) {
            gameState.currentMusic.pause();
        }
        gameState.currentMusic = new Audio(audioAsset.data);
        gameState.currentMusic.loop = true;
        gameState.currentMusic.play().catch(e => console.error("Erro ao tocar música:", e));
    } else {
        new Audio(audioAsset.data).play().catch(e => console.error("Erro ao tocar efeito:", e));
    }
}

function showDialogue(text, characterName) {
    const dialogueBox = document.createElement('div');
    dialogueBox.className = 'dialogue-box';
    dialogueBox.innerHTML = \`<h4>\${characterName || 'Narrador'}</h4><p>\${text || ''}</p>\`;
    playerContainer.appendChild(dialogueBox);
    dialogueBox.addEventListener('click', processNextAction, { once: true });
}

function showChoices(choices) {
    const choicesContainer = document.createElement('div');
    choicesContainer.className = 'choices-container';
    choices.forEach(choice => {
        if(!choice.text || !choice.targetSceneId) return;
        const choiceBtn = document.createElement('button');
        choiceBtn.textContent = choice.text;
        choiceBtn.onclick = () => goToScene(choice.targetSceneId);
        choicesContainer.appendChild(choiceBtn);
    });
    playerContainer.appendChild(choicesContainer);
}

function goToScene(sceneId) {
    if (!gameState.project.scenes.some(s => s.id === sceneId)) {
        console.error(\`Cena de destino não encontrada: \${sceneId}\`);
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
    const endScreen = document.createElement('div');
    endScreen.className = 'end-screen';
    endScreen.innerHTML = '<h2>Fim de Jogo</h2>';
    playerContainer.appendChild(endScreen);
}

function startGame(project) {
    if (!project || !project.scenes || project.scenes.length === 0) {
        playerContainer.innerHTML = '<p style="color:red;">Erro: Projeto inválido ou sem cenas.</p>';
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
    processNextAction();
}
`;

function generateGameHTML(project) {
    const projectJSON = JSON.stringify(project);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <style>
        body { margin: 0; font-family: sans-serif; background-color: #000; color: white; }
        .player-container { position: relative; width: 100vw; height: 100vh; max-width: 1280px; max-height: 720px; margin: auto; background-size: cover; background-position: center; overflow: hidden; }
        .char-sprite { position: absolute; bottom: 0; height: 90%; max-width: 40%; object-fit: contain; }
        .dialogue-box { position: absolute; bottom: 2rem; left: 5%; right: 5%; background-color: rgba(0,0,0,0.8); padding: 1.5rem; border-radius: 8px; border: 2px solid #6B46C1; cursor: pointer; }
        .dialogue-box h4 { margin: 0 0 0.5rem; color: #9F7AEA; font-size: 1.2rem; }
        .choices-container { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.6); gap: 1rem; }
        .choices-container button { background-color: #6B46C1; color: white; font-bold: 700; padding: 1rem 2rem; border-radius: 8px; border: none; cursor: pointer; min-width: 300px; }
        .choices-container button:hover { background-color: #805AD5; }
        .end-screen { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.9); font-size: 3rem; }
    </style>
</head>
<body>
    <div id="game-player-container" class="player-container"></div>
    <script>
        ${engineCode}
        const gameData = ${projectJSON};
        window.addEventListener('DOMContentLoaded', () => {
            playerContainer = document.getElementById('game-player-container');
            startGame(gameData);
        });
    </script>
</body>
</html>`;
}

/**
 * Inicia o processo de exportação, gerando e baixando o arquivo HTML.
 */
export function exportProject(project) {
    try {
        const gameHTML = generateGameHTML(project);
        const blob = new Blob([gameHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/\s+/g, '_').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Erro ao exportar o projeto:", error);
        alert("Ocorreu um erro ao exportar.");
    }
}
