import utils from './utils.js'
class CalloutLine {
    constructor(options, initOptions = {}) {
        const { lineClass: className = '', lineActiveClass: activeClass = '', direction } = initOptions
        this.options = Object.assign({
            className,
            activeClass,
            direction,
            top: 0,
            bottom: 0,
            left: 0
        }, options)
        this.elem = this.init()
        this.leftList = [this.options.left]
    }
    init() {
        const { className, top, left, direction } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.style.top = `${top}px`
        elem.style[direction] = 0
        elem.style[utils.leftRightReplace(direction)] = `${-Math.abs(left)}px`
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
        this.leftList.sort((a, b) => Math.abs(b) - Math.abs(a))
        this.elem.style[utils.leftRightReplace(this.options.direction)] = `-${Math.abs(this.leftList[0])}px`
    }
    remove() {
        this.elem.remove()
    }
    getElem() {
        return this.elem
    }
}
class CalloutItemLine {
    constructor(options, initOptions = {}) {
        const { itemLineClass: className = '', itemLineGap: gap = 0, direction } = initOptions
        this.options = Object.assign({
            className,
            gap,
            direction,
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
    update({ top, ...data }) {
        const { gap, direction } = this.options
        const distance = this.options.bottom - top - gap
        const side1 = data[utils.leftRightReplace(direction)]
        const side2 = Math.abs(distance)
        const height = Math.sqrt(Math.abs(side1) ** 2 + side2 ** 2)
        const deg = Math.atan(side1 / side2) * 180 / Math.PI
        this.elem.style.height = `${height}px`
        this.elem.style[utils.leftRightReplace(direction)] = `-1px`
        if (distance >= 0) {
            this.elem.style.top = `${gap}px`
            this.elem.style.bottom = ''
            this.elem.style.transformOrigin = 'right top'
            this.elem.style.transform = `rotate(${deg}deg)`
        } else {
            this.elem.style.bottom = `calc(100% - ${gap}px)`
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
    constructor (options, initOptions = {}) {
        const { itemLabelClass: labelClass = '', itemInputClass: inputClass = '', itemLabel: label = '' } = initOptions
        this.options = Object.assign({
            labelClass,
            inputClass,
            label,
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
        const elem = this.labelElem = document.createElement('div')
        elem.className = this.options.labelClass
        elem.innerHTML = this.options.label
        return elem
    }
    createInput () {
        const elem = this.inputElem = document.createElement('div')
        elem.className = this.options.inputClass
        elem.setAttribute('contenteditable', '')
        elem.innerText = this.options.value
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
    constructor(options, initOptions = {}) {
        const { itemClass: className = '', itemActiveClass: activeClass = '' } = this.initOptions = initOptions
        this.options = Object.assign({
            className,
            activeClass,
            bottom: 0,
            left: 0,
            key: '',
            value: '',
        }, options)
        this.elem = this.init()
    }
    active() {
        this.elem.classList.add(this.options.activeClass)
        this.form.updateInput()
        // this.form.inputFocus()
    }
    inactive() {
        this.elem.classList.remove(this.options.activeClass)
    }
    init() {
        const { className, bottom, left, key, value } = this.options
        const elem = document.createElement('div')
        elem.className = className
        elem.dataset.bottom = bottom
        elem.dataset.left = left
        elem.dataset.key = key
        const formElem = (this.form = new CalloutItemForm({ value }, this.initOptions)).getElem()
        const lineElem = (this.line = new CalloutItemLine({ bottom }, this.initOptions)).getElem()
        elem.append(formElem)
        elem.append(lineElem)
        return elem
    }
    remove() {
        this.elem.remove()
    }
    updateLine() {
        const { top, left, right } = utils.getBoundingClientRect(this.elem)
        const { left: containerLeft, right: containerRight } = utils.getBoundingClientRect(this.initOptions.container)
        this.line.update({ top, left: left - containerLeft, right: right - containerRight })
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
    constructor(options, initOptions = {}) {
        const { boxClass: className = '' } = this.initOptions = initOptions
        this.options = Object.assign({
            className,
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
    constructor(options) {
        console.log(options)
        const { onActive, ...options1 } = options
        this.options = Object.assign({
            container: '.dimension-text',
            boxContainerClass: 'dimension-list',
            lineContainerClass: 'dimension-lines',
            boxClass: 'dimension-items',
            itemClass: 'dimension-item',
            itemActiveClass: 'active',
            itemLineClass: 'dimension-item-line',
            itemLineGap: 10,
            itemLabelClass: 'dimension-label',
            itemInputClass: 'dimension-input',
            itemLabel: '标注:&nbsp;',
            lineClass: 'dimension-line',
            lineActiveClass: 'active',
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
    getElem ({ container, boxContainerClass, lineContainerClass, direction }) {
        if (typeof container === 'string') {
            this.options.container = container = document.querySelector(container)
        }
        container.innerHTML = `
            <div class="${lineContainerClass}" style="${utils.leftRightReplace(direction)}: 0;"></div>
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
    clear () {
        this.unbindEvent()
        this.options.container.innerHTML = ''
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
        this.toggleActive(box.addItem({ bottom, left, key, value }))
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
    createBox (options) {
        const { bottom } = options
        return this.box[bottom] = this.box[bottom] || new CalloutBox(options, this.options)
    }
    createLine (options) {
        const { bottom } = options
        return this.line[bottom] = this.line[bottom] || new CalloutLine(options, this.options)
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