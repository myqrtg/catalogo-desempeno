import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
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
              <input type="checkbox" class="size-5 shrink-0" [checked]="todosSeleccionados()" (change)="alternarTodos($any($event.target).checked)" aria-label="Seleccionar todos los registros" />

              <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
                <div class="grid min-w-[760px] grid-cols-[48px_160px_1fr_200px_220px] items-center bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  <span></span>
                  <span>Código indicador</span>
                  <span>Nombre indicador</span>
                  <span class="text-center">Nivel de medición</span>
                  <span class="text-center">Dimensión de desempeño</span>
                </div>
                @for (registro of registros(); track registro.id) {
                  <div class="grid min-w-[760px] grid-cols-[48px_160px_1fr_200px_220px] items-center border-t border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-sm">
                    <input type="checkbox" class="size-5 shrink-0" [checked]="seleccionados().has(registro.id)" (change)="alternarUno(registro.id, $any($event.target).checked)" [attr.aria-label]="'Seleccionar ' + registro.nombre" />
                    <span class="font-bold text-text">{{ registro.codigo }}</span>
                    <span class="text-text">{{ registro.nombre }}</span>
                    <span class="text-center text-[var(--sys-color-text-neutral-medium)]">{{ registro.nivelMedicion }}</span>
                    <span class="text-center text-[var(--sys-color-text-neutral-medium)]">{{ registro.dimension }}</span>
                  </div>
                }
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
