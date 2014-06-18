$( function(){
	
	var alerted;
	$( 'input.__example1').Pure('Input', {
		hint		: 'Describe your personality in 300 words',
		height 		: 20,
		autogrow 	: true,
		maxHeight 	: 100,
		on			: {
			change : function( val ){

				if( val.length > 300 && ! alerted ){
					alert('Okay, okay!');
					alerted = true;
					this.attr('disabled', true );
					selfDestruct( this );
				}

				function selfDestruct( input ){
					input.val('This input will self destruct in 3 seconds.');
					setTimeout( function(){
						input.destroy();
					}, 3000 );
				}
			}
		}
	});

	var methods = $( '.__example1').Pure('Input');

	methods.focus ( function(){
		this.setHint('The input will disable and self-destruct when you reach 300 characters.');
	});

});
