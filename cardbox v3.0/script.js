(function() {
    // Utility functions for DOM manipulation and event handling
    var on = addEventListener,
        off = removeEventListener,
        $ = function(q) {
            return document.querySelector(q)
        },
        $$ = function(q) {
            return document.querySelectorAll(q)
        },
        $body = document.body,
        $inner = $('.inner');

    // Client detection (browser, OS, mobile status, feature support)
    var client = (function() {
        var o = {
                browser: 'other',
                browserVersion: 0,
                os: 'other',
                osVersion: 0,
                mobile: false,
                canUse: null,
                flags: {
                    lsdUnits: false,
                },
            },
            ua = navigator.userAgent,
            a, i;

        // Detect browser
        a = [
            ['firefox', /Firefox\/([0-9\.]+)/, null],
            ['edge', /Edge\/([0-9\.]+)/, null],
            ['safari', /Version\/([0-9\.]+).+Safari/, null],
            ['chrome', /Chrome\/([0-9\.]+)/, null],
            ['chrome', /CriOS\/([0-9\.]+)/, null],
            ['ie', /Trident\/.+rv:([0-9]+)/, null],
            ['safari', /iPhone OS ([0-9_]+)/, function(v) {
                return v.replace('_', '.').replace('_', '');
            }]
        ];
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.browser = a[i][0];
                o.browserVersion = parseFloat(a[i][2] ? (a[i][2])(RegExp.$1) : RegExp.$1);
                break;
            }
        }

        // Detect OS
        a = [
            ['ios', /([0-9_]+) like Mac OS X/, function(v) {
                return v.replace('_', '.').replace('_', '');
            }],
            ['ios', /CPU like Mac OS X/, function(v) {
                return 0
            }],
            ['ios', /iPad; CPU/, function(v) {
                return 0
            }],
            ['android', /Android ([0-9\.]+)/, null],
            ['mac', /Macintosh.+Mac OS X ([0-9_]+)/, function(v) {
                return v.replace('_', '.').replace('_', '');
            }],
            ['windows', /Windows NT ([0-9\.]+)/, null],
            ['undefined', /Undefined/, null]
        ];
        for (i = 0; i < a.length; i++) {
            if (ua.match(a[i][1])) {
                o.os = a[i][0];
                o.osVersion = parseFloat(a[i][2] ? (a[i][2])(RegExp.$1) : RegExp.$1);
                break;
            }
        }

        // Special case for iPadOS
        if (o.os == 'mac' &&
            ('ontouchstart' in window) &&
            ((screen.width == 1024 && screen.height == 1366) ||
                (screen.width == 834 && screen.height == 1112) ||
                (screen.width == 810 && screen.height == 1080) ||
                (screen.width == 768 && screen.height == 1024)))
            o.os = 'ios';

        // Determine if mobile
        o.mobile = (o.os == 'android' || o.os == 'ios');

        // Feature detection utility
        var _canUse = document.createElement('div');
        o.canUse = function(property, value) {
            var style;
            style = _canUse.style;
            if (!(property in style))
                return false;
            if (typeof value !== 'undefined') {
                style[property] = value;
                if (style[property] == '')
                    return false;
            }
            return true;
        };

        // Check for Large Viewport Height units (lsdUnits)
        o.flags.lsdUnits = o.canUse('width', '100dvw');

        return o;
    })();

    // Ready state management
    var ready = {
        list: [],
        add: function(f) {
            this.list.push(f);
        },
        run: function() {
            this.list.forEach((f) => {
                f();
            });
        },
    };

    // Custom event trigger
    var trigger = function(t) {
        dispatchEvent(new Event(t));
    };

    // Get CSS rules for a given selector
    var cssRules = function(selectorText) {
        var ss = document.styleSheets,
            a = [],
            f = function(s) {
                var r = s.cssRules,
                    i;
                for (i = 0; i < r.length; i++) {
                    if (r[i] instanceof CSSMediaRule && matchMedia(r[i].conditionText).matches)
                        (f)(r[i]);
                    else if (r[i] instanceof CSSStyleRule && r[i].selectorText == selectorText)
                        a.push(r[i]);
                }
            },
            x, i;
        for (i = 0; i < ss.length; i++)
            f(ss[i]);
        return a;
    };

    // Escape HTML entities in a string
    var escapeHtml = function(s) {
        if (s === '' || s === null || s === undefined)
            return '';
        var a = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        s = s.replace(/[&<>"']/g, function(x) {
            return a[x];
        });
        return s;
    };

    // Get the current hash from the URL
    var thisHash = function() {
        var h = location.hash ? location.hash.substring(1) : null,
            a;
        if (!h)
            return null;
        if (h.match(/\?/)) {
            a = h.split('?');
            h = a[0];
            history.replaceState(undefined, undefined, '#' + h);
            window.location.search = a[1];
        }
        if (h.length > 0 && !h.match(/^[a-zA-Z]/))
            h = 'x' + h;
        if (typeof h == 'string')
            h = h.toLowerCase();
        return h;
    };

    // Smooth scroll to an element or top of the page
    var scrollToElement = function(e, style, duration) {
        var y, cy, dy,
            start, easing, offset, f;
        if (!e)
            y = 0;
        else {
            offset = (e.dataset.scrollOffset ? parseInt(e.dataset.scrollOffset) : 0) * parseFloat(getComputedStyle(document.documentElement).fontSize);
            switch (e.dataset.scrollBehavior ? e.dataset.scrollBehavior : 'default') {
                case 'default':
                default:
                    y = e.offsetTop + offset;
                    break;
                case 'center':
                    if (e.offsetHeight < window.innerHeight)
                        y = e.offsetTop - ((window.innerHeight - e.offsetHeight) / 2) + offset;
                    else
                        y = e.offsetTop - offset;
                    break;
                case 'previous':
                    if (e.previousElementSibling)
                        y = e.previousElementSibling.offsetTop + e.previousElementSibling.offsetHeight + offset;
                    else
                        y = e.offsetTop + offset;
                    break;
            }
        }
        if (!style)
            style = 'smooth';
        if (!duration)
            duration = 750;
        if (style == 'instant') {
            window.scrollTo(0, y);
            return;
        }
        start = Date.now();
        cy = window.scrollY;
        dy = y - cy;
        switch (style) {
            case 'linear':
                easing = function(t) {
                    return t
                };
                break;
            case 'smooth':
                easing = function(t) {
                    return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
                };
                break;
        }
        f = function() {
            var t = Date.now() - start;
            if (t >= duration)
                window.scroll(0, y);
            else {
                window.scroll(0, cy + (dy * easing(t / duration)));
                requestAnimationFrame(f);
            }
        };
        f();
    };

    // Scroll to the top of the page
    var scrollToTop = function() {
        scrollToElement(null);
    };

    // Load elements with data-src, autoplay videos, and focus on autofocused elements
    var loadElements = function(parent) {
        var a, e, x, i;

        // Load iframes
        a = parent.querySelectorAll('iframe[data-src]:not([data-src=""])');
        for (i = 0; i < a.length; i++) {
            a[i].contentWindow.location.replace(a[i].dataset.src);
            a[i].dataset.initialSrc = a[i].dataset.src;
            a[i].dataset.src = '';
        }

        // Play autoplay videos
        a = parent.querySelectorAll('video[autoplay]');
        for (i = 0; i < a.length; i++) {
            if (a[i].paused)
                a[i].play();
        }

        // Focus on autofocused elements
        e = parent.querySelector('[data-autofocus="1"]');
        x = e ? e.tagName : null;
        switch (x) {
            case 'FORM':
                e = e.querySelector('.field input, .field select, .field textarea');
                if (e)
                    e.focus();
                break;
            default:
                break;
        }

        // Load unloaded scripts
        a = parent.querySelectorAll('unloaded-script');
        for (i = 0; i < a.length; i++) {
            x = document.createElement('script');
            x.setAttribute('data-loaded', '');
            if (a[i].getAttribute('src'))
                x.setAttribute('src', a[i].getAttribute('src'));
            if (a[i].textContent)
                x.textContent = a[i].textContent;
            a[i].replaceWith(x);
        }

        // Dispatch loadelements event
        x = new Event('loadelements');
        a = parent.querySelectorAll('[data-unloaded]');
        a.forEach((element) => {
            element.removeAttribute('data-unloaded');
            element.dispatchEvent(x);
        });
    };

    // Unload elements (reset iframes, pause videos, blur focus)
    var unloadElements = function(parent) {
        var a, e, x, i;

        // Unload iframes
        a = parent.querySelectorAll('iframe[data-src=""]');
        for (i = 0; i < a.length; i++) {
            if (a[i].dataset.srcUnload === '0')
                continue;
            if ('initialSrc' in a[i].dataset)
                a[i].dataset.src = a[i].dataset.initialSrc;
            else
                a[i].dataset.src = a[i].src;
            a[i].contentWindow.location.replace('about:blank');
        }

        // Pause videos
        a = parent.querySelectorAll('video');
        for (i = 0; i < a.length; i++) {
            if (!a[i].paused)
                a[i].pause();
        }

        // Blur focused element
        e = $(':focus');
        if (e)
            e.blur();
    };

    // Expose scrollToTop globally
    window._scrollToTop = scrollToTop;

    // Get current URL without hash or query string
    var thisUrl = function() {
        return window.location.href.replace(window.location.search, '').replace(/#$/, '');
    };

    // Get query parameter by name
    var getVar = function(name) {
        var a = window.location.search.substring(1).split('&'),
            b, k;
        for (k in a) {
            b = a[k].split('=');
            if (b[0] == name)
                return b[1];
        }
        return null;
    };

    // Error handling utility
    var errors = {
        handle: function(handler) {
            window.onerror = function(message, url, line, column, error) {
                (handler)(error.message);
                return true;
            };
        },
        unhandle: function() {
            window.onerror = null;
        }
    };

    // Handles the initial loading state of the body
    var loadHandler = function() {
        setTimeout(function() {
            $body.classList.remove('is-loading');
            $body.classList.add('is-playing');
            setTimeout(function() {
                $body.classList.remove('is-playing');
                $body.classList.add('is-ready');
            }, 750);
        }, 100);
    };
    on('load', loadHandler);

    // Section and scroll point navigation logic
    (function() {
        var initialSection, initialScrollPoint, initialId,
            header, footer, name, hideHeader, hideFooter, disableAutoScroll,
            h, e, ee, k,
            locked = false,
            title = document.title,

            // Get the parent section of a scroll point
            scrollPointParent = function(target) {
                while (target) {
                    if (target.parentElement && target.parentElement.tagName == 'SECTION')
                        break;
                    target = target.parentElement;
                }
                return target;
            },

            // Get scroll speed based on data-scroll-speed attribute
            scrollPointSpeed = function(scrollPoint) {
                let x = parseInt(scrollPoint.dataset.scrollSpeed);
                switch (x) {
                    case 5:
                        return 250;
                    case 4:
                        return 500;
                    case 3:
                        return 750;
                    case 2:
                        return 1000;
                    case 1:
                        return 1250;
                    default:
                        break;
                }
                return 750;
            },

            // Scroll to the next scroll point
            doNextScrollPoint = function(event) {
                var e, target, id;
                e = scrollPointParent(event.target);
                if (!e)
                    return;
                while (e && e.nextElementSibling) {
                    e = e.nextElementSibling;
                    if (e.dataset.scrollId) {
                        target = e;
                        id = e.dataset.scrollId;
                        break;
                    }
                }
                if (!target || !id)
                    return;
                if (target.dataset.scrollInvisible == '1')
                    scrollToElement(target, 'smooth', scrollPointSpeed(target));
                else
                    location.href = '#' + id;
            },

            // Scroll to the previous scroll point
            doPreviousScrollPoint = function(e) {
                var e, target, id;
                e = scrollPointParent(event.target);
                if (!e)
                    return;
                while (e && e.previousElementSibling) {
                    e = e.previousElementSibling;
                    if (e.dataset.scrollId) {
                        target = e;
                        id = e.dataset.scrollId;
                        break;
                    }
                }
                if (!target || !id)
                    return;
                if (target.dataset.scrollInvisible == '1')
                    scrollToElement(target, 'smooth', scrollPointSpeed(target));
                else
                    location.href = '#' + id;
            },

            // Scroll to the first scroll point in the current section
            doFirstScrollPoint = function(e) {
                var e, target, id;
                e = scrollPointParent(event.target);
                if (!e)
                    return;
                while (e && e.previousElementSibling) {
                    e = e.previousElementSibling;
                    if (e.dataset.scrollId) {
                        target = e;
                        id = e.dataset.scrollId;
                    }
                }
                if (!target || !id)
                    return;
                if (target.dataset.scrollInvisible == '1')
                    scrollToElement(target, 'smooth', scrollPointSpeed(target));
                else
                    location.href = '#' + id;
            },

            // Scroll to the last scroll point in the current section
            doLastScrollPoint = function(e) {
                var e, target, id;
                e = scrollPointParent(event.target);
                if (!e)
                    return;
                while (e && e.nextElementSibling) {
                    e = e.nextElementSibling;
                    if (e.dataset.scrollId) {
                        target = e;
                        id = e.dataset.scrollId;
                    }
                }
                if (!target || !id)
                    return;
                if (target.dataset.scrollInvisible == '1')
                    scrollToElement(target, 'smooth', scrollPointSpeed(target));
                else
                    location.href = '#' + id;
            },

            // Navigate to the next section
            doNextSection = function() {
                var section;
                section = $('#main > .inner > section.active').nextElementSibling;
                if (!section || section.tagName != 'SECTION')
                    return;
                location.href = '#' + section.id.replace(/-section$/, '');
            },

            // Navigate to the previous section
            doPreviousSection = function() {
                var section;
                section = $('#main > .inner > section.active').previousElementSibling;
                if (!section || section.tagName != 'SECTION')
                    return;
                location.href = '#' + (section.matches(':first-child') ? '' : section.id.replace(/-section$/, ''));
            },

            // Navigate to the first section
            doFirstSection = function() {
                var section;
                section = $('#main > .inner > section:first-of-type');
                if (!section || section.tagName != 'SECTION')
                    return;
                location.href = '#' + section.id.replace(/-section$/, '');
            },

            // Navigate to the last section
            doLastSection = function() {
                var section;
                section = $('#main > .inner > section:last-of-type');
                if (!section || section.tagName != 'SECTION')
                    return;
                location.href = '#' + section.id.replace(/-section$/, '');
            },

            // Reset elements within a section (e.g., forms)
            resetSectionChangeElements = function(section) {
                var ee, e, x;
                ee = section.querySelectorAll('[data-reset-on-section-change="1"]');
                for (e of ee) {
                    x = e ? e.tagName : null;
                    switch (x) {
                        case 'FORM':
                            e.reset();
                            break;
                        default:
                            break;
                    }
                }
            },

            // Activate a given section
            activateSection = function(section, scrollPoint) {
                var sectionHeight, currentSection, currentSectionHeight,
                    name, hideHeader, hideFooter, disableAutoScroll,
                    ee, k;

                if (!section.classList.contains('inactive')) {
                    name = (section ? section.id.replace(/-section$/, '') : null);
                    disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;
                    if (scrollPoint)
                        scrollToElement(scrollPoint, 'smooth', scrollPointSpeed(scrollPoint));
                    else if (!disableAutoScroll)
                        scrollToElement(null);
                    return false;
                } else {
                    locked = true; // Prevent hashchange during transition
                    if (location.hash == '#home')
                        history.replaceState(null, null, '#');

                    name = (section ? section.id.replace(/-section$/, '') : null);
                    hideHeader = name ? ((name in sections) && ('hideHeader' in sections[name]) && sections[name].hideHeader) : false;
                    hideFooter = name ? ((name in sections) && ('hideFooter' in sections[name]) && sections[name].hideFooter) : false;
                    disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;

                    // Hide header/footer if specified for the section
                    if (header && hideHeader) {
                        header.classList.add('hidden');
                        header.style.display = 'none';
                    }
                    if (footer && hideFooter) {
                        footer.classList.add('hidden');
                        footer.style.display = 'none';
                    }

                    // Deactivate current section
                    currentSection = $('#main > .inner > section:not(.inactive)');
                    currentSection.classList.add('inactive');
                    currentSection.classList.remove('active');
                    currentSection.style.display = 'none';
                    document.title = title; // Reset document title
                    unloadElements(currentSection);
                    resetSectionChangeElements(currentSection);
                    clearTimeout(window._sectionTimeoutId);

                    // Show header/footer if not hidden for the new section
                    if (header && !hideHeader) {
                        header.style.display = '';
                        header.classList.remove('hidden');
                    }
                    if (footer && !hideFooter) {
                        footer.style.display = '';
                        footer.classList.remove('hidden');
                    }

                    // Activate new section
                    section.classList.remove('inactive');
                    section.classList.add('active');
                    section.style.display = '';
                    trigger('resize'); // Trigger resize event for responsive adjustments

                    if (section.dataset.title)
                        document.title = section.dataset.title + ' - ' + title;

                    loadElements(section); // Load elements within the new section

                    // Scroll to specific scroll point or top of section
                    if (scrollPoint)
                        scrollToElement(scrollPoint, 'instant');
                    else if (!disableAutoScroll)
                        scrollToElement(null, 'instant');

                    locked = false; // Allow hashchange again
                }
            },
            sections = {}; // Placeholder for section-specific settings (not used in provided code)

        // Expose navigation functions globally
        window._nextScrollPoint = doNextScrollPoint;
        window._previousScrollPoint = doPreviousScrollPoint;
        window._firstScrollPoint = doFirstScrollPoint;
        window._lastScrollPoint = doLastScrollPoint;
        window._nextSection = doNextSection;
        window._previousSection = doPreviousSection;
        window._firstSection = doFirstSection;
        window._lastSection = doLastSection;

        // Custom scroll to top function for sections
        window._scrollToTop = function() {
            var section, id;
            scrollToElement(null);
            if (!!(section = $('section.active'))) {
                id = section.id.replace(/-section$/, '');
                if (id == 'home')
                    id = '';
                history.pushState(null, null, '#' + id);
            }
        };

        // Disable scroll restoration to manage scrolling manually
        if ('scrollRestoration' in history)
            history.scrollRestoration = 'manual';

        // Get header and footer elements
        header = $('#header');
        footer = $('#footer');

        // Initial section activation based on URL hash
        h = thisHash();
        if (h && !h.match(/^[a-zA-Z0-9\-]+$/))
            h = null; // Sanitize hash

        if (e = $('[data-scroll-id="' + h + '"]')) {
            initialScrollPoint = e;
            initialSection = initialScrollPoint.parentElement;
            initialId = initialSection.id;
        } else if (e = $('#' + (h ? h : 'home') + '-section')) {
            initialScrollPoint = null;
            initialSection = e;
            initialId = initialSection.id;
        }

        // Default to home section if no valid hash
        if (!initialSection) {
            initialScrollPoint = null;
            initialSection = $('#' + 'home' + '-section');
            initialId = initialSection.Iid;
            history.replaceState(undefined, undefined, '#'); // Clear hash
        }

        // Apply initial header/footer visibility based on section settings
        name = (h ? h : 'home');
        hideHeader = name ? ((name in sections) && ('hideHeader' in sections[name]) && sections[name].hideHeader) : false;
        hideFooter = name ? ((name in sections) && ('hideFooter' in sections[name]) && sections[name].hideFooter) : false;
        disableAutoScroll = name ? ((name in sections) && ('disableAutoScroll' in sections[name]) && sections[name].disableAutoScroll) : false;

        if (header && hideHeader) {
            header.classList.add('hidden');
            header.style.display = 'none';
        }
        if (footer && hideFooter) {
            footer.classList.add('hidden');
            footer.style.display = 'none';
        }

        // Deactivate all sections except the initial one
        ee = $$('#main > .inner > section:not([id="' + initialId + '"])');
        for (k = 0; k < ee.length; k++) {
            ee[k].className = 'inactive';
            ee[k].style.display = 'none';
        }
        initialSection.classList.add('active');

        // Run initial setup after DOM is ready
        ready.add(() => {
            if (initialSection.dataset.title)
                document.title = initialSection.dataset.title + ' - ' + title;
            loadElements(initialSection);
            if (header)
                loadElements(header);
            if (footer)
                loadElements(footer);
            if (!disableAutoScroll)
                scrollToElement(null, 'instant');
        });

        // Scroll to initial scroll point on load
        on('load', function() {
            if (initialScrollPoint)
                scrollToElement(initialScrollPoint, 'instant');
        });

        // Handle hash changes for section navigation
        on('hashchange', function(event) {
            var section, scrollPoint,
                h, e;
            if (locked)
                return false; // Prevent re-entry during transition

            h = thisHash();
            if (h && !h.match(/^[a-zA-Z0-9\-]+$/))
                return false; // Sanitize hash

            if (e = $('[data-scroll-id="' + h + '"]')) {
                scrollPoint = e;
                section = scrollPoint.parentElement;
            } else if (e = $('#' + (h ? h : 'home') + '-section')) {
                scrollPoint = null;
                section = e;
            } else {
                scrollPoint = null;
                section = $('#' + 'home' + '-section');
                history.replaceState(undefined, undefined, '#'); // Default to home and clear hash
            }

            if (!section)
                return false; // No valid section found

            activateSection(section, scrollPoint);
            return false;
        });

        // Handle clicks on hash links
        on('click', function(event) {
            var t = event.target,
                tagName = t.tagName.toUpperCase(),
                scrollPoint, section;

            // Traverse up the DOM to find an anchor tag if a child element was clicked
            switch (tagName) {
                case 'IMG':
                case 'SVG':
                case 'USE':
                case 'U':
                case 'STRONG':
                case 'EM':
                case 'CODE':
                case 'S':
                case 'MARK':
                case 'SPAN':
                    while (!!(t = t.parentElement))
                        if (t.tagName == 'A')
                            break;
                    if (!t)
                        return;
                    break;
                default:
                    break;
            }

            // If an anchor tag with a hash is clicked
            if (t.tagName == 'A' && t.getAttribute('href') !== null && t.getAttribute('href').substr(0, 1) == '#') {
                // If it's an invisible scroll point, handle it internally
                if (!!(scrollPoint = $('[data-scroll-id="' + t.hash.substr(1) + '"][data-scroll-invisible="1"]'))) {
                    event.preventDefault();
                    section = scrollPoint.parentElement;
                    if (section.classList.contains('inactive')) {
                        history.pushState(null, null, '#' + section.id.replace(/-section$/, ''));
                        activateSection(section, scrollPoint);
                    } else {
                        scrollToElement(scrollPoint, 'smooth', scrollPointSpeed(scrollPoint));
                    }
                }
                // If it's the current hash, prevent default and replace state to trigger scroll
                else if (t.hash == window.location.hash) {
                    event.preventDefault();
                    history.replaceState(undefined, undefined, '#');
                    location.replace(t.hash);
                }
            }
        });
    })();

    // Dynamic CSS rules for mobile and iOS fixes
    var style, sheet, rule;
    style = document.createElement('style');
    style.appendChild(document.createTextNode(''));
    document.head.appendChild(style);
    sheet = style.sheet;

    // Mobile viewport height fixes
    if (client.mobile) {
        (function() {
            if (client.flags.lsdUnits) {
                document.documentElement.style.setProperty('--viewport-height', '100svh');
                document.documentElement.style.setProperty('--background-height', '100lvh');
            } else {
                var f = function() {
                    document.documentElement.style.setProperty('--viewport-height', window.innerHeight + 'px');
                    document.documentElement.style.setProperty('--background-height', (window.innerHeight + 250) + 'px');
                };
                on('load', f);
                on('orientationchange', function() {
                    setTimeout(function() {
                        (f)();
                    }, 100);
                });
            }
        })();
    }

    // Android specific fixes
    if (client.os == 'android') {
        (function() {
            sheet.insertRule('body::after { }', 0);
            rule = sheet.cssRules[0];
            var f = function() {
                rule.style.cssText = 'height: ' + (Math.max(screen.width, screen.height)) + 'px';
            };
            on('load', f);
            on('orientationchange', f);
            on('touchmove', f);
        })();
        $body.classList.add('is-touch');
    }
    // iOS specific fixes
    else if (client.os == 'ios') {
        if (client.osVersion <= 11)
            (function() {
                sheet.insertRule('body::after { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = '-webkit-transform: scale(1.0)';
            })();
        if (client.osVersion <= 11)
            (function() {
                sheet.insertRule('body.ios-focus-fix::before { }', 0);
                rule = sheet.cssRules[0];
                rule.style.cssText = 'height: calc(100% + 60px)';
                on('focus', function(event) {
                    $body.classList.add('ios-focus-fix');
                }, true);
                on('blur', function(event) {
                    $body.classList.remove('ios-focus-fix');
                }, true);
            })();
        $body.classList.add('is-touch');
    }

    // Element reordering for responsive layouts
    (function() {
        var breakpoints = {
                small: '(max-width: 736px)',
                medium: '(max-width: 980px)',
            },
            elements = $$('[data-reorder]');
        elements.forEach(function(e) {
            var desktop = [],
                mobile = [],
                state = false,
                query,
                a, x, ce, f;

            if ('reorderBreakpoint' in e.dataset && e.dataset.reorderBreakpoint in breakpoints)
                query = breakpoints[e.dataset.reorderBreakpoint];
            else
                query = breakpoints.small;

            // Store initial desktop order
            for (ce of e.childNodes) {
                if (ce.nodeType != 1)
                    continue;
                desktop.push(ce);
            }

            // Create mobile order based on data-reorder attribute
            a = e.dataset.reorder.split(',');
            for (x of a)
                mobile.push(desktop[parseInt(x)]);

            // Function to apply reordering based on media query
            f = function() {
                var order = null,
                    ce;
                if (window.matchMedia(query).matches) {
                    if (!state) {
                        state = true;
                        for (ce of mobile)
                            e.appendChild(ce);
                    }
                } else {
                    if (state) {
                        state = false;
                        for (ce of desktop)
                            e.appendChild(ce);
                    }
                }
            };

            // Attach event listeners for reordering
            on('resize', f);
            on('orientationchange', f);
            on('load', f);
            on('fullscreenchange', f);
        });
    })();

    // Scroll events for on-visible animations
    var scrollEvents = {
        items: [],
        add: function(o) {
            this.items.push({
                element: o.element,
                triggerElement: (('triggerElement' in o && o.triggerElement) ? o.triggerElement : o.element),
                enter: ('enter' in o ? o.enter : null),
                leave: ('leave' in o ? o.leave : null),
                mode: ('mode' in o ? o.mode : 4), // Mode 4 is default for onvisible
                threshold: ('threshold' in o ? o.threshold : 0.25), // 0.25 threshold is default for onvisible
                offset: ('offset' in o ? o.offset : 0),
                initialState: ('initialState' in o ? o.initialState : null),
                state: false, // Current visibility state
            });
        },
        handler: function() {
            var height, top, bottom, scrollPad;

            // Adjust scroll calculation for iOS
            if (client.os == 'ios') {
                height = document.documentElement.clientHeight;
                top = document.body.scrollTop + window.scrollY;
                bottom = top + height;
                scrollPad = 125; // Additional padding for iOS scroll issues
            } else {
                height = document.documentElement.clientHeight;
                top = document.documentElement.scrollTop;
                bottom = top + height;
                scrollPad = 0;
            }

            scrollEvents.items.forEach(function(item) {
                var elementTop, elementBottom, viewportTop, viewportBottom,
                    bcr, pad, state, a, b;

                if (!item.enter && !item.leave)
                    return true; // No actions defined for this item

                if (!item.triggerElement)
                    return true; // No trigger element

                // If element is not in DOM, and was previously visible, trigger leave
                if (item.triggerElement.offsetParent === null) {
                    if (item.state == true && item.leave) {
                        item.state = false;
                        (item.leave).apply(item.element);
                        if (!item.enter)
                            item.leave = null; // Optimization: if no enter, remove leave handler
                    }
                    return true;
                }

                // Get bounding client rect for element position
                bcr = item.triggerElement.getBoundingClientRect();
                elementTop = top + Math.floor(bcr.top);
                elementBottom = elementTop + bcr.height;

                // Determine initial state if provided
                if (item.initialState !== null) {
                    state = item.initialState;
                    item.initialState = null;
                } else {
                    // Determine visibility state based on mode and threshold
                    switch (item.mode) {
                        case 1: // Simple intersection
                        default:
                            state = (bottom > (elementTop - item.offset) && top < (elementBottom + item.offset));
                            break;
                        case 2: // Center of viewport
                            a = (top + (height * 0.5));
                            state = (a > (elementTop - item.offset) && a < (elementBottom + item.offset));
                            break;
                        case 3: // Threshold-based visibility
                            a = top + (height * (item.threshold));
                            if (a - (height * 0.375) <= 0)
                                a = 0;
                            b = top + (height * (1 - item.threshold));
                            if (b + (height * 0.375) >= document.body.scrollHeight - scrollPad)
                                b = document.body.scrollHeight + scrollPad;
                            state = (b > (elementTop - item.offset) && a < (elementBottom + item.offset));
                            break;
                        case 4: // Advanced threshold (default for onvisible)
                            pad = height * item.threshold;
                            viewportTop = (top + pad);
                            viewportBottom = (bottom - pad);
                            if (Math.floor(top) <= pad)
                                viewportTop = top;
                            if (Math.ceil(bottom) >= (document.body.scrollHeight - pad))
                                viewportBottom = bottom;

                            if ((viewportBottom - viewportTop) >= (elementBottom - elementTop)) {
                                // Element is smaller than viewport, check if any part is visible
                                state = ((elementTop >= viewportTop && elementBottom <= viewportBottom) ||
                                    (elementTop >= viewportTop && elementTop <= viewportBottom) ||
                                    (elementBottom >= viewportTop && elementBottom <= viewportBottom));
                            } else {
                                // Element is larger than viewport, check if viewport is within element
                                state = ((viewportTop >= elementTop && viewportBottom <= elementBottom) ||
                                    (elementTop >= viewportTop && elementTop <= viewportBottom) ||
                                    (elementBottom >= viewportTop && elementBottom <= viewportBottom));
                            }
                            break;
                    }
                }

                // If state changed, trigger enter/leave
                if (state != item.state) {
                    item.state = state;
                    if (item.state) {
                        if (item.enter) {
                            (item.enter).apply(item.element);
                            if (!item.leave)
                                item.enter = null; // Optimization: if no leave, remove enter handler
                        }
                    } else {
                        if (item.leave) {
                            (item.leave).apply(item.element);
                            if (!item.enter)
                                item.leave = null; // Optimization: if no enter, remove leave handler
                        }
                    }
                }
            });
        },
        init: function() {
            on('load', this.handler);
            on('resize', this.handler);
            on('scroll', this.handler);
            (this.handler)(); // Initial check
        }
    };
    scrollEvents.init();

    // On-visible animation effects
    var onvisible = {
        effects: {
            'blur-in': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'filter ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.filter = 'blur(' + (0.25 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.filter = 'none';
                },
            },
            'zoom-in': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'scale(' + (1 - ((alt ? 0.25 : 0.05) * intensity)) + ')';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'zoom-out': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'scale(' + (1 + ((alt ? 0.25 : 0.05) * intensity)) + ')';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'slide-left': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    this.style.transform = 'translateX(100vw)';
                },
                play: function() {
                    this.style.transform = 'none';
                },
            },
            'slide-right': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    this.style.transform = 'translateX(-100vw)';
                },
                play: function() {
                    this.style.transform = 'none';
                },
            },
            'flip-forward': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%';
                    this.style.transform = 'perspective(1000px) rotateX(' + ((alt ? 45 : 15) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'flip-backward': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%';
                    this.style.transform = 'perspective(1000px) rotateX(' + ((alt ? -45 : -15) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'flip-left': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%';
                    this.style.transform = 'perspective(1000px) rotateY(' + ((alt ? 45 : 15) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'flip-right': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transformOrigin = '50% 50%';
                    this.style.transform = 'perspective(1000px) rotateY(' + ((alt ? -45 : -15) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'tilt-left': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'rotate(' + ((alt ? 45 : 5) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'tilt-right': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity, alt) {
                    this.style.opacity = 0;
                    this.style.transform = 'rotate(' + ((alt ? -45 : -5) * intensity) + 'deg)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-right': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.transform = 'translateX(' + (-1.5 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-left': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.transform = 'translateX(' + (1.5 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-down': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.transform = 'translateY(' + (-1.5 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-up': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.opacity = 0;
                    this.style.transform = 'translateY(' + (1.5 * intensity) + 'rem)';
                },
                play: function() {
                    this.style.opacity = 1;
                    this.style.transform = 'none';
                },
            },
            'fade-in': {
                type: 'transition',
                transition: function(speed, delay) {
                    return 'opacity ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'fade-in-background': {
                type: 'manual',
                rewind: function() {
                    this.style.removeProperty('--onvisible-delay');
                    this.style.removeProperty('--onvisible-background-color');
                },
                play: function(speed, delay) {
                    this.style.setProperty('--onvisible-speed', speed + 's');
                    if (delay)
                        this.style.setProperty('--onvisible-delay', delay + 's');
                    this.style.setProperty('--onvisible-background-color', 'rgba(0,0,0,0.001)');
                },
            },
            'zoom-in-image': {
                type: 'transition',
                target: 'img',
                transition: function(speed, delay) {
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function() {
                    this.style.transform = 'scale(1)';
                },
                play: function(intensity) {
                    this.style.transform = 'scale(' + (1 + (0.1 * intensity)) + ')';
                },
            },
            'zoom-out-image': {
                type: 'transition',
                target: 'img',
                transition: function(speed, delay) {
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.transform = 'scale(' + (1 + (0.1 * intensity)) + ')';
                },
                play: function() {
                    this.style.transform = 'none';
                },
            },
            'focus-image': {
                type: 'transition',
                target: 'img',
                transition: function(speed, delay) {
                    return 'transform ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '') + ', ' +
                        'filter ' + speed + 's ease' + (delay ? ' ' + delay + 's' : '');
                },
                rewind: function(intensity) {
                    this.style.transform = 'scale(' + (1 + (0.05 * intensity)) + ')';
                    this.style.filter = 'blur(' + (0.25 * intensity) + 'rem)';
                },
                play: function(intensity) {
                    this.style.transform = 'none';
                    this.style.filter = 'none';
                },
            },
            'wipe-up': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '100% 0%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, {
                        maskSize: '110% 110%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '0% 100%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'wipe-down': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '100% 0%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, {
                        maskSize: '110% 110%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '0% 0%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'wipe-left': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '0% 100%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, {
                        maskSize: '110% 110%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '100% 0%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'wipe-right': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '0% 100%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, {
                        maskSize: '110% 110%',
                        maskImage: 'linear-gradient(90deg, black 100%, transparent 100%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '0% 0%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'wipe-diagonal': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '0% 0%',
                        maskImage: 'linear-gradient(45deg, black 50%, transparent 50%)',
                    }, {
                        maskSize: '220% 220%',
                        maskImage: 'linear-gradient(45deg, black 50%, transparent 50%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '0% 100%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'wipe-reverse-diagonal': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        maskSize: '0% 0%',
                        maskImage: 'linear-gradient(135deg, transparent 50%, black 50%)',
                    }, {
                        maskSize: '220% 220%',
                        maskImage: 'linear-gradient(135deg, transparent 50%, black 50%)',
                    }, ];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                        easing: 'ease',
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                    this.style.maskComposite = 'exclude';
                    this.style.maskRepeat = 'no-repeat';
                    this.style.maskPosition = '100% 100%';
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'pop-in': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.025;
                    return [{
                        opacity: 0,
                        transform: 'scale(' + (1 - diff) + ')',
                    }, {
                        opacity: 1,
                        transform: 'scale(' + (1 + diff) + ')',
                    }, {
                        opacity: 1,
                        transform: 'scale(' + (1 - (diff * 0.25)) + ')',
                        offset: 0.9,
                    }, {
                        opacity: 1,
                        transform: 'scale(1)',
                    }];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'bounce-up': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.075;
                    return [{
                        opacity: 0,
                        transform: 'translateY(' + diff + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateY(' + (-1 * diff) + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateY(' + (diff * 0.25) + 'rem)',
                        offset: 0.9,
                    }, {
                        opacity: 1,
                        transform: 'translateY(0)',
                    }];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'bounce-down': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.075;
                    return [{
                        opacity: 0,
                        transform: 'translateY(' + (-1 * diff) + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateY(' + diff + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateY(' + (-1 * (diff * 0.25)) + 'rem)',
                        offset: 0.9,
                    }, {
                        opacity: 1,
                        transform: 'translateY(0)',
                    }];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'bounce-left': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.075;
                    return [{
                        opacity: 0,
                        transform: 'translateX(' + diff + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateX(' + (-1 * diff) + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateX(' + (diff * 0.25) + 'rem)',
                        offset: 0.9,
                    }, {
                        opacity: 1,
                        transform: 'translateX(0)',
                    }];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
            'bounce-right': {
                type: 'animate',
                keyframes: function(intensity) {
                    let diff = (intensity + 1) * 0.075;
                    return [{
                        opacity: 0,
                        transform: 'translateX(' + (-1 * diff) + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateX(' + diff + 'rem)',
                    }, {
                        opacity: 1,
                        transform: 'translateX(' + (-1 * (diff * 0.25)) + 'rem)',
                        offset: 0.9,
                    }, {
                        opacity: 1,
                        transform: 'translateX(0)',
                    }];
                },
                options: function(speed) {
                    return {
                        duration: speed,
                        iterations: 1,
                    };
                },
                rewind: function() {
                    this.style.opacity = 0;
                },
                play: function() {
                    this.style.opacity = 1;
                },
            },
        },
        regex: new RegExp('([^\\s]+)', 'g'), // Regex for expanding text nodes

        // Add a new on-visible animation to elements matching a selector
        add: function(selector, settings) {
            var _this = this,
                style = settings.style in this.effects ? settings.style : 'fade',
                speed = parseInt('speed' in settings ? settings.speed : 0),
                intensity = parseInt('intensity' in settings ? settings.intensity : 5),
                delay = parseInt('delay' in settings ? settings.delay : 0),
                replay = 'replay' in settings ? settings.replay : false,
                stagger = 'stagger' in settings ? (parseInt(settings.stagger) >= 0 ? parseInt(settings.stagger) : false) : false,
                staggerOrder = 'staggerOrder' in settings ? settings.staggerOrder : 'default',
                staggerSelector = 'staggerSelector' in settings ? settings.staggerSelector : null,
                threshold = parseInt('threshold' in settings ? settings.threshold : 3),
                state = 'state' in settings ? settings.state : null,
                effect = this.effects[style],
                enter, leave, scrollEventThreshold;

            // Disable animations if CARRD_DISABLE_ANIMATION is true
            if (window.CARRD_DISABLE_ANIMATION === true) {
                if (style == 'fade-in-background')
                    $$(selector).forEach(function(e) {
                        e.style.setProperty('--onvisible-background-color', 'rgba(0,0,0,0.001)');
                    });
                return;
            }

            // Map threshold setting to scroll event threshold
            switch (threshold) {
                case 1:
                    scrollEventThreshold = 0;
                    break;
                case 2:
                    scrollEventThreshold = 0.125;
                    break;
                default:
                case 3:
                    scrollEventThreshold = 0.25;
                    break;
                case 4:
                    scrollEventThreshold = 0.375;
                    break;
                case 5:
                    scrollEventThreshold = 0.475;
                    break;
            }

            // Define enter and leave functions based on effect type
            switch (effect.type) {
                default:
                case 'transition':
                    intensity = ((intensity / 10) * 1.75) + 0.25;
                    enter = function(children, staggerDelay = 0) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        transitionOrig = _this.style.transition;
                        _this.style.setProperty('backface-visibility', 'hidden'); // Prevent flickering
                        _this.style.transition = effect.transition.apply(_this, [speed / 1000, (delay + staggerDelay) / 1000]);
                        effect.play.apply(_this, [intensity, !!children]);
                        setTimeout(function() {
                            _this.style.removeProperty('backface-visibility');
                            _this.style.transition = transitionOrig;
                        }, (speed + delay + staggerDelay) * 2);
                    };
                    leave = function(children) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        transitionOrig = _this.style.transition;
                        _this.style.setProperty('backface-visibility', 'hidden'); // Prevent flickering
                        _this.style.transition = effect.transition.apply(_this, [speed / 1000]);
                        effect.rewind.apply(_this, [intensity, !!children]);
                        setTimeout(function() {
                            _this.style.removeProperty('backface-visibility');
                            _this.style.transition = transitionOrig;
                        }, speed * 2);
                    };
                    break;
                case 'animate':
                    enter = function(children, staggerDelay = 0) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        setTimeout(() => {
                            effect.play.apply(_this, []);
                            _this.animate(effect.keyframes.apply(_this, [intensity]),
                                effect.options.apply(_this, [speed, delay]));
                        }, delay + staggerDelay);
                    };
                    leave = function(children) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        let a = _this.animate(effect.keyframes.apply(_this, [intensity]),
                            effect.options.apply(_this, [speed, delay]));
                        a.reverse();
                        a.addEventListener('finish', () => {
                            effect.rewind.apply(_this, []);
                        });
                    };
                    break;
                case 'manual':
                    enter = function(children, staggerDelay = 0) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        effect.play.apply(_this, [speed / 1000, (delay + staggerDelay) / 1000, intensity]);
                    };
                    leave = function(children) {
                        var _this = this,
                            transitionOrig;
                        if (effect.target)
                            _this = this.querySelector(effect.target);
                        effect.rewind.apply(_this, [intensity, !!children]);
                    };
                    break;
            }

            // Apply animations to all matching elements
            $$(selector).forEach(function(e) {
                var children, targetElement, triggerElement;

                // Expand text nodes for stagger effect if needed
                if (stagger !== false && staggerSelector == ':scope > *')
                    _this.expandTextNodes(e);

                // Determine children for stagger or target element for direct animation
                children = (stagger !== false && staggerSelector) ? e.querySelectorAll(staggerSelector) : null;
                if (effect.target)
                    targetElement = e.querySelector(effect.target);
                else
                    targetElement = e;

                // Rewind (reset) initial state of elements
                if (children)
                    children.forEach(function(targetElement) {
                        effect.rewind.apply(targetElement, [intensity, true]);
                    });
                else
                    effect.rewind.apply(targetElement, [intensity]);

                // Determine the trigger element for scroll events
                triggerElement = e;
                if (e.parentNode) {
                    if (e.parentNode.dataset.onvisibleTrigger)
                        triggerElement = e.parentNode;
                    else if (e.parentNode.parentNode) {
                        if (e.parentNode.parentNode.dataset.onvisibleTrigger)
                            triggerElement = e.parentNode.parentNode;
                    }
                }

                // Add to scroll events for visibility tracking
                scrollEvents.add({
                    element: e,
                    triggerElement: triggerElement,
                    initialState: state,
                    threshold: scrollEventThreshold,
                    enter: children ? function() {
                        var staggerDelay = 0,
                            childHandler = function(e) {
                                enter.apply(e, [children, staggerDelay]);
                                staggerDelay += stagger;
                            },
                            a;

                        if (staggerOrder == 'default') {
                            children.forEach(childHandler);
                        } else {
                            a = Array.from(children);
                            switch (staggerOrder) {
                                case 'reverse':
                                    a.reverse();
                                    break;
                                case 'random':
                                    a.sort(function() {
                                        return Math.random() - 0.5;
                                    });
                                    break;
                            }
                            a.forEach(childHandler);
                        }
                    } : enter,
                    leave: (replay ? (children ? function() {
                        children.forEach(function(e) {
                            leave.apply(e, [children]);
                        });
                    } : leave) : null),
                });
            });
        },

        // Helper to wrap text nodes in <text-node> for staggering
        expandTextNodes: function(e) {
            var s, i, w, x;
            for (i = 0; i < e.childNodes.length; i++) {
                x = e.childNodes[i];
                if (x.nodeType != Node.TEXT_NODE)
                    continue;
                s = x.nodeValue;
                s = s.replace(this.regex, function(x, a) {
                    return '<text-node>' + escapeHtml(a) + '</text-node>';
                });
                w = document.createElement('text-node');
                w.innerHTML = s;
                x.replaceWith(w);
                while (w.childNodes.length > 0) {
                    w.parentNode.insertBefore(w.childNodes[0], w);
                }
                w.parentNode.removeChild(w);
            }
        },
    };

    // Add specific on-visible animations
    onvisible.add('h1.style5, h2.style5, h3.style5, p.style5', {
        style: 'fade-left',
        speed: 1000,
        intensity: 5,
        threshold: 3,
        delay: 0,
        replay: false
    });
    onvisible.add('h1.style3, h2.style3, h3.style3, p.style3', {
        style: 'fade-in',
        speed: 1000,
        intensity: 5,
        threshold: 3,
        delay: 0,
        replay: false
    });
    onvisible.add('.buttons.style2', {
        style: 'fade-right',
        speed: 1000,
        intensity: 5,
        threshold: 3,
        delay: 0,
        replay: false
    });
    onvisible.add('.icons.style2', {
        style: 'fade-down',
        speed: 1000,
        intensity: 2,
        threshold: 3,
        delay: 0,
        stagger: 125,
        staggerSelector: ':scope > li',
        replay: false
    });
    onvisible.add('.buttons.style1', {
        style: 'fade-right',
        speed: 1000,
        intensity: 5,
        threshold: 3,
        delay: 0,
        replay: false
    });

    // Run ready functions
    ready.run();
})();