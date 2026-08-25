import { Router } from 'express';

/**
 * @typedef {Object} PluginApiResponse
 * @property {boolean} success
 * @property {number} [count]
 * @property {object[]} [plugins]
 * @property {object} [plugin]
 * @property {string} [message]
 * @property {string} [error]
 * @property {boolean} [running]
 */

/**
 * Build the HTTP routes used to manage plugin lifecycle and inspect registry state.
 * @param {import('../plugins/PluginRegistry.js').default} pluginRegistry
 * @returns {import('express').Router}
 */
export function createPluginRoutes(pluginRegistry) {
    const router = Router();

    /**
     * List all registered plugins.
     */
    router.get('/', (req, res) => {
        try {
            const plugins = pluginRegistry.getAll().map((plugin) => ({
                ...plugin.getManifest(),
                status: plugin.status,
                running: pluginRegistry.isRunning(plugin.id),
                lastError: plugin.lastError
            }));

            /** @type {PluginApiResponse} */
            res.json({
                success: true,
                count: plugins.length,
                plugins
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * Return aggregated registry status, including command handlers.
     */
    router.get('/status', (req, res) => {
        try {
            res.json({ success: true, ...pluginRegistry.getStatus() });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * Dynamically load and optionally start a plugin from disk.
     */
    router.post('/load', async (req, res) => {
        try {
            const { manifestPath, modulePath, options, autoStart } = req.body || {};
            const plugin = await pluginRegistry.loadFromFiles({ manifestPath, modulePath, options });

            if (autoStart) {
                await pluginRegistry.start(plugin.id);
            }

            res.status(201).json({
                success: true,
                plugin: plugin.getStatus(),
                running: pluginRegistry.isRunning(plugin.id)
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    });

    /**
     * Start a registered plugin by id.
     */
    router.post('/:id/start', async (req, res) => {
        try {
            const { id } = req.params;
            if (!pluginRegistry.has(id)) {
                return res.status(404).json({ success: false, error: `Plugin ${id} not found` });
            }

            const ok = await pluginRegistry.start(id);
            if (!ok) {
                return res.status(400).json({ success: false, error: `Cannot start plugin ${id}` });
            }

            res.json({ success: true, plugin: pluginRegistry.get(id).getStatus() });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * Stop a running plugin by id.
     */
    router.post('/:id/stop', async (req, res) => {
        try {
            const { id } = req.params;
            if (!pluginRegistry.has(id)) {
                return res.status(404).json({ success: false, error: `Plugin ${id} not found` });
            }

            const ok = await pluginRegistry.stop(id);
            if (!ok) {
                return res.status(400).json({ success: false, error: `Cannot stop plugin ${id}` });
            }

            res.json({ success: true, plugin: pluginRegistry.get(id).getStatus() });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * Reload a plugin from its original module/manifest source.
     */
    router.post('/:id/reload', async (req, res) => {
        try {
            const { id } = req.params;
            const { autoStart } = req.body || {};
            const plugin = await pluginRegistry.reload(id, { autoStart });

            res.json({
                success: true,
                plugin: plugin.getStatus(),
                running: pluginRegistry.isRunning(plugin.id)
            });
        } catch (error) {
            res.status(400).json({ success: false, error: error.message });
        }
    });

    /**
     * Return the status of a single plugin.
     */
    router.get('/:id/status', (req, res) => {
        try {
            const { id } = req.params;
            const plugin = pluginRegistry.get(id);
            if (!plugin) {
                return res.status(404).json({ success: false, error: `Plugin ${id} not found` });
            }

            res.json({
                success: true,
                plugin: plugin.getStatus(),
                running: pluginRegistry.isRunning(id)
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * Unregister a plugin and remove it from the registry.
     */
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const ok = await pluginRegistry.unregister(id);
            if (!ok) {
                return res.status(404).json({ success: false, error: `Plugin ${id} not found` });
            }

            res.json({ success: true, message: `Plugin ${id} unregistered` });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    return router;
}

export default createPluginRoutes;
