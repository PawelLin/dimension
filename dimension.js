class Dimension {
    constructor(options) {
        this.options = Object.assign({
            entry: '.dimension-contain',
            output: '.dimension-text',
            nodeName: 'dimension',
        }, options)
        this.data = {
            bottomData: {},
            bottomList: [],
            startKeys: [],
            endKeys: []
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
        this.bindEvent()
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
                this.addSide(parent, `${+isStart}${+isEnd}`)
                if (isEnd) {
                    this.addOutputItem(parent, key)
                }
                continue
            }
            if (dimensionText) {
                const dimension = document.createElement(nodeName)
                dimension.innerText = dimensionText
                dimension.dataset.key = key
                parent.replaceChild(dimension, node)
                this.addSide(dimension, `${+isStart}${+isEnd}`)
                if (isEnd) {
                    this.addOutputItem(dimension, key)
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
    addSide (parent, type) {
        if (!type || type === '00') return
        if (type.indexOf(1) === 0) {
            const span = document.createElement('span')
            span.className = 'dimension-start'
            parent.insertBefore(span, parent.firstChild)
            this.data.startKeys.push(this.current.key)
        }
        if (type.lastIndexOf(1) === 1) {
            const span = document.createElement('span')
            span.className = 'dimension-end'
            parent.appendChild(span)
            this.data.endKeys.push(this.current.key)
        }
    }
    // 新增标注块
    addOutputItem(node, key) {
        window.requestAnimationFrame(() => {
            const { top, bottom, right } = node.getBoundingClientRect()
            const { top: linesTop, left: linesLeft } = this.elem.lines.getBoundingClientRect()
            this.addLine({ bottom, top: bottom - linesTop, left: right - linesLeft })
            this.activeItem = this.addItem({ bottom, top: top - linesTop, key })
        })
    }
    // 新增标注虚线
    addLine({ top, bottom, left }) {
        const bottomList = this.data.bottomList
        const bottomIndex = this.data.bottomList.indexOf(bottom)
        if (bottomIndex < 0) {
            const closestBottomIndex = bottomList.findLastIndex((bottom1, index) => (bottom1 || bottom) <= bottom && (bottomList[index + 1] || bottom) >= bottom)
            const line = document.createElement('div')
            line.className = 'dimension-line'
            line.dataset.bottom = bottom
            line.style.top = `${top}px`
            line.style.left = `${left}px`
            if (closestBottomIndex > -1) {
                this.elem.lines.insertBefore(line, this.getLineByIndex(closestBottomIndex + 1).nextSibling)
                this.data.bottomList.splice(closestBottomIndex + 1, 0, bottom)
            } else {
                this.elem.lines.insertBefore(line, this.elem.lines.firstChild)
                this.data.bottomList.unshift(bottom)
            }
            console.log(this.data.bottomList)
        } else {
            const line = this.getLineByIndex(bottomIndex + 1)
            line.style.left = `${Math.min(left, parseFloat(line.style.left))}px`
        }
        return bottomIndex
    }
    // 新增标注输入框
    addItem({ top, bottom, key }) {
        let items = document.querySelector(`.dimension-items[data-bottom="${bottom}"]`)
        if (!items) {
            items = document.createElement('div')
            items.className = 'dimension-items'
            items.dataset.bottom = bottom
            items.style.top = `${top}px`
            this.elem.list.appendChild(items)
        }
        const item = document.createElement('div')
        item.className = 'dimension-item'
        item.dataset.bottom = bottom
        item.dataset.key = key
        item.innerHTML = `<label class="dimension-label">标注：</label>
            <div class="dimension-input" contenteditable>&nbsp;</div>`
        items.appendChild(item)
        this.toggleActiveItem(item)
        return item
    }
    // 删除标注
    remove() {
        if (this.activeItem) {
            const { bottom, key } = this.activeItem.dataset
            const dimensions = document.querySelectorAll(`dimension[data-key*="${key}"]`)
            const nextItem = this.activeItem.nextElementSibling
            const parent = this.activeItem.parentElement
            Array.from(dimensions).forEach(elem => {
                const newKey = elem.dataset.key.split(',').filter(key1 => key1 !== key).join(',')
                if (newKey) {
                    elem.dataset.key = newKey
                } else {
                    const text = document.createTextNode(`${elem.innerText}`)
                    elem.parentElement.replaceChild(text, elem)
                }
            })
            this.activeItem.remove()
            nextItem && this.toggleActiveItem(nextItem)
            if (!parent.children.length) {
                this.data.bottomList.splice(this.data.bottomList.indexOf(bottom), 1)
                parent.remove()
                this.getLineByBottom(bottom).remove()
                this.activeItem = null
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
}

export default Dimension