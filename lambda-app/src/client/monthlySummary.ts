import mongoose from 'mongoose'
import { Day } from '../helpers/date'

const collectionName = 'MonthlySummaries'

export type DbMonthlySummary = {
    _id: string
    from: Day
    to: Day
    sum: number
    createdAt: Date
}

const summaryCollection = (db: mongoose.mongo.Db) => {
    return db.collection<DbMonthlySummary>(collectionName)
}

export const insertMonthlySummary = async (
    db: mongoose.mongo.Db,
    summary: Omit<DbMonthlySummary, 'createdAt'>,
) => {
    try {
        const collection = summaryCollection(db)
        await collection.insertOne({ ...summary, createdAt: new Date() })
    } catch (error: any) {
        throw new Error(
            `Failed to insert PEKA Monthly Summary. ${error.message}`,
        )
    }
}
