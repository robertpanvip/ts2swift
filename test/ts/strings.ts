// 测试字符串操作 - 简化版

// 字符串字面量
const str1: string = "Hello";
const str2: string = "World";

// 字符串拼接
const concatenated = str1 + " " + str2;
console.log("Concatenated:", concatenated);

// 字符串长度（使用扩展方法）
console.log("Length of str1:", str1.length);

// 字符串比较
const isEqual = str1 === str2;
console.log("Are equal:", isEqual);

const notEqual = str1 !== str2;
console.log("Are not equal:", notEqual);

// 复杂字符串
const sentence = "The quick brown fox jumps over the lazy dog";
console.log("Sentence length:", sentence.length);

// 空字符串
const empty = "";
console.log("Empty string length:", empty.length);

// 带空格的字符串
const withSpaces = "  hello world  ";
console.log("With spaces length:", withSpaces.length);
const es6Str = `es6Str${withSpaces}`;
console.log("es6Str:", es6Str);
