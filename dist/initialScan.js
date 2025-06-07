#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const filecontracts_1 = require("./filecontracts");
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("./index");
async function swimSalmon() {
    try {
        console.log(chalk_1.default.blue('🐟 Starting swimSalmon...'));
        // Step 1: Find API calls
        const discoveredAPIs = await (0, index_1.scanSalmon)(); // Ensure this returns FetchCallData[]
        console.log(chalk_1.default.green('✅ API scan complete.'));
        // Step 2: Write baseline results
        await (0, filecontracts_1.writeTheFile)(discoveredAPIs); // This creates `.apiRestContracts.json`
        console.log(chalk_1.default.green('✅ API snapshot written.'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Error in swimSalmon:'), error);
    }
}
swimSalmon();
