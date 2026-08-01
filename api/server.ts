import { buildExpressApp, loadDataFromSupabase } from '../server.js';

const app = buildExpressApp();

// Cargar el estado real desde Supabase al arrancar la función serverless
loadDataFromSupabase().catch(err => console.log('Error al cargar datos desde Supabase en el arranque:', err));

export default app;
