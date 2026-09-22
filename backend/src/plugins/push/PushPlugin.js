import MovementModePluginBase from '../MovementModePluginBase.js';
import PushMovementComponent from './PushMovementComponent.js';

class PushPlugin extends MovementModePluginBase {

    constructor() {
        super({
            id: 'push',
            name: 'Push Movement',
            version: '1.0.0',
            description: 'Push movement mode: agents whose movement_mode attribute is \'push\' displace blocking agents'
        }, { Component: PushMovementComponent });
    }

}

export default PushPlugin;
