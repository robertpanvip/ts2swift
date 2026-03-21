// Object 类 - 用于表示 JavaScript 对象（静态设计）
open class Object {
    internal var properties: [String: Any?] = [:]
    
    public init() {}
    
    // subscript 访问器 - 支持 obj["prop"] 语法
    public subscript(key: String) -> Any? {
        get {
            return properties[key] ?? nil
        }
        set {
            properties[key] = newValue
        }
    }
    
    // 获取属性值
    public func value(forKey key: String) -> Any? {
        return properties[key] ?? nil
    }
    
    // 设置属性值
    public func setValue(_ value: Any?, forKey key: String) {
        properties[key] = value
    }
    
    // toString 方法
    public func toString() -> String {
        return "[object Object]"
    }
    
    // valueOf 方法
    public func valueOf() -> Any? {
        return self
    }
}

// Object 静态方法
extension Object {
    // Object.keys - 使用反射获取对象的键数组
    public static func keys<T: Object>(_ obj: T) -> [String] {
        let mirror = Mirror(reflecting: obj)
        return mirror.children.compactMap { child in
            child.label
        }.filter { $0 != "properties" } // 排除 properties 属性本身
    }
    
    // Object.values - 返回对象的值数组
    public static func values(_ obj: Object) -> [Any?] {
        return Array(obj.properties.values)
    }
    
    // Object.entries - 返回键值对数组
    public static func entries(_ obj: Object) -> [(String, Any?)] {
        return Array(obj.properties.map { ($0.key, $0.value) })
    }
}
