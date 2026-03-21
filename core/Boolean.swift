// 扩展Swift的Bool类型
public extension Bool {
    func toString() -> String {
        return String(self)
    }
    
    func valueOf() -> Bool {
        return self
    }
}