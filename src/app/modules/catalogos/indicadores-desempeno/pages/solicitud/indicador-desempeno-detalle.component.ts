import { ChangeDetectionStrategy, Component, EventEmitter, Output, signal } from '@angular/core';

import { SelectionColumn, SelectionSideNavComponent } from '../../../../../shared/components/selection-side-nav/selection-side-nav.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DateTimePickerComponent } from '../../../../../shared/ui/date-time-picker/date-time-picker.component';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';
import { TextAreaControlComponent } from '../../../../../shared/ui/text-area-control/text-area-control.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { UploadSideNavComponent } from '../../../../../shared/ui/upload-side-nav/upload-side-nav.component';
import { UploadedFileCardComponent, UploadedFileInfo } from '../../../../../shared/ui/uploaded-file-card/uploaded-file-card.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';

/** Resumen que se agrega a la lista de registros de la solicitud al aceptar. */
export interface IndicadorDetalleResumen {
  codigo: string;
  nombre: string;
  programa: string;
}

interface OpcionCatalogo {
  id: string;
  codigo: string;
  nombre: string;
}

const OPCIONES_PROGRAMA: OpcionCatalogo[] = [
  { id: '0001', codigo: '0001', nombre: 'Programa Articulado Nutricional' },
  { id: '0002', codigo: '0002', nombre: 'Logros de Aprendizaje de Estudiantes de Educación Básica Regular' },
  { id: '0090', codigo: '0090', nombre: 'Logros de Aprendizaje' },
  { id: '0104', codigo: '0104', nombre: 'Reducción de la Mortalidad por Emergencias y Urgencias Médicas' },
];

interface FilaDesagregacion { ambito: string; area: string; periodicidad: string; }
interface FilaVariable { variable: string; descripcion: string; fuente: string; tipoVariable: string; }
interface FilaValidacion { elemento: string; descripcion: string; }

/**
 * Formulario «Registro de indicador de desempeño» (DETALLE) que reemplaza el estado vacío de la tarjeta al pulsar «+».
 *
 * Cubre toda la maqueta del diseño: selección de programa/entidad (paneles), datos del indicador, cobertura, tablas
 * dinámicas (desagregación, diccionario, validaciones), archivos y vigencia. Las opciones de los selects y los paneles
 * de selección usan datos de ejemplo del taller. La validación de «Aceptar» es básica (código y nombre).
 */
@Component({
  selector: 'siaf-indicador-desempeno-detalle',
  standalone: true,
  imports: [
    ButtonComponent,
    RadioComponent,
    TextFieldComponent,
    TextAreaControlComponent,
    DateTimePickerComponent,
    UploadSideNavComponent,
    UploadedFileCardComponent,
    SelectionSideNavComponent,
    TooltipDirective,
  ],
  templateUrl: './indicador-desempeno-detalle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoDetalleComponent {
  @Output() canceled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IndicadorDetalleResumen>();

  // ── Selección de programa y entidad ───────────────────────────────
  readonly programa = signal<OpcionCatalogo | null>(null);
  // La entidad responsable no se selecciona a mano (el diseño no expone búsqueda); se muestra su estado vacío.
  readonly entidad = signal<OpcionCatalogo | null>(null);
  readonly panelPrograma = signal(false);
  // Selección temporal del panel (controlada): el side-nav no guarda estado propio.
  readonly programaSelIds = signal<string[]>([]);
  readonly opcionesPrograma = OPCIONES_PROGRAMA;
  readonly columnasCatalogo: SelectionColumn<OpcionCatalogo>[] = [
    { key: 'codigo', label: 'Código', widthClass: 'w-[120px]' },
    { key: 'nombre', label: 'Nombre' },
  ];

  // ── Datos del indicador ───────────────────────────────────────────
  readonly codigo = signal('');
  readonly nombre = signal('');
  readonly nivelMedicion = signal('');
  readonly dimension = signal('');
  readonly unidadMedida = signal('');
  readonly sentido = signal('');
  readonly tipoCalculo = signal('');
  readonly numerador = signal('');
  readonly denominador = signal('');
  readonly tipoFuente = signal('');
  readonly fuenteDatos = signal('');
  readonly limitacion = signal('');
  readonly supuestos = signal('');
  readonly precisiones = signal('');
  readonly periodicidad = signal('');

  // ── Cobertura de medición ─────────────────────────────────────────
  readonly alcanceGeografico = signal('');
  readonly nivelResponsable = signal('');

  // ── Tablas dinámicas ──────────────────────────────────────────────
  readonly desagregaciones = signal<FilaDesagregacion[]>([{ ambito: '', area: '', periodicidad: '' }]);
  readonly variables = signal<FilaVariable[]>([{ variable: '', descripcion: '', fuente: '', tipoVariable: '' }]);
  readonly validaciones = signal<FilaValidacion[]>([{ elemento: '', descripcion: '' }]);

  // ── Archivos ──────────────────────────────────────────────────────
  readonly codigoComentado = signal<UploadedFileInfo | null>(null);
  readonly sustento = signal<UploadedFileInfo | null>(null);
  readonly panelCodigoComentado = signal(false);
  readonly panelSustento = signal(false);

  // ── Vigencia en procesos ──────────────────────────────────────────
  readonly programacion = signal('');
  readonly gestion = signal('');
  readonly evaluacion = signal('');

  // ── Vigencia ──────────────────────────────────────────────────────
  readonly estadoVigencia = signal('');

  // ── Opciones de selects y radios ──────────────────────────────────
  readonly opcNivelMedicion = [
    { label: '1. Resultado específico', value: '1. Resultado específico' },
    { label: '2. Producto', value: '2. Producto' },
  ];
  readonly opcSentido = [
    { label: 'Subir', value: 'Subir' },
    { label: 'Bajar', value: 'Bajar' },
  ];
  readonly opcTipoCalculo = [
    { label: 'Numerador/denominador*100', value: 'numerador' },
    { label: 'Otro tipo de cálculo', value: 'otro' },
  ];
  readonly opcAlcance = [
    { label: 'Nacional', value: 'Nacional' },
    { label: 'Nacional y regional', value: 'Nacional y regional' },
  ];
  readonly opcSiNo = [
    { label: 'Sí', value: 'SI' },
    { label: 'No', value: 'NO' },
  ];
  readonly opcDimension = ['Eficacia', 'Eficiencia', 'Calidad', 'Economía'].map((v) => ({ value: v, label: v }));
  readonly opcUnidad = ['Porcentaje', 'Número', 'Tasa', 'Ratio', 'Índice'].map((v) => ({ value: v, label: v }));
  readonly opcTipoFuente = ['Registro administrativo', 'Encuesta', 'Censo', 'Estudio especializado'].map((v) => ({ value: v, label: v }));
  readonly opcPeriodicidad = ['Anual', 'Semestral', 'Trimestral', 'Mensual'].map((v) => ({ value: v, label: v }));
  readonly opcNivelResponsable = ['Nacional', 'Regional', 'Local'].map((v) => ({ value: v, label: v }));
  readonly opcAmbito = ['Nacional', 'Departamental', 'Provincial', 'Distrital'].map((v) => ({ value: v, label: v }));
  readonly opcArea = ['Costa', 'Sierra', 'Selva'].map((v) => ({ value: v, label: v }));

  // ── Aceptar ───────────────────────────────────────────────────────
  aceptarHabilitado(): boolean {
    return !!this.codigo().trim() && !!this.nombre().trim();
  }

  aceptar(): void {
    if (!this.aceptarHabilitado()) return;
    this.saved.emit({ codigo: this.codigo().trim(), nombre: this.nombre().trim(), programa: this.programa()?.nombre ?? '' });
  }

  // ── Selección de programa/entidad ─────────────────────────────────
  abrirPanelPrograma(): void {
    this.programaSelIds.set(this.programa() ? [this.programa()!.id] : []);
    this.panelPrograma.set(true);
  }

  onProgramaAceptado(ids: string[]): void {
    this.programa.set(this.opcionesPrograma.find((o) => o.id === ids[0]) ?? null);
    this.panelPrograma.set(false);
  }

  etiquetaSeleccion(opcion: OpcionCatalogo | null): string {
    return opcion ? `${opcion.codigo} - ${opcion.nombre}` : '';
  }

  // ── Tablas dinámicas ──────────────────────────────────────────────
  agregarDesagregacion(): void {
    this.desagregaciones.update((f) => [...f, { ambito: '', area: '', periodicidad: '' }]);
  }
  actualizarDesagregacion(i: number, campo: keyof FilaDesagregacion, valor: string): void {
    this.desagregaciones.update((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)));
  }

  agregarVariable(): void {
    this.variables.update((f) => [...f, { variable: '', descripcion: '', fuente: '', tipoVariable: '' }]);
  }
  actualizarVariable(i: number, campo: keyof FilaVariable, valor: string): void {
    this.variables.update((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)));
  }

  agregarValidacion(): void {
    this.validaciones.update((f) => [...f, { elemento: '', descripcion: '' }]);
  }
  actualizarValidacion(i: number, campo: keyof FilaValidacion, valor: string): void {
    this.validaciones.update((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)));
  }

  // ── Archivos ──────────────────────────────────────────────────────
  onCodigoComentadoConfirmado(archivo: File): void {
    this.codigoComentado.set(archivo);
    this.panelCodigoComentado.set(false);
  }
  onSustentoConfirmado(archivo: File): void {
    this.sustento.set(archivo);
    this.panelSustento.set(false);
  }
}
