public struct Undefined: Equatable {
    public init() {}
    
    public func toString() -> String {
        return "undefined"
    }
    
    public func valueOf() -> Undefined {
        return self
    }
}

// 全局 undefined 实例
public let undefined = Undefined()
