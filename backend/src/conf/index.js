import dotenv from 'dotenv';

export const loadEnv = () => {
  const result = dotenv.config();

  if (result.error) {
    console.error('Error: No se pudo cargar el archivo .env');
  }
};