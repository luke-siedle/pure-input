/* 
 *	@file
 *	pure-autocomplete.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Autocomplete listens for changes
 *	in an input's value and produces search
 *	results from local and/or remote
 *	sources.
 */

( function( _ , $ ){

	_.Class.Autocomplete	= _.Class.Base.extend({
		
		__name				: 'autocomplete',

		construct			: function(){
			
			if( this.opts.storage ){
				this.store	= this.opts.storage;
			} else {
				this.store  = new _.Class.Store;
			}
			
			this.mapSrc	= this.opts.mapSrc || function( e ){
				return {
					id 		: e.id,
					value	: e.title
				};
			};

			if( this.opts.mapResults ){
				this.createMultiStore();
			} else {
				_.Globals.Storage[ Math.random() ] = this.store;
			}

			if( typeof(this.opts.src) == 'object' ){
				this.addSources( this.opts.src );
			}

			this.value 		= this._parent.getValue();

		},
		
		view				: _.Class.Base.View.extend({
			construct		: function(){
				this.renderElements();
				this.el.width( this._parent.view.els.mainWrapper.outerWidth() - 2 );
				this.els.input	= this._parent.view.els.input;
			},

			createElements	: function(){
				return {
					el		: $('<div />').css({
						position : 'relative'
					})
				};
			},
			
			renderElements	: function(){
				var parent = this.model.opts._parent;
				this.el.appendTo( parent.view.els.superWrapper );
			},
			appendResults		: function( store, setNum, placeholder ){

				var inst = this, firstItem,
					currentCount = this.model.resultCount;

				if( !setNum ){
					setNum = 0;
				}
				
				store.each( function( i, e ){

					if( inst.model.resultCount > inst.model.maxResults ){
						return false;
					}
					
					var obj		= e.get();
					
					obj			= $.extend( true, {}, obj, inst.model.opts.mapSrc( obj ) );
					
					var tpl		= inst.embold( 
						_.replace( inst.model.opts.templates.result, obj ), 
						_.cleanRegex( inst.model.lastKeyword ), 
						obj.value
					);
					
					var item = inst.model._.NavList.addItem({
						tpl		: tpl,
						data	: e
					}, placeholder );

					if( i == 0 && setNum == 0 ){
						firstItem = item;
					}

					inst.model.resultCount++;

				});

				this.refineListDisplay();

				firstItem && currentCount == 0 ? inst.model._.NavList.navigateTo( firstItem.getPosition() ) : null;

				if( currentCount > 0 ){
					var items = inst.model._.NavList.items;
					if( !inst.model._.NavList.selectedItem ){
						for(var x in items ){
							if( !items[x].noSelect ){
								inst.model._.NavList.navigateTo( items[x].getPosition() );
								break;
							}
						}
					}
				}

			},

			insertResults 		: function( store, setNum, placeholder ){
				this.appendResults( store, setNum, placeholder );
			},

			appendResultSet 	: function( store, resultStore, setNum ){

				if( resultStore.length > 0 ){

					if( store.set ){
						this.insertResults( resultStore, setNum, store.set.placeholder );
						return;
					}
					
					var setTitle 	= this.model._.NavList.addItem({
						tpl			: _.replace(this.model.opts.templates.category, {value:store.title}),
						className	: '__ignore'
					});

					setTitle.noSelect = true;

					setTitle.view.el.addClass('pureui-title');

					this.appendResults( resultStore, setNum );

					var placeholder = this.model._.NavList.addItem({
						tpl 		: '',
						className 	: '__ignore',
						noSelect	: true
					});

					placeholder.noSelect = true;

					placeholder.view.el.hide();

					// For inserting future results //
					store.set = {
						title 		: setTitle,
						placeholder	: placeholder
					};

					return true;
				}
			},

			appendState 		: function( state ){

				var item = this.model._.NavList.addItem({
					tpl			: this.model.opts.templates.state[state],
					data		: {
						state : state
					},
					noSelect	: true
				});



				item.noSelect			= true;

				this.model.stateItem 	= item;
				item.view.el.addClass( 'pureui-state-'+state );
				this.refineListDisplay();

			},

			refineListDisplay 	: function(){
				var listWidth 	= this.el.width(),
					listEl 		= this.model._.NavList.view.el;
				this.model._.NavList.view.el.width( listWidth - (listEl.padding().left + listEl.padding().right) );
			},

			clearResults		: function(){
				this.model._.NavList.clear();
				if( this.model.multiStore ){
					for( var x in this.model.multiStore ){
						this.model.multiStore[x].set = null;
					}
				}
			},
			embold				: function( str, key ){
				var regexp		= new RegExp( key, 'gi' );
				return str.replace( regexp, '<strong>' + str.match( regexp )[ 0 ] + '</strong>' );
			}
		}),

		defaults			: function(){
			return {};
		},

		events				: function(){
			
			this.register.event( this._parent.view.els.input, 'keydown' );
			this.register.event( this._parent.view.els.input, 'keyup' );
			this.register.event( this._parent.view.els.input, 'keypress' );
			this.register.event( this._parent.view.els.input, 'focus' );
			this.register.event( this._parent.view.els.input, 'mousedown' );
			this.register.event( this._parent.view.els.input, 'blur' );
			this.register.event( $( document ), 'mousedown', 'documentClick' );

			// Others //
			this.register.event( 'listItemSelect' );
			this.register.event( 'results' );
			this.register.event( 'noResults' );
		},

		subscribe			: {
			NavList			: {
				listItemSelect : function( item, list ){
					this.callEvent('listItemSelect', new _.Class.Arguments(arguments) );
				},
				active 		: function(){
					var superWrapper = this._parent.view.els.superWrapper,
						pos = superWrapper.css('position');
						if( pos == 'absolute'){
							return;
						}

					superWrapper.css( 'z-index', 20 );
					superWrapper.css( 'position', 'relative' );
				},
				inactive 		: function(){
					var superWrapper = this._parent.view.els.superWrapper,
						pos = superWrapper.css('position');
						if( pos == 'absolute'){
							return;
						}

					superWrapper.css( 'z-index', 0 );
					superWrapper.css( 'position', 'static' );
				}
			},

			Mentioner		: {
				addMention	: function(){}
			}
		},

		on	: {

			blur	: function(){
				this.clearSearches();
			},

			keydown	: function( e ){
				var keyCode	= e.which;
				this._.NavList.keydown = new Date().getTime();
				if( this.nav[e.which]){
					return this.nav[e.which].call( this, e );
				}

				( function( inst ){
					setTimeout( function(){
						inst.on.keypressed.call( inst, keyCode, e );
					}, 1 );
				})( this );
				
			},

			keyup 		: function(){
				this._.NavList.keyup = new Date().getTime();
			},
			keypress 	: function( e ){
				if( e.which == 13 ){
					if( this._.NavList.active ){
						if( this._.NavList.selectedItem ){
							this._.NavList.callEvent('listItemSelect', new _.Class.Arguments(
								[ e, this._.NavList.selectedItem ]
							));
						}
					}
					return;
				}
			},
			keypressed : function( k, e ){
				if( e.which == 8 || e.which == 46 ){
					if( this.value.length == 0 ){
						this.showState('start');
						if( this._parent._.Tokenizer ){
							if( this._parent._.Tokenizer.selectedItem )
							this.showState ('tokenizer_delete');
						}
						return;
					}
				}
				
				// Run a search //
				this.value = this.view.els.input.val();

				// Is it a mention search //
				this.usingMention 	= false;

				if( this._.Mentioner && !this._parent._.Tokenizer ){
					var mention = this._.Mentioner.findMention();
					if( mention ){
						
						this.value 			= mention.substr(1);
						this.usingMention 	= true;
						if( this.value.length == 0 ){
							this.showState('startMention');
							return;
						} else {
							if( this.value.split(" ").length > 4 ){
								this.hideState();
								return;
							}
						}
						
					} else {
						this.hideState();
						return;
					};
				}

				if( this.value.length > 2 ){
					this.doSearch( this.value );
				} else if( this.value.length == 0 ) {
					this.showState('start');
				}

				if( this.value == '' || this.value == null ){
					this.view.clearResults();
					this.showState('start');
				}
				
			},

			listItemSelect	: function( e ){
				this.view.clearResults();
				this.searches 		= {};
				this.preventSearch 	= 1;
				this.value 			= '';
				this.showState('start');
			},

			documentClick 	: function( e ){
				if( this._.NavList && this._.NavList.active ){

					var $target 	= $(e.target),
						$parents 	= $target.parents(),
						hideList 	= true;
						var el 		= this._parent.view.els.superWrapper.get(0);

					$parents.each( function(){
						var $each = $(this);
						if( $each.get(0) == el ){
							hideList = false;
							return false;
						}
					});

					if( hideList ){
						this._.NavList.clear();
					}
				}
			},
			focus 			: function(){
				if( this.value == '' || this.value == null ){
					this.showState('start');
				}
			},
			results : function(){},
			noResults : function(){}
		},

		showState 		: function( state ){

			if( this._parent.suspended ){
				return;
			}

			switch( state ){
				case 'start' :
					if( this._.Mentioner ){
						return;
					}
				case 'startMention' :
					this.view.clearResults();
					this.view.appendState( state );
					this.state = state;
					break;
				case 'searching' :
					this.view.appendState( state );
					this.state = state;
					break;
				default :
					this.view.clearResults();
					this.view.appendState( state );
					this.state = state;
				break;
			}
		},

		hideState		: function( state ){
			if( this.stateItem ){
				if( state != this.state && state != null ){
					return;
				}
				this._.NavList.removeItem( this.stateItem );
				this.stateItem 	= null;
				this.state 		= null; 
			}
		},
		
		doSearch		: function( keyword ){

			this.lastKeyword	= keyword;

			var resultStore = this.localSearch(),
				inst		= this;
			
			
			this.renderResults( resultStore );
			
			this.resultCount = resultStore.length;

			if( this.resultCount > 0 ){
				this.callEvent('results', _.args(['sync', resultStore]));
			} else {
				this.callEvent('noResults', _.args(['sync']));
			}

			if( this.resultCount >= this.opts.minResults ){
				// Good enough for now //
				return;
			}
			
			if( this.searchTimeout ){
				window.clearTimeout( this.searchTimeout );
			}

			this.showState('searching');
			
			this.searchTimeout = this.timeout( function(){
				if( this.preventSearch ){
					this.searches 		= {};
					this.preventSearch 	= false;
					return;
				}

				this.remoteSearch();
				
			}, this.opts.searchTimeout );
		},

		localSearch		: function(){

			if( this.mapResults ){

				var obj 	= {},
					num 	= 0,
					stores	= [];

				for(var x in this.mapResults){
					var st 			= this.multiStore[x];
					var resultSet 	= this.searchStore( st );
					if( resultSet.length > 0 ){
						stores.push({
							store 		: st,
							resultSet 	: resultSet
						});
					}
				}

				return stores;
			}

			return this.searchStore( this.store );
		},

		addSources		: function( data ){
			if( this.multiStore ){
				for(var x in data ){
					var st = this.multiStore[x];
					st.add( data[x] );
				}
			} else {
				this.store.add( this.opts.src );
			}
		},

		getHistory		: function(){
			if( this.multiStore ){
				var stores = {};
				for(var x in this.mapResults){
					var st = this.multiStore[x].get();
					stores [ this.multiStore[x].getTitle() ] = st;
				}
				return stores;
			} else {
				return this.store.get();
			}
		},

		setHistory		: function( data ){
			this.clearHistory();
			
			if( this.multiStore ){
				
			} else {
				this.store.add( data );
			}
		},

		clearHistory	: function(){
			this.store  = new _.Class.Store;
			if( this.opts.mapResults ){
				this.createMultiStore();
			}
		},
		
		remoteSearch	: function(){

			// Remove an existing search //
			if( this.currentSearch ){
				this.clearSearch( this.currentSearch );
			}
			
			this.currentSearch = new Date().getTime();
			
			this.searches[ this.currentSearch ] = true;
			
			( function( search ){
				var inst = this;

				if( typeof(this.opts.src) == 'function' ){
					this.opts.src( this.lastKeyword, function( data ){
						inst.hideState('searching');
						inst.addSearchResults( data, search );
					});
					return;
				} else {
					if( typeof(this.opts.src) == 'object' ){
						inst.hideState('searching');
						return;
					}
				}
				
				$.ajax({
					url		: this.opts.src,
					type	: 'POST',
					data	: {
						keyword : this.lastKeyword
					},
					dataType	: 'json',
					success	: function( data ){
						inst.hideState('searching');
						inst.addSearchResults( data, search );
					}
				});

			}).call( this, this.currentSearch );

		},
		
		addSearchResults	: function( results, search ){

			if( ! this.searches[ search] ){
				return;
			}

			if( this.mapResults ){
				var obj = {},
					num = 0;
				for(var x in this.mapResults){
					var st 			= this.multiStore[x];
					if( results[x] ){
						var resultSet 	= this.searchStore( st.add( results[x] ) );
						if( this.view.appendResultSet( st, resultSet, num )){
							num++;
						}
						
					}
				}
				return;
			}
			
			var results = this.searchStore( this.store.add( results ));
			this.view.appendResults( results );

			if( results.length > 0 ){
				this.callEvent('results', _.args(['async', results]));
			} else {
				this.callEvent('noResults', _.args(['async']));
			}
			
		},

		clearSearch			: function( search ){
			this.searches[ search ] = null;
		},
		
		clearSearches			: function( search ){
			this.searches = {};
			if( this.searchTimeout ){
				window.clearTimeout( this.searchTimeout );
			}
		},
		
		searchActive		: function( search ){
			return this.searches[search];
		},

		searchStore			: function( st ){
			return st.search(
				this.lastKeyword,
				this.mapSrc,
				this.opts.minResults
			);
		},

		createMultiStore	: function(){
			this.mapResults = this.opts.mapResults;
			this.multiStore = {};
			for( var x in this.mapResults ){
				this.multiStore[x] = new _.Class.Store;
				this.multiStore[x].setTitle( this.mapResults[x] );
			}
		},

		appendResults		: function( store ){
			this.view.appendResults( store );
		},

		renderResults		: function( store ){
			this.view.clearResults();
			if( !(store instanceof _.Class.Store) && store.length > 0 ){
				this.renderSets( store );
				return;
			}
			if( store.length > 0 ){
				this.view.appendResults( store );
			}
		},

		renderSets			: function( sets ){

			var obj = {},
				num = 0;

			for( var x in sets ){
				var st 			= sets[x].store;
				var resultSet 	= sets[x].resultSet;
				this.view.appendResultSet( st, resultSet, num );
				num++;
			}
		},
		
		nav	: {

			// End //
			35 : function(){},
			
			// Home //
			36 : function(){},

			// Left //
			37 : function(){},
			
			// Up //
			38 : function( e ){
				if( this._.NavList.active ){
					e.preventDefault();
					this._.NavList.navigateUp();
				}
			},
			
			// Right //
			39 : function(){},
			
			// Down //
			40 : function( e ){
				if( this._.NavList.active ){
					e.preventDefault();
					this._.NavList.navigateDown();
				}
			},
			
			13	: function(){},

			9 	: function(){
				this._.NavList.clear();
			},
			
			// esc //
			27	: function(){
				this._.NavList.clear();
			}
			
		},
		
		defaults	: function(){

			return {
				minResults	: 30,
				maxResults	: 30,
				src			: function( val, fn ){ fn( {} )},
				searchToken	: Math.random(),
				searchTimeout : 500,
				plugins	: {
					NavList		: true
				},
				templates 	: {
					state 	: {
						'start' 				: 'Type to start searching...',
						'startMention' 			: 'Select an item to mention...',
						'searching' 			: 'Searching...',
						'tokenizer_delete'		: 'Press Backspace or Delete to remove',
						'token_limit_reached'	: 'Selection limit reached. Delete items to continue.'
					},
					result	: '{value}',
					category : '{value}'
				}
			};
		},

		pluginDefaults : function(  ){
			return {
				NavList		: {
					renderTo	: this.view.el
				},
				Mentioner 	: {
					mChar 	: '@',
					limit 	: -1
				}
				
			};
		},

		searches	: {},

		mentions 	: {},

		plugins		: {
			NavList 		: function(){ return _.Class.NavList },
			Mentioner 	: function(){ return _.Class.Mentioner }
		},
		
		listeners	: {
			listItemSelect : function( autocomplete, jquery, item, navlist ){
				var data = item.store.get();
				return [ data[0] ];
			},
			results : function( type, store, autocomplete ){
				return [ type, store.get() ];
			},
			noResults : function( type ){
				return [ type ];
			}
		},

		methods 		: function(){
			return $.extend( true, {}, this._super(), {
				getHistory		: function(){
					return [ this.getHistory() ];
				},
				setHistory		: function( data ){
					this.setHistory( data );
					return [  ];
				},
				clearHistory 	: function(){
					this.clearHistory();
					return [ ];
				}
			})
		}

	});

	_.Class.Mentioner 	= _.Class.Base.extend({

		construct 		: function(){
			this.input 	= this._parent.view.els.input;
		},

		findMention 	: function(){
			this.value 	= this.input.val();
			
			var mchar 	= this.opts.mChar;
			var reg 	= new RegExp( mchar, 'gi' );
			var match 	= new RegExp(mchar + '[a-zA-Z0-9 ]+', 'gi');
			var lastMatch, lastIndex, hasMention;
			
			var charCount = this.value.match( new RegExp( mchar, 'gi') ); 
			if( charCount ){
				charCount = charCount.length;
			} else {
				charCount = 0;
			}
			if( charCount == this.getMentionData(this.value).length ){
				return false;
			} else {
				if( charCount > 0 ){
					this.value = this.value.substr( this.value.lastIndexOf( mchar ));
				}	
			}
			
			while( reg.test(this.value) == true ){
				hasMention = true;
				match.lastIndex = reg.lastIndex;
				var thisMatch 	= this.value.match(match);
				if( thisMatch ){
					lastMatch = this.value.match(match)[0];
				}
			}
			
			if( ! lastMatch && hasMention ){
				lastMatch 	= this.opts.mChar;
			}
			
			this.lastMention 		= lastMatch;
			
			return lastMatch;
		},

		replaceMention	: function(){
			var reg = new RegExp( this.lastMention.substr(1), 'i' );
			return reg;
		},

		existMention	: function( str ){
			var str = _.cleanRegex(this.opts.mChar + str);
			var reg = new RegExp( str );
			return reg;
		},

		applyMentions 	: function( val, text, data ){
			var existReg 	= this.existMention(text);
			if( !existReg.test(val) ){
				var split 	= val.split( this.opts.mChar );
				var last 	= split[split.length-1];
				var reg 	= this.replaceMention();
				var newVal;

				split[split.length-1] = last.replace( reg, text );
				newVal 		= split.join( this.opts.mChar );
				this.mentions[text] = data;
				this.callEvent('addMention', _.args([data]) );
				return newVal;
			}

			return val;
		},

		getMentionData	: function( val ){
			var data 	= [];
			for(var x in this.mentions ){
				var reg = this.existMention( x );
				if( reg.test(val)){
					data.push( this.mentions[x] );
				}
			}

			return data;
		},

		events			: function(){
			this.register.event('addMention');
		},

		on				: {
			addMention	: function(){ }
		},

		mentions 		: {},

		methods 		: function(){
			return $.extend(true, {}, this._super(), {
				getMentions 	: function(){
					return this.getMentionData( this.input.val() );
				}
				// setMentions 	: function( arr ){}
			})
		},

		listeners		: {
			addMention	: function( data ){
				return [data];
			}
		}

	});


})( PureUI, jQuery );