import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SolicitudeFormCardComponent } from '../../../../../shared/components/solicitude-form-card/solicitude-form-card.component';
import { SolicitudeInfoCardComponent, SolicitudeInfoField } from '../../../../../shared/components/solicitude-info-card/solicitude-info-card.component';
import { SolicitudePageLayoutComponent } from '../../../../../shared/components/solicitude-page-layout/solicitude-page-layout.component';
import { BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { NOMBRE_DOCUMENTO, ORGANO_RECTOR, PROCESS_LABEL, PROCESS_ROUTE } from '../../config/indicadores-desempeno.rutas';

/**
 * Solicitud de indicadores de desempeño (estado «Nuevo»): la pantalla que abre «Crear documento» al aceptar.
 *
 * Muestra la cabecera del flujo (Cancelar, Grabar, Verificar y enviar), la tarjeta con la fecha y el órgano rector, y
 * la tarjeta «Registro de indicador de desempeño» con su botón «+». El alta del indicador (botón «+»), «Grabar» y el
 * resto del flujo quedan pendientes de su diseño.
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
        [saveDisabled]="true"
        [verifyDisabled]="true"
        (returned)="regresar()"
        (canceled)="regresar()"
      >
        <siaf-solicitude-info-card [fields]="camposCabecera" [captureOpenDate]="true" />

        <siaf-solicitude-form-card title="Registro de indicador de desempeño">
          <siaf-button
            card-actions
            variant="accent"
            size="md"
            icon="add"
            [iconOnly]="true"
            ariaLabel="Añadir"
            siafTooltip="Añadir"
            (click)="anadirRegistro()"
          />

          <div class="flex min-h-[49px] items-center rounded-siaf-md bg-[var(--sys-color-bg-surfaces-surface-low)] px-siaf-md py-siaf-sm">
            <p class="m-0 text-sm text-[var(--sys-color-text-neutral-medium)]">
              Por favor, haga clic en el botón (+) para añadir el registro.
            </p>
          </div>
        </siaf-solicitude-form-card>
      </siaf-solicitude-page-layout>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoRequestComponent {
  private readonly router = inject(Router);

  readonly heading = NOMBRE_DOCUMENTO;

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

  regresar(): void {
    void this.router.navigate(['/panel']);
  }

  anadirRegistro(): void {
    // Pendiente: el alta de un indicador (modal/formulario) requiere su diseño en Figma.
  }
}
