
// 导入特定导出
import { PI, greet, Calculator } from './exports';
import defaultExport from './exports'; // 导入默认导出


// 使用导入的内容
console.log("import-PI:", PI);
console.log("import-Greeting:", greet("World"));

const calc = new Calculator();
console.log("import-Add:", calc.add(1, 2));
defaultExport()
