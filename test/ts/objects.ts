// 测试对象索引

// 创建对象（使用 Object 类型注解）
const obj = { name: "John", age: 30, city: "New York" };
console.log("Name:", Object.keys(obj));
// 使用点号访问属性
console.log("Name:", obj.name);
console.log("Age:", obj.age);
console.log("City:", obj.city);

// 使用字符串索引
console.log("Name via index:", obj["name"]);
console.log("Age via index:", obj["age"]);

// 嵌套对象
const nested = {
    person: { 
        name: "Alice", 
        age: 25 
    } 
};
// 嵌套访问 - 直接获取嵌套对象（返回 Any）
console.log("Nested person:", nested["person"]);

// 对象字面量
const literal = { a: 1, b: 2, c: 3 };
console.log("Literal a:", literal.a);
console.log("Literal b:", literal.b);
console.log("Literal c:", literal.c);
