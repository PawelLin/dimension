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
            container: document.querySelector('.dimension-list')
        }, options)
        this.box = {}
        this.boxBottomList = []
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
        console.log(target)
    }
    bindEvent () {
        document.addEventListener('click', this.onClick)
    }
    unbindEvent () {
        document.removeEventListener('click', this.onClick)
    }
    setBoxTop () {

    }
    addBox (data) {
        const { bottom, top, left, key } = data
        const boxElem = (this.box[bottom] = this.box[bottom] || new CalloutBox({ bottom, top })).getElem()
        const itemElem = new CalloutItem({ bottom, left, key }).getElem()
        boxElem.appendChild(itemElem)
        if (!this.boxBottomList.includes(bottom)) {
            const index = this.getClosestBottomIndex(bottom)
            if (index > -1) {
                this.boxBottomList.splice(index + 1, 0, bottom)
            } else {
                this.boxBottomList.unshift(bottom)
            }
            this.options.container.insertBefore(boxElem, this.options.container.children[index + 1])
        }
        console.log(this.boxBottomList)
    }
    removeBox () {

    }
    getClosestBottomIndex (bottom) {
        return this.boxBottomList.findLastIndex((bottom1, index) => (bottom1 || bottom) <= bottom && (this.boxBottomList[index + 1] || bottom) >= bottom)
    }
}
export default Callout