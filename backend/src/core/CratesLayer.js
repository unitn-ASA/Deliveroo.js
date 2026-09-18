import SpatialLayer from './SpatialLayer.js';
import Crate from './Crate.js';

class CratesLayer extends SpatialLayer {
    constructor() { super({ id: 'core:crates' }); }
    create(xy) { return this.add(new Crate(xy)); }
}

export default CratesLayer;
