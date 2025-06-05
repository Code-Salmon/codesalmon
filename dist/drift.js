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
exports.compareAPIs = compareAPIs;
exports.boxedLog = boxedLog;
const deep_diff_1 = require("deep-diff");
const chalk_1 = __importDefault(require("chalk"));
const cfonts = __importStar(require("cfonts"));
const strip_ansi_1 = __importDefault(require("strip-ansi"));
const goldenData = [{
        "date": "2025-05-28",
        // "explanation": "This might look like a double-bladed lightsaber, but these two cosmic jets actually beam outward from a newborn star in a galaxy near you. Constructed from Hubble Space Telescope image data, the stunning scene spans about half a light-year across Herbig-Haro 24 (HH 24), some 1,300 light-years or 400 parsecs away in the stellar nurseries of the Orion B molecular cloud complex. Hidden from direct view, HH 24's central protostar is surrounded by cold dust and gas flattened into a rotating accretion disk. As material from the disk falls toward the young stellar object, it heats up. Opposing jets are blasted out along the system's rotation axis. Cutting through the region's interstellar matter, the narrow, energetic jets produce a series of glowing shock fronts along their path.",
        "hdurl": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-fullHH24.jpg",
        "media_type": "image",
        "service_version": "v1",
        "title": "Herbig-Haro 24",
        "url": "https://apod.nasa.gov/apod/image/2505/hs-2015-42-a-largeHH241024.jpg"
    },
    {
        "count": 1302,
        "next": "https://pokeapi.co/api/v2/pokemon?offset=1&limit=1",
        "previous": null,
        "results": [
            {
                "name": "bulbasaur",
                "url": "https://pokeapi.co/api/v2/pokemon/1/"
            }
        ]
    }];
const muddyData = [{
        "copyright": "Franz Hofmann",
        "date": "2025-05-29",
        // "explanation": "Grand spiral galaxies often seem to get all the attention, flaunting young, bright, blue star clusters and pinkish star forming regions along graceful, symmetric spiral arms. But small galaxies form stars too, like irregular dwarf galaxy Sextans A. Its young star clusters and star forming regions are gathered into a gumdrop-shaped region a mere 5,000 light-years across. Seen toward the navigational constellation Sextans, the small galaxy lies some 4.5 million light-years distant. That puts it near the outskirts of the local group of galaxies, that includes the large, massive spirals Andromeda and our own Milky Way. Brighter Milky Way foreground stars appear spiky and yellowish in this colorful telescopic view of Sextans A.",
        "hdurl": "https://apod.nasa.gov/apod/image/2505/sexa_gemsbock_cdk_pub.jpg",
        "media_type": "image",
        "service_version": "v1",
        "title": "Irregular Dwarf Galaxy Sextans A",
        "url": "https://apod.nasa.gov/apod/image/2505/sexa_gemsbock_cdk_pub1024.jpg"
    },
    {
        "count": 1302,
        "next": "https://pokeapi.co/api/v2/pokemon?offset=1&limit=1",
        "previous": null,
        "results": [
            {
                "name": "bulbasaur",
                "url": "https://pokeapi.co/api/v2/pokemon/1/"
            }
        ]
    }];
// function to use cfonts for messaging
function displayMessage(message, colors) {
    cfonts.say(message, {
        font: 'chrome',
        align: 'left',
        colors,
        background: 'transparent',
        letterSpacing: 1, // Define letter spacing
        lineHeight: 1, // Define the line height
        space: true, // Add space between letters
        maxLength: '0', // Define max length of output string
        rawMode: false, // define if the line breaks should be CR(`\r\n`) over the default LF (`\n`)
        env: 'node',
        independentGradient: false, // Apply gradient across all lines
        transitionGradient: false
    });
}
function compareAPIs(initial, current) {
    const drift = (0, deep_diff_1.diff)(initial, current);
    if (!drift) {
        // console.log(chalk.bold.bgWhite.greenBright('✅ No drift detected!'));
        displayMessage('No drift detected!', ['#3fff3f', '#00b400', '#005a00']);
        return;
    }
    // console.log(chalk.yellow.bold('\n⚠️ Drift detected:\n'));
    displayMessage('Drift detected!', ['red', '#D16002', 'red']);
    drift.forEach((update) => {
        const path = update.path?.join('.') || '(root)';
        switch (update.kind) {
            case 'E':
                console.log(chalk_1.default.bold.redBright(`Change at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.blue(`From: ${JSON.stringify(update.lhs)}`));
                console.log(chalk_1.default.yellow(`To: ${JSON.stringify(update.rhs)}`));
                break;
            case 'N':
                console.log(chalk_1.default.bold.redBright(`Addition at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.yellow(`Value: ${JSON.stringify(update.rhs)}\n`));
                break;
            case 'D':
                console.log(chalk_1.default.bold.redBright(`Removed at: ${chalk_1.default.italic.underline(path)}`));
                console.log(chalk_1.default.yellow(`Old value: ${JSON.stringify(update.lhs)}\n`));
                break;
            default:
                console.log(chalk_1.default.yellow(`Unhandled change type at ${chalk_1.default.italic.underline(path)}`));
        }
    });
}
function boxedLog(title, callback) {
    const logs = [];
    const originalLog = console.log;
    console.log = (...args) => {
        const output = args.map(String).join(" ");
        logs.push(...output.split("\n"));
    };
    try {
        callback();
    }
    finally {
        console.log = originalLog;
        const allLines = [title, ...logs];
        const maxLength = Math.max(...allLines.map(line => (0, strip_ansi_1.default)(line).length)) + 2;
        const horizontal = "─".repeat(maxLength);
        console.log(`┌${horizontal}┐`);
        console.log(`│ ${title.padEnd(maxLength - 1)}│`);
        console.log(`├${horizontal}┤`);
        for (const line of logs) {
            const visibleLength = (0, strip_ansi_1.default)(line).length;
            const padding = ' '.repeat(maxLength - visibleLength - 1);
            console.log(`│ ${line}${padding}│`);
        }
        console.log(`└${horizontal}┘`);
    }
}
const urls = ['https://api.nasa.gov/planetary/apod?api_key=', 'https://pokeapi.co/api/v2/pokemon?offset=1&limit=1'];
for (let i = 0; i < goldenData.length; i++) {
    boxedLog(`📦 API Drift Report for ${urls[i]}`, () => {
        compareAPIs(goldenData[i], muddyData[i]);
    });
}
// needs to be dynamic for DD to do comparison without hardcoded data. need to pull in json object and iterate through them to get array[i].resolvedURL and make fetch call to compare
