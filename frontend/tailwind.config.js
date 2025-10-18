/** @type {import('tailwindcss').Config} */
import daisyui from 'daisyui';

export default {
    content: ["./src/**/*.{html,js,vue}"],
    theme: {
        extend: {},
    },
    plugins: [
        daisyui
    ],
    daisyui: {
        logs: false // Disabilita i log di DaisyUI durante il build
    }
}
