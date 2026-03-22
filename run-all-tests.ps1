# 批量运行所有测试用例的 PowerShell 脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "开始运行所有测试用例" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$testFiles = @(
    "test/ts/basic.ts",
    "test/ts/types.ts",
    "test/ts/arrays.ts",
    "test/ts/objects.ts",
    "test/ts/functions.ts",
    "test/ts/classes.ts",
    "test/ts/strings.ts",
    "test/ts/control-flow.ts",
    "test/ts/enum.ts",
    "test/ts/interface.ts",
    "test/ts/generics.ts",
    "test/ts/async.ts",
    "test/ts/promise-test.ts",
    "test/ts/async-await-test.ts",
    "test/ts/destructuring-test.ts",
    "test/ts/for-of-for-in-test.ts",
    "test/ts/bool-null-undefined-test.ts",
    "test/ts/number-string-test.ts",
    "test/ts/union-type-test.ts",
    "test/ts/union-type-simple-test.ts",
    "test/ts/type-guards-test.ts",
    "test/ts/type-narrowing-test.ts",
    "test/ts/optional-chain-test.ts",
    "test/ts/void-test.ts"
)

$passed = 0
$failed = 0
$total = $testFiles.Count

foreach ($testFile in $testFiles) {
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host "运行测试：$testFile" -ForegroundColor Green
    
    $result = npm run ts-swift $testFile 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 通过" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "✗ 失败" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "测试总结" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "总计：$total" -ForegroundColor White
Write-Host "通过：$passed" -ForegroundColor Green
Write-Host "失败：$failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 所有测试通过！" -ForegroundColor Green
} else {
    Write-Host "⚠️  有 $failed 个测试失败" -ForegroundColor Yellow
}
