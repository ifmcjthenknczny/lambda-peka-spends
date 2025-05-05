import dayjs from 'dayjs'
import { finalizeScriptContext, initializeScriptContext } from './context'
import { log, logError } from './helpers/util/log'
import { requestTransits } from './actions/requestTransits'
import { toDay } from './helpers/util/date'
import { sumPrices } from './client/pekaJourneys'
import { generateMonthlySummary } from './actions/generateMonthlySummary'
import { refreshOngoingMonthSummary } from './actions/refreshOngoingMonthSummary'

export enum ActionType {
    PING = 'PING',
    TEST = 'TEST',
    PEKA_EVERYDAY = 'PEKA_EVERYDAY',
    SUMMARY_MONTHLY = 'SUMMARY_MONTHLY',
    SUM_CURRENT_MONTH_PRICES = 'SUM_CURRENT_MONTH_PRICES',
    SUMMARY_MONTHLY_MIGRATION = 'SUMMARY_MONTHLY_MIGRATION',
    MIGRATE_EXISTING_PEKA_DATA = 'MIGRATE_EXISTING_PEKA_DATA',
    ONGOING_MONTH_SUMMARY = 'ONGOING_MONTH_SUMMARY',
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
        case ActionType.SUM_CURRENT_MONTH_PRICES:
            // just sums and logs prices for the current month
            const from = toDay(dayjs().startOf('month'))
            const to = toDay(dayjs().endOf('month'))
            const sum = await sumPrices(context.db, from, to)
            log(`${sum} zł`)
            break
        case ActionType.ONGOING_MONTH_SUMMARY:
            await refreshOngoingMonthSummary(context)
            break;
        case ActionType.SUMMARY_MONTHLY:
            await generateMonthlySummary(context)
            break
        case ActionType.SUMMARY_MONTHLY_MIGRATION:
            const monthsAgo = 2
            await generateMonthlySummary(context, monthsAgo)
            break
        case ActionType.MIGRATE_EXISTING_PEKA_DATA:
            // migrates 12 months of data backwards
            const monthsBackwards = 12
            await requestTransits(context, {
                START_DAY: toDay(
                    dayjs()
                        .subtract(monthsBackwards, 'months')
                        .startOf('month'),
                ),
                END_DAY: toDay(dayjs()),
            })
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const summaryJobs = [...Array(monthsBackwards - 1)].map((_, i) =>
                generateMonthlySummary(context, i + 1),
            )
            await Promise.all(summaryJobs)
            log(
                `Successfully migrated ${monthsBackwards} months of available data`,
            )
            break
        default:
            logError(`Unknown action: action=${config.action}.`)
    }

    await finalizeScriptContext(context)
}
