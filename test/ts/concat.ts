// 测试字符串拼接

// Number + String
const num1: number = 42;
const str1: string = "The answer is ";
console.log(str1 + num1);
console.log(num1 + " is the answer");

// String + String
const greeting: string = "Hello";
const name: string = "World";
console.log(greeting + ", " + name + "!");

// Number + Number (应该进行数学加法)
const a: number = 10;
const b: number = 20;
console.log("Sum:", a + b);

// 混合拼接
const text: string = "Result: ";
const result: number = a + b;
console.log(text + result);

// Null + String
const nullVal: any = null;
console.log("Null value: " + nullVal);

// Undefined + String
const undefinedVal: any = undefined;
console.log("Undefined value: " + undefinedVal);

// Boolean + String
const boolVal: boolean = true;
console.log("Boolean: " + boolVal);
console.log(boolVal + " is true");

// 复杂拼接
const x: number = 5;
const y: number = 10;
console.log("The sum of " + x + " and " + y + " is " + (x + y));
