
(async () => {
    console.log('Building Deliveroo.js backend...');
    await import('./generateGitRevision.js');
    console.log('Build complete!');
    process.exit(0);
})();
