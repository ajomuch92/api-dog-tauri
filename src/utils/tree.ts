import type { EndpointSummary, Folder } from '@/types/apidog';

export interface TreeNode {
  folder: Folder;
  children: TreeNode[];
  endpoints: EndpointSummary[];
  /** Total de endpoints incluyendo descendientes. */
  count: number;
}

export const ROOT_FOLDER_ID = 0;
const UNFILED: Folder = { id: ROOT_FOLDER_ID, name: 'Sin carpeta', parentId: -1, path: '' };

/**
 * Convierte la lista plana de carpetas + endpoints en un árbol.
 * Cuando hay filtros activos se ocultan las carpetas vacías para que el
 * resultado sea legible; sin filtros solo se ocultan las carpetas "Root"
 * técnicas que Apidog crea por módulo y que no contienen nada.
 */
export function buildTree(
  folders: Folder[],
  endpoints: EndpointSummary[],
  hideEmpty: boolean,
): TreeNode[] {
  const nodes = new Map<number, TreeNode>();
  for (const folder of folders) {
    nodes.set(folder.id, { folder, children: [], endpoints: [], count: 0 });
  }

  const unfiled: TreeNode = { folder: UNFILED, children: [], endpoints: [], count: 0 };
  for (const ep of endpoints) {
    const node = nodes.get(ep.folderId) ?? unfiled;
    node.endpoints.push(ep);
  }

  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = nodes.get(node.folder.parentId);
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  const sortNode = (node: TreeNode) => {
    node.children.sort((a, b) => a.folder.name.localeCompare(b.folder.name));
    node.endpoints.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(sortNode);
    node.count = node.endpoints.length + node.children.reduce((acc, c) => acc + c.count, 0);
  };
  roots.forEach(sortNode);
  sortNode(unfiled);

  const prune = (list: TreeNode[]): TreeNode[] =>
    list
      .map((n) => ({ ...n, children: prune(n.children) }))
      .filter((n) => {
        if (n.count > 0) return true;
        if (hideEmpty) return false;
        return n.folder.name !== 'Root';
      });

  const result = prune(roots).sort((a, b) => a.folder.name.localeCompare(b.folder.name));
  if (unfiled.count > 0) result.push(unfiled);
  return result;
}

/** Aplana el árbol de carpetas para usarlo en un `<select>`. */
export function flattenFolders(folders: Folder[]): Array<{ id: number; label: string; depth: number }> {
  const byParent = new Map<number, Folder[]>();
  for (const f of folders) {
    const list = byParent.get(f.parentId) ?? [];
    list.push(f);
    byParent.set(f.parentId, list);
  }
  const out: Array<{ id: number; label: string; depth: number }> = [];
  const visit = (parentId: number, depth: number) => {
    for (const f of (byParent.get(parentId) ?? []).sort((a, b) => a.name.localeCompare(b.name))) {
      out.push({ id: f.id, label: f.name, depth });
      visit(f.id, depth + 1);
    }
  };
  visit(0, 0);
  return out;
}
