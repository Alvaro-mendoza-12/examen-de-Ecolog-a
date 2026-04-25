const fs = require('fs');

// 20 topics, each with 4 question variants
// Format: [question, [opt0,opt1,opt2,opt3], correctIndex]
const TOPICS = [
  // T1: Extremo panteísta
  [
    ["El extremo que 'conduce a actitudes panteístas' y no permite el desarrollo es:",["Uso desmesurado de la naturaleza","La naturaleza como un tabú intocable","Sobreexplotación de recursos","Industrialización sin límites"],1],
    ["¿Cuál de los dos extremos a evitar se asocia con actitudes panteístas?",["Uso ilimitado de la naturaleza","Tratar la naturaleza como intocable y sagrada","Contaminar sin consecuencias","Depredación masiva de recursos"],1],
    ["'La naturaleza como un tabú intocable' es un extremo a evitar porque:",["Genera sobreexplotación","Elimina biodiversidad","Conduce a actitudes panteístas que no permiten el desarrollo","Favorece la industrialización"],2],
    ["¿Qué extremo en la relación con la naturaleza conduce al panteísmo?",["Uso racional e inteligente","Explotación desmedida","Contaminación industrial","Considerar la naturaleza como tabú intocable"],3],
  ],
  // T2: Parasitismo
  [
    ["Es aquella relación interespecífica donde un organismo vive a costa de otro causándole perjuicio:",["Comensalismo","Mutualismo","Parasitismo","Depredación"],2],
    ["¿A qué relación corresponde: 'un organismo vive a costa de otro del que obtiene lo necesario'?",["Comensalismo","Depredación","Mutualismo","Parasitismo"],3],
    ["La relación (+)/(-) donde el parásito obtiene beneficio y el hospedador se perjudica sin morir rápidamente es:",["Parasitismo","Comensalismo","Mutualismo","Simbiosis"],0],
    ["Un organismo que habita en otro, obtiene nutrientes y le causa daño ejemplifica la relación de:",["Comensalismo","Parasitismo","Depredación","Mutualismo"],1],
  ],
  // T3: Ecósfera
  [
    ["La suma conjunta de todos los ecosistemas de la tierra se denomina:",["Biosfera","Biocenosis","Ecósfera","Biotopo"],2],
    ["El ecosistema global del planeta Tierra donde puede existir vida se llama:",["Ecósfera","Biosfera","Biocenosis","Biotopo"],0],
    ["¿Cómo se llama la unidad que abarca Atmósfera, Hidrósfera y Litósfera como ecosistema global?",["Biosfera","Ecósfera","Bioma","Biotopo"],1],
    ["La Ecósfera se define como:",["Solo los seres vivos del planeta","La parte no viva del ecosistema","Los ecosistemas acuáticos","El ecosistema global del planeta Tierra"],3],
  ],
  // T4: ANP uso directo
  [
    ["2 ANP consideradas de uso directo en el Perú son:",["PN Manú y SN Manglares de Tumbes","RN Paracas y RC El Sira","SH Machupicchu y PN Huascarán","SN Lagunas de Mejía y SH Chacamarca"],1],
    ["¿Cuáles categorías del SINANPE son de Uso Directo?",["Parques Nacionales y Santuarios Nacionales","Santuarios Históricos y Parques Nacionales","Reservas Nacionales y Reservas Comunales","Zonas Reservadas y Santuarios Históricos"],2],
    ["Las ANP donde se permite aprovechamiento sostenible de recursos son de uso:",["Directo (RN, RC, RP, BP, RVS, CC)","Indirecto (PN, SN, SH)","Transitorio (ZR)","Permanente sin restricciones"],0],
    ["La Reserva Nacional Paracas y la Reserva Comunal El Sira son ANP de uso:",["Indirecto","Directo","Transitorio","Provisional"],1],
  ],
  // T5: SINANPE objetivo
  [
    ["Contribuye al DS del Perú conservando muestras representativas de diversidad biológica:",["SERNANP","MINAM","SINANPE","CONAM"],2],
    ["¿Cuál es el objetivo del SINANPE?",["Contribuir al desarrollo sostenible conservando muestras representativas de diversidad biológica","Regular el aprovechamiento forestal comercial","Exportar recursos naturales sosteniblemente","Administrar solo los parques nacionales"],0],
    ["El Sistema Nacional de Áreas Naturales Protegidas por el Estado tiene como fin:",["Promover el turismo ecológico internacional","Conservar muestras representativas de la diversidad biológica del Perú","Regular la extracción minera en zonas sensibles","Gestionar los recursos hídricos"],1],
    ["¿Qué sistema tiene como objetivo 'contribuir al DS del Perú a través de la conservación de diversidad biológica'?",["CONAM","MINAM","ANA","SINANPE"],3],
  ],
  // T6: Interdependencia
  [
    ["'Todo está conectado a todo' corresponde al Principio de:",["Preservación del Medio Ambiente","Responsabilidad Intergeneracional","Equidad Social","Interdependencia"],3],
    ["El principio que afirma que ningún elemento del ecosistema es independiente de los demás es el de:",["Interdependencia","Equidad Social","Mitigación del Cambio Climático","Salud y Bienestar"],0],
    ["La primera ley de Commoner ('Todo está conectado con todo') corresponde al principio de:",["Equidad Social","Interdependencia","Preservación del MA","Responsabilidad Intergeneracional"],1],
    ["¿Cuál principio expresa que los sistemas sociales, económicos y naturales no operan de forma aislada?",["Salud y Bienestar","Responsabilidad Intergeneracional","Interdependencia","Crecimiento Económico"],2],
  ],
  // T7: Propiedades poblaciones
  [
    ["2 propiedades de las poblaciones son:",["Reproducción y migración","Densidad y Natalidad","Competencia y cooperación","Flujo de energía y nivel trófico"],1],
    ["La propiedad de la población que indica el número de individuos por área en un periodo es:",["Densidad","Natalidad","Mortalidad","Distribución etárea"],0],
    ["La producción de nuevos individuos en un determinado periodo es la propiedad de:",["Densidad","Distribución etárea","Natalidad","Mortalidad"],2],
    ["El número de individuos muertos en una población en un tiempo determinado es la propiedad de:",["Natalidad","Densidad","Distribución etárea","Mortalidad"],3],
  ],
  // T8: Relaciones intraespecíficas estatales
  [
    ["Las hormigas que trabajan organizadas en equipo representan relaciones intraespecíficas del tipo:",["Familiares","Estatales","Gregarias","Coloniales"],1],
    ["¿Qué tipo de relación intraespecífica implica división del trabajo con mucha dependencia entre individuos?",["Gregarias","Coloniales","Estatales","Familiares"],2],
    ["La división del trabajo entre individuos de la misma especie con fuerte dependencia mutua define las relaciones:",["Estatales","Gregarias","Familiares","Coloniales"],0],
    ["El trabajo organizado de hormigas o abejas en colonia corresponde a relaciones intraespecíficas de cooperación tipo:",["Familiares","Gregarias","Coloniales","Estatales"],3],
  ],
  // T9: DS 012-2009-MINAM
  [
    ["El Decreto Supremo que prioriza la gestión integral de los recursos naturales es:",["DS 002-2017-MINAM","DS 026-2009-MINAM","DS 012-2009-MINAM","DL 1013-2008"],2],
    ["La Política Nacional del Ambiente que prioriza la gestión integral de los RN corresponde al:",["DS 012-2009-MINAM","DS 002-2017-MINAM","Ley 30754","Ley 28611"],0],
    ["¿Qué norma establece la Política Nacional del Ambiente priorizando la gestión integral de los recursos naturales?",["DL 1013-2008","DS 012-2009-MINAM","Ley 26821","Ley 30754"],1],
    ["El DS que dice 'conservación y aprovechamiento sostenible del patrimonio natural, priorizando gestión integral de RN' es:",["Ley 28611","Ley 30754","DL 1013","DS 012-2009-MINAM"],3],
  ],
  // T10: 4 categorías SINANPE
  [
    ["¿Cuáles son 4 de las 9 categorías definitivas del SINANPE?",["PN, Santuarios Nacionales, Santuarios Históricos y Reservas Nacionales","Zonas Reservadas, PN, SH y ACR","RC, ACR, CC y ZR","BP, ZR, ACP y ACR"],0],
    ["¿Cuántas categorías definitivas tiene el SINANPE?",["5","7","9","11"],2],
    ["Los Parques Nacionales, SN, SH y RN son categorías del SINANPE de estatus:",["Transitorio","Provisional","Definitivo","Regional"],2],
    ["Mencione 4 categorías definitivas del SINANPE:",["Zonas Reservadas, PN, ACR y RC","PN, SN, SH y Reservas Nacionales","ACP, ACR, ZR y BP","SH, ZR, ACP y ACR"],1],
  ],
  // T11: ODS 8
  [
    ["El ODS relacionado con la falta de trabajo decente, insuficiente inversión y bajo consumo es el:",["ODS 1","ODS 10","ODS 8","ODS 12"],2],
    ["El ODS 8 trata sobre:",["Fin de la pobreza","Reducción de desigualdades","Acción por el clima","Trabajo decente y crecimiento económico"],3],
    ["¿Cuál ODS aborda el desempleo, la informalidad laboral y el crecimiento económico insuficiente?",["ODS 8","ODS 1","ODS 12","ODS 10"],0],
    ["El ODS que promueve el empleo pleno y el trabajo decente para todos es el:",["ODS 12","ODS 8","ODS 1","ODS 10"],1],
  ],
  // T12: Ecología Humana (concepción/gestación)
  [
    ["Cuando se respeta la concepción natural, la gestación y el nacimiento del hombre, se habla de:",["Ecología ambiental","Desarrollo Sostenible","Principio de Equidad Social","Ecología Humana"],3],
    ["El respeto a la concepción natural, la gestación y el nacimiento genera:",["Desarrollo Sostenible","Ecología Humana","Equidad Social","Responsabilidad Intergeneracional"],1],
    ["¿Qué concepto surge cuando se respeta la vida desde la concepción hasta el nacimiento como base ambiental?",["Desarrollo Sostenible","Equidad Social","Ecología Humana","Interdependencia"],2],
    ["La ecología humana surge cuando se respeta:",["El medio ambiente natural","La concepción natural, la gestación y el nacimiento del hombre","Los principios del desarrollo sostenible","La biodiversidad de los ecosistemas"],1],
  ],
  // T13: Ley 30754
  [
    ["La Ley 30754 se encarga de integrar:",["El aprovechamiento sostenible de los RN","La gestión de la diversidad biológica","La gestión del cambio climático en las políticas públicas","La gestión integrada de recursos hídricos"],2],
    ["¿Qué integra la Ley 30754?",["La gestión del cambio climático en políticas públicas del Estado","El aprovechamiento sostenible de RN","La gestión de diversidad biológica","La gestión de recursos hídricos"],0],
    ["La ley que integra la gestión del cambio climático en las políticas públicas del Perú es:",["Ley 26821","Ley 30754","Ley 28611","Ley 26839"],1],
    ["¿Cuál norma legal incorpora el cambio climático a la gestión pública del Perú?",["Ley 26839","Ley 28611","Ley 26821","Ley 30754"],3],
  ],
  // T14: Reserva Paisajística
  [
    ["_____ conservan ambientes cuya integridad geográfica muestra una relación armoniosa entre el hombre y la naturaleza.",["Reserva Nacional","Reserva Comunal","Zona Reservada","Reserva Paisajística"],3],
    ["¿Qué categoría del SINANPE conserva ambientes con relación armoniosa entre hombre y naturaleza?",["Reserva Paisajística","Reserva Comunal","Reserva Nacional","Bosque de Protección"],0],
    ["La Reserva Paisajística se caracteriza por:",["Prohibir todo aprovechamiento de recursos","Conservar ambientes con relación armoniosa entre el hombre y la naturaleza","Proteger solo especies en peligro de extinción","Permitir la caza deportiva regulada"],1],
    ["¿Qué ANP alberga importantes valores naturales y culturales en un ambiente armónico entre hombre y naturaleza?",["Reserva Comunal","Bosque de Protección","Reserva Paisajística","Refugio de Vida Silvestre"],2],
  ],
  // T15: Niveles de organización
  [
    ["2 niveles de organización de los seres vivos son:",["Célula y tejido","Individuo y Población","Especie y bioma","Ecosistema y ecósfera"],1],
    ["¿Cuáles son los niveles de organización en ecología, de menor a mayor?",["Individuo, Población, Comunidad y Ecosistema","Célula, Tejido, Órgano y Sistema","Especie, Género, Familia y Orden","Ecosistema, Bioma, Ecósfera y Biosfera"],0],
    ["El nivel de organización que estudia la Autoecología es:",["La comunidad","La ecósfera","El individuo","La población"],2],
    ["El nivel de organización que estudia la Demoecología es:",["El individuo","La comunidad","El ecosistema","La población"],3],
  ],
  // T16: Heterótrofos clasificaciones
  [
    ["2 clasificaciones de los heterótrofos son:",["Autótrofos y quimiosintéticos","Descomponedores y productores","Herbívoros y Carnívoros","Saprófitos y fotosintéticos"],2],
    ["Los heterótrofos se clasifican principalmente en:",["Herbívoros, Carnívoros y Carroñeros","Productores y descomponedores","Autótrofos y fotosintéticos","Saprófitos y quimiosintéticos"],0],
    ["¿Cuáles de los siguientes son tipos de organismos heterótrofos?",["Plantas con clorofila y algas","Bacterias quimiosintéticas","Herbívoros y Carnívoros","Organismos fotosintéticos"],2],
    ["Los organismos que obtienen energía consumiendo a otros se denominan heterótrofos. Incluyen:",["Solo carnívoros de primer orden","Productores primarios y secundarios","Autótrofos exclusivamente","Herbívoros, Carnívoros y Carroñeros"],3],
  ],
  // T17: Ecología Ambiental (respeto al hombre)
  [
    ["Cuando se respeta al hombre en la sociedad, se puede decir que se habla de:",["Desarrollo Sostenible","Principio de Equidad Social","Ecología Ambiental","Responsabilidad Intergeneracional"],2],
    ["¿Cuándo existe ecología ambiental según el material?",["Cuando se respeta al hombre en la sociedad y su derecho a la vida","Cuando se reduce la contaminación industrial","Cuando se conservan solo las especies animales","Cuando se industrializa de forma eficiente"],0],
    ["La ecología ambiental surge como consecuencia de:",["La industrialización eficiente","El crecimiento económico sostenido","El respeto al hombre en la sociedad y su dignidad","La reducción de emisiones contaminantes"],2],
    ["¿Qué tipo de ecología se genera cuando se respeta al hombre en la sociedad?",["Ecología Humana","Ecología de Poblaciones","Ecología Ambiental","Autoecología"],2],
  ],
  // T18: Trabajo/subsidiariedad
  [
    ["Cuando el hombre obtiene recursos de la naturaleza por su trabajo y esfuerzo, nos referimos al principio de:",["Equidad Social","Responsabilidad Intergeneracional","Subsidiariedad — obtención de recursos por propio trabajo","Preservación del Medio Ambiente"],2],
    ["El principio que reconoce el derecho del hombre a obtener recursos de la naturaleza mediante su propio trabajo es:",["Subsidiariedad","Equidad Social","Interdependencia","Responsabilidad Intergeneracional"],0],
    ["¿Qué principio establece que cada persona puede obtener recursos de la naturaleza producto de su trabajo?",["Equidad Social","Responsabilidad Intergeneracional","Subsidiariedad","Interdependencia"],2],
    ["Obtener recursos de la naturaleza mediante el propio trabajo e inventiva es un derecho relacionado con el principio de:",["Interdependencia","Equidad Social","Responsabilidad Intergeneracional","Subsidiariedad"],3],
  ],
  // T19: Recursos abióticos
  [
    ["¿De qué están formados los recursos abióticos?",["Organismos vivos del ecosistema","Relaciones entre distintas especies","Características físico-químicas del medio ambiente que influyen en los seres vivos","Biomasa vegetal y animal"],2],
    ["Los factores abióticos de un ecosistema son:",["Las características físico-químicas del medio que influyen sobre los seres vivos","Los organismos vivos y sus relaciones","Las relaciones entre distintas especies","La fauna silvestre del ecosistema"],0],
    ["¿Qué son los factores abióticos?",["Los organismos vivos del ecosistema","Las relaciones interespecíficas","Las características físico-químicas del medio que influyen sobre los seres vivos","La biomasa del ecosistema"],2],
    ["La temperatura, el pH, la luz y la humedad son ejemplos de:",["Factores bióticos","Relaciones intraespecíficas","Niveles tróficos","Factores abióticos"],3],
  ],
  // T20: SERNANP
  [
    ["En su calidad de autoridad técnico-normativa trabaja coordinando con gobiernos regionales, locales y propietarios. Es el ente rector llamado:",["MINAM","CONAM","ANA","SERNANP"],3],
    ["¿Cuál es el ente rector del SINANPE?",["SERNANP","MINAM","CONAM","ANA"],0],
    ["El SERNANP, como ente rector del SINANPE, trabaja en coordinación con:",["Solo el gobierno nacional","Organismos internacionales de conservación","Solo el Ministerio del Ambiente","Gobiernos regionales, locales y propietarios de áreas de conservación privada"],3],
    ["¿Qué organismo público especializado dirige el SINANPE y está adscrito al MINAM?",["CONAM","ANA","SERNANP","MINAM"],2],
  ],
];

const TITLES = [
  "Simulacro 1 – Banco Oficial 2026 I",
  "Simulacro 2 – Banco Oficial 2026 I",
  "Simulacro 3 – Banco Oficial 2026 I",
  "Simulacro 4 – Banco Oficial 2026 I",
  "Simulacro 5 – Banco Oficial 2026 I",
  "Simulacro 6 – Banco Oficial 2026 I",
  "Simulacro 7 – Banco Oficial 2026 I",
  "Simulacro 8 – Banco Oficial 2026 I",
  "Simulacro 9 – Banco Oficial 2026 I",
  "Simulacro 10 – Banco Oficial 2026 I",
  "Simulacro 11 – Banco Oficial 2026 I",
  "Simulacro 12 – Banco Oficial 2026 I",
  "Simulacro 13 – Banco Oficial 2026 I",
  "Simulacro 14 – Banco Oficial 2026 I",
  "Simulacro 15 – Banco Oficial 2026 I",
  "Simulacro 16 – Banco Oficial 2026 I",
  "Simulacro 17 – Banco Oficial 2026 I",
  "Simulacro 18 – Banco Oficial 2026 I",
  "Simulacro 19 – Banco Oficial 2026 I",
  "Simulacro 20 – Banco Oficial 2026 I",
];

const exams = [];

for (let examIdx = 0; examIdx < 20; examIdx++) {
  const questions = TOPICS.map(topicVariants => {
    // cycle through 4 variants using exam index
    const [q, opts, a] = topicVariants[examIdx % topicVariants.length];
    return { q, opts, a };
  });
  exams.push({ id: examIdx + 1, title: TITLES[examIdx], questions });
}

let out = `// ═══════════════════════════════════════════════════════════════
//  DATA.JS — 20 Exámenes × 20 Preguntas = 400 Preguntas
//  Basado en el Banco de Preguntas Oficial 2026 I
//  Fuentes: Sesión 01, 02 y 03 – Ecología y Desarrollo Sostenible
//  Universidad Católica Santo Toribio de Mogrovejo (USAT)
// ═══════════════════════════════════════════════════════════════

const EXAMS = [\n\n`;

exams.forEach((exam, i) => {
  out += `// ══════════════════════════════════════════════════════════════\n`;
  out += `// EXAMEN ${String(exam.id).padStart(2,'0')}\n`;
  out += `// ══════════════════════════════════════════════════════════════\n`;
  out += `{\n  id: ${exam.id},\n  title: ${JSON.stringify(exam.title)},\n  questions: [\n`;
  exam.questions.forEach(q => {
    out += `    {q:${JSON.stringify(q.q)}, opts:[${q.opts.map(o=>JSON.stringify(o)).join(',')}], a:${q.a}},\n`;
  });
  out += `  ]\n}`;
  if (i < exams.length - 1) out += ',';
  out += '\n\n';
});

out += `]; // end EXAMS\n`;

fs.writeFileSync('./js/data.js', out, 'utf8');
console.log('data.js generated. Exams:', exams.length, '| Questions per exam:', exams[0].questions.length);
