#!/usr/bin/env node
// @ts-nocheck
/**
 * Auto-Resume Daemon
 * Watchdog continuo que revisa y reanuda sesiones automáticamente
 */

import { autoResume } from "./autoresume";
import { logger } from "./logger";

class AutoResumeDaemon {
  private intervalId?: NodeJS.Timeout;
  private checkIntervalMs: number = 5 * 60 * 1000; // 5 minutos por defecto

  /**
   * Iniciar daemon
   */
  start(): void {
    const config = autoResume.readConfig();

    if (!config.enabled) {
      logger.warn(
        "DAEMON",
        "autoresume",
        "Autoresume está deshabilitado en config"
      );
      return;
    }

    // Usar intervalo fijo de 5 minutos (el sistema usa windows para scheduling)
    // El daemon solo verifica periódicamente si hay bundles listos

    logger.info(
      "DAEMON",
      "autoresume",
      `Iniciando daemon con intervalo de ${this.checkIntervalMs / 60000} minutos`
    );

    // Ejecutar inmediatamente
    this.check();

    // Programar ejecuciones periódicas
    this.intervalId = setInterval(() => {
      this.check();
    }, this.checkIntervalMs);

    // Mantener el proceso vivo
    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());

    logger.ok(
      "DAEMON",
      "autoresume",
      "✅ Daemon iniciado - Presiona Ctrl+C para detener"
    );
  }

  /**
   * Ejecutar chequeo de auto-resume
   */
  private async check(): Promise<void> {
    try {
      logger.debug(
        "DAEMON",
        "autoresume",
        "🔍 Verificando sesiones para reanudar..."
      );
      await autoResume.run();
    } catch (error) {
      logger.error("DAEMON", "autoresume", `Error en chequeo: ${error}`);
    }
  }

  /**
   * Detener daemon
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      logger.info("DAEMON", "autoresume", "⏹️  Daemon detenido");
    }
    process.exit(0);
  }
}

// Ejecutar daemon
const daemon = new AutoResumeDaemon();
daemon.start();
