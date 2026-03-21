// Promise 类 - 最简化版本
public class Promise {
    public enum State {
        case pending
        case fulfilled(value: Any)
        case rejected(reason: Any)
    }
    
    private var state: State = .pending
    private var onFulfilledCallbacks: [(Any) -> Void] = []
    private var onRejectedCallbacks: [(Any) -> Void] = []
    
    // 初始化 - 执行 executor
    public init(executor: @escaping ((Any) -> Void, (Any) -> Void) -> Void) {
        executor({ value in
            self.resolve(value)
        }, { reason in
            self.reject(reason)
        })
    }
    
    // 静态方法 - Promise.resolve
    public static func resolve(_ value: Any) -> Promise {
        return Promise { resolve, _ in
            resolve(value)
        }
    }
    
    // 静态方法 - Promise.reject
    public static func reject(_ reason: Any) -> Promise {
        return Promise { _, reject in
            reject(reason)
        }
    }
    
    // 内部 resolve 方法
    private func resolve(_ value: Any) {
        guard case .pending = state else { return }
        state = .fulfilled(value: value)
        
        for callback in onFulfilledCallbacks {
            callback(value)
        }
        onFulfilledCallbacks = []
    }
    
    // 内部 reject 方法
    private func reject(_ reason: Any) {
        guard case .pending = state else { return }
        state = .rejected(reason: reason)
        
        for callback in onRejectedCallbacks {
            callback(reason)
        }
        onRejectedCallbacks = []
    }
    
    // then 方法
    public func then(_ onFulfilled: @escaping (Any) -> Void) -> Promise {
        switch state {
        case .pending:
            onFulfilledCallbacks.append(onFulfilled)
            return self
            
        case .fulfilled(let value):
            onFulfilled(value)
            return self
            
        default:
            return self
        }
    }
    
    // catch 方法
    public func `catch`(_ onRejected: @escaping (Any) -> Void) -> Promise {
        switch state {
        case .pending:
            onRejectedCallbacks.append(onRejected)
            return self
            
        case .rejected(let reason):
            onRejected(reason)
            return self
            
        default:
            return self
        }
    }
    
    // finally 方法
    public func finally(_ onFinally: @escaping () -> Void) -> Promise {
        return self.then({ _ in
            onFinally()
        }).`catch`({ _ in
            onFinally()
        })
    }
}
