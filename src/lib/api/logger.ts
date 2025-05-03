import omit from 'lodash/omit';
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
    log: (object: any) => {
      if (object instanceof Error) {
        return {
          message: object.message,
          stack: object.stack,
          ...omit(object, ['message', 'stack']),
        };
      }
      return object;
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
