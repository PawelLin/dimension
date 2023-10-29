import utils from './utils.js'
class CalloutLine {
    constructor(options, initOptions = { lineClass: '', lineActiveClass: '', direction: '', reverseDirection: '' }) {
        this.options = Object.assign({ top: 0, left: 0, right: 0 }, options)
        this.initOptions = initOptions
        this.leftList = [this.options.left]
        this.rightList = [this.options.right]
        this.elem = this.init()
    }
    init() {
        const { lineClass, direction, reverseDirection } = this.initOptions
        const elem = document.createElement('div')
        elem.className = lineClass
        elem.style.top = `${this.options.top}px`
        elem.style[direction] = 0
        elem.style[reverseDirection] = `${-this.options[direction]}px`
        return elem
    }
    active() {
        this.elem.classList.add(this.initOptions.lineActiveClass)
    }
    inactive() {
        this.elem.classList.remove(this.initOptions.lineActiveClass)
    }
    update(data, isAdd = false) {
        if (data) {
            const { left, right } = data
            if (isAdd) {
                this.leftList.push(left)
                this.rightList.push(right)
            } else {
                this.leftList.splice(this.leftList.indexOf(left), 1)
                this.rightList.splice(this.rightList.indexOf(right), 1)
            }
        }
        const { direction, reverseDirection } = this.initOptions
        this.elem.style[direction] = 0
        this.elem.style[reverseDirection] = `-${Math.max(...(this[`${direction}List`]))}px`
    }
    remove() {
        this.elem.remove()
    }
    getElem() {
        return this.elem
    }
}
class CalloutItemLine {
    constructor(options, initOptions = { itemLineClass: '', itemLineGap: '', direction: '', reverseDirection: '' }) {
        this.options = Object.assign({}, options)
        this.initOptions = initOptions
        this.elem = this.init()
    }
    init() {
        const elem = document.createElement('div')
        elem.className = this.initOptions.itemLineClass
        return elem
    }
    update({ distance, ...data }) {
        const { itemLineGap, reverseDirection } = this.initOptions
        distance -= itemLineGap
        const sideX = data[reverseDirection]
        const sideY = Math.abs(distance)
        const height = Math.sqrt(Math.abs(sideX) ** 2 + sideY ** 2)
        const deg = Math.atan(sideX / sideY) * 180 / Math.PI
        this.elem.style.height = `${height}px`
        if (distance >= 0) {
            this.elem.style.top = `${itemLineGap}px`
            this.elem.style.bottom = ''
            this.elem.style.transformOrigin = 'right top'
            this.elem.style.transform = `rotate(${deg}deg)`
        } else {
            this.elem.style.bottom = `calc(100% - ${itemLineGap}px)`
            this.elem.style.top = ''
            this.elem.style.transformOrigin = 'right bottom'
            this.elem.style.transform = `rotate(${-deg}deg)`
        }
    }
    getElem() {
        return this.elem
    }
}
class CalloutItemForm {
    constructor (options, initOptions = { itemLabelClass: '', itemInputClass: '', itemLabel: '', itemValue: '' }) {
        this.options = Object.assign({}, options)
        this.initOptions = initOptions
        this.elem = this.init()
    }
    init () {
        const elem = document.createElement('div')
        const label = this.labelElem = this.createLabel()
        const input = this.inputElem = this.createInput()
        elem.appendChild(label)
        elem.appendChild(input)
        return elem
    }
    createLabel () {
        const elem = document.createElement('div')
        elem.className = this.initOptions.itemLabelClass
        elem.innerHTML = this.initOptions.itemLabel
        return elem
    }
    createInput () {
        const elem = this.inputElem = document.createElement('div')
        elem.className = this.initOptions.itemInputClass
        elem.setAttribute('contenteditable', '')
        elem.innerText = this.initOptions.itemValue
        elem.addEventListener('input', () => this.updateInput())
        return elem
    }
    updateInput () {
        const paddingLeft = this.inputElem.innerText ? 0 : this.labelElem.offsetWidth
        this.inputElem.style.paddingLeft = `${paddingLeft}px`
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
    constructor(options, initOptions = { itemClass: '', itemActiveClass: '' }) {
        this.options = Object.assign({
            bottom: 0,
            right: 0,
            key: ''
        }, options)
        this.initOptions = initOptions
        this.elem = this.init()
    }
    active() {
        this.elem.classList.add(this.initOptions.itemActiveClass)
        this.form.updateInput()
        this.form.inputFocus()
    }
    inactive() {
        this.elem.classList.remove(this.initOptions.itemActiveClass)
    }
    init() {
        const { bottom, key } = this.options
        const elem = document.createElement('div')
        elem.className = this.initOptions.itemClass
        elem.dataset.bottom = bottom
        elem.dataset.key = key
        const formElem = (this.form = new CalloutItemForm({}, this.initOptions)).getElem()
        const lineElem = (this.line = new CalloutItemLine({}, this.initOptions)).getElem()
        elem.append(formElem)
        elem.append(lineElem)
        return elem
    }
    remove() {
        this.elem.remove()
    }
    updateLine(rect) {
        const { top, left, right } = utils.getBoundingClientRect(this.elem)
        this.line.update({
            distance: this.options.bottom - top,
            left: left - rect.left,
            right: right - rect.right
        })
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
    constructor(options, initOptions = { boxClass: '' }) {
        this.options = Object.assign({
            bottom: 0,
            top: 0,
            observe: null
        }, options)
        this.initOptions = initOptions
        this.elem = this.init()
        this.item = {}
        this.itemKeyList = []
        this.itemLeftList = []
    }
    init() {
        const { top } = this.options
        const elem = document.createElement('div')
        elem.className = this.initOptions.boxClass
        elem.style.top = `${top}px`
        elem.style.marginTop = 0
        this.observer(elem)
        return elem
    }
    addItem(options) {
        const { left, key } = options
        const item = this.item[key] = new CalloutItem(options, this.initOptions)
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
    constructor(container = '.dimension-callout', options) {
        const { onActive, ...options1 } = options
        this.options = Object.assign({
            boxContainerClass: 'dimension-box-container',
            lineContainerClass: 'dimension-line-container',
            boxClass: 'dimension-box',
            itemClass: 'dimension-item',
            itemActiveClass: 'dimension-item-active',
            itemLineClass: 'dimension-item-line',
            itemLineGap: 10,
            itemLabelClass: 'dimension-item-label',
            itemInputClass: 'dimension-item-input',
            itemLabel: '标注:&nbsp;',
            itemValue: '',
            lineClass: 'dimension-line',
            lineActiveClass: 'dimension-line-active',
        }, options1)
        this.elem = this.getElem(container)
        this.line = {}
        this.box = {}
        this.bottomList = []
        this.activeItem = null
        this.onItemClick = this.onClick.bind(this)
        this.onActive = onActive
        this.bindEvent()
    }
    reset () {
        this.elem.boxContainer.innerHTML = ''
        this.elem.lineContainer.innerHTML = ''
        this.line = {}
        this.box = {}
        this.bottomList = []
        this.activeItem = null
    }
    getElem (container) {
        const { boxContainerClass, lineContainerClass } = this.options
        container = typeof container === 'string' ? document.querySelector(container) : container
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
            hasItem = target.classList.contains(this.options.itemClass)
            !hasItem && (target = target.parentElement)
        }
        let activeItem = null
        if (hasItem) {
            const { bottom, key } = target.dataset
            activeItem = this.box[+bottom].getItem(key)
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
        const { left, right } = utils.getBoundingClientRect(this.elem.container)
        for (let i = index; i < this.bottomList.length; i++) {
            const item = this.box[this.bottomList[i]].getItem()
            for (let key in item) {
                item[key].updateLine({ left, right })
            }
        }
    }
    addBox(data, active = true) {
        const { top, bottom, left, right } = data
        const { top: lineContainerTop } = utils.getBoundingClientRect(this.elem.lineContainer)
        const box = this.createBox({ bottom, top: top - lineContainerTop, observe: this.updateElem.bind(this) })
        const line = this.createLine({ bottom, top: bottom - lineContainerTop, left, right })
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
            line.update({ left, right }, true)
        }
        const boxItem = box.addItem(data)
        active && this.toggleActive(boxItem)
    }
    removeBox(callback) {
        if (this.activeItem) {
            const { bottom, key, left, right } = this.activeItem.getOptions()
            const nextItem = this.box[bottom].removeItem({ key })
            this.isToggle = true
            this.toggleActive(nextItem)
            if (nextItem) {
                this.line[bottom].update({ left, right })
            } else {
                this.bottomList.splice(this.bottomList.indexOf(bottom), 1)
                delete this.box[bottom]
                this.removeLine(bottom)
            }
            callback && callback({ key })
        }
    }
    createBox (options) {
        const { bottom } = options
        return this.box[bottom] = this.box[bottom] || new CalloutBox(options, this.options)
    }
    createLine (options) {
        const { bottom, ...options1 } = options
        return this.line[bottom] = this.line[bottom] || new CalloutLine(options1, this.options)
    }
    removeLine (bottom) {
        this.line[bottom].remove()
        delete this.line[bottom]
    }
    changeDirection (direction, reverseDirection) {
        this.options.direction = direction
        this.options.reverseDirection = reverseDirection
        const { left, right } = utils.getBoundingClientRect(this.elem.container)
        this.bottomList.forEach(bottom => {
            this.line[bottom].update()
            const item = this.box[bottom].getItem()
            for (const key in item) {
                item[key].updateLine({ left, right })
            }
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
}
export default Callout