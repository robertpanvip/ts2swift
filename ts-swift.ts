import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';

// __dirname 在 ESM 里需要自己计算
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
    console.error('请指定 TypeScript 文件路径');
    console.error('用法：npx ts-swift ./test/ts/file1.ts ./test/ts/file2.ts ...');
    process.exit(1);
}

// 编译所有 TypeScript 文件
const compileResult = spawnSync('npx', ['esno', './src/main.ts', ...args], {
    stdio: 'inherit',
    cwd: process.cwd()
});

if (compileResult.status !== 0) {
    process.exit(compileResult.status);
}

// 使用第一个文件名作为输出的 Swift 文件名
const firstTsFile = args[0];
let tsFileName = path.basename(firstTsFile, '.ts');
// Swift 文件名不能包含 -，需要替换为 _
tsFileName = tsFileName.replace(/-/g, '_');

// 计算对应的 Swift 文件路径
const swiftFilePath = path.join(__dirname, 'test', 'build', 'Sources', 'Build', `${tsFileName}.swift`);

// 检查 Swift 文件是否存在
if (!fs.existsSync(swiftFilePath)) {
    console.error(`对应的 Swift 文件不存在：${swiftFilePath}`);
    console.error('请先运行 npm test 编译 TypeScript 文件');
    process.exit(1);
}

// 运行 Swift 编译和执行
const buildDir = path.join(__dirname, 'test', 'build');
const runResult = spawnSync('swift', ['run'], { stdio: 'inherit', cwd: buildDir });

process.exit(runResult.status);
