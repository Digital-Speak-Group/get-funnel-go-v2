type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  orgId?: string;
  deckId?: string;
  [key: string]: unknown;
}

class Logger {
  private format(level: LogLevel, message: string, ctx?: LogContext) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...ctx,
    };
    return JSON.stringify(payload);
  }

  info(message: string, ctx?: LogContext) {
    console.log(this.format("info", message, ctx));
  }

  warn(message: string, ctx?: LogContext) {
    console.warn(this.format("warn", message, ctx));
  }

  error(message: string, error?: unknown, ctx?: LogContext) {
    const errorDetails = error instanceof Error 
      ? { errorMessage: error.message, stack: error.stack }
      : { errorMessage: String(error) };
      
    console.error(this.format("error", message, { ...ctx, ...errorDetails }));
  }

  debug(message: string, ctx?: LogContext) {
    if (process.env.NODE_ENV !== "production") {
      console.debug(this.format("debug", message, ctx));
    }
  }
}

export const logger = new Logger();
