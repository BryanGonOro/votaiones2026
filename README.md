# Votaciones - Sistema de Control de Votantes

Sistema web móvil para gestionar el control de votantes, importar datos desde Excel y hacer seguimiento de votos y referidos.

## 🚀 Características

- **Importación desde Excel**: Importa votantes desde archivos .xlsx/.xls con columnas de CEDULA, NOMBRE, MESA, REFERIDOR
- **Control de votos**: Registro de votaciones con historial de fecha/hora
- **Seguimiento de referidos**: Visualización de quién refiere a cada votante
- **Estadísticas en tiempo real**: Conteo de totales, votados y pendientes
- **Diseño móvil-first**: Optimizado para uso en dispositivos móviles
- **Autenticación segura**: JWT tokens con hash bcrypt
- **Protección de datos**: Una vez votada, la información no puede ser modificada

## 🛠️ Tecnología

- **Backend**: Node.js + Express.js
- **Base de datos**: SQLite (configurable a MySQL)
- **Frontend**: React + Vite
- **Autenticación**: JWT + bcrypt
- **Excel**: xlsx library

## 📋 Requisitos

- Node.js 18+
- npm 9+

## 🔧 Instalación

```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client && npm install
```

## ⚙️ Configuración

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. Edita `.env` con tu configuración:
```env
# Puerto del servidor
PORT=3001

# Entorno (development/production)
NODE_ENV=development

# Secret JWT
JWT_SECRET=tu_secret_seguro
JWT_EXPIRES_IN=24h

# Tipo de base de datos (sqlite/mysql)
DB_TYPE=sqlite
DB_PATH=./database.sqlite

# Usuario administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=tu_password_seguro
```

## 🚀 Ejecución

```bash
# Desarrollo (servidor + cliente)
npm run dev

# Solo servidor
npm run server

# Solo cliente
npm run client

# Producción
npm run build
npm start
```

## 📱 Uso

1. Accede a `http://localhost:5173` (cliente Vite)
2. Inicia sesión con las credenciales de admin
3. Importa un archivo Excel con los votantes
4. Marca votaciones con un clic
5. Consulta estadísticas y referidos

## 📊 Endpoints API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Votantes
- `GET /api/voters` - Listar votantes (con filtros)
- `GET /api/voters/:id` - Obtener votante
- `POST /api/voters` - Crear votante
- `PUT /api/voters/:id` - Actualizar votante
- `POST /api/voters/:id/vote` - Marcar como votado
- `POST /api/voters/import` - Importar desde Excel

### Estadísticas
- `GET /api/stats` - Obtener estadísticas

## 📝 Formato Excel

El archivo Excel debe tener las siguientes columnas:
| CEDULA | NOMBRE | MESA | REFERIDOR |
|--------|--------|------|-----------|
| 12345678 | Juan Perez | 1 | Maria Garcia |
| 87654321 | Pedro Gomez | 2 | - |

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT con expiración de 24h
- Validación de entradas
- Una vez votada la ficha, no puede ser modificada

## 📁 Estructura

```
votaciones/
├── server/              # Backend Express
│   ├── index.js        # Servidor principal
│   ├── database.js     # Configuración DB
│   ├── auth.js         # Middleware auth
│   ├── routes/         # Rutas API
│   └── utils/          # Utilidades
├── client/             # Frontend React
│   ├── src/
│   │   ├── pages/      # Páginas
│   │   ├── components/ # Componentes
│   │   └── api/        # Llamadas API
│   └── index.html
├── .env                # Variables entorno
├── .env.example        # Ejemplo vars
├── package.json
└── README.md
```

## 📄 Licencia

MIT
