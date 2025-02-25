/**
 * Resolves after timeout
 * @type {function(Number):Promise} timer
 */
export default function sleep (ms) {
    return new Promise( res => setTimeout(res, ms) )
}
