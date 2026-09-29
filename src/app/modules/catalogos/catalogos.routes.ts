import { Routes } from '@angular/router';

/** Procesos del área «Clasificadores y catálogos». */
export const CATALOGOS_ROUTES: Routes = [
  {
    path: 'procesos/catalogo-indicadores-desempeno/solicitud',
    loadComponent: () =>
      import('./indicadores-desempeno/pages/solicitud/indicador-desempeno-request.component').then(
        (m) => m.IndicadorDesempenoRequestComponent,
      ),
  },
];
