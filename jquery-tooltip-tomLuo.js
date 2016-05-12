/**
 * jQuery tooltip
 * @author tomLuo
 *
 * This package is distributed under the BSD license.
 * For full license information, see LICENSE.TXT
 *
 * Based on easy tooltip, use for bo image/title
 $("[class=toolImg]").tooltip(); //show image
 $("[title^=header\\=]").tooltip({type: "html"}); //show title and body
 $("[class^=toolTxt]").tooltip({type: "tooltip"});   //show text
 *
 **/

(function (window, document, $, undefined) {
    "use strict";
    String.prototype.format = function (args) {
        if (arguments.length > 0) {
            var result = this;
            if (arguments.length == 1 && typeof (args) == "object") {
                for (var key in args) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
            else {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] == undefined) {
                        return "";
                    }
                    else {
                        var reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
            return result;
        }
        else {
            return this;
        }
    };
    var H = $("html"),
        W = $(window),
        D = $(document), T = $.tooltip = function () {
            T.open.apply(this, arguments);
        },
        isTouch = document.createTouch !== undefined,
        between = function (s, prefix, suffix) {    //tom add on July 27,2012
            var i = s.indexOf(prefix);
            if (i < 0)return '';
            s = s.substring(i + prefix.length);
            if (suffix) {
                i = s.lastIndexOf(suffix);
                if (i < 0)return '';
                s = s.substring(0, i);
            }
            return s;
        },format = function (s,args) {
        if (arguments.length > 0) {
            var result = s;
            if (arguments.length == 1 && typeof (args) == "object") {
                for (var key in args) {
                    var reg = new RegExp("({" + key + "})", "g");
                    result = result.replace(reg, args[key]);
                }
            }
            else {
                for (var i = 0; i < arguments.length; i++) {
                    if (arguments[i] == undefined) {
                        return "";
                    }
                    else {
                        var reg = new RegExp("({[" + i + "]})", "g");
                        result = result.replace(reg, arguments[i]);
                    }
                }
            }
            return result;
        }
        else {
            return s;
        }
    };
    $.extend(T, {
        // The current version of tooltip
        version: '1.0.0',
        defaults: {
            nb: 0, target: null,
            content: null,
            content_processed: false,
            quarter_choosed: false,
            last_mouse_x: null,
            last_mouse_y: null,
            type: null,
            best_quarter: null,
            window_limits: null,
            offset: 15,
            wrapCSS: '',
            // HTML templates
            tpl: {
                wrap: '<div id="tooltip" class="fancybox-wrap" tabIndex="-1"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
                image: '<img class="fancybox-image tooltip-img" src="{0}" alt="" />',
                image_with_title: '<div class="fancybox-title fancybox-title-over-wrap"><div>{0}</div></div>',
                html: "<div class='ui-tooltip'>{0}</div>",
                html_title: '<div class="tooltip-title">{0}</div><div class="tooltip-content">{1}</div>'

            }, trigger: {       //touchmove
                show: isTouch ? 'touchstart' : 'mouseenter',
                hide: isTouch ? 'touchend' : 'mouseleave',
                move: isTouch ? 'touchmove' : 'mousemove'
            }
        }, onMouseOut: function (e, opts) {
            var e = e || window.event, elem = opts.target, tip = opts.content;
            opts.content_processed = false;
            opts.quarter_choosed = false;
            //means during leave time, ajax set title again
            if (elem.attr('original-title') || typeof (elem.attr('title')) !== 'string') {
                elem.attr('title', elem.attr('original-title') || '').removeAttr('original-title');
            }
            tip.removeClass("fancybox-opened").addClass("fancybox-tmp");
            e.stopPropagation();
            return false;
        }, onMouseMove: function (e, opts) {
            var e = e || window.event, tip = opts.content;
            if (opts.quarter_choosed) {
                if (isTouch) {
                    var t = e.originalEvent.touches[0]
                    opts.last_mouse_x = t.pageX;
                    opts.last_mouse_y = t.pageY;
                } else {
                    if (e.pageX) {
                        opts.last_mouse_x = e.pageX;
                    }
                    if (e.pageY) {
                        opts.last_mouse_y = e.pageY;
                    }
                }
                var top, left, offset, window_width, window_height;
                offset = opts.offset;
                window_width = $(window).width();
                window_height = $(window).height();
                // Calculate real mouse position with reference to scroll
                var real_mouse_x = opts.last_mouse_x - $(window).scrollLeft();
                var real_mouse_y = opts.last_mouse_y - $(window).scrollTop();

                switch (opts.best_quarter) {
                    case 'nw':
                        top = real_mouse_y - offset - opts.content_height;
                        left = real_mouse_x - offset - opts.content_width;
                        break;

                    case 'ne':
                        top = real_mouse_y - offset - opts.content_height;
                        left = real_mouse_x + offset;
                        break;


                    case 'sw':
                        top = real_mouse_y + offset;
                        left = real_mouse_x - offset - opts.content_width;
                        break;

                    case 'se':
                    default:
                        top = real_mouse_y + offset;
                        left = real_mouse_x + offset;

                }
                // try to not get of the windows
                if (top < opts.window_limits['north']) {
                    top = opts.window_limits['north'];
                } else if (top > opts.window_limits['south']) {
                    top = opts.window_limits['south'];
                }
                if (left < opts.window_limits['west']) {
                    left = opts.window_limits['west'];
                } else if (left > opts.window_limits['east']) {
                    left = opts.window_limits['east'];
                }
                tip.css({'top': top, 'left': left});
            }
            e.stopPropagation();
            return false;
        }, chooseQuarter: function (e, opts) {
            var e = e || window.event, tip = inner_obj = opts.content, elem = opts.target;
            var window_limits, target_pos, available_way, inner_obj;
            // set content properties
            // opts.content.show();


            if (opts.type == 'image') {
                inner_obj = tip.find('div:first-child');
            } else if (opts.type == 'html') {
                inner_obj = tip.find('div.tooltip-content');
            }
            opts.content_height = inner_obj.outerHeight(true);
            opts.content_width = inner_obj.outerWidth(true);

            // opts.content.hide();

            // get window limits
            window_limits = [];
            window_limits['south'] = $(window).height() - opts.content_height;
            window_limits['east'] = $(window).width() - opts.content_width;
            window_limits['north'] = 0;
            window_limits['west'] = 0;

            // get target position (max south, east, north, west)
            target_pos = [];
            target_pos['south'] = elem.offset().top + elem.outerHeight() - $(window).scrollTop();
            target_pos['east'] = elem.offset().left + elem.outerWidth() - $(window).scrollLeft();
            target_pos['north'] = elem.offset().top - $(window).scrollTop();
            target_pos['west'] = elem.offset().left - $(window).scrollLeft();

            // get available_way to display complet tooltip
            available_way = [];
            available_way['south'] = target_pos['south'] < window_limits['south'];
            available_way['east'] = target_pos['east'] < window_limits['east'];
            available_way['north'] = (target_pos['north'] - opts.content_height) > window_limits['north'];
            available_way['west'] = (target_pos['west'] - opts.content_width) > window_limits['west'];

            // try to display on south-east
            if (available_way['south'] && available_way['east']) {
                opts.best_quarter = 'se';
            } else {
                var vertical_way, horizontal_way;
                vertical_way = 's';
                horizontal_way = 'e';

                if (!available_way['south']) {
                    // north is there a better way ?
                    if (available_way['north']) {
                        vertical_way = 'n';
                    } else if (target_pos['north'] > ($(window).height() - target_pos['south'])) {
                        vertical_way = 'n';
                    }
                }

                if (!available_way['east']) {
                    // west is there a better way ?
                    if (available_way['west']) {
                        horizontal_way = 'w';
                    } else if (target_pos['west'] > ($(window).width() - target_pos['east'])) {
                        horizontal_way = 'w';
                    }
                }

                // set best_quarter to onMouseMove event.
                opts.best_quarter = vertical_way + horizontal_way;
            }

            // set window properties
            opts.window_limits = window_limits;
            opts.quarter_choosed = true;
        }, //TOM modify jquery tooltip plugin on July 30, 2014
        applyTooltip: function (opts) {
            var type = opts.type;
            if ($("#tooltip").length <= 0) {
                $(opts.tpl.wrap).appendTo('body');
            }
            var tip = $("#tooltip").addClass('fancybox-wrap fancybox-' + (isTouch ? 'mobile' : 'desktop') + ' fancybox-type-' + (type == "image" ? 'image' : 'inline') + ' fancybox-tmp '),
                skinCss = tip.find(".fancybox-skin").css({"padding": "0px", "width": "auto", "height": "auto"}),
                c = tip.find(".fancybox-inner").empty(),
                elem = opts.target,  //当前触发元素
                title;
            opts.content = tip;

            if (elem.attr('title') || typeof (elem.attr('original-title')) !== 'string') {
                title = elem.attr('title');

                elem.attr('original-title', elem.attr('title') || '').removeAttr('title');
            }
            if (type == "tooltip") {
                $((opts.tpl.html).format(title)).addClass('ui-tooltip ' + opts.wrapCSS).appendTo(c);
            } else if (type == "html") {
                var subject = between(title, "header=[", "] body=[");
                var content = "";
                if (title.lastIndexOf("\</div>]") == -1) {
                    content = between(title, "] body=[", "]");
                } else {
                    content = between(title, "] body=[", "\</div>]") + "</div>";
                }
                c.html((opts.tpl.html_title).format(subject, content));
            } else if (type == "image") {
                var href = opts.target.attr('href');//.replace(new RegExp('/SMALLPICS/'), '/BigPic/');
                c.html((opts.tpl.image).format(href));
                if (title)$((opts.tpl.image_with_title).format(title)).appendTo(c);
                skinCss.css({"padding": "14px", "width": "auto", "height": "auto"});
            }
            tip.removeClass("fancybox-tmp").addClass("fancybox-opened").bind("click", function (e, ui) {
                T.onMouseOut(e, opts);
            }); //for pad device
        }
    });
    $.fn.tooltip = function (options) {
        options = options || {};
        var opts = $.extend({}, T.defaults, options);
        opts.type = opts.type || "image";
        var selector = this.selector || '', that = $(this), run = function (e) {
            e = e || window.event;
            var what = $(this).blur();
            $(this).unbind(opts.trigger.move).bind(opts.trigger.move, function (e, ui) {
                T.onMouseMove(e, opts);
            });
            $(this).unbind(opts.trigger.hide).bind(opts.trigger.hide, function (e, ui) {
                T.onMouseOut(e, opts);
            });
            opts.target = $(this);
            if (!opts.content_processed) {
                T.applyTooltip(opts);
                opts.content_processed = true;
            }
            // chose best quarter to display tooltips on mouse over
            T.chooseQuarter(e, opts);
            T.onMouseMove(e, opts);
            e.stopPropagation();
            return false;
        };
        if (!selector) {
            that.unbind(opts.trigger.show + '.tp-start').bind(opts.trigger.show + '.tp-start', run);  //重新进行事件绑定
        } else {
            D.undelegate(selector, opts.trigger.show + '.tp-start').delegate(selector, opts.trigger.show + '.tp-start', run);
        }
        return this;


    };

}(window, document, jQuery));

