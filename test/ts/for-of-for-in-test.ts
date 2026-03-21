// for...of 和 for...in 测试

// for...of 测试
const arr: number[] = [1, 2, 3, 4, 5];

console.log('for...of test:');
for (const num of arr) {
    console.log('num:', num);
}

// for...in 测试
const obj = {
    a: 1,
    b: 2,
    c: 3
};

console.log('for...in test:');
for (const key in obj) {
    console.log('key:', key, 'value:', obj[key]);
}
