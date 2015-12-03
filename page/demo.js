//声明hashload
var page=new hashLoad({
    target:'#page'
});
//监听hash变化
$(window).on('hashChangeInfo',function(data){
    var order=parseInt(data._args[4]);
    if(order>0) $('.header a').show();
    else $('.header a').hide();
});
//执行
page.init();

$('#location-back').tap(function(){
	window.history.back();
	return false;
});

document.addEventListener('touchmove',function(event){
	event.preventDefault();
}, false);