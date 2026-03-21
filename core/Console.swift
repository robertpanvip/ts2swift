// 辅助函数：将任意值转换为字符串
func convertToString(_ item: Any) -> String {
    // 检查是否是 nil
    if let optional = item as? AnyOptional, optional.isNil {
        return "undefined"
    }
    // 检查是否有 toString 方法
    if let convertible = item as? ToStringConvertible {
        return convertible.toString()
    }
    // 默认使用 String(describing:)
    return String(describing: item)
}

// 定义一个协议，用于检查 Optional 是否是 nil
protocol AnyOptional {
    var isNil: Bool { get }
}

// 为 Optional 添加协议扩展
extension Optional: AnyOptional {
    var isNil: Bool {
        return self == nil
    }
}

// 定义一个协议，用于检查对象是否有 toString 方法
protocol ToStringConvertible {
    func toString() -> String
}

// 为 Null 添加协议扩展
extension Null: ToStringConvertible {}

// 为 Undefined 添加协议扩展
extension Undefined: ToStringConvertible {}

// 为 Number 添加协议扩展
extension Number: ToStringConvertible {}

// 为 Bool 添加协议扩展
extension Bool: ToStringConvertible {}

// 为 Array 添加协议扩展
extension Array: ToStringConvertible {}

public struct Console {
    public init() {}
    
    public func log(_ items: Any...) {
       let strings = items.map { convertToString($0) }
           print(strings.joined(separator: " "))
    }
    
    public func error(_ items: Any...) {
        for item in items {
            print("ERROR: " + convertToString(item))
        }
    }
    
    public func warn(_ items: Any...) {
        for item in items {
            print("WARNING: " + convertToString(item))
        }
    }
    
    public func info(_ items: Any...) {
        for item in items {
            print("INFO: " + convertToString(item))
        }
    }
    
    public func debug(_ items: Any...) {
        for item in items {
            print("DEBUG: " + convertToString(item))
        }
    }
    
    public func table(_ item: Any) {
        print("TABLE: " + convertToString(item))
    }
    
    public func clear() {
        // 在 Swift 中清除控制台的实现
        // 这里只是一个占位符
        print("Console cleared")
    }
    
    public var time: (String) -> Void = { label in
        print("Timer started: " + label)
    }
    
    public var timeEnd: (String) -> Void = { label in
        print("Timer ended: " + label)
    }
}

// 全局导出 console 对象
public let console = Console()
