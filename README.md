hashLoad
=

## 介绍
hashLoad是一个用于移动端页面异步加载的jquery插件。(1.0.4版本已去除对zepto的支持，性能对比见[http://jsperf.com/zepto-vs-jquery-2013/131](http://jsperf.com/zepto-vs-jquery-2013/131))
通过使用location.hash实现页面内部的切换、页面的回退和前进操作。

## 手机访问
扫码  
![](./example/qrcode.png)  
[http://baka397.github.io/hashLoad/](http://baka397.github.io/hashLoad/)  

## 引入
```
<!-- hashLoad 样式 -->
<link href="./src/css/hash_load.css" rel="stylesheet">
<!-- jquery && finger,没有touch时将监听click事件 -->
<script type="text/javascript" src="/hashLoad/src/js/jquery-2.1.4.min.js"></script>
<script type="text/javascript" src="/hashLoad/src/js/jquery.finger.min.js"></script>
<!-- hashLoad 插件程序 -->
<script type="text/javascript" src="./src/js/hash_load.js"></script>
```

## 执行
```
var page=new hashLoad({
    target:'#page'
});
page.init();
```

## 配置
```
load:'switch',//默认加载类型
tab:'switch',//默认tab切换类型
target:null,//默认加载页面的dom对象
cache:false//页面缓存
```

## 页面切换
页面切换可以采用两种方式（load或tab），load将ajax异步加载页面，tab将载入页面中的已有页面

### load载入
```
<!-- 目标文件声明内容 -->
<div class="hash-page" data-role="page">
	<!-- 写入html、js、css内容 -->
</div>
```
```
<!-- 使用href地址跳转 -->
<a href="./page/page_tab.html?page=1">跳转至page_tab.html</a>
<a href="./page/page_tab.html?page=1#page1">跳转至page_tab.html并默认展开ID为page1的tab</a>
<!-- 关闭ajax加载 -->
<a href="http://www.google.com" data-ajax="false">跳转至google</a>
<!-- 默认不会被执行的链接 -->
<a href="javascript:alert(1);">javascript方法</a>
<a href="#">无意义占位符</a>
<a href="">空链接</a>
```
通过在a标签添加`data-hash-load`属性定义load的加载方法名（默认为配置项）。添加`data-hash-cache`(true/false，默认为false)开启缓存。

### tab切换
```
<!-- 声明tab集合 -->
<div data-role="tab-group">
    <div id="page1" class="hash-tab" data-role="tab">
        <p>页面1</p>
    </div>
    <div id="page2" class="hash-tab" data-role="tab">
        <p>页面2</p>
        <p>数据内容</p>
        <p>数据内容</p>
        <p>数据内容</p>
    </div>
    <div id="page3" class="hash-tab" data-role="tab">
        页面3
    </div>
</div>
<!-- 使用href 跳转 -->
<a href="#page1">展开ID为page1的tab</a>
```
通过在a标签添加`data-hash-tab`属性定义tab的切换方法名。


## 页面切换扩展
页面的切换方式可以通过`updateFunc(类型,扩展对象)`方法更新或扩展。

### load扩展
```
/**
 * @param  {string}   url      加载地址
 * @param  {object}   target   加载目标
 * @param  {string}   action   forward/back，该动作是前进还是后退
 * @param  {Function} callback 回调函数列表，执行对应的回调操作
 */
page.updateFunc('load',{
	'page':function(url,target,action,callback){
		$('#hash-loading').show();
		var self=this;
		$.get(url,function(data){
			//数据加载完成
			callback['hashPageLoaded'].call();
			if($(target).find('.hash-page')===0) $(target).html('<div class="hash-page" data-role="page"></div>');
			$(target).find('.hash-page').html(data);
			//数据渲染完成
			callback['hashPageCreated'].call();
			$('#hashload-loading').hide();
			//数据展示完成
			callback['hashPageShow'].call();
		});
	}
});
```
注：如果是动画效果，需要采用定时器时，可以调用this._timer._load_timer方法赋值，当定时器完成后，应重置为null，可参考_load_func->switch方法

### tab扩展
```
/**
 * @param  {string}   target   目标ID
 * @param  {Function} callback 回调函数
 */
page.updateFunc('tab',{
	'display':function(target,callback){
		//tab展示前
		callback['hashTabBeforeShow'].call();
		$(target).siblings('[data-role="page"]').removeClass('cur');
		$(target).addClass('cur');
		//tab展示完成
		callback['hashTabShow'].call();
	}
});
```
注：如果是动画效果，需要采用定时器时，可以调用this._timer._tab_timer方法赋值，当定时器完成后，应重置为null，可参考_tab_func->switch方法

## js执行页面跳转
```
/**
 * @param  {string} url       链接地址
 * @param  {string} load_type load执行函数
 * @param  {string} tab_type  tab执行函数
 * @param  {string} cache     是否启用缓存,true/false
 */
page.location('index.html');
```

## 监听回调事件
可以通过$(目标DOM).on('事件名',function(){})监听事件
### load事件监听
`pageBeforeLoaded` load前  
`hashPageLoaded` load完成后  
`hashPageCreated` 页面创建后  
`hashPageShow` 页面展示后  

```
$('#page').on('hashPageLoaded',function(){
    console.log('执行load函数');
});
```

### tab事件监听
`hashTabBeforeShow` tab显示前  
`hashTabShow` tab显示后  

```
$('#page1').on('hashTabShow',function(){
    console.log('tab显示后');
});
```

### window事件监听
`hashChangeInfo` hash变更
```
$(window).on('hashChangeInfo',function(event,url,tab,load_type,tab_type,order,cache){
    console.log(url);
});
```
## javascript引入

### 文件加载
```
<!-- 在<div class="hash-page" data-role="page"></div>之间引入js/css文件 -->
<script type="text/javascript" src="./page/page_test.js"></script>
```

### 作用域
为防止全局变量污染，请使用以下代码声明页面内部的js代码
```
page.runScript(function(){
	//在这里写入js代码
});
```

当当前页面卸载时，可以使用以下代码执行卸载前操作
```
page.unScript(function(){
	//在这里写入js代码
});
```