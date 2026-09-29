/**
 * Árbol maestro de procesos + utilidad de búsqueda de ruta.
 * Vive en shared/utils/ (no en layout/) porque lo consumen tanto piezas
 * del shell (layout/process-menu-tree, layout/create-document) como
 * utilidades transversales de shared (breadcrumbs.util) — shared no debe
 * depender de layout, así que la fuente de verdad va acá.
 */
export interface ProcessMenuNode {
  id: string;
  label: string;
  selected?: boolean;
  // Solo debe marcarse en nodos raiz: la vista inicial muestra hasta el segundo nivel.
  expanded?: boolean;
  // Ruta de la página principal del módulo (documentos y registros)
  moduleRoute?: string;
  // Si un nodo tiene estas propiedades, Crear documento puede completar documento/tipo y navegar.
  createRoute?: string;
  documentOptions?: string[];
  documentCreateOptions?: Array<{
    label: string;
    route?: string;
    actionTypes?: string[];
  }>;
  actionTypeOptions?: string[];
  /**
   * Marca un nodo como módulo planificado pero aún no implementado.
   * El menú lo renderiza con texto atenuado y badge "Próximamente",
   * y el click no navega (solo expande si tiene hijos).
   */
  comingSoon?: boolean;
  children?: ProcessMenuNode[];
}

/**
 * Árbol de procesos del taller, según el diseño de Figma «CEL-001-CT — Catálogo de Desempeño»
 * (sidenav «Menu processes»). Refleja la estructura del menú: «Clasificadores y catálogos» con sus
 * grupos «Clasificadores» y «Catálogos», y «Consultas y reportes».
 *
 * Aún no hay pantallas para estos procesos, así que las hojas van como `comingSoon`: se ven igual que
 * en el diseño pero el click solo expande/colapsa, sin intentar navegar a una ruta inexistente. Para
 * implementar un proceso: darle a su hoja `moduleRoute` (Documentos y registros) y otra para sus
 * consultas, y crear sus rutas en `app.routes.ts`.
 */
export const DEFAULT_PROCESS_TREE: ProcessMenuNode[] = [
  {
    id: 'clasificadores-catalogos',
    label: 'Clasificadores y catálogos',
    expanded: true,
    comingSoon: true,
    children: [
      {
        id: 'clasificadores',
        label: 'Clasificadores',
        comingSoon: true,
        children: [],
      },
      {
        id: 'catalogos',
        label: 'Catálogos',
        expanded: true,
        comingSoon: true,
        children: [
          { id: 'catalogo-actividades', label: 'Catálogo de actividades', comingSoon: true },
          { id: 'catalogo-ambito-institucional', label: 'Catálogo de ámbito institucional', comingSoon: true },
          {
            id: 'catalogo-indicadores-desempeno',
            label: 'Catálogo de indicadores de desempeño',
            comingSoon: true,
            selected: true,
            // Documento que ofrece el panel «Crear documento» al elegir este proceso.
            documentOptions: ['Solicitud de indicadores de desempeño'],
            documentCreateOptions: [{ label: 'Solicitud de indicadores de desempeño', actionTypes: ['Creación'] }],
            actionTypeOptions: ['Creación'],
          },
          { id: 'catalogo-productos', label: 'Catálogo de productos', comingSoon: true },
          { id: 'catalogo-programas-presupuestales', label: 'Catálogo de programas presupuestales', comingSoon: true },
        ],
      },
    ],
  },
  {
    id: 'consultas-reportes',
    label: 'Consultas y reportes',
    comingSoon: true,
    children: [],
  },
];

export function findProcessPathById(id: string, nodes: readonly ProcessMenuNode[] = DEFAULT_PROCESS_TREE): ProcessMenuNode[] {
  for (const node of nodes) {
    if (node.id === id) {
      return [node];
    }

    const childPath = findProcessPathById(id, node.children || []);

    if (childPath.length > 0) {
      return [node, ...childPath];
    }
  }

  return [];
}

/**
 * Árbol del menú "Ajustes" (módulo de administración). Lo pinta el mismo `siaf-process-menu-tree`
 * que el menú de procesos, con otros textos. En el taller no hay módulo de administración: las hojas
 * van como «Próximamente» y no navegan.
 */
export const ADMIN_MENU_TREE: ProcessMenuNode[] = [
  {
    id: 'administracion',
    label: 'Administración',
    expanded: true,
    children: [
      {
        id: 'usuarios-accesos',
        label: 'Usuarios y accesos',
        expanded: true,
        children: [
          { id: 'gestion-usuarios', label: 'Gestión de usuarios', comingSoon: true },
          { id: 'perfiles-funcionales', label: 'Perfiles funcionales', comingSoon: true },
        ],
      },
      {
        id: 'organizacion',
        label: 'Organización',
        children: [
          { id: 'entidades', label: 'Entidades', comingSoon: true },
          { id: 'unidades', label: 'Unidades orgánicas', comingSoon: true },
        ],
      },
    ],
  },
];
