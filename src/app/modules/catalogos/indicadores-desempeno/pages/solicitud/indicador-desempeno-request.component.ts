import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ActionTrackerComponent, ActionTrackerSummary } from '../../../../../shared/ui/action-tracker/action-tracker.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DocumentSummaryCardComponent } from '../../../../../shared/ui/document-summary-card/document-summary-card.component';
import { FlowStatus } from '../../../../../shared/ui/flow-status-tag/flow-status-tag.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { ModalComponent } from '../../../../../shared/ui/modal/modal.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { SnackbarComponent } from '../../../../../shared/ui/snackbar/snackbar.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { NOMBRE_DOCUMENTO, ORGANO_RECTOR, PROCESS_LABEL, PROCESS_ROUTE } from '../../config/indicadores-desempeno.rutas';
import { IndicadorDesempenoDetalleComponent, IndicadorDetalleResumen } from './indicador-desempeno-detalle.component';
import { IndicadorDesempenoDetalleVistaComponent } from './indicador-desempeno-detalle-vista.component';
import { CatalogColumn, CatalogRow, CatalogSelectionModalComponent } from './catalog-selection-modal.component';
import { INDICADORES_DEMO, IndicadorDemo } from './indicadores-demo';

/** Registro de indicador ya agregado a la solicitud (fila de la tabla). */
interface IndicadorRegistrado extends IndicadorDetalleResumen {
  id: number;
}

/**
 * Solicitud de indicadores de desempeño (estado «Nuevo»): la pantalla que abre «Crear documento» al aceptar.
 *
 * La tarjeta «Registro de indicador de desempeño» alterna entre: estado vacío, la tabla de registros agregados, y el
 * formulario DETALLE (al pulsar «+»). Al aceptar un registro, este pasa a la tabla y se habilita «Grabar».
 */
@Component({
  selector: 'siaf-indicador-desempeno-request',
  standalone: true,
  imports: [
    SolicitudePageLayoutComponent,
    SolicitudeInfoCardComponent,
    SolicitudeFormCardComponent,
    ActionTrackerComponent,
    DocumentSummaryCardComponent,
    ButtonComponent,
    IconComponent,
    ModalComponent,
    TextFieldComponent,
    CatalogSelectionModalComponent,
    SnackbarComponent,
    TooltipDirective,
    IndicadorDesempenoDetalleComponent,
    IndicadorDesempenoDetalleVistaComponent,
  ],
  template: `
    @if (detalleVisto(); as indicador) {
      <siaf-indicador-desempeno-detalle-vista [indicador]="indicador" (back)="detalleVisto.set(null)" />
    } @else {
    <div class="min-h-[calc(100vh-56px)] bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <siaf-solicitude-page-layout
        [breadcrumbs]="breadcrumbs"
        role="creator"
        [state]="estado()"
        [heading]="heading"
        [secondaryText]="secondaryText()"
        verifyLabel="Verificar y enviar"
        [showReturn]="true"
        [saveDisabled]="esModificacion() || mostrandoForm() || registros().length === 0"
        [verifyDisabled]="esModificacion() || !elaborado()"
        (returned)="regresar()"
        (canceled)="regresar()"
        (saved)="modalGrabar.set(true)"
        (edited)="editar()"
        (verified)="modalVerificar.set(true)"
      >
        @if (grabado() && !esModificacion()) {
          <section class="grid gap-siaf-md lg:grid-cols-[1fr_360px]">
            <siaf-solicitude-info-card [fields]="camposCabecera" [captureOpenDate]="true" />
            <siaf-document-summary-card [documentNumber]="numeroDocumento" [status]="estadoDocumento()" />
          </section>
        } @else {
          <siaf-solicitude-info-card [fields]="camposCabecera" [captureOpenDate]="true" />
        }

        @if (esModificacion()) {
          <siaf-solicitude-form-card title="Tipo de modificación">
            <siaf-input
              class="block md:max-w-[360px]"
              type="select"
              placeholder="Tipo de modificación"
              [options]="opcTipoModificacion"
              [value]="tipoModificacion()"
              (valueChange)="tipoModificacion.set($any($event))"
            />
          </siaf-solicitude-form-card>

          @if (tipoModificacion() === 'atributos') {
            <siaf-solicitude-form-card title="Modificación de indicador de desempeño">
              @if (editandoIndicador()) {
                <div card-actions class="flex items-center gap-siaf-sm">
                  <siaf-button variant="secondary" size="md" (click)="cancelarEdicionMod()">Cancelar</siaf-button>
                  <siaf-button variant="accent" size="md" [disabled]="!detalle()?.aceptarHabilitado()" (click)="aceptarEdicionMod()">Aceptar</siaf-button>
                </div>
              } @else {
                <div card-actions class="flex items-center gap-siaf-sm">
                  <siaf-button variant="accent" size="md" icon="search" [iconOnly]="true" [disabled]="indicadoresModificar().length > 0" ariaLabel="Buscar" siafTooltip="Buscar" (click)="modalBuscarIndicador.set(true)" />
                </div>
              }

              @if (editandoIndicador()) {
                <siaf-indicador-desempeno-detalle [prefill]="editandoIndicador()" [modoModificacion]="true" (canceled)="cancelarEdicionMod()" (saved)="aceptarEdicionMod()" />
              } @else if (indicadoresModificar().length) {
                <div class="flex flex-col gap-siaf-md">
                  <!-- Buscador de la tabla + filtro y más opciones. -->
                  <div class="flex items-center gap-siaf-md">
                    <siaf-input class="block w-full" label="Buscar" trailingIcon="search" [value]="busquedaMod()" (valueChange)="busquedaMod.set($any($event))" />
                    <siaf-button variant="text" size="md" icon="filter_list" [iconOnly]="true" ariaLabel="Filtros" />
                    <siaf-button variant="text" size="md" icon="more_vert" [iconOnly]="true" ariaLabel="Más opciones" />
                  </div>

                  <div class="flex items-center gap-siaf-sm">
                    <input type="checkbox" class="size-5" [checked]="todosModSeleccionados()" (change)="alternarTodosMod($any($event.target).checked)" aria-label="Seleccionar todos los indicadores" />
                    @if (modSeleccionados().size > 0) {
                      <siaf-button variant="text" size="md" icon="edit" [iconOnly]="true" ariaLabel="Editar" siafTooltip="Editar" (click)="editarSeleccionadoMod()" />
                      <siaf-button variant="text" size="md" icon="delete" [iconOnly]="true" ariaLabel="Eliminar" siafTooltip="Eliminar" (click)="eliminarSeleccionadosMod()" />
                    }
                  </div>

                  <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
                    <table class="w-full min-w-[760px] border-collapse text-sm">
                      <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                        <tr>
                          <th class="w-20 border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm"></th>
                          <th class="w-[140px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Código indicador</th>
                          <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Nombre indicador</th>
                          <th class="w-[180px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Nivel de medición</th>
                          <th class="w-[200px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Dimensión de desempeño</th>
                        </tr>
                      </thead>
                      <tbody class="text-text">
                        @for (ind of indicadoresModificarFiltrados(); track ind.codigo) {
                          <tr class="border-b border-[var(--sys-color-divider-default)]">
                            <td class="px-siaf-md py-siaf-sm">
                              <div class="flex items-center gap-siaf-sm">
                                <input type="checkbox" class="size-5" [checked]="modSeleccionados().has(ind.codigo)" (change)="alternarUnoMod(ind.codigo, $any($event.target).checked)" [attr.aria-label]="'Seleccionar ' + ind.nombre" />
                                <siaf-icon name="segment" [size]="20" class="text-[var(--sys-color-text-neutral-medium)]" aria-hidden="true" />
                              </div>
                            </td>
                            <td class="px-siaf-md py-siaf-sm font-bold">{{ ind.codigo }}</td>
                            <td class="px-siaf-md py-siaf-sm">{{ ind.nombre }}</td>
                            <td class="px-siaf-md py-siaf-sm">{{ ind.nivelMedicion }}</td>
                            <td class="px-siaf-md py-siaf-sm">{{ dimensionLabelDe(ind) }}</td>
                          </tr>
                        } @empty {
                          <tr><td colspan="5" class="px-siaf-md py-siaf-lg text-center text-[var(--sys-color-text-neutral-medium)]">No se encontraron resultados.</td></tr>
                        }
                      </tbody>
                    </table>
                  </div>

                  <div class="flex items-center justify-end gap-siaf-lg text-sm text-[var(--sys-color-text-neutral-medium)]">
                    <span>Filas por página: {{ indicadoresModificar().length }}</span>
                    <span>1-{{ indicadoresModificarFiltrados().length }} de {{ indicadoresModificarFiltrados().length }}</span>
                  </div>
                </div>
              } @else {
                <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
                  <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">
                    No se ha seleccionado ninguna opción. Haga clic en el botón para realizar una selección.
                  </p>
                </div>
              }
            </siaf-solicitude-form-card>
          }
        } @else {
        <siaf-solicitude-form-card title="Registro de indicador de desempeño">
          <div card-actions class="flex items-center gap-siaf-sm">
            @if (mostrandoForm()) {
              <siaf-button variant="secondary" size="md" (click)="cancelarForm()">Cancelar</siaf-button>
              <siaf-button variant="accent" size="md" [disabled]="!detalle()?.aceptarHabilitado()" (click)="detalle()?.aceptar()">Aceptar</siaf-button>
            } @else {
              <siaf-button variant="accent" size="md" icon="add" [iconOnly]="true" [disabled]="registros().length > 0" ariaLabel="Añadir" siafTooltip="Añadir" (click)="abrirForm()" />
            }
          </div>

          @if (mostrandoForm()) {
            <siaf-indicador-desempeno-detalle (saved)="onRegistroGuardado($event)" (canceled)="cancelarForm()" />
          } @else if (registros().length) {
            <div class="flex flex-col gap-siaf-md">
              <div class="flex items-center gap-siaf-sm">
                <input type="checkbox" class="size-5" [checked]="todosSeleccionados()" (change)="alternarTodos($any($event.target).checked)" aria-label="Seleccionar todos los registros" />
                @if (seleccionados().size > 0) {
                  <siaf-button variant="text" size="md" icon="edit" [iconOnly]="true" ariaLabel="Editar" siafTooltip="Editar" (click)="editarSeleccionado()" />
                  <siaf-button variant="text" size="md" icon="delete" [iconOnly]="true" ariaLabel="Eliminar" siafTooltip="Eliminar" (click)="modalEliminar.set(true)" />
                  <siaf-button variant="text" size="md" icon="more_vert" [iconOnly]="true" ariaLabel="Más opciones" siafTooltip="Más opciones" />
                }
              </div>
              <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
                <table class="w-full min-w-[2320px] border-collapse text-sm">
                  <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                    <tr>
                      <th class="w-12 border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm" rowspan="2"></th>
                      <th class="w-[140px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Código indicador</th>
                      <th class="w-[240px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Nombre indicador</th>
                      <th class="w-[160px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Nivel de medición</th>
                      <th class="w-[190px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Dimensión de desempeño</th>
                      <th class="w-[320px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Programa presupuestal</th>
                      <th class="w-[320px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Producto</th>
                      <th class="border-x border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-xs text-center" colspan="3">Vigencia en procesos</th>
                      <th class="w-[170px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Año de inicio de medición</th>
                      <th class="w-[170px] border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left" rowspan="2">Año de fin de medición</th>
                      <th class="border-x border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-xs text-center" colspan="3">Vigencia</th>
                    </tr>
                    <tr>
                      <th class="w-[56px] border-b border-l border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-center">P</th>
                      <th class="w-[56px] border-b border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-center">G</th>
                      <th class="w-[56px] border-b border-r border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-center">E</th>
                      <th class="w-[90px] border-b border-l border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-center">Estado</th>
                      <th class="w-[130px] border-b border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-left">Fecha desde</th>
                      <th class="w-[130px] border-b border-r border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-xs text-left">Fecha hasta</th>
                    </tr>
                  </thead>
                  <tbody class="text-text">
                    @for (registro of registros(); track registro.id) {
                      <tr class="border-b border-[var(--sys-color-divider-default)]">
                        <td class="px-siaf-md py-siaf-sm text-center"><input type="checkbox" class="size-5" [checked]="seleccionados().has(registro.id)" (change)="alternarUno(registro.id, $any($event.target).checked)" [attr.aria-label]="'Seleccionar ' + registro.nombre" /></td>
                        <td class="px-siaf-md py-siaf-sm font-bold">
                          <button type="button" class="font-bold text-[var(--sys-color-text-brand-primary)] underline-offset-2 hover:underline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-states-focus)]" (click)="verDetalle(registro)">{{ registro.codigo }}</button>
                        </td>
                        <td class="px-siaf-md py-siaf-sm">
                          <button type="button" class="text-left hover:underline focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sys-color-border-states-focus)]" (click)="verDetalle(registro)">{{ registro.nombre }}</button>
                        </td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.nivelMedicion }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.dimension }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.programa }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.producto || '—' }}</td>
                        <td class="border-l border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-sm text-center">{{ registro.programacion }}</td>
                        <td class="px-siaf-sm py-siaf-sm text-center">{{ registro.gestion }}</td>
                        <td class="border-r border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-sm text-center">{{ registro.evaluacion }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.anioInicio }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.anioFin }}</td>
                        <td class="border-l border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-sm text-center">{{ registro.estado }}</td>
                        <td class="px-siaf-sm py-siaf-sm">{{ registro.fechaDesde }}</td>
                        <td class="border-r border-[var(--sys-color-divider-default)] px-siaf-sm py-siaf-sm">{{ registro.fechaHasta }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <div class="flex items-center justify-end gap-siaf-lg text-sm text-[var(--sys-color-text-neutral-medium)]">
                <span>Filas por página: 25</span>
                <span>1-{{ registros().length }} de {{ registros().length }}</span>
              </div>
            </div>
          } @else {
            <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
              <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">
                Por favor, haga clic en el botón (+) para añadir el registro.
              </p>
            </div>
          }
        </siaf-solicitude-form-card>

        @if (grabado()) {
          <siaf-action-tracker [showSummaryCards]="true" [showTabs]="false" [summaryItems]="trazabilidad()" />
        }
        }
      </siaf-solicitude-page-layout>

      <!-- Búsqueda del indicador a modificar (datos reales del taller). -->
      <siaf-catalog-selection-modal
        [open]="modalBuscarIndicador()"
        title="Seleccionar registro"
        [multiple]="true"
        [pageSize]="25"
        [columns]="columnasIndicador"
        [rows]="filasIndicador"
        [selectedIds]="idsModificar()"
        (acceptedMultiple)="onIndicadoresModificarAceptado($event)"
        (closed)="modalBuscarIndicador.set(false)"
      />

      <!-- Confirmación de grabado del documento. -->
      <siaf-modal
        [open]="modalGrabar()"
        variant="save"
        title="¿Grabar documento?"
        description="Los registros se grabarán en este documento."
        [showIllustration]="true"
        (confirmed)="confirmarGrabar()"
        (canceled)="modalGrabar.set(false)"
        (closed)="modalGrabar.set(false)"
      />

      <!-- Confirmación de verificar y enviar el documento. -->
      <siaf-modal
        [open]="modalVerificar()"
        variant="verify"
        title="¿Verificar y enviar solicitud?"
        description="La solicitud será verificada y enviada."
        [showIllustration]="true"
        (confirmed)="confirmarVerificar()"
        (canceled)="modalVerificar.set(false)"
        (closed)="modalVerificar.set(false)"
      />

      <!-- Confirmación de borrado del registro seleccionado. -->
      <siaf-modal
        [open]="modalEliminar()"
        variant="delete-record"
        [showIllustration]="true"
        (confirmed)="confirmarEliminar()"
        (canceled)="modalEliminar.set(false)"
        (closed)="modalEliminar.set(false)"
      />

      <!-- Aviso de registro exitoso (aparece con un breve retraso tras aceptar). -->
      <div class="fixed bottom-6 right-6 z-[60]">
        <siaf-snackbar [open]="snackbarVisible()" variant="record-done" (closed)="snackbarVisible.set(false)" />
      </div>

      <!-- Aviso de documento elaborado (aparece tras grabar). -->
      <div class="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
        <siaf-snackbar
          [open]="snackbarElaboradoVisible()"
          variant="creation-elaborated"
          [requestNumber]="numeroDocumento"
          (closed)="snackbarElaboradoVisible.set(false)"
        />
      </div>

      <!-- Aviso de documento verificado y enviado (aparece tras verificar). -->
      <div class="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
        <siaf-snackbar
          [open]="snackbarVerificadoVisible()"
          variant="creation-verified"
          requestAction="verificado y enviado"
          [requestNumber]="numeroDocumento"
          (closed)="snackbarVerificadoVisible.set(false)"
        />
      </div>

      <!-- Aviso de registro eliminado (aparece tras confirmar el borrado). -->
      <div class="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
        <siaf-snackbar
          [open]="snackbarEliminadoVisible()"
          variant="custom"
          tone="success"
          message="El registro ha sido eliminado con éxito del listado."
          (closed)="snackbarEliminadoVisible.set(false)"
        />
      </div>
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoRequestComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly heading = NOMBRE_DOCUMENTO;
  readonly detalle = viewChild(IndicadorDesempenoDetalleComponent);

  // Tipo de acción del documento (de la ruta): creacion (por defecto), modificacion o anulacion.
  readonly actionType = signal(this.route.snapshot.queryParamMap.get('actionType') ?? 'creacion');
  readonly esModificacion = computed(() => this.actionType() === 'modificacion');
  readonly secondaryText = computed(() => (this.esModificacion() ? 'Modificación' : 'Creación'));

  // Modificación: tipo (Atributos / Año fin de medición), elegido a mano.
  readonly tipoModificacion = signal('');
  readonly modalBuscarIndicador = signal(false);
  readonly indicadoresModificar = signal<IndicadorDemo[]>([]);
  readonly idsModificar = computed(() => this.indicadoresModificar().map((i) => i.codigo));
  readonly busquedaMod = signal('');
  readonly modSeleccionados = signal<Set<string>>(new Set());
  readonly editandoIndicador = signal<IndicadorDemo | null>(null);

  readonly indicadoresModificarFiltrados = computed<IndicadorDemo[]>(() => {
    const q = this.busquedaMod().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    const lista = this.indicadoresModificar();
    if (!q) return lista;
    return lista.filter((i) =>
      [i.codigo, i.nombre, i.nivelMedicion, this.dimensionLabelDe(i)]
        .some((v) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)),
    );
  });

  // Modal de búsqueda de indicador (datos reales del taller, del Excel).
  private readonly dimensionLabel: Record<string, string> = {
    eficacia: '1. Eficacia', eficiencia: '2. Eficiencia', calidad: '3. Calidad', economia: '4. Economía',
  };
  readonly columnasIndicador: CatalogColumn[] = [
    { key: 'codigo', label: 'Código indicador', widthClass: 'w-[140px]' },
    { key: 'nombre', label: 'Nombre indicador' },
    { key: 'nivelMedicion', label: 'Nivel de medición', widthClass: 'w-[180px]' },
    { key: 'dimension', label: 'Dimensión de desempeño', widthClass: 'w-[200px]' },
  ];
  readonly filasIndicador: CatalogRow[] = INDICADORES_DEMO.map((i) => ({
    id: i.codigo,
    codigo: i.codigo,
    nombre: i.nombre,
    nivelMedicion: i.nivelMedicion,
    dimension: this.dimensionLabel[i.dimension] ?? i.dimension,
  }));
  readonly opcTipoModificacion = [
    { label: 'Atributos', value: 'atributos' },
    { label: 'Año fin de medición', value: 'anio-fin' },
  ];

  readonly mostrandoForm = signal(false);
  readonly registros = signal<IndicadorRegistrado[]>([]);
  readonly seleccionados = signal<Set<number>>(new Set());
  readonly modalEliminar = signal(false);
  readonly modalGrabar = signal(false);
  readonly modalVerificar = signal(false);
  readonly snackbarVisible = signal(false);
  readonly snackbarEliminadoVisible = signal(false);
  readonly snackbarElaboradoVisible = signal(false);
  readonly snackbarVerificadoVisible = signal(false);
  readonly detalleVisto = signal<IndicadorRegistrado | null>(null);
  private correlativo = 23; // el primer registro queda como 0024, según el diseño

  // Estado del documento: «new» (Nuevo) → «elaborated» (Elaborado) → «verified» (Verificado).
  readonly estado = signal<'new' | 'elaborated' | 'verified'>('new');
  readonly elaborado = computed(() => this.estado() === 'elaborated');
  readonly grabado = computed(() => this.estado() !== 'new');
  readonly estadoDocumento = computed<FlowStatus>(() => (this.estado() === 'verified' ? 'Verificado' : 'Elaborado'));
  readonly numeroDocumento = '0001';
  private readonly elaboradorNombre = 'JUAN DOE PEREZ PEREZ';
  private readonly fechaElaboracion = signal('');
  private readonly fechaVerificacion = signal('');

  // Trazabilidad: se van registrando los hitos a medida que avanza el documento.
  readonly trazabilidad = computed<ActionTrackerSummary[]>(() => [
    { label: 'Elaborado por', actionBy: this.elaboradorNombre, date: this.fechaElaboracion() },
    { label: 'Verificado por', actionBy: this.fechaVerificacion() ? this.elaboradorNombre : '', date: this.fechaVerificacion() },
    { label: 'Validado por', actionBy: '', date: '' },
    { label: 'Aceptado por', actionBy: '', date: '' },
  ]);

  // Migas como el diseño: Inicio › Catálogo de indicadores de desempeño › Registro.
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/panel' },
    { label: PROCESS_LABEL, href: PROCESS_ROUTE },
    { label: 'Registro' },
  ];

  readonly camposCabecera: SolicitudeInfoField[] = [
    { label: 'Fecha', value: '' },
    { label: 'Órgano rector', value: ORGANO_RECTOR },
  ];

  todosSeleccionados(): boolean {
    const total = this.registros().length;
    return total > 0 && this.seleccionados().size === total;
  }

  regresar(): void {
    void this.router.navigate(['/panel']);
  }

  /** Abre la pantalla de detalle de solo lectura del indicador seleccionado. */
  verDetalle(registro: IndicadorRegistrado): void {
    this.detalleVisto.set(registro);
  }

  /** Etiqueta de la dimensión de un indicador de ejemplo. */
  dimensionLabelDe(ind: IndicadorDemo): string {
    return this.dimensionLabel[ind.dimension] ?? ind.dimension;
  }

  /** Al aceptar la búsqueda, guarda los indicadores a modificar y cierra el modal. */
  onIndicadoresModificarAceptado(codigos: string[]): void {
    this.indicadoresModificar.set(INDICADORES_DEMO.filter((i) => codigos.includes(i.codigo)));
    this.modSeleccionados.set(new Set());
    this.busquedaMod.set('');
    this.modalBuscarIndicador.set(false);
  }

  todosModSeleccionados(): boolean {
    const total = this.indicadoresModificarFiltrados().length;
    return total > 0 && this.indicadoresModificarFiltrados().every((i) => this.modSeleccionados().has(i.codigo));
  }

  alternarTodosMod(marcado: boolean): void {
    this.modSeleccionados.set(marcado ? new Set(this.indicadoresModificarFiltrados().map((i) => i.codigo)) : new Set());
  }

  alternarUnoMod(codigo: string, marcado: boolean): void {
    this.modSeleccionados.update((s) => {
      const next = new Set(s);
      if (marcado) next.add(codigo); else next.delete(codigo);
      return next;
    });
  }

  /** Abre el formulario DETALLE pre-cargado con el primer indicador marcado. */
  editarSeleccionadoMod(): void {
    const codigo = [...this.modSeleccionados()][0];
    const ind = this.indicadoresModificar().find((i) => i.codigo === codigo);
    if (!ind) return;
    this.editandoIndicador.set(ind);
    // El formulario hijo se monta y se rellena tras este tick; re-evaluamos para que «Aceptar» salga ya habilitado.
    setTimeout(() => this.cdr.markForCheck());
  }

  /** Elimina los indicadores marcados de la tabla de modificación. */
  eliminarSeleccionadosMod(): void {
    const ids = this.modSeleccionados();
    this.indicadoresModificar.update((lista) => lista.filter((i) => !ids.has(i.codigo)));
    this.modSeleccionados.set(new Set());
  }

  cancelarEdicionMod(): void {
    this.editandoIndicador.set(null);
  }

  aceptarEdicionMod(): void {
    this.editandoIndicador.set(null);
    this.modSeleccionados.set(new Set());
  }

  abrirForm(): void {
    this.mostrandoForm.set(true);
  }

  cancelarForm(): void {
    this.mostrandoForm.set(false);
  }

  onRegistroGuardado(resumen: IndicadorDetalleResumen): void {
    this.correlativo += 1;
    const id = this.correlativo;
    const codigo = resumen.codigo || String(this.correlativo).padStart(4, '0');
    this.registros.update((r) => [...r, { ...resumen, codigo, id }]);
    this.mostrandoForm.set(false);
    // El aviso aparece con un breve retraso una vez que ya se ve la tabla, y se oculta solo.
    setTimeout(() => this.snackbarVisible.set(true), 800);
    setTimeout(() => this.snackbarVisible.set(false), 800 + 5000);
  }

  alternarUno(id: number, marcado: boolean): void {
    this.seleccionados.update((s) => {
      const next = new Set(s);
      if (marcado) next.add(id); else next.delete(id);
      return next;
    });
  }

  alternarTodos(marcado: boolean): void {
    this.seleccionados.set(marcado ? new Set(this.registros().map((r) => r.id)) : new Set());
  }

  /** Vuelve a abrir el formulario de detalle para editar el registro seleccionado. */
  editarSeleccionado(): void {
    this.mostrandoForm.set(true);
  }

  /** Confirma el grabado: el documento pasa a «Elaborado», se registra la trazabilidad y se avisa. */
  confirmarGrabar(): void {
    this.modalGrabar.set(false);
    this.fechaElaboracion.set(new Date().toLocaleString('es-PE'));
    this.estado.set('elaborated');
    setTimeout(() => this.snackbarElaboradoVisible.set(true), 300);
    setTimeout(() => this.snackbarElaboradoVisible.set(false), 300 + 5000);
  }

  /** Vuelve a edición (estado «Nuevo») para modificar el documento elaborado. */
  editar(): void {
    this.estado.set('new');
  }

  /** Confirma «Verificar y enviar»: el documento pasa a «Verificado» y se avisa. */
  confirmarVerificar(): void {
    this.modalVerificar.set(false);
    this.fechaVerificacion.set(new Date().toLocaleString('es-PE'));
    this.estado.set('verified');
    setTimeout(() => this.snackbarVerificadoVisible.set(true), 300);
    setTimeout(() => this.snackbarVerificadoVisible.set(false), 300 + 5000);
  }

  /** Confirma el borrado desde el modal: elimina los registros marcados, lo cierra y avisa. */
  confirmarEliminar(): void {
    const ids = this.seleccionados();
    this.registros.update((r) => r.filter((registro) => !ids.has(registro.id)));
    this.seleccionados.set(new Set());
    this.modalEliminar.set(false);
    // El aviso aparece una vez cerrado el modal y se oculta solo.
    setTimeout(() => this.snackbarEliminadoVisible.set(true), 300);
    setTimeout(() => this.snackbarEliminadoVisible.set(false), 300 + 5000);
  }
}
