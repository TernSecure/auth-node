import { authLogger, LogLevel,redisLogger  } from "./logger"

export function enableDebugLogging(): void {
  authLogger.enable()
  authLogger.setLevel(LogLevel.DEBUG)
  
  redisLogger.enable()
  redisLogger.setLevel(LogLevel.DEBUG)
}

export function disableDebugLogging(): void {
  authLogger.disable()
  redisLogger.disable()
}

export function setLogLevel(level: LogLevel): void {
  authLogger.setLevel(level)
  redisLogger.setLevel(level)
}