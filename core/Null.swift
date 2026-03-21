public struct Null: Equatable {
    public init() {}
    
    public func toString() -> String {
        return "null"
    }
    
    public func valueOf() -> Null {
        return self
    }
}

// 全局 null 实例
public let null = Null()
