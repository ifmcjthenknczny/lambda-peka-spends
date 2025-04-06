import { Resend } from 'resend'
import { v4 as uuid } from 'uuid'
import dayjs from 'dayjs'
import 'dayjs/locale/pl'
import { ScriptContext } from '../context'
import { toDay } from '../helpers/util/date'
import { sumPrices } from '../client/pekaJourneys'

dayjs.locale('pl')

const resend = new Resend(uuid())

const buildEmailSubject = () => {
    const monthString = dayjs().subtract(1, 'month').format('MMMM YYYY')
    return `Podsumowanie miesiąca PEKA - ${monthString}`
}

const buildEmailHtml = (sum: number) => {
    return `<p>Kolejny wspaniały miesiąc w Poznaniu! Twoja łączna kwota którą wydałeś na przejazdy w zeszłym miesiącu wyniosła ${sum} zł.</p>`
}

const sendEmail = async (sum: number) => {
    await resend.emails.send({
        from: process.env.EMAIL_SENDER!,
        to: process.env.EMAIL!,
        subject: buildEmailSubject(),
        html: buildEmailHtml(sum),
    })
}

export const sendSummary = async (context: ScriptContext) => {
    const from = toDay(dayjs().subtract(1, 'month').startOf('month'))
    const to = toDay(dayjs().subtract(1, 'month').endOf('month'))
    const sum = await sumPrices(context.db, from, to)

    await sendEmail(sum)
}
