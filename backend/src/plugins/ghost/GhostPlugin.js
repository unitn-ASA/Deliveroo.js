import MovementModePluginBase from '../MovementModePluginBase.js';
import GhostMovementComponent from './GhostMovementComponent.js';

class GhostPlugin extends MovementModePluginBase {

    constructor() {
        super({
            id: 'ghost',
            name: 'Ghost Movement',
            version: '1.0.0',
            description: 'Ghost movement mode: agents whose movement_mode attribute is \'ghost\' pass through walls'
        }, { Component: GhostMovementComponent });
    }

}

export default GhostPlugin;
