type LogLevel = 'info' | 'warn' | 'error';

export class LoggerClass {
  private logLevel: LogLevel = 'info';

  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    // In production, you might want to replace this with a more robust logging solution
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case 'error':
        console.error(logMessage, meta);
        break;
      case 'warn':
        console.warn(logMessage, meta);
        break;
      default:
        console.log(logMessage, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    if (this.logLevel === 'info') {
      this.log('info', message, meta);
    }
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if (['info', 'warn'].includes(this.logLevel)) {
      this.log('warn', message, meta);
    }
  }

  error(message: string, meta?: Record<string, unknown>) {
    this.log('error', message, meta);
  }
}

// Create a singleton instance
export const logger = new LoggerClass();

// Export type for potential type annotations
export type LoggerType = LoggerClass;