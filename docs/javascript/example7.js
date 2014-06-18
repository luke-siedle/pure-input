$( function(){
	
	$('input.__example7').Pure( 'Input', {
		hint	: 'You must choose Ironman...',
		plugins		: {
			Autocomplete : {
				src		: 'docs/javascript/example4.json',
				mapSrc	: function( i ){
					return {
						id		: i.id,
						value	: i.name
					}
				},
				mapResults : {
					avengers		: "Marvel",
					justice_league	: "Justice League"
				}
			},
			Tokenizer : {
				on		: {
					addToken	: function(){
						$('input.__example7').Pure('Input:Validator').validate();
					}
				},
				limit	: 1
			},
			Validator : {
				filters : [
					function( value, tokens ){
						var valid = false;
						for( var x in tokens ){
							if( tokens[x].data().name == 'Ironman' ){
								valid = true;
								break;
							}
						}
						
						return {
							valid	: valid,
							error	: 'You did not choose Ironman.'
						}
					}
				],
				on		: {
					validate : function( valid, msg ){
						var $wrapper = $('div.pureui-8.pureui-input-mainWrapper').first();
						if( ! valid ){
							$wrapper.addClass('error');
						} else {
							$wrapper.removeClass('error');
						}
					},
					clear	: function(){
						var $wrapper = $('div.pureui-8.pureui-input-mainWrapper').first();
						$wrapper.removeClass('error');
					}
				},
				events : []
			}
		}
	});

});