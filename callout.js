import utils from './utils.js'
class CalloutLine {
    constructor(options) {
        this.options = Object.assign({
            className: '',
            activeClass: '',
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
    getElem() {
        return this.elem
    }
}
class CalloutItemLine {
    constructor(options) {
        this.options = Object.assign({
            className: '',
            bottom: 0
        }, options)
        this.elem = this.init()
    }
    init() {
        const { className } = this.options
        const elem = document.createElement('div')
        elem.className = className
        return elem
    }
    update(top) {
        const gap = 10
        const distance = this.options.bottom - top - gap
        const side1 = 30
        const side2 = Math.abs(distance)
        const height = Math.sqrt(side1 ** 2 + side2 ** 2)
        const deg = Math.atan(side1 / side2) * 180 / Math.PI
        this.elem.style.height = `${height}px`
        if (distance >= 0) {
            this.elem.classList.remove('bottom')
            this.elem.classList.add('top')
            this.elem.style.top = `${gap}px`
            this.elem.style.bottom = ''
            this.elem.style.transform = `rotate(${deg}deg)`
        } else {
            this.elem.classList.remove('top')
            this.elem.classList.add('bottom')
            this.elem.style.bottom = `calc(100% - ${gap}px)`
            this.elem.style.top = ''
            this.elem.style.transform = `rotate(${-deg}deg)`
        }
    }
    getElem() {
        return this.elem
    }
}
class CalloutItemForm {
    constructor (options) {
        this.options = Object.assign({
            labelClass: '',
            inputClass: '',
            label: '',
            value: ''
        }, options)
        this.elem = this.init()
    }
    init () {
        const elem = document.createElement('div')
        const label = this.createLabel()
        const input = this.inputElem = this.createInput()
        elem.appendChild(label)
        elem.appendChild(input)
        return elem
    }
    createLabel () {
        const elem = document.createElement('div')
        elem.className = this.options.labelClass
        elem.innerHTML = this.options.label
        return elem
    }
    createInput () {
        const elem = document.createElement('div')
        elem.className = this.options.inputClass
        elem.setAttribute('contenteditable', '')
        elem.innerText = this.options.value
        return elem
    }
    inputFocus () {
        this.inputElem.focus()
        const selection = window.getSelection()
        selection.selectAllChildren(this.inputElem)
        selection.collapseToEnd()
    }
    getValue () {
        return this.inputElem.innerText
    }
    getElem () {
        return this.elem
    }
}
class CalloutItem {
    constructor(options) {
        this.options = Object.assign({
            className: '',
            activeClass: '',
            lineClass: '',
            labelClass: '',
            inputClass: '',
            bottom: 0,
            left: 0,
            key: '',
            value: '',
            label: ''
        }, options)
        this.elem = this.init()
    }
    active() {
        this.elem.classList.add(this.options.activeClass)
        this.form.inputFocus()
    }
    inactive() {
        this.elem.classList.remove(this.options.activeClass)
    }
    init() {
        const { className, inputClass, lineClass, labelClass, bottom, left, key, value, label } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.dataset.left = left
        elem.dataset.key = key
        const formElem = (this.form = new CalloutItemForm({ labelClass, label, inputClass, value })).getElem()
        const lineElem = (this.line = new CalloutItemLine({ className: lineClass, bottom })).getElem()
        elem.append(formElem)
        elem.append(lineElem)
        return elem
    }
    remove() {
        this.elem.remove()
    }
    updateLine() {
        const { top } = utils.getBoundingClientRect(this.elem)
        this.line.update(top)
    }
    getInputValue () {
        return {
            key: this.options.key,
            value: this.form.getValue()
        }
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
            className: '',
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
    addItem({ className, lineClass, labelClass, inputClass, activeClass, bottom, left, key, value, label }) {
        const item = this.item[key] = new CalloutItem({ className, lineClass, labelClass, inputClass, activeClass, bottom, left, key, value, label })
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
    removeItem({ key }) {
        const index = this.itemKeyList.indexOf(key)
        this.itemKeyList.splice(index, 1)
        this.itemLeftList.splice(index, 1)
        this.item[key].remove()
        delete this.item[key]
        return this.item[this.itemKeyList[index]] || this.item[this.itemKeyList[0]]
    }
    getItem(key) {
        return key ? this.item[key] : this.item
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
            container: '.dimension-text',
            boxContainerClass: 'dimension-list',
            lineContainerClass: 'dimension-lines',
            boxClass: 'dimension-items',
            boxItemClass: 'dimension-item',
            boxItemActiveClass: 'active',
            boxItemLineClass: 'dimension-item-line',
            boxItemLabelClass: 'dimension-label',
            boxItemInputClass: 'dimension-input',
            lineClass: 'dimension-line',
            lineActiveClass: 'active',
            label: '标注'
        }, options1)
        this.elem = this.getElem(this.options)
        this.line = {}
        this.box = {}
        this.bottomList = []
        this.activeItem = null
        this.onItemClick = this.onClick.bind(this)
        this.onActive = onActive
        this.bindEvent()
    }
    getElem ({ container, boxContainerClass, lineContainerClass }) {
        container = container instanceof Element ? container : document.querySelector(container)
        container.innerHTML = `
            <div class="${lineContainerClass}"></div>
            <div class="${boxContainerClass}"></div>
        `
        return {
            container,
            boxContainer: container.querySelector(`.${boxContainerClass}`),
            lineContainer: container.querySelector(`.${lineContainerClass}`),
        }
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
        if (activeItem && activeItem === this.activeItem) return
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
    updateElem(changeBottom) {
        this.updateBoxTop(changeBottom)
        this.updateItemLine(changeBottom)
    }
    updateBoxTop(changeBottom) {
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
    }
    updateItemLine(changeBottom) {
        const index = Math.max(0, this.bottomList.indexOf(changeBottom))
        for (let i = index; i < this.bottomList.length; i++) {
            const item = this.box[this.bottomList[i]].getItem()
            for (let key in item) {
                item[key].updateLine()
            }
        }
    }
    addBox(node, key, value = '') {
        const { top, bottom, right } = utils.getBoundingClientRect(node)
        const { top: linesTop, left: linesLeft } = utils.getBoundingClientRect(this.elem.lineContainer)
        const left = right - linesLeft
        const box = this.createBox({ bottom, top: top - linesTop, observe: this.updateElem.bind(this) })
        const line = this.createLine({ bottom, top: bottom - linesTop, left })
        const index = utils.getClosestIndex(this.bottomList, bottom)
        if (!this.bottomList.includes(bottom)) {
            if (index > -1) {
                this.bottomList.splice(index + 1, 0, bottom)
            } else {
                this.bottomList.unshift(bottom)
            }
            this.elem.boxContainer.insertBefore(box.getElem(), this.elem.boxContainer.children[index + 1])
            this.elem.lineContainer.insertBefore(line.getElem(), this.elem.lineContainer.children[index + 1])
            this.updateElem(this.bottomList[index])
        } else {
            line.update({ left }, true)
        }
        this.toggleActive(this.createItem(box, { bottom, left, key, value }))
    }
    removeBox(callback) {
        if (this.activeItem) {
            const { bottom, key, left } = this.activeItem.getOptions()
            const nextItem = this.box[bottom].removeItem({ key })
            this.isToggle = true
            this.toggleActive(nextItem)
            if (nextItem) {
                this.line[bottom].update({ left }, false)
            } else {
                this.bottomList.splice(this.bottomList.indexOf(bottom), 1)
                this.line[bottom].remove()
                delete this.line[bottom]
                delete this.box[bottom]
            }
            callback && callback({ key })
        }
    }
    createBox (params) {
        const bottom = params.bottom
        return this.box[bottom] = this.box[bottom] || new CalloutBox({
            ...params,
            className: this.options.boxClass
        })
    }
    createItem (box, params) {
        return box.addItem({
            ...params,
            className: this.options.boxItemClass,
            lineClass: this.options.boxItemLineClass,
            inputClass: this.options.boxItemInputClass,
            activeClass: this.options.boxItemActiveClass,
            labelClass: this.options.boxItemLabelClass,
            label: this.options.label
        })
    }
    createLine (params) {
        const bottom = params.bottom
        return this.line[bottom] = this.line[bottom] || new CalloutLine({
            ...params,
            className: this.options.lineClass,
            activeClass: this.options.lineActiveClass
        })
    }
    getItemValue () {
        const data = {}
        this.bottomList.forEach(bottom => {
            const item = this.box[bottom].getItem()
            for (let key in item) {
                const { key: inputKey, value: inputValue } = item[key].getInputValue()
                data[inputKey] = inputValue
            }
        })
        return data
    }
    getItemByBottomKey({ bottom, key }) {
        return this.box[bottom].getItem(key)
    }
}
export default Callout