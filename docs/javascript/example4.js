$( function(){
	
	$('input.__example4').Pure( 'Input', {
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
			}
		}
	});
	
});