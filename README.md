# TypeScript to Swift 转译器 (ts2Swift)

一个将 TypeScript 代码转换为 Swift 代码的转译器，使用 ts-morph 进行 AST 解析和代码生成。

## 🎯 核心功能

### 1. 基础类型转换
- ✅ **基本类型**: string → String, number → Number, boolean → Bool, void → Void, any → Any
- ✅ **字面量**: 字符串、数字、布尔值、null、undefined
- ✅ **数组**: `T[]` → `[T]`
- ✅ **只读数组**: `readonly T[]` → `[T]`
- ✅ **对象类型**: 转换为 Swift 字典或匿名类

### 2. 变量和常量
- ✅ **const**: 转换为 Swift 的 `let`
- ✅ **var**: 转换为 Swift 的 `var`
- ✅ **类型推断**: 自动推断变量类型
- ✅ **显式类型注解**: 支持 TypeScript 类型注解

### 3. 函数
- ✅ **函数声明**: 转换为 Swift 函数
- ✅ **箭头函数**: 转换为 Swift 闭包
- ✅ **函数表达式**: 转换为 Swift 闭包
- ✅ **参数标签**: 使用 `_` 允许省略参数标签
- ✅ **默认参数**: 支持默认参数值
- ✅ **泛型函数**: 支持泛型参数和约束
- ✅ **async 函数**: 转换为返回 Promise 的函数（Babel 风格）

### 4. 类和面向对象
- ✅ **类声明**: 转换为 Swift 类
- ✅ **继承**: 支持 extends 关键字
- ✅ **接口实现**: 支持 implements 关键字
- ✅ **构造函数**: 转换为 Swift 的 init
- ✅ **方法**: 支持实例方法和静态方法
- ✅ **属性**: 支持实例属性和静态属性
- ✅ **getter/setter**: 转换为 Swift 计算属性
- ✅ **override**: 自动检测并添加 override 关键字
- ✅ **访问修饰符**: public, private, protected
- ✅ **readonly**: 只读属性

### 5. 表达式和运算符
- ✅ **算术运算符**: +, -, *, /, %
- ✅ **比较运算符**: ==, !=, <, >, <=, >=
- ✅ **逻辑运算符**: &&, ||, !
- ✅ **赋值运算符**: =, +=, -=, *=, /=, %=
- ✅ **三元运算符**: condition ? true : false
- ✅ **逗号运算符**: 支持逗号表达式
- ✅ **instanceof**: 类型检查
- ✅ **in**: 属性检查
- ✅ **typeof**: 类型查询

### 6. 特殊语法

#### 6.1 解构赋值
- ✅ **对象解构**: `const { name, age } = obj`
- ✅ **数组解构**: `const [first, second] = arr`
- ✅ **别名语法**: `const { name: userName } = obj`
- ✅ **默认值**: `const { name = 'default' } = obj`
- ✅ **嵌套解构**: 支持多层嵌套

#### 6.2 模板字符串
- ✅ **字符串插值**: `` `Hello ${name}` `` → `"Hello \(name)"`
- ✅ **转义处理**: 正确处理特殊字符

#### 6.3 正则表达式
- ✅ **字面量**: `/pattern/flags` → `RegExp("pattern", flags: "flags")`
- ✅ **RegExp 构造函数**: `new RegExp("pattern")`

#### 6.4 BigInt
- ✅ **字面量**: `123n` → `BigInt(123)`
- ✅ **BigInt 函数**: `BigInt("123")`
- ✅ **运算支持**: +, -, *, /, %, 比较运算

#### 6.5 块状表达式
- ✅ **独立代码块**: `{ ... }` → `do { ... }`

#### 6.6 条件类型
- ✅ **三元类型**: `T extends U ? X : Y` → `Any`

#### 6.7 泛型类
- ✅ **泛型参数**: `class Box<T> { }`
- ✅ **泛型约束**: `class Box<T extends SomeType> { }`

### 7. 异步编程 (Babel 风格)

#### 7.1 Promise
- ✅ **Promise 类**: 完整的 Promise/A+ 实现
- ✅ **Promise 构造函数**: `new Promise<T>((resolve, reject) => { })`
- ✅ **then 方法**: 支持链式调用
- ✅ **catch 方法**: 错误处理
- ✅ **finally 方法**: 最终处理
- ✅ **静态方法**:
  - `Promise.resolve()`
  - `Promise.reject()`
  - `Promise.all()`
  - `Promise.race()`

#### 7.2 async/await
- ✅ **async 函数**: 转换为返回 Promise 的普通函数
- ✅ **await 表达式**: 转换为 Promise.then 链式调用
- ✅ **Babel 风格转换**:
  ```typescript
  // TypeScript
  async function fn() {
      const x = await fn1();
      const y = await fn2(x);
      return y;
  }
  
  // Swift (转换后)
  func fn() -> Promise<Any> {
      return Promise<Any>.resolve(()).then(onFulfilled: { _ in
          return fn1().then(onFulfilled: { x in
              return fn2(x).then(onFulfilled: { y in
                  return Promise<Any>.resolve(y)
              })
          })
      })
  }
  ```

#### 7.3 事件循环
- ✅ **微任务队列 (MicroTaskQueue)**: 
  - 支持 enqueue 和 processQueue
  - 微任务嵌套执行
- ✅ **宏任务队列 (MacTaskQueue)**:
  - 支持 setTimeout 延迟执行
  - 支持取消任务
- ✅ **事件循环 (EventLoop)**:
  - 协调微任务和宏任务
  - 微任务在宏任务后执行
- ✅ **全局函数**:
  - `queueMicrotask(task)` - 添加微任务
  - `setTimeout(callback, delay)` - 设置定时器
  - `clearTimeout(id)` - 清除定时器

### 8. 类型系统
- ✅ **类型推断**: 自动推断表达式类型
- ✅ **联合类型**: `A | B` → `Any` (简化处理)
- ✅ **交叉类型**: `A & B` → `Any` (简化处理)
- ✅ **元组类型**: `[T, U]` → `[T, U]`
- ✅ **字面量类型**: 转换为对应的 Swift 类型
- ✅ **索引类型**: `T[K]` → `Any` (简化处理)

### 9. 语句支持
- ✅ **表达式语句**
- ✅ **返回语句**: return
- ✅ **if 语句**: if/else
- ✅ **for 循环**: for, for...of, for...in
- ✅ **while 循环**: while, do...while
- ✅ **switch 语句**: switch/case
- ✅ **try-catch**: 错误处理
- ✅ **throw**: 抛出异常
- ✅ **break/continue**: 循环控制

### 10. 枚举 (新增) 🔥
- ✅ **枚举声明**: `enum Direction { North, South, East, West }`
- ✅ **枚举成员**: 自动转换为 Swift 枚举
- ✅ **枚举访问**: `Direction.North` → `.North`
- ✅ **带值的枚举**: `enum Status { Success = 200, Error = 404 }`

### 12. 联合类型和类型收窄 (新增) 🔥

#### 12.1 联合类型处理
- ✅ **基础联合类型**: `A | B` → `Any` (简化处理)
- ✅ **可选类型**: `T | undefined` → `T?`
- ✅ **Interface 可选属性**: `name?: string` → `var name: String?`
- ✅ **联合类型参数**: `function fn(x: number | string)` → `func fn(_ x: Any)`

#### 12.2 类型收窄检测
- ✅ **自动检测**: 比较定义处和使用处的类型
- ✅ **强制转换**: 类型收窄时自动添加 `as!` 转换
- ✅ **完全信任 TypeScript**: TypeScript 的类型收窄是安全的

```typescript
// TypeScript
interface Person {
    name?: string;  // 定义处：String?
}

const person: Person = { name: "Alice" };
const name = person.name;  // 使用处：String?（未收窄）
```

```swift
// Swift (转换后)
let name: String? = person.name
```

#### 12.3 可选链和空值合并
- ✅ **可选链 `?.`**: 直接翻译为 Swift 的 `?.`
- ✅ **空值合并 `??`**: 直接翻译为 Swift 的 `??`
- ✅ **嵌套可选链**: `person.address?.city?.length`
- ✅ **类型推断**: 自动推断可选链返回类型

```typescript
// TypeScript
const city = person.address?.city ?? "Unknown";
const nameLen = person.name?.length;
```

```swift
// Swift (转换后)
let city = person.address?.city ?? "Unknown"
let nameLen: Number? = ({ () -> Number? in
    if let str = person.name {
        return Number(str.count)
    }
    return nil
}())
```

### 13. 字符串方法转换 (新增)
- ✅ **toUpperCase()**: → `uppercased()`
- ✅ **toLowerCase()**: → `lowercased()`

### 11. 模块系统
- ✅ **import**: 导入语句
- ✅ **export**: 导出语句
- ✅ **默认导出**: export default
- ✅ **命名导出**: export { name }

## 🏗️ 架构设计

### 核心组件

1. **AST 解析** (ts-morph)
   - TypeScript 源代码 → AST
   - 类型检查和推断

2. **代码生成** (main.ts)
   - AST → Swift 代码
   - 类型转换和映射
   - 格式化和缩进

3. **运行时支持** (core/)
   - `Number.swift`: Number 类（包装 Double）
   - `String.swift`: String 扩展
   - `Array.swift`: Array 扩展
   - `BigInt.swift`: BigInt 类
   - `RegExp.swift`: RegExp 类
   - `Promise.swift`: Promise 类
   - `EventLoop.swift`: 事件循环

### 代码结构

```
ts2Swift/
├── src/
│   └── main.ts          # 核心转译逻辑
├── core/
│   ├── Number.swift     # Number 运行时
│   ├── BigInt.swift     # BigInt 运行时
│   ├── RegExp.swift     # RegExp 运行时
│   ├── Promise.swift    # Promise 运行时
│   └── EventLoop.swift  # 事件循环运行时
├── test/
│   ├── ts/              # TypeScript 测试文件
│   └── build/           # 生成的 Swift 代码
├── ts-swift.ts          # 入口文件
└── package.json
```

## 📝 转译规则

### 核心设计原则

1. **简化处理** - 不支持复杂的联合类型运算
2. **完全信任 TypeScript** - TypeScript 的类型收窄是安全的
3. **类型收窄检测** - 自动检测并使用 `as!` 强制转换
4. **Swift 原生可选类型** - 使用 `T?` 处理 `T | undefined`
5. **直接翻译** - TypeScript 的 `?.` 和 `??` 直接翻译为 Swift

### 类型映射

| TypeScript | Swift | 说明 |
|------------|-------|------|
| string | String | 基础类型 |
| number | Number | 基础类型 |
| boolean | Bool | 基础类型 |
| void | Void | 基础类型 |
| any | Any | 基础类型 |
| null | Null() | 运行时值 |
| undefined | Undefined() | 运行时值 |
| T[] | [T] | 数组 |
| Promise<T> | Promise<T> | Promise |
| (a: T) => R | (T) -> R | 函数 |
| T \| undefined | T? | 可选类型 |
| T? | T? | Interface 可选属性 |
| A \| B | Any | 联合类型（简化） |

### 命名约定

- **变量**: TypeScript 的 camelCase → Swift 的 camelCase
- **函数**: TypeScript 的 camelCase → Swift 的 camelCase
- **类**: TypeScript 的 PascalCase → Swift 的 PascalCase
- **属性**: 保持 TypeScript 的命名

### 缩进规则

- 使用 4 个空格作为缩进单位
- CodeResult 类型包含 `indentLevel` 字段
- 通过 `getIndent()` 和 `indentCode()` 函数管理缩进

## 🚀 使用方法

```bash
# 安装依赖
npm install

# 运行转译器
npm run ts-swift <input.ts>

# 示例
npm run ts-swift test/ts/example.ts
```

## ✅ 测试用例

### 基础功能测试
- `basic.ts` - 基础类型和表达式
- `classes.ts` - 类和对象
- `destructuring-test.ts` - 解构赋值
- `destructuring-test2.ts` - 完整解构赋值

### 高级功能测试
- `regex-block-test.ts` - 正则表达式和块状表达式
- `new-features-test.ts` - 新特性综合测试
- `async-await-test.ts` - async/await 支持
- `event-loop-demo.ts` - 事件循环演示
- `promise-test.ts` - Promise 功能测试

### 联合类型和类型收窄测试 (新增) 🔥
- `union-type-test.ts` - 联合类型基础测试
  - 基础联合类型参数
  - 联合类型变量
  - 联合类型属性
  - 可选类型（T | undefined）
- `type-narrowing-test.ts` - 类型收窄测试
  - 可选属性访问
  - 可选链的类型收窄
  - 联合类型参数
- `optional-chain-test.ts` - 可选链综合测试
  - 嵌套可选链
  - 可选链 + 空值合并
  - Interface 可选属性

### 运行测试
```bash
# 联合类型测试
npm run run-union-type

# 类型收窄测试
npm run run-type-narrowing

# 可选链测试
npm run run-optional-chain
```

## 🔧 开发说明

### 添加新功能

1. **AST 节点处理**: 在 `parseExpression` 或 `parseStatement` 中添加对应处理
2. **类型转换**: 在 `parseType` 或 `parseTypeNode` 中添加类型映射
3. **运行时支持**: 在 `core/` 目录添加 Swift 实现
4. **测试**: 在 `test/ts/` 添加测试用例

### 调试技巧

- 使用 `console.log()` 输出 AST 节点信息
- 查看生成的 Swift 代码定位问题
- 使用 Swift 编译器错误信息修复类型问题

## 📊 当前限制

### 类型系统
- ✅ 联合类型 `A | B` → `Any` (简化处理)
- ✅ 可选类型 `T | undefined` → `T?`
- ✅ 类型收窄检测（基于类型比较）
- ❌ 复杂的联合类型运算（如 `(A | B) & C`）
- ❌ 映射类型和条件类型（部分支持）
- ❌ 模板字面量类型
- ❌ 类型守卫的自动收窄（如 `typeof x === "string"`）

### 运行时
- ⚠️ Promise 链式调用的类型推断需要显式指定泛型参数
- ⚠️ async/await 的完整转换需要更复杂的状态机
- ⚠️ 部分 Array 方法需要额外实现
- ⚠️ 可选类型传递给 `console.log` 时有警告（需要显式转换）

### 语法支持
- ❌ 装饰器（Decorator）
- ❌ 命名空间（Namespace）
- ✅ 枚举（Enum）
- ❌ 生成器（Generator）
- ❌ 联合类型数组 `(number | string)[]` → `[Any]`

### 性能优化空间
- ⚠️ 类型信息可以缓存（当前每次都重新获取）
- ⚠️ 类型比较可以使用引用比较（当前使用文本比较）

## 📚 参考文档

- [TypeScript AST](https://ts-morph.com/)
- [Swift 语言指南](https://docs.swift.org/swift-book/)
- [Promise/A+ 规范](https://promisesaplus.com/)
- [Babel async/await 转换](https://babeljs.io/docs/en/babel-plugin-transform-async-to-generator)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
