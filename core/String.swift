// 扩展Swift的String类型
public extension String {
    func toString() -> String {
        return self
    }
    
    func valueOf() -> String {
        return self
    }
    
    var length: Int {
        return self.count
    }
    
    func charAt(_ index: Int) -> String {
        guard index >= 0 && index < self.count else { return "" }
        let startIndex = self.index(self.startIndex, offsetBy: index)
        let endIndex = self.index(startIndex, offsetBy: 1)
        return String(self[startIndex..<endIndex])
    }
    
    func substring(start: Int, end: Int? = nil) -> String {
        let startIndex = self.index(self.startIndex, offsetBy: max(0, start))
        if let end = end {
            let endIndex = self.index(self.startIndex, offsetBy: min(self.count, end))
            return String(self[startIndex..<endIndex])
        } else {
            return String(self[startIndex...])
        }
    }
    
    func indexOf(_ substring: String) -> Int? {
        if let range = self.range(of: substring) {
            return self.distance(from: self.startIndex, to: range.lowerBound)
        }
        return nil
    }
    
    func lastIndexOf(_ substring: String) -> Int? {
        if let range = self.range(of: substring, options: .backwards) {
            return self.distance(from: self.startIndex, to: range.lowerBound)
        }
        return nil
    }
    
    func split(separator: String) -> [String] {
        return self.components(separatedBy: separator)
    }
    
    func replace(oldValue: String, newValue: String) -> String {
        return self.replacingOccurrences(of: oldValue, with: newValue)
    }
    
    func toUpperCase() -> String {
        return self.uppercased()
    }
    
    func toLowerCase() -> String {
        return self.lowercased()
    }
    
    func trim() -> String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}