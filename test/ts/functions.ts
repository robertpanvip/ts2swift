// 测试函数 - 简化版本

// 函数声明
function add(a: number, b: number): number {
    return a + b;
}

console.log("Add:", add(1, 2));

// 函数表达式
const multiply = function(a: number, b: number): number {
    return a * b;
};

console.log("Multiply:", multiply(3, 4));

// 箭头函数
const divide = (a: number, b: number): number => {
    return a / b;
};

console.log("Divide:", divide(10, 2));

// 闭包 - 直接调用
function createAdderAndAdd(x: number, y: number): number {
    const adder = function(z: number): number {
        return x + z;
    };
    return adder(y);
}

console.log("Add 5 + 10:", createAdderAndAdd(5, 10));

// 带默认参数的函数
function greet(name: string, greeting: string = "Hello"): string {
    return greeting + ", " + name + "!";
}

console.log("Greet with default:", greet("World", "Hi"));

// 简单函数调用
function double(n: number): number {
    return n * 2;
}

console.log("Double:", double(5));


// 测试箭头函数
function testArrowFunction() {
    // 简单的箭头函数
    const add = (a: number, b: number) => a + b;
    console.log("Add:", add(1, 2));

    // 带花括号的箭头函数
    const multiply = (a: number, b: number) => {
        return a * b;
    };
    console.log("Multiply:", multiply(3, 4));

    // 无参数的箭头函数
    const greet = () => "Hello";
    console.log("Greet:", greet());

    // 单个参数的箭头函数（省略括号）
    const double = (x: number) => x * 2;
    console.log("Double:", double(5));

    // 箭头函数与数组方法
    const numbers = [1, 2, 3, 4, 5];
    const squared = numbers.map(n => n * n);
    console.log("Squared:", squared);
}

testArrowFunction();
