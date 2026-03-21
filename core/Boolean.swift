// 扩展 Swift 的 Bool 类型 - 符合 ES6 Boolean 规范
public extension Bool {
    func toString() -> String {
        return self ? "true" : "false"
    }
    
    func valueOf() -> Bool {
        return self
    }
    
    // ES6 Boolean 实例方法
    func value() -> Bool {
        return self
    }
}

// Boolean 构造函数
public func Boolean(_ value: Any? = false) -> Bool {
    if let value = value as? Bool {
        return value
    }
    if let value = value as? Number {
        return value.value != 0 && !value.value.isNaN
    }
    if let value = value as? String {
        return !value.isEmpty
    }
    return value != nil && value as? Null == nil && value as? Undefined == nil
}