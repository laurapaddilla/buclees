// Último proyecto abierto en este dispositivo, para "Seguir con…" del menú rápido.
// Se guarda al abrir un contador y se olvida al borrar ese proyecto o al salir de la cuenta.
const KEY = 'buclees_ultimo_proyecto';

export function getLastProject() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return value?.id ? value : null;
  } catch {
    return null;
  }
}

export function setLastProject(project) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ id: project.id, name: project.name }));
  } catch {
    // Sin almacenamiento disponible: el menú simplemente no muestra "Seguir con…".
  }
}

export function clearLastProject(id) {
  try {
    if (id === undefined || getLastProject()?.id === Number(id)) localStorage.removeItem(KEY);
  } catch {
    // Nada que borrar.
  }
}
