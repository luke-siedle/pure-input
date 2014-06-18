/* 
 *	@file
 *	pure-base.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	PureUI provides procedural and object
 *	oriented methodology based on the jQuery
 *	library.
 *	
 */

// PureUI initialisation //

PureUI = Pure = function( type, opts ){
	
	if( ! PureUI.Class[type] ){
		throw 'Error :: Class ' + type + ' does not exist.';
		return;
	}

	return PureUI.create( this, opts, type );
};

// PureUI methods and core classes //

( function( _, $ ){
	
	_.Class				= {};
	_.Globals			= {};
	_.Globals.styles 	= [];
	_.Globals.navKeys 	= [ 35, 36, 37, 38, 39, 40, 13, 8, 9 ];
	_.instance 			= [];
	_.prefix 			= 'pureui';
	_.Library 			= 'PureUI';

	/*
	 *	@version
	 *	Structure is :
	 *	[ Major Release ].[ Feature Update ].[ Bug Fix ]
	 */

	_.Version			= '1.0.0';

	_.create	= function( each, opts, type ){
		
		var inst	= each instanceof $,
			Plugin	= _.Class[ type ];
			
		if( !inst ){
			return new Plugin( opts ).getPublicInterface( );
		} else {
			return $( each ).each( function(){
				var $each	= $(this);
				opts.el		= $each;
				var inst 	= new Plugin( opts );
				$each.data('PureUI.' + type, inst );
			});
		}

	}
	
	_.Class.Base				= Class.extend({

		__name				: 'model',

		__construct			: function(){
			
			if( this.defaults ){
				var opts = $.extend(
					true,
					{},
					this.defaults(),
					this.opts
				);
				// Ensure arrays are overwritten completely //
				for(var x in this.opts ){
					if( typeof(this.opts[x]) == 'object' && (this.opts[x].length >= 0) ){
						opts[x] = this.opts[x];
					}
				}
				this.opts = opts;
			}

			if( this.view ){
				this.view		= new this.view( this.el, this );
			}
			
			if( this.opts.renderTo ){
				this.view.el.appendTo( this.opts.renderTo );
			}

			this.el	= undefined;
			
			if( this.events ){
				this.events();
			}
			
			
			if( this.preConstruct ){
				this.preConstruct();
			}

			if( this.plugins ){
				this.addPlugins();
			}
			

			if( this.construct ){
				this.construct();
			}

			

		},

		init				: function( opts, beforeConstruct ){		

			// Restore //
			this.plugin 			= this._ = {};
			this.eventList 			= {};
			this.attribute			= {};
			// this.onChangeAttribute 	= {};

			// Register //
			this.registered			= {};
			this.undoRegistered		= {};
			this.register			= {};
			
			this.addRegister('element', function( el ){
				this.registered.element.push( el );
				el.addClass('pureui');
			}, function( each ){
				$( each ).remove();
			});
			
			this.addRegister('event', function( el, event, methodName, context ){

				if( typeof( el ) == 'string' ){
					var context 	= event || this,
						trueContext	= this,
						methodName	= el,
						method 		= this.on[ methodName ],
						jQueryEvent	= false;

				} else {

					var context		= context || this,
						trueContext	= this,
						methodName	= methodName ? methodName : event,
						method		= this.on[ methodName ],
						jQueryEvent	= true;
				}

				var	bind		= function( e ){

					if( context.disabled || trueContext.disabled ){
						return;
					}

					method.call( context, e );

					// subscribe( e, trueContext );
				};
				
				if( jQueryEvent ){
					el.bind( event , bind );
				}
				
				this.eventList[ methodName ] = function( e ){

					if( this.disabled ){
						return;
					}

					var args = $.makeArray( arguments ),
						pureObjects = [];

					// Allow custom functions to override defaults // 
					var cont 		= true,
						pureEvent 	= {
							preventDefault 		: function(){
								cont = false;
							},
							onEventCompleted	: function(){}
						};
					
					// args.push( pureEvent );
					if( this.opts.on && this.opts.on[ methodName ] ){
						var publicArgs = this.listeners[ methodName ].apply( this, args );
						this.opts.on[ methodName ].apply( this.getPublicInterface(), publicArgs );
					}
					
					if( cont ){
						this.on[ methodName ].apply( this, args );
						subscribe( this, args );
						pureEvent.onEventCompleted.call( this );
					}

				};

				// Checks if parent items have subscribed to events //
				function subscribe( context, ancestors ){
					
					if( trueContext._parent ){
						var parent	= trueContext._parent;
						for(var plu in trueContext._parent.plugin ){
							var plugins		= trueContext._parent.plugin,
								plugin		= plugins[ plu ];
							if( trueContext == plugin ){
								
								var args = [ context ];
								
								if( trueContext != context ){
									args.push( trueContext );
								}

								for(var x in ancestors ){
									args.push( ancestors[x] );
								}

								if( parent.subscribe && parent.subscribe[ plu ] ){
									if( parent.subscribe[ plu ][ methodName ] ){
										parent.subscribe[ plu ][ methodName ].apply( parent, args );
									}
								}

							}
						}
					}
				};
				
				if( jQueryEvent ){
					this.registered.event.push( [el, event, bind] );
				}
				
			}, function( el, event, method ){
				$( el ).unbind( event, method );
			});

			var obj	= { opts : opts };

			if( opts.el ){ obj.el = opts.el; }
			
			$.extend( this, obj );
			
			this.options = this.opts;
			
			// For plugins //
			if( opts._parent ) {
				this._parent = opts._parent;
			}
			
			if( beforeConstruct ){
				beforeConstruct.call( this );
			}

			this.__construct();
			
			

		},

		callEvent			: function( method, pureArgument ){
			var args = [];
			if( pureArgument instanceof _.Class.Arguments ){
				args = pureArgument.get();
			}
			args.push( this );
			return this.eventList[ method ].apply( this, args );
		},

		destroy				: function( z ){
			
			// Removes new elements and binding //
			var	obj = this.registered;
			if( z ){
				obj	= {};
				obj[z] = this.registered[z];
			}
			
			// Handles custom destruction //
			if( this.view && this.view.destroy ){
				this.view.destroy();
			}

			for(var x in obj ){
				for(var y in obj[x]){
					if( this.undoRegistered[x] ){
						this.undoRegistered[x]( obj[x][y] );
					}
				}
			}

			if( this._parent ){
				for(var x in this._parent._ ){
					if( this._parent._[x] == this ){
						delete this._parent._[x];
						delete this._parent.plugin[x];
					}
				}
			}

			return true;
		},

		getPluginTree 		: function(){
			
			var arr = plu( [], this );
			arr.splice(0, 1);
			return arr;
			
			function plu( arr, inst ){

				if( _.getLength( inst._ ) == 0 ){
					arr.push( inst );
					return arr;
				}

				arr.push( inst );

				for( var x in inst._ ){
					arr = plu( arr, inst._[x] );
				}

				return arr;
			}
		},

		addRegister			: function( name, fnApply, fnUnApply ){
			
			this.registered[ name ]			= [];
			this.undoRegistered[ name ]		= [];

			var context				= this,
				currentApply, currentUnApply;
				
			this.register[ name ] = currentApply = function(){
				fnApply.apply( context, currentApply.arguments );
			};
			if( fnUnApply ){
				this.undoRegistered[ name ] = currentUnApply = function(){
					fnUnApply.apply( context, currentUnApply.arguments );
				};
			}

		},

		addPlugins			: function( plu, pluOpts ){
			
			var model		= this;
			var plugins 	= plu || this.plugins;

			$.each( plugins, function( i, getPlugin ){

				if( ! plu ){
					if( ! model.opts.plugins || ! model.opts.plugins[i] ){
						return true;
					}
				}

				var pluginSetup		= model.pluginDefaults()[i] || {},
					Plugin			= getPlugin(),
					opts 			= model.opts.plugins[i] || pluOpts || {};

					$.extend( pluginSetup, opts );
					
					try {
						pluginSetup		= $.extend(
							true,
							{ },
							model.defaults().plugins[i],
							pluginSetup
						);
					} catch ( none ){}
					
				pluginSetup._parent	= model;

				if( Plugin && pluginSetup ){
					model.plugin[i] = model._[i] = new Plugin( pluginSetup );
				}

			});

		},

		timeout 			: function( exec, dur ){
			var inst = this;
			return setTimeout( function(){
				exec.call( inst );
			}, dur );
		},

		pluginDefaults		: function(){ return {} },

		_ : {
			// To store plugins //
		},

		plugin 				: {

		},

		eventList			: {

		},
		
		getPublicInterface	: function(){
			
			if( this.publicInterface ){
				return this.publicInterface;
			}
			
			var inst 		= this,
				methods 	= this.methods();
				
			this.publicInterface = new function(){
				for( var x in methods ){
					(function( x ){ 
						this[x] = function(){
							var result = methods[x].apply( inst, arguments );
							if( result == null ){
								return this;
							}
							return result;
						}
					}).call( this, x );
				}

				this.get 	= function(){
					return inst;
				}
			}
			return this.publicInterface;
		},

		methods 			: function( ){
			return {
				attr 		: this.attr,
				destroy 	: this.destroy,
				options		: function( options ){
					if( typeof(options) == 'object' ){
						this.options = this.opts = $.extend( {}, true, this.options, options );
						return this.getPublicInterface();
					} else {
						if( options && typeof(options) == 'string' ){
							return this.options[ options ];
						}
						return this.options;
					}
				}
			};
		},

		attr 		: function( attr, bool ){
			if( bool == null ){
				return this.attribute [ attr ];
			} else {
				this.attribute[attr] = bool;
				if( this.onChangeAttribute[ attr ] ){
					this.onChangeAttribute[ attr ].call( this );
				}
				return this.getPublicInterface();
			}
		}
		
	});
	
	_.Class.Base.View			= Class.extend({
		__construct				: function(){
			


			if( this.createElements ){
				this.elements = this.els = this.createElements();
				if( this.elements.el ){
					this.el = this.elements.el;
				}
			}

			if( this.elements ){
				var inst = this.model,
					view = this;
				$.each( this.elements, function(i, e){
					inst.register.element( e );
					e.addClass( view.setClass(i) );
				});
			}
			
			// this.preserveEl		= this.el.css();
			

			if( this.construct ){
				this.construct();
			}
			
		},
		init					: function( el, model ){
			this.el				= el;
			this.model			= model;
			// For plugins //
			if( model._parent ){
				this._parent = model._parent;
			}

			this.__construct();
		},

		applyStyles		: function( spec ){

			var inst	= this,
				add 	= true;

			for(var x in _.instance ){
				add = this.model != _.instance[x];
				if( ! add ){
					break;
				}
			}

			if( add ){
				_.instance.push( this.model );
			}

			var count 	= _.instance.length;
			if( this.styles ){
				$.each( this.styles, function( i, e ){

					var css =  inst.getStyles( i ),
						cls = inst.setClass(i);

					_.Globals.styles.push ({
						className 	: cls,
						css 		: css
					});

					inst.elements[ i ].css( css )
						.addClass( cls )
							.addClass('pureui-' + count );
				});
			}
		},

		getStyles 		: function( i ){
			var e 		= this.styles[i],
				cssObj 	= {},
				inst 	= this;
			$.each( e, function( css, val ){
				if( typeof val == 'function'){
					cssObj[ css ] = val.call( inst, inst.el, inst );
				} else {
					cssObj[ css ] = val;
				}
			});
			return cssObj;
		},

		select			: function(){
			this.el.addClass('selected __selected');
		},

		unselect		: function(){
			this.el.removeClass('selected __selected');
		},

		setClass		: function(i){
			var cls	= 'pureui-' + this.model.__name;
			if( i != 'el'){
				cls += '-' + i;
			}
			return cls;
		}
	});
	
	
	_.Class.Arguments 			= Class.extend({

		init 					: function( args ){
			this.args 			= $.makeArray( args );
		},
		get 					: function(){
			return this.args;
		}

	});

	_.args						= function( arr ){
		return new _.Class.Arguments( arr );
	}

	_.replace					= function( s, o ){
		$.each( o, function(i, e){
			s = s.replace( new RegExp('{' + i + '}', 'g'), e );
		});
		return s.replace(/{.*}/g, '');
	}
	
	_.cleanRegex = function( s ){
		var o = ['\\', '!', ')', '(', '[', ']', '?', '=', '+', '$', '|', '-', '{', '}', '^'];
		$.each( o, function(i, e){
			s = s.replace( new RegExp("\\" + e, 'g'), "\\" + e );
		});
		return s;
	}

	_.pxToInt 					= function( px ){
		return parseInt( px.match(/[0-9]+/)[0] );
	}

	_.isNav 					= function( code ){
		var navKeys 	= _.Globals.navKeys;
		for(var x in navKeys){
			if( navKeys[x] == code ){
				return true;
			}
		}
		return false;
	}

	_.renderInlineStyles		= function(){
		$.each( _.Globals.styles, function( i, obj ){
			var css = obj.css,
				cls = obj.className+i;

		});
	}

	_.getLength 					= function( obj ){
		var i=0;
		for(var x in obj){
			i++;
		}
		return i;
	}
	
	$.fn.PureUI	= $.fn.Pure = function( type, opts ){
		var inst		= $( this ).data( 'PureUI.' + type ),
			isPlugin 	= /:/.test( type );

		if( isPlugin ){
			var p 		= type.split(':'),
				inst 	= $( this ).data('PureUI.' + p[0] ),
				plu 	= $.trim( p[p.length-1] );

			var plugin 	= getPlugin( inst, plu );
			
			if( opts ){
				if( !plugin && inst.plugins[plu] ){
					var o = {};
					o[plu] = inst.plugins[plu];
					inst.addPlugins( o, opts );
				} else {
					if( plugin ){
						// Overwrite the options //
						$.extend( true, inst.plugin[plu].opts, opts );
					}
				}
				return this;
			} else if( plugin ) {
				return plugin.getPublicInterface();
			}
		}

		if( inst ){
			if( opts ){
				// Overwrite the options //
				$.extend( true, inst.opts, opts );
				return this;
			}
			return inst.getPublicInterface();
		}

		function getPlugin( parent, plu ){
			
			if( parent._ ){
				if( parent._[ plu ] ){
					return parent._[ plu ];
				} else {
					for(var x in parent._ ){
						var plugin = getPlugin( parent._[ x ], plu );
						
						if( plugin ){
							return plugin;
						}
					}
				}
			}
		}

		return _.create( this, opts, type );
	};

})( PureUI, jQuery );

(function($){
    $.fn.trueHeight		= function(){
    	var $e 	= $(this), p = $e.padding(),
		m = $e.margin(), b = $e.border();
		
		return $e.height()
			+ p.top
			+ p.bottom
			+ m.top
			+ m.bottom
			+ b.top
			+ b.bottom;
    }

})(jQuery);

if( ! window.console ){
	window.console = new function(){};
}

if( !window.console.log ){
	window.console.log = function(){};
}
