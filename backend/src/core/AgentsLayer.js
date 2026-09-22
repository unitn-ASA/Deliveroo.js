import SpatialLayer from './SpatialLayer.js';
import Agent from './Agent.js';

class AgentsLayer extends SpatialLayer {
    constructor(grid) {
        super({ id: 'core:agents' });
        this.grid = grid;
    }

    /**
     * @param {import('./Identity.js').default} identity
     * @param {{kind: string, value: number | string, max?: number}[]} [attributes] - Initial attributes, set before the 'added' event
     */
    create(identity, attributes = []) {
        return this.add(new Agent(this.grid, identity, attributes));
    }
}

export default AgentsLayer;
