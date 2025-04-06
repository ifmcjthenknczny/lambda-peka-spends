import dayjs from 'dayjs'
import { finalizeScriptContext, initializeScriptContext } from './context'
import { log, logError } from './helpers/util/log'
import { requestTransits } from './actions/requestTransits'
import { toDay } from './helpers/util/date'
import { sendSummary } from './actions/sendSummary'

// import { migration } from './helpers/migration'

export enum ActionType {
    PING = 'PING',
    TEST = 'TEST',
    PEKA_EVERYDAY = 'PEKA_EVERYDAY',
    SUMMARY_MONTHLY = 'SUMMARY_MONTHLY',
    MIGRATION = 'MIGRATION',
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

    switch (config.action) {
        case ActionType.PING:
            log('PONG')
            break
        case ActionType.PEKA_EVERYDAY:
            const day = toDay(dayjs().subtract(2, 'days'))
            await requestTransits(context, { START_DAY: day, END_DAY: day })
            break
        case ActionType.MIGRATION:
            const startDay = '2025-01-01'
            const endDay = '2025-04-05'
            await requestTransits(context, {
                START_DAY: startDay,
                END_DAY: endDay,
            })
            break
        case ActionType.SUMMARY_MONTHLY:
            await sendSummary(context)
            break;
        default:
            logError(`Unknown action: action=${config.action}.`)
    }

    await finalizeScriptContext(context)
}
