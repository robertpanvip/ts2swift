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
    
    // ES6 String 实例方法
    func charCodeAt(_ index: Int) -> Int? {
        guard index >= 0 && index < self.count else { return nil }
        let startIndex = self.index(self.startIndex, offsetBy: index)
        let char = self[startIndex]
        return Int(char.unicodeScalars.first?.value ?? 0)
    }
    
    func concat(_ strings: String...) -> String {
        return self + strings.joined()
    }
    
    func endsWith(_ searchString: String, _ position: Int? = nil) -> Bool {
        let endPos = position ?? self.count
        let safeEnd = min(endPos, self.count)
        guard safeEnd >= searchString.count else { return false }
        let start = self.index(self.startIndex, offsetBy: safeEnd - searchString.count)
        return self[start..<self.index(self.startIndex, offsetBy: safeEnd)] == searchString
    }
    
    func includes(_ searchString: String, _ position: Int? = nil) -> Bool {
        let startPos = position ?? 0
        let safeStart = max(0, min(startPos, self.count))
        let start = self.index(self.startIndex, offsetBy: safeStart)
        return self[start...].contains(searchString)
    }
    
    func `repeat`(_ count: Int) -> String {
        guard count > 0 else { return "" }
        return String(repeating: self, count: count)
    }
    
    func slice(_ start: Int, _ end: Int? = nil) -> String {
        let startIndex = max(0, start)
        let endIndex = end ?? self.count
        let safeStart = min(startIndex, self.count)
        let safeEnd = min(max(safeStart, endIndex), self.count)
        
        let startIdx = self.index(self.startIndex, offsetBy: safeStart)
        let endIdx = self.index(self.startIndex, offsetBy: safeEnd)
        return String(self[startIdx..<endIdx])
    }
    
    func startsWith(_ searchString: String, _ position: Int? = nil) -> Bool {
        let startPos = position ?? 0
        let safeStart = max(0, min(startPos, self.count))
        guard self.count - safeStart >= searchString.count else { return false }
        let start = self.index(self.startIndex, offsetBy: safeStart)
        let end = self.index(start, offsetBy: searchString.count)
        return self[start..<end] == searchString
    }
    
    func substr(_ from: Int, _ length: Int? = nil) -> String {
        let safeFrom = max(0, min(from, self.count))
        let safeLength = length ?? (self.count - safeFrom)
        let safeEnd = min(safeFrom + safeLength, self.count)
        
        let startIdx = self.index(self.startIndex, offsetBy: safeFrom)
        let endIdx = self.index(self.startIndex, offsetBy: safeEnd)
        return String(self[startIdx..<endIdx])
    }
    
    func padStart(_ targetLength: Int, _ padString: String = " ") -> String {
        guard self.count < targetLength else { return self }
        let paddingLength = targetLength - self.count
        let padded = String(repeating: padString, count: (paddingLength / padString.count) + 1)
        return padded.prefix(paddingLength) + self
    }
    
    func padEnd(_ targetLength: Int, _ padString: String = " ") -> String {
        guard self.count < targetLength else { return self }
        let paddingLength = targetLength - self.count
        let padded = String(repeating: padString, count: (paddingLength / padString.count) + 1)
        return self + padded.prefix(paddingLength)
    }
    
    func trimStart() -> String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines.union(.controlCharacters))
    }
    
    func trimEnd() -> String {
        var result = self
        while let last = result.last, last.isWhitespace || last.isNewline {
            result.removeLast()
        }
        return result
    }
}