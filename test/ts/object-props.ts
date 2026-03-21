// 测试对象字面量带变量的情况

let x = 42;
let obj = { value: x * 2, name: "test", flag: true };

console.log("Value:", obj.value);
console.log("Name:", obj.name);
console.log("Flag:", obj.flag);

// 使用索引访问
console.log("Value via index:", obj["value"]);
console.log("Name via index:", obj["name"]);
