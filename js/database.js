// Módulo de Banco de Dados: interage com localStorage

const PROJECTS_KEY = 'vn_creator_projects';

/**
 * Retorna todos os projetos salvos no localStorage.
 * @returns {Array} Uma lista de objetos de projeto.
 */
export function getProjects() {
    const projectsJSON = localStorage.getItem(PROJECTS_KEY);
    return projectsJSON ? JSON.parse(projectsJSON) : [];
}

/**
 * Salva um novo projeto no localStorage.
 * @param {object} projectData - O objeto de projeto a ser salvo.
 */
export function saveProject(projectData) {
    const projects = getProjects();
    projects.push(projectData);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Exclui um projeto do localStorage pelo seu ID.
 * @param {string} projectId - O ID do projeto a ser excluído.
 */
export function deleteProject(projectId) {
    let projects = getProjects();
    projects = projects.filter(p => p.id !== projectId);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

/**
 * Atualiza um projeto existente no localStorage.
 * @param {object} updatedProject - O objeto de projeto atualizado.
 */
export function updateProject(updatedProject) {
    let projects = getProjects();
    const projectIndex = projects.findIndex(p => p.id === updatedProject.id);
    if (projectIndex > -1) {
        projects[projectIndex] = updatedProject;
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
}
