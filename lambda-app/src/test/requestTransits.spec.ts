/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { requestTransits, Params } from '../actions/requestTransits'
import { ScriptContext } from '../context'
import * as loginHelper from '../helpers/login'
import * as validationHelper from '../helpers/util/validate'
import * as logHelper from '../helpers/util/log'
import * as dbClient from '../client/pekaJourneys'
import axios from 'axios'
import { PekaResponse, TransitData } from '../request'
import { Day, toDay } from '../helpers/util/date'
import { ZodError } from 'zod'

jest.mock('axios')
jest.mock('../helpers/login')
jest.mock('../helpers/util/validate')
jest.mock('../helpers/util/log')
jest.mock('../client/pekaJourneys')
jest.mock('dotenv', () => ({
    config: jest.fn(),
}))

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedAuthenticate = loginHelper.authenticate as jest.Mock
const mockedValidate = validationHelper.validate as jest.Mock
const mockedLog = logHelper.log as jest.Mock
const mockedLogError = logHelper.logError as jest.Mock
const mockedLogWarn = logHelper.logWarn as jest.Mock
const mockedInsertPekaJourneys = dbClient.insertPekaJourneys as jest.Mock

const BASE_URL = 'https://www.peka.poznan.pl/sop/transaction/point/list?lang=pl'

const SORT_PARAMS = {
    sort: {
        sorted: true,
        empty: false,
        unsorted: false,
    },
}

const PAGE_PARAMS = {
    pageable: {
        pageNumber: 1,
        pageSize: 10,
        offset: 10,
        paged: true,
        unpaged: false,
        ...SORT_PARAMS,
    },
}

describe('requestTransits Action', () => {
    let mockContext: ScriptContext
    let mockParams: Params

    beforeEach(() => {
        jest.clearAllMocks()

        mockContext = {
            db: {} as any,
            executionId: 'xxx',
            now: new Date(),
        }

        mockParams = {
            START_DAY: '2023-10-01' as Day,
            END_DAY: '2023-10-31' as Day,
        }

        mockedValidate.mockReturnValue({
            START_DAY: mockParams.START_DAY,
            END_DAY: mockParams.END_DAY,
            errors: null,
        })

        mockedAuthenticate.mockResolvedValue({
            code: 0,
            data: 'mock-bearer-token',
            message: 'Success',
        })

        mockedInsertPekaJourneys.mockResolvedValue(undefined)
    })

    it('should fetch, filter, transform, and insert journeys correctly', async () => {
        const mockApiResponsePage0: TransitData = {
            content: [
                {
                    transactionId: '5',
                    transactionDate: '2023-11-01T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '6',
                    transactionDate: '2023-10-20T14:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Anulowana',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '1',
                    transactionDate: '2023-10-15T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
            ],
            totalPages: 2,
            totalElements: 30,
            number: 0,
            size: 100,
            numberOfElements: 3,
            first: true,
            last: false,
            empty: false,
            ...PAGE_PARAMS,
            ...SORT_PARAMS,
        }
        const mockApiResponsePage1: TransitData = {
            content: [

                {
                    transactionId: '4',
                    transactionDate: '2023-10-10T08:00:00',
                    transactionType: 'Doładowanie punktów',
                    transactionStatus: 'Potwierdzona',
                    price: 50.0,
                    ordinal: 1,
                    transactionPlace: 'Internet',
                },
                {
                    transactionId: '3',
                    transactionDate: '2023-10-05T12:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.5,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '2',
                    transactionDate: '2023-09-30T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
            ],
            totalPages: 2,
            totalElements: 30,
            number: 1,
            size: 100,
            numberOfElements: 3,
            first: false,
            last: true,
            empty: false,
            ...PAGE_PARAMS,
            ...SORT_PARAMS,
        }

        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
                    data: mockApiResponsePage0,
                    code: 0,
                    message: 'Success',
                } as PekaResponse,
            })
            .mockResolvedValueOnce({
                data: {
                    data: mockApiResponsePage1,
                    code: 0,
                    message: 'Success',
                } as PekaResponse,
            })

        await requestTransits(mockContext, mockParams)

        expect(mockedValidate).toHaveBeenCalledTimes(1)

        expect(mockedAuthenticate).toHaveBeenCalledTimes(1)

        expect(mockedAxios.post).toHaveBeenCalledTimes(2)
        expect(mockedAxios.post).toHaveBeenCalledWith(
            BASE_URL,
            { pageNumber: 0, pageSize: 100 },
            {
                headers: expect.objectContaining({
                    authorization: 'Bearer mock-bearer-token',
                }),
            },
        )
        expect(mockedAxios.post).toHaveBeenCalledWith(
            BASE_URL,
            { pageNumber: 1, pageSize: 100 },
            {
                headers: expect.objectContaining({
                    authorization: 'Bearer mock-bearer-token',
                }),
            },
        )

        expect(mockedInsertPekaJourneys).toHaveBeenCalledTimes(1)
        expect(mockedInsertPekaJourneys).toHaveBeenCalledWith(mockContext.db, [
            dbClient.toDbPekaJourney(mockApiResponsePage0.content[0]),
            dbClient.toDbPekaJourney(mockApiResponsePage1.content[0]),
        ])

        expect(mockedLog).toHaveBeenCalledWith(
            expect.stringContaining(
                'Day range (both sides included): 2023-10-01 to 2023-10-31',
            ),
        )
        expect(mockedLog).toHaveBeenCalledWith(
            'SUCCESSFULLY INSERTED PEKA JOURNEYS',
        )
        expect(mockedLogError).not.toHaveBeenCalled()
        expect(mockedLogWarn).not.toHaveBeenCalled()
    })

    it('should log errors and return early if validation fails', async () => {
        const validationErrors = [
            new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'undefined',
                    path: ['START_DAY'],
                    message: 'Required',
                },
            ]),
        ]
        mockedValidate.mockReturnValue({
            START_DAY: undefined,
            END_DAY: mockParams.END_DAY,
            errors: validationErrors,
        })

        await requestTransits(mockContext, mockParams)

        expect(mockedValidate).toHaveBeenCalledTimes(1)
        expect(mockedLogError).toHaveBeenCalledTimes(validationErrors.length)
        expect(mockedLogError).toHaveBeenCalledWith(validationErrors[0])

        expect(mockedAuthenticate).not.toHaveBeenCalled()
        expect(mockedAxios.post).not.toHaveBeenCalled()
        expect(mockedInsertPekaJourneys).not.toHaveBeenCalled()
        expect(mockedLog).not.toHaveBeenCalled()
    })

    it('should log error and return early if authentication fails', async () => {
        mockedAuthenticate.mockResolvedValue({
            code: 1,
            data: null,
            message: 'Authentication failed',
        })

        await requestTransits(mockContext, mockParams)

        expect(mockedValidate).toHaveBeenCalledTimes(1)
        expect(mockedAuthenticate).toHaveBeenCalledTimes(1)
        expect(mockedLogError).toHaveBeenCalledTimes(1)
        expect(mockedLogError).toHaveBeenCalledWith(
            expect.stringContaining('Problem with authentication'),
        )

        expect(mockedAxios.post).not.toHaveBeenCalled()
        expect(mockedInsertPekaJourneys).not.toHaveBeenCalled()
        expect(mockedLog).not.toHaveBeenCalled()
    })

    it('should log warning if available data does not cover START_DAY', async () => {
        mockParams.START_DAY = '2023-01-01' as Day
        mockedValidate.mockReturnValue({
            START_DAY: mockParams.START_DAY,
            END_DAY: mockParams.END_DAY,
            errors: null,
        })

        const earliestTransactionDate = '2023-09-15T10:00:00'
        const mockApiResponsePage0: TransitData = {
            content: [
                {
                    transactionId: '1',
                    transactionDate: '2023-10-15T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '2',
                    transactionDate: earliestTransactionDate,
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
            ],
            totalPages: 1,
            totalElements: 2,
            number: 0,
            size: 100,
            numberOfElements: 2,
            first: true,
            last: true,
            empty: false,
            ...PAGE_PARAMS,
            ...SORT_PARAMS,
        }

        mockedAxios.post.mockResolvedValueOnce({
            data: { data: mockApiResponsePage0, code: 0, message: 'Success' },
        })

        await requestTransits(mockContext, mockParams)

        expect(mockedAxios.post).toHaveBeenCalledTimes(1)
        expect(mockedInsertPekaJourneys).toHaveBeenCalledTimes(1)
        expect(mockedInsertPekaJourneys).toHaveBeenCalledWith(mockContext.db, [
            dbClient.toDbPekaJourney(mockApiResponsePage0.content[0]),
            dbClient.toDbPekaJourney(mockApiResponsePage0.content[1]),
        ])

        expect(mockedLogWarn).toHaveBeenCalledTimes(1)
        expect(mockedLogWarn).toHaveBeenCalledWith(
            expect.stringContaining(
                `PREMATURELY REACHED END OF AVAILABLE DATA. NOT ALL DATA MAY BE AVAILABLE FOR GIVEN RANGE. Earliest ride date: ${toDay(earliestTransactionDate)}`,
            ),
        )

        expect(mockedLog).toHaveBeenCalledWith(
            expect.stringContaining(
                `Day range (both sides included): ${toDay(earliestTransactionDate)} to ${mockParams.END_DAY}`,
            ),
        )
        expect(mockedLog).toHaveBeenCalledWith(
            'SUCCESSFULLY INSERTED PEKA JOURNEYS',
        )
        expect(mockedLogError).not.toHaveBeenCalled()
    })

    it('should stop processing pages when a transaction before START_DAY is found', async () => {
        mockParams.START_DAY = '2023-10-10' as Day
        mockedValidate.mockReturnValue({
            START_DAY: mockParams.START_DAY,
            END_DAY: mockParams.END_DAY,
            errors: null,
        })

        const mockApiResponsePage0: TransitData = {
            content: [
                {
                    transactionId: '1',
                    transactionDate: '2023-10-15T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '2',
                    transactionDate: '2023-10-09T12:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
                {
                    transactionId: '3',
                    transactionDate: '2023-10-08T14:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
            ],
            totalPages: 2,
            number: 0,
            size: 100,
            numberOfElements: 3,
            first: true,
            last: false,
            empty: false,
            totalElements: 30,
            ...PAGE_PARAMS,
            ...SORT_PARAMS,
        }
        const mockApiResponsePage1: TransitData = {
            content: [
                {
                    transactionId: '4',
                    transactionDate: '2023-10-05T10:00:00',
                    transactionType: 'Przejazd',
                    transactionStatus: 'Potwierdzona',
                    price: 1.0,
                    ordinal: 1,
                    transactionPlace: 'Kasownik',
                },
            ],
            totalPages: 2,
            number: 1,
            size: 100,
            numberOfElements: 1,
            first: false,
            last: false,
            empty: false,
            totalElements: 30,
            ...PAGE_PARAMS,
            ...SORT_PARAMS,
        }

        mockedAxios.post
            .mockResolvedValueOnce({
                data: {
                    data: mockApiResponsePage0,
                    code: 0,
                    message: 'Success',
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: mockApiResponsePage1,
                    code: 0,
                    message: 'Success',
                },
            })

        await requestTransits(mockContext, mockParams)

        expect(mockedAxios.post).toHaveBeenCalledTimes(1)
        expect(mockedAxios.post).toHaveBeenCalledWith(
            expect.any(String),
            { pageNumber: 0, pageSize: 100 },
            expect.any(Object),
        )

        expect(mockedInsertPekaJourneys).toHaveBeenCalledTimes(1)
        expect(mockedInsertPekaJourneys).toHaveBeenCalledWith(mockContext.db, [
            dbClient.toDbPekaJourney(mockApiResponsePage0.content[0]),
        ])

        expect(mockedLog).toHaveBeenCalledWith(
            expect.stringContaining(
                `Day range (both sides included): ${mockParams.START_DAY} to ${mockParams.END_DAY}`,
            ),
        )
        expect(mockedLog).toHaveBeenCalledWith(
            'SUCCESSFULLY INSERTED PEKA JOURNEYS',
        )
        expect(mockedLogError).not.toHaveBeenCalled()
        expect(mockedLogWarn).not.toHaveBeenCalled()
    })
})
