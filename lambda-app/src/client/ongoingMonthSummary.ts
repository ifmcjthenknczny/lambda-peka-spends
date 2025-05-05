import mongoose from 'mongoose'
import { DbMonthlySummary } from './monthlySummary'

type DbOngoingMonthSummary = DbMonthlySummary

const collectionName = 'OngoingMonthSummary'

const ongoingMonthCollection = (db: mongoose.mongo.Db) => {
    return db.collection<DbOngoingMonthSummary>(collectionName)
}

export const insertOngoingMonthSummary = async (
    db: mongoose.mongo.Db,
    summary: Omit<DbOngoingMonthSummary, 'createdAt'>,
) => {
    try {
        const collection = ongoingMonthCollection(db)
        await collection.insertOne({ ...summary, createdAt: new Date() })
    } catch (error: any) {
        throw new Error(
            `Failed to insert PEKA Ongoing Month Summary. ${error.message}`,
        )
    }
}

export const clearOngoingMonthSummaries = async (
    db: mongoose.mongo.Db
) => {
    try {
        const collection = ongoingMonthCollection(db)
        await collection.deleteMany();
    } catch (error: any) {
        throw new Error(
            `Failed to clear PEKA Ongoing Month Summary Collection. ${error.message}`,
        )
    }
}
