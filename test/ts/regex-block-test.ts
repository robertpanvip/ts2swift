// 测试正则表达式和块状表达式

// 正则表达式字面量
const regex1 = /[.]*test/;
console.log('regex1 test "zztest":', regex1.test("zztest"));
console.log('regex1 test "abc":', regex1.test("abc"));

// 带标志的正则表达式
const regex2 = /hello/gi;
console.log('regex2 test "HELLO":', regex2.test("HELLO"));

// 直接使用正则表达式字面量
console.log('/[.]*/.test("zz"):', /[.]*/.test("zz"));
console.log('/[.]*/.test("abc"):', /[.]*/.test("abc"));

// 块状语句（不是表达式）
{
    console.log("这是一个单独的块");
    const a = 100;
    console.log('a =', a);
}

// 使用 IIFE 模拟块状表达式
const result = (() => {
    console.log("块状表达式内部");
    const x = 10;
    const y = 20;
    return x + y;
})();
console.log('块状表达式结果:', result);
