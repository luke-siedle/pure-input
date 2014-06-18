$( function(){
	
	$('input.__example5').Pure( 'Input', {
		hint	: 'Search for "man" or "the"...',
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
			
			Tokenizer	: {
				limit	: 5,
				on		: {
					addToken	: function( data, token ){
						
						for( var x in tokens ){
							if( isEqual( tokens[x].data(), token.data() ) ){
								token.remove();
								break;
							}
						}
						
						tokens = this.getTokens();
						
						// Simple object comparison //
						function isEqual( obj1, obj2 ){
							for(var x in obj1 ){
								if( typeof(obj1[x]) == 'object' ){
									if( ! isEqual( obj1[x], obj2[x] ) ){
										return false;
									}
								}
								if( obj2[x] !== obj1[x] ){
									return false;
								}
							}
							return true;
						}
					},
					removeToken		: function(){
						tokens = this.getTokens();
					}
				}
			}
		}
	});
	
	var tokenizer	= $('input.__example5').Pure('Input:Tokenizer');
	
	tokenizer.setTokens([{
		name	: 'Ironman',
		id		: 1
	}]);
	
	var tokens = tokenizer.getTokens();
	
	$('button.__example5').click( function(){
		tokenizer.options({limit : 1});
		$( this ).attr('disabled', true );
	});
	
});