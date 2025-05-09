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
    try {
    const response = await axios.post<AuthenticationResponse>(
        'https://www.peka.poznan.pl/sop/authenticate?lang=pl',
        {
            password: process.env.PASSWORD,
            username: process.env.EMAIL,
        },
        { headers: { ...LOGIN_REQUEST_HEADERS, Priority: 'u=0' } },
    )

    if (response.data.code !== 0) {
        throw new Error(
            'Problem with authentication. Try to login manually with solving captcha on the page https://www.peka.poznan.pl/km/login and rerun the script.',
        )
    }

    return response.data.data
} catch (error: any) {
    throw new Error(`Error during authentication. ${error.message}`)
}
}
