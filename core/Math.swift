// Math 对象 - 提供数学常量和函数
import Foundation

public class Math {
    // 数学常量
    public static let E = Number(2.718281828459045)
    public static let LN2 = Number(0.6931471805599453)
    public static let LN10 = Number(2.302585092994046)
    public static let LOG2E = Number(1.4426950408889634)
    public static let LOG10E = Number(0.4342944819032518)
    public static let PI = Number(3.141592653589793)
    public static let SQRT1_2 = Number(0.7071067811865476)
    public static let SQRT2 = Number(1.4142135623730951)
    
    // abs - 绝对值
    public static func abs(_ x: Number) -> Number {
        return Number(x.value < 0 ? -x.value : x.value)
    }
    
    // ceil - 向上取整
    public static func ceil(_ x: Number) -> Number {
        return Number(x.value.rounded(.up))
    }
    
    // floor - 向下取整
    public static func floor(_ x: Number) -> Number {
        return Number(x.value.rounded(.down))
    }
    
    // round - 四舍五入
    public static func round(_ x: Number) -> Number {
        return Number(x.value.rounded(.toNearestOrAwayFromZero))
    }
    
    // trunc - 截断小数部分
    public static func trunc(_ x: Number) -> Number {
        return Number(x.value.truncatingRemainder(dividingBy: 1) == 0 ? x.value : x.value > 0 ? x.value.truncatingRemainder(dividingBy: 1) < x.value ? x.value - x.value.truncatingRemainder(dividingBy: 1) : x.value : x.value + x.value.truncatingRemainder(dividingBy: 1))
    }
    
    // pow - 幂运算
    public static func pow(_ base: Number, _ exponent: Number) -> Number {
        return Number(Foundation.pow(base.value, exponent.value))
    }
    
    // sqrt - 平方根
    public static func sqrt(_ x: Number) -> Number {
        return Number(Foundation.sqrt(x.value))
    }
    
    // log - 自然对数
    public static func log(_ x: Number) -> Number {
        return Number(Foundation.log(x.value))
    }
    
    // log10 - 以 10 为底的对数
    public static func log10(_ x: Number) -> Number {
        return Number(Foundation.log10(x.value))
    }
    
    // log2 - 以 2 为底的对数
    public static func log2(_ x: Number) -> Number {
        return Number(Foundation.log2(x.value))
    }
    
    // sin - 正弦
    public static func sin(_ x: Number) -> Number {
        return Number(Foundation.sin(x.value))
    }
    
    // cos - 余弦
    public static func cos(_ x: Number) -> Number {
        return Number(Foundation.cos(x.value))
    }
    
    // tan - 正切
    public static func tan(_ x: Number) -> Number {
        return Number(Foundation.tan(x.value))
    }
    
    // asin - 反正弦
    public static func asin(_ x: Number) -> Number {
        return Number(Foundation.asin(x.value))
    }
    
    // acos - 反余弦
    public static func acos(_ x: Number) -> Number {
        return Number(Foundation.acos(x.value))
    }
    
    // atan - 反正切
    public static func atan(_ x: Number) -> Number {
        return Number(Foundation.atan(x.value))
    }
    
    // atan2 - 反正切 2
    public static func atan2(_ y: Number, _ x: Number) -> Number {
        return Number(Foundation.atan2(y.value, x.value))
    }
    
    // exp - e 的幂
    public static func exp(_ x: Number) -> Number {
        return Number(Foundation.exp(x.value))
    }
    
    // max - 最大值
    public static func max(_ values: Number...) -> Number {
        guard let first = values.first else { return Number(0) }
        var maxVal = first.value
        for value in values {
            if value.value > maxVal {
                maxVal = value.value
            }
        }
        return Number(maxVal)
    }
    
    // min - 最小值
    public static func min(_ values: Number...) -> Number {
        guard let first = values.first else { return Number(0) }
        var minVal = first.value
        for value in values {
            if value.value < minVal {
                minVal = value.value
            }
        }
        return Number(minVal)
    }
    
    // random - 随机数
    public static func random() -> Number {
        return Number(Double.random(in: 0..<1))
    }
    
    // sign - 符号
    public static func sign(_ x: Number) -> Number {
        if x.value > 0 {
            return Number(1)
        } else if x.value < 0 {
            return Number(-1)
        } else {
            return Number(0)
        }
    }
}
