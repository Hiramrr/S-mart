import { Router } from 'express';
import { Bienvenido } from '../controllers/ProductosControllers.js';

const router = Router();

// ruta de prueba
router.get('/', Bienvenido);

// Así se vería cuando conectemos el controlador:
// router.get('/', getAllProductos);

export default router;