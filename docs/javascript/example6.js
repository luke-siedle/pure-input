$( function(){
	
	$('input.__example6').Pure( 'Input', {
		hint	: 'Type #man to find a superhero...',
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
				},
				plugins		: {
					Mentioner : {
						on : {
							addMention : function( data ){
								alert( 'You mentioned ' + data.name );
							}
						},
						mChar : '#'
					}
				}
			}
		},
		
		on	: {
			change : function(){
				console.log( mentioner.getMentions() );
			}
		}
	});
	
	var mentioner	= $('input.__example6').Pure('Input:Autocomplete:Mentioner');
});