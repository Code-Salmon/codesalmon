import fs from "fs";
import path from "path";
import { compareAPIs } from "./drift";

type JSONObj = Record<string, unknown>;


// function to create new file to store json snapshot of fetch calls on user's machine locally
export const fileFolder = (data: JSONObj)  => {

    if(!data || typeof data !== "object"){
        throw new Error("Invalid Data provided")
    }
    try{
    const filePath = path.join(process.cwd(), ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder
    console.log("File path:", filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // <-- Parameters in JSON.stringify make the json object human readable
    console.log("Data to write:", data);

    // compareAPIs(); // <-- invoking Anne's function

    } catch (error) {
        console.error("File for comparison data not written", error)
        throw error;
    }
}; 