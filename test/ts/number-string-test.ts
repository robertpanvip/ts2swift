// Number 和 String 扩展测试

// Number 测试
const num: number = 123.456;

console.log('num:', num);
console.log('num.toFixed(2):', num.toFixed(2));
console.log('num.toExponential():', num.toExponential());
console.log('num.toPrecision(3):', num.toPrecision(3));
console.log('num.isNaN():', num.isNaN());
console.log('num.isFinite():', num.isFinite());
console.log('num.isInteger():', num.isInteger());
console.log('num.isSafeInteger():', num.isSafeInteger());

// Number 静态方法
console.log('Number.isNaN(NaN):', Number.isNaN(NaN));
console.log('Number.isFinite(100):', Number.isFinite(100));
console.log('Number.isInteger(100):', Number.isInteger(100));
console.log('Number.MAX_VALUE:', Number.MAX_VALUE.toString());
console.log('Number.MIN_VALUE:', Number.MIN_VALUE.toString());
console.log('Number.EPSILON:', Number.EPSILON.toString());

// String 测试
const str: string = 'Hello, World!';

console.log('str.length:', str.length);
console.log('str.charAt(0):', str.charAt(0));
console.log('str.charCodeAt(0):', str.charCodeAt(0));
console.log('str.concat(" Test"):', str.concat(' Test'));
console.log('str.endsWith("World!"):', str.endsWith('World!'));
console.log('str.includes("World"):', str.includes('World'));
console.log('str.indexOf("World"):', str.indexOf('World'));
console.log('str.lastIndexOf("o"):', str.lastIndexOf('o'));
console.log('str.repeat(2):', str.repeat(2));
console.log('str.slice(0, 5):', str.slice(0, 5));
console.log('str.startsWith("Hello"):', str.startsWith('Hello'));
console.log('str.substring(0, 5):', str.substr(0, 5));
console.log('str.padStart(20, "-"):', str.padStart(20, '-'));
console.log('str.padEnd(20, "-"):', str.padEnd(20, '-'));
console.log('str.trim():', str.trim());
console.log('str.toUpperCase():', str.toUpperCase());
console.log('str.toLowerCase():', str.toLowerCase());

// String split
const parts = str.split(',');
console.log('str.split(",") length:', parts.length);

// String replace
const replaced = str.replace('World', 'Swift');
console.log('str.replace("World", "Swift"):', replaced);
