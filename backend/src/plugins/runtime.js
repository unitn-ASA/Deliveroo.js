import PluginRegistry from './PluginRegistry.js';

/**
 * Shared singleton registry used across app routes and socket server.
 * Keeping a single instance ensures plugin state and lifecycle are consistent.
 * @type {PluginRegistry}
 */
const pluginRegistry = new PluginRegistry();

export { pluginRegistry };
