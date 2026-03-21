// Timer 工具类 - 模拟 JavaScript 的 setTimeout 和 setInterval
import Foundation

public class Timer {
    private var timer: DispatchSourceTimer?
    private var isCancelled = false
    
    // setTimeout - 延迟执行一次
    public static func setTimeout(_ callback: @escaping () -> Void, _ delay: Int) -> Timer {
        let timer = Timer()
        
        timer.timer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
        timer.timer?.schedule(deadline: .now() + .milliseconds(delay), repeating: .never)
        timer.timer?.setEventHandler {
            if !timer.isCancelled {
                callback()
            }
        }
        timer.timer?.resume()
        
        return timer
    }
    
    // setInterval - 重复执行
    public static func setInterval(_ callback: @escaping () -> Void, _ interval: Int) -> Timer {
        let timer = Timer()
        
        timer.timer = DispatchSource.makeTimerSource(queue: DispatchQueue.main)
        timer.timer?.schedule(deadline: .now() + .milliseconds(interval), repeating: .milliseconds(interval))
        timer.timer?.setEventHandler {
            if !timer.isCancelled {
                callback()
            }
        }
        timer.timer?.resume()
        
        return timer
    }
    
    // clearTimeout - 取消定时器
    public static func clearTimeout(_ timer: Timer?) {
        timer?.cancel()
    }
    
    // clearInterval - 取消定时器
    public static func clearInterval(_ timer: Timer?) {
        timer?.cancel()
    }
    
    // cancel - 取消定时器
    public func cancel() {
        isCancelled = true
        timer?.cancel()
        timer = nil
    }
}

// 全局函数 - 模拟 JavaScript 的全局 setTimeout/setInterval
public func setTimeout(_ callback: @escaping () -> Void, _ delay: Int) -> Timer {
    return Timer.setTimeout(callback, delay)
}

public func setInterval(_ callback: @escaping () -> Void, _ interval: Int) -> Timer {
    return Timer.setInterval(callback, interval)
}

public func clearTimeout(_ timer: Timer?) {
    Timer.clearTimeout(timer)
}

public func clearInterval(_ timer: Timer?) {
    Timer.clearInterval(timer)
}
