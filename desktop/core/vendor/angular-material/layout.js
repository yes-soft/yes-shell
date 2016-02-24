/**
 * Initialization function that validates environment
 * requirements.
 */
angular
    .module('material.core', [
      'ngAnimate',
      'material.core.animate',
      'material.core.layout',
      'material.core.gestures',
      'material.core.theming'
    ])
    .config(MdCoreConfigure)
    .run(DetectNgTouch);


/**
 * Detect if the ng-Touch module is also being used.
 * Warn if detected.
 */
function DetectNgTouch($log, $injector) {
  if ( $injector.has('$swipe') ) {
    var msg = "" +
        "You are using the ngTouch module. \n" +
        "Angular Material already has mobile click, tap, and swipe support... \n" +
        "ngTouch is not supported with Angular Material!";
    $log.warn(msg);
  }
}


function MdCoreConfigure($provide, $mdThemingProvider) {

  $provide.decorator('$$rAF', ["$delegate", rAFDecorator]);

  $mdThemingProvider.theme('default')
      .primaryPalette('indigo')
      .accentPalette('pink')
      .warnPalette('deep-orange')
      .backgroundPalette('grey');
}

function rAFDecorator($delegate) {
  /**
   * Use this to throttle events that come in often.
   * The throttled function will always use the *last* invocation before the
   * coming frame.
   *
   * For example, window resize events that fire many times a second:
   * If we set to use an raf-throttled callback on window resize, then
   * our callback will only be fired once per frame, with the last resize
   * event that happened before that frame.
   *
   * @param {function} callback function to debounce
   */
  $delegate.throttle = function(cb) {
    var queuedArgs, alreadyQueued, queueCb, context;
    return function debounced() {
      queuedArgs = arguments;
      context = this;
      queueCb = cb;
      if (!alreadyQueued) {
        alreadyQueued = true;
        $delegate(function() {
          queueCb.apply(context, Array.prototype.slice.call(queuedArgs));
          alreadyQueued = false;
        });
      }
    };
  };
  return $delegate;
}

angular.module('material.core')
    .factory('$mdConstant', MdConstantFactory);

/**
 * Factory function that creates the grab-bag $mdConstant service.
 * @ngInject
 */
function MdConstantFactory($sniffer) {

  var webkit = /webkit/i.test($sniffer.vendorPrefix);
  function vendorProperty(name) {
    return webkit ?  ('webkit' + name.charAt(0).toUpperCase() + name.substring(1)) : name;
  }

  return {
    KEY_CODE: {
      COMMA: 188,
      ENTER: 13,
      ESCAPE: 27,
      SPACE: 32,
      PAGE_UP: 33,
      PAGE_DOWN: 34,
      END: 35,
      HOME: 36,
      LEFT_ARROW : 37,
      UP_ARROW : 38,
      RIGHT_ARROW : 39,
      DOWN_ARROW : 40,
      TAB : 9,
      BACKSPACE: 8,
      DELETE: 46
    },
    CSS: {
      /* Constants */
      TRANSITIONEND: 'transitionend' + (webkit ? ' webkitTransitionEnd' : ''),
      ANIMATIONEND: 'animationend' + (webkit ? ' webkitAnimationEnd' : ''),

      TRANSFORM: vendorProperty('transform'),
      TRANSFORM_ORIGIN: vendorProperty('transformOrigin'),
      TRANSITION: vendorProperty('transition'),
      TRANSITION_DURATION: vendorProperty('transitionDuration'),
      ANIMATION_PLAY_STATE: vendorProperty('animationPlayState'),
      ANIMATION_DURATION: vendorProperty('animationDuration'),
      ANIMATION_NAME: vendorProperty('animationName'),
      ANIMATION_TIMING: vendorProperty('animationTimingFunction'),
      ANIMATION_DIRECTION: vendorProperty('animationDirection')
    },
    /**
     * As defined in core/style/variables.scss
     *
     * $layout-breakpoint-xs:     600px !default;
     * $layout-breakpoint-sm:     960px !default;
     * $layout-breakpoint-md:     1280px !default;
     * $layout-breakpoint-lg:     1920px !default;
     *
     */
    MEDIA: {
      'xs'    : '(max-width: 599px)'                         ,
      'gt-xs' : '(min-width: 600px)'                         ,
      'sm'    : '(min-width: 600px) and (max-width: 959px)'  ,
      'gt-sm' : '(min-width: 960px)'                         ,
      'md'    : '(min-width: 960px) and (max-width: 1279px)' ,
      'gt-md' : '(min-width: 1280px)'                        ,
      'lg'    : '(min-width: 1280px) and (max-width: 1919px)',
      'gt-lg' : '(min-width: 1920px)'                        ,
      'xl'    : '(min-width: 1920px)'
    },
    MEDIA_PRIORITY: [
      'xl',
      'gt-lg',
      'lg',
      'gt-md',
      'md',
      'gt-sm',
      'sm',
      'gt-xs',
      'xs'
    ]
  };
}

angular
    .module('material.core')
    .config( function($provide){
      $provide.decorator('$mdUtil', ['$delegate', function ($delegate){
        /**
         * Inject the iterator facade to easily support iteration and accessors
         * @see iterator below
         */
        $delegate.iterator = MdIterator;

        return $delegate;
      }
      ]);
    });

/**
 * iterator is a list facade to easily support iteration and accessors
 *
 * @param items Array list which this iterator will enumerate
 * @param reloop Boolean enables iterator to consider the list as an endless reloop
 */
function MdIterator(items, reloop) {
  var trueFn = function() { return true; };

  if (items && !angular.isArray(items)) {
    items = Array.prototype.slice.call(items);
  }

  reloop = !!reloop;
  var _items = items || [ ];

  // Published API
  return {
    items: getItems,
    count: count,

    inRange: inRange,
    contains: contains,
    indexOf: indexOf,
    itemAt: itemAt,

    findBy: findBy,

    add: add,
    remove: remove,

    first: first,
    last: last,
    next: angular.bind(null, findSubsequentItem, false),
    previous: angular.bind(null, findSubsequentItem, true),

    hasPrevious: hasPrevious,
    hasNext: hasNext

  };

  /**
   * Publish copy of the enumerable set
   * @returns {Array|*}
   */
  function getItems() {
    return [].concat(_items);
  }

  /**
   * Determine length of the list
   * @returns {Array.length|*|number}
   */
  function count() {
    return _items.length;
  }

  /**
   * Is the index specified valid
   * @param index
   * @returns {Array.length|*|number|boolean}
   */
  function inRange(index) {
    return _items.length && ( index > -1 ) && (index < _items.length );
  }

  /**
   * Can the iterator proceed to the next item in the list; relative to
   * the specified item.
   *
   * @param item
   * @returns {Array.length|*|number|boolean}
   */
  function hasNext(item) {
    return item ? inRange(indexOf(item) + 1) : false;
  }

  /**
   * Can the iterator proceed to the previous item in the list; relative to
   * the specified item.
   *
   * @param item
   * @returns {Array.length|*|number|boolean}
   */
  function hasPrevious(item) {
    return item ? inRange(indexOf(item) - 1) : false;
  }

  /**
   * Get item at specified index/position
   * @param index
   * @returns {*}
   */
  function itemAt(index) {
    return inRange(index) ? _items[index] : null;
  }

  /**
   * Find all elements matching the key/value pair
   * otherwise return null
   *
   * @param val
   * @param key
   *
   * @return array
   */
  function findBy(key, val) {
    return _items.filter(function(item) {
      return item[key] === val;
    });
  }

  /**
   * Add item to list
   * @param item
   * @param index
   * @returns {*}
   */
  function add(item, index) {
    if ( !item ) return -1;

    if (!angular.isNumber(index)) {
      index = _items.length;
    }

    _items.splice(index, 0, item);

    return indexOf(item);
  }

  /**
   * Remove item from list...
   * @param item
   */
  function remove(item) {
    if ( contains(item) ){
      _items.splice(indexOf(item), 1);
    }
  }

  /**
   * Get the zero-based index of the target item
   * @param item
   * @returns {*}
   */
  function indexOf(item) {
    return _items.indexOf(item);
  }

  /**
   * Boolean existence check
   * @param item
   * @returns {boolean}
   */
  function contains(item) {
    return item && (indexOf(item) > -1);
  }

  /**
   * Return first item in the list
   * @returns {*}
   */
  function first() {
    return _items.length ? _items[0] : null;
  }

  /**
   * Return last item in the list...
   * @returns {*}
   */
  function last() {
    return _items.length ? _items[_items.length - 1] : null;
  }

  /**
   * Find the next item. If reloop is true and at the end of the list, it will go back to the
   * first item. If given, the `validate` callback will be used to determine whether the next item
   * is valid. If not valid, it will try to find the next item again.
   *
   * @param {boolean} backwards Specifies the direction of searching (forwards/backwards)
   * @param {*} item The item whose subsequent item we are looking for
   * @param {Function=} validate The `validate` function
   * @param {integer=} limit The recursion limit
   *
   * @returns {*} The subsequent item or null
   */
  function findSubsequentItem(backwards, item, validate, limit) {
    validate = validate || trueFn;

    var curIndex = indexOf(item);
    while (true) {
      if (!inRange(curIndex)) return null;

      var nextIndex = curIndex + (backwards ? -1 : 1);
      var foundItem = null;
      if (inRange(nextIndex)) {
        foundItem = _items[nextIndex];
      } else if (reloop) {
        foundItem = backwards ? last() : first();
        nextIndex = indexOf(foundItem);
      }

      if ((foundItem === null) || (nextIndex === limit)) return null;
      if (validate(foundItem)) return foundItem;

      if (angular.isUndefined(limit)) limit = nextIndex;

      curIndex = nextIndex;
    }
  }
}


angular.module('material.core')
    .factory('$mdMedia', mdMediaFactory);

/**
 * @ngdoc service
 * @name $mdMedia
 * @module material.core
 *
 * @description
 * `$mdMedia` is used to evaluate whether a given media query is true or false given the
 * current device's screen / window size. The media query will be re-evaluated on resize, allowing
 * you to register a watch.
 *
 * `$mdMedia` also has pre-programmed support for media queries that match the layout breakpoints:
 *
 *  <table class="md-api-table">
 *    <thead>
 *    <tr>
 *      <th>Breakpoint</th>
 *      <th>mediaQuery</th>
 *    </tr>
 *    </thead>
 *    <tbody>
 *    <tr>
 *      <td>xs</td>
 *      <td>(max-width: 599px)</td>
 *    </tr>
 *    <tr>
 *      <td>gt-xs</td>
 *      <td>(min-width: 600px)</td>
 *    </tr>
 *    <tr>
 *      <td>sm</td>
 *      <td>(min-width: 600px) and (max-width: 959px)</td>
 *    </tr>
 *    <tr>
 *      <td>gt-sm</td>
 *      <td>(min-width: 960px)</td>
 *    </tr>
 *    <tr>
 *      <td>md</td>
 *      <td>(min-width: 960px) and (max-width: 1279px)</td>
 *    </tr>
 *    <tr>
 *      <td>gt-md</td>
 *      <td>(min-width: 1280px)</td>
 *    </tr>
 *    <tr>
 *      <td>lg</td>
 *      <td>(min-width: 1280px) and (max-width: 1919px)</td>
 *    </tr>
 *    <tr>
 *      <td>gt-lg</td>
 *      <td>(min-width: 1920px)</td>
 *    </tr>
 *    <tr>
 *      <td>xl</td>
 *      <td>(min-width: 1920px)</td>
 *    </tr>
 *    </tbody>
 *  </table>
 *
 *  See Material Design's <a href="https://www.google.com/design/spec/layout/adaptive-ui.html">Layout - Adaptive UI</a> for more details.
 *
 *  <a href="https://www.google.com/design/spec/layout/adaptive-ui.html">
 *  <img src="https://material-design.storage.googleapis.com/publish/material_v_4/material_ext_publish/0B8olV15J7abPSGFxemFiQVRtb1k/layout_adaptive_breakpoints_01.png" width="100%" height="100%"></img>
 *  </a>
 *
 * @returns {boolean} a boolean representing whether or not the given media query is true or false.
 *
 * @usage
 * <hljs lang="js">
 * app.controller('MyController', function($mdMedia, $scope) {
 *   $scope.$watch(function() { return $mdMedia('lg'); }, function(big) {
 *     $scope.bigScreen = big;
 *   });
 *
 *   $scope.screenIsSmall = $mdMedia('sm');
 *   $scope.customQuery = $mdMedia('(min-width: 1234px)');
 *   $scope.anotherCustom = $mdMedia('max-width: 300px');
 * });
 * </hljs>
 */

function mdMediaFactory($mdConstant, $rootScope, $window) {
  var queries = {};
  var mqls = {};
  var results = {};
  var normalizeCache = {};

  $mdMedia.getResponsiveAttribute = getResponsiveAttribute;
  $mdMedia.getQuery = getQuery;
  $mdMedia.watchResponsiveAttributes = watchResponsiveAttributes;

  return $mdMedia;

  function $mdMedia(query) {
    var validated = queries[query];
    if (angular.isUndefined(validated)) {
      validated = queries[query] = validate(query);
    }

    var result = results[validated];
    if (angular.isUndefined(result)) {
      result = add(validated);
    }

    return result;
  }

  function validate(query) {
    return $mdConstant.MEDIA[query] ||
        ((query.charAt(0) !== '(') ? ('(' + query + ')') : query);
  }

  function add(query) {
    var result = mqls[query];
    if ( !result ) {
      result = mqls[query] = $window.matchMedia(query);
    }

    result.addListener(onQueryChange);
    return (results[result.media] = !!result.matches);
  }

  function onQueryChange(query) {
    $rootScope.$evalAsync(function() {
      results[query.media] = !!query.matches;
    });
  }

  function getQuery(name) {
    return mqls[name];
  }

  function getResponsiveAttribute(attrs, attrName) {
    for (var i = 0; i < $mdConstant.MEDIA_PRIORITY.length; i++) {
      var mediaName = $mdConstant.MEDIA_PRIORITY[i];
      if (!mqls[queries[mediaName]].matches) {
        continue;
      }

      var normalizedName = getNormalizedName(attrs, attrName + '-' + mediaName);
      if (attrs[normalizedName]) {
        return attrs[normalizedName];
      }
    }

    // fallback on unprefixed
    return attrs[getNormalizedName(attrs, attrName)];
  }

  function watchResponsiveAttributes(attrNames, attrs, watchFn) {
    var unwatchFns = [];
    attrNames.forEach(function(attrName) {
      var normalizedName = getNormalizedName(attrs, attrName);
      if (angular.isDefined(attrs[normalizedName])) {
        unwatchFns.push(
            attrs.$observe(normalizedName, angular.bind(void 0, watchFn, null)));
      }

      for (var mediaName in $mdConstant.MEDIA) {
        normalizedName = getNormalizedName(attrs, attrName + '-' + mediaName);
        if (angular.isDefined(attrs[normalizedName])) {
          unwatchFns.push(
              attrs.$observe(normalizedName, angular.bind(void 0, watchFn, mediaName)));
        }
      }
    });

    return function unwatch() {
      unwatchFns.forEach(function(fn) { fn(); })
    };
  }

  // Improves performance dramatically
  function getNormalizedName(attrs, attrName) {
    return normalizeCache[attrName] ||
        (normalizeCache[attrName] = attrs.$normalize(attrName));
  }
}

/*
 * This var has to be outside the angular factory, otherwise when
 * there are multiple material apps on the same page, each app
 * will create its own instance of this array and the app's IDs
 * will not be unique.
 */
var nextUniqueId = 0;

/**
 * @ngdoc module
 * @name material.core.util
 * @description
 * Util
 */
angular
    .module('material.core')
    .factory('$mdUtil', UtilFactory);

function UtilFactory($document, $timeout, $compile, $rootScope, $$mdAnimate, $interpolate, $log, $rootElement, $window) {
  // Setup some core variables for the processTemplate method
  var startSymbol = $interpolate.startSymbol(),
      endSymbol = $interpolate.endSymbol(),
      usesStandardSymbols = ((startSymbol === '{{') && (endSymbol === '}}'));

  /**
   * Checks if the target element has the requested style by key
   * @param {DOMElement|JQLite} target Target element
   * @param {string} key Style key
   * @param {string=} expectedVal Optional expected value
   * @returns {boolean} Whether the target element has the style or not
   */
  var hasComputedStyle = function (target, key, expectedVal) {
    var hasValue = false;

    if ( target && target.length  ) {
      var computedStyles = $window.getComputedStyle(target[0]);
      hasValue = angular.isDefined(computedStyles[key]) && (expectedVal ? computedStyles[key] == expectedVal : true);
    }

    return hasValue;
  };

  var $mdUtil = {
    dom: {},
    now: window.performance ?
        angular.bind(window.performance, window.performance.now) : Date.now || function() {
      return new Date().getTime();
    },

    clientRect: function(element, offsetParent, isOffsetRect) {
      var node = getNode(element);
      offsetParent = getNode(offsetParent || node.offsetParent || document.body);
      var nodeRect = node.getBoundingClientRect();

      // The user can ask for an offsetRect: a rect relative to the offsetParent,
      // or a clientRect: a rect relative to the page
      var offsetRect = isOffsetRect ?
          offsetParent.getBoundingClientRect() :
      {left: 0, top: 0, width: 0, height: 0};
      return {
        left: nodeRect.left - offsetRect.left,
        top: nodeRect.top - offsetRect.top,
        width: nodeRect.width,
        height: nodeRect.height
      };
    },
    offsetRect: function(element, offsetParent) {
      return $mdUtil.clientRect(element, offsetParent, true);
    },

    // Annoying method to copy nodes to an array, thanks to IE
    nodesToArray: function(nodes) {
      nodes = nodes || [];

      var results = [];
      for (var i = 0; i < nodes.length; ++i) {
        results.push(nodes.item(i));
      }
      return results;
    },

    /**
     * Calculate the positive scroll offset
     * TODO: Check with pinch-zoom in IE/Chrome;
     *       https://code.google.com/p/chromium/issues/detail?id=496285
     */
    scrollTop: function(element) {
      element = angular.element(element || $document[0].body);

      var body = (element[0] == $document[0].body) ? $document[0].body : undefined;
      var scrollTop = body ? body.scrollTop + body.parentElement.scrollTop : 0;

      // Calculate the positive scroll offset
      return scrollTop || Math.abs(element[0].getBoundingClientRect().top);
    },

    /**
     * @ngdoc directive
     * @name mdAutofocus
     * @module material.core.util
     *

     *
     * @description
     * `$mdUtil.findFocusTarget()` provides an optional way to identify the focused element when a dialog, bottomsheet, sideNav
     * or other element opens. This is optional attribute finds a nested element with the mdAutoFocus attribute and optional
     * expression. An expression may be specified as the directive value; to enable conditional activation of the autoFocus.
     *
     * @usage
     * ### Dialog
     * <hljs lang="html">
     * <md-dialog>
     *   <form>
     *     <md-input-container>
     *       <label for="testInput">Label</label>
     *       <input id="testInput" type="text" md-autofocus>
     *     </md-input-container>
     *   </form>
     * </md-dialog>
     * </hljs>
     *
     * ### Bottomsheet
     * <hljs lang="html">
     * <md-bottom-sheet class="md-list md-has-header">
     *  <md-subheader>Comment Actions</md-subheader>
     *  <md-list>
     *    <md-list-item ng-repeat="item in items">
     *
     *      <md-button md-autofocus="$index == 2">
     *        <md-icon md-svg-src="{{item.icon}}"></md-icon>
     *        <span class="md-inline-list-icon-label">{{ item.name }}</span>
     *      </md-button>
     *
     *    </md-list-item>
     *  </md-list>
     * </md-bottom-sheet>
     * </hljs>
     *
     * ### Autocomplete
     * <hljs lang="html">
     *   <md-autocomplete
     *       md-autofocus
     *       md-selected-item="selectedItem"
     *       md-search-text="searchText"
     *       md-items="item in getMatches(searchText)"
     *       md-item-text="item.display">
     *     <span md-highlight-text="searchText">{{item.display}}</span>
     *   </md-autocomplete>
     * </hljs>
     *
     * ### Sidenav
     * <hljs lang="html">
     * <div layout="row" ng-controller="MyController">
     *   <md-sidenav md-component-id="left" class="md-sidenav-left">
     *     Left Nav!
     *   </md-sidenav>
     *
     *   <md-content>
     *     Center Content
     *     <md-button ng-click="openLeftMenu()">
     *       Open Left Menu
     *     </md-button>
     *   </md-content>
     *
     *   <md-sidenav md-component-id="right"
     *     md-is-locked-open="$mdMedia('min-width: 333px')"
     *     class="md-sidenav-right">
     *     <form>
     *       <md-input-container>
     *         <label for="testInput">Test input</label>
     *         <input id="testInput" type="text"
     *                ng-model="data" md-autofocus>
     *       </md-input-container>
     *     </form>
     *   </md-sidenav>
     * </div>
     * </hljs>
     **/
    findFocusTarget: function(containerEl, attributeVal) {
      var AUTO_FOCUS = '[md-autofocus]';
      var elToFocus;

      elToFocus = scanForFocusable(containerEl, attributeVal || AUTO_FOCUS);

      if ( !elToFocus && attributeVal != AUTO_FOCUS) {
        // Scan for deprecated attribute
        elToFocus = scanForFocusable(containerEl, '[md-auto-focus]');

        if ( !elToFocus ) {
          // Scan for fallback to 'universal' API
          elToFocus = scanForFocusable(containerEl, AUTO_FOCUS);
        }
      }

      return elToFocus;

      /**
       * Can target and nested children for specified Selector (attribute)
       * whose value may be an expression that evaluates to True/False.
       */
      function scanForFocusable(target, selector) {
        var elFound, items = target[0].querySelectorAll(selector);

        // Find the last child element with the focus attribute
        if ( items && items.length ){
          var EXP_ATTR = /\s*\[?([\-a-z]*)\]?\s*/i;
          var matches = EXP_ATTR.exec(selector);
          var attribute = matches ? matches[1] : null;

          items.length && angular.forEach(items, function(it) {
            it = angular.element(it);

            // If the expression evaluates to FALSE, then it is not focusable target
            var focusExpression = it[0].getAttribute(attribute);
            var isFocusable = !focusExpression || !$mdUtil.validateScope(it) ? true :
                (it.scope().$eval(focusExpression) !== false );

            if (isFocusable) elFound = it;
          });
        }
        return elFound;
      }
    },

    // Disables scroll around the passed element.
    disableScrollAround: function(element, parent) {
      $mdUtil.disableScrollAround._count = $mdUtil.disableScrollAround._count || 0;
      ++$mdUtil.disableScrollAround._count;
      if ($mdUtil.disableScrollAround._enableScrolling) return $mdUtil.disableScrollAround._enableScrolling;
      element = angular.element(element);
      var body = $document[0].body,
          restoreBody = disableBodyScroll(),
          restoreElement = disableElementScroll(parent);

      return $mdUtil.disableScrollAround._enableScrolling = function() {
        if (!--$mdUtil.disableScrollAround._count) {
          restoreBody();
          restoreElement();
          delete $mdUtil.disableScrollAround._enableScrolling;
        }
      };

      // Creates a virtual scrolling mask to absorb touchmove, keyboard, scrollbar clicking, and wheel events
      function disableElementScroll(element) {
        element = angular.element(element || body)[0];
        var zIndex = 50;
        var scrollMask = angular.element(
            '<div class="md-scroll-mask" style="z-index: ' + zIndex + '">' +
            '  <div class="md-scroll-mask-bar"></div>' +
            '</div>');
        element.appendChild(scrollMask[0]);

        scrollMask.on('wheel', preventDefault);
        scrollMask.on('touchmove', preventDefault);
        $document.on('keydown', disableKeyNav);

        return function restoreScroll() {
          scrollMask.off('wheel');
          scrollMask.off('touchmove');
          scrollMask[0].parentNode.removeChild(scrollMask[0]);
          $document.off('keydown', disableKeyNav);
          delete $mdUtil.disableScrollAround._enableScrolling;
        };

        // Prevent keypresses from elements inside the body
        // used to stop the keypresses that could cause the page to scroll
        // (arrow keys, spacebar, tab, etc).
        function disableKeyNav(e) {
          //-- temporarily removed this logic, will possibly re-add at a later date
          //if (!element[0].contains(e.target)) {
          //  e.preventDefault();
          //  e.stopImmediatePropagation();
          //}
        }

        function preventDefault(e) {
          e.preventDefault();
        }
      }

      // Converts the body to a position fixed block and translate it to the proper scroll
      // position
      function disableBodyScroll() {
        var htmlNode = body.parentNode;
        var restoreHtmlStyle = htmlNode.getAttribute('style') || '';
        var restoreBodyStyle = body.getAttribute('style') || '';
        var scrollOffset = $mdUtil.scrollTop(body);
        var clientWidth = body.clientWidth;

        if (body.scrollHeight > body.clientHeight + 1) {
          applyStyles(body, {
            position: 'fixed',
            width: '100%',
            top: -scrollOffset + 'px'
          });

          applyStyles(htmlNode, {
            overflowY: 'scroll'
          });
        }

        if (body.clientWidth < clientWidth) applyStyles(body, {overflow: 'hidden'});

        return function restoreScroll() {
          body.setAttribute('style', restoreBodyStyle);
          htmlNode.setAttribute('style', restoreHtmlStyle);
          body.scrollTop = scrollOffset;
          htmlNode.scrollTop = scrollOffset;
        };
      }

      function applyStyles(el, styles) {
        for (var key in styles) {
          el.style[key] = styles[key];
        }
      }
    },
    enableScrolling: function() {
      var method = this.disableScrollAround._enableScrolling;
      method && method();
    },
    floatingScrollbars: function() {
      if (this.floatingScrollbars.cached === undefined) {
        var tempNode = angular.element('<div style="width: 100%; z-index: -1; position: absolute; height: 35px; overflow-y: scroll"><div style="height: 60px;"></div></div>');
        $document[0].body.appendChild(tempNode[0]);
        this.floatingScrollbars.cached = (tempNode[0].offsetWidth == tempNode[0].childNodes[0].offsetWidth);
        tempNode.remove();
      }
      return this.floatingScrollbars.cached;
    },

    // Mobile safari only allows you to set focus in click event listeners...
    forceFocus: function(element) {
      var node = element[0] || element;

      document.addEventListener('click', function focusOnClick(ev) {
        if (ev.target === node && ev.$focus) {
          node.focus();
          ev.stopImmediatePropagation();
          ev.preventDefault();
          node.removeEventListener('click', focusOnClick);
        }
      }, true);

      var newEvent = document.createEvent('MouseEvents');
      newEvent.initMouseEvent('click', false, true, window, {}, 0, 0, 0, 0,
          false, false, false, false, 0, null);
      newEvent.$material = true;
      newEvent.$focus = true;
      node.dispatchEvent(newEvent);
    },

    /**
     * facade to build md-backdrop element with desired styles
     * NOTE: Use $compile to trigger backdrop postLink function
     */
    createBackdrop: function(scope, addClass) {
      return $compile($mdUtil.supplant('<md-backdrop class="{0}">', [addClass]))(scope);
    },

    /**
     * supplant() method from Crockford's `Remedial Javascript`
     * Equivalent to use of $interpolate; without dependency on
     * interpolation symbols and scope. Note: the '{<token>}' can
     * be property names, property chains, or array indices.
     */
    supplant: function(template, values, pattern) {
      pattern = pattern || /\{([^\{\}]*)\}/g;
      return template.replace(pattern, function(a, b) {
        var p = b.split('.'),
            r = values;
        try {
          for (var s in p) {
            if (p.hasOwnProperty(s) ) {
              r = r[p[s]];
            }
          }
        } catch (e) {
          r = a;
        }
        return (typeof r === 'string' || typeof r === 'number') ? r : a;
      });
    },

    fakeNgModel: function() {
      return {
        $fake: true,
        $setTouched: angular.noop,
        $setViewValue: function(value) {
          this.$viewValue = value;
          this.$render(value);
          this.$viewChangeListeners.forEach(function(cb) {
            cb();
          });
        },
        $isEmpty: function(value) {
          return ('' + value).length === 0;
        },
        $parsers: [],
        $formatters: [],
        $viewChangeListeners: [],
        $render: angular.noop
      };
    },

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds.
    // @param wait Integer value of msecs to delay (since last debounce reset); default value 10 msecs
    // @param invokeApply should the $timeout trigger $digest() dirty checking
    debounce: function(func, wait, scope, invokeApply) {
      var timer;

      return function debounced() {
        var context = scope,
            args = Array.prototype.slice.call(arguments);

        $timeout.cancel(timer);
        timer = $timeout(function() {

          timer = undefined;
          func.apply(context, args);

        }, wait || 10, invokeApply);
      };
    },

    // Returns a function that can only be triggered every `delay` milliseconds.
    // In other words, the function will not be called unless it has been more
    // than `delay` milliseconds since the last call.
    throttle: function throttle(func, delay) {
      var recent;
      return function throttled() {
        var context = this;
        var args = arguments;
        var now = $mdUtil.now();

        if (!recent || (now - recent > delay)) {
          func.apply(context, args);
          recent = now;
        }
      };
    },

    /**
     * Measures the number of milliseconds taken to run the provided callback
     * function. Uses a high-precision timer if available.
     */
    time: function time(cb) {
      var start = $mdUtil.now();
      cb();
      return $mdUtil.now() - start;
    },

    /**
     * Create an implicit getter that caches its `getter()`
     * lookup value
     */
    valueOnUse : function (scope, key, getter) {
      var value = null, args = Array.prototype.slice.call(arguments);
      var params = (args.length > 3) ? args.slice(3) : [ ];

      Object.defineProperty(scope, key, {
        get: function () {
          if (value === null) value = getter.apply(scope, params);
          return value;
        }
      });
    },

    /**
     * Get a unique ID.
     *
     * @returns {string} an unique numeric string
     */
    nextUid: function() {
      return '' + nextUniqueId++;
    },

    /**
     * By default AngularJS attaches information about binding and scopes to DOM nodes,
     * and adds CSS classes to data-bound elements. But this information is NOT available
     * when `$compileProvider.debugInfoEnabled(false);`
     *
     * @see https://docs.angularjs.org/guide/production
     */
    validateScope : function(element) {
      var hasScope = element && angular.isDefined(element.scope());
      if ( !hasScope ) {
        $log.warn("element.scope() is not available when 'debug mode' == false. @see https://docs.angularjs.org/guide/production!");
      }

      return hasScope;
    },

    // Stop watchers and events from firing on a scope without destroying it,
    // by disconnecting it from its parent and its siblings' linked lists.
    disconnectScope: function disconnectScope(scope) {
      if (!scope) return;

      // we can't destroy the root scope or a scope that has been already destroyed
      if (scope.$root === scope) return;
      if (scope.$$destroyed) return;

      var parent = scope.$parent;
      scope.$$disconnected = true;

      // See Scope.$destroy
      if (parent.$$childHead === scope) parent.$$childHead = scope.$$nextSibling;
      if (parent.$$childTail === scope) parent.$$childTail = scope.$$prevSibling;
      if (scope.$$prevSibling) scope.$$prevSibling.$$nextSibling = scope.$$nextSibling;
      if (scope.$$nextSibling) scope.$$nextSibling.$$prevSibling = scope.$$prevSibling;

      scope.$$nextSibling = scope.$$prevSibling = null;

    },

    // Undo the effects of disconnectScope above.
    reconnectScope: function reconnectScope(scope) {
      if (!scope) return;

      // we can't disconnect the root node or scope already disconnected
      if (scope.$root === scope) return;
      if (!scope.$$disconnected) return;

      var child = scope;

      var parent = child.$parent;
      child.$$disconnected = false;
      // See Scope.$new for this logic...
      child.$$prevSibling = parent.$$childTail;
      if (parent.$$childHead) {
        parent.$$childTail.$$nextSibling = child;
        parent.$$childTail = child;
      } else {
        parent.$$childHead = parent.$$childTail = child;
      }
    },

    /*
     * getClosest replicates jQuery.closest() to walk up the DOM tree until it finds a matching nodeName
     *
     * @param el Element to start walking the DOM from
     * @param tagName Tag name to find closest to el, such as 'form'
     * @param onlyParent Only start checking from the parent element, not `el`.
     */
    getClosest: function getClosest(el, tagName, onlyParent) {
      if (el instanceof angular.element) el = el[0];
      tagName = tagName.toUpperCase();
      if (onlyParent) el = el.parentNode;
      if (!el) return null;
      do {
        if (el.nodeName === tagName) {
          return el;
        }
      } while (el = el.parentNode);
      return null;
    },

    /**
     * Build polyfill for the Node.contains feature (if needed)
     */
    elementContains: function(node, child) {
      var hasContains = (window.Node && window.Node.prototype && Node.prototype.contains);
      var findFn = hasContains ? angular.bind(node, node.contains) : angular.bind(node, function(arg) {
        // compares the positions of two nodes and returns a bitmask
        return (node === child) || !!(this.compareDocumentPosition(arg) & 16)
      });

      return findFn(child);
    },

    /**
     * Functional equivalent for $element.filter(‘md-bottom-sheet’)
     * useful with interimElements where the element and its container are important...
     *
     * @param {[]} elements to scan
     * @param {string} name of node to find (e.g. 'md-dialog')
     * @param {boolean=} optional flag to allow deep scans; defaults to 'false'.
     * @param {boolean=} optional flag to enable log warnings; defaults to false
     */
    extractElementByName: function(element, nodeName, scanDeep, warnNotFound) {
      var found = scanTree(element);
      if (!found && !!warnNotFound) {
        $log.warn( $mdUtil.supplant("Unable to find node '{0}' in element '{1}'.",[nodeName, element[0].outerHTML]) );
      }

      return angular.element(found || element);

      /**
       * Breadth-First tree scan for element with matching `nodeName`
       */
      function scanTree(element) {
        return scanLevel(element) || (!!scanDeep ? scanChildren(element) : null);
      }

      /**
       * Case-insensitive scan of current elements only (do not descend).
       */
      function scanLevel(element) {
        if ( element ) {
          for (var i = 0, len = element.length; i < len; i++) {
            if (element[i].nodeName.toLowerCase() === nodeName) {
              return element[i];
            }
          }
        }
        return null;
      }

      /**
       * Scan children of specified node
       */
      function scanChildren(element) {
        var found;
        if ( element ) {
          for (var i = 0, len = element.length; i < len; i++) {
            var target = element[i];
            if ( !found ) {
              for (var j = 0, numChild = target.childNodes.length; j < numChild; j++) {
                found = found || scanTree([target.childNodes[j]]);
              }
            }
          }
        }
        return found;
      }

    },

    /**
     * Give optional properties with no value a boolean true if attr provided or false otherwise
     */
    initOptionalProperties: function(scope, attr, defaults) {
      defaults = defaults || {};
      angular.forEach(scope.$$isolateBindings, function(binding, key) {
        if (binding.optional && angular.isUndefined(scope[key])) {
          var attrIsDefined = angular.isDefined(attr[binding.attrName]);
          scope[key] = angular.isDefined(defaults[key]) ? defaults[key] : attrIsDefined;
        }
      });
    },

    /**
     * Alternative to $timeout calls with 0 delay.
     * nextTick() coalesces all calls within a single frame
     * to minimize $digest thrashing
     *
     * @param callback
     * @param digest
     * @returns {*}
     */
    nextTick: function(callback, digest, scope) {
      //-- grab function reference for storing state details
      var nextTick = $mdUtil.nextTick;
      var timeout = nextTick.timeout;
      var queue = nextTick.queue || [];

      //-- add callback to the queue
      queue.push(callback);

      //-- set default value for digest
      if (digest == null) digest = true;

      //-- store updated digest/queue values
      nextTick.digest = nextTick.digest || digest;
      nextTick.queue = queue;

      //-- either return existing timeout or create a new one
      return timeout || (nextTick.timeout = $timeout(processQueue, 0, false));

      /**
       * Grab a copy of the current queue
       * Clear the queue for future use
       * Process the existing queue
       * Trigger digest if necessary
       */
      function processQueue() {
        var skip = scope && scope.$$destroyed;
        var queue = !skip ? nextTick.queue : [];
        var digest = !skip ? nextTick.digest : null;

        nextTick.queue = [];
        nextTick.timeout = null;
        nextTick.digest = false;

        queue.forEach(function(callback) {
          callback();
        });

        if (digest) $rootScope.$digest();
      }
    },

    /**
     * Processes a template and replaces the start/end symbols if the application has
     * overriden them.
     *
     * @param template The template to process whose start/end tags may be replaced.
     * @returns {*}
     */
    processTemplate: function(template) {
      if (usesStandardSymbols) {
        return template;
      } else {
        if (!template || !angular.isString(template)) return template;
        return template.replace(/\{\{/g, startSymbol).replace(/}}/g, endSymbol);
      }
    },

    /**
     * Scan up dom hierarchy for enabled parent;
     */
    getParentWithPointerEvents: function (element) {
      var parent = element.parent();

      // jqLite might return a non-null, but still empty, parent; so check for parent and length
      while (hasComputedStyle(parent, 'pointer-events', 'none')) {
        parent = parent.parent();
      }

      return parent;
    },

    getNearestContentElement: function (element) {
      var current = element.parent()[0];
      // Look for the nearest parent md-content, stopping at the rootElement.
      while (current && current !== $rootElement[0] && current !== document.body && current.nodeName.toUpperCase() !== 'MD-CONTENT') {
        current = current.parentNode;
      }
      return current;
    },

    hasComputedStyle: hasComputedStyle
  };

// Instantiate other namespace utility methods

  $mdUtil.dom.animator = $$mdAnimate($mdUtil);

  return $mdUtil;

  function getNode(el) {
    return el[0] || el;
  }

}

/*
 * Since removing jQuery from the demos, some code that uses `element.focus()` is broken.
 * We need to add `element.focus()`, because it's testable unlike `element[0].focus`.
 */

angular.element.prototype.focus = angular.element.prototype.focus || function() {
      if (this.length) {
        this[0].focus();
      }
      return this;
    };
angular.element.prototype.blur = angular.element.prototype.blur || function() {
      if (this.length) {
        this[0].blur();
      }
      return this;
    };