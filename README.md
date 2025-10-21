# Backend de Mi Tienda

Este repositorio contiene el backend (API) para el proyecto "Mi Tienda", construido con Node.js y Express. Está diseñado con una arquitectura escalable (Controladores, Servicios, Modelos) para facilitar el mantenimiento y reducir la deuda técnica.

---

## ¿Qué es y por qué usamos Express.js?

### ¿Qué es Node.js?

`Node.js` es el entorno que nos permite ejecutar código JavaScript fuera del navegador, es decir, en un servidor. Sin embargo, Node por sí solo es de "bajo nivel"; construir una API completa desde cero con él sería muy complejo, verboso y repetitivo.

### ¿Qué es Express.js?

**Express.js** es el "superpoder" de Node.js. Es un framework minimalista, rápido y flexible que se instala sobre Node.js para simplificar radicalmente la creación de aplicaciones web y APIs.

Express nos proporciona un conjunto de herramientas robustas para tareas comunes, como:

* **Manejo de Rutas (Routing):** Define de manera sencilla qué debe hacer el servidor cuando un usuario visita `GET /api/productos` o envía datos a `POST /api/pedidos`.
* **Gestión de Peticiones y Respuestas:** Facilita la lectura de datos enviados por el usuario (JSON, formularios) y el envío de respuestas (HTML, JSON, errores).
* **Middlewares:** Este es el concepto más poderoso de Express. Nos permite crear "funciones intermedias" que se ejecutan en orden. Las usamos para:
    * Verificar si un usuario está autenticado.
    * Validar los datos de entrada.
    * Registrar logs de peticiones.
    * Manejar errores de forma centralizada.

### ¿Por qué es la mejor decisión para este proyecto?

1.  **Flexibilidad (No opinado):** Express no te impone una forma estricta de estructurar tu proyecto. Nos da la libertad de diseñar nuestra propia arquitectura (como la que estamos usando, separada en capas) que se adapta a las necesidades de una tienda en línea.
2.  **Ecosistema Gigante:** Al ser el framework estándar de facto para Node.js, existe una inmensa comunidad. Cualquier funcionalidad que necesitemos (autenticación con JWT, subida de archivos, conexión a bases de datos) probablemente ya tiene un paquete (`npm`) maduro y bien documentado que se integra perfectamente con Express.
3.  **Rendimiento:** Es extremadamente ligero. No añade sobrecarga innecesaria, lo que resulta en una API rápida y eficiente.
4.  **Curva de Aprendizaje:** Es relativamente fácil de empezar a usar, pero su concepto de *middlewares* es lo suficientemente potente como para construir aplicaciones a gran escala.

En resumen, Express nos da la base sólida y las herramientas para construir una API robusta, rápida y mantenible, sin forzarnos a seguir una estructura rígida.

---

## 🚀 Configuración para Desarrollo Local

Sigue estos pasos para levantar el servidor en tu máquina local.

### 1. Prerrequisitos

* **Node.js:** Asegúrate de tener Node.js instalado (se recomienda v18+). Puedes descargarlo [aquí](https://nodejs.org/).
* **Git:** (Opcional, si estás clonando el repositorio).

### 2. Instalar Dependencias

En la raíz del proyecto, ejecuta el siguiente comando para instalar Express y todas las demás dependencias listadas en `package.json`:

```bash
npm install