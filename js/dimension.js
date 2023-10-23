import Callout from './callout.js'
import utils from './utils.js'
class Dimension {
    constructor(container, options) {
        const { direction, width, calloutClass, resize } = this.options = Object.assign({
            direction: 'right',
            width: 300,
            nodeName: 'dimension',
            calloutClass: 'dimension-callout'
        }, options, {
            reverseDirection: utils.reverseDirection(options.direction || 'right')
        })
        this.container = typeof container === 'string' ? document.querySelector(container) : container
        const { paddingLeft, paddingRight } = getComputedStyle(this.container)
        this.containerPadding = { left: parseFloat(paddingLeft), right: parseFloat(paddingRight) }
        this.container.style[`padding-${direction}`] = `${width + this.containerPadding[direction]}px`
        this.calloutContainer = this.container.querySelector(`.${calloutClass}`)
        if (!this.calloutContainer) {
            this.calloutContainer = document.createElement('div')
            this.container.appendChild(this.calloutContainer)
        }
        this.calloutContainer.className = `${calloutClass} ${calloutClass}-${direction}`
        this.calloutContainer.style.width = `${width}px`
        this.current = {
            key: null
        }
        this.callout = new Callout(this.calloutContainer, {
            ...this.options,
            onActive: this.onActive
        })
        if (resize) {
            this.onResize = utils.debounce(this.resize.bind(this))
            this.bindEvent()
        }
        document.addEventListener('keyup', e => {
            if (e.code === 'KeyQ') {
                this.add()
            }
        })
    }
    onActive (newKey, oldKey) {
        if (oldKey) {
            Array.from(document.querySelectorAll(`dimension[data-key*="${oldKey}"]`)).forEach(elem => {
                elem.classList.remove('active')
            })
        }
        if (newKey) {
            Array.from(document.querySelectorAll(`dimension[data-key*="${newKey}"]`)).forEach(elem => {
                elem.classList.add('active')
            })
        }
    }
    // 新增标注
    add(key = Date.now()) {
        this.current.key = key
        const { nodeName } = this.options
        const selection = window.getSelection()
        let { startContainer: startNode, endContainer: endNode, startOffset, endOffset } = selection.getRangeAt(0)
        if (this.calloutContainer.contains(startNode)) return
        let elem = startNode
        while (elem.parentElement !== this.container) {
            elem = elem.parentElement
        }
        const list = this.getChildNodes(elem, startNode, endNode).filter(node => node.nodeType === Node.TEXT_NODE)
        if (startNode.textContent.length === startOffset) {
            list.shift()
            startNode = list[0]
            startOffset = 0
        }
        if (endNode.nodeType !== Node.TEXT_NODE) {
            endNode = list[list.length - 1]
            endOffset = endNode.textContent.length
        }
        for (const node of list) {
            let text = node.textContent
            let dimensionText = text
            let startText = ''
            let endText = ''
            const isStart = node === startNode
            const isEnd = node === endNode
            if (isStart && startOffset) {
                startText = text.substring(0, startOffset)
                dimensionText = text.substring(startOffset, text.length)
            }
            if (isEnd && endOffset < text.length) {
                endText = text.substring(endOffset)
                dimensionText = dimensionText.substring(0, dimensionText.length - endText.length)
            }
            const parent = node.parentElement
            if (!startText && !endText && parent.nodeName.toLowerCase() === nodeName.toLowerCase()) {
                parent.dataset.key = `${parent.dataset.key},${key}`
                const { endSide } = this.addSide(parent, `${+isStart}${+isEnd}`)
                if (isEnd) {
                    this.addOutputItem(endSide, key)
                }
                continue
            }
            if (dimensionText) {
                const dimension = document.createElement(nodeName)
                dimension.innerText = dimensionText
                dimension.dataset.key = key
                parent.replaceChild(dimension, node)
                const { endSide } = this.addSide(dimension, `${+isStart}${+isEnd}`)
                if (isEnd) {
                    this.addOutputItem(endSide, key)
                }
                if (startText) {
                    parent.insertBefore(document.createTextNode(startText), dimension)
                }
                if (endText) {
                    parent.insertBefore(document.createTextNode(endText), dimension.nextSibling)
                }
            }
        }
        selection.removeAllRanges()
    }
    /**
     * 
     * @param {*} parent 
     * @param {*} type 00-不添加 01-添加结尾 10-添加开头 11-添加首尾
     */
    addSide(parent, type) {
        if (!type || type === '00') return {}
        let startSide = null
        let endSide = null
        if (type.indexOf(1) === 0) {
            const span = document.createElement('span')
            span.className = 'dimension-side start'
            span.dataset.key = this.current.key
            parent.insertBefore(span, parent.firstChild)
            startSide = span
        }
        if (type.lastIndexOf(1) === 1) {
            const span = document.createElement('span')
            span.className = 'dimension-side end'
            span.dataset.key = this.current.key
            parent.appendChild(span)
            endSide = span
        }
        return { startSide, endSide }
    }
    // 新增标注块
    addOutputItem(node, key) {
        window.requestAnimationFrame(() => {
            const { top, bottom, left } = utils.getBoundingClientRect(node)
            const { width: containerWidth } = utils.getBoundingClientRect(this.container)
            const { direction, width } = this.options
            const leftWidth = left - (direction === 'left' ? width : 0)
            this.callout.addBox({
                top,
                bottom,
                left: leftWidth,
                right: containerWidth - leftWidth - width,
                key: `${key}`
            })
        })
    }
    // 删除标注
    remove() {
        this.callout.removeBox(({ key }) => {
            const sides = document.querySelectorAll(`.dimension-side[data-key="${key}"]`)
            const dimensions = document.querySelectorAll(`dimension[data-key*="${key}"]`)
            Array.from(sides).forEach(elem => elem.remove())
            Array.from(dimensions).forEach(elem => {
                const newKey = elem.dataset.key.split(',').filter(key1 => key1 !== key).join(',')
                if (newKey) {
                    elem.dataset.key = newKey
                } else {
                    const childNodes = elem.childNodes
                    let index = childNodes.length
                    while (childNodes[--index]) {
                        elem.parentElement.insertBefore(childNodes[index], elem.nextSibling)
                    }
                    elem.remove()
                }
            })
        })
    }
    getData () {
        const data = this.callout.getItemValue()
        console.log(data)
    }
    // 获取框选开始到结束的节点集合
    getChildNodes(node, startNode, endNode, list = [], isParent = true) {
        if (!list.includes(endNode)) {
            for (const node1 of node.childNodes) {
                if (list.includes(endNode)) break
                if (this.isValidNode(node1) && ((!list.length && node1 === startNode) || list.length)) {
                    list.push(node1)
                }
                if (list.includes(endNode)) break
                this.getChildNodes(node1, startNode, endNode, list, false)
            }
            if (isParent) {
                const nextNode = node.nextSibling
                nextNode && this.getChildNodes(nextNode, startNode, endNode, list)
            }
        }
        return list
    }
    // 判断是否为有效节点
    isValidNode(node) {
        return node.nodeType === Node.TEXT_NODE ? !!node.textContent.replace(/^(\n\s+)?(.*)(\n\s+)?$/, '$2') : true
    }
    changeDirection (direction) {
        const { width, calloutClass } = this.options
        const reverseDirection = utils.reverseDirection(direction)
        this.options.direction = direction
        this.options.reverseDirection = reverseDirection
        this.container.style[`padding-${direction}`] = `${width + this.containerPadding[direction]}px`
        this.container.style[`padding-${reverseDirection}`] = `${this.containerPadding[reverseDirection]}px`
        this.calloutContainer.className = `${calloutClass} ${calloutClass}-${direction}`
        this.calloutContainer.classList.replace(reverseDirection, direction)
        this.callout.changeDirection(direction, this.options.reverseDirection)
    }
    resize () {
        this.callout.unbindEvent()
        this.callout = new Callout(this.calloutContainer, {
            ...this.options,
            onActive: this.onActive
        })
        this.mountCallout()
    }
    bindEvent () {
        window.addEventListener('resize', this.onResize)
    }
    unbindEvent () {
        this.callout.unbindEvent()
        window.removeEventListener('resize', thi.onResize)
    }
    mount () {
        Array.from(this.container.children).forEach(elem => {
            if (elem.innerText.match('<dimension data-key')) {
                elem.innerHTML = elem.innerText
                this.mountCallout(elem)
            }
        })
    }
    mountCallout (elem = this.container) {
        Array.from(elem.querySelectorAll('.dimension-side.end')).forEach(elem => {
            const keys = elem.dataset.key.split(',')
            keys.forEach(key => {
                this.addOutputItem(elem, key)
            })
        })
    }
}

export default Dimension