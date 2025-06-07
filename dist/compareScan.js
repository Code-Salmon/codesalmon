#!/usr/bin/env node
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
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const drift_1 = require("./drift");
const chalk_1 = __importDefault(require("chalk"));
const child_process_1 = require("child_process");
async function compareScan() {
    // Step 3: Load saved data
    const topLevelPath = (0, child_process_1.execSync)('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
    const filePath = path_1.default.join(topLevelPath, '.apiRestContracts.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const baselineData = JSON.parse(rawData);
    // Step 4: Re-fetch and compare
    for (const api of baselineData) {
        const url = api.resolvedUrl;
        const initial = api[url];
        const liveCall = await (0, node_fetch_1.default)(url);
        if (!liveCall.ok) {
            console.warn(chalk_1.default.yellow(`⚠️ Could not re-fetch ${url}: ${liveCall.status}`));
            continue;
        }
        const current = (await liveCall.json());
        (0, drift_1.boxedLog)(chalk_1.default.blue(`🔍 Comparing drift for ${url}`), () => {
            (0, drift_1.compareAPIs)(initial, current);
        });
    }
}
console.log(chalk_1.default.cyan('🏁 swimSalmon complete.'));
compareScan();
