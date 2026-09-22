import MovementModePluginBase from '../MovementModePluginBase.js';
import RotationMovementComponent from './RotationMovementComponent.js';

class RotationPlugin extends MovementModePluginBase {

    constructor() {
        super({
            id: 'rotation',
            name: 'Rotation Movement',
            version: '1.0.0',
            description: 'Rotation movement mode: agents whose movement_mode attribute is \'rotation\' rotate in place and move along their facing'
        }, { Component: RotationMovementComponent });
    }

}

export default RotationPlugin;
