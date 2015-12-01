/**
 * 异步加载，第一次不会执行
 */
$('#page1').on('hashTabShow',function(){
    console.log('异步加载，第二次点击page1才会显示');
});