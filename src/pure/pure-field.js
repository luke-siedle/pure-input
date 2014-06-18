/* 
 *	@file
 *	pure-field.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Field is used as a parent class
 *	for form text fields.
 */

( function( _, $ ){
	
	_.Class.Field = _.Class.Base.extend({

		init			: function( opts ){
			
			// Call the base initializer //
			this._super( opts, function(){
				
				// For compiling //
				this.addRegister('asset', function( obj ){
					this.registered.asset.push({
						name	: obj[0],
						fn		: obj[1]
					});
				}, function( arg ){
					return false;
				});

			});

		},

		compile			: function(){
			
			var compiled	= {};

			for( var x in this.registered.asset ){
				var e = this.registered.asset[x];
				compiled[ e.name ] = e.fn.call( this );
			}
			
			return compiled;
		},

		register		: function( type, call ){
			var obj		= {};
			obj[ type ] = call;
			this.registrations.push( obj );
		},

		validate		: function(){

		},

		defaults	: function(){
			return {
				classNames	: this.el.attr('class'),
				plugins 	: {}
			};
		}

	});

	_.Class.Field.View	= _.Class.Base.View.extend({
		construct		: function(){
			
			this.el.hide();

			this.renderElements();

			this.applyStyles();
		},

		renderElements			: function(){

			var elems = this.elements;

			this.el.after( elems.superWrapper );
			elems.superWrapper.append( elems.mainWrapper );

		},
		createElements			: function(){
			return {
				superWrapper	: $('<div />'), // Contains the input //
				mainWrapper		: $('<div />'), // Contains everything and can be scrolled //
				inputWrapper	: $('<div />')	// Wraps just the input //
			};
		}
	});

})( PureUI, jQuery );