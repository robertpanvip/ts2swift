// 数组方法简化测试
var arr: number[] = [1, 2, 3, 4, 5];

// 不修改原数组的方法
const mapped = arr.map(x => x * 2);
console.log('mapped length:', mapped.length);

const filtered = arr.filter(x => x > 2);
console.log('filtered length:', filtered.length);

const reversed = arr.reverse();
console.log('reversed length:', reversed.length);

const sorted = arr.sort();
console.log('sorted length:', sorted.length);

const sliced = arr.slice(1, 3);
console.log('sliced length:', sliced.length);

const concated = arr.concat([10, 20]);
console.log('concated length:', concated.length);

const found = arr.find(x => x > 3);
console.log('found:', found);

const foundIndex = arr.findIndex(x => x > 3);
console.log('foundIndex:', foundIndex);

const includes = arr.includes(3);
console.log('includes:', includes);

const every = arr.every(x => x > 0);
console.log('every:', every);

const some = arr.some(x => x > 4);
console.log('some:', some);

// 修改原数组的方法（使用 var）
var arr2: number[] = [1, 2, 3];
arr2.push(4);
console.log('after push:', arr2.length);

arr2.pop();
console.log('after pop:', arr2.length);

arr2.unshift(0);
console.log('after unshift:', arr2.length);

arr2.shift();
console.log('after shift:', arr2.length);

// forEach
var forEachResult: number[] = [];
arr.forEach(x => {
    forEachResult.push(x);
});
console.log('forEachResult length:', forEachResult.length);
