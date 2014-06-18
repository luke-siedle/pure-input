/* 
 *	@file
 *	pure-store.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Store is used by various aspects
 *	of Pure to hold and manipulate data.
 */

( function( _ , $ ){
	
	_.Class.Store				= Class.extend({
		init					: function( obj ){
			this.store			= [];

			if( obj ){
				this.add( obj );
			}
		},
		remove					: function( unit ){
			var inst			= this;
			this.each( function(i, e){
				if( e == unit ){
					inst.store.splice( i, 1 );
					inst.length--;
					return false;
				}
			});
		},
		reset					: function( arr ){
			if(!arr){
				this.store		= [];
			}
			this.store			= arr;
		},

		/*
		 *	@description
		 *	Adds a new unit to the store
		 *	if it does not exist, returns
		 *	a new store of what was added.
		 */

		add						: function( unit, recursed ){
			
			if( ! (unit instanceof _.Class.Store.Unit) ){
				if( unit.length && unit.length > 0 ){
					var added = new _.Class.Store;
					for( var x in unit ){
						var result = this.add( unit[x], true );
						if( result ){
							added.add( result );
						}
					}
					return added;
				}
				
				if( !this.exists( unit ) ){
					unit	= new _.Class.Store.Unit( unit );					
					if( recursed ){
						this.length++;
						this.store.push( unit );
						return unit;
					}
					
				} else {
					return false;
				}
				
			} else {
				if( this.find(unit) ){
					return false;
				}
				this.length++;
				this.store.push( unit );
			}

			// Return the difference (newly added items) //
			if( ! recursed ){
				var end = new _.Class.Store;
				end.add( unit, true );
				return end;
			}
			
		},

		get						: function(){
			var result			= [];
			this.each( function( i, e ){
				result.push( e.get() );
			});
			return result;
		},

		search					: function( keyword, map, limit ){
			var results			= [],
				x				= 0;
			
			this.each( function( i, e ){
				var each = map( e.get() );
				if( new RegExp( _.cleanRegex(keyword.toLowerCase()), 'i' ).test( each.value )  ){
					results.push( e );
					x++;
				}
				if( x >= limit ){
					return false;
				}
				
			});

			return new _.Class.Store ( results );
			
		},

		find					: function( unit ){
			var result = false;
			this.each( function( i, e ){
				if( e == unit ){
					result = i;
					return false;
				}
			});
			return result;
		},

		exists					: function( item ){
			var exists		= false,
				key			= this.uniqueKey;
				
			this.each( function( i, e ){
				if( e.get()[key] == item[key] ){
					exists	= true;
					
					return false;
				}
			});
			
			return exists;
		},

		each					: function( callback ){
			$.each( this.store, function( i, e ){
				return callback( i, e );
			});
		},

		uniqueKey				: 'id',

		length					: 0,

		setTitle				: function( title ){
			this.title 		 	= title;
		},
		
		unit					: function( i ){
			return this.store[ i ];
		}
		
	});

	_.Class.Store.Unit			= Class.extend({
		init					: function( obj ){
			this.unit			= obj;
		},
		get						: function(){
			return this.unit;
		}
	});

	_.Globals.Storage			= {};
	
})( PureUI, jQuery );