// RegExp 正则表达式类
public class RegExp: CustomStringConvertible {
    private let pattern: String
    private let flags: String
    private let regex: NSRegularExpression
    private var lastMatch: NSTextCheckingResult?
    
    // lastIndex - 下次匹配的起始位置
    public var lastIndex: Int = 0
    
    // 初始化
    public init(_ pattern: String, flags: String = "") {
        self.pattern = pattern
        self.flags = flags
        
        // 设置正则表达式选项
        var options: NSRegularExpression.Options = []
        if flags.contains("i") {
            options.insert(.caseInsensitive)
        }
        if flags.contains("m") {
            options.insert(.anchorsMatchLines)
        }
        if flags.contains("s") {
            options.insert(.dotMatchesLineSeparators)
        }
        
        do {
            self.regex = try NSRegularExpression(pattern: pattern, options: options)
        } catch {
            // 如果正则表达式无效，创建一个匹配空字符串的正则
            self.regex = try! NSRegularExpression(pattern: "", options: [])
        }
    }
    
    // test - 测试字符串是否匹配
    public func test(_ string: String) -> Bool {
        let range = NSRange(location: lastIndex, length: string.utf16.count - lastIndex)
        if let match = regex.firstMatch(in: string, options: [], range: range) {
            self.lastMatch = match
            self.lastIndex = match.range.location + match.range.length
            return true
        }
        return false
    }
    
    // exec - 执行匹配
    public func exec(_ string: String) -> [String]? {
        let range = NSRange(location: lastIndex, length: string.utf16.count - lastIndex)
        if let match = regex.firstMatch(in: string, options: [], range: range) {
            self.lastMatch = match
            self.lastIndex = match.range.location + match.range.length
            
            // 提取匹配的字符串
            var results: [String] = []
            for i in 0..<match.numberOfRanges {
                let matchRange = match.range(at: i)
                if matchRange.location != NSNotFound && matchRange.length != NSNotFound {
                    if let swiftRange = Range(matchRange, in: string) {
                        results.append(String(string[swiftRange]))
                    }
                }
            }
            return results
        }
        return nil
    }
    
    // match - 匹配所有
    public func match(_ string: String) -> [[String]] {
        let range = NSRange(location: 0, length: string.utf16.count)
        let matches = regex.matches(in: string, options: [], range: range)
        
        var results: [[String]] = []
        for match in matches {
            var matchResults: [String] = []
            for i in 0..<match.numberOfRanges {
                let matchRange = match.range(at: i)
                if matchRange.location != NSNotFound && matchRange.length != NSNotFound {
                    if let swiftRange = Range(matchRange, in: string) {
                        matchResults.append(String(string[swiftRange]))
                    }
                }
            }
            results.append(matchResults)
        }
        return results
    }
    
    // replace - 替换
    public func replace(_ string: String, replacement: String) -> String {
        let range = NSRange(location: 0, length: string.utf16.count)
        return regex.stringByReplacingMatches(in: string, options: [], range: range, withTemplate: replacement)
    }
    
    // split - 分割字符串
    public func split(_ string: String) -> [String] {
        let range = NSRange(location: 0, length: string.utf16.count)
        let matches = regex.matches(in: string, options: [], range: range)
        
        var results: [String] = []
        var lastEnd = 0
        
        for match in matches {
            let matchRange = match.range
            if let swiftRange = Range(NSRange(location: lastEnd, length: matchRange.location - lastEnd), in: string) {
                results.append(String(string[swiftRange]))
            }
            lastEnd = matchRange.location + matchRange.length
        }
        
        if lastEnd < string.utf16.count {
            if let swiftRange = Range(NSRange(location: lastEnd, length: string.utf16.count - lastEnd), in: string) {
                results.append(String(string[swiftRange]))
            }
        }
        
        return results
    }
    
    // description
    public var description: String {
        return "/\(pattern)/\(flags)"
    }
    
    // toString
    public func toString() -> String {
        return description
    }
    
    // source - 获取原始模式
    public var source: String {
        return pattern
    }
    
    // global - 是否全局匹配
    public var global: Bool {
        return flags.contains("g")
    }
    
    // ignoreCase - 是否忽略大小写
    public var ignoreCase: Bool {
        return flags.contains("i")
    }
    
    // multiline - 是否多行匹配
    public var multiline: Bool {
        return flags.contains("m")
    }
}

// 全局函数 - 创建 RegExp
public func CreateRegExp(_ pattern: String, flags: String = "") -> RegExp {
    return RegExp(pattern, flags: flags)
}
