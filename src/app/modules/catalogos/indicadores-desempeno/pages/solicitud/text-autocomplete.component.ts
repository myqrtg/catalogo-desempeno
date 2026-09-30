import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, Output, computed, inject, signal } from '@angular/core';

import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';

/**
 * Campo de texto con autocompletado: el usuario escribe libremente y, mientras escribe, se muestra una lista de
 * sugerencias que coinciden; al elegir una, se completa el campo. Permite texto que no esté en la lista.
 */
@Component({
  selector: 'siaf-text-autocomplete',
  standalone: true,
  imports: [TextFieldComponent],
  template: `
    <div class="relative">
      <siaf-input
        [label]="label"
        [placeholder]="placeholder"
        [required]="required"
        [value]="value"
        autocomplete="off"
        (valueChange)="onInput($any($event))"
      />

      @if (abierto() && coincidencias().length) {
        <div
          class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-72 overflow-y-auto rounded-siaf-md bg-[var(--sys-color-bg-surfaces-field,var(--sys-color-bg-surfaces-surface))] py-siaf-xs shadow-siaf-elevation-1"
          role="listbox"
          [attr.aria-label]="label"
        >
          @for (sugerencia of coincidencias(); track sugerencia) {
            <button
              class="flex min-h-10 w-full items-center px-siaf-md py-siaf-xs text-left text-sm text-[var(--sys-color-text-neutral-medium)] transition hover:bg-[var(--sys-color-bg-states-light-hover)] focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sys-color-border-states-focus)]"
              type="button"
              role="option"
              (mousedown)="$event.preventDefault()"
              (click)="elegir(sugerencia)"
            >
              <span class="min-w-0 flex-1 truncate">{{ sugerencia }}</span>
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextAutocompleteComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() label = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() value = '';
  @Input() set suggestions(value: string[]) { this._suggestions.set(value ?? []); }
  /** Máximo de sugerencias visibles. */
  @Input() max = 8;

  @Output() valueChange = new EventEmitter<string>();
  /** Se emite solo cuando el usuario elige una sugerencia (no al escribir texto libre). */
  @Output() selected = new EventEmitter<string>();

  private readonly _suggestions = signal<string[]>([]);
  readonly abierto = signal(false);

  readonly coincidencias = computed(() => {
    const q = this.normalizar(this.value);
    if (!q) return [];
    return this._suggestions()
      .filter((s) => this.normalizar(s).includes(q) && this.normalizar(s) !== q)
      .slice(0, this.max);
  });

  onInput(valor: string): void {
    this.value = valor;
    this.abierto.set(true);
    this.valueChange.emit(valor);
  }

  elegir(sugerencia: string): void {
    this.value = sugerencia;
    this.abierto.set(false);
    this.valueChange.emit(sugerencia);
    this.selected.emit(sugerencia);
  }

  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: Event): void {
    if (!this.abierto()) return;
    const target = event.target;
    if (target instanceof Node && this.host.nativeElement.contains(target)) return;
    this.abierto.set(false);
  }

  private normalizar(v: string): string {
    return (v ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
}
