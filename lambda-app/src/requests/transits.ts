import { MUTUAL_HEADERS } from "./headers"
import axios from 'axios'

export const TRANSIT_REQUEST_HEADERS = {
    ...MUTUAL_HEADERS,
    Referer: 'https://www.peka.poznan.pl/km/history',
    'content-type': 'application/json',
    Origin: 'https://www.peka.poznan.pl',
}

interface Sort {
    sorted: boolean
    empty: boolean
    unsorted: boolean
}
interface Pageable {
    pageNumber: number
    pageSize: number
    sort: Sort
    offset: number
    paged: boolean
    unpaged: boolean
}

interface FellowNormal {
    quantity: number
    price: number
}

interface PassengerNormal {
    quantity: number
    price: number
}

interface Journey {
    day: string
    time: string
    stopsNumber: number
    passengerNormal: PassengerNormal
    fellowNormal?: FellowNormal
}

export interface TransitContent {
    ordinal: number
    transactionId: string
    transactionDate: string
    transactionPlace: string
    transactionType: 'Przejazd' | 'Doładowanie punktów'
    price: number
    transactionStatus: string
    transferredToCard?: boolean
    journey?: Journey
}

export interface TransitData {
    content: TransitContent[]
    pageable: Pageable
    last: boolean
    totalElements: number
    totalPages: number
    first: boolean
    size: number
    number: number
    sort: Sort
    numberOfElements: number
    empty: boolean
}

export interface PekaResponse {
    code: number
    data: TransitData
}

export async function getTransitsPage(pageNumber: number, bearerToken: string) {
    const response = await axios.post<PekaResponse>(
        'https://www.peka.poznan.pl/sop/transaction/point/list?lang=pl',
        {
            pageNumber,
            pageSize: 100,
        },
        {
            headers: {
                ...TRANSIT_REQUEST_HEADERS,
                authorization: `Bearer ${bearerToken}`,
            },
        },
    )
    return response?.data?.data
}