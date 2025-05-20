import fs from "fs";
import path from "path";



// function to create new file to store json snapshot of fetch calls on user's machine locally
const fileFolder = (data: Record<string, unknown>)  => {
    if(!data || typeof data !== "object"){
        throw new Error("Invalid Data provided")
    }
    try{
    const filePath = path.join(process.cwd(), ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder
    // console.log("File path:", filePath);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); // <-- Parameters in JSON.stringify make the json object human readable
    // console.log("Data to write:", data);
    } catch (error) {
        console.error("File for comparison data not written", error)
        throw error;
    }
}; 