// async/await 测试

// 模拟异步函数
async function fetchData(id: number): Promise<string> {
    return `Data ${id}`;
}

// 使用 await 调用异步函数
async function loadData(): Promise<void> {
    console.log('Loading data...');
    const data1 = await fetchData(1);
    console.log('Data 1:', data1);
    
    const data2 = await fetchData(2);
    console.log('Data 2:', data2);
    
    console.log('All data loaded');
}

// async 箭头函数
const asyncArrow = async (value: number): Promise<number> => {
    console.log('Processing:', value);
    return value * 2;
};

// 使用 async 箭头函数
async function processValue(): Promise<void> {
    const result = await asyncArrow(42);
    console.log('Result:', result);
}

// 多个 await 并行
async function parallelFetch(): Promise<void> {
    console.log('Fetching in parallel...');
    const [data1, data2, data3] = await Promise.all([
        fetchData(1),
        fetchData(2),
        fetchData(3)
    ]);
    console.log('Parallel results:', data1, data2, data3);
}

// 启动异步操作
console.log('Starting async operations...');
loadData();
processValue();
parallelFetch();

console.log('Async operations started');
