import { ScriptContext } from '../context'
import { requestAndProcessTransits } from './requestTransits'
import { toDay } from '../helpers/date'
import dayjs from 'dayjs'
import { generateMonthlySummary } from './generateMonthlySummary'
import { log } from 'console'

export const migrateExistingPekaData = async (context: ScriptContext) => {
    const monthsAgo = 12
    await requestAndProcessTransits(context, {
        START_DAY: toDay(
            dayjs().subtract(monthsAgo, 'months').startOf('month'),
        ),
        END_DAY: toDay(dayjs()),
    })
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const summaryJobs = [...Array(monthsAgo - 1)].map((_, i) =>
        generateMonthlySummary(context, i + 1),
    )
    await Promise.all(summaryJobs)
    log(`Successfully migrated ${monthsAgo} months of available data`)
}
