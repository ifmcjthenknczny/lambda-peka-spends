import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import { ScriptContext } from '../context'
import { toDay } from '../helpers/date'
import { sumPrices } from '../client/pekaJourneys'
import { insertMonthlySummary } from '../client/monthlySummary'
import { log } from '../helpers/logs'

dayjs.locale('pl')

export const buildMonthString = (monthsAgo: number) =>
    dayjs().subtract(monthsAgo, 'month').format('MMMM YYYY')

export const generateMonthlySummary = async (
    context: ScriptContext,
    monthsAgo = 1,
) => {
    const from = toDay(dayjs().subtract(monthsAgo, 'month').startOf('month'))
    const to = toDay(dayjs().subtract(monthsAgo, 'month').endOf('month'))
    const sum = await sumPrices(context.db, from, to)
    const monthString = buildMonthString(monthsAgo)

    await insertMonthlySummary(context.db, { from, to, sum, _id: monthString })
    log(`MONTHLY SUMMARY FOR ${monthString} SUCCESSFULLY INSERTED`)
}
