import dayjs from 'dayjs'
import { finalizeScriptContext, initializeScriptContext } from './context'
import { log, logError } from './helpers/logs'
import { requestAndProcessTransits } from './actions/requestTransits'
import { toDay } from './helpers/date'
import { generateMonthlySummary } from './actions/generateMonthlySummary'
import { refreshOngoingMonthSummary } from './actions/refreshOngoingMonthSummary'
import { migrateExistingPekaData } from './actions/migrateExistingPekaData'

export enum ActionType {
    PING = 'PING',
    TEST = 'TEST',
    PEKA_EVERYDAY = 'PEKA_EVERYDAY',
    SUMMARY_MONTHLY = 'SUMMARY_MONTHLY',
    MIGRATE_EXISTING_PEKA_DATA = 'MIGRATE_EXISTING_PEKA_DATA',
    ONGOING_MONTH_SUMMARY = 'ONGOING_MONTH_SUMMARY',
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
            const SCRAPE_TRANSITS_DAYS_BEFORE = 2
            const day = toDay(
                dayjs().subtract(SCRAPE_TRANSITS_DAYS_BEFORE, 'days'),
            )
            await requestAndProcessTransits(context, {
                START_DAY: day,
                END_DAY: day,
            })
            break
        case ActionType.ONGOING_MONTH_SUMMARY:
            await refreshOngoingMonthSummary(context)
            break
        case ActionType.SUMMARY_MONTHLY:
            await generateMonthlySummary(context)
            break
        case ActionType.MIGRATE_EXISTING_PEKA_DATA:
            // migrates up to 12 months of data backwards
            await migrateExistingPekaData(context)
            break
        default:
            logError(`Unknown action: action=${config.action}.`)
    }

    await finalizeScriptContext(context)
}
