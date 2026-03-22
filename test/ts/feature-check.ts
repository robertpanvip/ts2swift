// TypeScript 特性完整性检查

// 1. 基础类型
let str: string = "hello";
let num: number = 42;
let bool: boolean = true;
let any: any = "anything";
let voidVar: void = undefined;
let nullVar: null = null;
let undefinedVar: undefined = undefined;
let symbol: symbol = Symbol("test");
let bigint: bigint = 123n;

// 2. 数组和元组
let arr: number[] = [1, 2, 3];
let tuple: [string, number] = ["hello", 42];
let readonlyArr: readonly number[] = [1, 2, 3];

// 3. 枚举
enum Color { Red, Green, Blue }
let color: Color = Color.Green;

// 4. 接口
interface Person {
    name: string;
    age: number;
    readonly id: number;
}

// 5. 类型别名
type Point = { x: number; y: number };
type ID = string | number;

// 6. 联合类型和交叉类型
let union: string | number = "hello";
type A = { a: string };
type B = { b: number };
let cross: A & B = { a: "hello", b: 42 };

// 7. 类型守卫
function isString(x: any): x is string {
    return typeof x === "string";
}

// 8. 泛型
function identity<T>(arg: T): T {
    return arg;
}
let output = identity<string>("hello");

// 9. 异步和 Promise
async function fetchData(): Promise<string> {
    return "data";
}
fetchData().then(data => console.log(data));

// 10. 解构赋值
const { name, age } = { name: "Alice", age: 30 };
const [first, second] = [1, 2, 3];

// 11. 展开运算符
const arr1 = [1, 2];
const arr2 = [...arr1, 3, 4];
const obj1 = { a: 1 };
const obj2 = { ...obj1, b: 2 };

// 12. 可选链
const obj: any = {};
const val = obj?.property?.nested;

// 13. 空值合并运算符
const value = null ?? "default";

// 14. 模板字符串
const template = `Hello, ${name}!`;
const multiline = `
    Line 1
    Line 2
`;

// 15. 类
class Animal {
    protected name: string;
    constructor(name: string) {
        this.name = name;
    }
    move(distance: number = 0): void {
        console.log(`${this.name} moved ${distance}m`);
    }
}

class Dog extends Animal {
    constructor(name: string) {
        super(name);
    }
    bark(): void {
        console.log("Woof!");
    }
}

// 16. 访问器
class MyClass {
    private _value: number = 0;
    get value(): number {
        return this._value;
    }
    set value(v: number) {
        this._value = v;
    }
}

// 17. 命名空间
namespace Validation {
    export function check(x: any): boolean {
        return x !== null;
    }
}

// 18. 装饰器
function logged(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    console.log(`Method ${propertyKey} called`);
}

class Service {
    @logged
    greet(name: string): string {
        return `Hello, ${name}!`;
    }
}

// 19. 条件类型
type IsString<T> = T extends string ? true : false;

// 20. 映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

// 21. 索引类型
function getProperty<T, K extends keyof T>(obj: T, key: K) {
    return obj[key];
}

// 22. 映射类型
const mapped = [1, 2, 3].map(x => x * 2);
const filtered = [1, 2, 3].filter(x => x > 1);
const reduced = [1, 2, 3].reduce((sum, x) => sum + x, 0);

// 23. 箭头函数
const add = (a: number, b: number): number => a + b;

// 24. 生成器
function* generator() {
    yield 1;
    yield 2;
    yield 3;
}

// 25. 迭代器
for (const item of [1, 2, 3]) {
    console.log(item);
}

// 26. async/await
async function asyncFunc() {
    await Promise.resolve("done");
}

// 27. 类型断言
const someValue: any = "hello";
const strLength = (someValue as string).length;
const strLength2 = (<string>someValue).length;

// 28. const 断言
const config = {
    debug: true,
    version: "1.0.0"
} as const;

// 29. 非空断言
let maybeValue: string | null = null;
let sureValue: string = maybeValue!;

// 30. 满足运算符
type Color = { red: number; green: number; blue: number };
const palette = { red: 255, green: 0, blue: 0 } satisfies Color;
