# 联合类型实现总结

## 概述

本文档总结了 TypeScript 到 Swift 转译器中联合类型（Union Types）的实现方案。

## 核心设计原则

1. **简化处理** - 不支持复杂的联合类型运算
2. **完全信任 TypeScript** - TypeScript 的类型收窄是安全的
3. **类型收窄检测** - 自动检测并使用 `as!` 强制转换
4. **Swift 原生可选类型** - 使用 `T?` 处理 `T | undefined`

## 核心转换思路

### 用户的原始设计思路

整个联合类型的实现基于以下核心思路：

1. **联合类型和聚合类型统一转为 `Any`**
   ```typescript
   // 不再尝试保留复杂的类型信息
   number | string      → Any
   Person | undefined   → Person?  // 例外：T | undefined 转为可选类型
   ```

2. **完全信任 TypeScript 的类型系统**
   - TypeScript 说类型是安全的，就是安全的
   - 不需要额外的运行时检查
   - 直接使用 `as!` 强制转换

3. **类型收窄检测方法**
   ```typescript
   // 核心思路：比较"定义处的类型"和"使用处的类型"
   const defType = getDefinitionType();    // 从 symbol.declarations[0].type 获取
   const useType = getUseType();           // 当前使用位置的类型
   
   if (defType !== useType) {
       // 类型不一致，说明 TypeScript 收窄了类型
       // 直接添加 as! 转换
       return `${identifier} as! ${parseType(useType)}`;
   }
   ```

4. **直接使用 Swift 的可选类型系统**
   - TypeScript 的 `?.` → Swift 的 `?.`
   - TypeScript 的 `??` → Swift 的 `??`
   - TypeScript 的 `T | undefined` → Swift 的 `T?`

### 为什么采用这个思路？

**之前的复杂方案问题**：
- ❌ 需要生成闭包包装函数
- ❌ 需要运行时检查 `Undefined()`
- ❌ 代码复杂，难以维护
- ❌ 性能开销大

**现在的简化方案优势**：
- ✅ 直接翻译，代码简洁
- ✅ 利用 Swift 的类型系统
- ✅ 性能更好（无运行时开销）
- ✅ 易于理解和维护

### 关键实现洞察

用户提出的关键洞察：

> "我可以把 nil 当作一种类型吗"

这个洞察引导我们：
- 不再需要 `Undefined()` 运行时值
- 直接使用 Swift 的 `nil`
- 可选类型 `T?` 天然支持 `nil`

> "重写可选操作符这么麻烦吗"

实际上不需要重写：
- Swift 已经有 `?.` 操作符
- Swift 已经有 `??` 操作符
- 直接翻译即可

> "联合类型我没看到 类型收窄的测试用例呢"

类型收窄的实现：
- 通过 `symbol.declarations[0].type` 获取原始类型
- 与当前类型比较
- 不一致就添加 `as!` 转换

## 类型映射规则

### 1. 基础联合类型

```typescript
// 多个实际类型的联合 → Any
number | string          → Any
boolean | number         → Any
string | boolean | number → Any
```

**实现逻辑**：
- 在 `parseTypeNode` 中检测 `UnionType`
- 过滤掉 `undefined` 和 `null`
- 如果剩余类型 > 1，返回 `Any`

```typescript
// src/main.ts:2647-2662
if (nonUndefinedTypes.length > 1) {
    // 多个实际类型的联合，统一转为 Any
    return 'Any';
}
```

### 2. 可选类型（T | undefined）

```typescript
// T | undefined → T?
string | undefined  → String?
number | undefined  → Number?
boolean | undefined → Bool?
```

**实现逻辑**：
- 检测联合类型中是否只有一个非 `undefined` 类型
- 返回 `实际类型 + '?'`

```typescript
// src/main.ts:2650-2656
if (nonUndefinedTypes.length === 1) {
    const actualType = parseTypeNode(nonUndefinedTypes[0]);
    if (actualType === 'Any') {
        return 'Any';
    }
    return actualType + '?';
}
```

### 3. Interface 可选属性

```typescript
interface Person {
    name?: string;      // → var name: String? { get set }
    age?: number;       // → var age: Number? { get set }
    address?: Address;  // → var address: Address? { get set }
}
```

**实现逻辑**：
- 检查属性声明文本是否包含 `?`
- 检查类型是否是 `T | undefined` 联合类型
- 生成可选类型 `Type?`

```typescript
// src/main.ts:1376-1395
const hasQuestionToken = syntaxText.includes('?');
const isUnionWithUndefined = propTypeObj.isUnion() && 
    propTypeObj.getUnionTypes().some(t => t.isUndefined());

if (hasQuestionToken || isUnionWithUndefined) {
    if (!propType.endsWith('?')) {
        propType = `${propType}?`;
    }
}
```

## 类型收窄检测

### 实现原理

通过比较**变量定义处的类型**和**变量使用处的类型**，检测 TypeScript 是否进行了类型收窄。

```typescript
// src/main.ts:98-151
function checkTypeNarrowing(identifier: any, currentType: Type): string | null {
    // 1. 获取变量定义的 symbol
    const symbol = checker.getSymbolAtLocation(identifier);
    
    // 2. 获取定义的声明
    const declarations = symbol.getDeclarations();
    const decl = declarations[0];
    
    // 3. 获取定义处的类型
    let defType: Type | null = null;
    if (Node.isVariableDeclaration(decl)) {
        const typeNode = decl.getTypeNode();
        if (typeNode) {
            defType = typeNode.getType();  // 显式类型注解
        } else {
            const initializer = decl.getInitializer();
            if (initializer) {
                defType = initializer.getType();  // 推断类型
            }
        }
    } else if (Node.isPropertySignature(decl)) {
        defType = decl.getType();  // 属性类型
    }
    
    // 4. 比较类型文本
    if (defType.getText() !== currentType.getText()) {
        // 类型不一致，说明收窄了
        return parseType(currentType);  // 返回收窄后的类型
    }
    
    return null;  // 不需要转换
}
```

### 使用场景

#### 场景 1：函数参数收窄

```typescript
function printId(id: number | string) {
    // id 定义处：number | string
    // id 使用处：number | string（未收窄）
    console.log("ID:", id);
}
```

生成：
```swift
func printId(_ id: Any) {
    console.log("ID:", id)
}
```

#### 场景 2：可选属性访问

```typescript
interface Person {
    name?: string;  // 定义处：String?
}

const person: Person = { name: "Alice" };
const name = person.name;  // 使用处：String?（TypeScript 未收窄）
```

生成：
```swift
let name: String? = person.name
```

## 运算符处理

### 1. 空值合并运算符 `??`

```typescript
// 直接使用 Swift 的 ??
const city = person.address?.city ?? "Unknown";
```

生成：
```swift
let city = person.address?.city ?? "Unknown"
```

**实现**：
```typescript
// src/main.ts:2038-2041
if (operator === '??') {
    return {code: `${left} ?? ${right}`};
}
```

### 2. 可选链 `?.`

```typescript
// 直接翻译为 Swift 的 ?.
const city = person.address?.city;
```

生成：
```swift
let city: String? = person.address?.city as? String
```

**实现**：
```typescript
// src/main.ts:2326-2351
const isOptionalChain = syntaxText.includes('?.');

if (object.startsWith('AnonymousObject_') || isOptionalChain) {
    const accessOp = isOptionalChain ? '?.' : '.';
    return {code: `${object}${accessOp}${property} as? ${returnType}`};
}
```

### 3. 字符串方法

```typescript
const upper = str.toUpperCase();
const lower = str.toLowerCase();
```

生成：
```swift
let upper = str.uppercased()
let lower = str.lowercased()
```

**实现**：
```typescript
// src/main.ts:2154-2161
if (objType.isString() || objType.isStringLiteral()) {
    if (methodName === 'toUpperCase') {
        return {code: `(${objCode}).uppercased()`};
    } else if (methodName === 'toLowerCase') {
        return {code: `(${objCode}).lowercased()`};
    }
}
```

## 测试用例

### 联合类型测试

```typescript
// test/ts/union-type-test.ts

// 基础联合类型
function printId(id: number | string) {
    console.log("ID:", id);
}

// 联合类型变量
let value: number | string = 42;

// 联合类型属性
interface Config {
    timeout: number | string;
}

// 可选类型
interface Person {
    name?: string;
}
```

运行测试：
```bash
npm run run-union-type
```

### 类型收窄测试

```typescript
// test/ts/type-narrowing-test.ts

// 可选属性访问
const name: String? = person.name;

// 可选链
const nameLength = person.name?.length;

// 联合类型参数
function printId(id: number | string) {
    console.log("ID:", id);
}
```

运行测试：
```bash
npm run run-type-narrowing
```

## 限制和边界

### 不支持的场景

1. **复杂的联合类型运算**
   ```typescript
   // ❌ 不支持
   type T = (A | B) & C;
   ```

2. **联合类型数组**
   ```typescript
   // ❌ 不支持（会转为 Any）
   const items: (number | string)[] = [1, "two"];
   ```

3. **类型守卫的自动收窄**
   ```typescript
   // ❌ 不自动检测
   if (typeof x === "string") {
       // x 在这里应该是 string
   }
   ```

### 已支持的场景

1. ✅ `T | undefined` → `T?`
2. ✅ `T | null` → `T?`
3. ✅ `T | U` → `Any`
4. ✅ Interface 可选属性
5. ✅ 可选链 `?.`
6. ✅ 空值合并 `??`
7. ✅ 类型收窄检测（基于类型比较）

## 性能优化

### 类型缓存

当前实现会在每次访问变量时重新获取类型信息。未来可以添加缓存机制：

```typescript
const typeCache = new Map<string, Type>();

function getCachedType(identifier: string): Type {
    if (!typeCache.has(identifier)) {
        typeCache.set(identifier, computeType(identifier));
    }
    return typeCache.get(identifier)!;
}
```

### 类型比较优化

当前使用类型文本比较，可以优化为类型引用比较：

```typescript
// 当前：文本比较
if (defType.getText() !== currentType.getText())

// 优化：引用比较（如果可能）
if (defType !== currentType)
```

## 未来改进

1. **类型守卫支持** - 检测 `typeof`、`instanceof` 等类型守卫
2. **控制流分析** - 在 if/else 分支中自动收窄类型
3. **泛型联合类型** - 支持 `T extends A | B`
4. **字面量联合类型** - 支持 `"a" | "b" | "c"`

## 总结

当前的联合类型实现遵循**简化优先**的原则：

- ✅ 支持常见的 `T | undefined` 和 `T | U` 模式
- ✅ 自动检测类型收窄并添加转换
- ✅ 直接使用 Swift 的可选类型系统
- ❌ 不支持复杂的类型运算和控制流分析

这个方案在**简单性**和**功能性**之间取得了良好的平衡，适合大多数实际场景。
