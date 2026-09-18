import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { authorizeAdmin } from '../middlewares/token.js';

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
     * @swagger
     * /api/plugins:
     *   get:
     *     summary: List plugins
     *     description: Returns all registered plugins with manifest, lifecycle status and last error.
     *     tags: [Plugins]
     *     responses:
     *       200:
     *         description: Plugins retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 count:
     *                   type: number
     *                 plugins:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       name:
     *                         type: string
     *                       version:
     *                         type: string
     *                       description:
     *                         type: string
     *                       status:
     *                         type: string
     *                       running:
     *                         type: boolean
     *                       lastError:
     *                         type: string
     *                         nullable: true
     *       500:
     *         description: Plugin registry error
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
     * @swagger
     * /api/plugins/status:
     *   get:
     *     summary: Get plugin registry status
     *     description: Returns aggregate plugin registry status, including currently registered server command handlers.
     *     tags: [Plugins]
     *     responses:
     *       200:
     *         description: Registry status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 totalPlugins:
     *                   type: number
     *                 runningPlugins:
     *                   type: number
     *                 commandHandlers:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       command:
     *                         type: string
     *                         example: move
     *                       owner:
     *                         type: string
     *                         example: tournament:reset
     *                 plugins:
     *                   type: array
     *                   items:
     *                     type: object
     *       500:
     *         description: Plugin registry error
     */
    router.get('/status', (req, res) => {
        try {
            res.json({ success: true, ...pluginRegistry.getStatus() });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * @swagger
     * /api/plugins/available:
     *   get:
     *     summary: List available plugins
     *     description: Scans the plugins directories for manifest files and reports which ones are registered and running.
     *     tags: [Plugins]
     *     responses:
     *       200:
     *         description: Available plugins retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 count:
     *                   type: number
     *                 plugins:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                       name:
     *                         type: string
     *                       version:
     *                         type: string
     *                       description:
     *                         type: string
     *                       manifestPath:
     *                         type: string
     *                       modulePath:
     *                         type: string
     *                       registered:
     *                         type: boolean
     *                       running:
     *                         type: boolean
     *       500:
     *         description: Plugin registry error
     */
    router.get('/available', async (req, res) => {
        try {
            const pluginsDir = path.resolve(process.cwd(), 'src/plugins');
            const available = [];

            const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const dir = path.join(pluginsDir, entry.name);

                const files = await fs.readdir(dir);
                for (const file of files.filter((f) => f.endsWith('.manifest.json'))) {
                    try {
                        const manifestPath = path.join(dir, file);
                        const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
                        const modulePath = path.resolve(dir, manifest.module || '');
                        available.push({
                            ...manifest,
                            manifestPath: path.relative(process.cwd(), manifestPath),
                            modulePath: path.relative(process.cwd(), modulePath),
                            registered: manifest.id ? pluginRegistry.has(manifest.id) : false,
                            running: manifest.id ? pluginRegistry.isRunning(manifest.id) : false
                        });
                    } catch { /* skip unreadable manifests */ }
                }
            }

            res.json({ success: true, count: available.length, plugins: available });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });

    /**
     * @swagger
     * /api/plugins/load:
     *   post:
     *     summary: Load a plugin
     *     description: Dynamically loads a plugin from module and manifest files, optionally starting it immediately. Requires admin privileges.
     *     tags: [Plugins]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               manifestPath:
     *                 type: string
     *                 description: Path to the plugin manifest JSON file.
     *               modulePath:
     *                 type: string
     *                 description: Path to the plugin JavaScript module.
     *               options:
     *                 type: object
     *                 description: Plugin-specific initialization options.
     *               autoStart:
     *                 type: boolean
     *                 description: Start the plugin after loading it.
     *     responses:
     *       201:
     *         description: Plugin loaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 plugin:
     *                   type: object
     *                 running:
     *                   type: boolean
     *       400:
     *         description: Plugin load failed
     */
    router.post('/load', authorizeAdmin, async (req, res) => {
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
     * @swagger
     * /api/plugins/{id}/start:
     *   post:
     *     summary: Start a plugin
     *     description: Starts a registered plugin by id. Requires admin privileges.
     *     tags: [Plugins]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Plugin id
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Plugin started successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 plugin:
     *                   type: object
     *       400:
     *         description: Plugin could not be started
     *       404:
     *         description: Plugin not found
     *       500:
     *         description: Plugin registry error
     */
    router.post('/:id/start', authorizeAdmin, async (req, res) => {
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
     * @swagger
     * /api/plugins/{id}/stop:
     *   post:
     *     summary: Stop a plugin
     *     description: Stops a running plugin by id. Requires admin privileges.
     *     tags: [Plugins]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Plugin id
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Plugin stopped successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 plugin:
     *                   type: object
     *       400:
     *         description: Plugin could not be stopped
     *       404:
     *         description: Plugin not found
     *       500:
     *         description: Plugin registry error
     */
    router.post('/:id/stop', authorizeAdmin, async (req, res) => {
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
     * @swagger
     * /api/plugins/{id}/reload:
     *   post:
     *     summary: Reload a plugin
     *     description: Reloads a plugin from its original module and manifest source. Requires admin privileges.
     *     tags: [Plugins]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Plugin id
     *         schema:
     *           type: string
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               autoStart:
     *                 type: boolean
     *                 description: Start the plugin after reloading it.
     *     responses:
     *       200:
     *         description: Plugin reloaded successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 plugin:
     *                   type: object
     *                 running:
     *                   type: boolean
     *       400:
     *         description: Plugin reload failed
     */
    router.post('/:id/reload', authorizeAdmin, async (req, res) => {
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
     * @swagger
     * /api/plugins/{id}/status:
     *   get:
     *     summary: Get plugin status
     *     description: Returns lifecycle status for a single plugin.
     *     tags: [Plugins]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Plugin id
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Plugin status retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 plugin:
     *                   type: object
     *                 running:
     *                   type: boolean
     *       404:
     *         description: Plugin not found
     *       500:
     *         description: Plugin registry error
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
     * @swagger
     * /api/plugins/{id}:
     *   delete:
     *     summary: Unregister a plugin
     *     description: Stops and unregisters a plugin from the registry. Requires admin privileges.
     *     tags: [Plugins]
     *     parameters:
     *       - name: id
     *         in: path
     *         required: true
     *         description: Plugin id
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Plugin unregistered successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                 message:
     *                   type: string
     *       404:
     *         description: Plugin not found
     *       500:
     *         description: Plugin registry error
     */
    router.delete('/:id', authorizeAdmin, async (req, res) => {
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
