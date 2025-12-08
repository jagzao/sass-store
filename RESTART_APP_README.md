# Cómo Reiniciar la Aplicación SASS Store

He creado dos scripts para reiniciar completamente la aplicación. Puedes usar el que prefieras según tu entorno.

## Opción 1: Usando el Script de PowerShell (recomendado)

1. Haz clic derecho en el archivo [`restart-app.ps1`](restart-app.ps1:1)
2. Selecciona "Ejecutar con PowerShell"
3. Si aparece un mensaje de seguridad, presiona "S" para permitir la ejecución
4. Sigue las instrucciones en pantalla

El script de PowerShell:
- Muestra mensajes en color para facilitar la identificación de cada paso
- Pregunta si deseas reinstalar las dependencias completamente
- Abre una nueva ventana para la aplicación después del reinicio

## Opción 2: Usando el Script de CMD

1. Haz doble clic en el archivo [`restart-app.cmd`](restart-app.cmd:1)
2. Sigue las instrucciones en pantalla

El script de CMD:
- Realiza los mismos pasos que la versión de PowerShell
- Funciona en cualquier versión de Windows sin requerir permisos especiales

## Qué hacen los scripts

Ambos scripts realizan los siguientes pasos:

1. **Detener procesos de Node.js**: Cierra todas las instancias de Node.js que puedan estar usando los puertos 3001 y 4000
2. **Esperar**: Espera 3 segundos para asegurar que todos los procesos se detengan
3. **Limpiar caché de Next.js**: Elimina las carpetas `.next` de las aplicaciones web y API
4. **Limpiar caché de Turbo**: Elimina la carpeta `.turbo` que contiene la caché de compilación
5. **Reinstalar dependencias (opcional)**: Pregunta si deseas eliminar `node_modules` y reinstalar todas las dependencias
6. **Iniciar la aplicación**: Ejecuta `npm run dev` para iniciar el proyecto

## Después del reinicio

Una vez completado el reinicio, la aplicación debería estar disponible en:
- **Aplicación Web**: http://localhost:3001
- **API**: http://localhost:4000

## Si tienes problemas

Si los scripts no se ejecutan correctamente, puedes realizar los pasos manualmente:

1. Abre una terminal como Administrador
2. Ejecuta: `taskkill /F /IM node.exe`
3. Elimina manualmente las carpetas:
   - `apps\web\.next`
   - `apps\api\.next`
   - `.turbo`
4. Ejecuta: `npm run dev`

## Notas importantes

- Ejecuta estos scripts desde la raíz del proyecto (donde se encuentra el archivo `package.json`)
- Si tienes problemas de permisos, ejecuta el script como Administrador
- Si el problema persiste después del reinicio, acepta la opción de reinstalar las dependencias cuando el script lo pregunte