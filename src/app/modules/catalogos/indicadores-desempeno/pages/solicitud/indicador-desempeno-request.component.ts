import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { SnackbarComponent } from '../../../../../shared/ui/snackbar/snackbar.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { NOMBRE_DOCUMENTO, ORGANO_RECTOR, PROCESS_LABEL, PROCESS_ROUTE } from '../../config/indicadores-desempeno.rutas';
import { IndicadorDesempenoDetalleComponent, IndicadorDetalleResumen } from './indicador-desempeno-detalle.component';

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
    ButtonComponent,
    SnackbarComponent,
    TooltipDirective,
    IndicadorDesempenoDetalleComponent,
  ],
  template: `
    <div class="min-h-[calc(100vh-56px)] bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <siaf-solicitude-page-layout
        [breadcrumbs]="breadcrumbs"
        role="creator"
        state="new"
        [heading]="heading"
        secondaryText="Creación"
        verifyLabel="Verificar y enviar"
        [showReturn]="true"
        [saveDisabled]="mostrandoForm() || registros().length === 0"
        [verifyDisabled]="true"
        (returned)="regresar()"
        (canceled)="regresar()"
      >
        <siaf-solicitude-info-card [fields]="camposCabecera" [captureOpenDate]="true" />

        <siaf-solicitude-form-card title="Registro de indicador de desempeño">
          <div card-actions class="flex items-center gap-siaf-sm">
            @if (mostrandoForm()) {
              <siaf-button variant="secondary" size="md" (click)="cancelarForm()">Cancelar</siaf-button>
              <siaf-button variant="accent" size="md" [disabled]="!detalle()?.aceptarHabilitado()" (click)="detalle()?.aceptar()">Aceptar</siaf-button>
            } @else {
              <siaf-button variant="accent" size="md" icon="add" [iconOnly]="true" ariaLabel="Añadir" siafTooltip="Añadir" (click)="abrirForm()" />
            }
          </div>

          @if (mostrandoForm()) {
            <siaf-indicador-desempeno-detalle (saved)="onRegistroGuardado($event)" (canceled)="cancelarForm()" />
          } @else if (registros().length) {
            <div class="flex flex-col gap-siaf-md">
              <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
                <table class="w-full min-w-[2320px] border-collapse text-sm">
                  <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                    <tr>
                      <th class="w-12 border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm" rowspan="2">
                        <input type="checkbox" class="size-5" [checked]="todosSeleccionados()" (change)="alternarTodos($any($event.target).checked)" aria-label="Seleccionar todos los registros" />
                      </th>
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
                        <td class="px-siaf-md py-siaf-sm font-bold">{{ registro.codigo }}</td>
                        <td class="px-siaf-md py-siaf-sm">{{ registro.nombre }}</td>
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
      </siaf-solicitude-page-layout>

      <!-- Aviso de registro exitoso (aparece con un breve retraso tras aceptar). -->
      <div class="fixed bottom-6 right-6 z-[60]">
        <siaf-snackbar [open]="snackbarVisible()" variant="record-done" (closed)="snackbarVisible.set(false)" />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoRequestComponent {
  private readonly router = inject(Router);

  readonly heading = NOMBRE_DOCUMENTO;
  readonly detalle = viewChild(IndicadorDesempenoDetalleComponent);

  readonly mostrandoForm = signal(false);
  readonly registros = signal<IndicadorRegistrado[]>([]);
  readonly seleccionados = signal<Set<number>>(new Set());
  readonly snackbarVisible = signal(false);
  private correlativo = 23; // el primer registro queda como 0024, según el diseño

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
}
