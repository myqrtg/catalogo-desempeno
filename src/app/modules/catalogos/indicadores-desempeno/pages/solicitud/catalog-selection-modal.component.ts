import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';

import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { FocoDirective } from '../../../../../shared/ui/foco/foco.directive';

export interface CatalogColumn {
  key: string;
  label: string;
  widthClass?: string;
}

export interface CatalogRow {
  id: string;
  [key: string]: string;
}

/**
 * Modal centrado para seleccionar un registro de un catálogo (radio único), con buscador, tabla, paginación y
 * Cancelar/Aceptar. Es la variante «diálogo» del diseño (frente al panel lateral `siaf-selection-side-nav`).
 */
@Component({
  selector: 'siaf-catalog-selection-modal',
  standalone: true,
  imports: [NgClass, ButtonComponent, TextFieldComponent, FocoDirective],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-[color:rgba(0,0,0,0.5)] p-siaf-md" (click)="cerrar()">
        <div
          class="flex max-h-[calc(100vh-48px)] w-full max-w-[1140px] flex-col rounded-siaf-md bg-surface shadow-siaf-lg"
          role="dialog"
          aria-modal="true"
          [attr.aria-label]="title"
          siafFoco
          (siafFocoEscape)="cerrar()"
          (click)="$event.stopPropagation()"
        >
          <header class="flex items-center justify-between gap-siaf-md px-siaf-lg pb-siaf-md pt-siaf-lg">
            <h2 class="m-0 text-base font-bold uppercase tracking-[0.02px] text-text">{{ title }}</h2>
            <siaf-button variant="text" size="md" icon="close" [iconOnly]="true" ariaLabel="Cerrar" (click)="cerrar()" />
          </header>

          <div class="flex items-center gap-siaf-md px-siaf-lg">
            <siaf-input class="block w-full" label="Buscar" trailingIcon="search" [value]="busqueda()" (valueChange)="onBuscar($any($event))" />
            <siaf-button variant="secondary" size="md" icon="filter_list" [iconOnly]="true" ariaLabel="Filtros" />
          </div>

          <div class="min-h-0 flex-1 overflow-auto px-siaf-lg pt-siaf-md">
            <table class="w-full border-collapse text-sm">
              <thead>
                <tr class="bg-[var(--sys-color-bg-surfaces-surface-low)] text-[11px] font-bold uppercase tracking-[0.5px] text-text-muted">
                  <th class="w-12 px-siaf-md py-siaf-sm"></th>
                  @for (col of columns; track col.key) {
                    <th class="px-siaf-md py-siaf-sm text-left" [ngClass]="col.widthClass">{{ col.label }}</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (fila of filasPagina(); track fila.id) {
                  <tr
                    class="cursor-pointer border-b border-[var(--sys-color-divider-default)] transition hover:bg-[var(--sys-color-bg-states-light-hover)]"
                    [class.bg-[var(--sys-color-bg-states-light-selected)]]="seleccion() === fila.id"
                    (click)="seleccion.set(fila.id)"
                  >
                    <td class="px-siaf-md py-siaf-sm">
                      <input type="radio" name="catalog-selection" [checked]="seleccion() === fila.id" (change)="seleccion.set(fila.id)" [attr.aria-label]="'Seleccionar ' + fila[columns[0].key]" />
                    </td>
                    @for (col of columns; track col.key) {
                      <td class="px-siaf-md py-siaf-sm text-text" [ngClass]="col.widthClass">{{ fila[col.key] }}</td>
                    }
                  </tr>
                } @empty {
                  <tr><td [attr.colspan]="columns.length + 1" class="px-siaf-md py-siaf-lg text-center text-[var(--sys-color-text-neutral-medium)]">No se encontraron resultados.</td></tr>
                }
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-end gap-siaf-lg px-siaf-lg py-siaf-md text-sm text-[var(--sys-color-text-neutral-medium)]">
            <span>{{ rangoTexto() }}</span>
            <div class="flex items-center gap-siaf-xs">
              <siaf-button variant="text" size="sm" icon="chevron_left" [iconOnly]="true" ariaLabel="Página anterior" [disabled]="pagina() === 1" (click)="anterior()" />
              <siaf-button variant="text" size="sm" icon="chevron_right" [iconOnly]="true" ariaLabel="Página siguiente" [disabled]="pagina() >= totalPaginas()" (click)="siguiente()" />
            </div>
          </div>

          <footer class="flex items-center justify-end gap-siaf-sm border-t border-[var(--sys-color-divider-default)] px-siaf-lg py-siaf-md">
            <siaf-button variant="secondary" size="md" (click)="cerrar()">Cancelar</siaf-button>
            <siaf-button variant="accent" size="md" [disabled]="!seleccion()" (click)="aceptar()">Aceptar</siaf-button>
          </footer>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogSelectionModalComponent {
  @Input() open = false;
  @Input() title = 'Seleccionar';
  @Input() columns: CatalogColumn[] = [];
  @Input() set rows(value: CatalogRow[]) { this._rows.set(value ?? []); }
  @Input() set selectedId(value: string | null) { this.seleccion.set(value ?? ''); }
  @Input() pageSize = 10;

  @Output() closed = new EventEmitter<void>();
  @Output() accepted = new EventEmitter<string>();

  private readonly _rows = signal<CatalogRow[]>([]);
  readonly seleccion = signal('');
  readonly busqueda = signal('');
  readonly pagina = signal(1);

  private readonly filtradas = computed(() => {
    const q = this.normalizar(this.busqueda());
    if (!q) return this._rows();
    return this._rows().filter((fila) => this.columns.some((c) => this.normalizar(String(fila[c.key] ?? '')).includes(q)));
  });

  readonly totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtradas().length / this.pageSize)));

  readonly filasPagina = computed(() => {
    const inicio = (this.pagina() - 1) * this.pageSize;
    return this.filtradas().slice(inicio, inicio + this.pageSize);
  });

  readonly rangoTexto = computed(() => {
    const total = this.filtradas().length;
    if (total === 0) return '0 de 0';
    const inicio = (this.pagina() - 1) * this.pageSize + 1;
    const fin = Math.min(this.pagina() * this.pageSize, total);
    return `${inicio}-${fin} de ${total}`;
  });

  onBuscar(valor: string): void {
    this.busqueda.set(valor);
    this.pagina.set(1);
  }

  anterior(): void { if (this.pagina() > 1) this.pagina.update((p) => p - 1); }
  siguiente(): void { if (this.pagina() < this.totalPaginas()) this.pagina.update((p) => p + 1); }

  cerrar(): void {
    this.closed.emit();
  }

  aceptar(): void {
    if (this.seleccion()) this.accepted.emit(this.seleccion());
  }

  private normalizar(v: string): string {
    return v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
