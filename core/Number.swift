public struct Number {
    public let value: Double
    
    public init(_ value: Double) {
        self.value = value
    }
    
    public init(_ value: Int) {
        self.value = Double(value)
    }
    
    public init(_ value: String) {
        self.value = Double(value) ?? 0.0
    }
    
    public init(_ value: Any) {
        self.value = Double(String(describing: value)) ?? 0.0
    }
    
    public func toString() -> String {
        return String(value)
    }
    
    public func valueOf() -> Double {
        return value
    }
    
    public func toFixed(_ digits: Int) -> String {
        return String(format: "%.\(digits)f", value)
    }
    
    public func toExponential(_ digits: Int? = nil) -> String {
        if let digits = digits {
            return String(format: "%.\(digits)e", value)
        } else {
            return String(format: "%e", value)
        }
    }
    
    public func toPrecision(_ precision: Int) -> String {
        return String(format: "%.\(precision-1)g", value)
    }
}

// 为 Number 类型添加运算符支持
public extension Number {
    static func + (lhs: Number, rhs: Number) -> Number {
        return Number(lhs.value + rhs.value)
    }
    
    static func - (lhs: Number, rhs: Number) -> Number {
        return Number(lhs.value - rhs.value)
    }
    
    static func * (lhs: Number, rhs: Number) -> Number {
        return Number(lhs.value * rhs.value)
    }
    
    static func / (lhs: Number, rhs: Number) -> Number {
        return Number(lhs.value / rhs.value)
    }
    
    static func == (lhs: Number, rhs: Number) -> Bool {
        return lhs.value == rhs.value
    }
    
    static func < (lhs: Number, rhs: Number) -> Bool {
        return lhs.value < rhs.value
    }
    
    static func > (lhs: Number, rhs: Number) -> Bool {
        return lhs.value > rhs.value
    }
    
    static func <= (lhs: Number, rhs: Number) -> Bool {
        return lhs.value <= rhs.value
    }
    
    static func >= (lhs: Number, rhs: Number) -> Bool {
        return lhs.value >= rhs.value
    }
}

// Number 与 Int 的比较运算符
public func < (lhs: Number, rhs: Int) -> Bool {
    return lhs.value < Double(rhs)
}

public func <= (lhs: Number, rhs: Int) -> Bool {
    return lhs.value <= Double(rhs)
}

public func > (lhs: Number, rhs: Int) -> Bool {
    return lhs.value > Double(rhs)
}

public func >= (lhs: Number, rhs: Int) -> Bool {
    return lhs.value >= Double(rhs)
}

public func == (lhs: Number, rhs: Int) -> Bool {
    return lhs.value == Double(rhs)
}

public func < (lhs: Int, rhs: Number) -> Bool {
    return Double(lhs) < rhs.value
}

public func <= (lhs: Int, rhs: Number) -> Bool {
    return Double(lhs) <= rhs.value
}

public func > (lhs: Int, rhs: Number) -> Bool {
    return Double(lhs) > rhs.value
}

public func >= (lhs: Int, rhs: Number) -> Bool {
    return Double(lhs) >= rhs.value
}

public func == (lhs: Int, rhs: Number) -> Bool {
    return Double(lhs) == rhs.value
}

// 扩展 Array 支持 Number 类型的索引
public extension Array {
    subscript(index: Number) -> Element {
        get {
            return self[Int(index.value)]
        }
        set {
            self[Int(index.value)] = newValue
        }
    }
}

// 扩展 Dictionary 支持 String 和 Number 类型的索引
public extension Dictionary where Key == String {
    subscript(key: Number) -> Value? {
        get {
            return self[key.toString()]
        }
        set {
            self[key.toString()] = newValue
        }
    }
}

// 字符串拼接运算符支持

// Number + String
public func + (lhs: Number, rhs: String) -> String {
    return lhs.toString() + rhs
}

public func + (lhs: String, rhs: Number) -> String {
    return lhs + rhs.toString()
}

// Null + String
public func + (lhs: Null, rhs: String) -> String {
    return lhs.toString() + rhs
}

public func + (lhs: String, rhs: Null) -> String {
    return lhs + lhs.toString()
}

// Undefined + String
public func + (lhs: Undefined, rhs: String) -> String {
    return lhs.toString() + rhs
}

public func + (lhs: String, rhs: Undefined) -> String {
    return lhs + rhs.toString()
}

// Bool + String
public func + (lhs: Bool, rhs: String) -> String {
    return lhs.toString() + rhs
}

public func + (lhs: String, rhs: Bool) -> String {
    return lhs + rhs.toString()
}

// Any + String
public func + (lhs: Any, rhs: String) -> String {
    return convertToString(lhs) + rhs
}

public func + (lhs: String, rhs: Any) -> String {
    return lhs + convertToString(rhs)
}
