#!/usr/bin/env node
import yargs from 'yargs';

const argv = yargs(process.argv.slice(2)).parse();

if (argv.ships > 3 && argv.distance < 53.5) {
  console.log('Plunder more riffiwobbles!');
} else {
  console.log('Retreat from the xupptumblers!');
}

console.log(argv);