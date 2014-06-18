/* 
 *	@file
 *	pure-input.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Input enhances an existing html
 *	input by making it growable
 *	and allowing it to bind with
 *	the Autocomplete and Tokenizer
 *	plugins.
 */

( function( _ , $ ){

	PureUI.Class.Input		= PureUI.Class.Field.extend({

		__name				: 'input',

		construct			: function(){
			
			this.store	= new PureUI.Class.Store;

			var name	= this.view.el.attr('name') || this.opts.fieldName || 'value';
			
			// Assets allow for compilation of data //
			this.register.asset( name , function(){
				return this.getValue();
			});
			
			this.register.asset('tags', function(){
				return this.store.get();
			});

			if( this._.Tokenizer ){
				// this._.tokenizer.view.el.css('line-height', this.view.el.height() + 'px' );
			}

			this.attr('readonly', this.view.el.attr('readonly') == 'readonly');

		},

		preConstruct 	: function(){
			
			this.value = this.opts.value || this.opts.el.val() || '';
			
			if( this.value != '' ){
				this.setValue( this.value, true, true );
			}
			
		},

		getValue		: function(){
			return this.value;
		},

		view			: PureUI.Class.Field.View.extend({
			
			construct		: function(){
				
				this._super();

				this.initialEl();

				this.renderElements();

				this.applyStyles();

				this.setup();

				// Set the trace input first time around //
				var i = this;

				this.elements.traceInput.width( this.model.opts.minWidth );

				setTimeout( function(){
					i.setTraceInput();
				}, 1);
				
			},

			destroy 				: function(){
				this.el.show();
			},
			
			initialEl				: function(){

				this.initial 		= {
					height 			: this.el.height(),
					width 			: this.el.width(),
					fontSize		: this.el.css('fontSize'),
					_padding 		: this.el.padding(),
					_margin 		: this.el.margin()
				};

			},

			renderElements			: function(){

				this._super();

				var elems 	= this.elements,
					body 	= $('body');

				elems.mainWrapper.append( elems.relativePoint );
				elems.inputWrapper.appendTo( elems.mainWrapper );
				elems.inputWrapper.append( elems.input );
				elems.clearInput.insertAfter( elems.input );
				elems.traceInput.appendTo( body );
				elems.traceTokens.appendTo( body );
				elems.traceTokens.css( this.getStyles('traceInput') );

				this.wrappers = elems.mainWrapper; //.add( elems.inputWrapper );

				elems.hint.appendTo( elems.relativePoint );

				

			},

			createElements			: function(){

				return $.extend({}, this._super(), {
					traceInput 			: $('<div />').text('_'),	// Copies the behaviour of the input //
					traceTokens			: $('<div />'),
					list				: $('<div />'),
					input				: this.model.opts.autogrow ? $('<textarea />') : $('<input />'),
					placeHolder			: $('<div />'),
					clearInput			: $('<div style="clear:both" />'),
					inputText			: $('<span style="float:left" class="__text" />'),
					hint				: $('<span />'),
					relativePoint		: $('<div />').css({
						height 			: 0,
						width 			: 0,
						position 		: 'relative',
						zIndex 			: 1
					})
				});
			},
			

			setTraceInput			: function( key ){
				
				var input	= this.elements.input,
					val		= input.val(),
					textVal	= this.elements.input.val().replace(/\n/g, '<br />');				

				if( val.length == 0 ){
					this.setInputPadding();
					this.toggleHint( true );
					this.els.mainWrapper.scrollTop( 0 );
					if( this.model._.Tokenizer ){
						if( this.model._.Tokenizer.tokens.length == 0 ){
							this.elements.traceInput.width( this.model.opts.minWidth );
						} else {
							this.toggleHint( false );
						}
					}
				} else {
					this.toggleHint( false );
					this.els.traceInput.css('width', 'auto');
				}

				if( !this.model.opts.autogrow ){
					input.width( this.model.opts.maxWidth );
					return;
				}
				
				this.elements.traceInput.html( textVal + '__' );

				this.setInput();
				
			},

			setInput				: function(){

					var o 			= this.model.opts;
					var el 			= this.elements;

					var maxW		= o.maxWidth,
						minW		= o.minWidth,
						maxH		= o.maxHeight,
						minH		= o.minHeight,
						
						w			= el.traceInput.outerWidth(),
						h			= el.traceInput.height(),
						
						isMinW		= w >= minW,
						isMaxW		= w <= maxW,
						isMinH		= h >= minH,
						isMaxH		= h <= maxH,

						isTokenizer	= this.model._.Tokenizer;

					// Check width //
					if( isMinW && isMaxW ){
						el.input.width( w );
						el.inputWrapper.width( maxW );
					}

					// Check height //
					if( isMinH && isMaxH ){
						el.input.height( h );
						el.mainWrapper.height( h );
						this.toggleScroller( false );
					}
					
					if( ! isMinW ){
						el.input.width( minW );
						el.inputWrapper.width( minW );
					}

					if( ! isMaxW ) {
						el.input.width( maxW );
						el.mainWrapper.width( maxW );
					}

					if( ! isMinH ){
						el.input.height( 
							minH );
						el.mainWrapper.css('height', minH );
						el.inputWrapper.css('height', minH );
						this.toggleScroller( false );
					}

					if( ! isMaxH ){
						el.input.height( h );
						el.mainWrapper.height( maxH );
						this.toggleScroller( true );
					}

					if( isTokenizer ){
						el.inputWrapper.width( maxW );
							
						var tokenizer 	= this.model._.Tokenizer,
							items 		= tokenizer.tokens;
						
						// With no items restore the float wrapper to default //
						if( items.length == 0 ){
							tokenizer.view.els.inputFloatWrapper.height( o.height );
							el.mainWrapper.css('height', this.el.height());
						}

						// Compute the number of items per line, and the number on the final line //
						if( items.length > 0 ){

							var itemsWidth 		= 0,
								lineNum			= 1,
								thisMaxW		= maxW - el.input.width(),
								eachHeight		= items[0].view.els.content.outerHeight(),
								resultHeight	= 0,
								itemsHeight		= eachHeight,
								exampleToken	= items[0];

							$.each( items, function( i, e ){
								itemsWidth += e.view.width;
								if( itemsWidth > thisMaxW ){
									itemsWidth = itemsWidth - thisMaxW;
									lineNum++;
								};
							});
							
							if( w < maxW ){
								this.els.input.width( w );
								var multiLine = false;
							} else {
								this.els.input.width( maxW );
								var multiLine = true;
							}

							if( this.els.input.width() > maxW - itemsWidth ){
								multiLine=true;
							}

							var trcHeight	= this.els.traceTokens.height(),
								isGreater	= trcHeight < (this.model.opts.height)*2;

							if( isGreater ){
								resultHeight = 20;
							} else {
								resultHeight = this.els.traceTokens.height();
							}

							if( resultHeight > maxH ){
								this.wrappers.height( maxH );
								this.toggleScroller( true );
								
							} else {

								if( resultHeight < minH ){
									resultHeight = minH;
								}

								this.wrappers.height( resultHeight );
								this.toggleScroller( false );

							}

							var totalHeight = this.els.traceTokens.height();

							if( multiLine ){
								totalHeight += this.els.input.height();
							}

							if( totalHeight < minH ){
								totalHeight = minH;
							}

							if( this.els.input.parent().next().next('.__token').length == 0 ){
								if( this.scrolling ){
									this.els.mainWrapper.scrollTop( totalHeight );
								}
							} else if( this.els.input.parent().prev('.__token').length == 0 ) {
								if( this.scrolling ){
									this.els.mainWrapper.scrollTop( 0 );
								}
							}

							var margin 	=  exampleToken.view.el.margin();
							var border 	=  exampleToken.view.el.border();
							var floater =  tokenizer.view.els.inputFloatWrapper;

							floater.height( eachHeight 
								+ margin.top 
								+ margin.bottom 
								+ border.top 
								+ border.bottom 
							);

							floater.width( w );
						}

					}
				
				

			},

			toggleScroller 		: function( scroll ){

				var el 			= this.elements,
					maxW 		= this.model.opts.maxWidth,
					isTokenizer = this.model._.Tokenizer,
					traceInput	= el.traceInput;

				if( scroll ){

					var css 	= {
						cursor : 'default',
						overflowY : 'scroll',
						overflowX : 'hidden'
					};
					
					el.traceTokens.width( maxW - 20 );
					el.inputWrapper.width( maxW - 20 );
					
					if( !isTokenizer ){
						el.input.width( maxW - 20 );
					}

				} else {

					var css 	= {
						cursor 		: 'text',
						overflowY 	: 'hidden',
						overflowX 	: 'hidden'
					};

					el.traceInput.css( 'width', 'auto' );
					el.traceTokens.width( maxW );
					
				}

				el.mainWrapper.css( css );

				this.scrolling = scroll;

			},

			setup				: function(){

				this.els.traceInput.addClass( this.model.opts.classNames );
				this.els.mainWrapper.addClass( this.model.opts.classNames );
				
				// this.els.input.css('height', height-pad);
				this.setInputPadding();

				if( this.model.opts.hint ){
					this.setHint();
				}

			},

			setHint				: function(){
				this.els.hint.css('line-height', this.initial.fontSize + 'px' );
				this.els.hint.width( this.model.opts.maxWidth );
				this.els.hint.html(  this.model.opts.hint );
			},

			setInputPadding 	: function(){
				var el 			= this.els;
				var fntSize = _.pxToInt( el.input.css('fontSize') ),
					height 	= this.model.opts.height,
					pad 	= Math.floor((height % fntSize)/3);
				
				el.input.css('padding', 0);
				el.input.css('paddingTop', pad );
				
				
			},

			styles			: {
				input		: {
					border		: 'none',
					padding		: 0,
					"float"		: 'left',
					outline		: 'none',
					resize		: 'none',
					overflow	: 'hidden',
					margin		: 0,
					fontSize	: function( e ){
						return e.css('fontSize');
					},
					lineHeight	: function( e ) {
						return 'normal'; e.css('height');
					}
				},
				traceInput		: {
					position	: 'absolute',
					top			: -1000,
					left		: -1000,
					maxWidth	: function( e, v ){
						return v.model.opts.maxWidth;
					},
					zIndex		: 1,
					background	: '#fff',
					height		: 'auto'
				},

				inputWrapper	: {
					width		: function( e, v ){
						return v.model.opts.minWidth;
					}
				},
				mainWrapper		: {
					height		: function( e, v ){
						return v.el.height();
					},
					width		: function( e, v ){
						return v.model.opts.maxWidth;
					},
					cursor		: 'text'
				},

				hint			: {
					position	: 'absolute',
					top 		: 0,
					left 		: 0,
					color 		: '#999',
					lineHeight 	: function(){
						return this.model.opts.height + 'px';
					}
				},

				superWrapper 	: {
					position 	: function( e, v ){
						return v.el.css('position');
					},
					left 		: function( e, v ){
						return v.el.css('left');
					},
					right 		: function( e, v ){
						return v.el.css('right');
					},
					top 		: function( e, v ){
						return v.el.css('top');
					},
					bottom 		: function( e, v ){
						return v.el.css('bottom');
					}
				}
			},

			toggleHint			: function( show ){
				show	? 	this.els.hint.show()
						: 	this.els.hint.hide();
			}
			
		}),
		
		events			: function(){

			this.register.event( this.view.elements.mainWrapper, 'click');
			this.register.event( this.view.elements.input, 'keyup', 'key' );
			this.register.event( this.view.elements.input, 'keydown', 'key');
			this.register.event( this.view.elements.input, 'keypress', 'key');
			this.register.event( this.view.elements.input, 'focus' );
			this.register.event( this.view.elements.input, 'blur' );
			this.register.event( this.view.elements.input, 'mousedown' );

			// Other events //
			this.register.event('change');

		},
		
		subscribe	: {
			Autocomplete	: {
				listItemSelect	: function( autocomplete, list, jquery, item ){
					
					var inst = this;
					var data = item.store.get()[0];
					var mentioner = autocomplete._.Mentioner;
					
					if( !data ){
						return;
					}
					
					// Reposition the list in case input height has been adjusted //
					autocomplete._.NavList.view.setPosition();

					if( mentioner && autocomplete.usingMention ){
						var resultVal 	= mentioner.applyMentions( this.value, data.name, data );
						this.setValue( resultVal, true );
						return;
					}

					if( this._.Tokenizer ){
						
						this.setValue( '', true );
						var tokenizer 	= this._.Tokenizer;
						var token 		= tokenizer.addToken( item.store );
						
						if( !token ){
							this._.Autocomplete.showState('token_limit_reached');
							return;
						}

						// Return true or false to refocus on input //
						if( ! tokenizer.singleSelect ){
							this.view.els.input.focus();
						} else {
							this._.Autocomplete._.NavList.clear();
							this.suspend();
						}

						if( tokenizer.tokens.length > 0 ){
							this.view.toggleHint();
						}

					} else {
						this.setValue( data.name, true );
					}
				}
			},

			Tokenizer 		: {
				addToken : function( tokenizer, token ){
					
					this.view.els.traceTokens.html( tokenizer.view.el.clone() );
					this.view.setInput();
					
					if( tokenizer.singleSelect ){
						this.view.els.mainWrapper
							.addClass(_.prefix + '-token-select');
					}
				},

				removeToken : function( tokenizer, token ){
					
					if( token.finder ){
						token.finder.remove();
					}
					
					this.view.els.traceTokens.html( tokenizer.view.el.clone() );
					this.view.setInput();
					
					if( tokenizer.singleSelect ){
						this.suspend( true );
						this.view.els.mainWrapper
							.removeClass(_.prefix + '-token-select');
						this.view.toggleHint( true );
					}
					
					if( tokenizer.tokens.length == 0 ){
						this.view.toggleHint( true );
					}
					
				}
			}
		},

		on : {
			click	: function( e ){
				
				if( this._.Tokenizer ){
					if( $(e.target).hasClass('__finder') || $(e.target).is( this.view.els.input ) ){
						this.view.elements.input.focus();
						return;
					} else{
						if( this._.Tokenizer.tokens.length > 0 ){
							this._.Tokenizer.inputToEnd();
						}
						this.view.elements.input.focus();
						this.view.els.input.val('').val( this.value );
						return;
					}
				}
				this.view.elements.input.focus();
			},
			key		: function( e ){
				
				var keyCode	= e.which,
					i		= this,
					o 		= this.opts;
				
				if( e.type == 'keypress' ){
					if( keyCode == 13 ){
						e.preventDefault( );
						return;
					}
				}

				if( e.type == 'keydown'){

					if( keyCode == 40 ){
						return true;
					}
					
					if( this.attr('readonly') && (!_.isNav(e.which) || e.which == 8 )){
						e.preventDefault();
						return false;
					}

					if( this.opts.maxLength && !_.isNav(e.which) && e.which != 8 ){
						var val = this.view.els.input.val();
						if( val.length+1 > this.opts.maxLength ){
							e.preventDefault();
							this.timeout( function(){
								this.setValue();
							}, 1 );
							return false;
						}
					}
						
					setTimeout( function(){
						i.setValue();
						i.view.setTraceInput( keyCode );
					}, 1 );
				}
				
				// return true;
				
			},

			focus 	: function( e ){

				this.view.els.hint.addClass('active');
				if( ! this.focused && this.value ){
					this.timeout( function(){
						this.view.els.input.val('').val( this.getValue());
					}, 1);
					return true;
				}
				
				this.focused 	= true;

			},

			blur 	: function( e ){
				this.view.els.hint.removeClass('active');
				if( this._.Tokenizer ){
					var t = this._.Tokenizer;
					t.inputToEnd();
					t.unselectToken();
					t.toggleInput();
				}
				this.focused 	= false;
			},

			mousedown 			: function( e ){
				this.focused 	= true;
			},

			change				: function(){}
		},

		setValue 			: function( val, onInput, silent ){
			
			if( !val && val != '' ){
				var val = this.view.els.input.val();
			}

			if( this.opts.maxLength ){
				if( val.length > this.opts.maxLength ){
					this.value = val.substr(0, this.opts.maxLength );
					this.view.els.input.val( this.value );
					return false;
				}
			}

			var lastVal = this.value;

			this.value = val;

			if( onInput ){
				this.view.els.input.val( val );
				this.view.setTraceInput();
			}

			if( val != lastVal && ! silent ){
				this.callEvent('change');
			}

			// this.view.els.input.setCaret( this.value.length-1 );
		},

		setHint				: function( hint ){
			this.opts.hint = hint;
			this.view.setHint();
		},

		suspend 			: function( enable ){
			this.suspended = enable == undefined;
			if( !enable ){
				this.view.els.input.attr('disabled', true ).hide();
			} else {
				this.view.els.input.attr('disabled', false ).show();
			}
		},

		onChangeAttribute 	: {
			disabled 		: function(){
				this.toggleState( this.attribute.disabled );
			}
		},

		toggleState 		: function( disable ){

			this.disabled 	= disable;

			if( disable ){
				this.view.els.mainWrapper
					.add(this.view.els.input)
						.addClass( _.prefix + '-disabled')
							.attr('disabled', true );

				var plugins = this.getPluginTree();

			} else {
				this.view.els.mainWrapper
					.add(this.view.els.input)
						.removeClass( _.prefix + '-disabled')
							.attr('disabled', false );
			}

			var plugins 	= this.getPluginTree();
			
			for(var x in plugins){
				plugins[x].disabled = disable;
			}

		},

		plugins		: {
			Autocomplete 	: function(){ return _.Class.Autocomplete },
			Tokenizer		: function(){ return _.Class.Tokenizer },
			Validator 		: function(){ return _.Class.Validator }
		},

		defaults	: function(){
			return $.extend( true, {}, this._super(), {
				minWidth	: 10 || this.el.outerWidth(),
				maxWidth	: this.el.width(),
				minHeight	: this.el.height(),
				maxHeight	: 5000,
				height 		: _.pxToInt( this.el.css('font-size') ) || 20,
				autogrow	: true,
				maxLength 	: this.el.attr('maxlength') || null,
				height 		: 20,
				hint		: this.el.attr('title')
			});
		},

		methods 	: function(){
			return $.extend( true, {}, this._super(), {
				val 		: function( val ){
					if( !val ){
						return this.getValue();
					} else {
						this.setValue( val, true );
						this.view.setTraceInput();
						if( val == '' ){
							this.view.toggleHint( true );
						} else {
							this.view.toggleHint();
						}
					}
				},

				focus 		: function( f ){
					if( f ){
						var inst = this.publicInterface;
						this.view.els.input.focus( function( event ){
							f.call( inst, event );
						});
					} else {
						this.view.els.input.focus();
					}
				},

				setHint		: function( hint ){
					this.setHint( hint );
				}
			});
		},
		
		listeners : {
			change : function(){
				return [ this.getValue() ];
			}
		}
	});

})( PureUI, jQuery );