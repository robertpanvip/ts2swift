// 测试null和undefined的转换
let nullValue: null = null;
let undefinedValue: undefined = undefined;

console.log('nullValue:', nullValue);
console.log('undefinedValue:', undefinedValue);

// 测试函数返回null和undefined
function returnNull(): null {
    return null;
}

function returnUndefined(): undefined {
    return undefined;
}

console.log('returnNull():', returnNull());
console.log('returnUndefined():', returnUndefined());
