#!/usr/bin/env node

import { Command } from 'commander';
import { getMapList, loadMap, getGamesList, loadGame } from './index.js';

const program = new Command();

program
    .name('deliveroojs-assets')
    .description('CLI for Deliveroo.js game assets')
    .version('1.0.0');

// List all available maps
program
    .command('maps')
    .description('List all available maps')
    .action(() => {
        const maps = getMapList();
        console.log('\n📁 Available Maps:');
        console.log('─'.repeat(40));
        if (maps.length === 0) {
            console.log('  No maps found');
        } else {
            maps.forEach((map, index) => {
                console.log(`  ${index + 1}. ${map}`);
            });
        }
        console.log(`\n  Total: ${maps.length} map(s)\n`);
    });

// Show details about a specific map
program
    .command('map <name>')
    .description('Show details about a specific map')
    .action((name) => {
        try {
            const mapData = loadMap(name);
            console.log(`\n🗺️  Map: ${name}`);
            console.log('─'.repeat(40));

            // Get dimensions
            const height = mapData.length;
            const width = mapData[0]?.length || 0;

            console.log(`  Dimensions: ${width}x${height}`);
            console.log(`  Tiles: ${height * width}`);

            // Count tile types
            const tileCounts = {};
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const tile = mapData[y][x];
                    tileCounts[tile] = (tileCounts[tile] || 0) + 1;
                }
            }

            console.log('\n  Tile Distribution:');
            Object.entries(tileCounts)
                .sort((a, b) => b[1] - a[1])
                .forEach(([tile, count]) => {
                    const percentage = ((count / (height * width)) * 100).toFixed(1);
                    console.log(`    ${tile}: ${count} (${percentage}%)`);
                });

            console.log('');
        } catch (error) {
            console.error(`\n❌ Error loading map '${name}':`, error.message);
            console.log('\n💡 Use "deliveroo-assets maps" to see available maps\n');
        }
    });

// Preview a map (ASCII art)
program
    .command('preview <name>')
    .description('Preview a map as ASCII art')
    .option('-s, --size <number>', 'Output size (height in lines)', '20')
    .action((name, options) => {
        try {
            const mapData = loadMap(name);
            const maxHeight = parseInt(options.size);
            const height = mapData.length;
            const width = mapData[0]?.length || 0;

            console.log(`\n🗺️  Preview: ${name} (${width}x${height})`);
            console.log('─'.repeat(40));

            // Calculate scale
            const scale = Math.min(1, maxHeight / height);
            const displayHeight = Math.floor(height * scale);
            const step = Math.ceil(1 / scale);

            // Tile symbols for ASCII
            const symbols = {
                '0': '░',
                '1': '█',
                '2': '▓',
                '3': '▒',
                '↑': '↑',
                '→': '→',
                '↓': '↓',
                '←': '←'
            };

            for (let y = 0; y < height; y += step) {
                let line = '';
                for (let x = 0; x < width; x++) {
                    const tile = String(mapData[y][x]);
                    line += symbols[tile] || '?';
                }
                console.log(line);
            }

            console.log('\n  Legend:');
            console.log('    ░ (0) - Walkable');
            console.log('    █ (1) - Wall');
            console.log('    ▓ (2) - Delivery zone');
            console.log('    ▒ (3) - Spawn zone');
            console.log('    ↑→↓← - Directional tiles');
            console.log('');
        } catch (error) {
            console.error(`\n❌ Error loading map '${name}':`, error.message);
            console.log('\n💡 Use "deliveroo-assets maps" to see available maps\n');
        }
    });

// List all available games
program
    .command('games')
    .description('List all available games')
    .action(() => {
        const games = getGamesList();
        console.log('\n🎮 Available Games:');
        console.log('─'.repeat(40));
        if (games.length === 0) {
            console.log('  No games found');
        } else {
            games.forEach((game, index) => {
                console.log(`  ${index + 1}. ${game}`);
            });
        }
        console.log(`\n  Total: ${games.length} game(s)\n`);
    });

// Show details about a specific game
program
    .command('game <name>')
    .description('Show details about a specific game')
    .action((name) => {
        try {
            const gameConfig = loadGame(name);
            console.log(`\n🎮 Game: ${name}`);
            console.log('─'.repeat(40));

            // Show title and description
            if (gameConfig.title) {
                console.log(`  Title: ${gameConfig.title}`);
            }
            if (gameConfig.description) {
                console.log(`  Description: ${gameConfig.description}`);
            }
            if (gameConfig.maxPlayers) {
                console.log(`  Max Players: ${gameConfig.maxPlayers}`);
            }

            console.log('\n  Configuration:');

            // Show map info
            if (gameConfig.map) {
                if (gameConfig.map.file) {
                    console.log(`    Map: ${gameConfig.map.file}`);
                } else if (gameConfig.map.generation) {
                    const gen = gameConfig.map.generation;
                    console.log(`    Map: Procedural (${gen.algorithm}, ${gen.width}x${gen.height})`);
                }
            }

            // Show NPCs
            if (gameConfig.npcs && gameConfig.npcs.length > 0) {
                console.log(`    NPCs:`);
                gameConfig.npcs.forEach(npc => {
                    const details = [];
                    if (npc.count !== undefined) details.push(`count: ${npc.count}`);
                    if (npc.speed) details.push(`speed: ${npc.speed}`);
                    if (npc.spawnRate) details.push(`spawn: ${npc.spawnRate}`);
                    console.log(`      - ${npc.type}${details.length ? ' (' + details.join(', ') + ')' : ''}`);
                });
            }

            // Show parcels
            if (gameConfig.parcels) {
                const p = gameConfig.parcels;
                const details = [];
                if (p.generationInterval) details.push(`spawn: ${p.generationInterval}`);
                if (p.max !== undefined) details.push(`max: ${p.max}`);
                if (p.reward) details.push(`reward: ${p.reward.avg}±${p.reward.variance}`);
                console.log(`    Parcels: ${details.join(', ')}`);
            }

            // Show clock
            if (gameConfig.clock !== undefined) {
                console.log(`    Clock: ${gameConfig.clock}ms`);
            }

            console.log('');
        } catch (error) {
            console.error(`\n❌ Error loading game '${name}':`, error.message);
            console.log('\n💡 Use "deliveroojs-assets games" to see available games\n');
        }
    });

// Interactive mode
program
    .command('interactive')
    .alias('i')
    .description('Interactive mode to browse assets')
    .action(async () => {
        const readline = (await import('readline')).createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log('\n🎮 Deliveroo.js Assets - Interactive Mode');
        console.log('─'.repeat(40));
        console.log('Commands: maps, games, preview <name>, show <name>, quit\n');

        const ask = (prompt) => new Promise(resolve => readline.question(prompt, resolve));

        let running = true;
        while (running) {
            const input = (await ask('assets> ')).trim().split(' ');
            const [cmd, ...args] = input;

            try {
                switch (cmd) {
                    case 'maps':
                        const maps = getMapList();
                        console.log(`\n  Available maps (${maps.length}):`);
                        maps.forEach((m, i) => console.log(`    ${i + 1}. ${m}`));
                        console.log('');
                        break;

                    case 'games':
                        const games = getGamesList();
                        console.log(`\n  Available games (${games.length}):`);
                        games.forEach((g, i) => console.log(`    ${i + 1}. ${g}`));
                        console.log('');
                        break;

                    case 'preview':
                    case 'p':
                        if (args[0]) {
                            const mapData = loadMap(args[0]);
                            const h = mapData.length;
                            const w = mapData[0]?.length || 0;
                            console.log(`\n  ${args[0]} (${w}x${h}):\n`);
                            const symbols = { '0': '░', '1': '█', '2': '▓', '3': '▒', '↑': '↑', '→': '→', '↓': '↓', '←': '←' };
                            for (let y = 0; y < Math.min(h, 20); y++) {
                                let line = '';
                                for (let x = 0; x < w; x++) line += symbols[String(mapData[y][x])] || '?';
                                console.log('  ' + line);
                            }
                            if (h > 20) console.log(`  ... (${h - 20} more rows)`);
                            console.log('');
                        } else {
                            console.log('  Usage: preview <mapname>\n');
                        }
                        break;

                    case 'show':
                    case 's':
                        if (args[0]) {
                            const mapData = loadMap(args[0]);
                            const h = mapData.length;
                            const w = mapData[0]?.length || 0;
                            const counts = {};
                            for (let y = 0; y < h; y++) {
                                for (let x = 0; x < w; x++) {
                                    const t = mapData[y][x];
                                    counts[t] = (counts[t] || 0) + 1;
                                }
                            }
                            console.log(`\n  ${args[0]} (${w}x${h}, ${w * h} tiles):`);
                            Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
                                console.log(`    ${t}: ${c} (${((c / (w * h)) * 100).toFixed(1)}%)`);
                            });
                            console.log('');
                        } else {
                            console.log('  Usage: show <mapname>\n');
                        }
                        break;

                    case 'quit':
                    case 'q':
                    case 'exit':
                        running = false;
                        console.log('  Goodbye!\n');
                        break;

                    case 'help':
                    case 'h':
                        console.log('  Commands:');
                        console.log('    maps         - List all maps');
                        console.log('    games        - List all games');
                        console.log('    preview <n>  - Preview map as ASCII');
                        console.log('    show <n>     - Show map details');
                        console.log('    quit         - Exit interactive mode');
                        console.log('');
                        break;

                    default:
                        if (cmd) console.log(`  Unknown command: ${cmd}. Type 'help' for commands.\n`);
                }
            } catch (error) {
                console.error(`  Error: ${error.message}\n`);
            }
        }

        readline.close();
    });

program.parse();
