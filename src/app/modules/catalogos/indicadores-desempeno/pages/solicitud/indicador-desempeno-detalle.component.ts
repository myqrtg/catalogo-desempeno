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
  // Prellenado con datos de ejemplo (0002 Salud Materno Neonatal).
  readonly programa = signal<ProgramaPresupuestal | null>(OPCIONES_PROGRAMA[0]);
  readonly modalPrograma = signal(false);

  // Filas y columnas del modal de selección.
  readonly filasPrograma: CatalogRow[] = OPCIONES_PROGRAMA.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }));
  readonly columnasPrograma: CatalogColumn[] = [
    { key: 'codigo', label: 'Código programa', widthClass: 'w-[200px]' },
    { key: 'nombre', label: 'Nombre programa' },
  ];

  // Producto (aparece solo cuando el nivel de medición es «2. Producto»); prellenado de ejemplo.
  readonly producto = signal<ProductoPresupuestal | null>(OPCIONES_PRODUCTO[0]);
  readonly modalProducto = signal(false);
  readonly filasProducto: CatalogRow[] = OPCIONES_PRODUCTO.map((p) => ({ id: p.id, codigo: p.codigo, nombre: p.nombre }));
  readonly columnasProducto: CatalogColumn[] = [
    { key: 'codigo', label: 'Código producto', widthClass: 'w-[200px]' },
    { key: 'nombre', label: 'Nombre producto' },
  ];

  // ── Datos del indicador (prellenado con data cualitativa de ejemplo) ──
  readonly codigo = signal('');
  readonly nombre = signal('Cobertura de parto institucional');
  readonly nivelMedicion = signal('2. Producto');
  readonly dimension = signal('eficacia');
  readonly unidadMedida = signal('Porcentaje');
  readonly sentido = signal('Subir');
  readonly tipoCalculo = signal('numerador');
  readonly numerador = signal('total de mujeres que tuvieron nacimiento vivo atendido por personal de salud calificado en establecimientos de salud en los últimos cinco años.');
  readonly denominador = signal('total de mujeres que tuvieron nacimiento vivo en los últimos cinco años.');
  readonly tipoFuente = signal('INEI');
  readonly fuenteDatos = signal('ENCUESTA DEMOGRAFICA Y DE SALUD FAMILIAR (ENDES)');
  readonly limitacion = signal('La principal limitación del indicador es que la información recogida se basa en la declaración de las informantes, por lo cual, puede no ser una medición muy precisa, por problemas de recordación o conocimiento.');
  readonly supuestos = signal('-');
  readonly precisiones = signal(
    'Parto Institucional:\n' +
    'La variable Parto Institucional se construye a partir de las preguntas del Cuestionario Individual, Sección 4ª (Embarazo, parto, puerperio y lactancia):\n' +
    '• Pregunta 426: ¿Quién la atendió en el parto de (NOMBRE)?; respondieron las alternativas: A (Médico), B (Obstetríz) o C (Enfermera).',
  );
  readonly periodicidad = signal('Semestral');

  // ── Cobertura de medición ─────────────────────────────────────────
  readonly alcanceGeografico = signal('Nacional y regional');
  readonly nivelResponsable = signal('Nacional');

  // ── Tablas dinámicas (prellenadas de ejemplo) ─────────────────────
  readonly desagregaciones = signal<FilaDesagregacion[]>([
    { ambito: '7 CALLAO', area: '1 TOTAL', periodicidad: '2 SEMESTRAL' },
    { ambito: '9 HUANCAVELICA', area: '1 TOTAL', periodicidad: '2 SEMESTRAL' },
    { ambito: '8 CUSCO', area: '1 TOTAL', periodicidad: '2 SEMESTRAL' },
    { ambito: '10 HUANUCO', area: '1 TOTAL', periodicidad: '2 SEMESTRAL' },
    { ambito: '6 CAJAMARCA', area: '1 TOTAL', periodicidad: '2 SEMESTRAL' },
  ]);
  readonly variables = signal<FilaVariable[]>([
    { variable: 'PART_INST', descripcion: 'Identifica si el último parto ocurrió en un establecimiento de salud', fuente: 'Encuesta', tipoVariable: 'Categórica dicotómica' },
    { variable: 'Part_estab', descripcion: 'Variable auxiliar que identifica si el establecimiento de salud es público o privado', fuente: 'Encuesta (M15)', tipoVariable: 'Categórica dicotómica' },
  ]);
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
  readonly opcTipoFuente = ['INEI', 'Registro administrativo', 'Encuesta', 'Censo', 'Estudio especializado'].map((v) => ({ value: v, label: v }));
  readonly opcPeriodicidad = ['Anual', 'Semestral', 'Trimestral', 'Mensual'].map((v) => ({ value: v, label: v }));
  readonly opcNivelResponsable = ['Nacional', 'Regional', 'Local'].map((v) => ({ value: v, label: v }));
  // Catálogos de la desagregación geográfica (departamentos, área y periodicidad numeradas).
  readonly opcAmbito = [
    '1 AMAZONAS', '2 ANCASH', '3 APURIMAC', '4 AREQUIPA', '5 AYACUCHO', '6 CAJAMARCA', '7 CALLAO',
    '8 CUSCO', '9 HUANCAVELICA', '10 HUANUCO', '11 ICA', '12 JUNIN', '13 LA LIBERTAD', '14 LAMBAYEQUE',
    '15 LIMA', '16 LORETO', '17 MADRE DE DIOS', '18 MOQUEGUA', '19 PASCO', '20 PIURA', '21 PUNO',
    '22 SAN MARTIN', '23 TACNA', '24 TUMBES', '25 UCAYALI',
  ].map((v) => ({ value: v, label: v }));
  readonly opcArea = ['1 TOTAL', '2 URBANO', '3 RURAL'].map((v) => ({ value: v, label: v }));
  readonly opcPeriodicidadTabla = ['1 ANUAL', '2 SEMESTRAL', '3 TRIMESTRAL', '4 MENSUAL'].map((v) => ({ value: v, label: v }));
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
