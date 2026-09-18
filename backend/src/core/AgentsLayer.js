import SpatialLayer from './SpatialLayer.js';
import Agent from './Agent.js';

class AgentsLayer extends SpatialLayer {
    constructor(grid) {
        super({ id: 'core:agents' });
        this.grid = grid;
    }

    create(identity) {
        return this.add(new Agent(this.grid, identity));
    }
}

export default AgentsLayer;
