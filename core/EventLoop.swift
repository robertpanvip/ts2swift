/// 微任务队列 - 用于实现事件循环中的微任务调度
public class MicroTaskQueue {
    private var queue: [() -> Void] = []
    private var isProcessing = false
    
    /// 将微任务添加到队列
    public func enqueue(_ task: @escaping () -> Void) {
        queue.append(task)
        
        // 如果当前没有在处理任务，立即开始处理
        if !isProcessing {
            processQueue()
        }
    }
    
    /// 处理队列中的所有任务
    private func processQueue() {
        guard !queue.isEmpty else { return }
        
        isProcessing = true
        
        // 复制当前队列，避免在处理过程中添加新任务导致无限循环
        let tasks = queue
        queue.removeAll()
        
        // 依次执行所有任务
        for task in tasks {
            task()
        }
        
        isProcessing = false
        
        // 如果在处理过程中又添加了新任务，继续处理
        if !queue.isEmpty {
            processQueue()
        }
    }
    
    /// 检查队列是否为空
    public var isEmpty: Bool {
        return queue.isEmpty
    }
    
    /// 获取队列长度
    public var count: Int {
        return queue.count
    }
    
    /// 清空队列
    public func clear() {
        queue.removeAll()
        isProcessing = false
    }
    
    /// 立即执行队列中的所有微任务
    public func runAll() {
        processQueue()
    }
}

/// 宏任务队列 - 用于实现 setTimeout 等宏任务
public class MacTaskQueue {
    private struct Task {
        let id: Int
        let callback: () -> Void
        let delay: TimeInterval
        let scheduledTime: Date
    }
    
    private var queue: [Task] = []
    private var nextId = 1
    
    /// 添加宏任务（延迟执行）
    public func enqueue(delay: TimeInterval, callback: @escaping () -> Void) -> Int {
        let id = nextId
        nextId += 1
        let task = Task(id: id, callback: callback, delay: delay, scheduledTime: Date())
        queue.append(task)
        return id
    }
    
    /// 清除宏任务
    public func cancel(id: Int) {
        queue.removeAll { $0.id == id }
    }
    
    /// 获取下一个要执行的宏任务（如果到期）
    public func poll() -> (() -> Void)? {
        let now = Date()
        
        // 查找第一个到期的任务
        if let index = queue.firstIndex(where: { task in
            let elapsed = now.timeIntervalSince(task.scheduledTime)
            return elapsed >= task.delay
        }) {
            let task = queue.remove(at: index)
            return task.callback
        }
        
        return nil
    }
    
    /// 获取下一个宏任务的等待时间（秒）
    public func getNextDelay() -> TimeInterval? {
        guard let firstTask = queue.min(by: { t1, t2 in
            t1.scheduledTime.addingTimeInterval(t1.delay) < t2.scheduledTime.addingTimeInterval(t2.delay)
        }) else {
            return nil
        }
        
        let nextTime = firstTask.scheduledTime.addingTimeInterval(firstTask.delay)
        let delay = nextTime.timeIntervalSince(Date())
        return max(0, delay)
    }
    
    /// 检查是否有待处理的宏任务
    public var hasPendingTasks: Bool {
        return !queue.isEmpty
    }
}

/// 事件循环 - 协调微任务和宏任务的执行
public class EventLoop {
    public static let shared = EventLoop()
    
    public let microTaskQueue = MicroTaskQueue()
    public let macroTaskQueue = MacTaskQueue()
    
    private var isRunning = false
    private var isProcessingMicroTasks = false
    
    private init() {}
    
    /// 立即执行所有微任务
    public func runMicroTasks() {
        guard !isProcessingMicroTasks else { return }
        
        isProcessingMicroTasks = true
        microTaskQueue.clear() // 清空并重新处理
        isProcessingMicroTasks = false
    }
    
    /// 运行事件循环（用于测试）
    public func run(timeout: TimeInterval = 1.0) {
        isRunning = true
        let startTime = Date()
        
        while isRunning {
            // 检查是否超时
            if Date().timeIntervalSince(startTime) > timeout {
                stop()
                break
            }
            
            // 执行所有到期的宏任务
            while let task = macroTaskQueue.poll() {
                task()
                
                // 宏任务执行后，执行所有微任务
                if !microTaskQueue.isEmpty {
                    microTaskQueue.runAll()
                }
            }
            
            // 如果没有任务，等待
            if !macroTaskQueue.hasPendingTasks && microTaskQueue.isEmpty {
                stop()
                break
            }
            
            // 短暂休眠
            if let delay = macroTaskQueue.getNextDelay() {
                Thread.sleep(forTimeInterval: min(delay, 0.01))
            } else {
                Thread.sleep(forTimeInterval: 0.01)
            }
        }
    }
    
    /// 停止事件循环
    public func stop() {
        isRunning = false
    }
    
    /// 检查事件循环是否正在运行
    public var isRunningState: Bool {
        return isRunning
    }
}

/// 全局函数：将微任务添加到队列
public func queueMicrotask(_ task: @escaping () -> Void) {
    EventLoop.shared.microTaskQueue.enqueue(task)
}

/// 全局函数：设置延迟执行的宏任务（与 TypeScript 保持一致）
public func setTimeout(_ callback: @escaping () -> Void, _ delay: TimeInterval) -> Int {
    return EventLoop.shared.macroTaskQueue.enqueue(delay: delay, callback: callback)
}

/// 全局函数：清除延迟执行的宏任务
public func clearTimeout(id: Int) {
    EventLoop.shared.macroTaskQueue.cancel(id: id)
}
