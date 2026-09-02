/**
 * Parse the fixed-width map representation used by game files.
 * Each tile occupies two character positions: single-character tile types
 * are followed by a space, while two-character types such as 5! use both.
 * Rows are stored top-to-bottom; the returned matrix is indexed [x][y].
 *
 * @param {string[]} rows
 * @param {number} width
 * @param {number} height
 * @returns {string[][]}
 */
export function mapRowsToColumns(rows, width, height) {
    if (!Array.isArray(rows) || rows.length !== height) {
        throw new Error(`Expected ${height} map rows`);
    }

    return Array.from({ length: width }, (_, x) =>
        Array.from({ length: height }, (_, y) => {
            const row = rows[height - 1 - y];
            return row.slice(x * 2, x * 2 + 2).trim();
        })
    );
}

/**
 * Validate fixed-width map rows without changing their representation.
 *
 * @param {unknown} rows
 * @param {number} width
 * @param {number} height
 * @param {(value: string) => boolean} isValidTile
 * @returns {string[]}
 */
export function validateMapRows(rows, width, height, isValidTile) {
    const errors = [];
    if (!Array.isArray(rows)) return ['Map tiles must be an array of rows'];
    if (rows.length !== height) errors.push(`Map must contain ${height} rows`);

    for (let y = 0; y < rows.length; y++) {
        const row = rows[y];
        if (typeof row !== 'string') {
            errors.push(`Map row ${y} must be a string`);
            continue;
        }
        if (row.length < width * 2 - 1 || row.length > width * 2) {
            errors.push(`Map row ${y} must be ${width * 2 - 1} or ${width * 2} characters`);
            continue;
        }
        for (let x = 0; x < width; x++) {
            const token = row.slice(x * 2, x * 2 + 2).trim();
            if (!token || token.length > 2 || !isValidTile(token)) {
                errors.push(`Invalid tile '${token}' at row ${y}, column ${x}`);
            }
        }
    }
    return errors;
}
