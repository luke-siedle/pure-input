/* 
 *	@file
 *	pure-tokenizer.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Tokenizer is a plugin for an Input
 *	object, allowing the placement
 *	of tokens within the input. Input allows
 *	for the interfacing of Autocomplete
 *	with Tokenizer.
 */

( function( _ , $ ){
	
	_.Class.Tokenizer	= _.Class.Base.extend({

		__name	: 'tokenizer',

		init	: function( opts ){
			this._super( opts );
			this.tokens = [];
			this.singleSelect = this.opts.limit == 1;
		},

		view	: _.Class.Base.View.extend({

			construct		: function(){
				var parent = this.model._parent;
				if( parent ){
					var input = parent.view.els.input;
					this.el.insertBefore( input );
					this.els.inputFloatWrapper.appendTo( this.el );
					input.appendTo( this.els.inputFloatWrapper );
					this.placeHolder = this.els.inputFloatWrapper;
				}

			},

			// On destruction, ensure the input is returned to its origin //
			destroy			: function(){
				var parent = this.model._parent;
				parent.view.els.input.insertBefore( parent.view.els.clearInput );
			},

			createElements : function(){
				return {
					el 		: $('<div />').css({
						"float"	: 'left'
					}),
					inputFloatWrapper : $('<div />').css({
						"float" 	: 'left'
					})
				};
			}

		}),

		addToken			: function( store ){

			if( this.opts.limit ){
				if( this.tokens.length >= this.opts.limit ){
					return false;
				}
			}

			var token = new _.Class.Tokenizer.Token({
				store 		: store,
				tokenizer 	: this
			});

			this.tokens.push( token );
			
			this.singleSelect = this.opts.limit == 1;
			
			if( this._parent._.Validator ){
				this._parent._.Validator.setValueAssets();
			}
			
			this.callEvent('addToken', _.args([token]));
			
			if( this.singleSelect ){
				this.doSingleSelect( token );
			}

			return token;

		},

		clearTokens			: function(){
			for(var x in this.tokens){
				this.removeToken( this.tokens[x] );
			}
		},

		removeToken			: function( token ){
			
			var tokens 		= this.tokens;
			var inst 		= this;
			this.removedToken = token;
			$.each( this.tokens, function( i , e ){
				if( token == e ){
					tokens.splice( i, 1 );
					e.view.el.remove();
					inst.lastRemoved = token;
					return false;
				}
			});

			this.tokens 	= tokens;
			
			this.callEvent('removeToken', _.args([this.lastRemoved]));

		},

		doSingleSelect 		: function( token ){
			if( token ){
				token.singleSelect();
				this._parent.suspend();
				if( this._parent._.NavList ){
					this._parent._.NavList.clear();
				}
			}
		},

		on	: {
			addToken	: function( token ){
			},
			key 	 	: function( e ){
				
				if( e.type == 'keyup'){
					return;
				}
				
				if( this.nav[ e.which ] ){
					if( this.singleSelect ){
						return;
					}
					this.nav[ e.which ].call ( this , e, e.type );
				}
			},

			removeToken : function( e ){
				this._parent.view.els.input.focus();
			},

			clickToken : function( e ){
				
			}
		},

		events 			: function(){
			this.register.event( this._parent.view.els.input, 'keydown', 'key' );
			this.register.event( this._parent.view.els.input, 'keyup', 'key' );
			this.register.event( 'removeToken');
			this.register.event( 'addToken');
			this.register.event( 'clickToken');
		},

		tokenFromEl 	: function( el ){
			return el.data('PureUI.Tokenizer.Token');
		},

		/*
			Left - backspace, left, home
			Right - right, end, del (selects next token, deletes)
		*/

		navigateTo 		: function( token ){
			var selected = this.selectedItem;
			if( selected ){
				this.unselectToken( selected );
			}
			this.selectToken( token );
		},

		navigateLeft 	: function( token ){

			var val 	= this._parent.getValue(),
				input 	= this._parent.view.els.input,
				left 	= input.parent().prev('.__token').first(),
				left 	= token ? token.view.el.prev('.__token').first() : left;

			if( this.tokens.length == 0 || val != '' ){
				return;
			}

			if( left.length == 0 ){
				this.unselectToken();
				this.toggleInput();
				this.timeout( function(){
					this.inputToStart();
					this.timeout( function(){
						input.focus();
					}, 10 )
				}, 10 );
				return;
			}

			var token 	= this.tokenFromEl( left );

			if( token == this.selectedItem || (token && token.attr('readonly')) ){

				if(token != this.selectedItem && this.selectedItem ){
					this.unselectToken();
					this.toggleInput();
					return;
				}

				this.unselectToken();
				this.toggleInput();

				this.timeout( function(){
					input.parent().insertBefore( left );
					this.timeout( function(){
						input.focus();
					}, 10 );
				}, 10 );

			} else {

				if( this.selectedItem || this.inputHidden ){
					this.unselectToken();
					this.toggleInput();
					return;
				}

				this.selectToken( token );
			}

		},

		navigateRight 	: function( token ){

			var val 	= this._parent.getValue(),
				input 	= this._parent.view.els.input,
				right 	= input.parent().next('.__token').first(),
				right 	= token ? token.view.el.next('.__token').first() : right;

			if( this.tokens.length == 0 || val != '' ){
				return;
			}

			if( right.length == 0 ){
				this.inputToEnd();
				this.unselectToken();
				this.toggleInput();
				this.timeout( function(){
					 input.focus();
				}, 10 );
				return;
			}
			
			var token 	= this.tokenFromEl( right );

			if( token == this.selectedItem || (token && token.attr('readonly')) ){

				if(token != this.selectedItem && this.selectedItem ){
					this.unselectToken();
					this.toggleInput();
					return;
				}

				input.parent().insertAfter( right );
				this.timeout( function(){
					 input.focus();
				}, 10 );
				this.unselectToken();
				this.toggleInput();

			} else {

				if( this.selectedItem || this.inputHidden ){
					this.unselectToken();
					this.toggleInput();
					return;
				}

				this.selectToken( token );
			}
		},

		navigateRemove	: function(){
			var token 	= this.selectedItem;
			this.unselectToken( token );
			this.toggleInput();
			this.removeToken( token );
		},

		nav				: {
			// Backspace //
			8	: function( e, type ){

				if( this.selectedItem ){
					this.navigateRemove();
					return;
				}

				this.navigateLeft();
			},

			// Left //
			37	: function( e ){
				this.navigateLeft( );
			},

			38 	: function(){
				var input = this._parent.view.els.input;
				if( input.val() == '' ){
					this.timeout(function(){
						this.inputToStart();
						this.timeout( function(){
							input.focus();
						}, 10);
					}, 10 );
				}
			},

			// Right //
			39	: function( e ){
				this.navigateRight( );
			},
			40 	: function(){
				var input = this._parent.view.els.input;
				if( input.val() == '' ){
					this.timeout(function(){
						this.inputToEnd();
						this.timeout( function(){
							input.focus();
						}, 10);
					}, 10 );
				}
			},

			// Del //
			46 	: function(){

				if( this.selectedItem ){
					this.navigateRemove();
					return;
				}

				this.navigateRight();

			},

			// Home //
			36	: function( e ){
				this.nav[38].call( this, e );
			},

			// End //
			35	: function( e ){
				this.nav[40].call( this, e );
			}
		},

		inputToStart 	: function(){
			if( this.tokens.length > 0 ){
				var input = this._parent.view.els.input;
				var first = this.view.el.children('.__token').first();
				first = first.data('PureUI.Tokenizer.Token');
				this.view.els.inputFloatWrapper.insertBefore( first.view.el );
			}
		},

		inputToEnd 	: function(){
			if( this.tokens.length > 0 ){
				var lastToken = this.view.el.children('.__token').last();
				lastToken = lastToken.data('PureUI.Tokenizer.Token');
				this.view.els.inputFloatWrapper.insertAfter( lastToken.view.el );
			}
			
		},

		selectToken	: function( token ){

			if( this.selectedItem ){
				this.selectedItem.view.el.removeClass('selected __selected');
			}

			token.view.el.addClass('selected __selected');
			this.selectedItem = token;
			this.toggleInput( 1 );

			if( this._parent._.Autocomplete ){
				var auto = this._parent._.Autocomplete;
				auto.showState ('tokenizer_delete');
			}
		},

		unselectToken	: function( token ){

			if( ! token ){
				token = this.selectedItem;
				if( ! token ){
					return;
				}
			}
			
			token.view.el.removeClass('selected __selected');
			this.selectedItem = null;

			if( this._parent._.Autocomplete ){
				var auto = this._parent._.Autocomplete;
				auto.showState ('start');
			}
		},

		toggleInput 	: function( hide ){
			
			var css;

			if( hide ){

				this.inputCss = {
					position 	: this.view.els.inputFloatWrapper.css('position'),
					width 		: this.view.els.inputFloatWrapper.width(),
					top 		: 'auto',
					left 		: 'auto'
				};

				var css 			= {
					position 	: 'absolute',
					width 		: 0,
					left 		: -1000
				};

			} else {
				css = this.inputCss;
			}
			if( css ){
				this.view.els.inputFloatWrapper.css( css );
			}

			this.inputHidden = hide;
		},

		methods : function(){
			return $.extend( true, {}, this._super(), {
				getTokens 		: function(){
					var tokens = [];
					$.each( this.tokens, function(i, e){
						tokens.push( e.getPublicInterface() );
					});
					return tokens;
				},

				setTokens		: function( arr ){
					this.clearTokens();
					for(var x in arr){
						var store = new _.Class.Store( [ arr[x] ] );
						this.addToken( store );
					}
				},
				
				clearTokens 	: function(){
					this.clearTokens();
				},
				
				getTokenData	: function(){
					var data = [];
					$.each( this.tokens, function( i, e ){
						data.push( e.store.get()[0] );
					});
					return data;
				}
				
			});
			
		},

		listeners : {
			addToken : function( token, tokenizer ){
				return [ token.store.get()[ 0 ], token.getPublicInterface() ];
			},
			removeToken : function( token, tokenizer ){
				return [ token.store.get()[ 0 ] ];
			},
			clickToken : function( e, token, tokenizer ){
				return [ token.store.get()[ 0 ], token.getPublicInterface() ];
			}
		}
	});

	_.Class.Tokenizer.Token = _.Class.Base.extend({

		__name	: 'tokenizer-token',

		construct : function(){
			this.view.el.data('PureUI.Tokenizer.Token', this );
			this.store = this.opts.store;
		},

		view	: _.Class.Base.View.extend({

			construct : function(){

				var data = this.model.opts.store.get()[ 0 ];

				this.el.append( this.els.finder.add( this.els.content ).add(this.els.deleter) );

				this.els.content.text( _.replace(this.model.opts.template, data) );

				if( this.model.opts.tokenizer.view.placeHolder ){
					this.el.insertBefore( this.model.opts.tokenizer.view.placeHolder );
				}

				this.applyStyles();

				this.setWidth();

				this.els.finder.height( this.el.height() );

			},

			createElements	: function(){
				return {
					el 		: $('<div class="__token" />'),
					finder	: $('<span class="__finder" />'),
					content	: $('<span class="__content" />'),
					deleter	: $('<span class="__deleter" />').attr('title', 'Remove'),
					clear 	: $('<span />')
				};
			},
			setWidth 	: function(){

				var clone 	= this.el.clone(),
					content = clone.find('.__content'),
					finder 	= clone.find('.__finder'),
					el 		= this.elements,
					offset	= 2;

				clone.appendTo( $('body') );
				el.content.width( content.width() + offset );
				this.el.height( content.outerHeight() );
				this.el.css('line-height', this.el.css('fontSize') + 'px');
				var width 	=  content.outerWidth() + finder.width();
				this.el.width( width + offset );
				this.width = width + offset;
				clone.remove();

			},

			styles	: {
				el 		: {
					"float" : 'left',
					position : "relative"
				},
				finder 	: {
					"float" 	: 'left',
					cursor 	: 'text',
					width 	: 5
				},
				content : {
					cursor : 'pointer',
					"float"	: "left",
					width : 'auto'
				},
				clear 	: {
					clear 	: 'left'
				},
				deleter : {
					cursor 	: 'default',
					"float"	: 'right'
				}
			}

		}),

		defaults : function(){
			return {
				template : '{name}'
			};
		},

		events				: function() {
			this.register.event( this.view.els.finder, 'click', 'finderClick' );
			this.register.event( this.view.els.deleter, 'click', 'deleterClick' );
			this.register.event( this.view.el, 'click' );
		},

		on 		: {
			finderClick 	: function(){
				this.opts.tokenizer.view.placeHolder.insertBefore( this.view.el );
			},
			deleterClick 	: function(){
				this.opts.tokenizer.removeToken( this );
				this.opts.tokenizer.doSingleSelect( false );
			},
			click			: function( e ){
				
				if( e.target == this.view.els.deleter.get(0) ){
					return;
				}
				
				if( e.target == this.view.els.finder.get(0) ){
					return;
				}
				
				this.opts.tokenizer.callEvent('clickToken', _.args( [ e,this ] ) );
			}
		},

		singleSelect 		: function(){
			this.view.el.addClass( _.prefix + '-single-select');
			var fullWidth 	= this.opts.tokenizer._parent.view.els.inputWrapper.width();
			this.opts.tokenizer.view.el.width( fullWidth );
			this.view.el.width( fullWidth );
			this.view.els.deleter.css('float', 'right');
		},
		onChangeAttribute 	: {
			readonly 		: function(){
				if( this.attribute.readonly ){
					this.view.els.deleter.hide();
				} else {
					this.view.els.deleter.show();
				}
			}
		},
		
		methods : function(){
			return $.extend( true, {}, this._super(), {
				data : function( arg ){
					if( arg ){
						this.store = new _.Class.Store( arg );
						return;
					}
					return this.store.get()[ 0 ];
				},
				remove	: function(){
					this.options.tokenizer.removeToken( this );
				}
			});
		}

	});

})( PureUI, jQuery );