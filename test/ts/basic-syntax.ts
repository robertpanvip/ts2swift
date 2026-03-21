// 基础语法测试用例

// 变量声明和赋值
var num: number = 123;
let str: string = "hello";
const bool: boolean = true;

// 基本类型
const nullVal: null = null;
const undefinedVal: undefined = undefined;

// 算术运算符
const sum: number = 1 + 2;
const difference: number = 5 - 3;
const product: number = 4 * 5;
const quotient: number = 10 / 2;
const remainder: number = 7 % 3;

// 比较运算符
const isEqual: boolean = 5 === 5;
const isNotEqual: boolean = 5 !== 3;
const isGreater: boolean = 10 > 5;
const isLess: boolean = 3 < 5;
const isGreaterOrEqual: boolean = 5 >= 5;
const isLessOrEqual: boolean = 3 <= 5;

// 逻辑运算符
const andResult: boolean = true && false;
const orResult: boolean = true || false;
const notResult: boolean = !true;

// 三元运算符
const ternaryResult: string = 10 > 5 ? "greater" : "less";

// 字符串操作
const concat: string = "hello" + " " + "world";
const templateString: string = `Hello, ${str}!`;

// 数组基础操作
const numbers: number[] = [1, 2, 3, 4, 5];
const firstElement: number = numbers[0];
const lastElement: number = numbers[numbers.length - 1];

// 对象基础操作
const person: { name: string; age: number } = {
    name: "John",
    age: 30
};
const personName: string = person.name;
const personAge: number = person.age;

// 函数声明和调用
function add(a: number, b: number): number {
    return a + b;
}

function greet(name: string): string {
    return `Hello, ${name}!`;
}

// 条件语句
if (num > 100) {
    console.log("num is greater than 100");
} else if (num > 50) {
    console.log("num is greater than 50");
} else {
    console.log("num is less than or equal to 50");
}

// 循环语句
for (let i: number = 0; i < 5; i++) {
    console.log(`Loop iteration: ${i}`);
}

let j: number = 0;
while (j < 3) {
    console.log(`While loop: ${j}`);
    j++;
}

// 函数表达式
const multiply: (a: number, b: number) => number = function(a, b) {
    return a * b;
};

// 箭头函数
const divide: (a: number, b: number) => number = (a, b) => a / b;

// 类型断言
const anyValue: any = "string value";
const stringValue: string = anyValue as string;

// 测试输出
console.log("num:", num);
console.log("str:", str);
console.log("bool:", bool);
console.log("sum:", sum);
console.log("difference:", difference);
console.log("product:", product);
console.log("quotient:", quotient);
console.log("remainder:", remainder);
console.log("isEqual:", isEqual);
console.log("isNotEqual:", isNotEqual);
console.log("isGreater:", isGreater);
console.log("isLess:", isLess);
console.log("isGreaterOrEqual:", isGreaterOrEqual);
console.log("isLessOrEqual:", isLessOrEqual);
console.log("andResult:", andResult);
console.log("orResult:", orResult);
console.log("notResult:", notResult);
console.log("ternaryResult:", ternaryResult);
console.log("concat:", concat);
console.log("templateString:", templateString);
console.log("firstElement:", firstElement);
console.log("lastElement:", lastElement);
console.log("personName:", personName);
console.log("personAge:", personAge);
console.log("add(1, 2):", add(1, 2));
console.log("greet('World'):", greet("World"));
console.log("multiply(5, 3):", multiply(5, 3));
console.log("divide(10, 2):", divide(10, 2));
console.log("stringValue:", stringValue);
