/**
 * Safe logging utility
 * Only logs in development mode, suppresses in production
 */

const isDevelopment = process.env.NODE_ENV === 'development'

function formatMessage(level: string, ...args: unknown[]): string {
  const timestamp = new Date().toISOString()
  return `[${timestamp}] [${level.toUpperCase()}]`
}

export const logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(formatMessage('info'), ...args)
    }
  },
  
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(formatMessage('error'), ...args)
    }
  },
  
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(formatMessage('warn'), ...args)
    }
  },
  
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(formatMessage('info'), ...args)
    }
  },
  
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(formatMessage('debug'), ...args)
    }
  },
}

export default logger
