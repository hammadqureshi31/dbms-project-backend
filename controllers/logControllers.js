import { Log } from "../models/activityLogModel.js";

export async function handleGetAllLogs(req,res){
    try {
        const logs = await Log.find()
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).send("Something went worng...")
    }
}