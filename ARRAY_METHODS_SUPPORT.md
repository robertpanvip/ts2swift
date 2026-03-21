# 数组方法支持度对比

## 当前状态

TypeScript 数组方法直接转换为 Swift 数组方法调用，但**参数顺序和类型有差异**导致编译错误。

## ES6 vs Swift 数组方法对比

### ✅ 直接支持（无需转换）

| ES6 方法 | Swift 方法 | 状态 | 说明 |
|---------|-----------|------|------|
| `arr.length` | `arr.count` | ⚠️ | 需要转换为 `.count` |
| `arr[i]` | `arr[i]` | ✅ | subscript 访问相同 |
| `arr.push(x)` | `arr.append(x)` | ⚠️ | Swift 使用 `append` |
| `arr.pop()` | `arr.popLast()` | ⚠️ | 返回可选类型 |
| `arr.shift()` | `arr.removeFirst()` | ⚠️ | 方法名不同 |
| `arr.unshift(x)` | `arr.insert(x, at: 0)` | ⚠️ | 需要指定位置 |

### ⚠️ 参数顺序不同

| ES6 方法 | ES6 签名 | Swift 方法 | Swift 签名 | 问题 |
|---------|---------|-----------|-----------|------|
| `slice` | `slice(start, end)` | `subarray` | `subarray(start: Int, end: Int)` | 需要参数标签 |
| `reduce` | `reduce(fn, initial)` | `reduce` | `reduce(_ initial, _ fn)` | **参数顺序相反** |
| `indexOf` | `indexOf(item)` | `firstIndex(of:)` | `firstIndex(of: Element)` | 方法名不同 |

### ❌ 不支持的方法

| ES6 方法 | Swift 替代方案 | 实现难度 |
|---------|--------------|---------|
| `concat` | `+` 或 `append(contentsOf:)` | 简单 |
| `includes` | `contains` | 简单 |
| `find` | `first(where:)` | 简单 |
| `findIndex` | `firstIndex(where:)` | 简单 |
| `every` | `allSatisfy` | 简单 |
| `some` | `contains(where:)` | 简单 |
| `forEach` | `forEach` | ✅ 相同 |
| `map` | `map` | ✅ 相同 |
| `filter` | `filter` | ✅ 相同 |
| `reverse` | `reverse` | ⚠️ Swift 修改原数组 |
| `sort` | `sort` | ⚠️ Swift 修改原数组 |
| `join` | `joined(separator:)` | 简单 |

## 详细转换规则

### 1. reduce
```typescript
// ES6
arr.reduce((sum, x) => sum + x, 0)

// Swift (参数顺序相反)
arr.reduce(0) { (sum: Number, x: Number) -> Number in
    sum + x
}
```

### 2. slice
```typescript
// ES6
arr.slice(1, 3)

// Swift (需要参数标签)
arr.subarray(start: 1, end: 3)
// 或者使用 Range
arr[1..<3]
```

### 3. push/pop
```typescript
// ES6
arr.push(x)
arr.pop()

// Swift
arr.append(x)
arr.popLast()  // 返回 Optional
```

### 4. shift/unshift
```typescript
// ES6
arr.shift()
arr.unshift(x)

// Swift
arr.removeFirst()
arr.insert(x, at: 0)
```

### 5. concat
```typescript
// ES6
arr.concat([10, 20])

// Swift
arr + [10, 20]
// 或
arr.append(contentsOf: [10, 20])
```

### 6. includes
```typescript
// ES6
arr.includes(3)

// Swift
arr.contains(3)
```

### 7. find/findIndex
```typescript
// ES6
arr.find(x => x > 3)
arr.findIndex(x => x > 3)

// Swift
arr.first(where: { $0 > 3 })
arr.firstIndex(where: { $0 > 3 })
```

### 8. every/some
```typescript
// ES6
arr.every(x => x > 0)
arr.some(x => x > 4)

// Swift
arr.allSatisfy { $0 > 0 }
arr.contains(where: { $0 > 4 })
```

### 9. reverse/sort
```typescript
// ES6 (返回新数组)
const reversed = arr.reverse()
const sorted = arr.sort()

// Swift (修改原数组，返回 void)
var arr2 = arr
arr2.reverse()  // 原地修改
arr2.sort()     // 原地修改

// 或者使用返回新数组的方法
let reversed = arr.reversed()  // 返回 ReversedCollection
let sorted = arr.sorted()      // 返回新数组
```

### 10. join
```typescript
// ES6
arr.join(',')

// Swift
arr.joined(separator: ",")
```

## 实现建议

### 方案 1：包装 Swift 数组方法（推荐）

创建一个 `ArrayExtension` 类，提供 ES6 风格的方法：

```swift
public extension Array {
    // ES6 风格的 reduce（参数顺序相同）
    func reduceES6<T>(_ fn: @escaping (T, Element) -> T, _ initial: T) -> T {
        return self.reduce(initial) { fn($0, $1) }
    }
    
    // ES6 风格的 slice
    func slice(_ start: Int, _ end: Int) -> ArraySlice<Element> {
        return self[start..<end]
    }
    
    // ES6 风格的 concat
    func concat(_ other: [Element]) -> [Element] {
        return self + other
    }
    
    // ES6 风格的 includes
    func includes(_ element: Element) -> Bool where Element: Equatable {
        return self.contains(element)
    }
    
    // ES6 风格的 find
    func find(_ predicate: @escaping (Element) -> Bool) -> Element? {
        return self.first(where: predicate)
    }
    
    // ES6 风格的 findIndex
    func findIndex(_ predicate: @escaping (Element) -> Bool) -> Int? {
        return self.firstIndex(where: predicate)
    }
    
    // ES6 风格的 every
    func every(_ predicate: @escaping (Element) -> Bool) -> Bool {
        return self.allSatisfy(predicate)
    }
    
    // ES6 风格的 some
    func some(_ predicate: @escaping (Element) -> Bool) -> Bool {
        return self.contains(where: predicate)
    }
}
```

### 方案 2：代码生成时转换

在 `parseCallExpression` 中检测数组方法调用并转换：

```typescript
function parseCallExpression(expression: CallExpression): CodeResult {
    const callee = expression.getExpression();
    
    if (Node.isPropertyAccessExpression(callee)) {
        const methodName = callee.getName();
        const args = expression.getArguments();
        
        // 检测数组方法
        if (isArrayMethod(methodName)) {
            return parseArrayMethod(callee, methodName, args);
        }
    }
    
    // ... 默认处理
}

function parseArrayMethod(callee: any, methodName: string, args: any[]): CodeResult {
    switch (methodName) {
        case 'reduce':
            // 交换参数顺序
            const [fn, initial] = args;
            return { code: `${parseExpression(callee).code}.reduce(${parseExpression(initial).code}, ${parseExpression(fn).code})` };
        
        case 'slice':
            // 添加参数标签
            const [start, end] = args;
            return { code: `${parseExpression(callee).code}.subarray(start: ${parseExpression(start).code}, end: ${parseExpression(end).code})` };
        
        case 'push':
            return { code: `${parseExpression(callee).code}.append(${parseExpression(args[0]).code})` };
        
        case 'includes':
            return { code: `${parseExpression(callee).code}.contains(${parseExpression(args[0]).code})` };
        
        // ... 其他方法
    }
}
```

## 当前问题

1. **`Number` 类型与 `Int` 混用** - Swift 数组索引需要 `Int`，但 TypeScript 使用 `number`
2. **方法签名不匹配** - 如 `reduce` 参数顺序
3. **缺少参数标签** - Swift 需要参数标签（如 `start:`, `end:`）
4. **返回类型不同** - 如 `popLast()` 返回 `Optional`

## 优先级

### 高优先级（常用方法）
- ✅ `map` - 已支持
- ✅ `filter` - 已支持
- ✅ `forEach` - 已支持
- ⚠️ `reduce` - 需要参数顺序转换
- ⚠️ `push` - 需要转换为 `append`
- ⚠️ `pop` - 需要转换为 `popLast`

### 中优先级
- ⚠️ `slice` - 需要参数标签
- ⚠️ `concat` - 需要转换为 `+` 或 `append(contentsOf:)`
- ⚠️ `includes` - 需要转换为 `contains`
- ⚠️ `find` - 需要转换为 `first(where:)`
- ⚠️ `findIndex` - 需要转换为 `firstIndex(where:)`

### 低优先级
- ⚠️ `every` - 需要转换为 `allSatisfy`
- ⚠️ `some` - 需要转换为 `contains(where:)`
- ⚠️ `reverse` - 需要使用 `reversed()`
- ⚠️ `sort` - 需要使用 `sorted()`
- ⚠️ `join` - 需要参数标签

## 总结

**当前支持度**: 30% (3/10)
- ✅ 完全支持：`map`, `filter`, `forEach`
- ⚠️ 部分支持：需要参数转换
- ❌ 不支持：需要方法名转换

**建议实现方案**: 方案 1（包装 Swift 数组方法）更简单且性能更好
