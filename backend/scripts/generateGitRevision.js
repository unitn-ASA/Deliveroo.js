import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const backendPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Never fails: without git or a repository it only warns, keeping any .git-revision written at build time
try {

    // Obtain the git revision hash
    const gitRevision = execSync('git rev-parse HEAD', { cwd: backendPath }).toString().trim();

    // Write the git revision hash to a file, read by src/routes/api.js
    fs.writeFileSync(path.join(backendPath, '.git-revision'), gitRevision, 'utf8');

    // Log the git revision hash
    console.log('generateGitRevision.js Git revision hash', gitRevision.slice(0, 7), 'has been written to .git-revision file!');

} catch (error) {

    console.warn('generateGitRevision.js Failed to generate .git-revision file:', error.message);
    // process.exit(1);

}
