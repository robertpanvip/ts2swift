// 测试导入导出

// 导出变量
export const PI = 3.14159;
export let counter = 0;

// 导出函数
export function greet(name: string): string {
    return "Hello, " + name + "!";
}

// 导出类
export class Calculator {
    public add(a: number, b: number): number {
        return a + b;
    }
}

// 默认导出
export default function main(): void {
    console.log("Main function");
}

// 使用导出的内容
console.log("PI:", PI);
console.log("Counter:", counter);
console.log("Greeting:", greet("World"));

export const calc = new Calculator();
console.log("Add:", calc.add(1, 2));
