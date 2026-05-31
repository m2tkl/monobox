use std::sync::Mutex;

use tauri::{App, AppHandle, Emitter, Manager};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

use crate::config::AppConfig;

pub const FOCUS_APP_EVENT: &str = "monobox:shortcut:global:focus-app";
pub const NEW_MEMO_EVENT: &str = "monobox:shortcut:global:new-memo";

#[derive(Clone)]
pub struct GlobalShortcutSettings {
    pub focus_app_shortcut: String,
    pub new_memo_shortcut: String,
}

pub struct GlobalShortcutState {
    settings: Mutex<GlobalShortcutSettings>,
}

impl GlobalShortcutState {
    pub fn from_config(config: &AppConfig) -> Self {
        Self {
            settings: Mutex::new(GlobalShortcutSettings {
                focus_app_shortcut: config.focus_app_shortcut.clone(),
                new_memo_shortcut: config.new_memo_shortcut.clone(),
            }),
        }
    }

    fn get_settings(&self) -> GlobalShortcutSettings {
        self.settings
            .lock()
            .expect("global shortcut state poisoned")
            .clone()
    }

    fn set_settings(&self, settings: GlobalShortcutSettings) {
        *self
            .settings
            .lock()
            .expect("global shortcut state poisoned") = settings;
    }
}

pub fn register_global_shortcuts(app: &mut App) -> tauri::Result<()> {
    app.handle().plugin(
        tauri_plugin_global_shortcut::Builder::new()
            .with_handler(move |app, shortcut, event| {
                if event.state() != ShortcutState::Pressed {
                    return;
                }

                let settings = app.state::<GlobalShortcutState>().get_settings();
                if shortcut_matches(shortcut, &settings.focus_app_shortcut) {
                    focus_main_window(app);
                    if let Err(error) = app.emit(FOCUS_APP_EVENT, ()) {
                        eprintln!("Failed to emit focus shortcut event: {}", error);
                    }
                    return;
                }

                if shortcut_matches(shortcut, &settings.new_memo_shortcut) {
                    focus_main_window(app);
                    if let Err(error) = app.emit(NEW_MEMO_EVENT, ()) {
                        eprintln!("Failed to emit new memo shortcut event: {}", error);
                    }
                }
            })
            .build(),
    )?;

    let settings = app.state::<GlobalShortcutState>().get_settings();
    if let Err(error) = app
        .global_shortcut()
        .register(settings.focus_app_shortcut.as_str())
    {
        eprintln!("Failed to register focus shortcut: {}", error);
    }
    if let Err(error) = app
        .global_shortcut()
        .register(settings.new_memo_shortcut.as_str())
    {
        eprintln!("Failed to register new memo shortcut: {}", error);
    }

    Ok(())
}

pub fn update_global_shortcuts(
    app: &AppHandle,
    previous: &GlobalShortcutSettings,
    next: GlobalShortcutSettings,
) -> Result<(), String> {
    let focus_app_shortcut = parse_shortcut(&next.focus_app_shortcut)?;
    let new_memo_shortcut = parse_shortcut(&next.new_memo_shortcut)?;

    if focus_app_shortcut == new_memo_shortcut {
        return Err("DUPLICATE_SHORTCUT:Shortcuts must be different".to_string());
    }

    let _ = app
        .global_shortcut()
        .unregister(previous.focus_app_shortcut.as_str());
    let _ = app
        .global_shortcut()
        .unregister(previous.new_memo_shortcut.as_str());

    if let Err(error) = app
        .global_shortcut()
        .register(next.focus_app_shortcut.as_str())
    {
        reregister_previous_shortcuts(app, previous);
        return Err(format!("FOCUS_SHORTCUT_REGISTER_FAILED:{}", error));
    }

    if let Err(error) = app
        .global_shortcut()
        .register(next.new_memo_shortcut.as_str())
    {
        let _ = app
            .global_shortcut()
            .unregister(next.focus_app_shortcut.as_str());
        reregister_previous_shortcuts(app, previous);
        return Err(format!("NEW_MEMO_SHORTCUT_REGISTER_FAILED:{}", error));
    }

    app.state::<GlobalShortcutState>().set_settings(next);

    Ok(())
}

pub fn normalize_shortcut(shortcut: &str) -> Result<String, String> {
    let normalized = shortcut.trim().replace(' ', "");
    if normalized.is_empty() {
        return Err("EMPTY_SHORTCUT:Shortcut is required".to_string());
    }
    Ok(normalized)
}

fn parse_shortcut(shortcut: &str) -> Result<Shortcut, String> {
    shortcut
        .parse()
        .map_err(|error| format!("INVALID_SHORTCUT:{}", error))
}

fn shortcut_matches(shortcut: &Shortcut, configured: &str) -> bool {
    configured
        .parse::<Shortcut>()
        .map(|configured_shortcut| shortcut == &configured_shortcut)
        .unwrap_or(false)
}

fn reregister_previous_shortcuts(app: &AppHandle, previous: &GlobalShortcutSettings) {
    let _ = app
        .global_shortcut()
        .register(previous.focus_app_shortcut.as_str());
    let _ = app
        .global_shortcut()
        .register(previous.new_memo_shortcut.as_str());
}

fn focus_main_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if let Err(error) = window.unminimize() {
            eprintln!("Failed to unminimize main window: {}", error);
        }
        if let Err(error) = window.show() {
            eprintln!("Failed to show main window: {}", error);
        }
        if let Err(error) = window.set_focus() {
            eprintln!("Failed to focus main window: {}", error);
        }
    }
}
