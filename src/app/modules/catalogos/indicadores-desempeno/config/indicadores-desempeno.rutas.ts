/**
 * Rutas, ids y textos del proceso «Catálogo de indicadores de desempeño».
 * El id del proceso existe en `DEFAULT_PROCESS_TREE` (shared/utils/process-tree.util.ts).
 */
export const PROCESS_ROUTE = '/procesos/catalogo-indicadores-desempeno';
export const REQUEST_SEGMENT = 'solicitud';
export const REQUEST_ROUTE = `${PROCESS_ROUTE}/${REQUEST_SEGMENT}`;

/** Hoja del árbol de procesos: base de las migas de pan. */
export const PROCESS_ID = 'catalogo-indicadores-desempeno';
export const PROCESS_LABEL = 'Catálogo de indicadores de desempeño';

/** Documento del proceso (el que ofrece «Crear documento»). */
export const NOMBRE_DOCUMENTO = 'Solicitud de indicadores de desempeño';

/**
 * Órgano rector del documento. En el taller es fijo (dato de demostración); con un backend real vendría de la sesión
 * o del catálogo de órganos.
 */
export const ORGANO_RECTOR =
  'DIRECCIÓN DE CALIDAD DEL GASTO PÚBLICO DE LA DIRECCIÓN GENERAL DE PRESUPUESTO PÚBLICO';
