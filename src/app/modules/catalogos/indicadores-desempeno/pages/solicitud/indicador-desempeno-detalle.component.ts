import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, signal } from '@angular/core';

import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';
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

/** Sugerencias de autocompletado (al escribir) para los campos de texto del registro. */
const SUGERENCIAS_NUMERADOR: string[] = [
  'total de mujeres que tuvieron nacimiento vivo atendido por personal de salud calificado en establecimientos de salud en los últimos cinco años.',
  'total de niñas y niños menores de 5 años con desnutrición crónica.',
  'total de recién nacidos con bajo peso al nacer.',
  'total de gestantes con al menos seis controles prenatales.',
];

const SUGERENCIAS_DENOMINADOR: string[] = [
  'total de mujeres que tuvieron nacimiento vivo en los últimos cinco años.',
  'total de niñas y niños menores de 5 años evaluados.',
  'total de recién nacidos vivos en el periodo.',
  'total de gestantes atendidas en el periodo.',
];

const SUGERENCIAS_FUENTE: string[] = [
  'ENCUESTA DEMOGRAFICA Y DE SALUD FAMILIAR (ENDES)',
  'Registro Nominal de Atenciones (HIS - MINSA)',
  'Sistema de Información del Estado Nutricional (SIEN)',
  'Certificado de Nacido Vivo en Línea (CNV)',
  'Censos Nacionales (INEI)',
];

const SUGERENCIAS_LIMITACION: string[] = [
  'La principal limitación del indicador es que la información recogida se basa en la declaración de las informantes, por lo cual, puede no ser una medición muy precisa, por problemas de recordación o conocimiento.',
  'La cobertura de la encuesta no permite estimaciones a nivel distrital.',
  'El indicador depende de la calidad del registro administrativo, que puede presentar subregistro.',
  'Los resultados no son comparables entre periodos cuando cambia la metodología de la fuente.',
];

const SUGERENCIAS_SUPUESTOS: string[] = [
  '-',
  'Se asume que la fuente de datos mantiene su cobertura y periodicidad en el tiempo.',
  'Se asume que la declaración de las informantes es veraz.',
  'Se asume que no hay cambios metodológicos en el periodo de medición.',
];

const SUGERENCIAS_PRECISIONES: string[] = [
  'Parto Institucional:\nLa variable Parto Institucional se construye a partir de las preguntas del Cuestionario Individual, Sección 4ª (Embarazo, parto, puerperio y lactancia).',
  'El indicador se calcula sobre la población objetivo definida en el marco lógico del programa presupuestal.',
  'Los valores se expresan en porcentaje con un decimal.',
  'Se excluyen del cálculo los registros con información inconsistente o incompleta.',
];

// ── Sugerencias del Diccionario de datos del indicador ──
const SUG_DICC_VARIABLE: string[] = ['PART_INST', 'Part_estab', 'M15', 'M3A', 'M3B', 'M3C', 'M3N'];
const SUG_DICC_DESCRIPCION: string[] = [
  'Identifica si el último parto ocurrió en un establecimiento de salud',
  'Variable auxiliar que identifica si el establecimiento de salud es público o privado',
  'Lugar donde ocurrió el parto.',
  'La atendió en el parto: Médico',
  'La atendió en el parto: Enfermera',
  'La atendió en el parto: Obstetra',
  'La atendió en el parto: Nadie',
];
const SUG_DICC_FUENTE: string[] = ['Encuesta', 'Encuesta (M15)', 'Base de datos de encuesta'];
const SUG_DICC_TIPO: string[] = ['Categórica dicotómica', 'Categórica', 'Numérica', 'Continua'];

// Al elegir una Variable del diccionario, se autocompletan sus otras columnas.
interface DiccionarioDato { descripcion: string; fuente: string; tipoVariable: string; }
const DICC_POR_VARIABLE: Record<string, DiccionarioDato> = {
  PART_INST: { descripcion: 'Identifica si el último parto ocurrió en un establecimiento de salud', fuente: 'Encuesta', tipoVariable: 'Categórica dicotómica' },
  Part_estab: { descripcion: 'Variable auxiliar que identifica si el establecimiento de salud es público o privado', fuente: 'Encuesta (M15)', tipoVariable: 'Categórica dicotómica' },
  M15: { descripcion: 'Lugar donde ocurrió el parto.', fuente: 'Base de datos de encuesta', tipoVariable: 'Categórica' },
  M3A: { descripcion: 'La atendió en el parto: Médico', fuente: 'Base de datos de encuesta', tipoVariable: 'Categórica' },
  M3B: { descripcion: 'La atendió en el parto: Enfermera', fuente: 'Base de datos de encuesta', tipoVariable: 'Categórica' },
  M3C: { descripcion: 'La atendió en el parto: Obstetra', fuente: 'Base de datos de encuesta', tipoVariable: 'Categórica' },
  M3N: { descripcion: 'La atendió en el parto: Nadie', fuente: 'Base de datos de encuesta', tipoVariable: 'Categórica' },
};

// ── Sugerencias de las Validaciones ──
const SUG_VALID_ELEMENTO: string[] = ['Lugar del parto', 'Parto institucional', 'Parto no institucional', 'Valores finales', 'Consistencia'];

// Al elegir un Elemento de validación, se autocompleta su Descripción.
const VALID_POR_ELEMENTO: Record<string, string> = {
  'Lugar del parto': 'Se consideran institucionales los partos ocurridos en establecimientos de salud codificados entre 21-27, 31-32 y 41-42 en la variable M15.',
  'Parto institucional': 'Se asigna valor 1 cuando el parto ocurrió en un establecimiento de salud y fue atendido por un profesional de salud registrado en M3A, M3B o M3C.',
  'Parto no institucional': 'Se asigna valor 0 cuando el parto no ocurrió en un establecimiento de salud y no fue atendido por personal de salud (M3N=0).',
  'Valores finales': 'PART_INST: 1 = Sí, 0 = No.',
  'Consistencia': 'El parto institucional requiere simultáneamente establecimiento de salud y atención por personal de salud.',
};
const SUG_VALID_DESCRIPCION: string[] = [
  'Se consideran institucionales los partos ocurridos en establecimientos de salud codificados entre 21-27, 31-32 y 41-42 en la variable M15.',
  'Se asigna valor 1 cuando el parto ocurrió en un establecimiento de salud y fue atendido por un profesional de salud registrado en M3A, M3B o M3C.',
  'Se asigna valor 0 cuando el parto no ocurrió en un establecimiento de salud y no fue atendido por personal de salud (M3N=0).',
  'PART_INST: 1 = Sí, 0 = No.',
  'El parto institucional requiere simultáneamente establecimiento de salud y atención por personal de salud.',
];

/** Resumen que se agrega a la tabla de registros de la solicitud al aceptar. */
export interface IndicadorDetalleResumen {
  codigo: string;
  nombre: string;
  nivelMedicion: string;
  dimension: string;
  programa: string;
  producto: string;
  programacion: string;
  gestion: string;
  evaluacion: string;
  anioInicio: string;
  anioFin: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
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

  // ── Medición y Vigencia (prellenadas de ejemplo; se asignan al aceptar) ──
  readonly anioInicioMedicion = signal('2027');
  readonly anioFinMedicion = signal('----');
  readonly estadoVigencia = signal('SI');
  readonly fechaDesde = signal('23/01/2026');
  readonly fechaHasta = signal('--/--/----');

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
  readonly opcPeriodicidad = ['Anual', 'Semestral', 'Trimestral'].map((v) => ({ value: v, label: v }));
  readonly opcNivelResponsable = ['Nacional', 'Regional', 'Local'].map((v) => ({ value: v, label: v }));
  // Catálogos de la desagregación geográfica (departamentos, área y periodicidad numeradas).
  readonly opcAmbito = [
    '1 AMAZONAS', '2 ANCASH', '3 APURIMAC', '4 AREQUIPA', '5 AYACUCHO', '6 CAJAMARCA', '7 CALLAO',
    '8 CUSCO', '9 HUANCAVELICA', '10 HUANUCO', '11 ICA', '12 JUNIN', '13 LA LIBERTAD', '14 LAMBAYEQUE',
    '15 LIMA', '16 LORETO', '17 MADRE DE DIOS', '18 MOQUEGUA', '19 PASCO', '20 PIURA', '21 PUNO',
    '22 SAN MARTIN', '23 TACNA', '24 TUMBES', '25 UCAYALI',
  ].map((v) => ({ value: v, label: v }));
  readonly opcArea = ['1 TOTAL', '2 URBANO', '3 RURAL'].map((v) => ({ value: v, label: v }));
  readonly opcPeriodicidadTabla = ['Anual', 'Semestral', 'Trimestral'].map((v) => ({ value: v, label: v }));
  readonly nombresIndicador = NOMBRES_INDICADOR;
  readonly sugerenciasNumerador = SUGERENCIAS_NUMERADOR;
  readonly sugerenciasDenominador = SUGERENCIAS_DENOMINADOR;
  readonly sugerenciasFuente = SUGERENCIAS_FUENTE;
  readonly sugerenciasLimitacion = SUGERENCIAS_LIMITACION;
  readonly sugerenciasSupuestos = SUGERENCIAS_SUPUESTOS;
  readonly sugerenciasPrecisiones = SUGERENCIAS_PRECISIONES;
  readonly sugDiccVariable = SUG_DICC_VARIABLE;
  readonly sugDiccDescripcion = SUG_DICC_DESCRIPCION;
  readonly sugDiccFuente = SUG_DICC_FUENTE;
  readonly sugDiccTipo = SUG_DICC_TIPO;
  readonly sugValidElemento = SUG_VALID_ELEMENTO;
  readonly sugValidDescripcion = SUG_VALID_DESCRIPCION;

  // ── Aceptar ───────────────────────────────────────────────────────
  /**
   * Se habilita cuando están completos los campos obligatorios del registro. El Código y los campos de Medición/
   * Vigencia se asignan al aceptar (no bloquean); el Denominador y Área/Periodicidad de la tabla son opcionales.
   */
  aceptarHabilitado(): boolean {
    const req = (v: string) => !!v && v.trim().length > 0;
    const productoOk = this.nivelMedicion() === '2. Producto' ? !!this.producto() : true;
    const desagregacionOk = this.desagregaciones().some((f) => req(f.ambito));
    const diccionarioOk = this.variables().some((f) => req(f.variable) && req(f.descripcion) && req(f.fuente) && req(f.tipoVariable));
    const validacionesOk = this.validaciones().some((f) => req(f.elemento) && req(f.descripcion));
    return (
      !!this.programa() && productoOk
      && req(this.nombre())
      && req(this.nivelMedicion()) && req(this.dimension()) && req(this.unidadMedida()) && req(this.sentido())
      && req(this.tipoCalculo()) && req(this.numerador())
      && req(this.tipoFuente()) && req(this.fuenteDatos())
      && req(this.limitacion()) && req(this.supuestos()) && req(this.precisiones())
      && req(this.periodicidad())
      && req(this.alcanceGeografico()) && req(this.nivelResponsable())
      && desagregacionOk && diccionarioOk && validacionesOk
      && !!this.codigoComentado() && !!this.sustento()
      && req(this.programacion()) && req(this.gestion()) && req(this.evaluacion())
    );
  }

  aceptar(): void {
    if (!this.aceptarHabilitado()) return;
    const dimension = this.opcDimension.find((o) => o.value === this.dimension())?.label ?? this.dimension();
    const siNo = (v: string) => (v === 'SI' ? 'Sí' : v === 'NO' ? 'No' : v);
    const p = this.programa();
    const pr = this.producto();
    this.saved.emit({
      codigo: this.codigo().trim(),
      nombre: this.nombre().trim(),
      nivelMedicion: this.nivelMedicion(),
      dimension,
      programa: p ? `${p.codigo}. ${p.nombre}` : '',
      producto: pr ? `${pr.codigo}. ${pr.nombre}` : '',
      programacion: siNo(this.programacion()),
      gestion: siNo(this.gestion()),
      evaluacion: siNo(this.evaluacion()),
      anioInicio: this.anioInicioMedicion(),
      anioFin: this.anioFinMedicion(),
      estado: siNo(this.estadoVigencia()),
      fechaDesde: this.fechaDesde(),
      fechaHasta: this.fechaHasta(),
    });
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
  /** Al elegir una Variable conocida, autocompleta Descripción, Fuente y Tipo de esa fila. */
  onVariableSeleccionada(i: number, variable: string): void {
    const d = DICC_POR_VARIABLE[variable];
    this.variables.update((f) => f.map((fila, idx) => (idx === i
      ? { ...fila, variable, ...(d ? { descripcion: d.descripcion, fuente: d.fuente, tipoVariable: d.tipoVariable } : {}) }
      : fila)));
  }

  agregarValidacion(): void {
    this.validaciones.update((f) => [...f, { elemento: '', descripcion: '' }]);
  }
  actualizarValidacion(i: number, campo: keyof FilaValidacion, valor: string): void {
    this.validaciones.update((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: valor } : fila)));
  }
  /** Al elegir un Elemento conocido, autocompleta su Descripción. */
  onElementoSeleccionado(i: number, elemento: string): void {
    const desc = VALID_POR_ELEMENTO[elemento];
    this.validaciones.update((f) => f.map((fila, idx) => (idx === i
      ? { ...fila, elemento, ...(desc !== undefined ? { descripcion: desc } : {}) }
      : fila)));
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
