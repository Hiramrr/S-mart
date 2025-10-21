import { Router } from 'express';
import productoRouter from './productosRoutes.js';

const mainRouter = Router();

mainRouter.use('/productos', productoRouter);
// mainRouter.use('/usuarios', usuarioRouter);
// mainRouter.use('/pedidos', pedidoRouter);

export default mainRouter;