export const REQUEST_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0',
    Accept: '*/*',
    'Accept-Language': 'pl,en-US;q=0.7,en;q=0.3',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    Referer: 'https://www.peka.poznan.pl/km/history',
    'content-type': 'application/json',
    Origin: 'https://www.peka.poznan.pl',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    DNT: '1',
    'Sec-GPC': '1',
    Priority: 'u=4',
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
