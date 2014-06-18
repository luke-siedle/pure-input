/* 
 *	@file
 *	pure-validator.js
 * 
 *	@version
 *	1.0.0 - May 2012
 *
 *	@author
 *	Luke Siedle / Lonely Fugitive
 *	http://lukesiedle.me
 *
 *	@description
 *	Validator allows you to 
 *	validate an element's value
 *	according to a user-defined
 *	set of rules
 */

( function( _ , $ ){

	_.Class.Validator	= _.Class.Base.extend({

		construct 		: function(){
		},

		view 			: _.Class.Base.View.extend({

			createElements 	: function(){
				return { 
					el 		: this._parent.view.els.input,
					wrapper : this._parent.view.els.mainWrapper		
				};
			}
		}),

		events 			: function(){
			this.register.event( this.view.el, 'keydown');
			this.register.event( this.view.el, 'blur');
			this.register.event('validate');
			this.register.event('clear');
		},

		on 				: {
			keydown 	: function(){

				if( $.inArray( 'keypress', this.opts.events ) == -1 ){
					return;
				}
				
				this.callEvent('clear');

				if( this.timerecord ){
					clearTimeout( this.timerecord );
				}

				 this.timerecord = this.timeout( function(){
					this.setValueAssets();
					this.doValidate();
				}, this.opts.delay || 1 );
			},

			validate 	: function( isValid, msg ){
				var cls = isValid ? 'valid' : 'invalid';
				this.view.els.wrapper.addClass( cls );
				if( isValid ){
					this.view.els.wrapper.removeClass( 'invalid' );
				}
			},

			clear 		: function( e ){
				this.view.els.wrapper.removeClass( 'valid invalid' );
			},

			blur 		: function(){

				if( $.inArray( 'blur', this.opts.events ) == -1 ){
					return;
				}

				this.setValueAssets();
				this.doValidate();

			}
		},

		setValueAssets 	: function(){

			this.value = this._parent.getValue();
			if( this._parent._.Tokenizer ){
				this.tokens = this._parent._.Tokenizer.getPublicInterface().getTokens();
			}
		},

		/*
		*	@ validate
		*	Validate the value according to 
		* 	options passed by the constructor
		*/


		doValidate		: function(){
			var opts 	= this.opts, valid = true, msg;
			if( this.value == '' && ( ! this.tokens || this.tokens.length == 0 ) ){
				this.callEvent('clear');
				return false;
			}
			if( opts.filters ){
				for(var x in opts.filters ){
					var method = opts.filters[x],
						result = method( this.value, this.tokens );
					if( result == false || result.valid == false ){
						valid 	= false;
						msg 	= result.error || 'Invalid';
						break;
					} 
				}
			}
			this.valid = valid;
			
			this.callEvent( 'validate', _.args([valid, msg]) );
			
			return {
				valid	: valid,
				error	: msg
			};
		},

		defaults 		: function(){
			return {
				events 	: [ 'keypress', 'blur' ]
			};
		},

		methods 	: function(){
			return $.extend({}, this._super(), {
				validate 	: function(){
					return this.doValidate();
				}
			});
		},
		
		listeners		: {
			validate	: function( valid, msg, validator ){
				return [valid, msg];
			},
			clear		: function(){
				return [];
			}
		}
	});

})( PureUI, jQuery );