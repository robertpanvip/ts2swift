// 测试类型和类型注解 - 简化版

// 基本类型注解
let numValue: number = 42;
let strValue: string = "test";
let boolValue: boolean = true;

console.log("Number:", numValue);
console.log("String:", strValue);
console.log("Boolean:", boolValue);

// 类型推断
let inferredNum = 100;
let inferredStr = "inferred";
let inferredBool = false;

console.log("Inferred number:", inferredNum);
console.log("Inferred string:", inferredStr);
console.log("Inferred boolean:", inferredBool);

// Union 类型（使用 any 模拟）
let unionValue: any = 123;
console.log("Union as number:", unionValue);
unionValue = "string now";
console.log("Union as string:", unionValue);

// 类型别名
type MyNumber = number;
type MyString = string;

let myNum: MyNumber = 999;
let myStr: MyString = "type alias";

console.log("MyNumber:", myNum);
console.log("MyString:", myStr);

// 函数返回类型
function getNumber(): number {
    return 42;
}

function getString(): string {
    return "hello";
}

console.log("Function returns number:", getNumber());
console.log("Function returns string:", getString());

// void 函数
function logMessage(msg: string): any {
    console.log("Log:", msg);
}

logMessage("This is a void function");
