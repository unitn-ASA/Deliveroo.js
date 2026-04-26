import { reactive } from "vue";

function isTypingInField() {
    const el = document.activeElement;
    if (!el) return false;
    return (
        el.tagName === 'TEXTAREA' ||
        el.tagName === 'INPUT' ||
        el.tagName === 'SELECT' ||
        // @ts-ignore
        el.isContentEditable
    );
}

document.onkeydown = async (evt) => {
    // console.log('Keyboard.vue onkeydown', evt.code);
    if (evt.repeat) return; // ignore key continuosly pressed
    if (isTypingInField()) return; // 🚫 ignore typing
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
