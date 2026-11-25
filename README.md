# PhotoRecord

Aplicación React + TypeScript + Vite, organizada como los proyectos de WorkPanel. La interfaz se adapta a móvil, tablet y ordenador, con navegación lateral y álbumes en varias columnas en pantallas amplias. Permite guardar recuerdos por mes, personalizar álbumes y crear collages.

## Desarrollo

Requiere Node.js compatible con Vite (20.19 o posterior). Desde esta carpeta:

```powershell
npm.cmd install
npm.cmd run dev
```

Abre la dirección que muestra Vite. Para comprobar y compilar:

```powershell
npm.cmd test
npm.cmd run build
```

## Estructura

- `src/App.tsx`: pantalla principal y coordinación de los flujos.
- `src/App.css`: estilos adaptables, con clases específicas de PhotoRecord.
- `src/components/`: formularios, ventanas y representación de recuerdos.
- `src/data/domain.ts`: agrupación y ordenación de álbumes.
- `src/data/repository.ts`: contrato y almacenamiento local.
- `src/types.ts`: modelos de recuerdos, álbumes y collages.

## Datos y futura integración

Actualmente los datos se guardan en `localStorage`, solo en el navegador o WebView de esta aplicación. Las fotos seleccionadas se comprimen como JPEG; la cuota de almacenamiento es limitada y se muestra un error si no se puede guardar. No hay servidor, sincronización, copia de seguridad ni conexión a BBDD. Las imágenes de ejemplo requieren conexión. Los collages referencian los recuerdos originales y se renderizan en la aplicación; no son archivos de imagen exportados.

El componente `App` acepta opcionalmente un `PhotoRecordRepository` con los métodos asíncronos `load()` y `save(state)`. Para una BBDD real habrá que implementar ese contrato, gestionar el almacenamiento de fotos, migrar los datos existentes y definir autenticación, permisos y sincronización. Sustituir solo el repositorio no convierte las fotos en archivos remotos automáticamente.

El formato y la clave de almacenamiento web de la versión Expo anterior se mantienen, pero `localStorage` pertenece a cada origen (protocolo, dominio y puerto). Si Vite se sirve desde otro origen, o al incluirlo en un WebView de WorkPanel, no verá automáticamente esos datos; hay que migrarlos explícitamente. Los datos nativos de Expo tampoco se migran de forma automática. El prototipo HTML utiliza otro formato y no se importa.

La aplicación todavía **no está integrada** en WorkPanel de escritorio ni en WorkPanel Android. Compartir los componentes con ambos requiere incorporarlos a sus compilaciones, importar sus estilos y conectar un repositorio apropiado para cada plataforma. Las rutas de almacenamiento y el origen del WebView deben decidirse antes de migrar datos; una integración no comparte por sí sola el almacenamiento entre aplicaciones.
