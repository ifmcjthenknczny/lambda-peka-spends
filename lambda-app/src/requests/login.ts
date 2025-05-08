import axios from 'axios'
import { MUTUAL_HEADERS } from './headers'

type AuthenticationResponse = {
    code: number
    data: string // bearer token
}

export const LOGIN_REQUEST_HEADERS = {
    ...MUTUAL_HEADERS,
    Referer: 'https://www.peka.poznan.pl/km/history',
    'content-type': 'application/json',
    Origin: 'https://www.peka.poznan.pl',
}

export const authenticate = async () => {
    const response = await axios.post<AuthenticationResponse>(
        'https://www.peka.poznan.pl/sop/authenticate?lang=pl',
        {
            password: process.env.PASSWORD,
            username: process.env.EMAIL,
        },
        { headers: { ...LOGIN_REQUEST_HEADERS, Priority: 'u=0' } },
    )
    return response.data
}
