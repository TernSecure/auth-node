export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LoggerOptions {
  enabled: boolean
  level: LogLevel
  prefix: string
}

export class Logger {
  private options: LoggerOptions

  constructor(options: Partial<LoggerOptions> = {}) {
    this.options = {
      enabled: false,
      level: LogLevel.INFO,
      prefix: '[TernSecure-Backend]',
      ...options,
    }
  }

  enable(): void {
    this.options.enabled = true
  }

  disable(): void {
    this.options.enabled = false
  }

  setLevel(level: LogLevel): void {
    this.options.level = level
  }

  setPrefix(prefix: string): void {
    this.options.prefix = prefix
  }

  private log(level: LogLevel, levelName: string, message: string, ...args: any[]): void {
    if (!this.options.enabled || level > this.options.level) {
      return
    }

    const timestamp = new Date().toISOString()
    const formattedMessage = `${timestamp} ${this.options.prefix} [${levelName}] ${message}`
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args)
        break
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args)
        break
      case LogLevel.INFO:
        console.info(formattedMessage, ...args)
        break
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args)
        break
    }
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, 'ERROR', message, ...args)
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, 'WARN', message, ...args)
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, 'INFO', message, ...args)
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, ...args)
  }
}

export const createLogger = (options?: Partial<LoggerOptions>): Logger => {
  return new Logger(options)
}

export const redisLogger = createLogger({ prefix: '[TernSecure-Redis]' })
export const authLogger = createLogger({ prefix: '[TernSecure-Auth]' })