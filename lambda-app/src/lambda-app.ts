import { finalizeScriptContext, initializeScriptContext } from './context'
import { log, logError } from './helpers/util/log'

// import { migration } from './helpers/migration'

export enum ActionType {
    PING = 'PING',
    MIGRATION = 'MIGRATION',
    TEST = 'TEST',
}

interface AppConfig {
    action: ActionType
    executionId: string
    rawEvent: string | null
    runningLocal: boolean
}

export async function lambda(config: AppConfig) {
    log(`Starting execution: config=${JSON.stringify(config)}.`)
    const context = await initializeScriptContext(config.executionId)
    // const migrationFunction = 

    switch (config.action) {
        case ActionType.PING:
            log('PONG')
            break
        // case ActionType.MIGRATION:
        //     await migration(context, migrationFunction)
        //     break
        case ActionType.TEST:
            log('TEST')
            break
        default:
            logError(`Unknown action: action=${config.action}.`)
    }

    await finalizeScriptContext(context)
}
