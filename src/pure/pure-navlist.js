/* 
 *	@file
 *	pure-navlist.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	NavList is used with Autocomplete
 *	to create an operate a list
 *	of results from a local or remote
 *	source.
 */

( function( _ , $ ){
	
	_.Class.NavList	= _.Class.Base.extend({

		__name	: 'navlist',

		view	: _.Class.Base.View.extend({

			construct	: function(){

				this.model.items	= [];
				this.model.count	= 0;
				this.el.hide();
				this.el.appendTo( this.model.opts.renderTo );
				this.setListDir();

				var inst 			= this,
					method 			= function(){
						inst.setListDir();
						inst.setPosition();
					};

				$( window ).resize( method ).scroll( function(){
					if( inst.scrollTimeout ){
						clearTimeout( inst.scrollTimeout );
					}
					inst.scrollTimeout = setTimeout( function(){
						method();
					}, 50 );
				});

			},

			populate		: function(){
				var list	= this.model;
				if( this.model.opts.store ){
					this.model.opts.store.each( function( i, e ){
						var obj		= e.get(),
							tpl		= e.tpl,
							each	= new _.Class.NavList.Item({
								tpl		: tpl
							});
						list.addItem( each );
					});
				}
			},
			
			renderItem			: function( item, el ){
				if( el ){
					item.view.el.insertBefore( el );
				} else {
					this.el.append( item.view.el );
				}

				this.addPosClasses();
				this.setHeight();
				this.setPosition();
			},

			addPosClasses		: function(){
				this.el.children().removeClass('first last');
				this.el.children().not('.__ignore').first().addClass('first');
				this.el.children().not('.__ignore').last().addClass('last');
			},

			createElements		: function(){
				return {
					el			: $('<ul />').css({
						position	: 'absolute',
						top			: 0,
						left		: 0,
						zIndex		: 10
					})
				};
			},

			setListDir 			: function(){
				var container 		= this.model.opts.renderTo,
					windowHeight	= $(window).height(),
					containerTop 	= container.offset().top,
					listHeight 		= this.model.opts.maxHeight,
					scrollTop 		= $( window ).scrollTop();

				var resultHeight 	= (windowHeight+scrollTop) - containerTop - listHeight;
				
				this.model.renderUp = resultHeight < 10;

				if( this.model.renderUp ){
					this.el.addClass('up');
				} else {
					this.el.removeClass('up');
				}
			},

			setPosition 		: function(){

				if( this.model.renderUp ){

					var height 	= this._parent._parent.view.els.superWrapper.height() 
								+ this.el.height() 
								+ this.el.padding().top 
								+ this.el.padding().bottom;

					this.el.css('top', '-' + (height) + 'px' );
				} else {
					this.el.css('top', 0 );
				}

			},
			
			setHeight 			: function( reset ){
				if( this.el.height() >= this.model.opts.maxHeight && !reset ){
					this.el.css('overflowY', 'scroll');
					this.el.height( this.model.opts.maxHeight );
				} else {
					this.el.css( 'height', 'auto' );
					this.el.css('overflowY', 'hidden');
				}
			},

			styles 				: {
				el 				: {
					overflow	: 'hidden'
				}
			}

		}),

		addItem		: function( opts, placeholder ){
			
			var item = opts;
			
			this.view.el.show();

			if( ! ( opts instanceof _.Class.NavList.Item )){
				item	= new _.Class.NavList.Item({
					tpl			: opts.tpl,
					store		: new _.Class.Store( opts.data ),
					list		: this,
					className 	: opts.className
				});
			}

			this.items.push( item );
			this.view.renderItem( item, placeholder ? placeholder.view.el : null );
			this.active	= true;
			this.callEvent('active');
			
			if( ! opts.noSelect ){
				this.count++;
			}
			
			return item;
		},

		removeItem		: function( item ){
			item.view.el.remove();
			for( var x in this.items ){
				if( item == this.items[x] ){
					this.items.splice( x, 1 );
					if( ! item.noSelect ){
						this.count--;
					}
					break;
				}
			}
			if( this.items.length == 0 ){
				this.clear();
			} else {
				this.view.addPosClasses();
			}
			
			this.view.setHeight( true );
			this.view.setHeight();
			this.view.setPosition();
		},
		
		clear		: function(){
			this.items = [];
			this.count = 0;
			this.view.el.empty();
			this.view.el.hide();
			this.navPosition = 0;
			this.active	= false;			
			this.callEvent('inactive');
			this.view.setHeight( true );
			this.view.setPosition();
			this.selectedItem = null;
		},
		
		events 		: function(){
			this.register.event('active');
			this.register.event('inactive');
			this.register.event('listItemSelect');
			this.register.event('listItemEnter');
			this.register.event('listItemLeave');
		},

		on			: {
			listItemSelect	: function( e, item, list ){
				
				if( item.noSelect ){
					this._parent._parent
						.view.els.input.focus();
				} else {
					this.view.select();
				}
			},
			listItemEnter	: function( e, item, list ){
				this.unselectAll();
				if( !item.noSelect ){
					item.view.select();
				}
			},
			listItemLeave	: function( e, item, list ){
				item.view.unselect();
			},

			active 			: function(){},

			inactive 		: function(){}
		},

		unselectAll			: function(){
			for(var x in this.items){
				this.items[x].view.unselect();
			}
		},

		navigateUp			: function(){

			if( !this.active ){
				return;
			}

			if( this.navPosition > 0 ){
				--this.navPosition;
				this.navigateTo( this.navPosition, 'navigateUp' );
			}
		},

		navigateDown		: function(){
			if( !this.active ){
				return;
			}
			if( this.navPosition < this.items.length-1 ){
				++this.navPosition;
				this.navigateTo( this.navPosition, 'navigateDown' );
			}
		},

		navigateTo			: function( pos, retry ){

			if( !this.active ){
				return;
			}

			this.navPosition = pos;
			this.unselectAll();
			if( this.items[pos] ){
				if( ! this.items[pos].noSelect ){
					this.items[pos].view.select();
				} else {
					if( retry && this.items.length > 1 ){
						this[ retry ]( );
						return;
					} else {
						this.navPosition++;
						this.navigateTo( this.navPosition );
						return;
					}
				}
			}

			var item = this.items[ pos ];
			
			if( item ){
				this.setScroller( item, pos, retry );
			}

		},

		setScroller 		: function( item, pos, method ){
			
			if ( !this.firstItem ){
				this.firstItem = 1;
			}
			
			var itemHeight 	= item.view.el.trueHeight(),
				perView	 	= Math.ceil( this.opts.maxHeight / itemHeight ),
				diff		= perView*itemHeight - (this.opts.maxHeight),
				pad			= this.view.el.padding().top,
				pos			= pos+1;
			
			if( pos == this.items.length ){
				var el = this.view.el,
					scroll = itemHeight * this.items.length;
					anim.call( this, scroll );
					this.firstItem = this.items.length - perView;
				return;
			}
			
			if( method == 'navigateUp'){
				if( pos <= this.firstItem ){
					if( pos == 1 ){
						anim.call( this, 0 );
					} else {
						anim.call( this, ((pos-1)*itemHeight) - (pad/2));
					}
					this.firstItem--;
				}
			} else 
			if( pos < perView || pos == 0 ){
				anim.call( this, 0 );
				this.firstItem = 1;
			} else 
			if( pos >= (this.firstItem + perView )){
				anim.call( this, ((pos-perView)*itemHeight) + pad + diff );
				this.firstItem = pos-perView;
			}
			
			function anim( amt ){
				this.view.el.scrollTop( amt );
			}
		},
		
		navPosition			: 0,

		defaults 			: function(){
			return {
				maxHeight 		: 150,
				animateScroll 	: true
			};
		},
		
		methods 				: function(){
			return $.extend(true, {}, this._super(), {
				getList 			: function(){
					var result = [];
					for(var x in this.items){
						if( !this.items.noSelect ){
							result.push( this.items[x] );
						}
					}
					return result;
				}
			});
		}

	});

	_.Class.NavList.Item	= _.Class.Base.extend({

		__name				: 'navlist-item',

		construct			: function(){
			this.store		= this.opts.store;
			this.list		= this.opts.list;

			if( this.opts.className ){
				this.view.el.addClass( this.opts.className );
			}
		},

		view				: _.Class.Base.View.extend({
			construct		: function(){
				var tpl		= this.model.opts.tpl;
				this.el.append( tpl );
				var inst	= this;
			},

			createElements	: function(){
				return {
					el		: $('<li>')
				};
			},

			select 			: function(){
				this._super();
				if( this.model.noSelect ){
					this.model.list
						._parent._parent
							.view.els.input.focus();
				}
				this.model.list.selectedItem = this.model;

			}
		}),

		getPosition 	: function(){
			for( var x in this.list.items ){
				if( this.list.items[x] == this ){
					return x;
					break;
				}
			}
		},
		
		events				: function(){
			
			// Register to the parent list rather than the item //
			// this.opts.list.register.event( this.view.el, 'click', 'listItemSelect', this );

			this.register.event( this.view.el, 'click', 'select' );

			this.register.event( this.view.el, 'mouseenter', 'listItemEnter' );

			this.register.event( this.view.el, 'mouseleave', 'listItemLeave' );
			
		},

		on 	: {
			select 			: function( e ){
				this.list.callEvent('listItemSelect', _.args( [ e,this ] ) );
			},
			listItemEnter	: function( e ){
				this.list.callEvent('listItemEnter', _.args( [ e,this ] ) );
			},
			listItemLeave	: function( e ){
				this.list.callEvent('listItemLeave', _.args( [ e,this ] ) );
			}
		}
	});

})( PureUI, jQuery );