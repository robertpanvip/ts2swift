// 类型守卫测试用例
// 测试 typeof、instanceof 类型守卫

// ============================================
// 场景 1: typeof 类型守卫
// ============================================

function processValue(value: number | string) {
    // TypeScript 会根据 typeof 收窄类型
    if (typeof value === "number") {
        // 在这里 value 是 number 类型
        console.log("Number value:", value);
    } else if (typeof value === "string") {
        // 在这里 value 是 string 类型
        console.log("String value:", value);
    }
}

processValue(123);
processValue("hello");

// ============================================
// 场景 2: instanceof 类型守卫
// ============================================

class MyClass {
    name: string = "MyClass";
}

function checkInstance(obj: MyClass | string) {
    if (obj instanceof MyClass) {
        // 在这里 obj 是 MyClass 类型
        console.log("Is MyClass");
    } else {
        // 在这里 obj 是 string 类型
        console.log("Is string");
    }
}

checkInstance(new MyClass());
checkInstance("test");

// ============================================
// 场景 3: 联合类型的 typeof 检查
// ============================================

function checkType(value: number | string | boolean) {
    if (typeof value === "number") {
        console.log("It's a number:", value);
    } else if (typeof value === "string") {
        console.log("It's a string:", value);
    } else if (typeof value === "boolean") {
        console.log("It's a boolean:", value);
    }
}

checkType(42);
checkType("text");
checkType(true);

// ============================================
// 场景 4: 可选链 + typeof
// ============================================

interface Data {
    value?: number | string;
}

const data: Data = { value: 100 };

if (data.value != nil && typeof data.value === "number") {
    console.log("Value is number:", data.value);
}
