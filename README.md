# Atria Boards

Clon de Monday.com — React + Vite + Tailwind + Supabase.

## Puesta en marcha

### 1. Base de datos (Supabase)

Abre tu proyecto en Supabase → **SQL Editor** → pega y ejecuta el contenido completo de:

```
migrations/003_full_reset.sql
```

⚠️ **Esto elimina todas las tablas de la app y sus datos** (workspaces, boards, tareas, comentarios, etc). NO toca `auth.users`; los usuarios que ya iniciaron sesión se conservan y se les recrea el perfil automáticamente. Ejecútalo una sola vez.

El script deja todo listo: tablas, RLS correcto (incluye el fix del error 42501), triggers de notificaciones, Realtime y el bucket de Storage `task-files`.

### 2. Variables de entorno

Crea un archivo `.env` en la raíz (copia de `.env.example`):

```
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

### 3. Instalar y arrancar

```bash
npm install
npm run dev
```

## Notas

- **Invitar miembros:** la persona debe haber iniciado sesión en la app al menos una vez (para que exista su perfil). Luego se la invita por email desde el botón de miembros del workspace.
- **Realtime:** si los cambios entre usuarios no aparecen al instante, revisa en Supabase → Database → Replication que las tablas `tasks`, `task_values`, `comments` y `notifications` estén en la publicación `supabase_realtime` (el script las añade, pero conviene confirmarlo).
- **Google OAuth:** ya debe estar configurado en Supabase → Authentication → Providers. El redirect usa `window.location.origin`, así que añade tu dominio de Vercel a las Redirect URLs cuando despliegues.

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Importa en Vercel (framework: Vite, no necesita configuración extra).
3. Añade las dos variables `VITE_*` en Settings → Environment Variables.
4. Añade la URL de producción a las Redirect URLs de Google en Supabase.
