import { ScriptContext } from '../context'
import * as dotenv from 'dotenv'
import dayjs from 'dayjs'
import { authenticate } from '../requests/login'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { paramsSchema } from '../schema'
import { log, logError, logWarn } from '../helpers/logs'
import { Day, toDay } from '../helpers/date'
import { validate } from '../helpers/validate'
import {
    DbPekaJourney,
    insertPekaJourneys,
    toDbPekaJourney,
} from '../client/pekaJourneys'
import { getTransitsPage } from '../requests/transits'

dayjs.extend(isSameOrAfter)
dotenv.config()

export type Params = {
    START_DAY: Day
    END_DAY: Day
}

export const requestAndProcessTransits = async (
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

    const firstPage = await getTransitsPage(0, bearerToken)
    const totalPages = firstPage.totalPages

    const cachedJourneys: DbPekaJourney[] = []

    let shouldBreakMainLoop = false

    for (let pageNumber = 0; pageNumber < totalPages; pageNumber++) {
        if (shouldBreakMainLoop) {
            break
        }
        const { content } =
            pageNumber === 0
                ? firstPage
                : await getTransitsPage(pageNumber, bearerToken)
        for (const transit of content) {
            const { transactionDate, transactionType, transactionStatus } =
                transit
            if (dayjs(toDay(transactionDate)).isAfter(dayjs(END_DAY))) {
                continue
            }
            if (dayjs(toDay(transactionDate)).isBefore(dayjs(START_DAY))) {
                shouldBreakMainLoop = true
                break
            }
            if (
                transactionType === 'Przejazd' &&
                transactionStatus === 'Potwierdzona'
            ) {
                cachedJourneys.push(toDbPekaJourney(transit))
            }
        }
        // pageNumber is actually the index of the page, so we need to add 1 to it
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
            `PREMATURELY REACHED END OF AVAILABLE DATA. NOT ALL DATA MAY BE AVAILABLE FOR GIVEN RANGE. Earliest ride date: ${earliestDate}`,
        )
    }
    log(
        `Day range (both sides included): ${
            hasFinishedEarly ? earliestDate : toDay(START_DAY)
        } to ${toDay(END_DAY)}`,
    )
    await insertPekaJourneys(context.db, cachedJourneys)
    log('SUCCESSFULLY INSERTED PEKA JOURNEYS')
}
