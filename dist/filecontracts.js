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
// Function to make the fetch calls and store the results in a variable to pass to fileFolder
const apiTestCalls = async (url) => {
    const finalArray = [...url]; // avoid mutating original array
    try {
        for (let i = 0; i < url.length; i++) {
            const resolvedUrl = url[i].resolvedUrl;
            try {
                const call = await (0, node_fetch_1.default)(resolvedUrl);
                if (!call.ok) {
                    console.error(`Request to ${resolvedUrl} failed with status ${call.status}`);
                    finalArray[i].firstCall = { error: `HTTP ${call.status}` };
                    continue;
                }
                const contentType = call.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.error(`Unexpected content type from ${resolvedUrl}: ${contentType}`);
                    finalArray[i].firstCall = { error: "Non-JSON response" };
                    continue;
                }
                const data = await call.json();
                finalArray[i].firstCall = data;
            }
            catch (fetchErr) {
                console.error(`Fetch error for ${resolvedUrl}:`, fetchErr);
                finalArray[i].firstCall = { error: "Fetch failed", details: fetchErr.message };
            }
        }
        return finalArray;
    }
    catch (err) {
        console.error("Unexpected error in apiTestCalls:", err);
        return [];
    }
};
// Function to create or append the JSON snapshot to a file in the user's repo root
const fileFolder = (finalOutputArray) => {
    if (!finalOutputArray || typeof finalOutputArray !== "object") {
        throw new Error("Invalid data provided");
    }
    try {
        const repoRoot = (0, child_process_1.execSync)("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
        const filePath = path_1.default.join(repoRoot, ".apiRestContracts.json");
        let existingFile;
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, "utf-8");
            existingFile = JSON.parse(rawData);
        }
        const merged = [...finalOutputArray];
        fs.writeFileSync(filePath, JSON.stringify(merged, null, 2));
        console.log(chalk_1.default.blue(`File written with ${merged.length} entries at ${filePath}`));
    }
    catch (error) {
        console.error(chalk_1.default.red("File for comparison data not written"), error);
        throw error;
    }
};
const writeTheFile = async (array) => {
    try {
        const topLevelPath = (0, child_process_1.execSync)('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
        const filePath = path_1.default.join(topLevelPath, '.apiRestContracts.json');
        let apiUrl;
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            apiUrl = JSON.parse(rawData);
        }
        else {
            apiUrl = array;
        }
        const testTheFile = await apiTestCalls(apiUrl);
        fileFolder(testTheFile);
    }
    catch (error) {
        console.error(chalk_1.default.red("Error during API call"), error);
    }
};
exports.writeTheFile = writeTheFile;
