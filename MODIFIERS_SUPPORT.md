# TypeScript 修饰符支持度

## 已支持的修饰符

### 1. ✅ `export` (导出)
**支持程度**: 完全支持

**TypeScript**:
```typescript
export const x = 1
export function foo() {}
export class MyClass {}
export default MyClass
```

**Swift**:
```swift
public enum _Module {
    public static let x = Number(1)
    public static func foo() {}
    public static class MyClass { }
    public static let `default` = MyClass.self
}
```

**实现位置**: 
- `parseVariableStatement` (第 499 行)
- `parseFunctionDeclaration` (第 585 行)
- `parseClassDeclaration` (第 634 行)
- `parseExportAssignment` (第 1173 行)

---

### 2. ✅ `default` (默认导出)
**支持程度**: 完全支持

**TypeScript**:
```typescript
export default function foo() {}
export default class MyClass {}
export default x
```

**Swift**:
```swift
public enum _Module {
    public static let G_default = { }  // 函数
    public static let G_default = MyClass.self  // 类
    public static let G_default = x  // 变量
}
```

**实现位置**: 
- `parseFunctionDeclaration` (第 586 行)
- `parseExportAssignment` (第 1173 行)

---

### 3. ✅ `private` (私有)
**支持程度**: 部分支持（仅类成员）

**TypeScript**:
```typescript
class MyClass {
    private x: number = 1
}
```

**Swift**:
```swift
class MyClass {
    private var x: Number = 1
}
```

**实现位置**: 
- `parseClassDeclaration` (第 672 行)

**限制**: 
- 仅支持类成员属性
- 不支持私有方法（会转换为 `private func`，但 Swift 中可能需要调整）
- 不支持模块级别的私有（TypeScript 默认就是模块私有）

---

### 4. ✅ `public` (公共)
**支持程度**: 隐式支持

**说明**: TypeScript 中 `public` 是默认的，Swift 中导出的成员都会添加 `public` 修饰符

**TypeScript**:
```typescript
export class MyClass {
    public x: number = 1  // public 是可选的
}
```

**Swift**:
```swift
public class MyClass {
    public var x: Number = 1
}
```

---

## 不支持的修饰符

### 1. ❌ `protected` (受保护)
**支持程度**: 不支持

**问题**: 当前代码没有处理 `protected` 修饰符

**建议实现**:
```typescript
// src/main.ts parseClassDeclaration
const isProtected = member.hasModifier(ts.SyntaxKind.ProtectedKeyword);
// Swift 没有直接的 protected，可以使用 internal 或自定义方案
```

---

### 2. ❌ `static` (静态)
**支持程度**: 不支持

**问题**: 当前代码没有处理 `static` 修饰符

**TypeScript**:
```typescript
class MyClass {
    static x: number = 1
    static foo() {}
}
```

**期望 Swift**:
```swift
class MyClass {
    static var x: Number = 1
    static func foo() {}
}
```

**建议实现**:
```typescript
// src/main.ts parseClassDeclaration
const isStatic = member.hasModifier(ts.SyntaxKind.StaticKeyword);
methods.push(`${isStatic ? 'static ' : ''}func ${methodName}...`);
```

---

### 3. ❌ `async` (异步)
**支持程度**: 不支持

**问题**: 
- 没有处理 `async` 修饰符
- async 函数应该返回 `Promise`
- 需要配合 `await` 关键字

**TypeScript**:
```typescript
async function foo() {
    return await bar()
}
```

**期望 Swift**:
```swift
func foo() -> Promise {
    return bar()  // 需要转换
}
```

**建议实现**:
- 检测 `async` 修饰符
- 自动添加 `Promise` 返回类型
- 处理 `await` 表达式

---

### 4. ❌ `abstract` (抽象)
**支持程度**: 不支持

**TypeScript**:
```typescript
abstract class MyClass {
    abstract foo(): void
}
```

**期望 Swift**:
```swift
// Swift 使用 protocol 或要求子类实现
protocol MyClassProtocol {
    func foo()
}
```

---

### 5. ❌ `readonly` (只读)
**支持程度**: 不支持

**TypeScript**:
```typescript
class MyClass {
    readonly x: number = 1
}
```

**期望 Swift**:
```swift
class MyClass {
    let x: Number = 1  // Swift 使用 let 表示常量
}
```

**建议实现**:
```typescript
const isReadonly = member.hasModifier(ts.SyntaxKind.ReadonlyKeyword);
properties.push(`${isReadonly ? 'let' : 'var'} ${propName}...`);
```

---

### 6. ❌ `override` (重写)
**支持程度**: 不支持

**TypeScript**:
```typescript
class Child extends Parent {
    override foo() {}
}
```

**Swift**:
```swift
class Child: Parent {
    override func foo() {}
}
```

**建议实现**:
- 检测类是否有 `extends`
- 检测方法是否有 `override` 修饰符
- 添加 `override` 关键字到 Swift 方法

---

### 7. ❌ `declare` (声明)
**支持程度**: 不支持

**TypeScript**:
```typescript
declare const x: number
declare function foo(): void
```

**问题**: declare 是 TypeScript 的类型声明，不应该生成实现代码

**建议实现**:
- 跳过 declare 语句的代码生成
- 或者生成类型定义（如果做类型检查）

---

## 特殊修饰符

### `export default` 组合
**支持程度**: ✅ 完全支持

**TypeScript**:
```typescript
export default function() {}
export default class {}
```

**Swift**:
```swift
public enum _Module {
    public static let G_default = { }
    public static let G_default = SomeClass.self
}
```

---

## 总结

### 支持度统计
- ✅ **完全支持**: 2/9 (22%)
  - `export`
  - `default`
  
- ⚠️ **部分支持**: 2/9 (22%)
  - `private` (仅类成员)
  - `public` (隐式)

- ❌ **不支持**: 5/9 (56%)
  - `protected`
  - `static`
  - `async`
  - `abstract`
  - `readonly`
  - `override`
  - `declare`

### 优先级建议

#### 高优先级（常用）
1. **`static`** - 类级别属性和方法
2. **`async`** - 异步编程

#### 中优先级
3. **`protected`** - 继承场景
4. **`readonly`** - 常量属性

#### 低优先级
5. **`override`** - 明确重写关系
6. **`abstract`** - 抽象类/方法
7. **`declare`** - 类型声明

### 实现建议

添加修饰符支持的通用模式：

```typescript
function parseClassMember(member: any) {
    // 获取所有修饰符
    const isExport = member.hasModifier(ts.SyntaxKind.ExportKeyword);
    const isStatic = member.hasModifier(ts.SyntaxKind.StaticKeyword);
    const isAsync = member.hasModifier(ts.SyntaxKind.AsyncKeyword);
    const isPrivate = member.hasModifier(ts.SyntaxKind.PrivateKeyword);
    const isProtected = member.hasModifier(ts.SyntaxKind.ProtectedKeyword);
    const isReadonly = member.hasModifier(ts.SyntaxKind.ReadonlyKeyword);
    const isOverride = member.hasModifier(ts.SyntaxKind.OverrideKeyword);
    
    // 构建 Swift 修饰符
    let swiftModifiers = '';
    if (isPrivate) swiftModifiers += 'private ';
    if (isStatic) swiftModifiers += 'static ';
    if (isOverride) swiftModifiers += 'override ';
    
    // async 函数返回 Promise
    const returnType = isAsync ? 'Promise' : parseType(returnType);
    
    // 生成代码
    return `${swiftModifiers}func ${name}(...) -> ${returnType} { ... }`;
}
```
