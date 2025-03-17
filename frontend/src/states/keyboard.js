import { reactive } from "vue";

document.onkeydown = async (evt) => {
    // console.log('Keyboard.vue onkeydown', evt.code);
    if (evt.repeat) return; // ignore key continuosly pressed
    keys[evt.code] = true;
}

document.onkeyup = async (evt) => {
    // console.log('Keyboard.vue onkeyup', evt.code);
    keys[evt.code] = false;
}

export const keys = reactive({
    'Digit0': false,
    'Digit1': false,
    'Digit2': false,
    'Digit3': false,
    'Digit4': false,
    'Digit5': false,
    'KeyQ': false,
    'KeyW': false,
    'KeyE': false,
    'KeyA': false,
    'KeyS': false,
    'KeyD': false,
    'ShiftLeft': false,
    'ControlLeft': false,
    'AltLeft': false,
    'Space': false
});
