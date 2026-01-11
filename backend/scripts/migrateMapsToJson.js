import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapsDirectory = path.resolve(__dirname, '..', 'levels', 'maps');
const outputDirectory = path.resolve(__dirname, '..', 'resources', 'maps');

/**
 * Format JSON with matrix-style tiles array
 * @param {Object} mapJson - The map JSON object
 * @returns {string} Formatted JSON string
 */
function formatMapJson(mapJson) {
    const { name, description, width, height, tiles } = mapJson;

    // Build the JSON manually with proper formatting
    let output = '{\n';
    output += `  "name": "${name}",\n`;
    output += `  "description": "${description}",\n`;
    output += `  "width": ${width},\n`;
    output += `  "height": ${height},\n`;
    output += '  "tiles": [\n';

    // Format each row on its own line
    tiles.forEach((row, index) => {
        const rowStr = JSON.stringify(row);
        output += `    ${rowStr}`;
        if (index < tiles.length - 1) {
            output += ',';
        }
        output += '\n';
    });

    output += '  ]\n';
    output += '}';

    return output;
}

/**
 * Migrate a single .js map file to .json format
 * @param {string} filePath - Path to the .js file
 * @param {string} outputFileName - Name of the output file
 * @returns {Promise<Object|null>} The migrated map object or null if failed
 */
async function migrateMap(filePath, outputFileName) {
    try {
        const mod = await import('file://' + filePath);
        const mapArray = mod.default ?? mod;

        const mapJson = {
            name: outputFileName.replace('.json', ''),
            description: `Migrated from ${path.basename(filePath)}`,
            width: mapArray[0]?.length || 0,
            height: mapArray.length,
            tiles: mapArray
        };

        const outputPath = path.join(outputDirectory, outputFileName);
        const formattedJson = formatMapJson(mapJson);
        fs.writeFileSync(outputPath, formattedJson);
        console.log(`Migrated: ${outputFileName}`);

        return mapJson;
    } catch (error) {
        console.error(`Error migrating ${filePath}:`, error);
        return null;
    }
}

/**
 * Migrate all .js maps to .json format
 */
async function migrateAllMaps() {
    // Ensure output directory exists
    if (!fs.existsSync(outputDirectory)) {
        fs.mkdirSync(outputDirectory, { recursive: true });
    }

    const files = fs.readdirSync(mapsDirectory);
    const jsFiles = files.filter(file => path.extname(file) === '.js');

    console.log(`Found ${jsFiles.length} .js maps to migrate`);

    for (const file of jsFiles) {
        const filePath = path.join(mapsDirectory, file);
        const outputFileName = file.replace('.js', '.json');

        // Skip if already exists
        const outputPath = path.join(outputDirectory, outputFileName);
        if (fs.existsSync(outputPath)) {
            console.log(`Skipping ${outputFileName} (already exists)`);
            continue;
        }

        await migrateMap(filePath, outputFileName);
    }

    console.log('Migration complete!');
}

migrateAllMaps();
