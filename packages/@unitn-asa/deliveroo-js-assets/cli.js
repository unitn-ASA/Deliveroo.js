#!/usr/bin/env node

import { Command } from 'commander';
import { getGamesList, loadGame } from './index.js';
import { validateGameOptions } from './src/validation.js';

const program = new Command();

program
    .name('deliveroojs-assets')
    .description('CLI for Deliveroo.js game assets')
    .version('1.0.0');

// List all available games (maps)
program
    .command('games')
    .alias('maps')
    .description('List all available games (maps)')
    .action(() => {
        const games = getGamesList();
        console.log('\n🗺️  Available Games/Maps:');
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

// Validate game files
program
    .command('validate [name]')
    .alias('check')
    .description('Validate game configuration file(s). If no name provided, validates all games.')
    .option('-a, --all', 'Validate all games (default behavior when no name provided)')
    .action(async (name, options) => {
        if (name) {
            // Validate a specific game
            try {
                const gameConfig = await loadGame(name);
                const result = validateGameOptions(gameConfig);

                console.log(`\n🔍 Validating: ${name}`);
                console.log('─'.repeat(40));

                if (result.valid) {
                    console.log('✅ PASSED\n');
                    console.log(`  Title: ${gameConfig.title}`);
                    console.log(`  Map: ${gameConfig.map.width}x${gameConfig.map.height}`);
                    console.log(`  Max Players: ${gameConfig.maxPlayers}\n`);
                } else {
                    console.log('❌ FAILED\n');
                    console.log('  Errors found:');
                    result.errors.forEach((err, i) => {
                        console.log(`    ${i + 1}. ${err.message}`);
                        if (err.path) {
                            console.log(`       Path: ${err.path}`);
                        }
                        if (err.value !== undefined) {
                            console.log(`       Value: ${JSON.stringify(err.value)}`);
                        }
                    });
                    console.log(`\n  Total: ${result.errors.length} error(s)\n`);
                    process.exit(1);
                }
            } catch (error) {
                console.error(`\n❌ Error loading game '${name}':`, error.message);
                console.log('\n💡 Use "deliveroojs-assets games" to see available games\n');
                process.exit(1);
            }
        } else {
            // Validate all games
            const games = getGamesList();
            console.log('\n🔍 Validating All Games');
            console.log('─'.repeat(40));
            console.log(`  Found ${games.length} game(s)\n`);

            let passed = 0;
            let failed = 0;
            const failedGames = [];

            for (const gameName of games) {
                try {
                    const gameConfig = await loadGame(gameName);
                    const result = validateGameOptions(gameConfig);

                    if (result.valid) {
                        console.log(`  ✅ ${gameName}`);
                        passed++;
                    } else {
                        console.log(`  ❌ ${gameName} (${result.errors.length} error(s))`);
                        failed++;
                        failedGames.push({ name: gameName, errors: result.errors });
                    }
                } catch (error) {
                    console.log(`  ⚠️  ${gameName} - Failed to load: ${error.message}`);
                    failed++;
                    failedGames.push({ name: gameName, errors: [{ message: error.message }] });
                }
            }

            console.log('\n' + '─'.repeat(40));
            console.log(`  Results: ${passed} passed, ${failed} failed\n`);

            // Show details for failed games
            if (failedGames.length > 0) {
                console.log('  Failed Games Details:\n');
                for (const { name, errors } of failedGames) {
                    console.log(`  ❌ ${name}:`);
                    errors.slice(0, 3).forEach((err, i) => {
                        console.log(`     ${i + 1}. ${err.message}`);
                    });
                    if (errors.length > 3) {
                        console.log(`     ... and ${errors.length - 3} more error(s)`);
                    }
                    console.log('');
                }
                process.exit(1);
            }
        }
    });

// Show details about a specific game
program
    .command('game <name>')
    .description('Show details about a specific game')
    .action(async (name) => {
        try {
            const gameConfig = await loadGame(name);
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
                const width = gameConfig.map.width;
                const height = gameConfig.map.height;
                console.log(`    Map: ${width}x${height}`);
            }

            // Show NPCs
            if (gameConfig.npcs && gameConfig.npcs.length > 0) {
                console.log(`    NPCs:`);
                gameConfig.npcs.forEach(npc => {
                    const details = [];
                    if (npc.count !== undefined) details.push(`count: ${npc.count}`);
                    console.log(`      - ${npc.type}${details.length ? ' (' + details.join(', ') + ')' : ''}`);
                });
            }

            // Show parcels
            if (gameConfig.parcels) {
                const p = gameConfig.parcels;
                const details = [];
                if (p.generation_event) details.push(`spawn: ${p.generation_event}`);
                if (p.decaying_event) details.push(`decay: ${p.decaying_event}`);
                if (p.max !== undefined) details.push(`max: ${p.max}`);
                if (p.reward_avg !== undefined) details.push(`reward: ${p.reward_avg}±${p.reward_variance}`);
                console.log(`    Parcels: ${details.join(', ')}`);
            }

            console.log('');
        } catch (error) {
            console.error(`\n❌ Error loading game '${name}':`, error.message);
            console.log('\n💡 Use "deliveroojs-assets games" to see available games\n');
        }
    });

// Show map details from a game
program
    .command('map <name>')
    .description('Show map details from a game configuration')
    .action(async (name) => {
        try {
            const gameConfig = await loadGame(name);
            if (!gameConfig.map?.tiles) {
                console.error(`\n❌ Game '${name}' does not have an embedded map\n`);
                return;
            }

            const mapData = gameConfig.map.tiles;
            const width = gameConfig.map.width;
            const height = gameConfig.map.height;

            console.log(`\n🗺️  Map: ${name}`);
            console.log('─'.repeat(40));
            console.log(`  Dimensions: ${width}x${height}`);
            console.log(`  Tiles: ${width * height}`);

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
                    const percentage = ((count / (width * height)) * 100).toFixed(1);
                    const tileName = getTileName(tile);
                    console.log(`    ${tile} (${tileName}): ${count} (${percentage}%)`);
                });

            console.log('');
        } catch (error) {
            console.error(`\n❌ Error loading map from game '${name}':`, error.message);
            console.log('\n💡 Use "deliveroojs-assets games" to see available games\n');
        }
    });

// Preview a map (ASCII art)
program
    .command('preview <name>')
    .description('Preview a map as ASCII art')
    .option('-s, --size <number>', 'Output size (height in lines)', '20')
    .action(async (name, options) => {
        try {
            const gameConfig = await loadGame(name);
            if (!gameConfig.map?.tiles) {
                console.error(`\n❌ Game '${name}' does not have an embedded map\n`);
                return;
            }

            const mapData = gameConfig.map.tiles;
            const width = gameConfig.map.width;
            const height = gameConfig.map.height;
            const maxHeight = parseInt(options.size);

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
            console.error(`\n❌ Error loading map from game '${name}':`, error.message);
            console.log('\n💡 Use "deliveroojs-assets games" to see available games\n');
        }
    });

// Helper function to get tile name
function getTileName(tile) {
    const names = {
        '0': 'Walkable',
        '1': 'Wall',
        '2': 'Delivery',
        '3': 'Spawn',
        '↑': 'Up',
        '→': 'Right',
        '↓': 'Down',
        '←': 'Left'
    };
    return names[tile] || 'Unknown';
}

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
        console.log('Commands: games, map <name>, preview <name>, show <name>, quit\n');

        const ask = (prompt) => new Promise(resolve => readline.question(prompt, resolve));

        let running = true;
        while (running) {
            const input = (await ask('assets> ')).trim().split(' ');
            const [cmd, ...args] = input;

            try {
                switch (cmd) {
                    case 'games':
                    case 'maps':
                        const games = getGamesList();
                        console.log(`\n  Available games (${games.length}):`);
                        games.forEach((g, i) => console.log(`    ${i + 1}. ${g}`));
                        console.log('');
                        break;

                    case 'show':
                    case 's':
                        if (args[0]) {
                            const gameConfig = await loadGame(args[0]);
                            console.log(`\n  ${args[0]}:`);
                            if (gameConfig.title) console.log(`    Title: ${gameConfig.title}`);
                            if (gameConfig.description) console.log(`    Description: ${gameConfig.description}`);
                            if (gameConfig.map?.tiles) {
                                console.log(`    Map: ${gameConfig.map.width}x${gameConfig.map.height}`);
                            }
                            if (gameConfig.maxPlayers) console.log(`    Max Players: ${gameConfig.maxPlayers}`);
                            console.log('');
                        } else {
                            console.log('  Usage: show <gamename>\n');
                        }
                        break;

                    case 'map':
                    case 'm':
                        if (args[0]) {
                            const gameConfig = await loadGame(args[0]);
                            if (gameConfig.map?.tiles) {
                                const mapData = gameConfig.map.tiles;
                                const width = gameConfig.map.width;
                                const height = gameConfig.map.height;
                                const counts = {};
                                for (let y = 0; y < height; y++) {
                                    for (let x = 0; x < width; x++) {
                                        const t = mapData[y][x];
                                        counts[t] = (counts[t] || 0) + 1;
                                    }
                                }
                                console.log(`\n  ${args[0]} (${width}x${height}, ${width * height} tiles):`);
                                Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
                                    const percentage = ((c / (width * height)) * 100).toFixed(1);
                                    console.log(`    ${t} (${getTileName(t)}): ${c} (${percentage}%)`);
                                });
                                console.log('');
                            } else {
                                console.log(`\n  No embedded map in '${args[0]}'\n`);
                            }
                        } else {
                            console.log('  Usage: map <gamename>\n');
                        }
                        break;

                    case 'preview':
                    case 'p':
                        if (args[0]) {
                            const gameConfig = await loadGame(args[0]);
                            if (gameConfig.map?.tiles) {
                                const mapData = gameConfig.map.tiles;
                                const width = gameConfig.map.width;
                                const height = gameConfig.map.height;
                                console.log(`\n  ${args[0]} (${width}x${height}):\n`);
                                const symbols = { '0': '░', '1': '█', '2': '▓', '3': '▒', '↑': '↑', '→': '→', '↓': '↓', '←': '←' };
                                const maxLines = 20;
                                const step = Math.ceil(height / maxLines);
                                for (let y = 0; y < height; y += step) {
                                    let line = '';
                                    for (let x = 0; x < width; x++) line += symbols[String(mapData[y][x])] || '?';
                                    console.log('  ' + line);
                                }
                                if (height > maxLines) console.log(`  ... (${height - maxLines} more rows)`);
                                console.log('');
                            } else {
                                console.log(`\n  No embedded map in '${args[0]}'\n`);
                            }
                        } else {
                            console.log('  Usage: preview <gamename>\n');
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
                        console.log('    games/maps   - List all games');
                        console.log('    map <n>      - Show map details');
                        console.log('    preview <n>  - Preview map as ASCII');
                        console.log('    show <n>     - Show game details');
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
