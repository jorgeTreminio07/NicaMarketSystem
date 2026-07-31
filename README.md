# NicaMarket E-Commerce & Backoffice

Este proyecto contiene una arquitectura limpia para la Tienda E-Commerce y el sistema Backoffice integrado con Supabase.

> ⚠️ **IMPORTANTE EN WINDOWS**:
> El nombre de la carpeta descargada no debe contener el símbolo `&` (como `e-commerce-&-backoffice`), ya que en la consola de Windows (CMD/PowerShell) el carácter `&` es un separador de comandos y causa el error `"-backoffice\node_modules\.bin\" no se reconoce`.
>
> **Solución rápida**: Cambia el nombre de la carpeta en tu escritorio de `e-commerce-&-backoffice` a `ecommerce-backoffice`.

## 🚀 Pasos para Instalar y Correr Localmente

### 1. Renombrar Carpeta (Si estás en Windows)
Renombra la carpeta de tu proyecto a `ecommerce-backoffice` (sin el carácter `&`).

### 2. Configurar Variables de Entorno
Copia el archivo `.env.example` a un nuevo archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Asegúrate de que tu `.env` tenga las credenciales de Supabase:

```env
VITE_SUPABASE_URL="https://xjiwhdnrxpsbbegqjicp.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqaXdoZG5yeHBzYmJlZ3FqaWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzNzkyMTgsImV4cCI6MjEwMDk1NTIxOH0.8y6PT2Uyn2ytdc4LfhyzSY_EWNPRmieoYYIaDyPEy3E"
```

---

### 3. Instalar Dependencias
En la terminal dentro de la carpeta renombrada, ejecuta:

```bash
npm install
```

---

### 4. Ejecutar el Servidor de Desarrollo
Para iniciar la aplicación en modo desarrollo:

```bash
npm run dev
```

o con npx:

```bash
npx tsx server.ts
```

Abre tu navegador e ingresa a:
👉 `http://localhost:3000`

---

### 5. Compilar para Producción (Opcional)
Para construir el bundle optimizado y el servidor Express:

```bash
npm run build
npm start
```

---

## 🔒 Accesos Separados

- **Tienda Pública**: `http://localhost:3000/` (Acceso libre para clientes).
- **Backoffice de Administración**: `http://localhost:3000/?admin=true` o presionando el candado en el pie de página (`#backoffice`).
