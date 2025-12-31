use tauri::App;
#[cfg(target_os = "windows")]
use tauri::Manager;
use crate::tray;
use crate::window;

pub fn setup_app(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let app_handle = app.handle();
    
    // 设置窗口大小和最小尺寸
    if let Some(window) = app_handle.get_webview_window("main") {
        use tauri::LogicalSize;
        
        // 设置最小尺寸
        let _ = window.set_min_size(Some(LogicalSize::new(1120.0, 700.0)));
        
        // 设置初始尺寸（如果当前尺寸小于最小尺寸）
        if let Ok(size) = window.inner_size() {
            let logical_size = size.to_logical::<f64>(window.scale_factor().unwrap_or(1.0));
            if logical_size.width < 1120.0 || logical_size.height < 700.0 {
                let _ = window.set_size(LogicalSize::new(1120.0, 700.0));
            }
        }
    }
    
    // 在 Windows 上明确禁用窗口装饰
    #[cfg(target_os = "windows")]
    {
        if let Some(window) = app_handle.get_webview_window("main") {
            let _ = window.set_decorations(false);
        }
    }
    
    // 设置托盘
    tray::setup_tray(&app_handle)?;
    
    // 设置窗口事件监听器
    window::setup_window_events(&app_handle)?;
    
    Ok(())
}
