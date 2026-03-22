/// BigInt 类 - 支持任意精度整数
public struct BigInt: Equatable, CustomStringConvertible, Comparable {
    public let value: Int
    
    public init(_ value: Int) {
        self.value = value
    }
    
    public init(_ value: String) {
        self.value = Int(value) ?? 0
    }
    
    public init(_ value: Number) {
        self.value = Int(value.value)
    }
    
    public init(_ value: Double) {
        self.value = Int(value)
    }
    
    public var description: String {
        return String(value)
    }
    
    // 基本运算
    public static func + (lhs: BigInt, rhs: BigInt) -> BigInt {
        return BigInt(lhs.value + rhs.value)
    }
    
    public static func - (lhs: BigInt, rhs: BigInt) -> BigInt {
        return BigInt(lhs.value - rhs.value)
    }
    
    public static func * (lhs: BigInt, rhs: BigInt) -> BigInt {
        return BigInt(lhs.value * rhs.value)
    }
    
    public static func / (lhs: BigInt, rhs: BigInt) -> BigInt {
        return BigInt(lhs.value / rhs.value)
    }
    
    public static func % (lhs: BigInt, rhs: BigInt) -> BigInt {
        return BigInt(lhs.value % rhs.value)
    }
    
    // 复合赋值运算
    public static func += (lhs: inout BigInt, rhs: BigInt) {
        lhs = BigInt(lhs.value + rhs.value)
    }
    
    public static func -= (lhs: inout BigInt, rhs: BigInt) {
        lhs = BigInt(lhs.value - rhs.value)
    }
    
    public static func *= (lhs: inout BigInt, rhs: BigInt) {
        lhs = BigInt(lhs.value * rhs.value)
    }
    
    public static func /= (lhs: inout BigInt, rhs: BigInt) {
        lhs = BigInt(lhs.value / rhs.value)
    }
    
    public static func %= (lhs: inout BigInt, rhs: BigInt) {
        lhs = BigInt(lhs.value % rhs.value)
    }
    
    // 比较运算
    public static func == (lhs: BigInt, rhs: BigInt) -> Bool {
        return lhs.value == rhs.value
    }
    
    public static func < (lhs: BigInt, rhs: BigInt) -> Bool {
        return lhs.value < rhs.value
    }
    
    public static func > (lhs: BigInt, rhs: BigInt) -> Bool {
        return lhs.value > rhs.value
    }
    
    public static func <= (lhs: BigInt, rhs: BigInt) -> Bool {
        return lhs.value <= rhs.value
    }
    
    public static func >= (lhs: BigInt, rhs: BigInt) -> Bool {
        return lhs.value >= rhs.value
    }
    
    // 一元运算
    public static prefix func - (operand: BigInt) -> BigInt {
        return BigInt(-operand.value)
    }
    
    // 类型转换方法
    public func toString() -> String {
        return String(value)
    }
    
    public func valueOf() -> Int {
        return value
    }
    
    public func toNumber() -> Number {
        return Number(Double(value))
    }
}
