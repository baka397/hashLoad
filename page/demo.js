//声明hashload
var page=new hashLoad({
    target:'#page'
});
//监听hash变化
$(window).on('hashChangeInfo',function(event,url,tab,load_type,tab_type,order,cache){
    var order=parseInt(order);
    if(order>0) $('.header a').show();
    else $('.header a').hide();
});
//执行
page.init();

$('#location-back').tap(function(){
	window.history.back();
	return false;
});