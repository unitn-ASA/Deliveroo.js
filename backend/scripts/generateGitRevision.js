import { execSync } from 'child_process';
import fs from 'fs';

try {

    // Obtain the git revision hash
    const gitRevision = execSync('git rev-parse HEAD').toString().trim();

    // Write the git revision hash to a file
    fs.writeFileSync('.git-revision', gitRevision, 'utf8');

    // Log the git revision hash
    console.log('generateGitRevision.js Git revision hash', gitRevision.slice(0, 7), 'has been written to .git-revision file!');

} catch (error) {

    console.warn('generateGitRevision.js Failed to generate .git-revision file:', error.message);
    // process.exit(1);

}