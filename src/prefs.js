'use strict';

const { Adw, Gdk, GLib, Gtk, GObject, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const Me = ExtensionUtils.getCurrentExtension();
const { Prefs } = Me.imports.conveniences.settings;
const { Keys } = Me.imports.conveniences.keys;

const Preferences = new Prefs(Keys);

const { General } = Me.imports.preferences.general;
const { Panel } = Me.imports.preferences.panel;
const { Overview } = Me.imports.preferences.overview;
const { Dash } = Me.imports.preferences.dash;
const { Applications } = Me.imports.preferences.applications;
const { ColorEffect } = Me.imports.preferences.color_effect;
const { Other } = Me.imports.preferences.other;


function init() {
    // load the icon theme
    let iconPath = Me.dir.get_child("icons").get_path();
    let iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
    iconTheme.add_search_path(iconPath);
}

function fillPreferencesWindow(window) {
    window.add(new General);
    window.add(new Panel);
    window.add(new Overview);
    window.add(new Dash);
    window.add(new Applications);
    window.add(new Other);
    window.add(new ColorEffect);

    window.search_enabled = true;
    window.set_default_size(680, 450);
}
