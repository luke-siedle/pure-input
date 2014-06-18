$( function(){
	
	var src = [
		{ id : 1, name	: 'Batman Returns (1992)'},
		{ id : 2, name	: 'Batman Forever (1995)'},
		{ id : 3, name	: 'Batman and Robin (1997)'},
		{ id : 4, name	: 'Batman Begins (2005)' }	
	], fb	= function( val, onComplete ){
		
		var callback = 'fbcallback' + new Date().getTime();
		$.getScript( 'https://graph.facebook.com/search?q='
						+ val + '&callback=' + callback + '&type=page' );
		
		window[ callback ] = function( response ){
			onComplete( response.data );
			window[ callback ] = undefined;
		}
		
	};
	
	$( 'input.__example3').Pure('Input', {
		hint		: 'Search for "Batman"',
		height 		: 20,
		autogrow 	: true,
		maxHeight 	: 100,
		plugins		: {
			Autocomplete : {
				src			: src ,
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
			}
		}
	});
	
	var input = $( 'input.__example3').Pure('Input'),
		srcUpdated;
	
	$('button.__example3').click( function(){

		if( srcUpdated ){
			return;
		}
		
		$( 'input.__example3').Pure('Input:Autocomplete', {
			src : fb
		});

		var auto = $( 'input.__example3').Pure('Input:Autocomplete');
		
		auto.clearHistory();

		input.setHint('Search for "Batman" on Facebook');

		srcUpdated = true;

	});

});