$( function(){
	
	$( 'input.__example2').Pure('Input', {
		hint		: 'Search for "Batman"',
		height 		: 20,
		autogrow 	: true,
		maxHeight 	: 100
	});

	var src = [
		{ id : 1, name	: 'Batman Returns (1992)'},
		{ id : 2, name	: 'Batman Forever (1995)'},
		{ id : 3, name	: 'Batman and Robin (1997)'},
		{ id : 4, name	: 'Batman Begins (2005)' }
		
	], opts = {
		src			: src,
		mapSrc		: function( i ){
			return {
				id		: i.id,
				value	: i.name
			};
		},
		on : {
			listItemSelect : function( listItem ){
				alert( 'You chose ' + listItem.name );
			}
		}
	};
	
	$( 'input.__example2').Pure('Input:Autocomplete', opts );
	
	var auto = $( 'input.__example2').Pure('Input:Autocomplete');
	
	$('button.__example2.disable').click( function(){
		auto.destroy();
	});
	
	$('button.__example2.enable').click( function(){
		$( 'input.__example2').Pure('Input:Autocomplete', opts );
		auto = $( 'input.__example2').Pure('Input:Autocomplete');
	});
	
});