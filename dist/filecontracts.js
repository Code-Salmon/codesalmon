"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeTheFile = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const apiUrl = [
    {
        "url": "process.env.API_URL + '/v1/resource'",
        "apiKeyVar": "API_KEY",
        "resolvedUrl": "https://api.nasa.gov/planetary/apod?api_key=4Ft01vTgsi4Gp07fqeIlcrjaGJ0AO3fz1KHQaL8m"
    },
    {
        "url": "https://api.openai.com/v1/chat",
        "apiKeyVar": "OPENAI_API_KEY",
        "resolvedUrl": "https://pokeapi.co/api/v2/pokemon?limit=1"
    }
]; //! hardcoded string to test, can remove once Anne's logic writes objects 
// function to make the fetch calls and store the results in a variable to pass to fileFolder
const apiTestCalls = async (url) => {
    const finalArray = url;
    try {
        for (let i = 0; i < url.length; i++) {
            const resolvedUrl = url[i].resolvedUrl;
            const call = await (0, node_fetch_1.default)(resolvedUrl);
            if (!call.ok) {
                console.error(`Request to ${resolvedUrl} failed with status ${call.status}`);
                finalArray[i][resolvedUrl] = { error: `HTTP ${call.status}` };
                continue;
            }
            const contentType = call.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error(`Unexpected content type from ${resolvedUrl}: ${contentType}`);
                finalArray[i][resolvedUrl] = { error: 'Non-JSON response' };
                continue;
            }
            const data = await call.json();
            finalArray[i][resolvedUrl] = data;
        }
        console.log(finalArray);
        return finalArray;
    }
    catch (err) {
        console.error(err);
    }
};
// function to create new file to store json snapshot of fetch calls on user's machine locally
const fileFolder = (finalOutputArray) => {
    if (!finalOutputArray || typeof finalOutputArray !== "object") {
        throw new Error("Invalid Data provided");
    }
    try {
        const ignoreOutput = (0, child_process_1.execSync)('git rev-parse --show-toplevel', { encoding: 'utf-8' }).toString().trim();
        const filePath = path_1.default.join(ignoreOutput, ".apiRestContracts.json"); // <-- process.cwd() places the file within the user's current src folder
        if (!filePath) {
            console.log(chalk_1.default.blue(`Comparison File has been written at ${filePath}`));
            fs.writeFileSync(filePath, JSON.stringify(finalOutputArray, null, 2)); //! <-- NEED TO PROPERLY PLACE FILE IN GITIGNORE, FILE IS CURRENTLY WRITING NEXT TO GITIGNORE
            // console.log('ignoreOutput', ignoreOutput);
            // console.log("File path:", filePath);
            // console.log("Data to write:", finalOutputArray);
        }
        else if (filePath) {
            fs.appendFile(".apiRestContracts.json", JSON.stringify(finalOutputArray, null, 2), (err) => {
                if (err) {
                    console.error(chalk_1.default.red('Error appending to file:', err));
                }
                else {
                    console.log(chalk_1.default.blue('Data appended successfully.'));
                }
            }); //! <-- Append correct file!
        }
        // compareAPIs(); // <-- invoking Anne's function
    }
    catch (error) {
        console.error(chalk_1.default.red("File for comparison data not written", error));
        throw error;
    }
};
const writeTheFile = async (array) => {
    try {
        const testTheFile = await apiTestCalls(apiUrl);
        fileFolder(testTheFile);
    }
    catch (error) {
        console.error(chalk_1.default.red('Error during API call', error));
    }
};
exports.writeTheFile = writeTheFile;
