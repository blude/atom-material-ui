'use babel';
'use strict';

import fs from 'fs';
import configSchema from './config-schema';
import amuSettings from './amu-settings';
import amuBindings from './amu-bindings';

var removeBlendingEl = function () {
    var treeView = document.querySelector('.tree-view:not(.nuclide-file-tree)'),
        blendingEl = treeView.querySelector('.tabBlender');

    if (blendingEl) {
        treeView.removeChild(blendingEl);
    }
};

export default {
    config: configSchema,

    getContrast(color) {
        // Finds a contrasting text color
        var r = parseInt(color.substr(1, 2), 16),
            g = parseInt(color.substr(3, 2), 16),
            b = parseInt(color.substr(5, 2), 16),
            yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

        if (yiq >= 220) {
            return `desaturate(darken(${color}, 40%), 25%)`;
        }
        if (yiq >= 190 && yiq < 220) {
            return `desaturate(darken(${color}, 35%), 20%)`;
        }
        if (yiq >= 130 && yiq < 190) {
            return `desaturate(darken(${color}, 25%), 20%)`;
        }
        if (yiq < 130) {
            return `lighten(${color}, 60%)`;
        }
    },

    toggleClass(boolean, className) {
        var root = document.documentElement;

        if (boolean) {
            root.classList.add(className);
        } else {
            root.classList.remove(className);
        }
    },

    writeConfig(options) {
        var accentColor = atom.config.get('atom-material-ui.colors.accentColor').toHexString(),
            baseColor = atom.config.get('atom-material-ui.colors.abaseColor').toHexString(),
            accentTextColor = this.getContrast(baseColor),
            fontSize = atom.config.get('atom-material-ui.fonts.fontSize');

        var config = `@accent-color: ${accentColor};\n` +
                     `@accent-text-color: ${accentTextColor};\n` +
                     `@base-color: ${baseColor};\n` +
                     `:root {\n` +
                     `   font-size: ${fontSize}px;\n` +
                     `}\n`;

        fs.writeFile(`${__dirname}/../styles/custom.less`, config, 'utf8', () => {
            if (!options || !options.noReload) {
                var themePack = atom.packages.getLoadedPackage('atom-material-ui');

                themePack.deactivate();
                setImmediate(() => themePack.activate());
            }
            if (options && options.callback && typeof options.callback === 'function') {
                options.callback();
            }
        });
    },

    toggleBlendTreeView(bool) {
        setImmediate(() => {
            var treeView = document.querySelector('.tree-view'),
                blendingEl = document.createElement('li');

            blendingEl.classList.add('tabBlender');
            blendingEl.innerHTML = 'Projects';

            if (treeView && bool) {
                if (treeView.querySelector('.tabBlender')) {
                    removeBlendingEl();
                }
                treeView.insertBefore(blendingEl, treeView.firstChild);
            } else if (treeView && !bool) {
                removeBlendingEl();
            } else if (!treeView && bool) {
                if (atom.packages.getActivePackage('tree-view')) {
                    return setTimeout(() => {
                        this.toggleBlendTreeView(bool);
                        setImmediate(() => amuBindings.apply());
                    }, 2000);
                }
            }
        });
    },

    activate() {
        amuSettings.apply();
        setImmediate(() => amuBindings.apply());
        this.writeConfig({ noReload: true });
    },

    deactivate() {
        amuBindings.remove();
        this.toggleBlendTreeView(false);
    }
};
