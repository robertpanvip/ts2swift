public struct Undefined: Equatable, CustomStringConvertible, Hashable {
    public init() {}
    
    public var description: String {
        return "undefined"
    }
    
    public func toString() -> String {
        return "undefined"
    }
    
    public func valueOf() -> Undefined {
        return self
    }
}

// 全局 undefined 实例
public let undefined = Undefined()

// MARK: - Undefined 自身比较

public func == (lhs: Undefined, rhs: Undefined) -> Bool {
    return true
}

public func != (lhs: Undefined, rhs: Undefined) -> Bool {
    return false
}

public func === (lhs: Undefined, rhs: Undefined) -> Bool {
    return true
}

public func !== (lhs: Undefined, rhs: Undefined) -> Bool {
    return false
}

// MARK: - Undefined 逻辑运算符

public prefix func ! (value: Undefined) -> Bool {
    return true  // !undefined === true
}

public prefix func - (value: Undefined) -> Double {
    return Double.nan  // -undefined = NaN
}

// MARK: - Undefined 算术运算

public func + (lhs: Undefined, rhs: Undefined) -> Double {
    return Double.nan
}

public func + (lhs: Undefined, rhs: Number) -> Double {
    return Double.nan
}

public func + (lhs: Number, rhs: Undefined) -> Double {
    return Double.nan
}

public func + (lhs: Undefined, rhs: Double) -> Double {
    return Double.nan
}

public func + (lhs: Double, rhs: Undefined) -> Double {
    return Double.nan
}

public func + (lhs: Undefined, rhs: Int) -> Double {
    return Double.nan
}

public func + (lhs: Int, rhs: Undefined) -> Double {
    return Double.nan
}

public func - (lhs: Undefined, rhs: Undefined) -> Double {
    return Double.nan
}

public func - (lhs: Undefined, rhs: Number) -> Double {
    return Double.nan
}

public func - (lhs: Number, rhs: Undefined) -> Double {
    return Double.nan
}

public func * (lhs: Undefined, rhs: Undefined) -> Double {
    return Double.nan
}

public func * (lhs: Undefined, rhs: Number) -> Double {
    return Double.nan
}

public func * (lhs: Number, rhs: Undefined) -> Double {
    return Double.nan
}

public func / (lhs: Undefined, rhs: Undefined) -> Double {
    return Double.nan
}

public func / (lhs: Undefined, rhs: Number) -> Double {
    return Double.nan
}

public func / (lhs: Number, rhs: Undefined) -> Double {
    return Double.nan
}

// MARK: - Optional 与 Undefined 比较

public func == <T>(lhs: T?, rhs: Undefined) -> Bool {
    if lhs == nil {
        return true  // nil == undefined
    }
    if let value = lhs {
        // 如果值是 Undefined 本身，返回 true
        if value is Undefined {
            return true
        }
        // 如果值是 Void/()，也认为等于 undefined
        if value is Void {
            return true
        }
        // 如果值是 Null，也认为等于 undefined（TypeScript 中 null == undefined）
        if value is Null {
            return true
        }
    }
    return false
}

public func != <T>(lhs: T?, rhs: Undefined) -> Bool {
    return !(lhs == rhs)
}

public func == <T>(lhs: Undefined, rhs: T?) -> Bool {
    return rhs == lhs
}

public func != <T>(lhs: Undefined, rhs: T?) -> Bool {
    return !(lhs == rhs)
}

// MARK: - Optional ?? 运算符重写

public func ?? <T>(lhs: T?, rhs: Undefined) -> T? {
    if lhs == Undefined() {
        return rhs as? T
    }
    return lhs
}

public func ?? <T>(lhs: T?, rhs: T) -> T {
    if lhs == Undefined() || lhs == nil {
        return rhs
    }
    return lhs!
}
