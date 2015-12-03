page.runScript(function(){
	$('.tool a.font-larger').tap(function(){
		$('.article').css({'font-size':'14px;'});
	});
	$('.tool a.font-smaller').tap(function(){
		$('.article').css({'font-size':'12px;'});
	});
});