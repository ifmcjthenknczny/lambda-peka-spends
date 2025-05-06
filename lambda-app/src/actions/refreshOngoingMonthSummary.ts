import { MUTUAL_HEADERS } from '../request';
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import { ScriptContext } from '../context'
import { toDay } from '../helpers/util/date'
import { sumPrices } from '../client/pekaJourneys'
import { log } from '../helpers/util/log'
import { buildMonthString } from './generateMonthlySummary'
import { clearOngoingMonthSummaries, insertOngoingMonthSummary } from '../client/ongoingMonthSummary'
import axios from 'axios'
import { authenticate } from '../helpers/login'
import { sum } from '../helpers/util/array';

dayjs.locale('pl')

export interface CardResponse {
    code: number
    data: CardData[]
}

export interface CardData {
status: "RESTRICTED_CARD" | "ACTIVE_CARD"
statusDescr: string
number: string
category: string
categoryDescr: string
tpurse: PurseData
orderDuplicate: boolean
showTpurseSingleTicket: boolean
}

export interface PurseData {
balance: number
pointsBalance: number
updateDate?: string
}

const REQUEST_HEADERS = {
    ...MUTUAL_HEADERS,
Referer: 'https://www.peka.poznan.pl/km/account',
Pragma: 'no-cache',
'Cache-Control': 'no-cache'
}

// TODO: plan the places for code better, also try-catch

const getCurrentAccountBalance = async (bearerToken: string) => {
    const response = await axios.get<CardResponse>(
        'https://www.peka.poznan.pl/sop/account/cards?lang=pl',
        {
            headers: {
                ...REQUEST_HEADERS,
                authorization: `Bearer ${bearerToken}`,
            },
        },
    )

    return sum(response.data.data.map((card) => card.status === 'ACTIVE_CARD' ? card.tpurse.balance : 0))
}

export const refreshOngoingMonthSummary = async (context: ScriptContext) => {
    const bearerToken = (await authenticate()).data;
    const balance = await getCurrentAccountBalance(bearerToken)

    await clearOngoingMonthSummaries(context.db)

    const from = toDay(dayjs().startOf('month'))
    const to = toDay(dayjs().endOf('month'))
    const sum = await sumPrices(context.db, from, to)
    const monthString = buildMonthString(0)

    await insertOngoingMonthSummary(context.db, {
        from,
        to,
        sum,
        balance,
        _id: monthString,
    })
    log(`ONGOING MONTH SUMMARY FOR ${monthString} SUCCESSFULLY INSERTED`)
}
