// Mock data for the application

export const usuarios = [
  { id: 1, nombre: "Jhonny Hernández", cargo: "Técnico en Informática", rol: "admin", usuario: "jhonny", password: "admin123", area: "Comunicaciones" },
  { id: 2, nombre: "Rosa Elva Barrera", cargo: "Presidenta Municipal", rol: "supervisor", usuario: "presidenta", password: "super123", area: "Presidencia" },
  { id: 3, nombre: "Enc. Comunicaciones", cargo: "Encargada de Comunicaciones", rol: "redactor", usuario: "comunicaciones", password: "red123", area: "Comunicaciones" },
];

export const boletinesIniciales = [
  {
    id: 1,
    titulo: "Presidenta Municipal supervisa obras en el centro",
    cuerpo: "La presidenta municipal Rosa Elva Barrera Flores realizó una supervisión de las obras de remodelación en el centro histórico del municipio, verificando avances y calidad de los trabajos realizados por el equipo de obras públicas.",
    fecha: "2026-06-10",
    estado: "publicado",
    autor: "Enc. Comunicaciones",
    tema: "Obras Públicas",
  },
  {
    id: 2,
    titulo: "Jornada de salud beneficia a 300 familias de Hueypoxtla",
    cuerpo: "El Ayuntamiento de Hueypoxtla llevó a cabo una jornada de salud gratuita en la que se proporcionaron servicios de consulta general, odontología y oftalmología a más de 300 familias del municipio.",
    fecha: "2026-06-05",
    estado: "aprobado",
    autor: "Enc. Comunicaciones",
    tema: "Salud",
  },
  {
    id: 3,
    titulo: "Reunión de cabildo: nuevas inversiones para infraestructura",
    cuerpo: "En sesión ordinaria de cabildo, los regidores aprobaron por unanimidad un paquete de inversiones para mejorar la infraestructura vial del municipio, incluyendo pavimentación de caminos rurales.",
    fecha: "2026-06-01",
    estado: "borrador",
    autor: "Jhonny Hernández",
    tema: "Gobierno",
  },
  {
    id: 4,
    titulo: "Feria de la Barbacoa y el Pulque 2026",
    cuerpo: "El H. Ayuntamiento de Hueypoxtla invita a toda la ciudadanía a participar en la tradicional Feria de la Barbacoa y el Pulque, celebración que honra las tradiciones gastronómicas prehispánicas del municipio.",
    fecha: "2026-05-20",
    estado: "publicado",
    autor: "Enc. Comunicaciones",
    tema: "Cultura",
  },
];

export const eventosIniciales = [
  { id: 1, titulo: "Sesión de Cabildo", fecha: "2026-06-20", hora: "10:00", lugar: "Sala de Sesiones", tipo: "gobierno", descripcion: "Sesión ordinaria mensual del H. Ayuntamiento" },
  { id: 2, titulo: "Entrega de apoyos sociales", fecha: "2026-06-22", hora: "09:00", lugar: "Plaza Principal", tipo: "social", descripcion: "Entrega de despensas y apoyos a familias vulnerables" },
  { id: 3, titulo: "Supervisión de obra vial", fecha: "2026-06-25", hora: "08:00", lugar: "Carretera Central", tipo: "obras", descripcion: "Visita de obra de pavimentación" },
  { id: 4, titulo: "Jornada de Salud", fecha: "2026-06-28", hora: "09:00", lugar: "DIF Municipal", tipo: "salud", descripcion: "Consultas generales gratuitas para ciudadanos" },
  { id: 5, titulo: "Festival por las Almas", fecha: "2026-11-01", hora: "17:00", lugar: "Plaza Principal", tipo: "cultura", descripcion: "Celebración tradicional de Día de Muertos" },
];

export const directorioIniciales = [
  { id: 1, nombre: "Periódico El Sol de Tula", tipo: "prensa", contacto: "editor@elsoltula.mx", telefono: "7771234567", cobertura: "Regional" },
  { id: 2, nombre: "Radio Hueypoxtla FM", tipo: "radio", contacto: "noticias@radiohueypoxtla.mx", telefono: "7787654321", cobertura: "Municipal" },
  { id: 3, nombre: "Tv Azteca Hidalgo", tipo: "television", contacto: "prensa@tvaztecahgo.mx", telefono: "7711223344", cobertura: "Estatal" },
  { id: 4, nombre: "Noticias Mexiquenses", tipo: "digital", contacto: "redaccion@noticiasmex.com", telefono: "7799887766", cobertura: "Estatal" },
  { id: 5, nombre: "La Voz de Hueypoxtla", tipo: "digital", contacto: "info@lavozhuey.mx", telefono: "7755443322", cobertura: "Municipal" },
];
