// 扩展 Swift 的 Array 类型
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
    
    // ES6: arr.push(item) - 返回新长度
    mutating func push(_ element: Element) -> Int {
        self.append(element)
        return self.count
    }
    
    // ES6: arr.pop() - 返回被删除的元素
    mutating func pop() -> Element? {
        return self.popLast()
    }
    
    // ES6: arr.shift() - 返回被删除的第一个元素
    mutating func shift() -> Element? {
        guard !self.isEmpty else { return nil }
        return self.removeFirst()
    }
    
    // ES6: arr.unshift(item) - 返回新长度
    mutating func unshift(_ element: Element) -> Int {
        self.insert(element, at: 0)
        return self.count
    }
    
    // ES6: arr.slice(start, end)
    func slice(_ start: Int, _ end: Int? = nil) -> Array {
        let startIndex = Swift.max(0, start)
        if let end = end {
            let endIndex = Swift.min(self.count, end)
            return Array(self[startIndex..<endIndex])
        } else {
            return Array(self[startIndex...])
        }
    }
    
    // ES6: arr.concat(arr2)
    func concat(_ other: [Element]) -> [Element] {
        return self + other
    }
    
    // ES6: arr.includes(value)
    func includes(_ element: Element) -> Bool where Element: Equatable {
        return self.contains(element)
    }
    
    // ES6: arr.find(predicate)
    func find(_ predicate: @escaping (Element) -> Bool) -> Element? {
        return self.first(where: predicate)
    }
    
    // ES6: arr.findIndex(predicate)
    func findIndex(_ predicate: @escaping (Element) -> Bool) -> Int? {
        return self.firstIndex(where: predicate)
    }
    
    // ES6: arr.every(predicate)
    func every(_ predicate: @escaping (Element) -> Bool) -> Bool {
        return self.allSatisfy(predicate)
    }
    
    // ES6: arr.some(predicate)
    func some(_ predicate: @escaping (Element) -> Bool) -> Bool {
        return self.contains(where: predicate)
    }
    
    // ES6: arr.reverse() - 返回新数组
    func reverse() -> Array {
        return Array(self.reversed())
    }
    
    // ES6: arr.sort() - 返回新数组
    func sort() -> Array where Element: Comparable {
        return self.sorted()
    }
    
    // ES6: arr.join(separator)
    func join(_ separator: String = ",") -> String where Element: CustomStringConvertible {
        return self.map { $0.description }.joined(separator: separator)
    }
    
    // ES6: arr.reduce(callback, initial) - 参数顺序与 Swift 相反
    func reduceES6<T>(_ callback: @escaping (T, Element) -> T, _ initial: T) -> T {
        return self.reduce(initial) { callback($0, $1) }
    }
    
    // 便捷方法
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
    
    // 兼容旧的 API
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