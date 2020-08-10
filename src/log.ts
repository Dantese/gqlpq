import * as pino from "pino";

export const logger = pino({
    prettyPrint: {
        ignore: 'pid,hostname,filename,time',
    },
})
