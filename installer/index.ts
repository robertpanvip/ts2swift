// lib/installer.ts
import { exec } from 'child_process';

function runCommand(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const p = exec(cmd, { windowsHide: true });

        p.stdout?.on('data', (data: string | Buffer) => process.stdout.write(data));
        p.stderr?.on('data', (data: string | Buffer) => process.stderr.write(data));

        p.on('close', (code: number) => {
            code === 0 ? resolve() : reject(new Error(`Command failed with code ${code}`));
        });
    });
}

export default async function install(): Promise<void> {
    try {
        console.log("安装 Visual Studio + SDK...");
        await runCommand(`winget install --id Microsoft.VisualStudio.2022.Community --exact --force --custom "--add Microsoft.VisualStudio.Component.Windows11SDK.22621 --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.VC.Tools.ARM64" --source winget`);

        console.log("安装 Swift Toolchain...");
        await runCommand(`winget install --id Swift.Toolchain -e --source winget`);

        console.log("配置 PATH...");
        console.log("请确保 C:\\Program Files\\Swift\\bin 已经加入 PATH 或者重启终端");

        console.log("安装完成！");
        await runCommand('swift --version');
        await runCommand('swiftc --version');
    } catch (err) {
        console.error("安装失败:", err);
    }
}

await install();