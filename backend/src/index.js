import express from 'express';
import cors from 'cors';
import { loadEnv } from './conf/index.js'; 
import mainRouter from './routes/index.js'; 

// Cargar variables de entorno
loadEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middlewares Esenciales ---
app.use(cors()); // Permite peticiones de otros dominios (tu frontend)
app.use(express.json()); // Permite a Express entender JSON en el body

app.get('/api', (req, res) => {
  res.json({ message: '¡Bienvenido a la API de mi tienda!' });
});

app.use('/api', mainRouter);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});