$( function(){
	
	// Fixed scrolling //
	
	$( window ).scroll( function(){
		var scrollTop	= $( window ).scrollTop(),
			noScroll	= $( window ).height() > $('div.right-wrapper').height();
			
		if( ! noScroll ){
			$('div.right-wrapper .feature-block').css({
				height : $( window ).height() - 100,
				overflow:'auto'
			})
		}
		
		if( scrollTop >= 85 ){
			$('div.right-wrapper').css({
				position : 'fixed',
				top		: 0,
				right	: 0
			});
		} else {
			$('div.right-wrapper').css({
				position : 'static'
			});
		}
	});

	// Padding for scroll //

	$('div.right-wrapper').find('a').click( function( e ){
		setTimeout( function(){
			var scrollTop = $( window ).scrollTop();
			$( window ).scrollTop(scrollTop-10);
		}, 1 );
	});

	var shown = [];
	$('div.right-wrapper').find('li.group').each( function(){
		var $prev = $(this).prev(),
			$each = $(this);
			$each.hide();
		$prev.find('a').click( function(){
			var $nextChild = $(this).parent().next('li.group'),
				isChild		= $nextChild.parents('li.group').first().length > 0 ;
			
			if( $nextChild.length > 0 && isChild ){
				$nextChild.show();
				shown.push( $nextChild );
				return;
			}
			
			for( var x in shown ){
				$( shown[x] ).hide();
			}
			$each.show();
			shown = [];
			shown.push( $each );
		});
	});

	$('.__pluginOptions').each( function(){
		var $each	= $( this ),
			$trs	= $each.find('tr');
			var x = 0;
		$trs.each( function( i ){
			var $tr = $( this );
			if( i == 0 ){
				$tr.addClass('description bold');
				return true;
			}
			if( (x % 2) != 0 ){
				$tr.addClass('description');
			} else {
				$tr.find('td').first().css('color', 'blue');
				$( $tr.find('td')[1] ).css('color', 'grey');
				var def = $tr.find('td').last().text();
				if( parseInt(def) > 0 ){
					$tr.find('td').last().css('color', 'red')
				} else 
				if( def == 'true' || def == 'false' ){
					$tr.find('td').last().css({
						color : '#069',
						fontWeight : 'bold'
					})
				} else
				if( def.length > 0 ){
					$tr.find('td').last
				}
			}
			x++;
		});
	});
	
});