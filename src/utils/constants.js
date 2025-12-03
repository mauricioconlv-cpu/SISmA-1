import { Truck, Battery, Disc, Fuel, Key, Wrench, Zap, Home, Pill, Hammer } from 'lucide-react';

export const SERVICE_TYPES = [
    // VEHICULAR
    { id: 'grua', label: 'Grúa', category: 'vehicular', icon: 'Truck' },
    { id: 'corriente', label: 'Paso de Corriente', category: 'vehicular', icon: 'Battery' },
    { id: 'llanta', label: 'Cambio de Llanta', category: 'vehicular', icon: 'Disc' },
    { id: 'gasolina', label: 'Suministro Gasolina', category: 'vehicular', icon: 'Fuel' },
    { id: 'cerrajeria_auto', label: 'Cerrajería Auto', category: 'vehicular', icon: 'Key' },

    // HOGAR
    { id: 'cerrajeria_hogar', label: 'Cerrajería Hogar', category: 'home', icon: 'Key' },
    { id: 'plomeria', label: 'Plomería', category: 'home', icon: 'Wrench' },
    { id: 'electricidad', label: 'Electricidad', category: 'home', icon: 'Zap' },
    { id: 'vidrieria', label: 'Vidriería', category: 'home', icon: 'Hammer' }, // Using Hammer as placeholder for Vidrieria if Glass not avail

    // GENERAL
    { id: 'farmacia', label: 'Farmacia', category: 'general', icon: 'Pill' },
];

export const ROLES = {
    SUPERADMIN: 'superadmin',
    ADMIN: 'admin', // Company Admin
    USER: 'user'    // Operator
};

export const DEFAULT_COMPANIES = [
    {
        id: 1,
        name: 'Grúas Patito S.A. de C.V.',
        rfc: 'GPA190101AAA',
        address: 'Av. Industrial 123, Col. Centro, CDMX',
        email: 'contacto@gruaspatito.com',
        logo: null, // Base64 string would go here
        modules: ['grua', 'corriente', 'llanta', 'gasolina'],
        active: true
    },
    {
        id: 2,
        name: 'Servicios Hogar Express',
        rfc: 'SHE200202BBB',
        address: 'Calle Reforma 456, Col. Juarez, CDMX',
        email: 'admin@hogarexpress.com',
        logo: null,
        modules: ['plomeria', 'electricidad', 'cerrajeria_hogar'],
        active: true
    }
];

export const DEFAULT_CLIENTES = ["Particular", "IKE asistencia", "MAS servicios", "MAWDI", "Telasist", "ADIUVA", "Inbursa", "Ford", "SPV"];
export const DEFAULT_GRUAS = ["Grúa 01 - Plataforma", "Grúa 02 - Arrastre", "Grúa 03 - Pesada", "Grúa 04 - Pluma"];
export const DEFAULT_OPERADORES = ["Juan Pérez", "Roberto Gómez", "Carlos Ruiz", "Miguel Ángel"];

// Updated Users with Permissions and Company ID
export const DEFAULT_USUARIOS = [
    {
        id: 1,
        nombre: 'Super Admin',
        email: 'admin@plataforma.com',
        rol: ROLES.SUPERADMIN,
        company_id: null,
        permissions: ['all']
    },
    {
        id: 2,
        nombre: 'Admin Grúas',
        email: 'admin@gruas.com',
        rol: ROLES.ADMIN,
        company_id: 1,
        permissions: ['grua', 'corriente', 'llanta', 'gasolina']
    },
    {
        id: 3,
        nombre: 'Operador Grúas',
        email: 'operador@gruas.com',
        rol: ROLES.USER,
        company_id: 1,
        permissions: ['grua']
    },
    {
        id: 4,
        nombre: 'Admin Hogar',
        email: 'admin@hogar.com',
        rol: ROLES.ADMIN,
        company_id: 2,
        permissions: ['plomeria', 'electricidad', 'cerrajeria_hogar']
    }
];

export const DEFAULT_TARIFAS = {
    banderazo: 800,
    costoKm: 25,
    maniobraBase: 0,
};

export const COLORES = ["Blanco", "Negro", "Gris", "Plata", "Rojo", "Azul", "Verde", "Beige", "Amarillo", "Naranja", "Cafe"];
export const MARCAS_MX = ["Nissan", "Chevrolet", "Volkswagen", "Toyota", "Kia", "Mazda", "Honda", "Ford", "Hyundai", "MG", "Renault", "Suzuki", "Seat", "BMW", "Mercedes-Benz", "Audi", "FCA (Dodge/Jeep/Ram)", "Chirey", "JAC", "Mitsubishi", "Peugeot", "Fiat", "Volvo", "Subaru", "Tesla", "BYD", "Omoda", "Otro"].sort();

export const MOTIVOS_CAMBIO = [
    "Usuario cambia ubicación",
    "Error de captura",
    "Solicitud de Cabina",
    "Otro"
];

export const ESTADOS_MX = ["Ciudad de México", "Estado de México", "Jalisco", "Nuevo León", "Puebla", "Veracruz", "Guanajuato", "Querétaro", "Hidalgo", "Morelos"];
export const MUNICIPIOS_DB = {
    "Ciudad de México": ["Álvaro Obregón", "Azcapotzalco", "Benito Juárez", "Coyoacán", "Cuajimalpa", "Cuauhtémoc", "Gustavo A. Madero", "Iztacalco", "Iztapalapa", "Magdalena Contreras", "Miguel Hidalgo", "Milpa Alta", "Tláhuac", "Tlalpan", "Venustiano Carranza", "Xochimilco"],
    "Estado de México": ["Ecatepec", "Nezahualcóyotl", "Toluca", "Naucalpan", "Tlalnepantla", "Chimalhuacán", "Cuautitlán Izcalli", "Atizapán", "Tultitlán", "Ixtapaluca", "Tecámac", "Valle de Chalco"],
    "Jalisco": ["Guadalajara", "Zapopan", "Tlaquepaque", "Tonalá", "Tlajomulco", "Puerto Vallarta"],
    "Nuevo León": ["Monterrey", "Guadalupe", "Apodaca", "San Nicolás", "San Pedro Garza García"],
    "default": ["Municipio Genérico 1", "Municipio Genérico 2"]
};

export const getMunicipios = (estado) => MUNICIPIOS_DB[estado] || MUNICIPIOS_DB["default"];
