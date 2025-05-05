import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import { ScriptContext } from '../context'
import { toDay } from '../helpers/util/date'
import { sumPrices } from '../client/pekaJourneys'
import { log } from '../helpers/util/log'
import { buildMonthString } from './generateMonthlySummary'
import { clearOngoingMonthSummaries, insertOngoingMonthSummary } from '../client/ongoingMonthSummary'

dayjs.locale('pl')

export const refreshOngoingMonthSummary = async (context: ScriptContext) => {
    await clearOngoingMonthSummaries(context.db)

    const from = toDay(dayjs().startOf('month'))
    const to = toDay(dayjs().endOf('month'))
    const sum = await sumPrices(context.db, from, to)
    const monthString = buildMonthString(0)

    await insertOngoingMonthSummary(context.db, {
        from,
        to,
        sum,
        _id: monthString,
    })
    log(`ONGOING MONTH SUMMARY FOR ${monthString} SUCCESSFULLY INSERTED`)
}
