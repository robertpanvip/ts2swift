// 测试基本类型
const num: number = 123;
const str: string = "hello";
const bool: boolean = true;
const nullVal: null = null;
const undefinedVal: undefined = undefined;

// 使用这些变量以避免警告
console.log(str, bool, nullVal, undefinedVal);

// 测试控制流
if (num > 100) {
    console.log("num is greater than 100");
} else {
    console.log("num is less than or equal to 100");
}

// 测试循环
for (let i = 0; i < 5; i++) {
    console.log(i);
}

// 测试函数
function add(a: number, b: number): number {
    return a + b;
}

const sum = add(1, 2);
console.log(sum);