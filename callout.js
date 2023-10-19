import utils from './utils.js'
class CalloutLine {
    constructor(options) {
        this.options = Object.assign({
            className: 'dimension-line',
            activeClass: 'active',
            top: 0,
            bottom: 0,
            left: 0
        }, options)
        this.elem = this.init()
        this.leftList = [this.options.left]
    }
    init() {
        const { className, top, left } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.style.top = `${top}px`
        elem.style.left = `${left}px`
        return elem
    }
    active() {
        this.elem.classList.add(this.options.activeClass)
    }
    inactive() {
        this.elem.classList.remove(this.options.activeClass)
    }
    update({ left }, isAdd) {
        if (isAdd) {
            this.leftList.push(left)
        } else {
            this.leftList.splice(this.leftList.indexOf(left), 1)
        }
        this.elem.style.left = `${Math.min(...this.leftList)}px`
    }
    remove() {
        this.elem.remove()
    }
    getOptions() {
        return this.options
    }
    getElem() {
        return this.elem
    }
}
class CalloutItem {
    constructor(options) {
        this.options = Object.assign({
            className: 'dimension-item',
            activeClass: 'active',
            bottom: 0,
            left: 0,
            key: '',
            template: `<label class="dimension-label">标注：</label>
            <div class="dimension-input" contenteditable>&nbsp;</div>
            <div class="dimension-item-line"></div>`
        }, options)
        this.elem = this.init()
    }
    active() {
        this.elem.classList.add(this.options.activeClass)
        this.elem.querySelector('.dimension-input').focus()
    }
    inactive() {
        this.elem.classList.remove(this.options.activeClass)
    }
    init() {
        const { className, bottom, left, key, template } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.dataset.left = left
        elem.dataset.key = key
        elem.innerHTML = template
        return elem
    }
    remove() {
        this.elem.remove()
    }
    getOptions() {
        return this.options
    }
    getElem() {
        return this.elem
    }
}
class CalloutBox {
    constructor(options) {
        this.options = Object.assign({
            className: 'dimension-items',
            bottom: 0,
            top: 0,
            observe: null
        }, options)
        this.elem = this.init()
        this.item = {}
        this.itemKeyList = []
        this.itemLeftList = []
    }
    init() {
        const { className, bottom, top } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.style.top = `${top}px`
        elem.style.marginTop = '0px'
        this.observer(elem)
        return elem
    }
    addItem({ bottom, left, key }) {
        const item = this.item[key] = new CalloutItem({ bottom, left, key })
        const index = utils.getClosestIndex(this.itemLeftList, left)
        if (index > -1) {
            this.itemLeftList.splice(index + 1, 0, left)
            this.itemKeyList.splice(index + 1, 0, key)
        } else {
            this.itemLeftList.unshift(left)
            this.itemKeyList.unshift(key)
        }
        this.elem.insertBefore(item.getElem(), this.elem.children[index + 1])
        return item
    }
    removeItem({ left, key }) {
        const index = this.itemLeftList.indexOf(left)
        this.itemLeftList.splice(index, 1)
        this.itemKeyList.splice(index, 1)
        this.item[key].remove()
        delete this.item[key]
        return this.item[this.itemKeyList[index]] || this.item[this.itemKeyList[0]]
    }
    getItem(key) {
        return this.item[key]
    }
    observer(elem) {
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
    getElem() {
        return this.elem
    }
}
class Callout {
    constructor(options) {
        const { onActive, ...options1 } = options
        this.options = Object.assign({
            container: document.querySelector('.dimension-list'),
            lineContainer: document.querySelector('.dimension-lines')
        }, options1)
        this.line = {}
        this.box = {}
        this.bottomList = []
        this.activeItem = null
        this.onItemClick = this.onClick.bind(this)
        this.onActive = onActive
        this.bindEvent()
    }
    onClick(e) {
        if (this.isToggle) {
            this.isToggle = false
            return
        }
        let target = e.target
        let hasItem = false
        while (target && !hasItem) {
            hasItem = target.classList.contains('dimension-item')
            !hasItem && (target = target.parentElement)
        }
        let activeItem = null
        if (hasItem) {
            const { bottom, key } = target.dataset
            activeItem = this.getItemByBottomKey({ bottom: +bottom, key })
        }
        this.toggleActive(activeItem)
    }
    toggleActive(activeItem) {
        let oldKey = ''
        let newKey = ''
        if (this.activeItem) {
            const { bottom, key } = this.activeItem.getOptions()
            oldKey = key
            this.activeItem.inactive()
            this.line[bottom].inactive()
        }
        if (activeItem) {
            this.activeItem = activeItem
            const { bottom, key } = this.activeItem.getOptions()
            newKey = key
            this.activeItem.active()
            this.line[bottom].active()
        } else {
            this.activeItem = null
        }
        this.onActive && this.onActive(newKey, oldKey)
    }
    bindEvent() {
        document.addEventListener('click', this.onItemClick)
    }
    unbindEvent() {
        document.removeEventListener('click', this.onItemClick)
    }
    setBoxTop(changeBottom) {
        window.requestAnimationFrame(() => {
            const index = Math.max(0, this.bottomList.indexOf(changeBottom))
            const bottom = this.bottomList[index]
            if (bottom) {
                const box = this.box[bottom].getElem()
                let { bottom: boxBottom } = utils.getBoundingClientRect(box)
                for (let i = index + 1; i < this.bottomList.length; i++) {
                    const box = this.box[this.bottomList[i]].getElem()
                    let { top, bottom } = utils.getBoundingClientRect(box)
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
    addBox(data, lineData) {
        const { bottom, top, left, key } = data
        const { top: lineTop } = lineData
        const box = this.box[bottom] = this.box[bottom] || new CalloutBox({ bottom, top, observe: this.setBoxTop.bind(this) })
        const line = this.line[bottom] = this.line[bottom] || new CalloutLine({ bottom, top: lineTop, left })
        const index = utils.getClosestIndex(this.bottomList, bottom)
        if (!this.bottomList.includes(bottom)) {
            if (index > -1) {
                this.bottomList.splice(index + 1, 0, bottom)
            } else {
                this.bottomList.unshift(bottom)
            }
            this.options.container.insertBefore(box.getElem(), this.options.container.children[index + 1])
            this.options.lineContainer.insertBefore(line.getElem(), this.options.lineContainer.children[index + 1])
        } else {
            line.update({ left }, true)
        }
        this.toggleActive(box.addItem({ bottom, left, key }))
        this.setBoxTop(this.bottomList[index])
        console.log(this.bottomList)
        console.log(this.box)
        console.log(this.line)
    }
    removeBox(callback) {
        if (this.activeItem) {
            const { bottom, key, left } = this.activeItem.getOptions()
            const nextItem = this.box[bottom].removeItem({ key, left })
            if (nextItem) {
                this.isToggle = true
                this.toggleActive(nextItem)
                this.line[bottom].update({ left }, false)
            } else {
                this.bottomList.splice(this.bottomList.indexOf(bottom), 1)
                this.line[bottom].remove()
                delete this.line[bottom]
                delete this.box[bottom]
                this.activeItem = null
            }
            callback && callback({ key })
        }
    }
    getItemByBottomKey({ bottom, key }) {
        return this.box[bottom].getItem(key)
    }
}
export default Callout