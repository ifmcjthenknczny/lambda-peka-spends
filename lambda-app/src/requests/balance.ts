import { MUTUAL_HEADERS } from "./headers"
import axios from "axios"
import { sum } from "../helpers/array"

export interface CardResponse {
    code: number
    data: CardData[]
}

export interface CardData {
    status: 'RESTRICTED_CARD' | 'ACTIVE_CARD'
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

const BALANCE_REQUEST_HEADERS = {
    ...MUTUAL_HEADERS,
    Referer: 'https://www.peka.poznan.pl/km/account',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
}

export const getCurrentAccountBalance = async (bearerToken: string) => {
    try {
    const response = await axios.get<CardResponse>(
        'https://www.peka.poznan.pl/sop/account/cards?lang=pl',
        {
            headers: {
                ...BALANCE_REQUEST_HEADERS,
                authorization: `Bearer ${bearerToken}`,
            },
        },
    )

    return sum(
        response.data.data.map((card) =>
            card.status === 'ACTIVE_CARD' ? card.tpurse.balance : 0,
        ),
    )
}
     catch (error: any) {
        throw new Error(`Error during fetching account balance. ${error.message}`)
    }
}