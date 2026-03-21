// Function 类 - 用于包装闭包并提供 JavaScript 风格的函数方法
public class Function {
    public let name: String
    public let closure: (Any?...) -> Any?
    
    public init(name: String = "", closure: @escaping (Any?...) -> Any?) {
        self.name = name
        self.closure = closure
    }
    
    // toString 方法 - 返回函数的字符串表示
    public func toString() -> String {
        if name.isEmpty {
            return "function() { [native code] }"
        } else {
            return "function \(name)() { [native code] }"
        }
    }
    
    // valueOf 方法 - 返回函数自身
    public func valueOf() -> Function {
        return self
    }
    
    // call 方法 - 调用函数并传入参数
    public func call(_ thisArg: Any? = nil, _ args: Any?...) -> Any? {
        // 在 JavaScript 中，thisArg 用于设置 this 上下文
        // 在 Swift 中，我们不直接使用 this，但保留这个参数以兼容 JavaScript 风格
        return closure(args)
    }
    
    // apply 方法 - 调用函数并传入参数数组
    public func apply(_ thisArg: Any? = nil, _ argsArray: [Any?]? = nil) -> Any? {
        // 在 JavaScript 中，thisArg 用于设置 this 上下文
        // argsArray 是参数数组
        if let args = argsArray {
            return closure(args)
        } else {
            return closure([])
        }
    }
    
    // bind 方法 - 创建一个新的函数，绑定 this 和部分参数
    public func bind(_ thisArg: Any? = nil, _ args: Any?...) -> Function {
        let originalClosure = self.closure
        let boundName = self.name.isEmpty ? "bound function" : "bound \(self.name)"
        
        // 创建一个新的闭包，预先绑定参数
        let boundClosure: (Any?...) -> Any? = { newArgs in
            // 合并预先绑定的参数和新参数
            let allArgs = args + newArgs
            return originalClosure(allArgs)
        }
        
        return Function(name: boundName, closure: boundClosure)
    }
    
    // 直接调用函数的语法糖
    public func invoke(_ args: Any?...) -> Any? {
        return closure(args)
    }
}

// 为 Function 添加 CustomStringConvertible 协议
extension Function: CustomStringConvertible {
    public var description: String {
        return toString()
    }
}
