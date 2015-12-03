page.runScript(function(){
	$('#page1,#page2,#page3').on('hashTabBeforeShow',function(){
		var id=$(this).attr('id');
	    $('.tab-menu a[href="#'+id+'"]').parent().addClass('cur').siblings().removeClass('cur');
	});
});