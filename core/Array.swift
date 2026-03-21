// 扩展Swift的Array类型
public extension Array {
    func toString() -> String {
        return "[\(self.map { String(describing: $0) }.joined(separator: ", "))]"
    }
    
    func valueOf() -> Array {
        return self
    }
    
    var length: Int {
        return self.count
    }
    
    func push(_ element: Element) -> Int {
        var mutableSelf = self
        mutableSelf.append(element)
        return mutableSelf.count
    }
    
    func pop() -> Element? {
        var mutableSelf = self
        return mutableSelf.popLast()
    }
    
    func shift() -> Element? {
        var mutableSelf = self
        return mutableSelf.removeFirst()
    }
    
    func unshift(_ element: Element) -> Int {
        var mutableSelf = self
        mutableSelf.insert(element, at: 0)
        return mutableSelf.count
    }
    
    func slice(start: Int, end: Int? = nil) -> Array {
        let startIndex = Swift.max(0, start)
        if let end = end {
            let endIndex = Swift.min(self.count, end)
            return Array(self[startIndex..<endIndex])
        } else {
            return Array(self[startIndex...])
        }
    }
    
    func splice(start: Int, deleteCount: Int? = nil, elements: Element...) -> Array {
        var mutableSelf = self
        let startIndex = Swift.max(0, start)
        let deleteCount = deleteCount ?? 0
        let endIndex = Swift.min(self.count, startIndex + deleteCount)
        let removedElements = Array(self[startIndex..<endIndex])
        mutableSelf.removeSubrange(startIndex..<endIndex)
        mutableSelf.insert(contentsOf: elements, at: startIndex)
        return removedElements
    }
    
    func join(separator: String = ",") -> String {
        return self.map { String(describing: $0) }.joined(separator: separator)
    }
    
    func reverse() -> Array {
        return Array(self.reversed())
    }
    
    func sort(by comparator: (Element, Element) -> Bool) -> Array {
        return self.sorted(by: comparator)
    }
    
    func jsForEach(_ body: (Element) -> Void) {
        Swift.Array(self).forEach(body)
    }
    
    func jsMap<T>(_ transform: (Element) -> T) -> [T] {
        return Swift.Array(self).map(transform)
    }
    
    func jsFilter(_ isIncluded: (Element) -> Bool) -> Array {
        return Swift.Array(self).filter(isIncluded)
    }
    
    func jsReduce<Result>(_ initialResult: Result, _ nextPartialResult: (Result, Element) -> Result) -> Result {
        return Swift.Array(self).reduce(initialResult, nextPartialResult)
    }
}