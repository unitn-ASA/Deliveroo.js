const { execSync } = require('child_process');
const fs = require('fs');

try {

    // Obtain the git revision hash
    const gitRevision = execSync('git rev-parse HEAD').toString().trim();

    // Write the git revision hash to a file
    fs.writeFileSync('.git-revision', gitRevision, 'utf8');

    // Log the git revision hash
    console.log('Git revision hash:', gitRevision.slice(0, 7));

} catch (error) {

    console.warn('Failed to generate .git-revision:', error.message);
    // process.exit(1);

}