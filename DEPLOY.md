# Deploy a Azure App Service

## Arquitectura

```
            Internet
                │
                ▼
┌──────────────────────────────────────┐
│  Azure App Service: master-list-ta   │
│  ─ Node.js 22.x                      │
│  ─ Una sola URL                      │
│                                       │
│  Express (backend/dist/server.js)    │
│    ├─ /api/*       → endpoints REST  │
│    └─ /*           → frontend SPA    │
│                                       │
└────────────┬─────────────────────────┘
             │ Cosmos SDK
             ▼
┌──────────────────────────────────────┐
│  Azure Cosmos DB: master-list-ta     │
│  ├─ portfolio-db / initiatives       │
│  └─ portfolio-db / comments          │
└──────────────────────────────────────┘
```

## Variables de entorno en App Service

Ir a:
**Portal Azure → App Services → master-list-ta → Configuración → Configuración de la aplicación**

Agregar las siguientes "Application settings" (no Connection strings):

| Nombre                          | Valor                                                                                    |
|---------------------------------|------------------------------------------------------------------------------------------|
| `NODE_ENV`                      | `production`                                                                             |
| `COSMOS_ENDPOINT`               | `https://master-list-ta.documents.azure.com:443/`                                       |
| `COSMOS_KEY`                    | _(clave primaria desde Cosmos → Claves)_                                                |
| `COSMOS_DATABASE`               | `portfolio-db`                                                                           |
| `COSMOS_CONTAINER_INITIATIVES`  | `initiatives`                                                                            |
| `COSMOS_CONTAINER_COMMENTS`     | `comments`                                                                               |
| `ADMIN_PASSWORD`                | _(elige una contraseña segura — NO uses `point2026` en prod)_                            |
| `JWT_SECRET`                    | _(genera un string aleatorio de 64+ chars — ver más abajo)_                              |
| `JWT_EXPIRES_IN`                | `12h`                                                                                    |
| `SCM_DO_BUILD_DURING_DEPLOYMENT`| `false` _(opcional — desactiva Oryx, usamos GitHub Actions)_                             |
| `WEBSITE_NODE_DEFAULT_VERSION`  | `~22` _(asegura Node 22 en runtime)_                                                     |

### Generar valores seguros para producción

**JWT_SECRET** — string aleatorio de 64+ caracteres. Opciones:

```bash
# Opción 1: Node
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Opción 2: PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(48))

# Opción 3: Online (no recomendado pero rápido)
# https://generate-secret.vercel.app/64
```

**ADMIN_PASSWORD** — algo que recuerdes pero no sea trivial. Ejemplos válidos:
- `Pnt2026!TA-Master#Az` (mixto, fácil de tipear)
- Una passphrase: `caballo-batería-grapa-correcto-azul` (estilo XKCD)

## Configuración del Startup Command en App Service

App Service ejecuta automáticamente `npm start` si el `package.json` tiene ese script. Ya está configurado:

```json
"start": "node backend/dist/server.js"
```

Si por alguna razón no detecta el start automáticamente:

**Portal Azure → App Service → Configuración → Configuración general → Startup Command:**
```
node backend/dist/server.js
```

## Pipeline de deploy (GitHub Actions)

El workflow `.github/workflows/main_master-list-ta.yml` ya está configurado:

1. Hace `npm ci` (frontend) y `npm run build:frontend` → genera `dist/`
2. Hace `npm ci` y `npm run build` en `backend/` → genera `backend/dist/`
3. Corre `scripts/prepare-deploy.js` → copia `dist/` → `backend/public/`
4. Hace `npm prune --production` en backend → quita devDeps
5. Sube `backend/` como artifact
6. Deploya con `azure/webapps-deploy@v3` usando el publish profile

El secret `AZUREAPPSERVICE_PUBLISHPROFILE` ya está configurado en GitHub.

### Trigger del deploy

- Automático: cada push a `main`
- Manual: GitHub → Actions → "Build and deploy..." → Run workflow

## Checklist antes del primer deploy en producción

- [ ] **Cambiar `ADMIN_PASSWORD`** a algo seguro (NO `point2026`)
- [ ] **Generar `JWT_SECRET`** aleatorio de 64+ caracteres
- [ ] **Regenerar `COSMOS_KEY`** (la actual quedó expuesta en chat del desarrollo)
- [ ] Configurar las **Application settings** en App Service con todos los valores de la tabla
- [ ] Reiniciar el App Service después de configurar las variables (Portal → Overview → Restart)
- [ ] Push a `main` o ejecutar el workflow manualmente
- [ ] Verificar `https://master-list-ta.azurewebsites.net/api/health` → debe responder `{"status":"ok","env":"production"}`
- [ ] Verificar `https://master-list-ta.azurewebsites.net/` → debe cargar el frontend
- [ ] Probar login admin con la nueva contraseña

## Comandos útiles después del deploy

### Ver logs en vivo

```bash
# Con Azure CLI
az webapp log tail --name master-list-ta --resource-group master-list

# O desde el portal:
# App Service → Monitoreo → Flujo de registro
```

### Reiniciar la app

```bash
az webapp restart --name master-list-ta --resource-group master-list
```

### Cambiar una variable de entorno

```bash
az webapp config appsettings set \
  --name master-list-ta \
  --resource-group master-list \
  --settings ADMIN_PASSWORD="nuevoPassword123!"
```

(O desde el portal → Configuration)

## Si el deploy falla

| Síntoma                                       | Causa probable                                              | Solución                                          |
|-----------------------------------------------|-------------------------------------------------------------|---------------------------------------------------|
| `Application Error` en pantalla               | Falta variable de entorno COSMOS_KEY o JWT_SECRET           | Configurar en Application settings y reiniciar    |
| `Cannot find module 'express'`                | `node_modules` no se incluyó en el deploy                   | Verificar que el workflow corra `npm prune --production` y suba `backend/node_modules` |
| `502 Bad Gateway`                             | El proceso no arranca o crashea                              | Revisar logs (`az webapp log tail`)               |
| Frontend muestra "Cannot GET /"               | `backend/public/index.html` no existe                       | Verificar que `prepare-deploy.js` corrió en el build |
| API responde pero CORS falla en producción    | NODE_ENV no es exactamente "production" (con espacio?)      | `process.env.NODE_ENV` se trim()-ea automáticamente, pero revisar el valor en App Service |
| 404 en rutas tipo `/portafolio` al recargar   | SPA catch-all no funciona                                    | Verificar que el server tenga el `app.get('*')` después del static |

## Costos esperados

| Recurso                              | Plan                  | Costo mensual aprox |
|--------------------------------------|-----------------------|---------------------|
| App Service Plan (master-list-ta)    | F1 Free / B1 Basic    | $0 / $13            |
| Cosmos DB (master-list-ta)           | Free tier (1000 RU/s) | $0                  |
| Almacenamiento (artifacts, logs)     | Storage account       | <$1                 |
| **Total estimado**                   |                       | **$0–$14 USD/mes**  |

El Free tier de App Service (F1) tiene limitaciones (60min/día de CPU, sin custom domain SSL, apaga la app si no hay tráfico). Para producción real, B1 ($13/mes) elimina esos límites.
