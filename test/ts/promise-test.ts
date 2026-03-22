// 测试 Promise 和微任务队列

// 测试 1: 基本 Promise
console.log('Test 1: Basic Promise');
const promise1 = new Promise<string>((resolve, reject) => {
    resolve('Hello from Promise!');
});

promise1.then((value) => {
    console.log('Promise 1 resolved:', value);
});

// 测试 2: Promise 链式调用
console.log('Test 2: Promise Chain');
const promise2 = Promise.resolve(1)
    .then((value) => {
        console.log('Step 1:', value);
        return value + 1;
    })
    .then((value) => {
        console.log('Step 2:', value);
        return value * 2;
    })
    .then((value) => {
        console.log('Step 3:', value);
        return `Result: ${value}`;
    })
    .then((value) => {
        console.log('Final:', value);
    });

// 测试 3: Promise 错误处理
console.log('Test 3: Promise Error Handling');
const promise3 = Promise.reject('Something went wrong')
    .catchVoid((error) => {
        console.log('Caught error:', error);
    });

// 测试 4: Promise.all
console.log('Test 4: Promise.all');
const promise4 = Promise.all([
    Promise.resolve(1),
    Promise.resolve(2),
    Promise.resolve(3)
]).then((values) => {
    console.log('Promise.all result:', values);
});

// 测试 5: Promise.race
console.log('Test 5: Promise.race');
const promise5 = Promise.race([
    new Promise<string>((resolve) => {
        setTimeout(() => resolve('Slow'), 100);
    }),
    Promise.resolve('Fast')
]).then((value) => {
    console.log('Promise.race result:', value);
});

// 测试 6: queueMicrotask
console.log('Test 6: queueMicrotask');
queueMicrotask(() => {
    console.log('Microtask 1 executed');
});

queueMicrotask(() => {
    console.log('Microtask 2 executed');
});

console.log('Synchronous code finished');

// 测试 7: setTimeout
console.log('Test 7: setTimeout');
setTimeout(() => {
    console.log('Timeout executed');
}, 50);

console.log('All tests started');
