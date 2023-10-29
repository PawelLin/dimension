import Callout from './callout.js'
import utils from './utils.js'
class Dimension {
    constructor(container, options) {
        const { resize } = this.options = Object.assign({
            direction: 'right',
            width: 300,
            nodeName: 'dimension',
            containerClass: 'dimension-container',
            sideClass: 'dimension-side',
            sideStartClass: 'dimension-side-start',
            sideEndClass: 'dimension-side-end',
            calloutClass: 'dimension-callout'
        }, options, {
            reverseDirection: utils.reverseDirection(options.direction || 'right')
        })
        const { calloutContainer } = this.initContainer(container)
        this.callout = new Callout(calloutContainer, {
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
    initContainer (container) {
        const { width, direction, reverseDirection, containerClass, calloutClass } = this.options
        if (!this.container) {
            this.container = typeof container === 'string' ? document.querySelector(container) : container
            this.container.classList.add(containerClass)
        }
        if (!this.containerPadding) {
            const { paddingLeft, paddingRight } = getComputedStyle(this.container)
            this.containerPadding = { left: parseFloat(paddingLeft), right: parseFloat(paddingRight) }
        }
        this.container.style[`padding-${direction}`] = `${width + this.containerPadding[direction]}px`
        this.container.style[`padding-${reverseDirection}`] = `${this.containerPadding[reverseDirection]}px`
        if (!this.calloutContainer) {
            let calloutContainer = this.container.querySelector(`.${calloutClass}`)
            if (!calloutContainer) {
                calloutContainer = document.createElement('div')
                this.container.appendChild(calloutContainer)
            }
            this.calloutContainer = calloutContainer
            this.calloutContainer.style.width = `${width}px`
        }
        this.calloutContainer.className = `${calloutClass} ${calloutClass}-${direction}`
        return {
            container: this.container,
            calloutContainer: this.calloutContainer
        }
    }
    resize () {
        this.callout.reset()
        this.mountCallout()
    }
    bindEvent () {
        window.addEventListener('resize', this.onResize)
    }
    unbindEvent () {
        this.callout.unbindEvent()
        this.container.classList.remove(this.options.containerClass)
        window.removeEventListener('resize', thi.onResize)
    }
    onActive (newKey, oldKey) {
        const { nodeName } = this.options
        if (oldKey) {
            Array.from(document.querySelectorAll(`${nodeName}[data-key*="${oldKey}"]`)).forEach(elem => {
                elem.classList.remove('active')
            })
        }
        if (newKey) {
            Array.from(document.querySelectorAll(`${nodeName}[data-key*="${newKey}"]`)).forEach(elem => {
                elem.classList.add('active')
            })
        }
    }
    // 新增标注
    add(key = Date.now()) {
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
                this.addSide(parent, `${+isStart}${+isEnd}`, key)
                continue
            }
            if (dimensionText) {
                const dimension = document.createElement(nodeName)
                dimension.innerText = dimensionText
                dimension.dataset.key = key
                parent.replaceChild(dimension, node)
                this.addSide(dimension, `${+isStart}${+isEnd}`, key)
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
    addSide(parent, type, key) {
        const { sideClass, sideStartClass, sideEndClass } = this.options
        if (type.indexOf(1) === 0) {
            const span = document.createElement('span')
            span.className = `${sideClass} ${sideStartClass}`
            span.dataset.key = key
            parent.insertBefore(span, parent.firstChild)
        }
        if (type.lastIndexOf(1) === 1) {
            const span = document.createElement('span')
            span.className = `${sideClass} ${sideEndClass}`
            span.dataset.key = key
            parent.appendChild(span)
            this.addCalloutBox(span, key)
        }
    }
    // 新增标注块
    addCalloutBox(node, key, active) {
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
            }, active)
        })
    }
    // 删除标注
    remove() {
        const { sideClass, nodeName } = this.options
        this.callout.removeBox(({ key }) => {
            const sides = document.querySelectorAll(`.${sideClass}[data-key="${key}"]`)
            const dimensions = document.querySelectorAll(`${nodeName}[data-key*="${key}"]`)
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
    getData () {
        const data = this.callout.getItemValue()
        console.log(data)
    }
    changeDirection (direction) {
        const reverseDirection = utils.reverseDirection(direction)
        Object.assign(this.options, { direction, reverseDirection })
        this.initContainer()
        this.callout.changeDirection(direction, reverseDirection)
    }
    mount () {
        Array.from(this.container.children).forEach(elem => {
            if (elem.innerText.match(`<${this.options.nodeName} data-key`)) {
                elem.innerHTML = elem.innerText
                this.mountCallout(elem)
            }
        })
    }
    mountCallout (elem = this.container) {
        const { sideClass, sideEndClass } = this.options
        Array.from(elem.querySelectorAll(`.${sideClass}.${sideEndClass}`)).forEach(elem => {
            const keys = elem.dataset.key.split(',')
            keys.forEach(key => {
                this.addCalloutBox(elem, key, false)
            })
        })
    }
}

export default Dimension