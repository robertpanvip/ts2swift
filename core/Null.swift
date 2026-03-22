public struct Null: Equatable, CustomStringConvertible, Hashable {
    public init() {}
    
    public var description: String {
        return "null"
    }
    
    public func toString() -> String {
        return "null"
    }
    
    public func valueOf() -> Null {
        return self
    }
}

// 全局 null 实例
public let null = Null()

// MARK: - Null 自身比较

public func == (lhs: Null, rhs: Null) -> Bool {
    return true
}

public func != (lhs: Null, rhs: Null) -> Bool {
    return false
}

public func === (lhs: Null, rhs: Null) -> Bool {
    return true
}

public func !== (lhs: Null, rhs: Null) -> Bool {
    return false
}

// MARK: - Null 与 Any? 比较

public func == (lhs: Null, rhs: Any?) -> Bool {
    if rhs == nil {
        return true  // null == nil 为 true
    }
    if rhs is Null {
        return true
    }
    if rhs is Undefined {
        return true  // null == undefined 为 true
    }
    if rhs is Void {
        return true  // null == () 为 true
    }
    return false
}

public func != (lhs: Null, rhs: Any?) -> Bool {
    if rhs == nil {
        return false
    }
    if rhs is Null {
        return false
    }
    if rhs is Undefined {
        return false
    }
    if rhs is Void {
        return false
    }
    return true
}

public func === (lhs: Null, rhs: Any?) -> Bool {
    if rhs == nil {
        return false  // null === nil 为 false
    }
    if rhs is Null {
        return true
    }
    if rhs is Undefined {
        return false  // null === undefined 为 false
    }
    if rhs is Void {
        return false  // null === () 为 false
    }
    return false
}

public func !== (lhs: Null, rhs: Any?) -> Bool {
    if rhs == nil {
        return true
    }
    if rhs is Null {
        return false
    }
    if rhs is Undefined {
        return true
    }
    if rhs is Void {
        return true
    }
    return true
}

// 反向比较
public func == (lhs: Any?, rhs: Null) -> Bool {
    if lhs == nil {
        return true
    }
    if lhs is Null {
        return true
    }
    if lhs is Undefined {
        return true
    }
    if lhs is Void {
        return true
    }
    return false
}

public func != (lhs: Any?, rhs: Null) -> Bool {
    if lhs == nil {
        return false
    }
    if lhs is Null {
        return false
    }
    if lhs is Undefined {
        return false
    }
    if lhs is Void {
        return false
    }
    return true
}

public func === (lhs: Any?, rhs: Null) -> Bool {
    if lhs == nil {
        return false
    }
    if lhs is Null {
        return true
    }
    if lhs is Undefined {
        return false
    }
    if lhs is Void {
        return false
    }
    return false
}

public func !== (lhs: Any?, rhs: Null) -> Bool {
    if lhs == nil {
        return true
    }
    if lhs is Null {
        return false
    }
    if lhs is Undefined {
        return true
    }
    if lhs is Void {
        return true
    }
    return true
}
