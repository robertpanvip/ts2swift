# TypeScript 到 Swift 转换器设计文档

## 核心设计思路

### 1. 模块系统
- **TypeScript 模块** → **Swift enum**
- 每个 TypeScript 文件转换为一个 Swift enum，命名为 `_ModuleName`
- 导出的成员作为 enum 的 static 成员
- 使用 `__setup` 计算属性触发模块初始化

### 2. 类型转换规则

#### 基本类型
```
string    → String
number    → Number (自定义包装类)
boolean   → Bool
any       → Any
void      → Void
null      → Null (自定义类型)
undefined → Undefined (自定义类型)
```

#### 复合类型
```
T[]          → [T] (Swift 数组)
Object       → Object (自定义类，静态设计)
Promise<T>   → Promise (自定义类)
Function     → Function (自定义类)
```

#### 函数类型
```
(a: A, b: B) => C  → (A, B) -> C
```

### 3. 类与对象

#### 类定义
- TypeScript class → Swift class
- 继承关系保持不变
- 构造函数转换为 Swift init
- 方法转换为 Swift 方法

#### 对象字面量
- 对象字面量 → 匿名类（AnonymousObject_N）
- 匿名类继承 Object
- 属性在 init 中初始化
- 使用反射（Mirror）实现 Object.keys()

#### Object 类设计（静态）
```swift
open class Object {
    internal var properties: [String: Any?] = [:]
    
    // subscript 访问器 - 支持 obj["prop"]
    public subscript(key: String) -> Any? { get/set }
    
    // 显式方法访问
    public func value(forKey key: String) -> Any?
    public func setValue(_ value: Any?, forKey key: String)
}
```

**重要**：Object 类不使用 `@dynamicMemberLookup`，保持静态设计。

### 4. 导入导出

#### Export 处理
```typescript
export const x = 1
export function foo() {}
export default MyClass
```
→
```swift
public enum _Module {
    public static let x = Number(1)
    public static func foo() {}
    public static let `default` = MyClass.self.foo
}
```

#### Import 处理
```typescript
import { x } from './module'
import Module from './module'
```
→
```swift
// 在 __setup 中初始化
let x = _Module.x
let Module = _Module.default
```

### 5. 函数处理

#### 函数声明
- 非导出函数 → 添加 `public static` 前缀，作为 enum 成员
- 导出函数 → 保持 `public static`
- 默认导出函数 → 使用 `G_default` 标记

#### 箭头函数
```typescript
const f = (a: number) => a * 2
```
→
```swift
let f = { (a: Number) -> Number in a * 2 }
```

### 6. 特殊处理

#### Type Alias
```typescript
type NumberOrString = number | string
```
→
```swift
public typealias NumberOrString = Any
```
- 放在 enum 内部
- 联合类型转换为 `Any`
- `__type` 替换为 `Any`

#### Enum
```typescript
enum Color { Red, Blue }
```
→
```swift
enum Color { case Red, Blue }
```
- TypeScript enum → Swift enum
- 不访问 `__setup`（只有模块才需要）

#### Promise（简化版本）
```swift
public class Promise {
    public func then(_ onFulfilled: @escaping (Any) -> Void) -> Promise
    public func `catch`(_ onRejected: @escaping (Any) -> Void) -> Promise
    public func finally(_ onFinally: @escaping () -> Void) -> Promise
    
    public static func resolve(_ value: Any) -> Promise
    public static func reject(_ reason: Any) -> Promise
}
```

#### Timer
```swift
public func setTimeout(_ callback: @escaping () -> Void, _ delay: Int) -> Timer
public func setInterval(_ callback: @escaping () -> Void, _ interval: Int) -> Timer
```

### 7. 代码结构

#### 生成的 Swift 文件结构
```swift
import Foundation

public enum _ModuleName {
    // 导入的变量
    public static let importedVar = _OtherModule.var
    
    // 导出的变量
    public static let x = Number(1)
    
    // 导出的函数
    public static func foo() -> Number { ... }
    
    // 导出的类
    public class MyClass { ... }
    
    // 匿名类（对象字面量）
    class AnonymousObject_0: Object { ... }
    
    // Type alias
    public typealias MyType = Any
    
    // 模块初始化
    public static var __setup: Void {
        // 触发依赖模块的初始化
        let _ = _OtherModule.__setup
        // 执行导入语句
        let x = _OtherModule.x
    }
}
```

### 8. 核心文件

#### core/Object.swift
- Object 基类（静态设计）
- 支持 subscript 访问
- 使用反射实现 keys/values/entries

#### core/Promise.swift
- Promise 简化实现
- 支持 then/catch/finally 链式调用
- 支持 resolve/reject 静态方法

#### core/Function.swift
- Function 类
- 支持 toString/call/apply/bind

#### core/Timer.swift
- Timer 工具类
- 使用 DispatchSourceTimer 实现
- 支持 setTimeout/setInterval

### 9. 类型解析策略

#### parseTypeNode
- 处理类型节点
- 基本类型直接映射
- 数组类型：`T[]` → `[T]`
- `__type` → `Any`

#### parseType
- 处理 Type 对象
- 使用 `type.isNumber()` 等 API
- 函数类型：解析参数和返回类型
- 符号类型：获取名称，`__type` → `Any`

### 10. 特殊规则

1. **所有函数都是静态的** - 非导出函数添加 `public static` 前缀
2. **类在 enum 内部必须是 public** - 确保可以被 public 函数使用
3. **typealias 放在 enum 内部** - 确保作用域正确
4. **模块名以 _ 开头** - 区分模块和普通类型
5. **只触发模块的 __setup** - 跳过 enum 和 class
6. **对象字面量省略类型注解** - 让 Swift 推断为匿名类类型

## 用户要求

### 明确要求
1. ✅ Object 类使用**静态设计**，不使用 `@dynamicMemberLookup`
2. ✅ 属性通过反射（Mirror）获取，而不是动态成员查找
3. ✅ `Object.keys()` 使用反射实现
4. ✅ 支持 `obj["prop"]` subscript 访问
5. ✅ 函数参数类型要精确解析，不统一返回 `Any`
6. ✅ Promise 符合 Promise/A+ 规范（简化版本）

### 设计原则
1. **保持类型安全** - 尽可能保留 TypeScript 的类型信息
2. **Swift 风格** - 生成的代码符合 Swift 习惯
3. **最小运行时** - 核心文件尽量精简
4. **模块化** - 每个 TypeScript 文件独立转换为 Swift enum

## 测试覆盖率

### 已通过的测试（17/19 ≈ 89%）
- ✅ basic - 基本类型、控制流
- ✅ imports/exports - 导入导出
- ✅ strings/concat - 字符串
- ✅ arrays - 数组类型
- ✅ objects/object-props - 对象字面量
- ✅ classes - 类定义
- ✅ functions - 函数和闭包
- ✅ types - 类型别名
- ✅ generics - 泛型
- ✅ enum - 枚举
- ✅ interface - 接口
- ✅ control-flow - 控制流
- ✅ util - 工具函数
- ⚠️ async - Promise 类已创建，TypeScript 代码转换需要更多工作
- ⚠️ complex - 部分通过

## 已知限制

1. **async/await** - TypeScript 的 async 函数需要转换为 Promise 链
2. **联合类型** - `A | B` 转换为 `Any`
3. **泛型约束** - 部分复杂的泛型约束可能丢失
4. **装饰器** - 暂不支持
5. **命名空间** - 转换为 flat enum

## 未来改进

1. 完善 async/await 支持
2. 更好的联合类型处理
3. 支持更多的 TypeScript 特性
4. 优化生成的 Swift 代码质量
