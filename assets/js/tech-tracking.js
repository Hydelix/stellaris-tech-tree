// Add ability to track node status
var charts = {};

function init_nodestatus(area) {
    $('#tech-tree-' + area).find('.node div.node-status:not(.status-loaded)').each(function() {
        var events = $._data($( this )[0], "events");

        if(undefined === events || undefined === events.click) {
            $(this).on('click', function toggle_status() {
                // Find chart for the research
                if($(this).parent().hasClass('anomaly')) {
                    if($(this).hasClass('active')) {
                        $(this).removeClass('active');
                        $(this).parent().removeClass('active');
                    } else {
                        $(this).addClass('active');
                        $(this).parent().addClass('active');
                    }

                    event.stopPropagation();
                    return;
                }
                // Limmit activation to research directly under an activated parent
                var parent_id = $(this).parent().data('treenode').parentId;
                if(undefined === parent_id) {
                    return;
                }
                // If the parent is the root node [0], this is the first research that can be activated
                if(0 < parent_id) {
                    var parent = charts[area].tree.nodeDB.db[parent_id];

                    if(!$( '#' + parent.nodeHTMLid + ' div.node-status').hasClass('active')) {
                        return;
                    }
                }
                // Check for any other prerequisites
                var active = true;
                $(this).parent().find('span.node-status').each(function() {
                    var tech = $(this)[0].classList[1];
                    tech = $('#' + tech).find('div.node-status');
                    if(undefined !== tech && !tech.hasClass('active')) {
                        active = false;
                    }
                });
                if(!active) return;

                var id = $( this ).parent().attr('id');
                if($(this).hasClass('active')) {
                    updateResearch(area, id, false);
                } else {
                    updateResearch(area, id, true);
                }
                event.stopPropagation();
            });
            $( this ).addClass('status-loaded');
        }
    });
}

function getNodeDBNode(area, name) {
    for(const item of charts[area].tree.nodeDB.db) {
        if(item.nodeHTMLid === name) return item;
    }
    // Didn't find in the area charts - maybe it's in another one ?
    // (see Science Nexus and other Mega Structure in Engineering tree)
    for(const tree in charts) {
        if(tree === area) continue;
        for(const item of charts[tree].tree.nodeDB.db) {
            if(item.nodeHTMLid === name) return item;
        }
    }
    return null;
}

function updateResearch(area, name, active) {
    // Check if node is already set to proper state
    if($( '#' + name + ' div.node-status').hasClass('active') == active) {
        return;
    }

    // Get the nodeDB item
    var inode = getNodeDBNode(area, name);

    if(active) {
        // Update the node-status
        $('#' + name).addClass('active');
        $('#' + name).find('.node-status').addClass('active');

        if(inode == null) return;

        var myConnector = $(inode.connector).get(0);
        if(myConnector !== undefined) $(myConnector).addClass("active");

        for(const child of inode.children) {
            $(charts[area].tree.nodeDB.db[child].connector[0]).addClass(area);
        }

    } else {
        // Update the node-status
        $('#' + name).removeClass('active');
        $('#' + name).find('.node-status').removeClass('active');

        if(inode == null) return;

        // For each Children update the connector
        for(const child of inode.children) {
            var child_node = charts[area].tree.nodeDB.db[child];
            $(child_node.connector[0]).removeClass(area);
            updateResearch(area, child_node.nodeHTMLid, false);
        }

    }
}

function getInitNode(node, name) {
    for (const count in node) {
        if(name == node[count].key && undefined !== node[count].innerHTML) {
            return node[count];
        } else if(undefined !== node[count].children && 0 < node[count].children.length) {
            var childNode = getInitNode(node[count].children, name);

            if(undefined !== childNode) {
                return childNode;
            }
        }
    }
    return undefined;
}

// IndexedDB solution (Multiple research sets saved)
var offlineDB;

function initDB() {
    var request = window.indexedDB.open("researchDB");
    request.onerror = function(event) {
        alert('Unable to store more than one set of research unless permission is approved!');
        if(window.localStorage) {
            setupLocalStorage();
        }
    };
    request.onsuccess = function(event) {
        offlineDB = event.target.result;
        offlineDB.onerror = function(event) {
            // Generic error handler for all errors targeted at this database's
            // requests!
            console.error("IndexedDB error: " + event.target.errorCode);
        };
        offlineDB.onupgradeneeded = function(event) {
            offlineDB.onversionchange = function(event) {
                offlineDB.close();
            };
        };
        findLists();
    };
    request.onupgradeneeded = function(event) {
        // Create an objectStore for this database
        event.currentTarget.result.createObjectStore("TreeStore", { keyPath: "name" });
    };
}

var NEW_LIST = '__new__';

function syncResearchButtons() {
    var isNew = $('#research_selection').val() === NEW_LIST;
    $('#research_load, #research_remove').prop('disabled', isNew);
    renderPresetMenu();
}

// Custom dropdown (styled to match the site). The hidden <select id="research_selection"> holds the real value.
function renderPresetMenu() {
    if (!$('#preset_dd').length) return;
    var sel = $('#research_selection'), menu = $('#preset_menu'), cur = sel.val();
    menu.empty();
    sel.find('option').each(function (i) {
        $('<li role="option">')
            .attr({ id: 'preset_opt_' + i, 'data-value': this.value, 'aria-selected': this.value === cur ? 'true' : 'false' })
            .toggleClass('dd-new', this.value === NEW_LIST)
            .toggleClass('dd-selected', this.value === cur)
            .text(this.textContent)
            .appendTo(menu);
    });
    $('#preset_btn .dd-text').text(sel.find('option').filter(function () { return this.value === cur; }).text());
}

function setupPresetDropdown() {
    var btn = $('#preset_btn'), menu = $('#preset_menu'), sel = $('#research_selection');
    if (!btn.length || btn.data('ready')) return;
    btn.data('ready', true);
    var active = -1;
    var items = function () { return menu.children(); };
    function setActive(i, noScroll) {
        var els = items(); if (!els.length) return;
        active = (i + els.length) % els.length;
        els.removeClass('dd-active');
        var el = els.eq(active).addClass('dd-active');
        menu.attr('aria-activedescendant', el.attr('id'));
        if (!noScroll && el[0].scrollIntoView) el[0].scrollIntoView({ block: 'nearest' });
    }
    function open() {
        renderPresetMenu();
        menu.prop('hidden', false);
        btn.attr('aria-expanded', 'true');
        var i = items().index(menu.find('.dd-selected'));
        setActive(i < 0 ? 0 : i);
        menu.trigger('focus');
    }
    function close(refocus) {
        menu.prop('hidden', true);
        btn.attr('aria-expanded', 'false');
        if (refocus) btn.trigger('focus');
    }
    function choose(i) {
        var el = items().eq(i);
        if (!el.length) return;
        sel.val(el.attr('data-value')).trigger('change');
        close(true);
    }
    btn.on('click', function () { menu.prop('hidden') ? open() : close(true); });
    btn.on('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (menu.prop('hidden')) open(); }
    });
    menu.on('keydown', function (e) {
        switch (e.key) {
            case 'ArrowDown': setActive(active + 1); break;
            case 'ArrowUp': setActive(active - 1); break;
            case 'Home': setActive(0); break;
            case 'End': setActive(items().length - 1); break;
            case 'Enter': case ' ': choose(active); break;
            case 'Escape': close(true); break;
            case 'Tab': close(false); return;
            default: return;
        }
        e.preventDefault();
    });
    menu.on('mousemove', 'li', function () { setActive($(this).index(), true); });
    menu.on('click', 'li', function () { choose($(this).index()); });
    $(document).on('mousedown.presetdd', function (e) {
        if (!menu.prop('hidden') && !$(e.target).closest('#preset_dd').length) close(false);
    });
}

function addListOption(name) {
    var sel = $('#research_selection');
    var exists = sel.find('option').filter(function () { return this.value === name; }).length > 0;
    if (!exists) {
        $('<option>').val(name).text(name).insertBefore(sel.find('option').filter(function () { return this.value === NEW_LIST; }));
    }
    sel.val(name);
    syncResearchButtons();
}

function findLists() {
    var objectStore = offlineDB.transaction("TreeStore").objectStore("TreeStore");

    var lists = [];
    objectStore.openCursor().onsuccess = function(event) {
        var cursor = event.target.result;
        if (cursor) {
            lists.push(cursor.value);
            cursor.continue();
        }
        else {
            var sel = $('#research_selection').empty();
            lists.sort(function (a, b) { return a.name.localeCompare(b.name); });
            lists.forEach(function (item) { $('<option>').val(item.name).text(item.name).appendTo(sel); });
            $('<option>').val(NEW_LIST).text('Add New Preset').appendTo(sel);
            sel.val(NEW_LIST);
            syncResearchButtons();

            sel.off('change').on('change', syncResearchButtons);
            setupPresetDropdown();
            $('#research_save').off('click').on('click', function(event) {
                event.preventDefault();
                var name = sel.val();
                if (name === NEW_LIST) {
                    name = $.trim(window.prompt('Name for the new preset:', 'My preset') || '');
                    if (!name || name === NEW_LIST) return;
                    var taken = sel.find('option').filter(function () { return this.value === name; }).length > 0;
                    if (taken && !window.confirm('A preset named "' + name + '" already exists. Overwrite it?')) return;
                } else if (!window.confirm('Overwrite preset "' + name + '" with your current progress?')) {
                    return;
                }
                saveListToIndexedDB(name);
            });
            $('#research_load').off('click').on('click', function(event) {
                event.preventDefault();
                if (sel.val() !== NEW_LIST) loadListFromIndexedDB(sel.val());
            });
            $('#research_remove').off('click').on('click', function(event) {
                event.preventDefault();
                var name = sel.val();
                if (name !== NEW_LIST && window.confirm('Delete preset "' + name + '"? This cannot be undone.')) {
                    removeListFromIndexedDB(name);
                }
            });
            $('.research').removeClass('hide');
        }
    };
}

function saveListToIndexedDB(name) {
    if(offlineDB) {

        var data = [];
        research.forEach(area => {
            $('.' + area + ' div.node-status.active').parent().not(':contains(\\(Starting\\))').each(function() {
                data.push({key: $(this).attr('id'), area: area});
            });
        });

        var objectStore = offlineDB.transaction(["TreeStore"], "readwrite").objectStore("TreeStore");

        var result = objectStore.put({name: name, data: data});
        result.onsuccess = function(event) {
            if(event.target.result && name == event.target.result) {
                addListOption(name);
                alert('Preset "' + name + '" was saved.')
                return true;
            }
        };
    } else {
        initDB();
    }
}

function loadListFromIndexedDB(name) {
    if(offlineDB) {
        var objectStore = offlineDB.transaction("TreeStore").objectStore("TreeStore");

        var result = objectStore.get(name);
        result.onsuccess = function(event) {
            if(event.target.result && event.target.result.data) {
                var data = event.target.result.data;
                research.forEach(area => {
                    $('.' + area + ' div.node-status.active').parent().not(':contains(\\(Starting\\))').each(function() {
                        updateResearch(area, $(this).attr('id'), false);
                        $(this).find('div.node-status').removeClass('active');
                    });
                });
                data.forEach(item => {
                    if('anomaly' == item.area) {
                        //TODO
                        $('#' + item.key + ' .div.node-status').addClass('active');
                    }
                    else {
                        updateResearch(item.area, item.key, true);
                    }
                });
            }
            else {
                event.target.errorCode = `Preset "${name}" does not exist.`
                result.onerror(event);
            }
        };
        result.onerror = function(event) {
            alert('Unable to load preset: ' + name + '\nError: ' + event.target.errorCode);
        }
    } else {
        initDB();
    }
}

function removeListFromIndexedDB(name) {
    if(offlineDB) {
        var objectStore = offlineDB.transaction(["TreeStore"], "readwrite").objectStore("TreeStore");
        var result = objectStore.delete(name);
        result.onerror = function(event) {
            alert('Unable to delete preset: ' + name + '\nError: ' + event.target.errorCode);
        };
        result.onsuccess = function(event) {
            $('#research_selection option').filter(function () { return this.value === name; }).remove();
            $('#research_selection').val(NEW_LIST);
            syncResearchButtons();
        };
    } else {
        initDB();
    }
}

// LocalStorage solution (Single save)
function setupLocalStorage() {
    // Single-save fallback: no named lists, so hide the list picker and Remove
    $('#preset_dd, #preset_label, #research_remove').hide();
    $('#research_load').prop('disabled', false);
    $('#research_save').on('click', function(event) {
        event.preventDefault();
        saveResearchToLocalStorage();
    }).parent().removeClass('hide');
    $('#research_load').on('click', function(event) {
        event.preventDefault();
        loadResearchFromLocalStorage();
    }).parent().removeClass('hide');
}

function saveResearchToLocalStorage() {
    var data = {};
    research.forEach(area => {
        var activeTech = [];
        $('.' + area + ' div.node-status.active').parent().not(':contains(\\(Starting\\))').each(function() {
            activeTech.push($(this).attr('id'));
        });
        data[area] = activeTech;
    });
    localStorage['LocalStorage'] = JSON.stringify(data);
}

function loadResearchFromLocalStorage() {
    if(localStorage['LocalStorage']) {
        var data = JSON.parse(localStorage['LocalStorage']);
        research.forEach(area => {
            var activeTech = data[area];
            activeTech.forEach(tech => updateResearch(area, tech, true));
            charts[area].tree.reload();
        });
    } else {
        alert("Unable to load data from local storage!");
    }
}