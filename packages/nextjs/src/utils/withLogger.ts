import type { NextMiddleware } from "next/server"

import { LogLevel,middlewareLogger } from "./logger"

export interface WithLoggerOptions {
  debug?: boolean
  logLevel?: LogLevel
}

export function createEdgeCompatibleLogger(debug: boolean = false) {
  if (debug) {
    middlewareLogger.enable()
    middlewareLogger.setLevel(LogLevel.DEBUG)
  }
  
  return {
    logStart: (requestId: string, method: string, url: string) => {
      middlewareLogger.debug(`[${requestId}] Middleware started for ${method} ${url}`)
    },
    logEnd: (requestId: string, duration: number) => {
      middlewareLogger.debug(`[${requestId}] Middleware completed in ${duration.toFixed(2)}ms`)
    },
    logError: (requestId: string, duration: number, error: unknown) => {
      middlewareLogger.error(
        `[${requestId}] Middleware failed after ${duration.toFixed(2)}ms:`,
        error instanceof Error ? error.message : 'Unknown error'
      )
    },
    debug: (message: string, ...args: any[]) => middlewareLogger.debug(message, ...args),
    info: (message: string, ...args: any[]) => middlewareLogger.info(message, ...args),
    warn: (message: string, ...args: any[]) => middlewareLogger.warn(message, ...args),
    error: (message: string, ...args: any[]) => middlewareLogger.error(message, ...args),
  }
}

export const withLogger = (
  middleware: NextMiddleware,
  options: WithLoggerOptions = {}
): NextMiddleware => {
  const { debug = false, logLevel = LogLevel.INFO } = options

  if (debug) {
    middlewareLogger.enable()
    middlewareLogger.setLevel(LogLevel.DEBUG)
  } else {
    middlewareLogger.setLevel(logLevel)
  }

  return async (request, event) => {
    const startTime = performance.now()
    const requestId = crypto.randomUUID().slice(0, 8)
    
    middlewareLogger.debug(`[${requestId}] Middleware started for ${request.method} ${request.url}`)

    try {
      const result = await middleware(request, event)
      const duration = performance.now() - startTime
      
      middlewareLogger.debug(`[${requestId}] Middleware completed in ${duration.toFixed(2)}ms`)
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      middlewareLogger.error(
        `[${requestId}] Middleware failed after ${duration.toFixed(2)}ms:`,
        error instanceof Error ? error.message : 'Unknown error'
      )
      
      throw error
    }
  }
}