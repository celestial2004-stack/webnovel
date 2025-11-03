// Módulo de Exportação: gera o arquivo HTML final do jogo

/**
 * Gera uma string HTML completa para um projeto de Visual Novel.
 * @param {object} project - O objeto do projeto a ser exportado.
 * @param {string} engineCode - O código-fonte do motor do jogo (engine.js).
 * @returns {string} Uma string contendo um documento HTML completo e autocontido.
 */
function generateGameHTML(project, engineCode) {
    const projectJSON = JSON.stringify(project);

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.title}</title>
    <style>
        /* CSS mínimo para o player do jogo */
        body { margin: 0; font-family: sans-serif; background-color: #000; }
        .player-container { position: relative; width: 100vw; height: 100vh; max-width: 1280px; max-height: 720px; margin: auto; background-size: cover; background-position: center; }
        .player-container img { position: absolute; bottom: 0; height: 80%; object-fit: contain; }
        .dialogue-box { position: absolute; bottom: 1rem; left: 1rem; right: 1rem; background-color: rgba(0,0,0,0.75); padding: 1rem; border-radius: 8px; border: 1px solid #805AD5; color: white; cursor: pointer; }
        .dialogue-box h4 { margin: 0 0 0.5rem; color: #9F7AEA; }
        .end-screen { position: absolute; inset: 0; background-color: rgba(0,0,0,0.8); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: white; }
        .end-screen h2 { font-size: 2.5rem; }
    </style>
</head>
<body>
    <div id="game-player-container" class="player-container"></div>

    <script>
        // Injetando o código do motor do jogo diretamente
        ${engineCode}

        // Injetando os dados do projeto
        const gameData = ${projectJSON};

        // Iniciando o jogo ao carregar a página
        window.addEventListener('DOMContentLoaded', () => {
            // Modifica o engine para usar o container local
            const localPlayerContainer = document.getElementById('game-player-container');
            if (typeof startGame === 'function') {
                // Pequena adaptação para o motor funcionar no arquivo exportado
                const originalGetElementById = document.getElementById;
                document.getElementById = (id) => {
                    if (id === 'game-player-container') return localPlayerContainer;
                    if (id === 'game-player-modal') return { classList: { add: () => {}, remove: () => {} } }; // Dummy modal
                    return originalGetElementById.call(document, id);
                };
                startGame(gameData);
            } else {
                localPlayerContainer.innerHTML = '<p style="color:red;">Erro: Motor do jogo não encontrado.</p>';
            }
        });
    </script>
</body>
</html>
    `;
}

/**
 * Inicia o processo de exportação, gerando e baixando o arquivo HTML.
 * @param {object} project - O projeto a ser exportado.
 */
export async function exportProject(project) {
    try {
        // Busca o conteúdo do engine.js para embuti-lo
        const response = await fetch('./js/engine.js');
        const engineCode = await response.text();

        const gameHTML = generateGameHTML(project, engineCode);

        const blob = new Blob([gameHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.title.replace(/\s+/g, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Erro ao exportar o projeto:", error);
        alert("Ocorreu um erro ao tentar exportar o projeto. Verifique o console para mais detalhes.");
    }
}
