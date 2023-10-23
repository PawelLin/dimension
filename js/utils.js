export default {
    getBoundingClientRect (node) {
        const rect = node.getBoundingClientRect()
        const newRect = {}
        for (let key in rect) {
            if (typeof rect[key] !== 'function') {
                newRect[key] = rect[key]
            }
        }
        const scrollTop = document.documentElement.scrollTop
        newRect.top += scrollTop
        newRect.bottom += scrollTop
        return newRect
    },
    getClosestIndex(list, value) {
        return list.findLastIndex((value1, index) => (value1 || value) <= value && (list[index + 1] || value) >= value)
    },
    reverseDirection (direction) {
        return direction === 'right' ? 'left' : 'right'
    },
    debounce (fn, delay = 300) {
        let timer
        return function (...args) {
            timer && clearTimeout(timer)
            timer = setTimeout(() => {
                timer = null
                fn.apply(this, args)
            }, delay)
        };
    }
}