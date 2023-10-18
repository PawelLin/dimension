import Callout from './callout.js'
class Dimension {
    constructor(options) {
        this.options = Object.assign({
            entry: '.dimension-contain',
            output: '.dimension-text',
            nodeName: 'dimension',
        }, options)
        this.data = {
            bottomData: {},
            bottomList: []
        }
        this.elem = {
            entry: document.querySelector(this.options.entry),
            output: document.querySelector(this.options.output),
            lines: document.querySelector('.dimension-lines'),
            list: document.querySelector('.dimension-list')
        }
        this.current = {
            key: null
        }
        this.activeItem = null
        this.initElem()
        // this.bindEvent()
        this.callout = new Callout()
        document.addEventListener('keyup', e => {
            if (e.code === 'KeyQ') {
                this.add()
            }
        })
    }
    initElem() {
        if (!this.elem.lines) {
            const lines = this.elem.lines = document.createElement('div')
            lines.className = 'dimension-lines'
            this.elem.output.appendChild(lines)
        }
        if (!this.elem.list) {
            const list = this.elem.list = document.createElement('div')
            list.className = 'dimension-list'
            this.elem.output.appendChild(list)
        }
    }
    bindEvent() {
        this.elem.output.addEventListener('click', e => {
            let target = e.target
            let hasItem = false
            while (target && !hasItem) {
                hasItem = target.className.includes('dimension-item')
                !hasItem && (target = target.parentElement)
            }
            this.toggleActiveItem(hasItem ? target : null)
        })
    }
    // 新增标注
    add(key = Date.now()) {
        this.current.key = key
        const { nodeName } = this.options
        const selection = window.getSelection()
        let { startContainer: startNode, endContainer: endNode, startOffset, endOffset } = selection.getRangeAt(0)
        let elem = startNode
        while (elem.parentElement !== this.elem.entry) {
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
            const { top, bottom, right } = node.getBoundingClientRect()
            const { top: linesTop, left: linesLeft } = this.elem.lines.getBoundingClientRect()
            this.callout.addBox({ bottom, top: top - linesTop, left: right - linesLeft, key }, { top: bottom - linesTop })
        })
    }
    // 删除标注
    remove() {
        if (this.activeItem) {
            const { bottom, left, key } = this.activeItem.dataset
            const sides = document.querySelectorAll(`.dimension-side[data-key="${key}"]`)
            const dimensions = document.querySelectorAll(`dimension[data-key*="${key}"]`)
            const nextItem = this.activeItem.nextElementSibling
            const parent = this.activeItem.parentElement
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
            this.activeItem.remove()
            if (nextItem) {
                this.toggleActiveItem(nextItem)
            }
            const line = this.getLineByBottom(bottom)
            if (!parent.children.length) {
                this.data.bottomList.splice(this.data.bottomList.indexOf(+bottom), 1)
                parent.remove()
                line.remove()
                this.activeItem = null
            } else {
                const leftList = line.dataset.left.split(',')
                leftList.splice(leftList.indexOf(left), 1)
                line.style.left = `${leftList.sort((a, b) => a - b)[0]}px`
                line.dataset.left = leftList.join(',')
            }
        }
    }
    // 更改选中状态
    toggleActiveItem(elem) {
        if (this.activeItem) {
            this.activeItem.classList.remove('active')
            this.getLineByBottom(this.activeItem.dataset.bottom).classList.remove('active')
        }
        if (elem) {
            this.activeItem = elem
            this.activeItem.classList.add('active')
            this.getLineByBottom(this.activeItem.dataset.bottom).classList.add('active')
            this.activeItem.querySelector('.dimension-input').focus()
        } else {
            this.activeItem = null
        }
    }
    // 获取指定data-bottom的底线节点
    getLineByBottom(bottom) {
        return document.querySelector(`.dimension-line[data-bottom="${bottom}"]`)
    }
    // 获取指定位置的底线节点
    getLineByIndex(index) {
        return document.querySelector(`.dimension-line:nth-child(${index})`)
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
    //
    mount () {
        Array.from(this.elem.entry.children).forEach(elem => {
            if (elem.innerText.match('<dimension data-key')) {
                elem.innerHTML = elem.innerText
            }
        })
        Array.from(document.querySelectorAll('.dimension-side.end')).forEach(elem => {
            const keys = elem.dataset.key.split(',')
            keys.forEach(key => {
                this.addOutputItem(elem, key)
            })
        })
    }
}

export default Dimension