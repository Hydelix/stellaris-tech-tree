'use strict';

var research = ['physics', 'society', 'engineering', 'anomaly'];

var config = {
    //container: '#tech-tree-',
    rootOrientation: 'WEST', // NORTH || EAST || WEST || SOUTH
    nodeAlign: 'TOP',
    hideRootNode: true,
    siblingSeparation: 20,
    subTeeSeparation:  20,
    scrollbar: 'resize',
    connectors: {
        type: 'step'
    },
    node: {
        HTMLclass: 'tech',
        collapsable: false
    },
    callback: {
        onTreeLoaded: function(tree) {
            init_tooltips();

            var area = tree.nodeHTMLclass.replace('tech', '').replace(' ', '');
            init_nodestatus(area);

            const observer = lozad();
            observer.observe();
		}
    }
};

function init_tooltips() {

    $('.node:not(.tooltipstered)').tooltipster({
        minWidth: 300,
        trigger: 'click',
        maxWidth: 512,
        functionInit: function(instance, helper){
            var content = $(helper.origin).find('.extra-data');
            $(content).find('img').each(function(img, el) {
                $(el).attr('src',$(el).attr('data-src'));
                
                var tech = $(el)[0].classList[$(el)[0].classList.length-1];
                if(!$('#' + tech).hasClass('anomaly')) {
                    var parent = $('#' + tech)[0];
                    if(parent !== undefined && parent.classList.length > 1)
                    $(el).addClass(parent.classList[2]);
                }
            });
            instance.content($('<div class="ui-tooltip">' + $(content).html() + '</div>'));
        },
        functionReady: function(instance, helper) {
            $(helper.tooltip).find('.tooltip-content').each(function(div){
                var content = $(this).html();
                content = content.replace(new RegExp(/£(\w+)£/,'g'), '<img class="resource" src="../assets/icons/$1.png" />');
                $(this).html(content);
            });
            $(helper.tooltip).find('.node-status').each(function() {
                var tech = $(this)[0].classList[1];
                if($('#' + tech).find('div.node-status').hasClass('active')) {
                    $(this).addClass('active');
                } else {
                    $(this).removeClass('active');
                }
            });
        }
    });
}

function setup(tech) {
    var techClass = (tech.is_dangerous ? ' dangerous' : '')
        + (!tech.is_dangerous && tech.is_rare ? ' rare' : '');

    var tmpl = $.templates("#node-template");
    var html = tmpl.render(tech);

    tech.HTMLid = tech.key;
    tech.HTMLclass = tech.area + techClass + (tech.is_start_tech ? ' active' : '');

    var output = html;
    if(tech.is_start_tech) {
        var e = $('<div>' + html + '</div>');
        e.find('div.node-status').addClass('active').addClass('status-loaded');
        output = e.html();
    }

    tech.innerHTML = output;

    $(tech.children).each(function(i, node) {
        setup(node);
    });
};

// Search ---------------------------------------------------------------
// Nodes are looked up when a search runs (not when the box is wired up), because the trees
// are loaded asynchronously and don't exist yet when the page first appears.
const search_text_cache = new WeakMap();

function search_text_of(node) {
    let text = search_text_cache.get(node);
    if (text === undefined) {
        text = '';
        node.querySelectorAll('.node-name, .extra-data .tooltip-content:not(.prerequisites)').forEach(data => {
            text += ' ' + data.textContent;
        });
        text = text.toLowerCase();
        search_text_cache.set(node, text);
    }
    return text;
}

function search_all_nodes() {
    return Array.from(document.querySelectorAll('#tech-tree .node.tech'));
}

function search_visible_nodes() {
    const trees = document.querySelectorAll('#tech-tree [id|="tech-tree"]');
    const nodes = new Set();
    trees.forEach(t => {
        if (t.classList.contains('float-NoDisplay')) return;
        t.querySelectorAll('.node.tech').forEach(n => nodes.add(n));
    });
    return Array.from(nodes);
}

function setup_search() {
    const input = $('#deepsearch');
    if (!input.length) return;

    // Safe to call repeatedly (tab switches call it again): drop old handlers first.
    input.off('.deepsearch');

    let hits = [];
    let focus_idx = -1;
    let applied_term = null;

    const reset_all = () => {
        search_all_nodes().forEach(n => n.style.opacity = '');
    };

    const focus_hit = (idx) => {
        if (!hits.length) return;
        if (focus_idx >= 0 && hits[focus_idx]) hits[focus_idx].style.opacity = 0.6;
        focus_idx = (idx + hits.length) % hits.length;
        const node = hits[focus_idx];
        node.style.opacity = 1;
        node.scrollIntoView({ behavior: (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    };

    const run_search = (force) => {
        const term = input.val().trim().toLowerCase();
        if (!force && term === applied_term) return;
        applied_term = term;
        focus_idx = -1;
        hits = [];

        if (!term) {
            reset_all();
            const c0 = document.getElementById('search-count');
            if (c0) c0.textContent = '';
            return;
        }

        // Only nodes in the tabs currently on screen are matched; everything else is reset to normal.
        reset_all();
        const nodes = search_visible_nodes();
        nodes.forEach(n => {
            const match = search_text_of(n).includes(term);
            n.style.opacity = match ? 0.6 : 0.1;
            if (match) hits.push(n);
        });

        hits.sort((a, b) => {
            const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
            return (ra.top - rb.top) || (ra.left - rb.left);
        });

        if (hits.length) focus_hit(0);
        const count = document.getElementById('search-count');
        if (count) count.textContent = hits.length + (hits.length === 1 ? ' match' : ' matches');
    };

    const debounced = (() => {
        let id = null;
        return () => { window.clearTimeout(id); id = window.setTimeout(() => run_search(false), 250); };
    })();

    input.on('input.deepsearch change.deepsearch paste.deepsearch keyup.deepsearch', debounced);

    // Enter jumps to the next match (Shift+Enter goes back)
    input.on('keydown.deepsearch', function (e) {
        if (e.key !== 'Enter' && e.which !== 13) return;
        e.preventDefault();
        run_search(false);               // make sure results match what is typed
        if (hits.length > 1) focus_hit(focus_idx + (e.shiftKey ? -1 : 1));
    });

    // Re-apply the current term (used after switching tabs so the new tab is filtered too)
    if (input.val().trim()) run_search(true);
};


$(document).ready(function() {
    load_tree();

    let checkExist = setInterval(() => {
        if (document.querySelector('#tech-tree')) {
           clearInterval(checkExist);
           setup_search();
        };
    }, 100)
});

function _load(jsonData, tree) {
    var container = '#tech-tree-' + jsonData.children[0].name;
    var myconfig = {container: container};
    $.extend(true, myconfig, config);

    charts[tree] = new Treant({chart:myconfig, nodeStructure: jsonData.children[0]}, function () {},$);
}

function load_tree() {
    research.forEach( area => {
        if('anomaly' !== area) {
            $.getJSON( area + '.json', function(jsonData) {
                setup(jsonData);
                _load(jsonData, area);
            });
        }
    });
    $.getJSON('anomalies.json', function(jsonData) {
        // Event techs don't really need a Tree
        $(jsonData).each(function(index, item) {
            setup(item);
            var e = $("<div>").html(item.innerHTML);
            e.attr("id", item.key);
            e.attr("class",item.HTMLclass)
            e.addClass("node").addClass("tech").addClass("anomaly");
            $('#tech-tree-anomalies').append(e);
        });
        init_nodestatus('anomalies');
        init_tooltips();
    });
    if(window.indexedDB) {
        initDB();
    }
    else if (window.localStorage) {
        setupLocalStorage();
    }
}
