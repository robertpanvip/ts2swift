// 测试数组操作 - 简化版

// 创建数组（使用 var 以便修改）
var numbers: number[] = [1, 2, 3, 4, 5];
console.log("Array length:", numbers.length);

// 访问数组元素
console.log("First element:", numbers[0]);
console.log("Second element:", numbers[1]);
console.log("Third element:", numbers[2]);

// 修改数组元素
numbers[0] = 10;
console.log("Modified first element:", numbers[0]);

// 数组方法 - push
numbers.push(6);
console.log("After push length:", numbers.length);

// 字符串数组
var fruits: string[] = ["apple", "banana", "orange"];
console.log("Fruits length:", fruits.length);
console.log("First fruit:", fruits[0]);
console.log("Second fruit:", fruits[1]);

// 布尔数组
var flags: boolean[] = [true, false, true];
console.log("Flags length:", flags.length);
console.log("First flag:", flags[0]);
console.log("Second flag:", flags[1]);

// 空数组
var empty: number[] = [];
console.log("Empty array length:", empty.length);

// 数组字面量
var arr: number[] = [10, 20, 30];
console.log("Array literal length:", arr.length);
console.log("Element 0:", arr[0]);
console.log("Element 1:", arr[1]);
