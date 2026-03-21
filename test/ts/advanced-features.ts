// 高级功能测试：Math、RegExp、Error、switch、do-while、try-catch

// Math 测试
console.log('=== Math Tests ===');
console.log('PI:', Math.PI);
console.log('abs(-5):', Math.abs(Number(-5)));
console.log('ceil(4.3):', Math.ceil(Number(4.3)));
console.log('floor(4.7):', Math.floor(Number(4.7)));
console.log('round(4.5):', Math.round(Number(4.5)));
console.log('pow(2, 3):', Math.pow(Number(2), Number(3)));
console.log('sqrt(16):', Math.sqrt(Number(16)));
console.log('log(Math.E):', Math.log(Math.E));
console.log('sin(0):', Math.sin(Number(0)));
console.log('cos(0):', Math.cos(Number(0)));
console.log('max(1, 5, 3):', Math.max(Number(1), Number(5), Number(3)));
console.log('min(1, 5, 3):', Math.min(Number(1), Number(5), Number(3)));
console.log('random():', Math.random());

// RegExp 测试
console.log('=== RegExp Tests ===');
const regex = new RegExp('\\\\d+', 'g');
console.log('regex:', regex.toString());
console.log('test abc123:', regex.test('abc123'));
console.log('exec abc123def456:', regex.exec('abc123def456'));

const emailRegex = new RegExp('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+[.][a-zA-Z]{2,}')
console.log('email test:', emailRegex.test('test@example.com'))

// Error 测试
console.log('=== Error Tests ===');
const error = Error('Test error message');
console.log('error:', error.toString());
console.log('error name:', error.name);
console.log('error message:', error.message);

const typeError = TypeError('Type error!');
console.log('typeError:', typeError.toString());

// switch 测试
console.log('=== Switch Tests ===');
let x: Number = Number(2);
switch (x) {
case Number(1):
    console.log('x is 1');
    break;
case Number(2):
    console.log('x is 2');
    break;
case Number(3):
    console.log('x is 3');
    break;
default:
    console.log('x is unknown');
}

// do-while 测试
console.log('=== Do-While Tests ===');
let count = 0;
do {
    console.log('count:', count);
    count = count + Number(1);
} while (count < Number(3));

// try-catch 测试
console.log('=== Try-Catch Tests ===');
try {
    console.log('Trying...');
    throw Error('Something went wrong!');
} catch (e) {
    console.log('Caught error:', e);
}

// try-catch-finally 测试
console.log('=== Try-Catch-Finally Tests ===');
try {
    console.log('Trying...');
} catch (e) {
    console.log('Caught error:', e);
} finally {
    console.log('Finally block executed');
}
