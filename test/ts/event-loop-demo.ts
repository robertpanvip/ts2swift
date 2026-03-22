// 事件循环演示

console.log('1. 同步代码开始');

// 微任务 1
queueMicrotask(() => {
    console.log('2. 微任务 1');
});

// Promise（也是微任务）
Promise.resolve().then(() => {
    console.log('3. Promise.then');
});

// 微任务 2
queueMicrotask(() => {
    console.log('4. 微任务 2');
    
    // 嵌套微任务
    queueMicrotask(() => {
        console.log('5. 嵌套微任务');
    });
});

// 宏任务
setTimeout(() => {
    console.log('6. setTimeout (宏任务)');
    
    // 在宏任务中创建微任务
    queueMicrotask(() => {
        console.log('7. 宏任务中的微任务');
    });
}, 10);

// 另一个宏任务
setTimeout(() => {
    console.log('8. 第二个 setTimeout');
}, 20);

console.log('9. 同步代码结束');
