// 测试异步操作

// Promise 基本使用
const promise = new Promise<string>((resolve, reject) => {
    setTimeout(() => {
        resolve("Promise resolved");
    }, 100);
});

promise.then((result) => {
    console.log("Promise result:", result);
}).catch((error) => {
    console.error("Promise error:", error);
});

// Promise 链式调用
function fetchData(): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve("Data fetched");
        }, 100);
    });
}

function processData(data: string): Promise<string> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`Processed: ${data}`);
        }, 100);
    });
}

fetchData()
    .then(processData)
    .then((result) => {
        console.log("Chained result:", result);
    });

// async/await
async function asyncFunction() {
    try {
        const data = await fetchData();
        const processed = await processData(data);
        console.log("Async/await result:", processed);
        return processed;
    } catch (error) {
        console.error("Async error:", error);
        throw error;
    }
}

asyncFunction();

// Promise.all
const promise1 = Promise.resolve(1);
const promise2 = Promise.resolve(2);
const promise3 = Promise.resolve(3);

Promise.all([promise1, promise2, promise3])
    .then((results) => {
        console.log("Promise.all results:", results);
    });

// Promise.race
const slowPromise = new Promise((resolve) => {
    setTimeout(() => resolve("Slow"), 200);
});

const fastPromise = new Promise((resolve) => {
    setTimeout(() => resolve("Fast"), 100);
});

Promise.race([slowPromise, fastPromise])
    .then((result) => {
        console.log("Promise.race result:", result);
    });

// 异步错误处理
function fetchWithError(): Promise<string> {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error("Fetch failed"));
        }, 100);
    });
}

fetchWithError()
    .then((result) => {
        console.log("This won't run");
    })
    .catch((error) => {
        console.error("Caught error:", error.message);
    });

// 异步函数中的错误处理
async function asyncWithError() {
    try {
        await fetchWithError();
    } catch (error) {
        console.error("Async caught error:", (error as Error).message);
    }
}

asyncWithError();
