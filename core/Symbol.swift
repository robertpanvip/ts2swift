// Symbol 类 - 符合 ES6 Symbol 规范
public class Symbol: CustomStringConvertible, Hashable {
    private static var counter: Int = 0
    private static var symbolRegistry: [String: Symbol] = [:]
    
    private let id: Int
    private let descriptionValue: String
    
    // 私有构造函数
    private init(_ description: String = "") {
        self.id = Symbol.counter
        self.descriptionValue = description
        Symbol.counter += 1
    }
    
    // Symbol 构造函数（公开）
    public static func create(_ description: String = "") -> Symbol {
        return Symbol(description)
    }
    
    // Symbol 构造函数
    public static func `for`(_ description: String) -> Symbol {
        if let existing = symbolRegistry[description] {
            return existing
        }
        let symbol = Symbol(description)
        symbolRegistry[description] = symbol
        return symbol
    }
    
    // 检查是否已存在
    public static func keyFor(_ symbol: Symbol) -> String? {
        for (key, value) in symbolRegistry {
            if value === symbol {
                return key
            }
        }
        return nil
    }
    
    // 描述
    public var description: String {
        return "Symbol(\(descriptionValue))"
    }
    
    // toString
    public func toString() -> String {
        return description
    }
    
    // valueOf
    public func valueOf() -> Symbol {
        return self
    }
    
    // Hashable 实现
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    // Equatable 实现
    public static func == (lhs: Symbol, rhs: Symbol) -> Bool {
        return lhs.id == rhs.id
    }
    
    // 预定义的 Symbol
    public static let asyncIterator = Symbol("Symbol.asyncIterator")
    public static let hasInstance = Symbol("Symbol.hasInstance")
    public static let isConcatSpreadable = Symbol("Symbol.isConcatSpreadable")
    public static let iterator = Symbol("Symbol.iterator")
    public static let match = Symbol("Symbol.match")
    public static let matchAll = Symbol("Symbol.matchAll")
    public static let replace = Symbol("Symbol.replace")
    public static let search = Symbol("Symbol.search")
    public static let species = Symbol("Symbol.species")
    public static let split = Symbol("Symbol.split")
    public static let toPrimitive = Symbol("Symbol.toPrimitive")
    public static let toStringTag = Symbol("Symbol.toStringTag")
    public static let unscopables = Symbol("Symbol.unscopables")
}

// 全局 Symbol 函数 - 使用不同的名称避免冲突
public func CreateSymbol(_ description: String = "") -> Symbol {
    return Symbol.create(description)
}
