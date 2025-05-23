"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileFolder = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// function to create new file to store json snapshot of fetch calls on user's machine locally
const fileFolder = (data) => {
    if (!data || typeof data !== "object") {
        throw new Error("Invalid Data provided");
    }
    try {
        const filePath = path_1.default.join(process.cwd(), ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder
        // console.log("File path:", filePath);
        fs_1.default.writeFileSync(filePath, JSON.stringify(data, null, 2)); // <-- Parameters in JSON.stringify make the json object human readable
        // console.log("Data to write:", data);
    }
    catch (error) {
        console.error("File for comparison data not written", error);
        throw error;
    }
};
exports.fileFolder = fileFolder;
