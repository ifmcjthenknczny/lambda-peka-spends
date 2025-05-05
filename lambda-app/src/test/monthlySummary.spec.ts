/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call */

import mongoose from 'mongoose'
import { insertMonthlySummary } from '../client/monthlySummary'
import { Day } from '../helpers/util/date'
import * as pekaJourneys from '../client/pekaJourneys'
import { sumPrices } from '../client/pekaJourneys'

jest.mock('../client/pekaJourneys')

const mockedPekaJourneys = pekaJourneys as jest.Mocked<typeof pekaJourneys>

describe('Monthly Summaries DB Operations', () => {
    let mockDb: mongoose.mongo.Db
    let mockCollection: any
    let mockAggregateResult: any

    const collectionName = 'MonthlySummaries'

    beforeEach(() => {
        jest.clearAllMocks()

        mockAggregateResult = {
            toArray: jest.fn(),
        }

        mockCollection = {
            insertOne: jest.fn(),
            aggregate: jest.fn().mockReturnValue(mockAggregateResult),
        }

        mockDb = {
            collection: jest.fn().mockReturnValue(mockCollection),
        } as unknown as mongoose.mongo.Db

        mockedPekaJourneys.journeyCollection.mockReturnValue(mockCollection)

        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    describe('insertMonthlySummary', () => {
        const testSummary = {
            _id: '2023-10',
            from: '2023-10-01' as Day,
            to: '2023-10-31' as Day,
            sum: 150.75,
        }
        const fixedDate = new Date('2023-11-01T10:00:00.000Z')

        it('should call insertOne on the correct collection with summary and createdAt', async () => {
            jest.setSystemTime(fixedDate)
            mockCollection.insertOne.mockResolvedValue({
                acknowledged: true,
                insertedId: testSummary._id,
            })

            await insertMonthlySummary(mockDb, testSummary)

            expect(mockDb.collection).toHaveBeenCalledTimes(1)
            expect(mockDb.collection).toHaveBeenCalledWith(collectionName)
            expect(mockCollection.insertOne).toHaveBeenCalledTimes(1)
            expect(mockCollection.insertOne).toHaveBeenCalledWith({
                ...testSummary,
                createdAt: fixedDate,
            })
        })

        it('should throw an error if insertOne fails', async () => {
            const errorMessage = 'Database insertion failed'
            const originalError = new Error(errorMessage)
            mockCollection.insertOne.mockRejectedValue(originalError)

            await expect(
                insertMonthlySummary(mockDb, testSummary),
            ).rejects.toThrow(
                `Failed to insert PEKA Monthly Summary. ${errorMessage}`,
            )

            expect(mockDb.collection).toHaveBeenCalledTimes(1)
            expect(mockDb.collection).toHaveBeenCalledWith(collectionName)
            expect(mockCollection.insertOne).toHaveBeenCalledTimes(1)
        })
    })

    describe('sumPrices', () => {
        const startDay = '2023-10-01' as Day
        const endDay = '2023-10-31' as Day

        const expectedPipeline = [
            {
                $match: {
                    transactionDate: {
                        $gte: startDay,
                        $lte: endDay,
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: '$price' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalSpent: { $round: ['$totalPrice', 2] },
                },
            },
        ]

        it('should call aggregate on the journey collection with the correct pipeline', async () => {
            mockAggregateResult.toArray.mockResolvedValue([])

            await sumPrices(mockDb, startDay, endDay)

            expect(mockedPekaJourneys.journeyCollection).toHaveBeenCalledTimes(
                1,
            )
            expect(mockedPekaJourneys.journeyCollection).toHaveBeenCalledWith(
                mockDb,
            )
            expect(mockCollection.aggregate).toHaveBeenCalledTimes(1)
            expect(mockCollection.aggregate).toHaveBeenCalledWith(
                expectedPipeline,
            )
            expect(mockAggregateResult.toArray).toHaveBeenCalledTimes(1)
        })

        it('should return the totalSpent value if aggregation is successful', async () => {
            const expectedSum = 123.45
            mockAggregateResult.toArray.mockResolvedValue([
                { totalSpent: expectedSum },
            ])

            const result = await sumPrices(mockDb, startDay, endDay)

            expect(result).toBe(expectedSum)
            expect(mockCollection.aggregate).toHaveBeenCalledWith(
                expectedPipeline,
            )
            expect(mockAggregateResult.toArray).toHaveBeenCalledTimes(1)
        })

        it('should return 0 if aggregation result is empty', async () => {
            mockAggregateResult.toArray.mockResolvedValue([])

            const result = await sumPrices(mockDb, startDay, endDay)

            expect(result).toBe(0)
            expect(mockCollection.aggregate).toHaveBeenCalledWith(
                expectedPipeline,
            )
            expect(mockAggregateResult.toArray).toHaveBeenCalledTimes(1)
        })

        it('should return 0 if aggregation result does not contain totalSpent', async () => {
            mockAggregateResult.toArray.mockResolvedValue([
                { someOtherField: 100 },
            ])

            const result = await sumPrices(mockDb, startDay, endDay)

            expect(result).toBe(0)
            expect(mockCollection.aggregate).toHaveBeenCalledWith(
                expectedPipeline,
            )
            expect(mockAggregateResult.toArray).toHaveBeenCalledTimes(1)
        })

        it('should propagate errors from aggregate or toArray', async () => {
            const errorMessage = 'Aggregation failed'
            const originalError = new Error(errorMessage)
            mockAggregateResult.toArray.mockRejectedValue(originalError)

            await expect(sumPrices(mockDb, startDay, endDay)).rejects.toThrow(
                errorMessage,
            )

            expect(mockCollection.aggregate).toHaveBeenCalledWith(
                expectedPipeline,
            )
            expect(mockAggregateResult.toArray).toHaveBeenCalledTimes(1)
        })
    })
})
