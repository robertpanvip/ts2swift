/// Promise 状态
public enum PromiseState {
    case pending
    case fulfilled
    case rejected
}

/// 模拟 TypeScript 的联合类型 A | B
public enum Either<A, B> {
    case left(A)
    case right(B)
}

/// Promise 类 - 严格模拟 TypeScript 的 Promise
public class Promise<T> {
    public private(set) var state: PromiseState = .pending
    private var value: T?
    private var error: Any?
    
    private var onFulfilledCallbacks: [(T) -> Void] = []
    private var onRejectedCallbacks: [(Any) -> Void] = []
    
    /// 初始化 Promise
    /// - Parameter executor: 执行器函数，接收 resolve 和 reject 两个参数
    public init(_ executor: (@escaping (T) -> Void, @escaping (Any) -> Void) -> Void) {
        executor(resolve, reject)
    }
    
    /// 解析 Promise - 内部方法
    private func resolve(_ value: T) {
        guard state == .pending else { return }
        
        self.state = .fulfilled
        self.value = value
        
        // 将所有回调添加到微任务队列
        let callbacks = onFulfilledCallbacks
        onFulfilledCallbacks.removeAll()
        
        for callback in callbacks {
            queueMicrotask {
                callback(value)
            }
        }
    }
    
    /// 拒绝 Promise - 内部方法
    private func reject(_ reason: Any) {
        guard state == .pending else { return }
        
        self.state = .rejected
        self.error = reason
        
        // 将所有回调添加到微任务队列
        let callbacks = onRejectedCallbacks
        onRejectedCallbacks.removeAll()
        
        for callback in callbacks {
            queueMicrotask {
                callback(reason)
            }
        }
    }
    
    /// then 方法 - 简单版本，只处理成功情况
    public func then(
        onFulfilled: @escaping (T) -> Any
    ) -> Promise<Any> {
        return Promise<Any> { resolve, reject in
            if self.state == .fulfilled {
                queueMicrotask {
                    let result = onFulfilled(self.value!)
                    resolve(result)
                }
            } else if self.state == .rejected {
                reject(self.error!)
            } else {
                self.onFulfilledCallbacks.append { value in
                    let result = onFulfilled(value)
                    resolve(result)
                }
                self.onRejectedCallbacks.append { error in
                    reject(error)
                }
            }
        }
    }
    
    /// then 方法 - 带错误处理
    public func then(
        onFulfilled: @escaping (T) -> Any,
        onRejected: @escaping (Any) -> Any
    ) -> Promise<Any> {
        return Promise<Any> { resolve, reject in
            if self.state == .fulfilled {
                queueMicrotask {
                    let result = onFulfilled(self.value!)
                    resolve(result)
                }
            } else if self.state == .rejected {
                queueMicrotask {
                    let result = onRejected(self.error!)
                    resolve(result)
                }
            } else {
                self.onFulfilledCallbacks.append { value in
                    let result = onFulfilled(value)
                    resolve(result)
                }
                self.onRejectedCallbacks.append { error in
                    let result = onRejected(error)
                    resolve(result)
                }
            }
        }
    }
    
    /// catch 方法 - 简化版本，接受普通函数
    public func `catch`(_ onRejected: @escaping (Any) -> Void) -> Promise<T> {
        return Promise<T> { resolve, reject in
            self.then(
                onFulfilled: { value in
                    resolve(value)
                    return ()
                },
                onRejected: { error in
                    onRejected(error)
                    reject(error)
                    return ()
                }
            )
        }
    }
    
    /// catchVoid 方法 - 别名
    public func catchVoid(_ onRejected: @escaping (Any) -> Void) -> Promise<T> {
        return `catch`(onRejected)
    }
    
    /// finally 方法
    public func `finally`(_ onFinally: @escaping () -> Void) -> Promise<T> {
        return Promise<T> { resolve, reject in
            self.then(
                onFulfilled: { value in
                    onFinally()
                    resolve(value)
                    return ()
                },
                onRejected: { error in
                    onFinally()
                    reject(error)
                    return ()
                }
            )
        }
    }
}

// MARK: - Promise 静态方法

extension Promise {
    /// resolve() -> Promise<void> - 使用 resolved 避免重载冲突
    public static func resolved() -> Promise<Void> {
        let promise = Promise<Void> { _, _ in }
        promise.state = .fulfilled
        promise.value = ()
        return promise
    }
    
    /// resolve<T>(value: T) -> Promise<T>
    public static func resolve<U>(_ value: U) -> Promise<U> {
        return Promise<U> { resolve, _ in
            resolve(value)
        }
    }
    
    /// resolve<T>(value: Promise<T>) -> Promise<T>
    public static func resolve<U>(_ promise: Promise<U>) -> Promise<U> {
        return promise
    }
    
    /// reject<T>(reason?: any) -> Promise<T>
    public static func reject<U>(_ reason: Any = ()) -> Promise<U> {
        return Promise<U> { _, reject in
            reject(reason)
        }
    }
    
    /// all<T extends readonly unknown[]>(values: T) -> Promise<{ -readonly [P in keyof T]: Awaited<T[P]>; }>
    public static func all<U>(_ promises: [Promise<U>]) -> Promise<[U]> {
        return Promise<[U]> { resolve, reject in
            guard !promises.isEmpty else {
                resolve([])
                return
            }
            
            var results: [U?] = Array(repeating: nil, count: promises.count)
            var completedCount = 0
            
            for (index, promise) in promises.enumerated() {
                promise.then(
                    onFulfilled: { value in
                        results[index] = value
                        completedCount += 1
                        
                        if completedCount == promises.count {
                            resolve(results.compactMap { $0 })
                        }
                        return ()
                    },
                    onRejected: { error in
                        reject(error)
                        return ()
                    }
                )
            }
        }
    }
    
    /// race<T extends readonly unknown[]>(values: T) -> Promise<Awaited<T[number]>>
    public static func race<U>(_ promises: [Promise<U>]) -> Promise<U> {
        return Promise<U> { resolve, reject in
            for promise in promises {
                promise.then(
                    onFulfilled: resolve,
                    onRejected: reject
                )
            }
        }
    }
}
