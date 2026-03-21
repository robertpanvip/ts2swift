// 测试复杂类型 - 严格版本

// 联合类型
type NumberOrString = number | string;

function processValue(value: NumberOrString): string {
    if (typeof value === "string") {
        return value.toUpperCase();
    } else {
        return String(value * 2);
    }
}

console.log("Process number:", processValue(123));
console.log("Process string:", processValue("hello"));

// 类型守卫
function isString(value: unknown): value is string {
    return typeof value === "string";
}

function getLength(value: unknown): number {
    if (isString(value)) {
        return value.length;
    }
    return 0;
}

console.log("Length of string:", getLength("hello"));

// 交叉类型
interface Identifiable {
    id: number;
}

interface Named {
    name: string;
}

type Person = Identifiable & Named;

const person: Person = {
    id: 1,
    name: "John"
};

console.log("Person:", person);

// 类型字面量
type Direction = "north" | "south" | "east" | "west";

function move(direction: Direction): string {
    return `Moving ${direction}`;
}

console.log("Move:", move("north"));

// 映射类型
type Readonly<T> = {
    readonly [P in keyof T]: T[P];
};

type ReadonlyPerson = Readonly<Person>;

// 条件类型
type NonNullable<T> = T extends null | undefined ? never : T;

type StringOrNumber = string | number | null;
type RequiredString = NonNullable<StringOrNumber>;

// 递归类型
type TreeNode = {
    value: number;
    left?: TreeNode;
    right?: TreeNode;
};

const tree: TreeNode = {
    value: 1,
    left: {
        value: 2,
        left: { value: 4 },
        right: { value: 5 }
    },
    right: {
        value: 3
    }
};

console.log("Tree value:", tree.value);
console.log("Left child:", tree.left?.value);
