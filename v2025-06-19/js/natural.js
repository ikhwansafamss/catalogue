/*! © SpryMedia Ltd - datatables.net/license */

/* PV adapted these functions so that null values are stored at the end */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;


/**
 * Data can often be a complicated mix of numbers and letters (file names
 * are a common example) and sorting them in a natural manner is quite a
 * difficult problem.
 *
 * Fortunately the Javascript `localeCompare` method is now widely supported
 * and provides a natural sorting method we can use with DataTables.
 *
 *  @name Natural sorting
 *  @summary Sort data with a mix of numbers and letters _naturally_.
 *  @author Allan Jardine
 *  @requires DataTables 2+
 *
 *  @example
 *   // Natural sorting
 *   new DataTable('#myTable',
 *       columnDefs: [
 *           { type: 'natural', target: 0 }
 *       ]
 *   } );
 *
 *  @example
 *   // Html can be stripped from sorting by using 'natural-nohtml' such as
 *   new DataTable('#myTable',
 *       columnDefs: [
 *    	     { type: 'natural-nohtml', target: 0 }
 *       ]
 *    } );
 *
 *  @example
 *   // Case insensitive natural sorting
 *   new DataTable('#myTable',
 *       columnDefs: [
 *    	     { type: 'natural-ci', target: 0 }
 *       ]
 *    } );
 *
 */
DataTable.type("natural", {
    order: {
        asc: function (a, b) {
            // sort null values at the end:
            if (a == null || a == "") {
                return 1;  
            }
            if (b == null || b == "") {
                return -1;
            }
            return a.localeCompare(b, navigator.languages[0] || navigator.language, {
                numeric: true,
                ignorePunctuation: true,
            });
        },
        desc: function (a, b) {
            // sort null values at the end:
            if (a == null || a == "") {
                return 1;  
            }
            if (b == null || b == "") {
                return -1;
            }
            return (a.localeCompare(b, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }) *
                -1);
        },
    },
    className: "natural-sort",
});
DataTable.type("natural-nohtml", {
    order: {
        asc: function (a, b) {
            // sort null values at the end:
            if (a == null || a == "") {
                return 1;  
            }
            if (b == null || b == "") {
                return -1;
            }
            a = DataTable.util.stripHtml(a);
            b = DataTable.util.stripHtml(b);
            return a.localeCompare(b, navigator.languages[0] || navigator.language, {
                numeric: true,
                ignorePunctuation: true,
            });
        },
        desc: function (a, b) {
            // sort null values at the end:
            if (a == null || a == "") {
                return 1;  
            }
            if (b == null || b == "") {
                return -1;
            }
            a = DataTable.util.stripHtml(a);
            b = DataTable.util.stripHtml(b);
            return (a.localeCompare(b, navigator.languages[0] || navigator.language, { numeric: true, ignorePunctuation: true }) *
                -1);
        },
    },
    className: "natural-sort",
});
DataTable.type("natural-ci", {
    order: {
        asc: function (a, b) {
            a = DataTable.util.stripHtml(a);
            b = DataTable.util.stripHtml(b);
            // sort null values at the end:
            if (a == null) {
                return 1;
            } 
            if (b == null) {
                return -1;
            } 
            // convert to string and remove al-, hamza, ʿayn and non-alphanumeric characters to compare:
            a = a.toString().toLowerCase().replace(/al-|ʾ|ʿ|[^\p{L}\p{N}]+/gu, "");
            b = b.toString().toLowerCase().replace(/al-|ʾ|ʿ|[^\p{L}\p{N}]+/gu, "");
            // sort empty strings at the end:
            if (a == "") {
                return 1;
            }
            if (b == "") {
                return -1;
            }
            // natural sort:
            return a.localeCompare(
                b, navigator.languages[0] || navigator.language, 
                {
                    numeric: true,
                    ignorePunctuation: true,
                }
            );
        },
        desc: function (a, b) {
            a = DataTable.util.stripHtml(a);
            b = DataTable.util.stripHtml(b);
            // sort null values at the end:
            if (a == null) {
                return 1;
            } 
            if (b == null) {
                return -1;
            } 
            // convert to string and remove al-, hamza, ʿayn and non-alphanumeric characters to compare:
            a = a.toString().toLowerCase().replace(/al-|ʾ|ʿ|[^\p{L}\p{N}]+/gu, "");
            b = b.toString().toLowerCase().replace(/al-|ʾ|ʿ|[^\p{L}\p{N}]+/gu, "");
            // sort empty strings at the end:
            if (a == "") {
                return 1;
            }
            if (b == "") {
                return -1;
            }
            // natural sort:
            return (-1 * a.localeCompare(
                b, 
                navigator.languages[0] || navigator.language, 
                {
                    numeric: true, 
                    ignorePunctuation: true 
                }
            ));
        },
    },
    className: "natural-sort",
});


return DataTable;
}));
