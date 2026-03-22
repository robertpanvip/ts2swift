/// Void 类型扩展 - 为 Swift 原生的 Void 类型添加 TypeScript 语义的操作符
/// 在 TypeScript 中：
/// - void 表示函数没有返回值
/// - undefined 表示未定义的值
/// - void == undefined 为 true
/// - void === undefined 为 true

import Foundation

// MARK: - Void 与 Undefined 比较

public func == (lhs: Void, rhs: Undefined) -> Bool {
    return true  // () == undefined 为 true (TypeScript 语义)
}

public func != (lhs: Void, rhs: Undefined) -> Bool {
    return false
}

public func === (lhs: Void, rhs: Undefined) -> Bool {
    return true  // () === undefined 为 true
}

public func !== (lhs: Void, rhs: Undefined) -> Bool {
    return false
}

// 反向比较
public func == (lhs: Undefined, rhs: Void) -> Bool {
    return true
}

public func != (lhs: Undefined, rhs: Void) -> Bool {
    return false
}

public func === (lhs: Undefined, rhs: Void) -> Bool {
    return true
}

public func !== (lhs: Undefined, rhs: Void) -> Bool {
    return false
}

// MARK: - Void 与 Null 比较

public func == (lhs: Void, rhs: Null) -> Bool {
    return true  // () == null 为 true (TypeScript 语义：null == undefined)
}

public func != (lhs: Void, rhs: Null) -> Bool {
    return false
}

public func === (lhs: Void, rhs: Null) -> Bool {
    return false  // () === null 为 false (严格相等)
}

public func !== (lhs: Void, rhs: Null) -> Bool {
    return true
}

// 反向比较
public func == (lhs: Null, rhs: Void) -> Bool {
    return true
}

public func != (lhs: Null, rhs: Void) -> Bool {
    return false
}

public func === (lhs: Null, rhs: Void) -> Bool {
    return false
}

public func !== (lhs: Null, rhs: Void) -> Bool {
    return true
}

// MARK: - Undefined 与 Null 比较

public func == (lhs: Undefined, rhs: Null) -> Bool {
    return true  // undefined == null 为 true (TypeScript 语义)
}

public func != (lhs: Undefined, rhs: Null) -> Bool {
    return false
}

public func === (lhs: Undefined, rhs: Null) -> Bool {
    return false  // undefined === null 为 false (严格相等)
}

public func !== (lhs: Undefined, rhs: Null) -> Bool {
    return true
}

// 反向比较
public func == (lhs: Null, rhs: Undefined) -> Bool {
    return true
}

public func != (lhs: Null, rhs: Undefined) -> Bool {
    return false
}

public func === (lhs: Null, rhs: Undefined) -> Bool {
    return false
}

public func !== (lhs: Null, rhs: Undefined) -> Bool {
    return true
}

// MARK: - Undefined 与 Void 算术运算

public func + (lhs: Undefined, rhs: Void) -> Double {
    return Double.nan
}

public func + (lhs: Void, rhs: Undefined) -> Double {
    return Double.nan
}

public func - (lhs: Undefined, rhs: Void) -> Double {
    return Double.nan
}

public func - (lhs: Void, rhs: Undefined) -> Double {
    return Double.nan
}

public func * (lhs: Undefined, rhs: Void) -> Double {
    return Double.nan
}

public func * (lhs: Void, rhs: Undefined) -> Double {
    return Double.nan
}

public func / (lhs: Undefined, rhs: Void) -> Double {
    return Double.nan
}

public func / (lhs: Void, rhs: Undefined) -> Double {
    return Double.nan
}

// MARK: - Undefined 类型转换

extension String {
    public init(_ value: Undefined) {
        self = "undefined"
    }
}

extension Bool {
    public init(_ value: Undefined) {
        self = false  // Boolean(undefined) === false
    }
}

extension Double {
    public init(_ value: Undefined) {
        self = Double.nan  // Number(undefined) = NaN
    }
}

// MARK: - Any 与 Undefined/Null/Void 比较

public func == (lhs: Any, rhs: Undefined) -> Bool {
    if lhs is Undefined {
        return true
    }
    if lhs is Void {
        return true  // () == undefined
    }
    if lhs is Null {
        return true  // null == undefined
    }
    return false
}

public func != (lhs: Any, rhs: Undefined) -> Bool {
    return !(lhs == rhs)
}

public func === (lhs: Any, rhs: Undefined) -> Bool {
    if lhs is Undefined {
        return true
    }
    if lhs is Void {
        return true  // () === undefined
    }
    return false  // null === undefined 为 false
}

public func !== (lhs: Any, rhs: Undefined) -> Bool {
    return !(lhs === rhs)
}

// 反向比较
public func == (lhs: Undefined, rhs: Any) -> Bool {
    return rhs == lhs
}

public func != (lhs: Undefined, rhs: Any) -> Bool {
    return rhs != lhs
}

public func === (lhs: Undefined, rhs: Any) -> Bool {
    return rhs === lhs
}

public func !== (lhs: Undefined, rhs: Any) -> Bool {
    return rhs !== lhs
}

// Any 与 Null 比较
public func == (lhs: Any, rhs: Null) -> Bool {
    if lhs is Null {
        return true
    }
    if lhs is Undefined {
        return true  // undefined == null
    }
    if lhs is Void {
        return true  // () == null
    }
    return false
}

public func != (lhs: Any, rhs: Null) -> Bool {
    return !(lhs == rhs)
}

public func === (lhs: Any, rhs: Null) -> Bool {
    if lhs is Null {
        return true
    }
    return false  // undefined === null 为 false，() === null 为 false
}

public func !== (lhs: Any, rhs: Null) -> Bool {
    return !(lhs === rhs)
}

// 反向比较
public func == (lhs: Null, rhs: Any) -> Bool {
    return rhs == lhs
}

public func != (lhs: Null, rhs: Any) -> Bool {
    return rhs != lhs
}

public func === (lhs: Null, rhs: Any) -> Bool {
    return rhs === lhs
}

public func !== (lhs: Null, rhs: Any) -> Bool {
    return rhs !== lhs
}

// Any 与 Void 比较
public func == (lhs: Any, rhs: Void) -> Bool {
    if lhs is Void {
        return true
    }
    if lhs is Undefined {
        return true  // undefined == ()
    }
    if lhs is Null {
        return true  // null == ()
    }
    return false
}

public func != (lhs: Any, rhs: Void) -> Bool {
    return !(lhs == rhs)
}

public func === (lhs: Any, rhs: Void) -> Bool {
    if lhs is Void {
        return true
    }
    if lhs is Undefined {
        return true  // undefined === ()
    }
    return false  // null === () 为 false
}

public func !== (lhs: Any, rhs: Void) -> Bool {
    return !(lhs === rhs)
}

// 反向比较
public func == (lhs: Void, rhs: Any) -> Bool {
    return rhs == lhs
}

public func != (lhs: Void, rhs: Any) -> Bool {
    return rhs != lhs
}

public func === (lhs: Void, rhs: Any) -> Bool {
    return rhs === lhs
}

public func !== (lhs: Void, rhs: Any) -> Bool {
    return rhs !== lhs
}
