# S-mart - Sistema de Tienda en Línea
#### Proyecto Gestión del proceso de desarrollo de software

Sistema completo de tienda en línea con diferentes roles de usuario: **Cliente**, **Cajero**, **Vendedor** y **Administrador**. El proyecto está construido con Vue.js en el frontend y Node.js/Express en el backend.

---

## 📋 Descripción del Proyecto

S-mart es una aplicación web moderna que permite gestionar una tienda en línea con las siguientes características:

### Roles de Usuario

* **Cliente:** Navega productos, añade al carrito y realiza compras
* **Cajero:** Procesa pagos y gestiona transacciones en punto de venta
* **Vendedor:** Gestiona inventario, productos y pedidos
* **Administrador:** Control total del sistema, usuarios y configuraciones

### Tecnologías

* **Frontend:** Vue.js 3 + Vite + Pinia
* **Backend:** Node.js + Express.js
* **Base de Datos:** Supabase

---

## 🚀 Instalación y Ejecución

### Prerrequisitos

* **Node.js** v20.19.0 o superior (recomendado v22.12.0+)
* **npm** (incluido con Node.js)
* **Git** (opcional)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Hiramrr/S-mart.git
cd S-mart
```

### 2. Instalar Dependencias

Instala las dependencias tanto del backend como del frontend:

```bash
# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../Frontend
npm install
```

### 3. Configurar Variables de Entorno

Crea los archivos `.env` necesarios en cada carpeta (backend y Frontend) con las credenciales correspondientes.

Tendras que registrarte en supabase y utilizar tus propios api keys.
### 4. Ejecutar el Proyecto

#### Opción A: Ejecutar Backend y Frontend por Separado

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
El servidor backend estará disponible en `http://localhost:3000` (o el puerto configurado)

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
El servidor de desarrollo de Vue estará disponible en `http://localhost:5173`

#### Opción B: Ejecutar desde la raíz

Desde la raíz del proyecto:

```bash
# Instalar todas las dependencias
npm install

# Ejecutar backend
cd backend && npm run dev &

# Ejecutar frontend
cd Frontend && npm run dev
```

---

## 📁 Estructura del Proyecto

```
S-mart/
├── backend/           # API REST con Node.js/Express
│   ├── src/
│   └── package.json
├── Frontend/          # Aplicación Vue.js
│   ├── src/
│   ├── public/
│   └── package.json
│   └──.env             #Tú lo vas a poner manualmente
└── README.md
```

---

## 🛠️ Scripts Disponibles

### Backend

```bash
npm start      # Ejecutar servidor en producción
npm run dev    # Ejecutar servidor en modo desarrollo (con nodemon)
```

### Frontend

```bash
npm run dev      # Servidor de desarrollo con hot-reload
npm run build    # Compilar para producción
npm run preview  # Vista previa del build de producción
npm run lint     # Ejecutar linter (ESLint)
npm run format   # Formatear código (Prettier)
```

---


## 🎨 Frontend con Vue.js

El frontend utiliza Vue 3 con la Composition API y las siguientes herramientas:

* **Vite:** Build tool ultra-rápido con HMR (Hot Module Replacement)
* **Pinia:** Store de estado (sucesor de Vuex)
* **Vue Router:** Navegación entre vistas
* **Supabase:** Backend-as-a-Service para autenticación y base de datos

---

## 📧 Contacto

Para más información sobre el proyecto, contacta al equipo de desarrollo..
