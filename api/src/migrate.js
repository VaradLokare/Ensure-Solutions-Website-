import "dotenv/config";
import { openDatabase } from "./database.js";

const db = await openDatabase();
db.close();
console.log("Workspace database migrations applied.");
