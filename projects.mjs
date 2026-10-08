import { existsSync, readFileSync, realpathSync, statSync, writeFileSync, renameSync, chmodSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

export function projectDirectory(path) {
  if (typeof path !== 'string' || !isAbsolute(path)) throw new Error('Project cwd must be an absolute directory path');
  let cwd;
  try { cwd = realpathSync(path); if (!statSync(cwd).isDirectory()) throw new Error(); }
  catch { throw new Error('Project directory does not exist or is not a directory'); }
  return cwd;
}

export function projectRegistry(state) {
  const path = join(state, 'projects.json');
  if (existsSync(path)) chmodSync(path, 0o600);
  const projects = Object.assign(Object.create(null), existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});
  function register(input) {
    if (!input || typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(input.id)) throw new Error('A valid stable project ID is required');
    const cwd = projectDirectory(input.cwd);
    if (projects[input.id]) {
      if (projects[input.id].cwd !== cwd) throw new Error('Project ID already identifies a different directory');
      return projects[input.id];
    }
    const duplicate = Object.values(projects).find(project => project.cwd === cwd);
    if (duplicate) throw new Error('Project directory is already registered as ' + duplicate.id);
    if (input.title !== undefined && (typeof input.title !== 'string' || !input.title.trim())) throw new Error('Project title must be nonempty text');
    const project = { id: input.id, title: (input.title || input.id).slice(0, 100), cwd };
    projects[project.id] = project;
    try {
      writeFileSync(path + '.tmp', JSON.stringify(projects, null, 2), { mode: 0o600 });
      renameSync(path + '.tmp', path);
    } catch (error) { delete projects[project.id]; throw error; }
    return project;
  }
  function get(id) {
    if (typeof id !== 'string' || !Object.hasOwn(projects, id)) throw new Error('Unknown projectId; list_projects and select a registered project');
    const project = projects[id];
    if (projectDirectory(project.cwd) !== project.cwd) throw new Error('Registered project directory changed; execution refused');
    return project;
  }
  return { register, get, list: () => Object.values(projects) };
}
