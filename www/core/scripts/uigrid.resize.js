(function() {
	angular
		.module('app')
		.directive('uiGridResize', myUiGridResizeDirective);
	
	/* @ngInject */
	function myUiGridResizeDirective(gridUtil, uiGridConstants) {
		return {
			restrict: 'A',
			require: 'uiGrid',
			link: function($scope, $elm, $attrs, uiGridCtrl) {
				$scope.$watch($attrs.uiGrid + '.minRowsToShow', function(val) {
					var grid = uiGridCtrl.grid;

					// Initialize scrollbars (TODO: move to controller??)
					uiGridCtrl.scrollbars = [];

					// Figure out the new height
					var contentHeight = grid.options.minRowsToShow * grid.options.rowHeight;
					var headerHeight = grid.options.hideHeader ? 0 : grid.options.headerRowHeight;
					var footerHeight = grid.options.showFooter ? grid.options.footerRowHeight : 0;
					var scrollbarHeight = grid.options.enableScrollbars ? gridUtil.getScrollbarWidth() : 0;

					var maxNumberOfFilters = 0;
					// Calculates the maximum number of filters in the columns
					angular.forEach(grid.options.columnDefs, function(col) {
						if (col.hasOwnProperty('filter')) {
							if (maxNumberOfFilters < 1) {
									maxNumberOfFilters = 1;
							}
						}
						else if (col.hasOwnProperty('filters')) {
							if (maxNumberOfFilters < col.filters.length) {
									maxNumberOfFilters = col.filters.length;
							}
						}
					});
					var filterHeight = maxNumberOfFilters * headerHeight;

					var newHeight = headerHeight + contentHeight + footerHeight + scrollbarHeight + filterHeight;

					$elm.css('height', newHeight + 'px');

					grid.gridHeight = $scope.gridHeight = gridUtil.elementHeight($elm);

					// Run initial canvas refresh
					grid.refreshCanvas();
				});
			}
		};
	}
})();