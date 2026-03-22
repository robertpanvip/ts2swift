// TypeScript 基础语法全面测试

// 1. 变量声明
console.log('=== Variable Declarations ===');
const constVar: string = 'const value';
let letVar: number = 42;
var varVar: boolean = true;
console.log('constVar:', constVar);
console.log('letVar:', letVar);
console.log('varVar:', varVar);

// 2. 基本类型
console.log('\n=== Basic Types ===');
const num: number = 123;
const str: string = 'Hello TypeScript';
const bool: boolean = false;
const nil: null = null;
const undef: undefined = undefined;
console.log('number:', num);
console.log('string:', str);
console.log('boolean:', bool);
console.log('null:', nil);
console.log('undefined:', undef);

// 3. 数组
console.log('\n=== Arrays ===');
const numArray: number[] = [1, 2, 3, 4, 5];
const strArray: string[] = ['a', 'b', 'c'];
const mixedArray: any[] = [1, 'two', true, null];
console.log('numArray:', numArray);
console.log('strArray:', strArray);
console.log('mixedArray:', mixedArray);
console.log('numArray length:', numArray.length);
console.log('numArray[0]:', numArray[0]);

// 4. 元组
console.log('\n=== Tuples ===');
const tuple: [string, number] = ['hello', 10];
console.log('tuple:', tuple);
console.log('tuple[0]:', tuple[0]);
console.log('tuple[1]:', tuple[1]);

// 5. 枚举
console.log('\n=== Enums ===');
enum Color {
    Red,
    Green,
    Blue
}
const color: Color = Color.Green;
console.log('Color.Green:', color);
console.log('Color[1]:', Color[1]);

// 6. 对象字面量
console.log('\n=== Object Literals ===');
const obj = {
    name: 'Test',
    value: 42,
    active: true
};
console.log('obj:', obj);
console.log('obj.name:', obj.name);
console.log('obj.value:', obj.value);

// 7. 函数
console.log('\n=== Functions ===');
function add(a: number, b: number): number {
    return a + b;
}
const subtract = (a: number, b: number): number => a - b;
console.log('add(5, 3):', add(5, 3));
console.log('subtract(10, 4):', subtract(10, 4));

// 8. 类
console.log('\n=== Classes ===');
class Animal {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
    move(distance: number): void {
        console.log(`${this.name} moved ${distance}m`);
    }
}
const dog = new Animal('Dog');
console.log('dog.name:', dog.name);
dog.move(5);

// 9. 接口
console.log('\n=== Interfaces ===');
interface Point {
    x: number;
    y: number;
}
const point: Point = { x: 10, y: 20 };
console.log('point:', point);
console.log('point.x:', point.x);
console.log('point.y:', point.y);

// 10. 类型别名
console.log('\n=== Type Aliases ===');
type ID = string | number;
const id1: ID = 'abc123';
const id2: ID = 456;
console.log('id1:', id1);
console.log('id2:', id2);

// 11. 联合类型
console.log('\n=== Union Types ===');
let unionValue: string | number;
unionValue = 'hello';
console.log('unionValue (string):', unionValue);
unionValue = 123;
console.log('unionValue (number):', unionValue);

// 12. 类型断言
console.log('\n=== Type Assertions ===');
const someValue: any = 'This is a string';
const strLength: number = (someValue as string).length;
console.log('strLength:', strLength);

// 13. 模板字符串
console.log('\n=== Template Strings ===');
const firstName: string = 'John';
const lastName: string = 'Doe';
const fullName: string = `${firstName} ${lastName}`;
console.log('fullName:', fullName);

// 14. 解构赋值（简化）
console.log('\n=== Destructuring ===');
const first = 1;
const second = 2;
const third = 3;
console.log('first:', first);
console.log('second:', second);
console.log('third:', third);

const destructuredName = obj.name;
const destructuredValue = obj.value;
console.log('name:', destructuredName);
console.log('value:', destructuredValue);

// 15. 展开运算符
console.log('\n=== Spread Operator ===');
const arr1: number[] = [1, 2, 3];
const arr2: number[] = [...arr1, 4, 5, 6];
console.log('arr2:', arr2);

const obj1 = { a: 1, b: 2 };
const obj2 = { ...obj1, c: 3 };
console.log('obj2:', obj2);

// 16. 可选参数和默认参数
console.log('\n=== Optional and Default Parameters ===');
function greet(name: string, greeting: string = 'Hello'): void {
    console.log(`${greeting}, ${name}!`);
}
greet('Alice');
greet('Bob', 'Hi');

// 17. 剩余参数
console.log('\n=== Rest Parameters ===');
function sum(...numbers: number[]): number {
    let total = 0;
    for (const num of numbers) {
        total += num;
    }
    return total;
}
console.log('sum(1, 2, 3, 4):', sum(1, 2, 3, 4));

// 18. 泛型函数
console.log('\n=== Generic Functions ===');
function identity<T>(arg: T): T {
    return arg;
}
console.log('identity<string>("Generic"):', identity('Generic'));
console.log('identity<number>(42):', identity(42));

// 19. 条件语句
console.log('\n=== Conditional Statements ===');
const score: number = 85;
if (score >= 90) {
    console.log('Grade: A');
} else if (score >= 80) {
    console.log('Grade: B');
} else {
    console.log('Grade: C');
}

// 20. switch 语句
console.log('\n=== Switch Statement ===');
const day: number = 3;
switch (day) {
    case 1:
        console.log('Monday');
        break;
    case 2:
        console.log('Tuesday');
        break;
    case 3:
        console.log('Wednesday');
        break;
    default:
        console.log('Other day');
}

// 21. for 循环
console.log('\n=== For Loop ===');
let forResult: string = '';
for (let i = 0; i < 5; i++) {
    forResult += `${i} `;
}
console.log('forResult:', forResult.trim());

// 22. while 循环
console.log('\n=== While Loop ===');
let whileCount: number = 0;
let whileResult: string = '';
while (whileCount < 3) {
    whileResult += `${whileCount} `;
    whileCount++;
}
console.log('whileResult:', whileResult.trim());

// 23. do-while 循环
console.log('\n=== Do-While Loop ===');
let doCount: number = 0;
let doResult: string = '';
do {
    doResult += `${doCount} `;
    doCount++;
} while (doCount < 3);
console.log('doResult:', doResult.trim());

// 24. for...of 循环
console.log('\n=== For...Of Loop ===');
const fruits: string[] = ['apple', 'banana', 'orange'];
let ofResult: string = '';
for (const fruit of fruits) {
    ofResult += `${fruit} `;
}
console.log('ofResult:', ofResult.trim());

// 25. for...in 循环
console.log('\n=== For...In Loop ===');
const person = {
    firstName: 'John',
    lastName: 'Doe',
    age: 30
};
let inResult: string = '';
for (const key in person) {
    inResult += `${key}:${(person as any)[key]} `;
}
console.log('inResult:', inResult.trim());

// 26. try-catch-finally
console.log('\n=== Try-Catch-Finally ===');
try {
    console.log('Trying...');
    throw Error('Test error');
} catch (e) {
    console.log('Caught:', (e as Error).message);
} finally {
    console.log('Finally executed');
}

// 27. 三元运算符
console.log('\n=== Ternary Operator ===');
const age: number = 20;
const status: string = age >= 18 ? 'adult' : 'minor';
console.log('status:', status);

// 28. 空值合并运算符
console.log('\n=== Nullish Coalescing ===');
const nullValue: null = null;
const defaultValue: string = 'default';
const result1: string = nullValue ?? defaultValue;
console.log('result1:', result1);

const nonNullValue: string = 'value';
const result2: string = nonNullValue ?? defaultValue;
console.log('result2:', result2);

// 29. 可选链运算符（简化版）
console.log('\n=== Optional Chaining ===');
const containerValue: number | undefined = container.nested ? container.nested.value : undefined;
console.log('containerValue:', containerValue ?? 'undefined');

// 30. 类型守卫
console.log('\n=== Type Guards ===');
function printId(id: number | string) {
    if (typeof id === 'string') {
        console.log('String ID:', id.toUpperCase());
    } else {
        console.log('Number ID:', id.toFixed(2));
    }
}
printId('abc');
printId(123);

console.log('\n=== All Tests Completed ===');
