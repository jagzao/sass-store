// Script para responder automáticamente "y" a la pregunta de confirmación
process.stdin.pipe(process.stdout);
setInterval(() => {
  process.stdout.write('y\n');
}, 100);