import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { BreadcrumbComponent, BreadcrumbItem } from '../../../../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { IconComponent } from '../../../../../shared/ui/icon/icon.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { PROCESS_LABEL, PROCESS_ROUTE } from '../../config/indicadores-desempeno.rutas';
import { IndicadorDetalleResumen } from './indicador-desempeno-detalle.component';

/**
 * Pantalla «Detalle de indicador de desempeño»: muestra, de solo lectura, todos los datos de un indicador ya
 * registrado (los que se capturaron en el formulario DETALLE). Se abre al hacer clic en una fila de la tabla de
 * registros de la solicitud y vuelve con la flecha superior. El fondo de la página es gris y el contenido se agrupa
 * en tarjetas blancas, como el resto de las pantallas del SIAF.
 */
@Component({
  selector: 'siaf-indicador-desempeno-detalle-vista',
  standalone: true,
  imports: [BreadcrumbComponent, ButtonComponent, IconComponent, TooltipDirective],
  template: `
    <div class="min-h-[calc(100vh-56px)] bg-[var(--sys-color-bg-surfaces-surface-lowest)] text-text">
      <!-- Barra superior blanca: migas + flecha de volver + título -->
      <div class="bg-surface">
        <div class="mx-auto flex max-w-[1200px] flex-col gap-siaf-sm px-siaf-lg py-siaf-md">
          <siaf-breadcrumb [items]="breadcrumbs" homeHref="/panel" />
          <div class="flex items-center gap-siaf-sm">
            <siaf-button variant="text" size="md" icon="arrow_back" [iconOnly]="true" ariaLabel="Volver" (click)="back.emit()" />
            <h1 class="m-0 text-base font-bold uppercase tracking-[0.5px] text-text">Detalle de indicador de desempeño</h1>
          </div>
        </div>
      </div>

      <div class="mx-auto flex max-w-[1200px] flex-col gap-siaf-md px-siaf-lg py-siaf-md">

        <!-- Programa presupuestal -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold text-text">Programa presupuestal</h2>
          <div class="grid gap-siaf-md rounded-siaf-md border border-[var(--sys-color-divider-default)] px-siaf-lg py-siaf-md md:grid-cols-[200px_1fr]">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Código programa</span>
              <strong class="text-sm font-bold text-text">{{ v(indicador.programaCodigo) }}</strong>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Nombre programa</span>
              <strong class="text-sm font-bold text-text">{{ v(indicador.programaNombre) }}</strong>
            </div>
          </div>
        </section>

        <!-- Entidad responsable del programa presupuestal -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold text-text">Entidad responsable del programa presupuestal</h2>
          <div class="grid gap-siaf-md rounded-siaf-md border border-[var(--sys-color-divider-default)] px-siaf-lg py-siaf-md md:grid-cols-[200px_1fr]">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Código responsable</span>
              <strong class="text-sm font-bold text-text">{{ v(indicador.respCodigo) }}</strong>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Nombre responsable</span>
              <strong class="text-sm font-bold text-text">{{ v(indicador.respNombre) }}</strong>
            </div>
          </div>
        </section>

        <!-- Datos del indicador de desempeño -->
        <section class="flex flex-col gap-siaf-md rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Datos del indicador de desempeño</h2>

          <div class="flex flex-col gap-siaf-sm">
            <h3 class="m-0 text-sm font-bold text-text">Indicador de desempeño</h3>
            <div class="grid gap-siaf-md md:grid-cols-2">
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Código</span>
                <span class="text-sm text-text">{{ v(indicador.codigo) }}</span>
              </div>
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Nombre</span>
                <span class="text-sm text-text">{{ v(indicador.nombre) }}</span>
              </div>
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Ámbito de control</span>
                <span class="text-sm text-text">{{ v(indicador.nivelMedicion) }}</span>
              </div>
            </div>
          </div>

          @if (indicador.productoCodigo || indicador.productoNombre) {
            <div class="flex flex-col gap-siaf-xs">
              <h3 class="m-0 text-sm font-bold text-text">Producto</h3>
              <div class="grid gap-siaf-md rounded-siaf-md border border-[var(--sys-color-divider-default)] px-siaf-lg py-siaf-md md:grid-cols-[200px_1fr]">
                <div class="flex flex-col gap-siaf-xxs">
                  <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Código producto</span>
                  <strong class="text-sm font-bold text-text">{{ v(indicador.productoCodigo) }}</strong>
                </div>
                <div class="flex flex-col gap-siaf-xxs">
                  <span class="text-[11px] font-medium uppercase tracking-[0.5px] text-text-muted">Nombre producto</span>
                  <strong class="text-sm font-bold text-text">{{ v(indicador.productoNombre) }}</strong>
                </div>
              </div>
            </div>
          }

          <div class="grid gap-siaf-md md:grid-cols-3">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Dimensión del desempeño</span>
              <span class="text-sm text-text">{{ v(indicador.dimension) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Unidad de medida</span>
              <span class="text-sm text-text">{{ v(indicador.unidadMedida) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Sentido del indicador</span>
              <span class="text-sm text-text">{{ v(indicador.sentido) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-siaf-sm">
            <h3 class="m-0 text-sm font-bold text-text">Método de cálculo</h3>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Tipo de cálculo</span>
              <span class="text-sm text-text">{{ v(indicador.tipoCalculo) }}</span>
            </div>
            @if (indicador.formula) {
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Otro tipo de cálculo</span>
                <span class="whitespace-pre-line text-sm text-text">{{ v(indicador.formula) }}</span>
              </div>
            } @else {
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Numerador</span>
                <span class="text-sm text-text">{{ v(indicador.numerador) }}</span>
              </div>
              <div class="flex flex-col gap-siaf-xxs">
                <span class="text-xs text-text-muted">Denominador</span>
                <span class="text-sm text-text">{{ v(indicador.denominador) }}</span>
              </div>
            }
          </div>

          <div class="flex flex-col gap-siaf-sm">
            <h3 class="m-0 text-sm font-bold text-text">Fuentes de información</h3>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Tipo de fuente de datos</span>
              <span class="text-sm text-text">{{ v(indicador.tipoFuente) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Fuente de datos</span>
              <span class="text-sm text-text">{{ v(indicador.fuenteDatos) }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-siaf-sm">
            <h3 class="m-0 text-sm font-bold text-text">Consideraciones técnicas</h3>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Limitación</span>
              <span class="whitespace-pre-line text-sm text-text">{{ v(indicador.limitacion) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Supuestos</span>
              <span class="whitespace-pre-line text-sm text-text">{{ v(indicador.supuestos) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Precisiones técnicas</span>
              <span class="whitespace-pre-line text-sm text-text">{{ v(indicador.precisiones) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Periodicidad</span>
              <span class="text-sm text-text">{{ v(indicador.periodicidad) }}</span>
            </div>
          </div>
        </section>

        <!-- Cobertura de medición -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Cobertura de medición</h2>
          <div class="grid gap-siaf-md md:grid-cols-2">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Alcance geográfico</span>
              <span class="text-sm text-text">{{ v(indicador.alcanceGeografico) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Nivel responsable del registro</span>
              <span class="text-sm text-text">{{ v(indicador.nivelResponsable) }}</span>
            </div>
          </div>
        </section>

        <!-- Desagregación geográfica de la medición -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Desagregación geográfica de la medición</h2>
          <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
            <table class="w-full min-w-[640px] border-collapse bg-surface text-sm">
              <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                <tr>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Ámbito geográfico</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Área geográfica</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Periodicidad</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of indicador.desagregaciones; track $index) {
                  <tr class="border-b border-[var(--sys-color-divider-default)]">
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.ambito) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.area) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.periodicidad) }}</td>
                  </tr>
                } @empty {
                  <tr><td class="px-siaf-md py-siaf-sm text-text-muted" colspan="3">Sin registros.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Diccionario de datos del indicador -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Diccionario de datos del indicador</h2>
          <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
            <table class="w-full min-w-[720px] border-collapse bg-surface text-sm">
              <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                <tr>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Variable</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Descripción</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Fuente</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Tipo variable</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of indicador.variables; track $index) {
                  <tr class="border-b border-[var(--sys-color-divider-default)]">
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.variable) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.descripcion) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.fuente) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.tipoVariable) }}</td>
                  </tr>
                } @empty {
                  <tr><td class="px-siaf-md py-siaf-sm text-text-muted" colspan="4">Sin registros.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Validaciones -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Validaciones</h2>
          <div class="overflow-x-auto rounded-siaf-md border border-[var(--sys-color-divider-default)]">
            <table class="w-full min-w-[560px] border-collapse bg-surface text-sm">
              <thead class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                <tr>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Elemento</th>
                  <th class="border-b border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                @for (fila of indicador.validaciones; track $index) {
                  <tr class="border-b border-[var(--sys-color-divider-default)]">
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.elemento) }}</td>
                    <td class="px-siaf-md py-siaf-sm">{{ v(fila.descripcion) }}</td>
                  </tr>
                } @empty {
                  <tr><td class="px-siaf-md py-siaf-sm text-text-muted" colspan="2">Sin registros.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <!-- Código comentado -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Código comentado</h2>
          @if (indicador.codigoComentado; as archivo) {
            <div class="flex items-center gap-siaf-md rounded-siaf-md border border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm">
              <siaf-icon name="description" [size]="24" />
              <div class="min-w-0 flex-1">
                <p class="m-0 truncate text-sm text-text">{{ archivo.nombre }}</p>
                <p class="m-0 text-xs text-text-muted">{{ archivo.tamano }}</p>
              </div>
              <siaf-button variant="text" size="md" icon="download" [iconOnly]="true" ariaLabel="Descargar" siafTooltip="Descargar" />
            </div>
          } @else {
            <p class="m-0 text-sm text-text-muted">No se adjuntó archivo.</p>
          }
        </section>

        <!-- Vigencia en procesos -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Vigencia en procesos</h2>
          <div class="grid gap-siaf-md md:grid-cols-3">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Programación (P)</span>
              <span class="text-sm text-text">{{ v(indicador.programacion) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Gestión (G)</span>
              <span class="text-sm text-text">{{ v(indicador.gestion) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Evaluación (E)</span>
              <span class="text-sm text-text">{{ v(indicador.evaluacion) }}</span>
            </div>
          </div>
        </section>

        <!-- Medición -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Medición</h2>
          <div class="grid gap-siaf-md md:grid-cols-2">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Año de inicio de medición</span>
              <span class="text-sm text-text">{{ v(indicador.anioInicio) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Año de fin de medición</span>
              <span class="text-sm text-text">{{ v(indicador.anioFin) }}</span>
            </div>
          </div>
        </section>

        <!-- Vigencia -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Vigencia</h2>
          <div class="grid gap-siaf-md md:grid-cols-3">
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Estado</span>
              <span class="text-sm text-text">{{ v(indicador.estado) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Fecha desde</span>
              <span class="text-sm text-text">{{ v(indicador.fechaDesde) }}</span>
            </div>
            <div class="flex flex-col gap-siaf-xxs">
              <span class="text-xs text-text-muted">Fecha hasta</span>
              <span class="text-sm text-text">{{ v(indicador.fechaHasta) }}</span>
            </div>
          </div>
        </section>

        <!-- Documento de sustento de solicitud -->
        <section class="flex flex-col gap-siaf-sm rounded-siaf-md bg-surface p-siaf-lg">
          <h2 class="m-0 text-sm font-bold uppercase tracking-[0.5px] text-text">Documento de sustento de solicitud</h2>
          @if (indicador.sustento; as archivo) {
            <div class="flex items-center gap-siaf-md rounded-siaf-md border border-[var(--sys-color-divider-default)] px-siaf-md py-siaf-sm">
              <siaf-icon name="description" [size]="24" />
              <div class="min-w-0 flex-1">
                <p class="m-0 truncate text-sm text-text">{{ archivo.nombre }}</p>
                <p class="m-0 text-xs text-text-muted">{{ archivo.tamano }}</p>
              </div>
              <siaf-button variant="text" size="md" icon="download" [iconOnly]="true" ariaLabel="Descargar" siafTooltip="Descargar" />
            </div>
          } @else {
            <p class="m-0 text-sm text-text-muted">No se adjuntó archivo.</p>
          }
        </section>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoDetalleVistaComponent {
  @Input({ required: true }) indicador!: IndicadorDetalleResumen;
  @Output() back = new EventEmitter<void>();

  // Migas como el resto del proceso: Inicio › Catálogo de indicadores de desempeño › Registro.
  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Inicio', href: '/panel' },
    { label: PROCESS_LABEL, href: PROCESS_ROUTE },
    { label: 'Registro' },
  ];

  /** Muestra el valor o un guion cuando está vacío. */
  v(valor: string): string {
    return valor?.trim() ? valor : '--';
  }
}
