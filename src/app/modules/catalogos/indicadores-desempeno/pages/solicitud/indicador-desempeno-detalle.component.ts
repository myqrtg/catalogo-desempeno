import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, signal } from '@angular/core';

import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { DateTimePickerComponent } from '../../../../../shared/ui/date-time-picker/date-time-picker.component';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';
import { TextAreaControlComponent } from '../../../../../shared/ui/text-area-control/text-area-control.component';
import { TextFieldComponent } from '../../../../../shared/ui/text-field/text-field.component';
import { UploadSideNavComponent } from '../../../../../shared/ui/upload-side-nav/upload-side-nav.component';
import { UploadedFileCardComponent, UploadedFileInfo } from '../../../../../shared/ui/uploaded-file-card/uploaded-file-card.component';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { CatalogColumn, CatalogRow, CatalogSelectionModalComponent } from './catalog-selection-modal.component';
import { TextAutocompleteComponent } from './text-autocomplete.component';

/** Sugerencias de autocompletado para el nombre del indicador (datos de ejemplo del taller). */
const NOMBRES_INDICADOR: string[] = [
  'Cobertura de parto institucional',
  'Cobertura de parto institucional en gestantes procedentes de zonas rurales',
  'Proporción de menores de 5 años con desnutrición crónica',
  'Proporción de recién nacidos con bajo peso al nacer',
  'Tasa de mortalidad neonatal',
  'Porcentaje de niñas y niños con vacunas completas para su edad',
  'Cobertura de control prenatal con enfoque de riesgo',
];

/** Resumen que se agrega a la lista de registros de la solicitud al aceptar. */
export interface IndicadorDetalleResumen {
  codigo: string;
  nombre: string;
  programa: string;
}

interface ProgramaPresupuestal {
  id: string;
  codigo: string;
  nombre: string;
  /** Entidad responsable del programa (se autocompleta al elegir el programa). */
  respCodigo: string;
  respNombre: string;
}

const OPCIONES_PROGRAMA: ProgramaPresupuestal[] = [
  { id: '0002', codigo: '0002', nombre: 'SALUD MATERNO NEONATAL', respCodigo: '011', respNombre: 'M. DE SALUD' },
  { id: '1002', codigo: '1002', nombre: 'Productos específicos para desarrollo infantil temprano', respCodigo: '040', respNombre: 'M. DE DESARROLLO E INCLUSIÓN SOCIAL' },
  { id: '1003', codigo: '1003', nombre: 'Enfermedades metaxenicas y zoonosis', respCodigo: '011', respNombre: 'M. DE SALUD' },
  { id: '1004', codigo: '1004', nombre: 'Enfermedades no transmisibles', respCodigo: '011', respNombre: 'M. DE SALUD' },
  { id: '1005', codigo: '1005', nombre: 'Prevención y control del cáncer', respCodigo: '011', respNombre: 'M. DE SALUD' },
  { id: '1006', codigo: '1006', nombre: 'Reducción de delitos y faltas que afectan la seguridad ciudadana', respCodigo: '007', respNombre: 'M. DEL INTERIOR' },
  { id: '1007', codigo: '1007', nombre: 'Lucha contra el terrorismo', respCodigo: '026', respNombre: 'M. DE DEFENSA' },
  { id: '1008', codigo: '1008', nombre: 'Gestión integral de residuos sólidos', respCodigo: '005', respNombre: 'M. DEL AMBIENTE' },
  { id: '1009', codigo: '1009', nombre: 'Reducción del tráfico ilícito de drogas', respCodigo: '007', respNombre: 'M. DEL INTERIOR' },
  { id: '0068', codigo: '0068', nombre: 'Reducción de vulnerabilidad y atención de emergencias por desastres', respCodigo: '006', respNombre: 'PRESIDENCIA DEL CONSEJO DE MINISTROS' },
];

interface ProductoPresupuestal { id: string; codigo: string; nombre: string; }

const OPCIONES_PRODUCTO: ProductoPresupuestal[] = [
  { id: '3033255', codigo: '3033255', nombre: 'Atención del parto normal' },
  { id: '3033256', codigo: '3033256', nombre: 'Niños y niñas con atención de la anemia por deficiencia de hierro' },
  { id: '3033257', codigo: '3033257', nombre: 'Niños y niñas con CRED completo según edad' },
  { id: '3033258', codigo: '3033258', nombre: 'Población informada sobre salud sexual, salud reproductiva y métodos de planificación familiar' },
  { id: '3033259', codigo: '3033259', nombre: 'Adolescentes acceden a servicios de salud para prevención del embarazo' },
  { id: '3033260', codigo: '3033260', nombre: 'Adolescentes con atención preventiva de anemia y otras deficiencias nutricionales' },
  { id: '3033261', codigo: '3033261', nombre: 'Atención prenatal reenfocada' },
  { id: '3033262', codigo: '3033262', nombre: 'Población accede a métodos de planificación familiar' },
  { id: '3033263', codigo: '3033263', nombre: 'Gestante con suplemento de hierro y ácido fólico' },
  { id: '3033264', codigo: '3033264', nombre: 'Municipios saludables promueven el cuidado infantil' },
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
    CatalogSelectionModalComponent,
    TextAutocompleteComponent,
    TooltipDirective,
  ],
  templateUrl: './indicador-desempeno-detalle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndicadorDesempenoDetalleComponent {
  @Output() canceled = new EventEmitter<void>();
  @Output() saved = new EventEmitter<IndicadorDetalleResumen>();

  // ── Selección de programa y entidad ───────────────────────────────
  readonly programa = signal<ProgramaPresupuestal | null>(null);
  readonly modalPrograma = signal(false);

  // Filas y columnas del modal de selección.
  readonly filasPrograma: CatalogRow[] = OPCIONES_PROGRAMA.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }));
  readonly columnasPrograma: CatalogColumn[] = [
    { key: 'codigo', label: 'Código programa', widthClass: 'w-[200px]' },
    { key: 'nombre', label: 'Nombre programa' },
  ];

  // Producto (aparece solo cuando el nivel de medición es «2. Producto»).
  readonly producto = signal<ProductoPresupuestal | null>(null);
  readonly modalProducto = signal(false);
  readonly filasProducto: CatalogRow[] = OPCIONES_PRODUCTO.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }));
  readonly columnasProducto: CatalogColumn[] = [
    { key: 'codigo', label: 'Código producto', widthClass: 'w-[200px]' },
    { key: 'nombre', label: 'Nombre producto' },
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
  readonly opcDimension = [
    { value: 'eficacia', label: '1. Eficacia' },
    { value: 'eficiencia', label: '2. Eficiencia' },
    { value: 'calidad', label: '3. Calidad' },
    { value: 'economia', label: '4. Economía' },
  ];

  // Unidades de medida por dimensión (solo «Eficacia» está confirmada por el diseño; el resto son de ejemplo).
  private readonly unidadesPorDimension: Record<string, string[]> = {
    eficacia: ['Porcentaje', 'Tasa', 'Ratio', 'Índice'],
    eficiencia: ['Porcentaje', 'Tasa', 'Ratio'],
    calidad: ['Porcentaje', 'Índice', 'Nivel de satisfacción'],
    economia: ['Soles', 'Porcentaje', 'Ratio'],
  };

  readonly opcUnidad = computed(() =>
    (this.unidadesPorDimension[this.dimension()] ?? []).map((v) => ({ value: v, label: v })),
  );
  readonly opcTipoFuente = ['Registro administrativo', 'Encuesta', 'Censo', 'Estudio especializado'].map((v) => ({ value: v, label: v }));
  readonly opcPeriodicidad = ['Anual', 'Semestral', 'Trimestral', 'Mensual'].map((v) => ({ value: v, label: v }));
  readonly opcNivelResponsable = ['Nacional', 'Regional', 'Local'].map((v) => ({ value: v, label: v }));
  readonly opcAmbito = ['Nacional', 'Departamental', 'Provincial', 'Distrital'].map((v) => ({ value: v, label: v }));
  readonly opcArea = ['Costa', 'Sierra', 'Selva'].map((v) => ({ value: v, label: v }));
  readonly nombresIndicador = NOMBRES_INDICADOR;

  // ── Aceptar ───────────────────────────────────────────────────────
  aceptarHabilitado(): boolean {
    return !!this.codigo().trim() && !!this.nombre().trim();
  }

  aceptar(): void {
    if (!this.aceptarHabilitado()) return;
    this.saved.emit({ codigo: this.codigo().trim(), nombre: this.nombre().trim(), programa: this.programa()?.nombre ?? '' });
  }

  // ── Selección de programa (modal) ─────────────────────────────────
  abrirModalPrograma(): void {
    this.modalPrograma.set(true);
  }

  onProgramaAceptado(id: string): void {
    this.programa.set(OPCIONES_PROGRAMA.find((o) => o.id === id) ?? null);
    this.modalPrograma.set(false);
  }

  /** Limpiar el programa también limpia la entidad responsable (derivada). */
  limpiarPrograma(): void {
    this.programa.set(null);
  }

  // ── Selección de producto (modal) ─────────────────────────────────
  abrirModalProducto(): void {
    this.modalProducto.set(true);
  }

  onProductoAceptado(id: string): void {
    this.producto.set(OPCIONES_PRODUCTO.find((o) => o.id === id) ?? null);
    this.modalProducto.set(false);
  }

  limpiarProducto(): void {
    this.producto.set(null);
  }

  /** Cambiar la dimensión reinicia la unidad de medida (sus opciones dependen de la dimensión). */
  onDimensionChange(valor: string): void {
    this.dimension.set(valor);
    this.unidadMedida.set('');
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
