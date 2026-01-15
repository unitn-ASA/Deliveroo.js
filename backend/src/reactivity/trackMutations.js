
/**
 * 
 * @param {Object} value
 * @param {function} onChange
 * @returns 
 */
export function trackMutations(value, onChange) {
  if (value instanceof Set || value instanceof Map) {
    return new Proxy(value, {
      get(target, prop, receiver) {
        if (['add', 'set', 'delete', 'clear'].includes(prop.toString())) {
          return (...args) => {
            const result = target[prop](...args);
            onChange();
            return result;
          };
        }
        const v = Reflect.get(target, prop, receiver);
        return typeof v === 'function' ? v.bind(target) : v;
      }
    });
  }

  return value;
}
