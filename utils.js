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
    }
}