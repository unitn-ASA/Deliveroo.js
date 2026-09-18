import SpatialLayer from './SpatialLayer.js';
import Tile from './Tile.js';

class TilesLayer extends SpatialLayer {
    constructor() { super({ id: 'core:tiles' }); }
    create(xy, type) { return this.add(new Tile(xy, type)); }
}

export default TilesLayer;
