// VoidType 测试 - 验证操作符行为

// 测试 1: 比较运算符
console.log('=== 比较运算符测试 ===');
console.log('undefined == undefined:', undefined == undefined); // true
console.log('undefined === undefined:', undefined === undefined); // true
console.log('undefined == null:', undefined == null); // true
console.log('undefined === null:', undefined === null); // false
console.log('undefined != null:', undefined != null); // false
console.log('undefined !== null:', undefined !== null); // true

// 测试 2: 逻辑运算符
console.log('\n=== 逻辑运算符测试 ===');
console.log('!undefined:', !undefined); // true
console.log('Boolean(undefined):', Boolean(undefined)); // false

// 测试 3: 算术运算
console.log('\n=== 算术运算测试 ===');
console.log('undefined + undefined:', undefined + undefined); // NaN
console.log('undefined + 1:', undefined + 1); // NaN
console.log('1 + undefined:', 1 + undefined); // NaN
console.log('undefined - undefined:', undefined - undefined); // NaN
console.log('undefined * undefined:', undefined * undefined); // NaN
console.log('undefined / undefined:', undefined / undefined); // NaN
console.log('-undefined:', -undefined); // NaN

// 测试 4: 类型转换
console.log('\n=== 类型转换测试 ===');
console.log('Number(undefined):', Number(undefined)); // NaN
console.log('String(undefined):', String(undefined)); // "undefined"

// 测试 5: 函数返回 undefined (Void)
console.log('\n=== 函数返回值测试 ===');
function voidFunction(): void {
    // 没有返回值
}

const result = voidFunction();
console.log('voidFunction() == undefined:', result == undefined); // true
console.log('voidFunction() === undefined:', result === undefined); // true
console.log('voidFunction() == null:', result == null); // true
console.log('voidFunction() === null:', result === null); // false
