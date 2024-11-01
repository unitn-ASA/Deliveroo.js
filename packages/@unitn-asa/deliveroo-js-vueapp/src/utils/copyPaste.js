
export async function pasteFromClipboard() {
    return await navigator.clipboard.readText();
}

export function copyToClipboard(text) {
    var tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}
