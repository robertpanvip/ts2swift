// Error 错误类
public class Error: CustomStringConvertible, Swift.Error {
    public let message: String
    public let name: String
    public let stack: String
    
    // 初始化
    public init(_ message: String = "", name: String = "Error") {
        self.message = message
        self.name = name
        self.stack = Error.generateStack()
    }
    
    // 生成堆栈跟踪
    private static func generateStack() -> String {
        // Swift 不直接支持堆栈跟踪，这里返回一个简单的字符串
        return "Error stack trace (not available in Swift)"
    }
    
    // description
    public var description: String {
        if message.isEmpty {
            return name
        } else {
            return "\(name): \(message)"
        }
    }
    
    // toString
    public func toString() -> String {
        return description
    }
}

// TypeError - 类型错误
public class TypeError: Error {
    public override init(_ message: String = "", name: String = "TypeError") {
        super.init(message, name: name)
    }
}

// RangeError - 范围错误
public class RangeError: Error {
    public override init(_ message: String = "", name: String = "RangeError") {
        super.init(message, name: name)
    }
}

// ReferenceError - 引用错误
public class ReferenceError: Error {
    public override init(_ message: String = "", name: String = "ReferenceError") {
        super.init(message, name: name)
    }
}

// SyntaxError - 语法错误
public class SyntaxError: Error {
    public override init(_ message: String = "", name: String = "SyntaxError") {
        super.init(message, name: name)
    }
}

// URIError - URI 错误
public class URIError: Error {
    public override init(_ message: String = "", name: String = "URIError") {
        super.init(message, name: name)
    }
}

// EvalError - Eval 错误
public class EvalError: Error {
    public override init(_ message: String = "", name: String = "EvalError") {
        super.init(message, name: name)
    }
}

// 抛出错误的辅助函数
public func ThrowError(_ message: String, type: String = "Error") throws {
    switch type {
    case "TypeError":
        throw TypeError(message) as Swift.Error
    case "RangeError":
        throw RangeError(message) as Swift.Error
    case "ReferenceError":
        throw ReferenceError(message) as Swift.Error
    case "SyntaxError":
        throw SyntaxError(message) as Swift.Error
    case "URIError":
        throw URIError(message) as Swift.Error
    case "EvalError":
        throw EvalError(message) as Swift.Error
    default:
        throw Error(message) as Swift.Error
    }
}
