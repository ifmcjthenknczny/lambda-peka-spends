import { ScriptContext } from '../context'
import * as dotenv from 'dotenv'
import axios from 'axios'
import dayjs from 'dayjs'
import { authenticate } from '../helpers/login'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { paramsSchema } from '../schema'
import { log, logError, logWarn } from '../helpers/util/log'
import { Day, toDay } from '../helpers/util/date'
import { validate } from '../helpers/util/validate'
import { PekaResponse, REQUEST_HEADERS } from '../request'
import {
    DbPekaJourney,
    insertPekaJourneys,
    toDbPekaJourney,
} from '../client/pekaJourneys'

dayjs.extend(isSameOrAfter)
dotenv.config()

async function makeRequest(pageNumber: number, bearerToken: string) {
    const response = await axios.post<PekaResponse>(
        'https://www.peka.poznan.pl/sop/transaction/point/list?lang=pl',
        {
            pageNumber,
            pageSize: 100,
        },
        {
            headers: {
                ...REQUEST_HEADERS,
                authorization: `Bearer ${bearerToken}`,
            },
        },
    )
    return response.data.data
}

export type Params = {
    START_DAY: Day
    END_DAY: Day
}

export const requestTransits = async (
    context: ScriptContext,
    params: Params,
) => {
    const {
        START_DAY,
        END_DAY,
        errors: validationErrors,
    } = validate(params, paramsSchema)

    if (validationErrors) {
        validationErrors.forEach((error: any) => logError(error))
        return
    }

    const { data: bearerToken, code } = await authenticate()

    if (code !== 0) {
        logError(
            'Problem with authentication. Try to login manually with solving captcha on the page https://www.peka.poznan.pl/km/login and rerun the script.',
        )
        return
    }

    let hasFinishedEarly = false
    let earliestDate = ''

    const firstPage = await makeRequest(0, bearerToken)
    const totalPages = firstPage.totalPages

    const cachedJourneys: DbPekaJourney[] = []

    for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
        const { content } =
            pageNumber === 0
                ? firstPage
                : await makeRequest(pageNumber, bearerToken)
        for (const transit of content) {
            const { transactionDate, transactionType, transactionStatus } =
                transit
            if (dayjs(toDay(transactionDate)).isAfter(dayjs(END_DAY))) {
                continue
            }
            if (dayjs(toDay(transactionDate)).isBefore(dayjs(START_DAY))) {
                break
            }
            if (
                transactionType === 'Przejazd' &&
                transactionStatus === 'Potwierdzona'
            ) {
                cachedJourneys.push(toDbPekaJourney(transit))
            }
        }
        // total pages is eg. 5, but pageNumber starts from 0
        if (
            pageNumber === totalPages - 1 &&
            dayjs(START_DAY).isBefore(
                dayjs(toDay(content.at(-1)!.transactionDate)),
            )
        ) {
            earliestDate = toDay(content.at(-1)!.transactionDate)
            hasFinishedEarly = true
        }
    }

    if (earliestDate) {
        logWarn(
            'PREMATURELY REACHED END OF AVAILABLE DATA. NOT ALL DATA MAY BE AVAILABLE FOR GIVEN RANGE',
        )
        log(`Earliest ride date: ${earliestDate}`)
    }
    log(
        `Day range (both sides included): ${
            hasFinishedEarly ? earliestDate : toDay(START_DAY)
        } to ${toDay(END_DAY)}`,
    )
    await insertPekaJourneys(context.db, cachedJourneys)
    log('SUCCESSFULLY INSERTED PEKA JOURNEYS')
}
