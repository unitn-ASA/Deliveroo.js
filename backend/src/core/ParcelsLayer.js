import SpatialLayer from './SpatialLayer.js';
import Parcel from './Parcel.js';

class ParcelsLayer extends SpatialLayer {
    constructor() { super({ id: 'core:parcels' }); }
    create(xy, carriedBy = null, reward) { return this.add(new Parcel(xy, carriedBy, reward)); }
}

export default ParcelsLayer;
