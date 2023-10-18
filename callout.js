function getClosestIndex (list, value) {
    return list.findLastIndex((value1, index) => (value1 || value) <= value && (list[index + 1] || value) >= value)
}
class CalloutLine {
    constructor (options) {
        this.options = Object.assign({
            className: 'dimension-line',
            top: 0,
            bottom: 0,
            left: 0
        }, options)
        this.elem = this.init()
    }
    init () {
        const { className, top, bottom, left } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.dataset.left = left
        elem.style.top = `${top}px`
        elem.style.left = `${left}px`
        return elem
    }
    update ({ left }) {
        this.elem.dataset.left = `${this.elem.dataset.left},${left}`
        this.elem.style.left = `${Math.min(left, parseFloat(this.elem.style.left))}px`
    }
    getElem () {
        return this.elem
    }
}
class CalloutItem {
    constructor (options) {
        this.options = Object.assign({
            className: 'dimension-item',
            activeClass: 'active',
            bottom: 0,
            left: 0,
            key: '',
            template: `<label class="dimension-label">标注：</label>
            <div class="dimension-input" contenteditable>&nbsp;</div>`
        }, options)
        this.elem = this.init()
    }
    active () {
        this.elem.classList.add(this.options.activeClass)
        this.elem.querySelector('.dimension-input').focus()
    }
    inactive () {
        this.elem.classList.remove(this.options.activeClass)
    }
    init () {
        const { className, bottom, left, key, template } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.dataset.left = left
        elem.dataset.key = key
        elem.innerHTML = template
        return elem
    }
    getElem () {
        return this.elem
    }
}
class CalloutBox {
    constructor (options) {
        this.options = Object.assign({
            className: 'dimension-items',
            bottom: 0,
            top: 0,
            observe: null
        }, options)
        this.elem = this.init()
        this.item = {}
        this.itemLeftList = []
    }
    init () {
        const { className, bottom, top } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.style.top = `${top}px`
        elem.style.marginTop = '0px'
        this.observer(elem)
        return elem
    }
    addItem ({ bottom, left, key }) {
        const item = this.item[key] = new CalloutItem({ bottom, left, key })
        const index = getClosestIndex(this.itemLeftList, left)
        if (index > -1) {
            this.itemLeftList.splice(index + 1, 0, left)
        } else {
            this.itemLeftList.unshift(left)
        }
        this.elem.insertBefore(item.getElem(), this.elem.children[index + 1])
        return item
    }
    removeItem () {

    }
    observer (elem) {
        const { bottom, observe } = this.options
        if (typeof observe === 'function') {
            const config = {
                childList: true,
                characterData: true,
                subtree: true
            }
            const callback = () => {
                observe(bottom)
            }
            const observer = new MutationObserver(callback)
            observer.observe(elem, config)
        }
    }
    getElem () {
        return this.elem
    }
}
class Callout {
    constructor (options) {
        this.options = Object.assign({
            container: document.querySelector('.dimension-list'),
            lineContainer: document.querySelector('.dimension-lines')
        }, options)
        this.line = {}
        this.box = {}
        this.bottomList = []
        this.activeItem = null
        this.bindEvent()
    }
    onClick (e) {
        let target = e.target
        let hasItem = false
        while (target && !hasItem) {
            hasItem = target.classList.contains('dimension-item')
            !hasItem && (target = target.parentElement)
        }
        // if (this.activeItem)
    }
    bindEvent () {
        document.addEventListener('click', this.onClick)
    }
    unbindEvent () {
        document.removeEventListener('click', this.onClick)
    }
    setBoxTop (changeBottom) {
        window.requestAnimationFrame(() => {
            const index = Math.max(0, this.bottomList.indexOf(changeBottom))
            const bottom = this.bottomList[index]
            if (bottom) {
                const box = this.box[bottom].getElem()
                let { bottom: boxBottom } = box.getBoundingClientRect()
                for (let i = index + 1; i < this.bottomList.length; i++) {
                    const box = this.box[this.bottomList[i]].getElem()
                    let { top, bottom } = box.getBoundingClientRect()
                    top -= 1
                    let marginTop = parseFloat(box.style.marginTop)
                    top -= marginTop
                    bottom -= marginTop
                    marginTop = Math.max(0, boxBottom - top)
                    boxBottom = bottom + marginTop
                    box.style.marginTop = `${marginTop}px`
                }
            }
        })
    }
    addBox (data, lineData) {
        const { bottom, top, left, key } = data
        const { top: lineTop } = lineData
        const box = this.box[bottom] = this.box[bottom] || new CalloutBox({ bottom, top, observe: this.setBoxTop.bind(this) })
        const line = this.line[bottom] = this.line[bottom] || new CalloutLine({ bottom, top: lineTop, left })
        const index = getClosestIndex(this.bottomList, bottom)
        if (!this.bottomList.includes(bottom)) {
            if (index > -1) {
                this.bottomList.splice(index + 1, 0, bottom)
            } else {
                this.bottomList.unshift(bottom)
            }
            this.options.container.insertBefore(box.getElem(), this.options.container.children[index + 1])
            this.options.lineContainer.insertBefore(line.getElem(), this.options.lineContainer.children[index + 1])
        } else {
            line.update({ left })
        }
        this.activeItem && this.activeItem.inactive()
        this.activeItem = box.addItem({ bottom, left, key })
        this.activeItem.active()
        this.setBoxTop(this.bottomList[index])
    }
    removeBox () {

    }
}
export default Callout